<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'fee_per_session',
        'specialization',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'fee_per_session' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
