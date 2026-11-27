<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EducationLevel extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'monthly_fee',
        'default_mentor_fee',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_fee' => 'integer',
            'default_mentor_fee' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /** @return HasMany<Student, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    /** @return HasMany<StudyClass, $this> */
    public function studyClasses(): HasMany
    {
        return $this->hasMany(StudyClass::class);
    }
}
