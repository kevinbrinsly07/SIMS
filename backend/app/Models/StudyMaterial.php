<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudyMaterial extends Model
{
    protected $fillable = [
        'course_id',
        'module_name',
        'title',
        'description',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'is_visible',
        'uploaded_by',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
