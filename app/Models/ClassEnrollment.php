<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassEnrollment extends Model
{
    protected $fillable = [
        'student_id',
        'study_class_id',
        'status',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'date:Y-m-d',
            'ended_at' => 'date:Y-m-d',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<StudyClass, $this> */
    public function studyClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class);
    }
}
