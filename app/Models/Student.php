<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property CarbonInterface $enrolled_at
 */
class Student extends Model
{
    protected $fillable = [
        'user_id',
        'student_code',
        'education_level_id',
        'guardian_name',
        'guardian_phone',
        'school_name',
        'address',
        'enrolled_at',
    ];

    protected function casts(): array
    {
        return [
            'enrolled_at' => 'date:Y-m-d',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<EducationLevel, $this> */
    public function educationLevel(): BelongsTo
    {
        return $this->belongsTo(EducationLevel::class);
    }

    /** @return HasMany<ClassEnrollment, $this> */
    public function enrollments(): HasMany
    {
        return $this->hasMany(ClassEnrollment::class);
    }

    /** @return HasOne<ClassEnrollment, $this> */
    public function activeEnrollment(): HasOne
    {
        return $this->hasOne(ClassEnrollment::class)->where('status', 'active')->latestOfMany();
    }

    /** @return HasMany<StudentAttendance, $this> */
    public function attendances(): HasMany
    {
        return $this->hasMany(StudentAttendance::class);
    }

    /** @return HasMany<StudentGrade, $this> */
    public function grades(): HasMany
    {
        return $this->hasMany(StudentGrade::class);
    }

    /** @return HasMany<Invoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasMany<StudentClassRequest, $this> */
    public function classRequests(): HasMany
    {
        return $this->hasMany(StudentClassRequest::class);
    }
}
