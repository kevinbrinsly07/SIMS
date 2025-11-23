<?php

namespace App\Http\Controllers;

use App\Models\BehaviorLog;
use Illuminate\Http\Request;

class BehaviorLogsController extends Controller
{
    public function index()
    {
        return BehaviorLog::with(['student', 'reporter'])->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'reported_by' => 'required|exists:users,id',
            'incident_type' => 'required|string',
            'description' => 'required|string',
            'incident_date' => 'required|date',
        ]);

        return BehaviorLog::create($request->all());
    }

    public function show(string $id)
    {
        return BehaviorLog::with(['student', 'reporter'])->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $behaviorLog = BehaviorLog::findOrFail($id);
        $behaviorLog->update($request->all());
        return $behaviorLog;
    }

    public function destroy(string $id)
    {
        BehaviorLog::findOrFail($id)->delete();
        return response()->json(['message' => 'Behavior log deleted']);
    }
}
