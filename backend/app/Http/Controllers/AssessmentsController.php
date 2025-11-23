<?php

namespace App\Http\Controllers;

use App\Models\Assessment;
use Illuminate\Http\Request;

class AssessmentsController extends Controller
{
    public function index()
    {
        return Assessment::with('course')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'assessment_name' => 'required|string',
            'assessment_type' => 'required|string',
            'total_marks' => 'required|numeric',
            'weightage' => 'required|numeric|min:0|max:100',
            'due_date' => 'required|date',
        ]);

        return Assessment::create($request->all());
    }

    public function show(string $id)
    {
        return Assessment::with('course')->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $assessment = Assessment::findOrFail($id);
        $assessment->update($request->all());
        return $assessment;
    }

    public function destroy(string $id)
    {
        Assessment::findOrFail($id)->delete();
        return response()->json(['message' => 'Assessment deleted']);
    }
}
