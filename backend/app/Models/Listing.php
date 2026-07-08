<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Listing extends Model
{
    protected $fillable = [
        'user_id',
        'type',
        'title',
        'description',
        'category',
        'price',
        'estimated_delivery',
        'availability',
        'location',
        'images',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'images' => 'array',
            'price' => 'decimal:2',
        ];
    }

    /**
     * Get the user who owns this listing.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get bookings associated with this listing.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    /**
     * Get reviews left for this listing.
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    /**
     * Get favorites associated with this listing.
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }
}
