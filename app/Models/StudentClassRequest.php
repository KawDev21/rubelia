<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentClassRequest extends Model
{
    protected $fillable = [
        'student_id',
        'from_class_id',
        'to_class_id',
        'type',
        'temporary_date',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_note',
    ];

    protected function casts(): array
    {
        return [
            'temporary_date' => 'date:Y-m-d',
            'reviewed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return BelongsTo<StudyClass, $this> */
    public function fromClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class, 'from_class_id');
    }

    /** @return BelongsTo<StudyClass, $this> */
    public function toClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class, 'to_class_id');
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
