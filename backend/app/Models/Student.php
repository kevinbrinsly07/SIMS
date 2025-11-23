<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    protected $fillable = [
        'user_id',
        'student_id',
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'phone',
        'address',
        'enrollment_date',
        'department',
        'year',
        'status',
        'parent_id',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'enrollment_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }

    public function parent()
    {
        return $this->belongsTo(User::class, 'parent_id');
    }

    public function guardians()
    {
        return $this->belongsToMany(Guardian::class, 'guardian_student', 'student_id', 'guardian_id');
    }

    public function fees()
    {
        return $this->hasMany(Fee::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function behaviorLogs()
    {
        return $this->hasMany(BehaviorLog::class);
    }

    public function healthRecords()
    {
        return $this->hasMany(HealthRecord::class);
    }
}
