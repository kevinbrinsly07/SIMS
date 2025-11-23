<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Assessment extends Model
{
    protected $fillable = [
        'course_id',
        'assessment_name',
        'assessment_type',
        'total_marks',
        'weightage',
        'due_date',
        'description',
    ];

    protected $casts = [
        'due_date' => 'date',
        'total_marks' => 'decimal:2',
        'weightage' => 'decimal:2',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function grades()
    {
        return $this->hasMany(Grade::class);
    }
}
