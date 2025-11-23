<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    public function index()
    {
        return User::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'nullable|string',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role ?? 'student',
        ]);

        return response()->json($user, 201);
    }

    public function show(User $user)
    {
        return $user;
    }

    public function update(Request $request, User $user)
    {
        Log::info('User update called for user ' . $user->id . ' by ' . ($request->user() ? $request->user()->id : 'unknown'));
        
        // Check authorization: only admin or the user themselves can update
        $authUser = $request->user();
        if (!$authUser || ($authUser->role !== 'admin' && $authUser->id !== $user->id)) {
            Log::info('Unauthorized update attempt');
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        Log::info('Request method: ' . $request->method());
        Log::info('Request content type: ' . $request->header('Content-Type'));
        Log::info('Request has file profile_picture: ' . $request->hasFile('profile_picture'));
        Log::info('All request files: ' . json_encode($request->allFiles()));
        Log::info('All request data: ' . json_encode($request->all()));
        
        $request->validate([
            'username' => 'sometimes|required|string|unique:users,username,' . $user->id,
            'email' => 'sometimes|required|string|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|required|string|min:8',
            'role' => 'nullable|string',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:4096',
        ]);

        $updateData = $request->only(['username', 'email', 'role']);

        // Handle profile picture upload
        if ($request->hasFile('profile_picture')) {
            Log::info('Profile picture upload started for user ' . $user->id);
            Log::info('File details: ' . json_encode([
                'name' => $request->file('profile_picture')->getClientOriginalName(),
                'size' => $request->file('profile_picture')->getSize(),
                'mime' => $request->file('profile_picture')->getMimeType(),
            ]));
            // Delete old profile picture if exists
            if ($user->profile_picture && file_exists(storage_path('app/public/' . $user->profile_picture))) {
                unlink(storage_path('app/public/' . $user->profile_picture));
            }

            $file = $request->file('profile_picture');
            $filename = time() . '_' . $user->id . '.' . $file->getClientOriginalExtension();
            $file->storeAs('profile_pictures', $filename, 'public');
            $updateData['profile_picture'] = 'profile_pictures/' . $filename;
            Log::info('Profile picture saved as ' . $updateData['profile_picture']);
            $fullPath = storage_path('app/public/' . $updateData['profile_picture']);
            Log::info('Full path: ' . $fullPath . ', exists: ' . file_exists($fullPath));
        } else {
            Log::info('No profile picture file in request');
        }

        Log::info('Update data: ' . json_encode($updateData));
        $user->update($updateData);

        if ($request->has('password')) {
            $user->password = Hash::make($request->password);
            $user->save();
        }

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->json(null, 204);
    }
}