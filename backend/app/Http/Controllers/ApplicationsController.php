<?php

namespace App\Http\Controllers;

use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApplicationsController extends Controller
{
    public function index()
    {
        return Application::all();
    }

    public function store(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email|unique:applications',
            'phone' => 'nullable|string',
            'date_of_birth' => 'required|date',
            'address' => 'required|string',
            'department' => 'required|string',
            'year' => 'required|integer',
        ]);

        $data = $request->all();
        $data['application_number'] = 'APP-' . strtoupper(Str::random(8));

        return Application::create($data);
    }

    public function show(string $id)
    {
        return Application::findOrFail($id);
    }

    public function update(Request $request, string $id)
    {
        $application = Application::findOrFail($id);
        $application->update($request->all());
        return $application;
    }

    public function destroy(string $id)
    {
        Application::findOrFail($id)->delete();
        return response()->json(['message' => 'Application deleted']);
    }
}
