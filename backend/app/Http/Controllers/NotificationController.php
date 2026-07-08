<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get notifications for authenticated user.
     */
    public function index(Request $request)
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($notifications);
    }

    /**
     * Mark notification(s) as read.
     */
    public function markRead(Request $request, $id = null)
    {
        $user = $request->user();

        if ($id) {
            $notification = Notification::where('user_id', $user->id)->findOrFail($id);
            $notification->update(['read_at' => now()]);
        } else {
            Notification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);
        }

        return response()->json(['message' => 'Notifications updated successfully.']);
    }
}
