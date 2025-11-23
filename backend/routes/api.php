<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\GradeController;
use App\Http\Controllers\ApplicationsController;
use App\Http\Controllers\AssessmentsController;
use App\Http\Controllers\FeesController;
use App\Http\Controllers\PaymentsController;
use App\Http\Controllers\SchedulesController;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\BehaviorLogsController;
use App\Http\Controllers\HealthRecordsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\GuardianController;
use App\Http\Controllers\StudyMaterialController;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

Route::apiResource('students', StudentController::class)->middleware('auth:sanctum');
Route::apiResource('courses', CourseController::class)->middleware('auth:sanctum');
Route::apiResource('enrollments', EnrollmentController::class)->middleware('auth:sanctum');
Route::apiResource('attendance', AttendanceController::class)->middleware('auth:sanctum');
Route::apiResource('grades', GradeController::class)->middleware('auth:sanctum');
Route::apiResource('applications', ApplicationsController::class)->middleware('auth:sanctum');
Route::apiResource('assessments', AssessmentsController::class)->middleware('auth:sanctum');
Route::apiResource('fees', FeesController::class)->middleware('auth:sanctum');
Route::apiResource('payments', PaymentsController::class)->middleware('auth:sanctum');
Route::apiResource('schedules', SchedulesController::class)->middleware('auth:sanctum');
Route::apiResource('notifications', NotificationsController::class)->middleware('auth:sanctum');
Route::apiResource('behavior-logs', BehaviorLogsController::class)->middleware('auth:sanctum');
Route::apiResource('health-records', HealthRecordsController::class)->middleware('auth:sanctum');
Route::apiResource('users', UserController::class)->middleware('auth:sanctum');
Route::post('users/{user}', [UserController::class, 'update'])->middleware('auth:sanctum');

Route::apiResource('study-materials', StudyMaterialController::class)->middleware('auth:sanctum');
Route::get('study-materials/{studyMaterial}/download', [StudyMaterialController::class, 'download'])->middleware('auth:sanctum');
Route::get('courses/{course}/study-materials', [StudyMaterialController::class, 'getByCourse'])->middleware('auth:sanctum');

Route::get('students/{student}/courses', [StudentController::class, 'courses'])->middleware('auth:sanctum');
Route::get('students/{student}/grades', [StudentController::class, 'grades'])->middleware('auth:sanctum');
Route::get('students/{student}/attendance', [StudentController::class, 'attendance'])->middleware('auth:sanctum');
Route::get('students/{student}/fees', [StudentController::class, 'fees'])->middleware('auth:sanctum');
Route::get('students/{student}/payments', [StudentController::class, 'payments'])->middleware('auth:sanctum');
Route::get('students/{student}/notifications', [StudentController::class, 'notifications'])->middleware('auth:sanctum');
Route::get('students/{student}/health-records', [StudentController::class, 'healthRecords'])->middleware('auth:sanctum');
Route::get('students/{student}/behavior-logs', [StudentController::class, 'behaviorLogs'])->middleware('auth:sanctum');

Route::get('parent/{guardianId}/children', [GuardianController::class, 'getChildren']);