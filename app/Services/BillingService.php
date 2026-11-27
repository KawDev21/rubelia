<?php

namespace App\Services;

use App\Models\CashTransaction;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Student;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BillingService
{
    /**
     * Bills on the 28th of each month; if the 28th is Sunday, bills on Saturday the 27th.
     */
    public function isBillingTriggerDate(Carbon $date): bool
    {
        $twentyEighth = $date->copy()->startOfMonth()->day(28);

        if ($twentyEighth->isSunday()) {
            return $date->day === 27;
        }

        return $date->day === 28;
    }

    public function createInitialPaidInvoice(Student $student, int $amount, int $staffUserId): Invoice
    {
        return DB::transaction(function () use ($student, $amount, $staffUserId) {
            $period = Carbon::parse($student->enrolled_at)->format('Y-m');
            $now = now();

            $invoice = Invoice::query()->create([
                'invoice_number' => $this->nextInvoiceNumber($period, $student->id),
                'student_id' => $student->id,
                'billing_period' => $period,
                'description' => 'SPP Bulan Pertama / Pendaftaran ('.$period.')',
                'amount' => $amount,
                'due_date' => $now->toDateString(),
                'status' => 'paid',
                'paid_at' => $now,
            ]);

            $payment = Payment::query()->create([
                'payment_code' => 'PAY-'.$now->format('YmdHis').'-'.strtoupper(Str::random(4)),
                'student_id' => $student->id,
                'method' => 'cash',
                'total_amount' => $amount,
                'status' => 'approved',
                'verified_by' => $staffUserId,
                'verified_at' => $now,
                'paid_at' => $now,
            ]);

            $payment->invoices()->attach($invoice->id);

            $studentName = $student->user->name;
            CashTransaction::query()->create([
                'transaction_code' => 'TRX-'.$now->format('YmdHis').'-'.strtoupper(Str::random(4)),
                'type' => 'income',
                'category' => 'spp',
                'amount' => $amount,
                'transaction_date' => $now->toDateString(),
                'description' => "Pendaftaran & SPP Bulan Pertama - {$studentName} ({$student->student_code})",
                'payment_id' => $payment->id,
                'created_by' => $staffUserId,
            ]);

            return $invoice;
        });
    }

    /**
     * Generate monthly SPP invoices for all active students for the target period (e.g. next month when billed on 28th, or explicit YYYY-MM).
     */
    public function generateMonthlyInvoices(string $billingPeriod, WebPushService $webPush, bool $sendPush = true): int
    {
        $students = Student::query()
            ->with(['user', 'educationLevel'])
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->get();

        $createdCount = 0;
        $notifiedUserIds = [];
        $dueDate = Carbon::createFromFormat('Y-m', $billingPeriod)->startOfMonth()->addDays(9)->toDateString();

        foreach ($students as $student) {
            $fee = $student->educationLevel->monthly_fee;
            if ($fee <= 0) {
                continue;
            }

            $exists = Invoice::query()
                ->where('student_id', $student->id)
                ->where('billing_period', $billingPeriod)
                ->exists();

            if ($exists) {
                continue;
            }

            Invoice::query()->create([
                'invoice_number' => $this->nextInvoiceNumber($billingPeriod, $student->id),
                'student_id' => $student->id,
                'billing_period' => $billingPeriod,
                'description' => 'Tagihan SPP Periode '.$billingPeriod.' ('.$student->educationLevel->name.')',
                'amount' => $fee,
                'due_date' => $dueDate,
                'status' => 'unpaid',
            ]);

            $createdCount++;
            $notifiedUserIds[] = $student->user_id;
        }

        if ($sendPush && $notifiedUserIds !== []) {
            $webPush->sendToUsers(
                $notifiedUserIds,
                'Tagihan SPP Rubelia Terbit',
                "Tagihan SPP periode {$billingPeriod} sudah tersedia. Silakan cek menu Tagihan SPP untuk pembayaran.",
                '/student/invoices'
            );
        }

        return $createdCount;
    }

    public function nextInvoiceNumber(string $period, int $studentId): string
    {
        $compactPeriod = str_replace('-', '', $period);

        return 'INV-'.$compactPeriod.'-'.str_pad((string) $studentId, 4, '0', STR_PAD_LEFT).'-'.strtoupper(Str::random(3));
    }
}
