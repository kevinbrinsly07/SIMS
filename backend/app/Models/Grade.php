<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = [
        'student_id',
        'course_id',
        'assessment_id',
        'assessment_type',
        'assessment_name',
        'score',
        'max_score',
        'percentage',
        'grade_letter',
        'date',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function assessment()
    {
        return $this->belongsTo(Assessment::class);
    }

    protected static function booted()
    {
        static::saving(function ($grade) {
            if ($grade->max_score > 0) {
                $grade->percentage = ($grade->score / $grade->max_score) * 100;
                if ($grade->percentage >= 90) {
                    $grade->grade_letter = 'A';
                } elseif ($grade->percentage >= 80) {
                    $grade->grade_letter = 'B';
                } elseif ($grade->percentage >= 70) {
                    $grade->grade_letter = 'C';
                } elseif ($grade->percentage >= 60) {
                    $grade->grade_letter = 'D';
                } else {
                    $grade->grade_letter = 'F';
                }
            }
        });
    }
}
