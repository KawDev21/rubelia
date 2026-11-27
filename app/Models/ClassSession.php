<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property CarbonInterface $session_date
 * @property CarbonInterface $checked_in_at
 */
class ClassSession extends Model
{
    protected $fillable = [
        'study_class_id',
        'session_date',
        'session_number',
        'scheduled_start_time',
        'taught_by_user_id',
        'is_substitute',
        'checked_in_at',
        'latitude',
        'longitude',
        'distance_meters',
        'is_location_valid',
        'late_minutes',
        'mentor_fee_amount',
        'topic_notes',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date:Y-m-d',
            'session_number' => 'integer',
            'is_substitute' => 'boolean',
            'checked_in_at' => 'datetime',
            'latitude' => 'float',
            'longitude' => 'float',
            'distance_meters' => 'integer',
            'is_location_valid' => 'boolean',
            'late_minutes' => 'integer',
            'mentor_fee_amount' => 'integer',
        ];
    }

    /** @return BelongsTo<StudyClass, $this> */
    public function studyClass(): BelongsTo
    {
        return $this->belongsTo(StudyClass::class);
    }

    /** @return BelongsTo<User, $this> */
    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'taught_by_user_id');
    }

    /** @return HasMany<StudentAttendance, $this> */
    public function attendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class);
    }
}
