<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    /**
     * Get list of active chat threads for current user.
     */
    public function getChats(Request $request)
    {
        $userId = $request->user()->id;

        $messages = Message::where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        $chats = [];
        foreach ($messages as $msg) {
            $otherUserId = ($msg->sender_id === $userId) ? $msg->receiver_id : $msg->sender_id;
            if (!isset($chats[$otherUserId])) {
                $otherUser = User::find($otherUserId);
                if ($otherUser) {
                    $chats[$otherUserId] = [
                        'user' => $otherUser,
                        'last_message' => $msg,
                        'unread_count' => Message::where('sender_id', $otherUserId)
                            ->where('receiver_id', $userId)
                            ->where('is_read', false)
                            ->count()
                    ];
                }
            }
        }

        return response()->json(array_values($chats));
    }

    /**
     * Get chat history between current user and another user.
     */
    public function getMessages(Request $request, $otherUserId)
    {
        $userId = $request->user()->id;

        // Mark incoming messages as read
        Message::where('sender_id', $otherUserId)
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        $messages = Message::where(function($q) use ($userId, $otherUserId) {
                $q->where('sender_id', $userId)->where('receiver_id', $otherUserId);
            })
            ->orWhere(function($q) use ($userId, $otherUserId) {
                $q->where('sender_id', $otherUserId)->where('receiver_id', $userId);
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Send a message to another user.
     */
    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required_without:image|nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096',
        ]);

        $senderId = $request->user()->id;
        $receiverId = $validated['receiver_id'];

        if ($senderId === intval($receiverId)) {
            return response()->json(['message' => 'You cannot send a message to yourself.'], 400);
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('chat_images', 'public');
            $imagePath = '/storage/' . $path;
        }

        $message = Message::create([
            'sender_id' => $senderId,
            'receiver_id' => $receiverId,
            'message' => $validated['message'] ?? '',
            'image_path' => $imagePath,
            'is_read' => false,
        ]);

        // Send a silent notifications update (custom notification logic)
        Notification::create([
            'user_id' => $receiverId,
            'type' => 'new_message',
            'data' => [
                'message_id' => $message->id,
                'sender_name' => $request->user()->name,
                'message_preview' => $message->message ? substr($message->message, 0, 60) : 'Sent an image',
            ]
        ]);

        return response()->json($message, 201);
    }
}
