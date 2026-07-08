<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);

// Public Listing & Reviews Routes
Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{id}', [ListingController::class, 'show']);
Route::get('/reviews/user/{id}', [ReviewController::class, 'getReviews']);

// Protected Routes (Require Authentication)
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth & Profile
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/profile', [AuthController::class, 'updateProfile']); // POST allows multipart form uploads
    Route::post('/logout', [AuthController::class, 'logout']);

    // Listings
    Route::post('/listings', [ListingController::class, 'store']);
    Route::post('/listings/{id}', [ListingController::class, 'update']); // POST allows multipart edits
    Route::delete('/listings/{id}', [ListingController::class, 'destroy']);
    Route::post('/listings/{id}/favorite', [ListingController::class, 'toggleFavorite']);
    Route::get('/favorites', [ListingController::class, 'favorites']);

    // Bookings
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::patch('/bookings/{id}/status', [BookingController::class, 'updateStatus']);

    // Messaging
    Route::get('/chats', [MessageController::class, 'getChats']);
    Route::get('/messages/{otherUserId}', [MessageController::class, 'getMessages']);
    Route::post('/messages', [MessageController::class, 'sendMessage']);

    // Reviews
    Route::post('/reviews', [ReviewController::class, 'store']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Admin Dashboard Routes
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::post('/users/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
        Route::get('/listings', [AdminController::class, 'getListings']);
        Route::patch('/listings/{id}/status', [AdminController::class, 'updateListingStatus']);
        Route::delete('/listings/{id}', [AdminController::class, 'deleteListing']);
    });
});
