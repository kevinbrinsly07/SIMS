<?php

namespace App\Http\Controllers;

use App\Models\Fee;
use Illuminate\Http\Request;

class FeesController extends Controller
{
    public function index()
    {
        return Fee::with('student')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'fee_type' => 'required|string',
            'amount' => 'required|numeric',
            'due_date' => 'required|date',
        ]);

        return Fee::create($request->all());
    }

    public function show(string $id)
    {
        return Fee::with('student')->findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $fee = Fee::findOrFail($id);
        $fee->update($request->all());
        return $fee;
    }

    public function destroy(string $id)
    {
        Fee::findOrFail($id)->delete();
        return response()->json(['message' => 'Fee deleted']);
    }
}
