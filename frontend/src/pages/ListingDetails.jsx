import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReviewSection from '../components/ReviewSection';
import StarRating from '../components/StarRating';
import { Heart, MapPin, Calendar, Clock, MessageSquare, Edit3, Trash2, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const ListingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Gallery
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Booking Modal / Form State
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load Listing data
  const fetchListingDetails = async () => {
    try {
      const response = await api.get(`/listings/${id}`);
      setListing(response.data);
    } catch (err) {
      console.error("Failed to load listing details:", err);
      setError("We couldn't retrieve details for this listing. It may have been removed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListingDetails();
  }, [id]);

  // Handle toggle favorite
  const handleFavoriteToggle = async () => {
    if (!user) {
      alert("Please login to save favorite listings.");
      return;
    }
    try {
      const response = await api.post(`/listings/${listing.id}/favorite`);
      setListing(prev => ({ ...prev, is_favorite: response.data.is_favorite }));
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  // Delete listing
  const handleDeleteListing = async () => {
    if (!window.confirm("Are you sure you want to delete this listing permanently?")) return;
    try {
      await api.delete(`/listings/${listing.id}`);
      navigate('/dashboard');
    } catch (err) {
      alert("Failed to delete listing.");
    }
  };

  // Create booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    if (!bookingDate || !bookingTime) {
      setBookingError('Please specify preferred date and time.');
      return;
    }

    setBookingLoading(true);
    try {
      await api.post('/bookings', {
        listing_id: listing.id,
        preferred_date: bookingDate,
        preferred_time: bookingTime,
        notes: bookingNotes
      });

      setBookingSuccess('Your booking request was submitted! The service provider has been notified.');
      setBookingDate('');
      setBookingTime('');
      setBookingNotes('');
      // Auto close after 3 seconds
      setTimeout(() => setBookingOpen(false), 3000);
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Failed to request booking.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Chat with Seller/Provider
  const handleInitiateChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      // Send a small initial hello message to create thread, then redirect to chat page
      await api.post('/messages', {
        receiver_id: listing.user_id,
        message: `Hi! I'm interested in your listing: "${listing.title}".`
      });
      navigate('/chat', { state: { selectedUserId: listing.user_id } });
    } catch (err) {
      console.error("Failed to start chat thread:", err);
      // Fallback redirect directly
      navigate('/chat', { state: { selectedUserId: listing.user_id } });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Fetching listing details...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-danger)', marginBottom: '1rem' }}>Listing Not Found</h3>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Back to Marketplace</Link>
      </div>
    );
  }

  // Format listing images
  const images = (listing.images && listing.images.length > 0)
    ? listing.images.map(img => img.startsWith('http') ? img : `http://localhost:8000${img}`)
    : ['https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80'];

  const isOwner = user && user.id === listing.user_id;
  const userRating = listing.user?.ratings_avg || 0;
  const reviewCount = listing.user?.ratings_count || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Back button */}
      <div>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
          <ChevronLeft size={16} /> Back to Listings
        </Link>
      </div>

      <div className="grid-cols-12" style={{ display: 'grid' }}>
        
        {/* Left Column: Image Gallery & Details */}
        <div style={{ gridColumn: 'span 7' }} className="details-col-left">
          {/* Main Gallery Display */}
          <div className="card glass" style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '60%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <img 
                src={images[activeImageIndex]} 
                alt={listing.title} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Carousel controls */}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                    style={{
                      position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                      width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setActiveImageIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                    style={{
                      position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%',
                      width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Selection */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', padding: '0 0.5rem' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '60px', height: '45px', borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                      border: activeImageIndex === idx ? '2.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      padding: 0, cursor: 'pointer', transition: 'border var(--transition-fast)'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description Card */}
          <div className="card glass" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Listing Description
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {listing.description}
            </p>
          </div>
        </div>

        {/* Right Column: Listing Meta, Provider profile & Action drawer */}
        <div style={{ gridColumn: 'span 5' }} className="details-col-right">
          <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Meta Pricing & Title Card */}
            <div className="card glass" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className={`badge ${listing.type === 'service' ? 'badge-primary' : 'badge-secondary'}`} style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                  {listing.type}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{listing.category}</span>
              </div>

              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: '1.3', marginBottom: '1rem' }}>
                {listing.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)', lineHeight: '1' }}>
                  ${parseFloat(listing.price).toFixed(2)}
                </span>
                {listing.type === 'service' && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>service rate</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                  <span>Location: <strong>{listing.location || 'Local Community'}</strong></span>
                </div>
                {listing.type === 'service' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>Delivery Time: <strong>{listing.estimated_delivery || 'Not specified'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                      <span>Availability: 
                        <strong style={{ color: listing.availability === 'Available' ? 'var(--accent-success)' : 'var(--accent-danger)', marginLeft: '0.25rem' }}>
                          {listing.availability || 'Available'}
                        </strong>
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              {isOwner ? (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to={`/listings/${listing.id}/edit`} className="btn btn-secondary" style={{ flex: 1 }}>
                    <Edit3 size={16} /> Edit
                  </Link>
                  <button onClick={handleDeleteListing} className="btn btn-danger" style={{ flex: 1 }}>
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {listing.type === 'service' ? (
                    <button 
                      onClick={() => setBookingOpen(!bookingOpen)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.8rem' }}
                      disabled={listing.availability === 'Unavailable'}
                    >
                      <Calendar size={18} /> Request Service Booking
                    </button>
                  ) : (
                    <button 
                      onClick={handleInitiateChat}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.8rem' }}
                    >
                      <MessageSquare size={18} /> Chat with Seller / Buy
                    </button>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {listing.type === 'service' && (
                      <button 
                        onClick={handleInitiateChat}
                        className="btn btn-secondary" 
                        style={{ flex: 1 }}
                      >
                        <MessageSquare size={16} /> Contact Provider
                      </button>
                    )}
                    <button 
                      onClick={handleFavoriteToggle}
                      className="btn btn-secondary"
                      style={{ flex: listing.type === 'service' ? 1 : 'none', width: listing.type === 'service' ? 'auto' : '100%', gap: '0.5rem' }}
                    >
                      <Heart size={16} style={{ fill: listing.is_favorite ? 'var(--accent-danger)' : 'none', stroke: listing.is_favorite ? 'var(--accent-danger)' : 'currentColor' }} />
                      {listing.is_favorite ? 'Favorited' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Booking Form Overlay / Console (Inline) */}
            {bookingOpen && (
              <div className="card animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--accent-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Request Service Booking</h3>
                
                {bookingError && <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{bookingError}</p>}
                {bookingSuccess && <p style={{ color: 'var(--accent-success)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{bookingSuccess}</p>}

                <form onSubmit={handleCreateBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Preferred Date *</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={bookingDate} 
                      onChange={(e) => setBookingDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Preferred Time Slot *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. 10:00 AM, Evening slot" 
                      value={bookingTime} 
                      onChange={(e) => setBookingTime(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Notes for Provider</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Specify task requirements, details of address, or special conditions..."
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      style={{ minHeight: '60px' }}
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={bookingLoading}>
                    {bookingLoading ? 'Sending...' : 'Confirm Request'}
                  </button>
                </form>
              </div>
            )}

            {/* Provider Info Card */}
            <div className="card glass" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img 
                src={listing.user?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                alt={listing.user?.name} 
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {listing.user?.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.25rem 0' }}>
                  <Star size={14} style={{ fill: 'var(--accent-warning)', stroke: 'var(--accent-warning)' }} />
                  <span style={{ fontWeight: 700 }}>{parseFloat(userRating).toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({reviewCount} reviews)</span>
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', textTransform: 'capitalize' }}>
                  Member since {listing.user?.created_at ? new Date(listing.user.created_at).getFullYear() : '2026'}
                </small>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Review Section Embed */}
      <ReviewSection reviewedUserId={listing.user_id} listingId={listing.id} />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 992px) {
          .grid-cols-12 {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem;
          }
          .details-col-left, .details-col-right {
            grid-column: span 12 !important;
          }
          .details-col-right {
            order: -1; /* Display price/title on top of images on mobile */
          }
        }
      `}</style>
    </div>
  );
};

export default ListingDetails;
