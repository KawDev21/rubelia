<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property array<int, string>|null $days
 */
class StudyClass extends Model
{
    protected $fillable = [
        'education_level_id',
        'mentor_id',
        'name',
        'days',
        'session_number',
        'start_time',
        'end_time',
        'quota',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'days' => 'array',
            'session_number' => 'integer',
            'quota' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return BelongsTo<EducationLevel, $this> */
    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    /** @return BelongsTo<User, $this> */
    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    /** @return HasMany<ClassEnrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class);
    }

    /** @return HasMany<ClassEnrollment, $this> */
    public function activeEnrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class)->where('status', 'active');
    }

    /** @return HasMany<ClassSession, $this> */
    public function sessions(): HasMany
    {
        return $this->hasMany(ClassSession::class);
    }
}
