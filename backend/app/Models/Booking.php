<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'buyer_id',
        'listing_id',
        'preferred_date',
        'preferred_time',
        'status',
        'notes',
    ];

    /**
     * Get the buyer (user) who requested this booking.
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Get the listing associated with this booking.
     */
    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }

    /**
     * Get reviews left for this booking.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
