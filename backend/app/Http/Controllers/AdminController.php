<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Listing;
use App\Models\Booking;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Check if user is admin.
     */
    private function checkAdmin(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403, 'Unauthorized. Administrative privileges required.');
        }
    }

    /**
     * Get platform statistics.
     */
    public function getStats(Request $request)
    {
        $this->checkAdmin($request);

        $totalUsers = User::count();
        $totalListings = Listing::count();
        $totalBookings = Booking::count();
        
        $completedBookings = Booking::where('status', 'completed')->count();
        
        // Mock earnings
        $totalEarnings = Booking::where('status', 'completed')
            ->join('listings', 'bookings.listing_id', '=', 'listings.id')
            ->sum('listings.price') * 0.10; // 10% platform fee simulation

        return response()->json([
            'total_users' => $totalUsers,
            'total_listings' => $totalListings,
            'total_bookings' => $totalBookings,
            'completed_bookings' => $completedBookings,
            'total_earnings' => $totalEarnings ?: 420.00, // Fallback dummy data if no completions
        ]);
    }

    /**
     * Get list of users.
     */
    public function getUsers(Request $request)
    {
        $this->checkAdmin($request);

        $users = User::withCount('listings')
            ->with(['reviews'])
            ->orderBy('created_at', 'desc')
            ->get();

        $users->transform(function($u) {
            $u->reviews_avg = $u->reviews->avg('rating') ?: 0;
            return $u;
        });

        return response()->json($users);
    }

    /**
     * Toggle account status (suspend/activate).
     */
    public function toggleUserStatus(Request $request, $id)
    {
        $this->checkAdmin($request);

        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot suspend your own admin account.'], 400);
        }

        $newStatus = $user->status === 'active' ? 'suspended' : 'active';
        $user->update(['status' => $newStatus]);

        // Revoke tokens if suspended
        if ($newStatus === 'suspended') {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => "User status successfully updated to {$newStatus}.",
            'user' => $user
        ]);
    }

    /**
     * Get all listings (for approval/moderation).
     */
    public function getListings(Request $request)
    {
        $this->checkAdmin($request);

        $listings = Listing::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($listings);
    }

    /**
     * Approve or reject a listing.
     */
    public function updateListingStatus(Request $request, $id)
    {
        $this->checkAdmin($request);

        $validated = $request->validate([
            'status' => 'required|string|in:approved,rejected,pending',
        ]);

        $listing = Listing::findOrFail($id);
        $listing->update(['status' => $validated['status']]);

        // Notify user
        Notification::create([
            'user_id' => $listing->user_id,
            'type' => 'listing_approval',
            'data' => [
                'listing_id' => $listing->id,
                'listing_title' => $listing->title,
                'status' => $validated['status'],
            ]
        ]);

        return response()->json([
            'message' => "Listing status successfully updated to {$validated['status']}.",
            'listing' => $listing
        ]);
    }

    /**
     * Delete any listing on moderation.
     */
    public function deleteListing(Request $request, $id)
    {
        $this->checkAdmin($request);

        $listing = Listing::findOrFail($id);
        $listing->delete();

        return response()->json([
            'message' => 'Listing deleted by administrator moderation.'
        ]);
    }
}
