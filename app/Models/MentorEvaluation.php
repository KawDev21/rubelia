<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorEvaluation extends Model
{
    protected $fillable = [
        'period_year',
        'student_id',
        'mentor_id',
        'study_class_id',
        'review_text',
    ];

    protected function casts(): array
    {
        return [
            'period_year' => 'integer',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<User, $this> */
    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    /** @return BelongsTo<StudyClass, $this> */
    public function studyClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class);
    }
}
