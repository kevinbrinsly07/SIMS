<?php

namespace App\Http\Controllers;

use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Http\Request;

class GuardianController extends Controller
{
    public function getChildren($guardianId)
    {
        $guardian = Guardian::with('children')->findOrFail($guardianId);
        return response()->json($guardian->children);
    }
}
