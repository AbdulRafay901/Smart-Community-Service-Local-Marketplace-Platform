<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\Favorite;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ListingController extends Controller
{
    /**
     * Get all approved listings with filters.
     */
    public function index(Request $request)
    {
        $query = Listing::with(['user'])->where('status', 'approved');

        // Filter by Type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by Category
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Search Keyword
        if ($request->filled('q')) {
            $search = $request->q;
            $query->where(function($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by Location
        if ($request->filled('location')) {
            $query->where('location', 'like', "%{$request->location}%");
        }

        // Filter by Price
        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }
        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        // Filter by Rating (Provider Average Rating)
        if ($request->filled('rating')) {
            $ratingThreshold = intval($request->rating);
            $query->whereHas('user.reviews', function($q) use ($ratingThreshold) {
                // filter user where average review is >= rating
            });
            // We can resolve this in PHP or custom subquery
            // Subquery version is clean:
            $query->where(function($q) use ($ratingThreshold) {
                $q->whereIn('user_id', function($subQuery) use ($ratingThreshold) {
                    $subQuery->select('reviewed_user_id')
                             ->from('reviews')
                             ->groupBy('reviewed_user_id')
                             ->havingRaw('AVG(rating) >= ?', [$ratingThreshold]);
                });
            });
        }

        // Sorting
        $sort = $request->query('sort', 'latest');
        if ($sort === 'price_asc') {
            $query->orderBy('price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('price', 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        // Paginate listings
        $listings = $query->paginate(12);

        // Append favorite flags if user is logged in
        if ($user = auth('sanctum')->user()) {
            $favorites = Favorite::where('user_id', $user->id)->pluck('listing_id')->toArray();
            $listings->getCollection()->transform(function($listing) use ($favorites) {
                $listing->is_favorite = in_array($listing->id, $favorites);
                return $listing;
            });
        } else {
            $listings->getCollection()->transform(function($listing) {
                $listing->is_favorite = false;
                return $listing;
            });
        }

        return response()->json($listings);
    }

    /**
     * Store a new listing.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:product,service',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'price' => 'required|numeric|min:0',
            'estimated_delivery' => 'nullable|string|max:255',
            'availability' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:4096',
        ]);

        $uploadedImages = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('listings', 'public');
                $uploadedImages[] = '/storage/' . $path;
            }
        }

        $listing = Listing::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'price' => $validated['price'],
            'estimated_delivery' => $validated['estimated_delivery'] ?? null,
            'availability' => $validated['availability'] ?? null,
            'location' => $validated['location'] ?? null,
            'images' => $uploadedImages,
            'status' => 'approved', // Auto-approved in simple mode, admin can remove/manage
        ]);

        return response()->json([
            'message' => 'Listing created successfully.',
            'listing' => $listing
        ], 201);
    }

    /**
     * Show detailed listing info.
     */
    public function show($id)
    {
        $listing = Listing::with(['user.reviews.reviewer'])->findOrFail($id);
        
        // Calculate user reviews stats
        $reviews = $listing->user->reviews;
        $listing->user->ratings_count = $reviews->count();
        $listing->user->ratings_avg = $reviews->avg('rating') ?: 0;

        // Check if favorite
        if ($user = auth('sanctum')->user()) {
            $listing->is_favorite = Favorite::where('user_id', $user->id)
                ->where('listing_id', $listing->id)
                ->exists();
        } else {
            $listing->is_favorite = false;
        }

        return response()->json($listing);
    }

    /**
     * Update an existing listing.
     */
    public function update(Request $request, $id)
    {
        $listing = Listing::findOrFail($id);

        if ($listing->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'price' => 'required|numeric|min:0',
            'estimated_delivery' => 'nullable|string|max:255',
            'availability' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'existing_images' => 'nullable|array', // List of paths to keep
            'images' => 'nullable|array',
            'images.*' => 'image|mimes:jpeg,png,jpg,gif|max:4096',
        ]);

        $currentImages = $request->input('existing_images', []);
        
        // Remove deleted images from storage
        $originalImages = $listing->images ?? [];
        foreach ($originalImages as $origImg) {
            if (!in_array($origImg, $currentImages)) {
                $path = str_replace('/storage/', '', $origImg);
                Storage::disk('public')->delete($path);
            }
        }

        // Store new images
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('listings', 'public');
                $currentImages[] = '/storage/' . $path;
            }
        }

        $listing->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'price' => $validated['price'],
            'estimated_delivery' => $validated['estimated_delivery'] ?? null,
            'availability' => $validated['availability'] ?? null,
            'location' => $validated['location'] ?? null,
            'images' => $currentImages,
        ]);

        return response()->json([
            'message' => 'Listing updated successfully.',
            'listing' => $listing
        ]);
    }

    /**
     * Delete a listing.
     */
    public function destroy(Request $request, $id)
    {
        $listing = Listing::findOrFail($id);

        if ($listing->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Delete images from disk
        if ($listing->images) {
            foreach ($listing->images as $img) {
                $path = str_replace('/storage/', '', $img);
                Storage::disk('public')->delete($path);
            }
        }

        $listing->delete();

        return response()->json([
            'message' => 'Listing deleted successfully.'
        ]);
    }

    /**
     * Toggle listing favorite.
     */
    public function toggleFavorite(Request $request, $id)
    {
        $user = $request->user();
        $favorite = Favorite::where('user_id', $user->id)->where('listing_id', $id)->first();

        if ($favorite) {
            $favorite->delete();
            return response()->json(['message' => 'Listing removed from favorites.', 'is_favorite' => false]);
        } else {
            Favorite::create([
                'user_id' => $user->id,
                'listing_id' => $id,
            ]);
            return response()->json(['message' => 'Listing added to favorites.', 'is_favorite' => true]);
        }
    }

    /**
     * Get user's favorites list.
     */
    public function favorites(Request $request)
    {
        $user = $request->user();
        $favorites = Listing::whereIn('id', function($q) use ($user) {
            $q->select('listing_id')->from('favorites')->where('user_id', $user->id);
        })->with('user')->get();

        // Flag all as favorite
        $favorites->transform(function($listing) {
            $listing->is_favorite = true;
            return $listing;
        });

        return response()->json($favorites);
    }
}
