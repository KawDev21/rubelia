<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\ClassEnrollment;
use App\Models\EducationLevel;
use App\Models\Student;
use App\Models\StudyClass;
use App\Models\User;
use App\Services\BillingService;
use App\Services\ExportService;
use App\Services\RubeliaAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class StudentManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $levelId = (string) $request->query('level_id', '');
        $classId = (string) $request->query('class_id', '');

        $students = Student::query()
            ->with([
                'user:id,name,email,birth_date,is_active',
                'educationLevel:id,name,slug,monthly_fee',
                'activeEnrollment.studyClass:id,name,session_number,start_time,end_time,days',
            ])
            ->when($levelId !== '', fn ($q) => $q->where('education_level_id', $levelId))
            ->when($classId !== '', fn ($q) => $q->whereHas('activeEnrollment', fn ($e) => $e->where('study_class_id', $classId)))
            ->when($search !== '', fn ($q) => $q->where(function ($sub) use ($search) {
                $sub->where('student_code', 'like', "%{$search}%")
                    ->orWhere('guardian_name', 'like', "%{$search}%")
                    ->orWhere('guardian_phone', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            }))
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Student $s) => [
                'id' => $s->id,
                'user_id' => $s->user_id,
                'student_code' => $s->student_code,
                'name' => $s->user->name,
                'email' => $s->user->email,
                'birth_date' => $s->user->birth_date?->format('Y-m-d'),
                'is_active' => $s->user->is_active,
                'education_level_id' => $s->education_level_id,
                'level_name' => $s->educationLevel->name,
                'level_slug' => $s->educationLevel->slug,
                'guardian_name' => $s->guardian_name,
                'guardian_phone' => $s->guardian_phone,
                'school_name' => $s->school_name,
                'address' => $s->address,
                'enrolled_at' => $s->enrolled_at->format('Y-m-d'),
                'active_class_id' => $s->activeEnrollment?->study_class_id,
                'active_class_name' => $s->activeEnrollment?->studyClass->name,
                'active_class_schedule' => $s->activeEnrollment?->studyClass
                    ? implode(', ', $s->activeEnrollment->studyClass->days ?? []).' (Sesi '.$s->activeEnrollment->studyClass->session_number.': '.$s->activeEnrollment->studyClass->start_time.'-'.$s->activeEnrollment->studyClass->end_time.')'
                    : 'Belum masuk kelas',
            ]);

        $availableClasses = StudyClass::query()
            ->with('mentor:id,name')
            ->withCount('activeEnrollments')
            ->where('is_active', true)
            ->orderBy('education_level_id')
            ->orderBy('session_number')
            ->get()
            ->map(fn (StudyClass $c) => [
                'id' => $c->id,
                'education_level_id' => $c->education_level_id,
                'name' => $c->name,
                'mentor_name' => $c->mentor->name ?? '-',
                'days' => $c->days ?? [],
                'session_number' => $c->session_number,
                'start_time' => $c->start_time,
                'end_time' => $c->end_time,
                'quota' => $c->quota,
                'enrolled_count' => $c->active_enrollments_count,
                'remaining_quota' => max(0, $c->quota - $c->active_enrollments_count),
            ]);

        return Inertia::render('rubelia/students/index', [
            'students' => $students,
            'levels' => EducationLevel::query()->orderBy('sort_order')->get(['id', 'name', 'slug', 'monthly_fee']),
            'classes' => $availableClasses,
            'filters' => [
                'search' => $search,
                'level_id' => $levelId,
                'class_id' => $classId,
            ],
            'createdStudentCredentials' => $request->session()->get('created_student_credentials'),
        ]);
    }

    public function store(
        Request $request,
        RubeliaAccountService $accounts,
        BillingService $billing
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'birth_date' => ['required', 'date'],
            'education_level_id' => ['required', 'exists:education_levels,id'],
            'study_class_id' => ['required', 'exists:study_classes,id'],
            'guardian_name' => ['required', 'string', 'max:120'],
            'guardian_phone' => ['required', 'string', 'max:30'],
            'school_name' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        /** @var StudyClass $studyClass */
        $studyClass = StudyClass::query()->withCount('activeEnrollments')->findOrFail($validated['study_class_id']);
        if ((int) $studyClass->education_level_id !== (int) $validated['education_level_id']) {
            throw ValidationException::withMessages([
                'study_class_id' => 'Kelas yang dipilih tidak sesuai dengan jenjang murid.',
            ]);
        }

        if ($studyClass->active_enrollments_count >= $studyClass->quota) {
            throw ValidationException::withMessages([
                'study_class_id' => 'Kuota kelas ini sudah penuh. Silakan pilih kelas lain yang masih memiliki slot.',
            ]);
        }

        /** @var EducationLevel $level */
        $level = EducationLevel::query()->findOrFail($validated['education_level_id']);
        $staffId = (int) $request->user()?->id;

        $creds = DB::transaction(function () use ($validated, $accounts, $billing, $level, $studyClass, $staffId) {
            $enrolledAt = now();
            $generated = $accounts->generateStudentCredentials($enrolledAt);
            $plainPassword = $accounts->birthDatePassword($validated['birth_date']);

            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $generated['email'],
                'role' => 'student',
                'birth_date' => $validated['birth_date'],
                'phone' => $validated['guardian_phone'],
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => $plainPassword,
            ]);

            $student = Student::query()->create([
                'user_id' => $user->id,
                'student_code' => $generated['code'],
                'education_level_id' => $level->id,
                'guardian_name' => $validated['guardian_name'],
                'guardian_phone' => $validated['guardian_phone'],
                'school_name' => $validated['school_name'] ?? null,
                'address' => $validated['address'] ?? null,
                'enrolled_at' => $enrolledAt->toDateString(),
            ]);

            ClassEnrollment::query()->create([
                'student_id' => $student->id,
                'study_class_id' => $studyClass->id,
                'status' => 'active',
                'started_at' => $enrolledAt->toDateString(),
            ]);

            $student->setRelation('user', $user);
            $invoice = $billing->createInitialPaidInvoice($student, $level->monthly_fee, $staffId);

            return [
                'student_code' => $generated['code'],
                'name' => $user->name,
                'guardian_name' => $student->guardian_name,
                'email' => $generated['email'],
                'display_email' => $generated['display_email'],
                'password' => $plainPassword,
                'class_name' => $studyClass->name,
                'paid_amount' => $level->monthly_fee,
                'invoice_number' => $invoice->invoice_number,
            ];
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Murid berhasil didaftarkan & SPP bulan pertama tercatat lunas.']);

        return back()->with('created_student_credentials', $creds);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'birth_date' => ['required', 'date'],
            'education_level_id' => ['required', 'exists:education_levels,id'],
            'study_class_id' => ['nullable', 'exists:study_classes,id'],
            'guardian_name' => ['required', 'string', 'max:120'],
            'guardian_phone' => ['required', 'string', 'max:30'],
            'school_name' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'is_active' => ['required', 'boolean'],
        ]);

        DB::transaction(function () use ($student, $validated) {
            $student->user?->update([
                'name' => $validated['name'],
                'birth_date' => $validated['birth_date'],
                'phone' => $validated['guardian_phone'],
                'is_active' => $validated['is_active'],
            ]);

            $student->update([
                'education_level_id' => $validated['education_level_id'],
                'guardian_name' => $validated['guardian_name'],
                'guardian_phone' => $validated['guardian_phone'],
                'school_name' => $validated['school_name'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            $currentClassId = $student->activeEnrollment?->study_class_id;
            $newClassId = isset($validated['study_class_id']) ? (int) $validated['study_class_id'] : null;

            if ($newClassId && $newClassId !== $currentClassId) {
                $targetClass = StudyClass::query()->withCount('activeEnrollments')->findOrFail($newClassId);
                if ($targetClass->active_enrollments_count >= $targetClass->quota) {
                    throw ValidationException::withMessages([
                        'study_class_id' => 'Kuota kelas tujuan sudah penuh.',
                    ]);
                }

                ClassEnrollment::query()
                    ->where('student_id', $student->id)
                    ->where('status', 'active')
                    ->update(['status' => 'transferred', 'ended_at' => now()->toDateString()]);

                ClassEnrollment::query()->create([
                    'student_id' => $student->id,
                    'study_class_id' => $newClassId,
                    'status' => 'active',
                    'started_at' => now()->toDateString(),
                ]);
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data murid berhasil diperbarui.']);

        return back();
    }

    public function resetPassword(Student $student, RubeliaAccountService $accounts): RedirectResponse
    {
        $user = $student->user;
        abort_unless($user && $user->birth_date, 422, 'Tanggal lahir murid belum diatur.');

        $plainPassword = $accounts->birthDatePassword($user->birth_date);
        $user->update(['password' => $plainPassword]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Password akun {$user->name} direset ke {$plainPassword}."]);

        return back()->with('created_student_credentials', [
            'student_code' => $student->student_code,
            'name' => $user->name,
            'guardian_name' => $student->guardian_name,
            'email' => $user->email,
            'display_email' => $student->student_code.'@rubelia.com',
            'password' => $plainPassword,
            'class_name' => $student->activeEnrollment->studyClass->name ?? '-',
            'paid_amount' => 0,
            'invoice_number' => '-',
        ]);
    }

    public function downloadImportTemplate(ExportService $export): StreamedResponse
    {
        return $export->downloadExcel(
            'template-import-murid-rubelia.xlsx',
            ['Nama Murid', 'Tanggal Lahir (YYYY-MM-DD)', 'Jenjang (Bimba/SD/SMP/SMA/SMK)', 'Nama Kelas (Opsional)', 'Nama Wali Murid', 'No WA Wali', 'Asal Sekolah', 'Alamat'],
            [
                ['Budi Pratama', '2013-07-21', 'SMP', 'SMP Unggulan A - Sesi 5', 'Agus Pratama', '081234567890', 'SMPN 1', 'Jl. Mawar No. 5'],
            ]
        );
    }

    public function importExcel(
        Request $request,
        ExportService $export,
        RubeliaAccountService $accounts
    ): RedirectResponse {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx'],
        ]);

        $file = $request->file('file');
        $rows = $export->readExcelRows($file->getRealPath());
        $levels = EducationLevel::query()->get()->keyBy(fn (EducationLevel $l) => strtolower($l->name));
        $classes = StudyClass::query()->where('is_active', true)->get()->keyBy(fn (StudyClass $c) => strtolower($c->name));

        $imported = 0;
        DB::transaction(function () use ($rows, $levels, $classes, $accounts, &$imported) {
            foreach ($rows as $cells) {
                [$name, $birthDateRaw, $levelName, $className, $guardianName, $guardianPhone, $schoolName, $address] = array_pad($cells, 8, '');
                if ($name === '' || $birthDateRaw === '' || $guardianPhone === '') {
                    continue;
                }

                try {
                    $birthDate = Carbon::parse($birthDateRaw)->format('Y-m-d');
                } catch (Throwable) {
                    continue;
                }

                $levelKey = strtolower($levelName);
                $level = $levels->get($levelKey)
                    ?? ($levelKey === 'sma' || $levelKey === 'smk' ? $levels->get('sma/smk') : null)
                    ?? $levels->first();

                if (! $level) {
                    continue;
                }

                $creds = $accounts->generateStudentCredentials(now());
                $user = User::query()->create([
                    'name' => $name,
                    'email' => $creds['email'],
                    'role' => 'student',
                    'birth_date' => $birthDate,
                    'phone' => $guardianPhone,
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'password' => $accounts->birthDatePassword($birthDate),
                ]);

                $student = Student::query()->create([
                    'user_id' => $user->id,
                    'student_code' => $creds['code'],
                    'education_level_id' => $level->id,
                    'guardian_name' => $guardianName !== '' ? $guardianName : 'Wali '.$name,
                    'guardian_phone' => $guardianPhone,
                    'school_name' => $schoolName ?: null,
                    'address' => $address ?: null,
                    'enrolled_at' => now()->toDateString(),
                ]);

                if ($className !== '' && $classes->has(strtolower($className))) {
                    $cls = $classes->get(strtolower($className));
                    ClassEnrollment::query()->create([
                        'student_id' => $student->id,
                        'study_class_id' => $cls->id,
                        'status' => 'active',
                        'started_at' => now()->toDateString(),
                    ]);
                }

                $imported++;
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => "Berhasil mengimpor {$imported} data murid aktif dari Excel."]);

        return back();
    }
}
