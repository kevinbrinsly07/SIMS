<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HealthRecord extends Model
{
    protected $fillable = [
        'student_id',
        'record_type',
        'description',
        'record_date',
        'provider',
        'treatment',
        'notes',
        'emergency_contact',
    ];

    protected $casts = [
        'record_date' => 'date',
        'emergency_contact' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
