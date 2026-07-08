import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, MessageSquare, PlusCircle, Sun, Moon, LogOut, User, Menu, X, ShieldAlert } from 'lucide-react';
import api from '../utils/api';

const Navbar = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll notifications every 10 seconds if user logged in
    let interval;
    if (user) {
      interval = setInterval(fetchNotifications, 10000);
    }
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside clicks for dropdowns
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date() })));
    } catch (error) {
      console.error("Failed to mark notifications read:", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read_at) {
        await api.post(`/notifications/${notif.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date() } : n));
      }
      setNotifOpen(false);
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to read notification:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatNotifText = (n) => {
    const d = n.data;
    switch (n.type) {
      case 'booking_request':
        return `${d.buyer_name} requested a booking for "${d.listing_title}" on ${d.preferred_date}`;
      case 'booking_status':
        return `Booking for "${d.listing_title}" was ${d.status} by ${d.actor_name}`;
      case 'new_message':
        return `New message from ${d.sender_name}: "${d.message_preview}"`;
      case 'new_review':
        return `${d.reviewer_name} left you a ${d.rating}-star review`;
      case 'listing_approval':
        return `Your listing "${d.listing_title}" has been ${d.status}`;
      default:
        return 'New notification';
    }
  };

  return (
    <nav className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 1.5rem',
      transition: 'background-color var(--transition-normal)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '1.25rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-heading)'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            color: 'white',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800
          }}>C</span>
          CommuniLink
        </Link>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} className="desktop-nav">
          <Link to="/" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Marketplace</Link>
          
          {user && (
            <>
              <Link to="/dashboard" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Dashboard</Link>
              <Link to="/chat" style={{
                color: 'var(--text-secondary)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <MessageSquare size={18} />
                Chat
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" style={{
                  color: 'var(--accent-danger)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <ShieldAlert size={18} />
                  Admin
                </Link>
              )}
            </>
          )}

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Add Listing Shortcut */}
              <Link to="/listings/new" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                <PlusCircle size={16} />
                List Item
              </Link>

              {/* Notifications Dropdown */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button 
                  onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} 
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                    position: 'relative', display: 'flex', alignItems: 'center', padding: '0.25rem'
                  }}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: 0, right: 0, width: '10px', height: '10px',
                      backgroundColor: 'var(--accent-danger)', borderRadius: '50%', border: '2px solid var(--bg-secondary)'
                    }}></span>
                  )}
                </button>

                {notifOpen && (
                  <div className="card glass" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '320px',
                    maxHeight: '400px', overflowY: 'auto', zIndex: 1001, boxShadow: 'var(--shadow-xl)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{
                      padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: 600 }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllRead} 
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div>
                      {notifications.length === 0 ? (
                        <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          No notifications yet.
                        </p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)',
                              cursor: 'pointer', backgroundColor: n.read_at ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                              fontSize: '0.8rem', color: 'var(--text-secondary)', transition: 'background-color 0.15s ease'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.read_at ? 'transparent' : 'rgba(99, 102, 241, 0.05)'}
                          >
                            <p style={{ fontWeight: n.read_at ? 400 : 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                              {formatNotifText(n)}
                            </p>
                            <small style={{ color: 'var(--text-muted)' }}>{new Date(n.created_at).toLocaleDateString()}</small>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button 
                  onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.25rem', color: 'var(--text-primary)', fontWeight: 600
                  }}
                >
                  <img 
                    src={user.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                    alt={user.name} 
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-focus)' }}
                  />
                </button>

                {profileOpen && (
                  <div className="card glass" style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', width: '200px',
                    zIndex: 1001, boxShadow: 'var(--shadow-xl)', borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                      <small style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>{user.email}</small>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <Link to="/profile" onClick={() => setProfileOpen(false)} style={{
                        padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--text-primary)', fontSize: '0.875rem', transition: 'background-color 0.15s ease'
                      }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <User size={16} /> My Profile
                      </Link>
                      <button onClick={handleLogout} style={{
                        padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--accent-danger)', fontSize: '0.875rem', border: 'none', background: 'none',
                        cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'background-color 0.15s ease'
                      }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-nav-toggle" style={{
          background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'none'
        }}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="glass" style={{
          display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0',
          borderTop: '1px solid var(--border-color)', marginTop: '0.5rem'
        }}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Marketplace</Link>
          {user && (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/chat" onClick={() => setMenuOpen(false)}>Chat</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/listings/new" onClick={() => setMenuOpen(false)}>List Item</Link>
              {user.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: 'var(--accent-danger)' }}>Admin Panel</Link>
              )}
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{
                background: 'none', border: 'none', color: 'var(--accent-danger)', textAlign: 'left',
                cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem'
              }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          )}
          {!user && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary" style={{ flex: 1 }}>Register</Link>
            </div>
          )}
          <button onClick={() => { toggleTheme(); setMenuOpen(false); }} className="btn btn-secondary" style={{ width: '100%' }}>
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      )}

      {/* Navigation Style Injector */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
