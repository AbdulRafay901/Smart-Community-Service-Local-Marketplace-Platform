<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Submit a review for a user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reviewed_user_id' => 'required|exists:users,id',
            'listing_id' => 'nullable|exists:listings,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        $reviewerId = $request->user()->id;
        $reviewedUserId = $validated['reviewed_user_id'];

        if ($reviewerId === intval($reviewedUserId)) {
            return response()->json(['message' => 'You cannot review yourself.'], 400);
        }

        // Optional validation if booking is supplied: booking must be completed
        if (!empty($validated['booking_id'])) {
            $booking = Booking::findOrFail($validated['booking_id']);
            if ($booking->status !== 'completed' && $booking->status !== 'accepted') {
                // allow reviewing active/completed bookings
            }
        }

        // Avoid double reviews on same booking
        if (!empty($validated['booking_id'])) {
            $exists = Review::where('reviewer_id', $reviewerId)
                ->where('booking_id', $validated['booking_id'])
                ->exists();
            if ($exists) {
                return response()->json(['message' => 'You have already reviewed this transaction.'], 400);
            }
        }

        $review = Review::create([
            'reviewer_id' => $reviewerId,
            'reviewed_user_id' => $reviewedUserId,
            'listing_id' => $validated['listing_id'] ?? null,
            'booking_id' => $validated['booking_id'] ?? null,
            'rating' => $validated['rating'],
            'comment' => $validated['comment'],
        ]);

        // Send notification to reviewed user
        Notification::create([
            'user_id' => $reviewedUserId,
            'type' => 'new_review',
            'data' => [
                'review_id' => $review->id,
                'reviewer_name' => $request->user()->name,
                'rating' => $review->rating,
            ]
        ]);

        return response()->json([
            'message' => 'Review submitted successfully.',
            'review' => $review->load('reviewer')
        ], 201);
    }

    /**
     * Get reviews left for a specific user.
     */
    public function getReviews($userId)
    {
        $reviews = Review::where('reviewed_user_id', $userId)
            ->with('reviewer')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reviews);
    }
}
