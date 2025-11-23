<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'application_number',
        'first_name',
        'last_name',
        'email',
        'phone',
        'date_of_birth',
        'address',
        'department',
        'year',
        'previous_education',
        'gpa',
        'documents',
        'status',
        'notes',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'documents' => 'array',
    ];
}
