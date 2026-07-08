import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, ShoppingBag, Calendar, DollarSign, Ban, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // users, listings
  const [loading, setLoading] = useState(true);

  // States
  const [stats, setStats] = useState({ total_users: 0, total_listings: 0, total_bookings: 0, completed_bookings: 0, total_earnings: 0 });
  const [usersList, setUsersList] = useState([]);
  const [listingsList, setListingsList] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);

      const usersRes = await api.get('/admin/users');
      setUsersList(usersRes.data);

      const listRes = await api.get('/admin/listings');
      setListingsList(listRes.data);
    } catch (err) {
      console.error("Failed to load administration workspace details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData();
    }
  }, [user]);

  // Toggle user suspension status
  const handleToggleUserStatus = async (userId) => {
    if (!window.confirm("Modify this user account access status?")) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/users/${userId}/toggle-status`);
      alert(res.data.message);
      
      // Update local users list status
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: res.data.user.status } : u));
      
      // Refresh stats
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data);
    } catch (error) {
      alert("Failed to toggle user status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Moderate Listing status (Approve / Reject)
  const handleUpdateListingStatus = async (listingId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/listings/${listingId}/status`, { status: newStatus });
      alert(res.data.message);
      
      // Update local list
      setListingsList(prev => prev.map(l => l.id === listingId ? { ...l, status: newStatus } : l));
    } catch (error) {
      alert("Failed to update listing status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete listing permanently
  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Moderate and delete this listing permanently?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/listings/${listingId}`);
      alert("Listing deleted successfully.");
      
      // Remove from local list
      setListingsList(prev => prev.filter(l => l.id !== listingId));
      
      // Update listings count
      setStats(prev => ({ ...prev, total_listings: prev.total_listings - 1 }));
    } catch (error) {
      alert("Failed to delete listing.");
    } finally {
      setActionLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <p style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Access denied. Admin privileges required.</p>;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading administrator workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={28} style={{ color: 'var(--accent-danger)' }} />
            Administration Console
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>Review metrics, moderate community listings, and manage user accounts.</p>
        </div>
        <button onClick={fetchAdminData} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} disabled={actionLoading}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* Admin stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
        
        {/* Users */}
        <div className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: 'var(--radius-md)' }}>
            <Users size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Users</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.total_users}</h3>
          </div>
        </div>

        {/* Listings */}
        <div className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-secondary)', borderRadius: 'var(--radius-md)' }}>
            <ShoppingBag size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Marketplace Items</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.total_listings}</h3>
          </div>
        </div>

        {/* Bookings */}
        <div className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)', borderRadius: 'var(--radius-md)' }}>
            <Calendar size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Bookings</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{stats.total_bookings}</h3>
          </div>
        </div>

        {/* Earnings widget */}
        <div className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.6rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', borderRadius: 'var(--radius-md)' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Platform Revenue</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>${parseFloat(stats.total_earnings).toFixed(2)}</h3>
          </div>
        </div>

      </div>

      {/* Tabs navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '1.5rem', marginBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none', border: 'none', padding: '0.75rem 0.25rem', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.95rem', color: activeTab === 'users' ? 'var(--accent-danger)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'users' ? '3px solid var(--accent-danger)' : '3px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          Manage Registered Users ({usersList.length})
        </button>
        <button 
          onClick={() => setActiveTab('listings')}
          style={{
            background: 'none', border: 'none', padding: '0.75rem 0.25rem', cursor: 'pointer',
            fontWeight: 700, fontSize: '0.95rem', color: activeTab === 'listings' ? 'var(--accent-danger)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'listings' ? '3px solid var(--accent-danger)' : '3px solid transparent',
            transition: 'all 0.15s ease'
          }}
        >
          Listing Moderation Board ({listingsList.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="card glass" style={{ padding: '1.5rem' }}>
        
        {/* A. User Management Panel */}
        {activeTab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Profile</th>
                  <th style={{ padding: '0.75rem' }}>Email Address</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Location</th>
                  <th style={{ padding: '0.75rem' }}>Items Offered</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img 
                        src={u.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                        alt="" 
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-primary'}`} style={{ fontSize: '0.65rem' }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{u.location || 'N/A'}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.listings_count} listings</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {u.id !== user.id ? (
                        <button 
                          onClick={() => handleToggleUserStatus(u.id)}
                          disabled={actionLoading}
                          className={`btn ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'inline-flex', gap: '0.2rem' }}
                        >
                          <Ban size={12} />
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Current Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* B. Listing Moderation Panel */}
        {activeTab === 'listings' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Item Info</th>
                  <th style={{ padding: '0.75rem' }}>Creator</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem' }}>Price</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {listingsList.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <Link to={`/listings/${l.id}`} style={{ fontWeight: 600 }}>{l.title}</Link>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{l.user?.name}</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{l.type}</td>
                    <td style={{ padding: '0.75rem' }}>{l.category}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>${l.price}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${l.status === 'approved' ? 'badge-success' : l.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                        {l.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        {l.status !== 'approved' && (
                          <button 
                            onClick={() => handleUpdateListingStatus(l.id, 'approved')} 
                            disabled={actionLoading}
                            className="btn btn-success" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Approve
                          </button>
                        )}
                        {l.status !== 'rejected' && (
                          <button 
                            onClick={() => handleUpdateListingStatus(l.id, 'rejected')} 
                            disabled={actionLoading}
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            Reject
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteListing(l.id)} 
                          disabled={actionLoading}
                          className="btn btn-danger" 
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;
