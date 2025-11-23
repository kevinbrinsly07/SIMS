<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Enrollment;

class EnrollmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $enrollments = Enrollment::with('student.user', 'course')->get();
        return response()->json($enrollments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'course_id' => 'required|exists:courses,id',
            'status' => 'nullable|string',
        ]);

        // Check if already enrolled
        $existing = Enrollment::where('student_id', $request->student_id)
            ->where('course_id', $request->course_id)
            ->first();
        if ($existing) {
            return response()->json(['message' => 'Student already enrolled in this course'], 400);
        }

        $enrollment = Enrollment::create($request->only(['student_id', 'course_id', 'status']));
        return response()->json($enrollment->load('student.user', 'course'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $enrollment = Enrollment::with('student.user', 'course')->findOrFail($id);
        return response()->json($enrollment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $enrollment = Enrollment::findOrFail($id);
        $request->validate([
            'status' => 'sometimes|string',
        ]);

        $enrollment->update($request->only(['status']));
        return response()->json($enrollment->load('student.user', 'course'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $enrollment = Enrollment::findOrFail($id);
        $enrollment->delete();
        return response()->json(['message' => 'Enrollment deleted']);
    }
}
