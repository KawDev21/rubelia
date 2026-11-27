<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\CashTransaction;
use App\Models\ClassSession;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Student;
use App\Models\User;
use App\Services\BillingService;
use App\Services\WebPushService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function studentInvoices(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $student = $user->student()->with('educationLevel')->firstOrFail();

        $invoices = Invoice::query()
            ->where('student_id', $student->id)
            ->orderBy('billing_period')
            ->get();

        $payments = Payment::query()
            ->with('invoices:id,invoice_number,billing_period,amount')
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return Inertia::render('rubelia/finance/student-invoices', [
            'unpaidInvoices' => $invoices->where('status', 'unpaid')->values(),
            'pendingInvoices' => $invoices->where('status', 'pending_verification')->values(),
            'paidInvoices' => $invoices->where('status', 'paid')->sortByDesc('billing_period')->values(),
            'payments' => $payments,
            'bankInfo' => [
                'bank_name' => Setting::getValue('bank_name', 'BCA'),
                'bank_account_number' => Setting::getValue('bank_account_number', '-'),
                'bank_account_holder' => Setting::getValue('bank_account_holder', 'Rubelia'),
            ],
        ]);
    }

    public function submitTransferPayment(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $student = $user->student()->firstOrFail();

        $validated = $request->validate([
            'invoice_ids' => ['required', 'array', 'min:1'],
            'invoice_ids.*' => ['integer', 'exists:invoices,id'],
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:4096'],
        ]);

        $invoices = Invoice::query()
            ->where('student_id', $student->id)
            ->where('status', 'unpaid')
            ->whereIn('id', $validated['invoice_ids'])
            ->get();

        if ($invoices->count() !== count($validated['invoice_ids'])) {
            throw ValidationException::withMessages([
                'invoice_ids' => 'Satu atau lebih tagihan yang dipilih sudah dibayar atau sedang diverifikasi.',
            ]);
        }

        $proofPath = $request->file('proof')->store('payment-proofs', 'public');
        $totalAmount = (int) $invoices->sum('amount');

        DB::transaction(function () use ($student, $invoices, $totalAmount, $proofPath) {
            $payment = Payment::query()->create([
                'payment_code' => 'PAY-'.now()->format('YmdHis').'-'.strtoupper(Str::random(4)),
                'student_id' => $student->id,
                'method' => 'transfer',
                'total_amount' => $totalAmount,
                'proof_path' => $proofPath,
                'status' => 'pending',
                'paid_at' => now(),
            ]);

            $payment->invoices()->attach($invoices->pluck('id')->all());

            Invoice::query()
                ->whereIn('id', $invoices->pluck('id')->all())
                ->update(['status' => 'pending_verification']);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Bukti transfer berhasil dikirim. Menunggu verifikasi Admin/Owner.']);

        return back();
    }

    public function staffIndex(Request $request): Response
    {
        $month = (string) $request->query('month', now()->format('Y-m'));

        $pendingPayments = Payment::query()
            ->with(['student.user:id,name', 'student.educationLevel:id,name', 'invoices:id,invoice_number,billing_period,amount'])
            ->where('status', 'pending')
            ->latest()
            ->get();

        $recentPayments = Payment::query()
            ->with(['student.user:id,name', 'verifier:id,name', 'invoices:id,billing_period'])
            ->whereIn('status', ['approved', 'rejected'])
            ->latest('verified_at')
            ->limit(30)
            ->get();

        $unpaidInvoices = Invoice::query()
            ->with(['student.user:id,name', 'student.educationLevel:id,name'])
            ->where('status', 'unpaid')
            ->orderBy('billing_period')
            ->limit(150)
            ->get();

        $transactions = CashTransaction::query()
            ->with('creator:id,name')
            ->where('transaction_date', 'like', $month.'%')
            ->latest('transaction_date')
            ->latest('id')
            ->get();

        $incomeTotal = (int) $transactions->where('type', 'income')->sum('amount');
        $expenseTotal = (int) $transactions->where('type', 'expense')->sum('amount');

        return Inertia::render('rubelia/finance/staff-index', [
            'month' => $month,
            'pendingPayments' => $pendingPayments,
            'recentPayments' => $recentPayments,
            'unpaidInvoices' => $unpaidInvoices,
            'transactions' => $transactions,
            'summary' => [
                'incomeTotal' => $incomeTotal,
                'expenseTotal' => $expenseTotal,
                'netBalance' => $incomeTotal - $expenseTotal,
                'unpaidCount' => Invoice::query()->where('status', 'unpaid')->count(),
                'unpaidSum' => (int) Invoice::query()->where('status', 'unpaid')->sum('amount'),
            ],
        ]);
    }

    public function verifyPayment(
        Request $request,
        Payment $payment,
        WebPushService $webPush
    ): RedirectResponse {
        abort_unless($payment->status === 'pending', 422, 'Pembayaran ini sudah diproses.');

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'rejection_note' => ['nullable', 'required_if:decision,rejected', 'string', 'max:300'],
        ]);

        $staffId = (int) $request->user()?->id;

        DB::transaction(function () use ($payment, $validated, $staffId) {
            $now = now();
            $invoiceIds = $payment->invoices()->pluck('invoices.id')->all();

            if ($validated['decision'] === 'approved') {
                $payment->update([
                    'status' => 'approved',
                    'verified_by' => $staffId,
                    'verified_at' => $now,
                    'rejection_note' => null,
                ]);

                Invoice::query()->whereIn('id', $invoiceIds)->update([
                    'status' => 'paid',
                    'paid_at' => $now,
                ]);

                $student = $payment->student()->with('user')->first();
                $periods = $payment->invoices()->pluck('billing_period')->implode(', ');

                CashTransaction::query()->create([
                    'transaction_code' => 'TRX-'.$now->format('YmdHis').'-'.strtoupper(Str::random(4)),
                    'type' => 'income',
                    'category' => 'spp',
                    'amount' => $payment->total_amount,
                    'transaction_date' => $now->toDateString(),
                    'description' => 'Pembayaran SPP ('.$periods.') - '.($student ? $student->user->name : '-').' ('.$payment->payment_code.')',
                    'payment_id' => $payment->id,
                    'created_by' => $staffId,
                ]);
            } else {
                $payment->update([
                    'status' => 'rejected',
                    'rejection_note' => $validated['rejection_note'],
                    'verified_by' => $staffId,
                    'verified_at' => $now,
                ]);

                Invoice::query()->whereIn('id', $invoiceIds)->update([
                    'status' => 'unpaid',
                ]);
            }
        });

        $studentUserId = $payment->student?->user_id;
        if ($studentUserId) {
            $isAcc = $validated['decision'] === 'approved';
            $webPush->sendToUsers(
                [$studentUserId],
                $isAcc ? 'Pembayaran SPP Diverifikasi Lunas' : 'Bukti Pembayaran SPP Ditolak',
                $isAcc
                    ? 'Terima kasih, pembayaran SPP Anda sudah diverifikasi lunas. Kuitansi tersedia untuk diunduh.'
                    : 'Bukti transfer Anda belum sesuai: '.($validated['rejection_note'] ?? 'Silakan cek kembali.'),
                '/student/invoices'
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Verifikasi pembayaran berhasil disimpan.']);

        return back();
    }

    public function payCashDirect(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_ids' => ['required', 'array', 'min:1'],
            'invoice_ids.*' => ['integer', 'exists:invoices,id'],
        ]);

        $invoices = Invoice::query()
            ->with('student.user')
            ->where('status', 'unpaid')
            ->whereIn('id', $validated['invoice_ids'])
            ->get();

        if ($invoices->isEmpty()) {
            throw ValidationException::withMessages(['invoice_ids' => 'Tagihan tidak valid atau sudah lunas.']);
        }

        $studentIds = $invoices->pluck('student_id')->unique();
        if ($studentIds->count() > 1) {
            throw ValidationException::withMessages(['invoice_ids' => 'Pelunasan tunai harus untuk 1 murid yang sama per transaksi.']);
        }

        /** @var Student $student */
        $student = $invoices->first()->student;
        $totalAmount = (int) $invoices->sum('amount');
        $staffId = (int) $request->user()?->id;

        DB::transaction(function () use ($student, $invoices, $totalAmount, $staffId) {
            $now = now();
            $payment = Payment::query()->create([
                'payment_code' => 'PAY-'.$now->format('YmdHis').'-'.strtoupper(Str::random(4)),
                'student_id' => $student->id,
                'method' => 'cash',
                'total_amount' => $totalAmount,
                'status' => 'approved',
                'verified_by' => $staffId,
                'verified_at' => $now,
                'paid_at' => $now,
            ]);

            $payment->invoices()->attach($invoices->pluck('id')->all());

            Invoice::query()->whereIn('id', $invoices->pluck('id')->all())->update([
                'status' => 'paid',
                'paid_at' => $now,
            ]);

            $periods = $invoices->pluck('billing_period')->implode(', ');
            CashTransaction::query()->create([
                'transaction_code' => 'TRX-'.$now->format('YmdHis').'-'.strtoupper(Str::random(4)),
                'type' => 'income',
                'category' => 'spp',
                'amount' => $totalAmount,
                'transaction_date' => $now->toDateString(),
                'description' => 'Tunai SPP ('.$periods.') - '.$student->user->name,
                'payment_id' => $payment->id,
                'created_by' => $staffId,
            ]);
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pembayaran tunai berhasil dilunasi & tercatat di buku kas.']);

        return back();
    }

    public function generateMonthlyBills(
        Request $request,
        BillingService $billing,
        WebPushService $webPush
    ): RedirectResponse {
        $validated = $request->validate([
            'billing_period' => ['required', 'date_format:Y-m'],
        ]);

        $count = $billing->generateMonthlyInvoices($validated['billing_period'], $webPush, true);
        Inertia::flash('toast', ['type' => 'success', 'message' => "Berhasil menerbitkan {$count} tagihan SPP baru untuk periode {$validated['billing_period']}."]);

        return back();
    }

    public function storeCashTransaction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:income,expense'],
            'category' => ['required', 'in:spp,operasional,gaji_mentor,lainnya'],
            'amount' => ['required', 'integer', 'min:1'],
            'transaction_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
        ]);

        CashTransaction::query()->create([
            'transaction_code' => 'TRX-'.now()->format('YmdHis').'-'.strtoupper(Str::random(4)),
            ...$validated,
            'created_by' => $request->user()?->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Catatan kas berhasil ditambahkan.']);

        return back();
    }

    public function mentorPayroll(Request $request): Response
    {
        $month = (string) $request->query('month', now()->format('Y-m'));

        $mentors = User::query()
            ->with('mentorProfile')
            ->where('role', 'mentor')
            ->orderBy('name')
            ->get();

        $sessionsByMentor = ClassSession::query()
            ->with('studyClass:id,name')
            ->where('session_date', 'like', $month.'%')
            ->where('is_location_valid', true)
            ->orderByDesc('session_date')
            ->get()
            ->groupBy(fn (ClassSession $s): int => $s->taught_by_user_id);

        $payrollRows = $mentors->map(function (User $m) use ($sessionsByMentor) {
            $sessions = $sessionsByMentor->get($m->id) ?? collect();

            return [
                'mentor_id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'is_active' => $m->is_active,
                'fee_per_session' => $m->mentorProfile->fee_per_session ?? 0,
                'total_sessions' => $sessions->count(),
                'substitute_sessions' => $sessions->where('is_substitute', true)->count(),
                'late_sessions' => $sessions->where('late_minutes', '>', 0)->count(),
                'total_late_minutes' => (int) $sessions->sum('late_minutes'),
                'total_fee' => (int) $sessions->sum('mentor_fee_amount'),
                'details' => $sessions->map(fn (ClassSession $s) => [
                    'id' => $s->id,
                    'date' => $s->session_date->format('Y-m-d'),
                    'class_name' => $s->studyClass->name,
                    'session_number' => $s->session_number,
                    'scheduled_start' => $s->scheduled_start_time,
                    'checked_in_at' => $s->checked_in_at->format('H:i:s'),
                    'distance_meters' => $s->distance_meters,
                    'late_minutes' => $s->late_minutes,
                    'is_substitute' => $s->is_substitute,
                    'fee' => $s->mentor_fee_amount,
                ])->values(),
            ];
        });

        return Inertia::render('rubelia/finance/mentor-payroll', [
            'month' => $month,
            'payrollRows' => $payrollRows,
            'grandTotalFee' => (int) $payrollRows->sum('total_fee'),
        ]);
    }
}
