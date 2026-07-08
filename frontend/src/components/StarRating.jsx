import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, onRatingChange = null, size = 18 }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
      {stars.map((star) => {
        const isFilled = star <= rating;
        const isClickable = onRatingChange !== null;

        return (
          <Star
            key={star}
            size={size}
            onClick={() => isClickable && onRatingChange(star)}
            style={{
              cursor: isClickable ? 'pointer' : 'default',
              fill: isFilled ? 'var(--accent-warning)' : 'none',
              stroke: isFilled ? 'var(--accent-warning)' : 'var(--text-muted)',
              transition: 'transform 0.15s ease, fill 0.15s ease',
            }}
            className={isClickable ? 'hover-scale' : ''}
          />
        );
      })}
      <style>{`
        .hover-scale:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  );
};

export default StarRating;
