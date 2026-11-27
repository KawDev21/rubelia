<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\ClassEnrollment;
use App\Models\MentorLeaveRequest;
use App\Models\Setting;
use App\Models\StudentClassRequest;
use App\Models\StudyClass;
use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleRequestController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $maxSwitches = (int) Setting::getValue('max_class_switches_per_year', '2');
        $currentYear = now()->year;

        if ($user->isStudent()) {
            $student = $user->student()->with(['educationLevel', 'activeEnrollment.studyClass.mentor'])->firstOrFail();
            $currentClassId = $student->activeEnrollment?->study_class_id;

            $usedThisYear = StudentClassRequest::query()
                ->where('student_id', $student->id)
                ->whereYear('created_at', $currentYear)
                ->whereIn('status', ['pending', 'approved'])
                ->count();

            $availableClasses = StudyClass::query()
                ->with('mentor:id,name')
                ->withCount('activeEnrollments')
                ->where('education_level_id', $student->education_level_id)
                ->where('is_active', true)
                ->when($currentClassId, fn ($q) => $q->where('id', '!=', $currentClassId))
                ->orderBy('session_number')
                ->get()
                ->filter(fn (StudyClass $c) => $c->active_enrollments_count < $c->quota)
                ->values()
                ->map(fn (StudyClass $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'days' => $c->days ?? [],
                    'session_number' => $c->session_number,
                    'start_time' => $c->start_time,
                    'end_time' => $c->end_time,
                    'mentor_name' => $c->mentor->name ?? '-',
                    'remaining_quota' => $c->quota - $c->active_enrollments_count,
                ]);

            $myRequests = StudentClassRequest::query()
                ->with(['fromClass:id,name', 'toClass:id,name', 'reviewer:id,name'])
                ->where('student_id', $student->id)
                ->latest()
                ->get();

            return Inertia::render('rubelia/schedule-requests/index', [
                'roleView' => 'student',
                'studentContext' => [
                    'currentClass' => $student->activeEnrollment?->studyClass ? [
                        'id' => $student->activeEnrollment->studyClass->id,
                        'name' => $student->activeEnrollment->studyClass->name,
                        'days' => $student->activeEnrollment->studyClass->days ?? [],
                        'session_number' => $student->activeEnrollment->studyClass->session_number,
                        'start_time' => $student->activeEnrollment->studyClass->start_time,
                        'end_time' => $student->activeEnrollment->studyClass->end_time,
                    ] : null,
                    'maxSwitchesPerYear' => $maxSwitches,
                    'usedThisYear' => $usedThisYear,
                    'remainingSwitches' => max(0, $maxSwitches - $usedThisYear),
                    'availableClasses' => $availableClasses,
                    'requests' => $myRequests,
                ],
            ]);
        }

        if ($user->isMentor()) {
            $myClasses = StudyClass::query()
                ->with('educationLevel:id,name')
                ->where('mentor_id', $user->id)
                ->where('is_active', true)
                ->orderBy('session_number')
                ->get(['id', 'education_level_id', 'name', 'days', 'session_number', 'start_time', 'end_time']);

            $myLeaveRequests = MentorLeaveRequest::query()
                ->with(['studyClass:id,name,session_number,start_time,end_time', 'substitute:id,name,role'])
                ->where('mentor_id', $user->id)
                ->latest()
                ->get();

            $assignedSubstitutions = MentorLeaveRequest::query()
                ->with(['mentor:id,name', 'studyClass:id,name,session_number,start_time,end_time'])
                ->where('substitute_user_id', $user->id)
                ->where('status', 'approved')
                ->latest('session_date')
                ->get();

            return Inertia::render('rubelia/schedule-requests/index', [
                'roleView' => 'mentor',
                'mentorContext' => [
                    'classes' => $myClasses,
                    'leaveRequests' => $myLeaveRequests,
                    'substitutions' => $assignedSubstitutions,
                ],
            ]);
        }

        $studentRequests = StudentClassRequest::query()
            ->with([
                'student.user:id,name',
                'student.educationLevel:id,name',
                'fromClass:id,name,session_number,start_time,end_time',
                'toClass:id,name,session_number,start_time,end_time,quota',
                'reviewer:id,name',
            ])
            ->latest()
            ->limit(100)
            ->get();

        $mentorRequests = MentorLeaveRequest::query()
            ->with([
                'mentor:id,name',
                'studyClass:id,name,session_number,start_time,end_time',
                'substitute:id,name,role',
                'reviewer:id,name',
            ])
            ->latest()
            ->limit(100)
            ->get();

        $substituteCandidates = User::query()
            ->whereIn('role', ['mentor', 'master'])
            ->where('is_active', true)
            ->orderByRaw("CASE role WHEN 'mentor' THEN 1 ELSE 2 END")
            ->orderBy('name')
            ->get(['id', 'name', 'role']);

        return Inertia::render('rubelia/schedule-requests/index', [
            'roleView' => $user->role,
            'staffContext' => [
                'studentRequests' => $studentRequests,
                'mentorRequests' => $mentorRequests,
                'substituteCandidates' => $substituteCandidates,
            ],
        ]);
    }

    public function storeStudentRequest(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $student = $user->student()->with('activeEnrollment')->firstOrFail();
        $fromClassId = $student->activeEnrollment?->study_class_id;

        if (! $fromClassId) {
            throw ValidationException::withMessages(['to_class_id' => 'Anda belum terdaftar pada kelas aktif.']);
        }

        $maxSwitches = (int) Setting::getValue('max_class_switches_per_year', '2');
        $usedThisYear = StudentClassRequest::query()
            ->where('student_id', $student->id)
            ->whereYear('created_at', now()->year)
            ->whereIn('status', ['pending', 'approved'])
            ->count();

        if ($usedThisYear >= $maxSwitches) {
            throw ValidationException::withMessages([
                'to_class_id' => "Batas pengajuan pindah kelas tahun ini ({$maxSwitches}x per tahun) sudah habis.",
            ]);
        }

        $validated = $request->validate([
            'to_class_id' => ['required', 'exists:study_classes,id'],
            'type' => ['required', 'in:permanent,temporary'],
            'temporary_date' => ['nullable', 'required_if:type,temporary', 'date', 'after_or_equal:today'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        /** @var StudyClass $targetClass */
        $targetClass = StudyClass::query()->withCount('activeEnrollments')->findOrFail($validated['to_class_id']);
        if ($targetClass->education_level_id !== $student->education_level_id || $targetClass->id === $fromClassId) {
            throw ValidationException::withMessages(['to_class_id' => 'Kelas tujuan tidak valid.']);
        }

        if ($targetClass->active_enrollments_count >= $targetClass->quota) {
            throw ValidationException::withMessages(['to_class_id' => 'Slot kelas tujuan sudah penuh.']);
        }

        StudentClassRequest::query()->create([
            'student_id' => $student->id,
            'from_class_id' => $fromClassId,
            'to_class_id' => $targetClass->id,
            'type' => $validated['type'],
            'temporary_date' => $validated['type'] === 'temporary' ? $validated['temporary_date'] : null,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan pindah kelas/jadwal berhasil dikirim dan menunggu persetujuan Admin/Owner.']);

        return back();
    }

    public function reviewStudentRequest(
        Request $request,
        StudentClassRequest $studentClassRequest,
        WebPushService $webPush
    ): RedirectResponse {
        abort_unless($studentClassRequest->status === 'pending', 422, 'Pengajuan ini sudah diproses.');

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'review_note' => ['nullable', 'string', 'max:300'],
        ]);

        DB::transaction(function () use ($request, $studentClassRequest, $validated) {
            if ($validated['decision'] === 'approved' && $studentClassRequest->type === 'permanent') {
                /** @var StudyClass $targetClass */
                $targetClass = StudyClass::query()->withCount('activeEnrollments')->findOrFail($studentClassRequest->to_class_id);
                if ($targetClass->active_enrollments_count >= $targetClass->quota) {
                    throw ValidationException::withMessages(['decision' => 'Kuota kelas tujuan saat ini sudah penuh.']);
                }

                ClassEnrollment::query()
                    ->where('student_id', $studentClassRequest->student_id)
                    ->where('status', 'active')
                    ->update(['status' => 'transferred', 'ended_at' => now()->toDateString()]);

                ClassEnrollment::query()->create([
                    'student_id' => $studentClassRequest->student_id,
                    'study_class_id' => $targetClass->id,
                    'status' => 'active',
                    'started_at' => now()->toDateString(),
                ]);
            }

            $studentClassRequest->update([
                'status' => $validated['decision'],
                'reviewed_by' => $request->user()?->id,
                'reviewed_at' => now(),
                'review_note' => $validated['review_note'] ?? null,
            ]);
        });

        $studentUserId = $studentClassRequest->student?->user_id;
        if ($studentUserId) {
            $statusLabel = $validated['decision'] === 'approved' ? 'DISETUJUI' : 'DITOLAK';
            $webPush->sendToUsers(
                [$studentUserId],
                "Pengajuan Jadwal {$statusLabel}",
                'Silakan buka aplikasi Rubelia untuk melihat detail keputusan pengajuan kelas Anda.',
                '/schedule-requests'
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan kelas murid berhasil diproses.']);

        return back();
    }

    public function storeMentorRequest(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $validated = $request->validate([
            'study_class_id' => ['required', 'exists:study_classes,id'],
            'session_date' => ['required', 'date', 'after_or_equal:today'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $studyClass = StudyClass::query()
            ->where('id', $validated['study_class_id'])
            ->where('mentor_id', $user->id)
            ->firstOrFail();

        MentorLeaveRequest::query()->create([
            'mentor_id' => $user->id,
            'study_class_id' => $studyClass->id,
            'session_date' => $validated['session_date'],
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan izin/ganti jadwal mentor berhasil dikirim.']);

        return back();
    }

    public function reviewMentorRequest(
        Request $request,
        MentorLeaveRequest $mentorLeaveRequest,
        WebPushService $webPush
    ): RedirectResponse {
        abort_unless($mentorLeaveRequest->status === 'pending', 422, 'Pengajuan ini sudah diproses.');

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'substitute_user_id' => ['nullable', 'required_if:decision,approved', 'exists:users,id'],
            'review_note' => ['nullable', 'string', 'max:300'],
        ]);

        if ($validated['decision'] === 'approved') {
            $sub = User::query()->findOrFail((int) $validated['substitute_user_id']);
            if (! in_array($sub->role, ['mentor', 'master'], true) || $sub->id === $mentorLeaveRequest->mentor_id) {
                throw ValidationException::withMessages([
                    'substitute_user_id' => 'Pengajar pengganti harus Mentor lain yang aktif atau Owner (Master).',
                ]);
            }
        }

        $mentorLeaveRequest->update([
            'status' => $validated['decision'],
            'substitute_user_id' => $validated['decision'] === 'approved' ? $validated['substitute_user_id'] : null,
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'review_note' => $validated['review_note'] ?? null,
        ]);

        $notifyIds = [$mentorLeaveRequest->mentor_id];
        if ($validated['decision'] === 'approved' && ! empty($validated['substitute_user_id'])) {
            $notifyIds[] = (int) $validated['substitute_user_id'];
        }

        $webPush->sendToUsers(
            $notifyIds,
            'Update Jadwal Mengajar Rubelia',
            'Pengajuan izin/pengganti kelas telah diperbarui oleh manajemen.',
            '/schedule-requests'
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan izin mentor & penunjukan pengganti berhasil disimpan.']);

        return back();
    }
}
