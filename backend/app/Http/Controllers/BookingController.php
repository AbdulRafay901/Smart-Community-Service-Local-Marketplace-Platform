<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Listing;
use App\Models\Notification;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    /**
     * Get booking history for current user.
     * Includes requests made by the user, and requests received for user's listings.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Bookings made by the user (as a buyer)
        $sentBookings = Booking::where('buyer_id', $user->id)
            ->with(['listing.user'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Bookings received for listings owned by the user (as a seller/provider)
        $receivedBookings = Booking::whereHas('listing', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->with(['buyer', 'listing'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'sent' => $sentBookings,
            'received' => $receivedBookings,
        ]);
    }

    /**
     * Store a new booking request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'listing_id' => 'required|exists:listings,id',
            'preferred_date' => 'required|date|after_or_equal:today',
            'preferred_time' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $listing = Listing::findOrFail($validated['listing_id']);

        // Check if user is booking their own listing
        if ($listing->user_id === $request->user()->id) {
            return response()->json(['message' => 'You cannot book your own listing.'], 400);
        }

        $booking = Booking::create([
            'buyer_id' => $request->user()->id,
            'listing_id' => $listing->id,
            'preferred_date' => $validated['preferred_date'],
            'preferred_time' => $validated['preferred_time'],
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        // Notify the seller
        Notification::create([
            'user_id' => $listing->user_id,
            'type' => 'booking_request',
            'data' => [
                'booking_id' => $booking->id,
                'buyer_name' => $request->user()->name,
                'listing_title' => $listing->title,
                'preferred_date' => $booking->preferred_date,
            ]
        ]);

        return response()->json([
            'message' => 'Booking request submitted successfully.',
            'booking' => $booking->load(['listing', 'buyer'])
        ], 201);
    }

    /**
     * Update booking status (accept, reject, cancel, complete).
     */
    public function updateStatus(Request $request, $id)
    {
        $booking = Booking::with(['listing', 'buyer'])->findOrFail($id);
        $user = $request->user();

        $validated = $request->validate([
            'status' => 'required|string|in:accepted,rejected,cancelled,completed',
        ]);

        $newStatus = $validated['status'];
        $listing = $booking->listing;

        // Authorization checks
        if ($newStatus === 'accepted' || $newStatus === 'rejected' || $newStatus === 'completed') {
            // Only the owner of the listing can accept, reject, or complete
            if ($listing->user_id !== $user->id && $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized to update this booking.'], 403);
            }
        } elseif ($newStatus === 'cancelled') {
            // Only buyer or seller can cancel
            if ($booking->buyer_id !== $user->id && $listing->user_id !== $user->id && $user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized to cancel this booking.'], 403);
            }
        }

        $booking->update(['status' => $newStatus]);

        // Send notifications based on transitions
        if ($newStatus === 'accepted' || $newStatus === 'rejected' || $newStatus === 'completed') {
            // Notify buyer
            Notification::create([
                'user_id' => $booking->buyer_id,
                'type' => 'booking_status',
                'data' => [
                    'booking_id' => $booking->id,
                    'listing_title' => $listing->title,
                    'status' => $newStatus,
                    'actor_name' => $user->name,
                ]
            ]);
        } elseif ($newStatus === 'cancelled') {
            // Notify other party
            $recipientId = ($user->id === $booking->buyer_id) ? $listing->user_id : $booking->buyer_id;
            Notification::create([
                'user_id' => $recipientId,
                'type' => 'booking_status',
                'data' => [
                    'booking_id' => $booking->id,
                    'listing_title' => $listing->title,
                    'status' => 'cancelled',
                    'actor_name' => $user->name,
                ]
            ]);
        }

        return response()->json([
            'message' => 'Booking status updated successfully.',
            'booking' => $booking
        ]);
    }
}
