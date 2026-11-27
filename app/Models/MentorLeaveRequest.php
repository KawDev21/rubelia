<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorLeaveRequest extends Model
{
    protected $fillable = [
        'mentor_id',
        'study_class_id',
        'session_date',
        'reason',
        'status',
        'substitute_user_id',
        'reviewed_by',
        'reviewed_at',
        'review_note',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date:Y-m-d',
            'reviewed_at' => 'datetime',
        ];
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

    /** @return BelongsTo<User, $this> */
    public function substitute(): BelongsTo
    {
        return $this->belongsTo(User::class, 'substitute_user_id');
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
