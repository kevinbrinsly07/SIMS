<?php

namespace App\Http\Controllers;

use App\Models\StudyMaterial;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class StudyMaterialController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = StudyMaterial::with(['course', 'uploader']);

        // Filter by course if provided
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }

        // For students, only show visible materials
        if (Auth::user()->role !== 'admin') {
            $query->where('is_visible', true);
        }

        return response()->json($query->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'course_id' => 'required|exists:courses,id',
            'module_name' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file' => 'required|file|max:10240', // 10MB max
            'is_visible' => 'sometimes|boolean',
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('study_materials', $fileName, 'public');

        $studyMaterial = StudyMaterial::create([
            'course_id' => $request->course_id,
            'module_name' => $request->module_name,
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => Auth::id(),
            'is_visible' => $request->is_visible ?? true,
        ]);

        return response()->json($studyMaterial->load(['course', 'uploader']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(StudyMaterial $studyMaterial)
    {
        // Check if user can view this material
        if (Auth::user()->role !== 'admin' && !$studyMaterial->is_visible) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($studyMaterial->load(['course', 'uploader']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, StudyMaterial $studyMaterial)
    {
        $request->validate([
            'module_name' => 'sometimes|nullable|string|max:255',
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'is_visible' => 'sometimes|boolean',
        ]);

        $studyMaterial->update($request->only(['module_name', 'title', 'description', 'is_visible']));

        return response()->json($studyMaterial->load(['course', 'uploader']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(StudyMaterial $studyMaterial)
    {
        // Delete the file from storage
        Storage::disk('public')->delete($studyMaterial->file_path);

        $studyMaterial->delete();

        return response()->json(['message' => 'Study material deleted successfully']);
    }

    /**
     * Download the study material file.
     */
    public function download(StudyMaterial $studyMaterial)
    {
        // Check if user can download this material
        if (Auth::user()->role !== 'admin' && !$studyMaterial->is_visible) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $filePath = storage_path('app/public/' . $studyMaterial->file_path);

        if (!file_exists($filePath)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        // Read file content and return as base64
        $fileContent = file_get_contents($filePath);
        $base64Content = base64_encode($fileContent);

        return response()->json([
            'file_name' => $studyMaterial->file_name,
            'file_type' => $studyMaterial->file_type,
            'content' => $base64Content
        ]);
    }

    /**
     * Get study materials for a specific course.
     */
    public function getByCourse(Course $course)
    {
        $query = $course->studyMaterials()->with('uploader');

        // For students, only show visible materials
        if (Auth::user()->role !== 'admin') {
            $query->where('is_visible', true);
        }

        return response()->json($query->get());
    }
}
