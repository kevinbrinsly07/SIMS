<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    protected $fillable = [
        'course_code',
        'course_name',
        'description',
        'credits',
        'department',
        'instructor',
        'semester',
        'year',
    ];

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

    public function assessments()
    {
        return $this->hasMany(Assessment::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function studyMaterials()
    {
        return $this->hasMany(StudyMaterial::class);
    }
}
