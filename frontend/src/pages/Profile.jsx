import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/ListingCard';
import StarRating from '../components/StarRating';
import { User, MapPin, Phone, Code, Mail, Edit3, Save, Camera, X } from 'lucide-react';
import api from '../utils/api';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('listings'); // listings, reviews
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable Profile States
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');
  const [skillsServices, setSkillsServices] = useState('');
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState('');

  // Loaded user dependencies states
  const [userListings, setUserListings] = useState([]);
  const [userReviews, setUserReviews] = useState([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setContactInfo(user.contact_info || '');
      setLocation(user.location || '');
      setSkillsServices(user.skills_services || '');
      setProfilePicPreview(user.profile_picture || '');
      fetchUserDependencies();
    }
  }, [user]);

  const fetchUserDependencies = async () => {
    if (!user) return;
    try {
      // Get user listings (filter standard response or query)
      const response = await api.get('/listings', { params: { user_id: user.id } });
      // The API return approved listings, let's filter for current user listings
      const allListingsResponse = await api.get('/listings');
      // For local simplicity, we filter listings where user_id = user.id
      setUserListings(allListingsResponse.data.data.filter(l => l.user_id === user.id));

      // Get reviews
      const reviewsResponse = await api.get(`/reviews/user/${user.id}`);
      setUserReviews(reviewsResponse.data);
    } catch (err) {
      console.error("Failed to load user dependencies:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('bio', bio);
      formData.append('contact_info', contactInfo);
      formData.append('location', location);
      formData.append('skills_services', skillsServices);
      if (profilePicFile) {
        formData.append('profile_picture', profilePicFile);
      }

      await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccess('Profile updated successfully!');
      setEditing(false);
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Please log in to view your profile.</p>;
  }

  const profileImageUrl = profilePicPreview
    ? (profilePicPreview.startsWith('blob:') || profilePicPreview.startsWith('http') ? profilePicPreview : `http://localhost:8000${profilePicPreview}`)
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner Cover */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        marginBottom: '4rem'
      }}>
        {/* Profile Pic overlapping cover */}
        <div style={{
          position: 'absolute', bottom: '-50px', left: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem'
        }} className="avatar-header">
          <div style={{ position: 'relative' }}>
            <img 
              src={profileImageUrl} 
              alt={name} 
              style={{
                width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover',
                border: '4px solid var(--bg-secondary)', boxShadow: 'var(--shadow-lg)'
              }}
            />
            {editing && (
              <label 
                htmlFor="avatar-file"
                style={{
                  position: 'absolute', bottom: '5px', right: '5px', backgroundColor: 'var(--accent-primary)',
                  color: 'white', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white'
                }}
              >
                <Camera size={16} />
                <input type="file" id="avatar-file" onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
              </label>
            )}
          </div>
          <div style={{ marginBottom: '10px' }} className="avatar-meta">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{user.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <StarRating rating={Math.round(user.ratings_avg || 0)} size={14} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>({user.ratings_count || 0} reviews)</span>
              {user.role === 'admin' && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Administrator</span>}
            </div>
          </div>
        </div>

        {/* Edit Profile Toggle Button */}
        {!editing ? (
          <button 
            onClick={() => setEditing(true)}
            className="btn btn-secondary animate-fade-in"
            style={{ position: 'absolute', bottom: '1rem', right: '1rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem' }}
          >
            <Edit3 size={16} /> Edit Profile
          </button>
        ) : (
          <button 
            onClick={() => { setEditing(false); setProfilePicPreview(user.profile_picture || ''); setError(''); }}
            className="btn btn-secondary animate-fade-in"
            style={{ position: 'absolute', bottom: '1rem', right: '1rem', padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem' }}
          >
            <X size={16} /> Cancel
          </button>
        )}
      </div>

      {success && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>{error}</div>}

      <div className="grid-cols-12" style={{ display: 'grid' }}>
        
        {/* Left Side: Profile Meta Details */}
        <div style={{ gridColumn: 'span 4' }} className="profile-details-card">
          <div className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>About Me</h3>
            
            {editing ? (
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Bio Description</label>
                  <textarea className="form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Write something about yourself..." />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. West End, Downtown" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Contact Phone</label>
                  <input type="text" className="form-input" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="e.g. +1 (555) 123-4567" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Skills & Services Provided</label>
                  <textarea className="form-textarea" value={skillsServices} onChange={(e) => setSkillsServices(e.target.value)} placeholder="e.g. Graphic design, plumbing, math tutoring..." style={{ minHeight: '80px' }} />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                  <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: bio ? 'normal' : 'italic' }}>
                  {bio || "No biography provided yet."}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{user.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{location || "No location set"}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                    <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                    <span>{contactInfo || "No phone contact added"}</span>
                  </div>
                </div>

                {skillsServices && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Code size={16} /> Skills / Services
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {skillsServices.split(',').map((skill, index) => (
                        <span key={index} className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tabbed Active Listings & Reviews */}
        <div style={{ gridColumn: 'span 8' }} className="profile-tabs-content">
          {/* Tabs header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setActiveTab('listings')}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0.25rem', cursor: 'pointer',
                fontWeight: 700, fontSize: '1rem', color: activeTab === 'listings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'listings' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              My Listings ({userListings.length})
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              style={{
                background: 'none', border: 'none', padding: '0.75rem 0.25rem', cursor: 'pointer',
                fontWeight: 700, fontSize: '1rem', color: activeTab === 'reviews' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'reviews' ? '3px solid var(--accent-primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              Community Reviews ({userReviews.length})
            </button>
          </div>

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div>
              {userListings.length === 0 ? (
                <div className="card glass" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem' }}>You don't have any active listings. Create one to display here!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
                  {userListings.map(l => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {userReviews.length === 0 ? (
                <div className="card glass" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p style={{ fontSize: '0.95rem' }}>No feedback reviews left by the community yet.</p>
                </div>
              ) : (
                userReviews.map(r => (
                  <div key={r.id} className="card glass" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.reviewer?.name}</p>
                        <small style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</small>
                      </div>
                      <StarRating rating={r.rating} size={14} />
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {r.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .grid-cols-12 {
            display: flex !important;
            flex-direction: column !important;
          }
          .avatar-header {
            flex-direction: column !important;
            align-items: center !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            bottom: -80px !important;
            width: 100% !important;
          }
          .avatar-meta {
            text-align: center !important;
          }
          .app-container {
            padding-top: 1rem;
          }
          .profile-details-card {
            margin-top: 3.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Profile;
