<?php

namespace App\Models;

use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'profile_picture',
        'bio',
        'contact_info',
        'location',
        'skills_services',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get listings for the user.
     */
    public function listings(): HasMany
    {
        return $this->hasMany(Listing::class);
    }

    /**
     * Get bookings made by the user.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'buyer_id');
    }

    /**
     * Get bookings received on user's listings.
     */
    public function receivedBookings(): HasManyThrough
    {
        return $this->hasManyThrough(Booking::class, Listing::class, 'user_id', 'listing_id');
    }

    /**
     * Messages sent by the user.
     */
    public function sentMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Messages received by the user.
     */
    public function receivedMessages(): HasMany
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    /**
     * Reviews left about this user (seller/provider reputation).
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewed_user_id');
    }

    /**
     * Reviews given by this user.
     */
    public function givenReviews(): HasMany
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }

    /**
     * Favorites saved by this user.
     */
    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    /**
     * Notifications received by this user.
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
