<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Favorite extends Model
{
    protected $fillable = [
        'user_id',
        'listing_id',
    ];

    /**
     * Get the user who saved the favorite.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the listing that was favorited.
     */
    public function listing(): BelongsTo
    {
        return $this->belongsTo(Listing::class);
    }
}
