<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BehaviorLog extends Model
{
    protected $fillable = [
        'student_id',
        'reported_by',
        'incident_type',
        'description',
        'incident_date',
        'severity',
        'action_taken',
        'follow_up',
    ];

    protected $casts = [
        'incident_date' => 'date',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
