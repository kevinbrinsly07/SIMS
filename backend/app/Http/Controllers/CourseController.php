<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;

class CourseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $courses = Course::all();
        return response()->json($courses);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_code' => 'required|string|unique:courses',
            'course_name' => 'required|string',
            'description' => 'nullable|string',
            'credits' => 'required|integer',
            'department' => 'nullable|string',
            'instructor' => 'nullable|string',
            'semester' => 'nullable|string',
            'year' => 'nullable|integer',
        ]);

        $course = Course::create($request->all());
        return response()->json($course, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $course = Course::findOrFail($id);
        $request->validate([
            'course_code' => 'sometimes|required|string|unique:courses,course_code,' . $id,
            'course_name' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'credits' => 'sometimes|required|integer',
            'department' => 'nullable|string',
            'instructor' => 'nullable|string',
            'semester' => 'nullable|string',
            'year' => 'nullable|integer',
        ]);

        $course->update($request->all());
        return response()->json($course);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $course = Course::findOrFail($id);
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }
}
