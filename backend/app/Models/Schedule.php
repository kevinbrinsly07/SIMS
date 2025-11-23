<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'course_id',
        'day_of_week',
        'start_time',
        'end_time',
        'room',
        'semester',
        'year',
    ];

    protected $casts = [
        // 'start_time' => 'H:i',
        // 'end_time' => 'H:i',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
