<?php

namespace App\Http\Controllers;

use App\Models\HealthRecord;
use Illuminate\Http\Request;

class HealthRecordsController extends Controller
{
    public function index()
    {
        return HealthRecord::with('student')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'record_type' => 'required|string',
            'description' => 'required|string',
            'record_date' => 'required|date',
        ]);

        return HealthRecord::create($request->all());
    }

    public function show(string $id)
    {
        return HealthRecord::with('student')->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $healthRecord = HealthRecord::findOrFail($id);
        $healthRecord->update($request->all());
        return $healthRecord;
    }

    public function destroy(string $id)
    {
        HealthRecord::findOrFail($id)->delete();
        return response()->json(['message' => 'Health record deleted']);
    }
}
