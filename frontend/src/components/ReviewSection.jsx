import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { MessageSquare, Calendar } from 'lucide-react';

const ReviewSection = ({ reviewedUserId, listingId = null }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/user/${reviewedUserId}`);
      setReviews(response.data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [reviewedUserId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!comment.trim()) {
      setError('Please add a comment for your review.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        reviewed_user_id: reviewedUserId,
        rating,
        comment,
      };
      if (listingId) {
        payload.listing_id = listingId;
      }
      
      const response = await api.post('/reviews', payload);
      setSuccess('Your review has been submitted successfully!');
      setComment('');
      setRating(5);
      
      // Prepend the new review locally
      setReviews(prev => [response.data.review, ...prev]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit review.';
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
        Ratings & Reviews ({reviews.length})
      </h3>

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading reviews...</p>
      ) : (
        <div className="grid-cols-12" style={{ display: 'grid', gap: '2rem' }}>
          {/* Summary / Stats Card */}
          <div style={{ gridColumn: 'span 4' }}>
            <div className="card glass" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Average Rating</h4>
              <p style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-warning)', lineHeight: '1' }}>
                {avgRating}
              </p>
              <div style={{ margin: '0.75rem 0' }}>
                <StarRating rating={Math.round(avgRating)} size={20} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Based on {reviews.length} community feedback{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Reviews List & Write Review Form */}
          <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Form to leave review (if logged in and not reviewing oneself) */}
            {user && user.id !== parseInt(reviewedUserId) && (
              <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-focus)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Write a Review</h4>
                
                {error && <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>}
                {success && <p style={{ color: 'var(--accent-success)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{success}</p>}

                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <StarRating rating={rating} onRatingChange={setRating} size={22} />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="comment">Your Experience</label>
                    <textarea 
                      id="comment"
                      className="form-textarea" 
                      placeholder="Share details of your experience with this service or product provider..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submitting} 
                    style={{ width: 'auto', padding: '0.6rem 1.5rem' }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            )}

            {/* List of Reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.length === 0 ? (
                <div className="card glass" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare style={{ margin: '0 auto 0.75rem', strokeWidth: 1.5 }} size={32} />
                  <p style={{ fontSize: '0.9rem' }}>No reviews left for this user yet. Be the first to share your experience!</p>
                </div>
              ) : (
                reviews.map(r => (
                  <div key={r.id} className="card glass" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img 
                          src={r.reviewer?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
                          alt={r.reviewer?.name} 
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.reviewer?.name}</p>
                          <small style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                            <Calendar size={12} />
                            {new Date(r.created_at).toLocaleDateString()}
                          </small>
                        </div>
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

          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .grid-cols-12 {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ReviewSection;
