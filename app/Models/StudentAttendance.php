<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property CarbonInterface|null $wa_notified_at
 */
class StudentAttendance extends Model
{
    protected $fillable = [
        'class_session_id',
        'student_id',
        'status',
        'wa_notified_at',
        'wa_error',
    ];

    protected function casts(): array
    {
        return [
            'wa_notified_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ClassSession, $this> */
    public function classSession(): BelongsTo
    {
        return $this->belongsTo(ClassSession::class);
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
