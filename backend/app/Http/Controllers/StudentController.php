<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class StudentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $students = Student::with('user')->get();
        return response()->json($students);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'student_id' => 'required|string|unique:students',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'date_of_birth' => 'required|date',
            'gender' => 'nullable|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'department' => 'nullable|string',
            'year' => 'nullable|integer',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
        ]);

        $student = Student::create([
            'user_id' => $user->id,
            'student_id' => $request->student_id,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'phone' => $request->phone,
            'address' => $request->address,
            'department' => $request->department,
            'year' => $request->year,
        ]);

        return response()->json($student->load('user'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $student = Student::with('user', 'parent')->findOrFail($id);
        return response()->json($student);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        
        // Check authorization: only admin or the student themselves can update
        $user = $request->user();
        if ($user->role !== 'admin' && $user->id !== $student->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $request->validate([
            'student_id' => 'sometimes|required|string|unique:students,student_id,' . $id,
            'first_name' => 'sometimes|required|string',
            'last_name' => 'sometimes|required|string',
            'date_of_birth' => 'sometimes|required|date',
            'gender' => 'nullable|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'department' => 'nullable|string',
            'year' => 'nullable|integer',
            'status' => 'sometimes|string',
        ]);

        $student->update($request->only([
            'student_id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'phone', 'address', 'department', 'year', 'status'
        ]));

        return response()->json($student->load('user', 'parent'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $student = Student::findOrFail($id);
        $student->user->delete(); // This will cascade delete student due to foreign key
        return response()->json(['message' => 'Student deleted']);
    }

    /**
     * Get courses for a student.
     */
    public function courses(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $courses = $student->enrollments()->with('course')->get()->pluck('course');
        return response()->json($courses);
    }

    /**
     * Get grades for a student.
     */
    public function grades(Request $request, string $id)
    {
        try {
            $student = Student::findOrFail($id);
            
            // Check authorization
            $user = $request->user();
            if ($user->id !== $student->user_id && $user->role !== 'admin' && $user->role !== 'parent') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            $grades = $student->grades()->with('assessment')->get();
            return response()->json($grades);
        } catch (\Exception $e) {
            Log::error("Error fetching grades for student {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get attendance for a student.
     */
    public function attendance(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $attendance = $student->attendance()->with('course')->get();
        return response()->json($attendance);
    }

    /**
     * Get fees for a student.
     */
    public function fees(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $fees = $student->fees;
        return response()->json($fees);
    }

    /**
     * Get payments for a student.
     */
    public function payments(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $payments = $student->payments()->with('fee')->get();
        return response()->json($payments);
    }

    /**
     * Get notifications for a student.
     */
    public function notifications(Request $request, string $id)
    {
        try {
            $student = Student::findOrFail($id);
            
            // Check if authenticated user is the student or an admin/parent
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            if ($user->id !== $student->user_id && $user->role !== 'admin' && $user->role !== 'parent') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            if (!$student->user) {
                Log::error("Student {$id} has no associated user");
                return response()->json([]);
            }
            $notifications = $student->user->notifications;
            return response()->json($notifications);
        } catch (\Exception $e) {
            Log::error("Error fetching notifications for student {$id}: " . $e->getMessage());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    /**
     * Get health records for a student.
     */
    public function healthRecords(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $healthRecords = $student->healthRecords;
        return response()->json($healthRecords);
    }

    /**
     * Get behavior logs for a student.
     */
    public function behaviorLogs(Request $request, string $id)
    {
        $student = Student::findOrFail($id);
        $behaviorLogs = $student->behaviorLogs;
        return response()->json($behaviorLogs);
    }
}