<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property CarbonInterface $transaction_date
 */
class CashTransaction extends Model
{
    protected $fillable = [
        'transaction_code',
        'type',
        'category',
        'amount',
        'transaction_date',
        'description',
        'payment_id',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'transaction_date' => 'date:Y-m-d',
        ];
    }

    /** @return BelongsTo<Payment, $this> */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
