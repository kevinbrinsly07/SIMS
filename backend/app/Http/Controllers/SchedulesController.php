<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;

class SchedulesController extends Controller
{
    public function index()
    {
        return Schedule::with('course')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'day_of_week' => 'required|string',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i',
            'room' => 'nullable|string',
            'semester' => 'required|string',
            'year' => 'required|integer',
        ]);

        return Schedule::create($request->all());
    }

    public function show(string $id)
    {
        return Schedule::with('course')->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->update($request->all());
        return $schedule;
    }

    public function destroy(string $id)
    {
        Schedule::findOrFail($id)->delete();
        return response()->json(['message' => 'Schedule deleted']);
    }
}
