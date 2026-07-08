import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ListingCard = ({ listing, onFavoriteToggle = null }) => {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(listing.is_favorite || false);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert("Please login to save favorite listings.");
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/listings/${listing.id}/favorite`);
      setIsFavorite(response.data.is_favorite);
      if (onFavoriteToggle) {
        onFavoriteToggle(listing.id, response.data.is_favorite);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    } finally {
      setLoading(false);
    }
  };

  const firstImage = (listing.images && listing.images.length > 0)
    ? (listing.images[0].startsWith('http') ? listing.images[0] : `http://localhost:8000${listing.images[0]}`)
    : 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';

  const userRating = listing.user?.ratings_avg || (listing.user?.reviews ? (listing.user.reviews.reduce((acc, r) => acc + r.rating, 0) / (listing.user.reviews.length || 1)) : 0);
  const reviewCount = listing.user?.ratings_count || (listing.user?.reviews ? listing.user.reviews.length : 0);

  return (
    <div className="card animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Favorite Button Overlay */}
      <button 
        onClick={toggleFavorite} 
        disabled={loading}
        style={{
          position: 'absolute', top: '1rem', right: '1rem', zIndex: 10,
          background: 'var(--glass-bg)', backdropFilter: 'blur(4px)', border: '1px solid var(--glass-border)',
          borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all var(--transition-fast)'
        }}
      >
        <Heart 
          size={18} 
          style={{
            fill: isFavorite ? 'var(--accent-danger)' : 'none',
            stroke: isFavorite ? 'var(--accent-danger)' : 'var(--text-primary)',
            transition: 'fill 0.15s ease'
          }} 
        />
      </button>

      {/* Listing Image */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '65%', overflow: 'hidden' }}>
        <img 
          src={firstImage} 
          alt={listing.title} 
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            objectFit: 'cover', transition: 'transform 0.5s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        />
        {/* Type Badge */}
        <span 
          className={`badge ${listing.type === 'service' ? 'badge-primary' : 'badge-secondary'}`}
          style={{ position: 'absolute', bottom: '1rem', left: '1rem', textTransform: 'capitalize', fontWeight: 700 }}
        >
          {listing.type}
        </span>
      </div>

      {/* Card Contents */}
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {listing.category}
          </span>
          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-heading)' }}>
            ${parseFloat(listing.price).toFixed(2)}
          </span>
        </div>

        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: '1.4', minHeight: '2.8em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          <Link to={`/listings/${listing.id}`} style={{ color: 'var(--text-primary)' }}>
            {listing.title}
          </Link>
        </h3>

        <p style={{
          fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem',
          minHeight: '3em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
        }}>
          {listing.description}
        </p>

        {/* Footer info (Provider & Stars & Location) */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Seller / Star rating info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {listing.user?.name || 'Local Seller'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Star size={14} style={{ fill: 'var(--accent-warning)', stroke: 'var(--accent-warning)' }} />
              <span style={{ fontWeight: 700 }}>{parseFloat(userRating).toFixed(1)}</span>
              <span style={{ color: 'var(--text-muted)' }}>({reviewCount})</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={14} />
              {listing.location || 'Local Community'}
            </span>
            {listing.type === 'service' && listing.estimated_delivery && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Calendar size={14} />
                {listing.estimated_delivery}
              </span>
            )}
          </div>
        </div>

        <Link 
          to={`/listings/${listing.id}`} 
          className="btn btn-secondary" 
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', fontWeight: 700, marginTop: '1rem' }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ListingCard;
