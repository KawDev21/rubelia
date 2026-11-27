<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Broadcast extends Model
{
    protected $fillable = [
        'title',
        'body',
        'target_role',
        'sent_count',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'sent_count' => 'integer',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
