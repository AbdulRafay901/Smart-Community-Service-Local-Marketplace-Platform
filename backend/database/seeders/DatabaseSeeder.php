<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Listing;
use App\Models\Booking;
use App\Models\Review;
use App\Models\Message;
use App\Models\Notification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Users
        $admin = User::create([
            'name' => 'Community Admin',
            'email' => 'admin@community.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'location' => 'Downtown',
            'bio' => 'Lead administrator of the Smart Community Service Platform.',
            'status' => 'active',
        ]);

        $john = User::create([
            'name' => 'John Doe (Web Dev)',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'location' => 'North Side',
            'bio' => 'Professional full-stack web developer with 5+ years of experience building React and Laravel apps.',
            'skills_services' => 'React, Vue, Laravel, Node, MySQL, REST APIs, TailwindCSS',
            'contact_info' => '+1 (555) 123-4567',
            'status' => 'active',
        ]);

        $sara = User::create([
            'name' => 'Sara Smith (Photography)',
            'email' => 'sara@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'location' => 'West End',
            'bio' => 'Creative portrait, product and event photographer. Love capturing real community moments.',
            'skills_services' => 'Portrait Photography, Lightroom editing, Event coverage, Camera setups',
            'contact_info' => '+1 (555) 987-6543',
            'status' => 'active',
        ]);

        $buyer = User::create([
            'name' => 'Alice Johnson (Buyer)',
            'email' => 'buyer@example.com',
            'password' => Hash::make('password'),
            'role' => 'user',
            'location' => 'Downtown',
            'bio' => 'Local resident looking for great local services and products.',
            'contact_info' => '+1 (555) 444-5555',
            'status' => 'active',
        ]);

        // 2. Create Service Listings
        $webDevService = Listing::create([
            'user_id' => $john->id,
            'type' => 'service',
            'title' => 'Custom Portfolio & Business Web Development',
            'description' => 'I will build you a premium, fully responsive, state-of-the-art business portfolio website using React, TailwindCSS, and Laravel. Includes clean code structure, custom administration dashboard, SEO tags, and contact forms.',
            'category' => 'Web Development',
            'price' => 350.00,
            'estimated_delivery' => '7 Days',
            'availability' => 'Available',
            'location' => 'North Side',
            'images' => [
                'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'
            ],
            'status' => 'approved',
        ]);

        $photoService = Listing::create([
            'user_id' => $sara->id,
            'type' => 'service',
            'title' => 'Professional Outdoor Portrait Session',
            'description' => '2-hour outdoor portrait photography session for individuals, couples or families. Includes 30 high-resolution professionally retouched digital photos delivered within 4 days.',
            'category' => 'Photography',
            'price' => 120.00,
            'estimated_delivery' => '4 Days',
            'availability' => 'Available',
            'location' => 'West End',
            'images' => [
                'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80',
                'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80'
            ],
            'status' => 'approved',
        ]);

        // 3. Create Product Listings
        $phoneProduct = Listing::create([
            'user_id' => $buyer->id,
            'type' => 'product',
            'title' => 'iPhone 13 - 128GB (Unlocked, Space Gray)',
            'description' => 'Selling my pristine condition iPhone 13. Factory unlocked, battery health is at 88%. Comes with the original box and charging cable. No scratches or dents as it has always been in a case.',
            'category' => 'Electronics',
            'price' => 450.00,
            'location' => 'Downtown',
            'images' => [
                'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
            ],
            'status' => 'approved',
        ]);

        $jacketProduct = Listing::create([
            'user_id' => $john->id,
            'type' => 'product',
            'title' => 'Vintage Leather Bomber Jacket',
            'description' => 'Beautiful genuine leather vintage bomber jacket in size L. Dark brown leather with soft lining. Excellent condition with some natural patina.',
            'category' => 'Fashion',
            'price' => 85.00,
            'location' => 'North Side',
            'images' => [
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80'
            ],
            'status' => 'approved',
        ]);

        // 4. Bookings Seeding
        $booking1 = Booking::create([
            'buyer_id' => $buyer->id,
            'listing_id' => $webDevService->id,
            'preferred_date' => now()->addDays(5)->format('Y-m-d'),
            'preferred_time' => '10:00 AM',
            'status' => 'completed',
            'notes' => 'Looking to build a website for my online baking shop.',
        ]);

        $booking2 = Booking::create([
            'buyer_id' => $buyer->id,
            'listing_id' => $photoService->id,
            'preferred_date' => now()->addDays(10)->format('Y-m-d'),
            'preferred_time' => '03:30 PM',
            'status' => 'pending',
            'notes' => 'Family portrait at the central park lake.',
        ]);

        // 5. Reviews Seeding
        Review::create([
            'reviewer_id' => $buyer->id,
            'reviewed_user_id' => $john->id,
            'listing_id' => $webDevService->id,
            'booking_id' => $booking1->id,
            'rating' => 5,
            'comment' => 'John did an absolutely amazing job! He communicated clearly, finished a day early, and the design was stunning.',
        ]);

        Review::create([
            'reviewer_id' => $buyer->id,
            'reviewed_user_id' => $sara->id,
            'listing_id' => $photoService->id,
            'rating' => 4,
            'comment' => 'Sara did a photoshoot for our office. Good communication and professional edits.',
        ]);

        // 6. Messaging Seeding (Chat history between Buyer & John)
        Message::create([
            'sender_id' => $buyer->id,
            'receiver_id' => $john->id,
            'message' => 'Hi John! I saw your web development listing. Do you have experience with e-commerce integration?',
            'is_read' => true,
        ]);

        Message::create([
            'sender_id' => $john->id,
            'receiver_id' => $buyer->id,
            'message' => 'Hello Alice! Yes, absolutely. I have built several e-commerce storefronts. I can integrate Stripe or PayPal seamlessly.',
            'is_read' => true,
        ]);

        Message::create([
            'sender_id' => $buyer->id,
            'receiver_id' => $john->id,
            'message' => 'That sounds wonderful. I just requested a booking for next week. Let me know if that time works for you!',
            'is_read' => false,
        ]);

        // 7. Seed some notifications
        Notification::create([
            'user_id' => $john->id,
            'type' => 'booking_request',
            'data' => [
                'booking_id' => $booking1->id,
                'buyer_name' => $buyer->name,
                'listing_title' => $webDevService->title,
                'preferred_date' => $booking1->preferred_date,
            ],
            'read_at' => now(),
        ]);

        Notification::create([
            'user_id' => $sara->id,
            'type' => 'booking_request',
            'data' => [
                'booking_id' => $booking2->id,
                'buyer_name' => $buyer->name,
                'listing_title' => $photoService->title,
                'preferred_date' => $booking2->preferred_date,
            ],
        ]);
    }
}
