<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property CarbonInterface $graded_at
 */
class StudentGrade extends Model
{
    protected $fillable = [
        'student_id',
        'study_class_id',
        'mentor_id',
        'subject_topic',
        'graded_at',
        'score',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'graded_at' => 'date:Y-m-d',
            'score' => 'float',
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

    /** @return BelongsTo<User, $this> */
    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }
}
