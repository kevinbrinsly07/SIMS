<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationsController extends Controller
{
    public function index()
    {
        return Notification::with('user')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string',
            'message' => 'required|string',
            'type' => 'required|string',
        ]);

        return Notification::create($request->all());
    }

    public function show(string $id)
    {
        return Notification::with('user')->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $notification = Notification::findOrFail($id);
        
        // Check authorization: only admin or the owner can update
        $user = $request->user();
        if ($user->role !== 'admin' && $user->id !== $notification->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $notification->update($request->all());
        return $notification;
    }

    public function destroy(string $id)
    {
        Notification::findOrFail($id)->delete();
        return response()->json(['message' => 'Notification deleted']);
    }
}
