import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import StarRating from '../components/StarRating';
import { Calendar, ShoppingBag, DollarSign, Bell, Heart, CheckCircle2, XCircle, Clock, Trash2, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('bookings_received'); // listings, bookings_sent, bookings_received, favorites, notifications
  const [loading, setLoading] = useState(true);
  
  // States
  const [listings, setListings] = useState([]);
  const [sentBookings, setSentBookings] = useState([]);
  const [receivedBookings, setReceivedBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [earnings, setEarnings] = useState(0);

  // Review states (to submit review inside dashboard)
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewUserId, setReviewUserId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get all approved listings (we filter user listings in PHP or JS)
      const listRes = await api.get('/listings');
      setListings(listRes.data.data.filter(l => l.user_id === user.id));

      // Get bookings
      const bookingRes = await api.get('/bookings');
      setSentBookings(bookingRes.data.sent);
      setReceivedBookings(bookingRes.data.received);

      // Get favorites
      const favRes = await api.get('/favorites');
      setFavorites(favRes.data);

      // Get notifications
      const notifRes = await api.get('/notifications');
      setNotifications(notifRes.data);

      // Calculate earnings from completed bookings
      const completed = bookingRes.data.received.filter(b => b.status === 'completed');
      const sum = completed.reduce((acc, b) => acc + parseFloat(b.listing.price), 0);
      setEarnings(sum);
    } catch (err) {
      console.error("Failed to load dashboard statistics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Update booking status (accept, reject, cancel, complete)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm("Are you sure you want to cancel this booking?")) return;
    if (newStatus === 'completed' && !window.confirm("Mark this booking as completed?")) return;

    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      // Reload bookings lists
      const bookingRes = await api.get('/bookings');
      setSentBookings(bookingRes.data.sent);
      setReceivedBookings(bookingRes.data.received);

      // Recalculate earnings
      const completed = bookingRes.data.received.filter(b => b.status === 'completed');
      const sum = completed.reduce((acc, b) => acc + parseFloat(b.listing.price), 0);
      setEarnings(sum);
    } catch (err) {
      alert("Failed to update booking status: " + (err.response?.data?.message || 'Error'));
    }
  };

  // Submit Review for completed booking
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!reviewComment.trim()) {
      setReviewError('Please fill in the comment field.');
      return;
    }

    try {
      await api.post('/reviews', {
        reviewed_user_id: reviewUserId,
        booking_id: reviewBookingId,
        rating: reviewRating,
        comment: reviewComment,
      });

      setReviewSuccess('Thank you! Review has been successfully saved.');
      setReviewComment('');
      setReviewRating(5);
      
      // Clear after 3s
      setTimeout(() => {
        setReviewBookingId(null);
        setReviewSuccess('');
      }, 3000);
      
      fetchDashboardData();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning" style={{ textTransform: 'capitalize' }}><Clock size={12} style={{ marginRight: '0.2rem' }} /> Pending</span>;
      case 'accepted':
        return <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}><CheckCircle2 size={12} style={{ marginRight: '0.2rem' }} /> Accepted</span>;
      case 'completed':
        return <span className="badge badge-success" style={{ textTransform: 'capitalize' }}><CheckCircle2 size={12} style={{ marginRight: '0.2rem' }} /> Completed</span>;
      case 'rejected':
        return <span className="badge badge-danger" style={{ textTransform: 'capitalize' }}><XCircle size={12} style={{ marginRight: '0.2rem' }} /> Rejected</span>;
      case 'cancelled':
        return <span className="badge badge-danger" style={{ textTransform: 'capitalize' }}><XCircle size={12} style={{ marginRight: '0.2rem' }} /> Cancelled</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard statistics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Welcome & Title */}
      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>
          Welcome back, {user.name}!
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your listings, track booking schedules, and review earnings.</p>
      </div>

      {/* Analytics Widgets Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        {/* Earnings Card */}
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', borderRadius: 'var(--radius-md)' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Earnings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>${earnings.toFixed(2)}</h3>
          </div>
        </div>

        {/* Active Listings Card */}
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Listings</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{listings.length} items</h3>
          </div>
        </div>

        {/* Booking Requests Received Card */}
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', borderRadius: 'var(--radius-md)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Requests Received</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {receivedBookings.filter(b => b.status === 'pending').length} pending
            </h3>
          </div>
        </div>

        {/* Notifications Count */}
        <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: 'var(--radius-md)' }}>
            <Bell size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unread Alerts</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
              {notifications.filter(n => !n.read_at).length} alerts
            </h3>
          </div>
        </div>

      </div>

      {/* Main Grid: Tabs Sidebar & Table Contents */}
      <div className="grid-cols-12" style={{ display: 'grid', alignItems: 'flex-start' }}>
        
        {/* Navigation Sidebar */}
        <div style={{ gridColumn: 'span 3' }} className="dash-sidebar">
          <div className="card glass" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <button 
              onClick={() => setActiveTab('bookings_received')}
              className={`btn ${activeTab === 'bookings_received' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Calendar size={18} /> Received Bookings ({receivedBookings.length})
            </button>
            <button 
              onClick={() => setActiveTab('bookings_sent')}
              className={`btn ${activeTab === 'bookings_sent' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Calendar size={18} /> Sent Requests ({sentBookings.length})
            </button>
            <button 
              onClick={() => setActiveTab('listings')}
              className={`btn ${activeTab === 'listings' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <ShoppingBag size={18} /> My Listings ({listings.length})
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`btn ${activeTab === 'favorites' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Heart size={18} /> Bookmarked Items ({favorites.length})
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`btn ${activeTab === 'notifications' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', textAlign: 'left' }}
            >
              <Bell size={18} /> Activity Log ({notifications.length})
            </button>
          </div>
        </div>

        {/* View content panel */}
        <div style={{ gridColumn: 'span 9' }} className="dash-content">
          
          {/* 1. Received Bookings Tab */}
          {activeTab === 'bookings_received' && (
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Booking Requests on Your Listings</h3>
              {receivedBookings.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>You haven't received any bookings yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Client</th>
                        <th style={{ padding: '0.75rem' }}>Service Listing</th>
                        <th style={{ padding: '0.75rem' }}>Preferred Date</th>
                        <th style={{ padding: '0.75rem' }}>Price</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivedBookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.buyer.name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Link to={`/listings/${b.listing_id}`} style={{ fontWeight: 600 }}>{b.listing.title}</Link>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{b.preferred_date} @ {b.preferred_time}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>${b.listing.price}</td>
                          <td style={{ padding: '0.75rem' }}>{getStatusBadge(b.status)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {b.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'accepted')} className="btn btn-success" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Accept</button>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'rejected')} className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Reject</button>
                              </div>
                            )}
                            {b.status === 'accepted' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'completed')} className="btn btn-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Mark Completed</button>
                            )}
                            {b.status !== 'pending' && b.status !== 'accepted' && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Archived</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. Sent Bookings Tab */}
          {activeTab === 'bookings_sent' && (
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Services You Have Booked</h3>
              {sentBookings.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>You haven't requested any service bookings yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem' }}>Provider</th>
                        <th style={{ padding: '0.75rem' }}>Service</th>
                        <th style={{ padding: '0.75rem' }}>Booking Schedule</th>
                        <th style={{ padding: '0.75rem' }}>Price</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentBookings.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>{b.listing.user?.name || 'Local Freelancer'}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <Link to={`/listings/${b.listing_id}`} style={{ fontWeight: 600 }}>{b.listing.title}</Link>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{b.preferred_date} @ {b.preferred_time}</td>
                          <td style={{ padding: '0.75rem', fontWeight: 700 }}>${b.listing.price}</td>
                          <td style={{ padding: '0.75rem' }}>{getStatusBadge(b.status)}</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                            {b.status === 'pending' && (
                              <button onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')} className="btn btn-danger" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>Cancel</button>
                            )}
                            {b.status === 'completed' && (
                              <button 
                                onClick={() => { setReviewBookingId(b.id); setReviewUserId(b.listing.user_id); }}
                                className="btn btn-secondary" 
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--accent-warning)', color: 'var(--accent-warning)' }}
                              >
                                Review Provider
                              </button>
                            )}
                            {b.status !== 'pending' && b.status !== 'completed' && (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Closed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. My Listings Tab */}
          {activeTab === 'listings' && (
            <div>
              {listings.length === 0 ? (
                <div className="card glass" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)' }}>You don't have any items currently listed in the marketplace.</p>
                  <Link to="/listings/new" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>Add Your First Item</Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {listings.map(l => (
                    <div key={l.id} style={{ position: 'relative' }}>
                      <ListingCard listing={l} />
                      <div style={{ position: 'absolute', bottom: '50px', right: '1.5rem', display: 'flex', gap: '0.25rem', zIndex: 12 }}>
                        <Link to={`/listings/${l.id}/edit`} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '50%' }} title="Edit"><Edit3 size={14} /></Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Favorites Tab */}
          {activeTab === 'favorites' && (
            <div>
              {favorites.length === 0 ? (
                <div className="card glass" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>You haven't bookmarked any favorite listings yet.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                  {favorites.map(l => (
                    <ListingCard 
                      key={l.id} 
                      listing={l} 
                      onFavoriteToggle={() => {
                        // Remove from favorites array locally
                        setFavorites(prev => prev.filter(f => f.id !== l.id));
                      }} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Notifications Log Tab */}
          {activeTab === 'notifications' && (
            <div className="card glass" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>Recent Notifications</h3>
              {notifications.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>No notification logs recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{
                        padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                        backgroundColor: n.read_at ? 'transparent' : 'rgba(99, 102, 241, 0.04)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <p style={{
                          fontWeight: n.read_at ? 400 : 700, color: 'var(--text-primary)', fontSize: '0.85rem'
                        }}>
                          {n.type === 'booking_request' && `New Request: ${n.data.buyer_name} booked "${n.data.listing_title}"`}
                          {n.type === 'booking_status' && `Status Update: Booking for "${n.data.listing_title}" was ${n.data.status}`}
                          {n.type === 'new_message' && `Message: ${n.data.sender_name} sent: "${n.data.message_preview}"`}
                          {n.type === 'new_review' && `Feedback: You received a ${n.data.rating} Star review from ${n.data.reviewer_name}`}
                          {n.type === 'listing_approval' && `Moderation: Listing "${n.data.listing_title}" was ${n.data.status}`}
                        </p>
                        <small style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleString()}</small>
                      </div>
                      {!n.read_at && (
                        <button 
                          onClick={async () => {
                            await api.post(`/notifications/${n.id}/read`);
                            fetchDashboardData();
                          }}
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Review Modal Form overlay */}
      {reviewBookingId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1050, padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', position: 'relative', backgroundColor: 'var(--bg-secondary)' }}>
            <button 
              onClick={() => setReviewBookingId(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <XCircle size={22} style={{ color: 'var(--text-muted)' }} />
            </button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Rate & Review Provider</h3>

            {reviewError && <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{reviewError}</p>}
            {reviewSuccess && <p style={{ color: 'var(--accent-success)', fontSize: '0.85rem', marginBottom: '1rem' }}>{reviewSuccess}</p>}

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Overall Rating</label>
                <StarRating rating={reviewRating} onRatingChange={setReviewRating} size={24} />
              </div>
              <div>
                <label className="form-label">Review Comment</label>
                <textarea 
                  className="form-textarea"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience with this booking..."
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Submit Feedback</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 900px) {
          .grid-cols-12 {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem;
          }
          .dash-sidebar, .dash-content {
            grid-column: span 12 !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
