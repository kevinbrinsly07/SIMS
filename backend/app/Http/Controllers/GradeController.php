<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Grade;

class GradeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $grades = Grade::with('student.user', 'course', 'assessment')->get();
        return response()->json($grades);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'course_id' => 'required|exists:courses,id',
            'assessment_type' => 'required|string',
            'assessment_name' => 'nullable|string',
            'score' => 'required|numeric',
            'max_score' => 'required|numeric',
            'remarks' => 'nullable|string',
        ]);

        $grade = Grade::create($request->all());
        return response()->json($grade->load('student.user', 'course', 'assessment'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $grade = Grade::with('student.user', 'course', 'assessment')->findOrFail($id);
        return response()->json($grade);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $grade = Grade::findOrFail($id);
        $request->validate([
            'assessment_type' => 'sometimes|required|string',
            'assessment_name' => 'nullable|string',
            'score' => 'sometimes|required|numeric',
            'max_score' => 'sometimes|required|numeric',
            'remarks' => 'nullable|string',
        ]);

        $grade->update($request->only(['assessment_type', 'assessment_name', 'score', 'max_score', 'remarks']));
        return response()->json($grade->load('student.user', 'course', 'assessment'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $grade = Grade::findOrFail($id);
        $grade->delete();
        return response()->json(['message' => 'Grade deleted']);
    }
}
