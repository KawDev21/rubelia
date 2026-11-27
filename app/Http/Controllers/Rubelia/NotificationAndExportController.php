<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\Broadcast;
use App\Models\CashTransaction;
use App\Models\ClassSession;
use App\Models\MentorEvaluation;
use App\Models\Payment;
use App\Models\PushSubscription;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentGrade;
use App\Models\User;
use App\Services\ExportService;
use App\Services\WebPushService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificationAndExportController extends Controller
{
    public function broadcastsIndex(): Response
    {
        return Inertia::render('rubelia/broadcasts/index', [
            'broadcasts' => Broadcast::query()->with('creator:id,name')->latest()->limit(50)->get(),
            'subscriberCount' => PushSubscription::query()->count(),
        ]);
    }

    public function sendBroadcast(Request $request, WebPushService $webPush): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:500'],
            'target_role' => ['required', 'in:all,student,mentor,admin'],
        ]);

        $targetUserIds = User::query()
            ->where('is_active', true)
            ->when($validated['target_role'] !== 'all', fn ($q) => $q->where('role', $validated['target_role']))
            ->pluck('id');

        $sentCount = $webPush->sendToUsers($targetUserIds, $validated['title'], $validated['body'], '/dashboard');

        Broadcast::query()->create([
            ...$validated,
            'sent_count' => $sentCount,
            'created_by' => $request->user()?->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Broadcast diterbitkan ({$sentCount} perangkat HP menerima push notifikasi)."]);

        return back();
    }

    public function storePushSubscription(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'endpoint' => ['required', 'string'],
            'keys.p256dh' => ['nullable', 'string'],
            'keys.auth' => ['nullable', 'string'],
            'contentEncoding' => ['nullable', 'string', 'max:30'],
        ]);

        PushSubscription::query()->updateOrCreate(
            ['endpoint_hash' => hash('sha256', $validated['endpoint'])],
            [
                'user_id' => $user->id,
                'endpoint' => $validated['endpoint'],
                'public_key' => $validated['keys']['p256dh'] ?? null,
                'auth_token' => $validated['keys']['auth'] ?? null,
                'content_encoding' => $validated['contentEncoding'] ?? 'aesgcm',
                'user_agent' => substr((string) $request->userAgent(), 0, 240),
            ]
        );

        return response()->json(['ok' => true]);
    }

    public function destroyPushSubscription(Request $request): JsonResponse
    {
        $endpoint = (string) $request->input('endpoint', '');
        if ($endpoint !== '') {
            PushSubscription::query()
                ->where('user_id', $request->user()?->id)
                ->where('endpoint_hash', hash('sha256', $endpoint))
                ->delete();
        }

        return response()->json(['ok' => true]);
    }

    public function paymentReceiptPdf(Request $request, Payment $payment, ExportService $export): HttpResponse
    {
        /** @var User $user */
        $user = $request->user();
        $payment->load(['student.user', 'student.educationLevel', 'invoices', 'verifier']);

        if ($user->isStudent()) {
            abort_unless($payment->student->user_id === $user->id, 403);
        } else {
            abort_unless($user->isStaff(), 403);
        }

        abort_unless($payment->status === 'approved', 422, 'Kuitansi hanya tersedia untuk pembayaran yang sudah lunas.');

        return $export->downloadPdf('exports.receipt', [
            'officeName' => Setting::getValue('office_name', 'Bimbingan Belajar Rubelia'),
            'officeAddress' => Setting::getValue('office_address', ''),
            'payment' => $payment,
        ], 'kuitansi-'.$payment->payment_code.'.pdf');
    }

    public function exportReport(
        Request $request,
        string $type,
        string $format,
        ExportService $export
    ): HttpResponse|StreamedResponse {
        /** @var User $user */
        $user = $request->user();
        abort_unless(in_array($format, ['pdf', 'excel'], true), 404);

        [$title, $headers, $rows] = match ($type) {
            'student-grades' => $this->buildGradesReport($user),
            'student-attendance' => $this->buildStudentAttendanceReport($user),
            'mentor-attendance' => $this->buildMentorAttendanceReport($user, (string) $request->query('month', '')),
            'mentor-evaluations' => $this->buildEvaluationsReport($user, (int) $request->query('year', now()->year)),
            'students' => $this->buildStudentsReport($user),
            'finance' => $this->buildFinanceReport($user, (string) $request->query('month', now()->format('Y-m'))),
            default => abort(404),
        };

        $slug = $type.'-'.now()->format('Ymd');

        if ($format === 'excel') {
            return $export->downloadExcel($slug.'.xlsx', $headers, $rows);
        }

        return $export->downloadPdf('exports.table-report', [
            'officeName' => Setting::getValue('office_name', 'Bimbingan Belajar Rubelia'),
            'title' => $title,
            'generatedAt' => now()->format('d M Y H:i'),
            'headers' => $headers,
            'rows' => $rows,
        ], $slug.'.pdf', count($headers) > 6 ? 'landscape' : 'portrait');
    }

    /** @return array{0: string, 1: array<int, string>, 2: array<int, array<int, string|int|float>>} */
    private function buildGradesReport(User $user): array
    {
        if ($user->isStudent()) {
            $student = $user->student()->firstOrFail();
            $items = StudentGrade::query()->with(['studyClass', 'mentor'])->where('student_id', $student->id)->latest('graded_at')->get();

            return [
                'Daftar Nilai Murid - '.$user->name.' ('.$student->student_code.')',
                ['Tanggal', 'Kelas', 'Materi / Topik', 'Nilai', 'Mentor', 'Catatan'],
                $items->map(fn (StudentGrade $g) => [
                    $g->graded_at->format('d-m-Y'),
                    $g->studyClass->name ?? '-',
                    $g->subject_topic,
                    $g->score,
                    $g->mentor->name ?? '-',
                    $g->notes ?? '-',
                ])->all(),
            ];
        }

        abort_unless($user->isStaff() || $user->isMentor(), 403);
        $items = StudentGrade::query()
            ->with(['student.user', 'studyClass', 'mentor'])
            ->when($user->isMentor(), fn ($q) => $q->where('mentor_id', $user->id))
            ->latest('graded_at')
            ->get();

        return [
            'Rekap Daftar Nilai Murid Rubelia',
            ['Tanggal', 'Kode Murid', 'Nama Murid', 'Kelas', 'Materi / Topik', 'Nilai', 'Mentor'],
            $items->map(fn (StudentGrade $g) => [
                $g->graded_at->format('d-m-Y'),
                $g->student->student_code,
                $g->student->user->name,
                $g->studyClass->name ?? '-',
                $g->subject_topic,
                $g->score,
                $g->mentor->name ?? '-',
            ])->all(),
        ];
    }

    /** @return array{0: string, 1: array<int, string>, 2: array<int, array<int, string|int>>} */
    private function buildStudentAttendanceReport(User $user): array
    {
        if ($user->isStudent()) {
            $student = $user->student()->firstOrFail();
            $items = StudentAttendance::query()
                ->with(['classSession.studyClass', 'classSession.teacher'])
                ->where('student_id', $student->id)
                ->latest('id')
                ->get();

            return [
                'Daftar Kehadiran Murid - '.$user->name.' ('.$student->student_code.')',
                ['Tanggal', 'Kelas', 'Sesi', 'Pengajar', 'Status Kehadiran'],
                $items->map(fn (StudentAttendance $a) => [
                    $a->classSession->session_date->format('d-m-Y'),
                    $a->classSession->studyClass->name,
                    'Sesi '.$a->classSession->session_number,
                    $a->classSession->teacher->name,
                    strtoupper($a->status),
                ])->all(),
            ];
        }

        abort_unless($user->isStaff(), 403);
        $items = StudentAttendance::query()
            ->with(['student.user', 'classSession.studyClass', 'classSession.teacher'])
            ->latest('id')
            ->limit(2000)
            ->get();

        return [
            'Rekap Absensi Seluruh Murid Rubelia',
            ['Tanggal', 'Kode Murid', 'Nama Murid', 'Kelas', 'Pengajar', 'Status', 'WA Alpha'],
            $items->map(fn (StudentAttendance $a) => [
                $a->classSession->session_date->format('d-m-Y'),
                $a->student->student_code,
                $a->student->user->name,
                $a->classSession->studyClass->name,
                $a->classSession->teacher->name,
                strtoupper($a->status),
                $a->wa_notified_at ? $a->wa_notified_at->format('d-m-Y H:i') : '-',
            ])->all(),
        ];
    }

    /** @return array{0: string, 1: array<int, string>, 2: array<int, array<int, string|int>>} */
    private function buildMentorAttendanceReport(User $user, string $month): array
    {
        abort_unless($user->isMentor() || $user->isStaff(), 403);

        $items = ClassSession::query()
            ->with(['studyClass', 'teacher'])
            ->when($user->isMentor(), fn ($q) => $q->where('taught_by_user_id', $user->id))
            ->when($month !== '', fn ($q) => $q->where('session_date', 'like', $month.'%'))
            ->latest('session_date')
            ->get();

        return [
            'Rekap Kehadiran & Kinerja Sesi Mentor'.($month !== '' ? " ({$month})" : ''),
            ['Tanggal', 'Mentor', 'Kelas', 'Sesi', 'Jadwal', 'Jam Absen', 'Jarak GPS (m)', 'Telat (menit)', 'Fee Sesi (Rp)'],
            $items->map(fn (ClassSession $s) => [
                $s->session_date->format('d-m-Y'),
                $s->teacher->name,
                $s->studyClass->name,
                'Sesi '.$s->session_number,
                $s->scheduled_start_time,
                $s->checked_in_at->format('H:i:s'),
                $s->distance_meters,
                $s->late_minutes,
                $s->mentor_fee_amount,
            ])->all(),
        ];
    }

    /** @return array{0: string, 1: array<int, string>, 2: array<int, array<int, string|int>>} */
    private function buildEvaluationsReport(User $user, int $year): array
    {
        abort_unless($user->isStaff(), 403);

        $items = MentorEvaluation::query()
            ->with(['mentor', 'student.user', 'studyClass'])
            ->where('period_year', $year)
            ->latest()
            ->get();

        return [
            "Hasil Penilaian Tahunan Mentor oleh Murid ({$year})",
            ['Tahun', 'Nama Mentor', 'Kelas', 'Murid Pengisi', 'Ulasan & Evaluasi Mengajar'],
            $items->map(fn (MentorEvaluation $e) => [
                $e->period_year,
                $e->mentor->name,
                $e->studyClass->name ?? '-',
                $e->student->user->name,
                $e->review_text,
            ])->all(),
        ];
    }

    /** @return array{0: string, 1: array<int, string>, 2: array<int, array<int, string>>} */
    private function buildStudentsReport(User $user): array
    {
        abort_unless($user->isStaff(), 403);

        $items = Student::query()->with(['user', 'educationLevel', 'activeEnrollment.studyClass'])->orderBy('student_code')->get();

        return [
            'Daftar Murid Aktif & Wali Murid Rubelia',
            ['Kode Murid', 'Nama Murid', 'Email Login', 'Jenjang', 'Kelas Aktif', 'Nama Wali', 'No WA Wali', 'Status'],
            $items->map(fn (Student $s) => [
                $s->student_code,
                $s->user->name,
                $s->user->email,
                $s->educationLevel->name,
                $s->activeEnrollment->studyClass->name ?? '-',
                $s->guardian_name,
                $s->guardian_phone,
                $s->user->is_active ? 'AKTIF' : 'NONAKTIF',
            ])->all(),
        ];
    }

    /** @return array{0: string, 1: array<int, string>, 2: array<int, array<int, string|int>>} */
    private function buildFinanceReport(User $user, string $month): array
    {
        abort_unless($user->isStaff(), 403);

        $items = CashTransaction::query()
            ->with('creator')
            ->where('transaction_date', 'like', $month.'%')
            ->orderBy('transaction_date')
            ->get();

        return [
            "Laporan Buku Kas Keuangan Rubelia ({$month})",
            ['Tanggal', 'Kode Transaksi', 'Jenis', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Dicatat Oleh'],
            $items->map(fn (CashTransaction $t) => [
                $t->transaction_date->format('d-m-Y'),
                $t->transaction_code,
                $t->type === 'income' ? 'PEMASUKAN' : 'PENGELUARAN',
                strtoupper($t->category),
                $t->description,
                $t->amount,
                $t->creator->name ?? '-',
            ])->all(),
        ];
    }
}
