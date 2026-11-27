<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\Broadcast;
use App\Models\CashTransaction;
use App\Models\ClassSession;
use App\Models\EducationLevel;
use App\Models\Invoice;
use App\Models\MentorEvaluation;
use App\Models\MentorLeaveRequest;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudentAttendance;
use App\Models\StudentClassRequest;
use App\Models\StudentGrade;
use App\Models\StudyClass;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $today = Carbon::today();
        $dayMap = [
            1 => 'Senin',
            2 => 'Selasa',
            3 => 'Rabu',
            4 => 'Kamis',
            5 => 'Jumat',
            6 => 'Sabtu',
            0 => 'Minggu',
        ];
        $todayName = $dayMap[$today->dayOfWeek] ?? 'Senin';
        $currentMonth = $today->format('Y-m');

        $recentBroadcasts = Broadcast::query()
            ->whereIn('target_role', ['all', $user->role])
            ->latest()
            ->limit(4)
            ->get(['id', 'title', 'body', 'target_role', 'created_at']);

        if ($user->isStaff()) {
            $levels = EducationLevel::query()
                ->withCount([
                    'students as active_students_count' => fn ($q) => $q->whereHas('user', fn ($u) => $u->where('is_active', true)),
                ])
                ->orderBy('sort_order')
                ->get(['id', 'name', 'slug', 'monthly_fee']);

            $todayClasses = StudyClass::query()
                ->with(['educationLevel:id,name,slug', 'mentor:id,name'])
                ->withCount('activeEnrollments')
                ->where('is_active', true)
                ->get()
                ->filter(fn (StudyClass $cls) => in_array($todayName, $cls->days ?? [], true))
                ->sortBy('session_number')
                ->values();

            $todaySessionsMap = ClassSession::query()
                ->with('teacher:id,name')
                ->whereDate('session_date', $today)
                ->get()
                ->keyBy('study_class_id');

            $monthIncome = (int) CashTransaction::query()
                ->where('type', 'income')
                ->where('transaction_date', 'like', $currentMonth.'%')
                ->sum('amount');

            $monthExpense = (int) CashTransaction::query()
                ->where('type', 'expense')
                ->where('transaction_date', 'like', $currentMonth.'%')
                ->sum('amount');

            return Inertia::render('dashboard', [
                'roleView' => $user->role,
                'todayLabel' => $todayName.', '.$today->format('d M Y'),
                'broadcasts' => $recentBroadcasts,
                'staffStats' => [
                    'activeStudents' => Student::query()->whereHas('user', fn ($u) => $u->where('is_active', true))->count(),
                    'activeMentors' => User::query()->where('role', 'mentor')->where('is_active', true)->count(),
                    'activeClasses' => StudyClass::query()->where('is_active', true)->count(),
                    'unpaidInvoices' => Invoice::query()->where('status', 'unpaid')->count(),
                    'pendingPayments' => Payment::query()->where('status', 'pending')->count(),
                    'pendingRequests' => StudentClassRequest::query()->where('status', 'pending')->count()
                        + MentorLeaveRequest::query()->where('status', 'pending')->count(),
                    'monthIncome' => $monthIncome,
                    'monthExpense' => $monthExpense,
                    'levels' => $levels,
                    'todayClasses' => $todayClasses->map(fn (StudyClass $c) => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'level' => $c->educationLevel?->name,
                        'level_slug' => $c->educationLevel?->slug,
                        'session_number' => $c->session_number,
                        'start_time' => $c->start_time,
                        'end_time' => $c->end_time,
                        'mentor_name' => $c->mentor->name ?? 'Belum ditentukan',
                        'students_count' => $c->active_enrollments_count,
                        'quota' => $c->quota,
                        'checked_in' => $todaySessionsMap->has($c->id),
                        'taught_by' => $todaySessionsMap->get($c->id)?->teacher->name,
                        'late_minutes' => $todaySessionsMap->get($c->id)->late_minutes ?? 0,
                    ]),
                ],
            ]);
        }

        if ($user->isMentor()) {
            $substituteClassIds = MentorLeaveRequest::query()
                ->where('substitute_user_id', $user->id)
                ->where('status', 'approved')
                ->whereDate('session_date', $today)
                ->pluck('study_class_id')
                ->all();

            $onLeaveClassIds = MentorLeaveRequest::query()
                ->where('mentor_id', $user->id)
                ->where('status', 'approved')
                ->whereDate('session_date', $today)
                ->pluck('study_class_id')
                ->all();

            $todayClasses = StudyClass::query()
                ->with('educationLevel:id,name,slug')
                ->withCount('activeEnrollments')
                ->where('is_active', true)
                ->where(function ($q) use ($user, $substituteClassIds) {
                    $q->where('mentor_id', $user->id);
                    if ($substituteClassIds !== []) {
                        $q->orWhereIn('id', $substituteClassIds);
                    }
                })
                ->get()
                ->filter(fn (StudyClass $cls) => (in_array($todayName, $cls->days ?? [], true) || in_array($cls->id, $substituteClassIds, true))
                    && ! in_array($cls->id, $onLeaveClassIds, true))
                ->sortBy('session_number')
                ->values();

            $monthSessions = ClassSession::query()
                ->where('taught_by_user_id', $user->id)
                ->where('is_location_valid', true)
                ->where('session_date', 'like', $currentMonth.'%')
                ->get();

            $todayDoneIds = ClassSession::query()
                ->whereDate('session_date', $today)
                ->where('taught_by_user_id', $user->id)
                ->pluck('study_class_id')
                ->all();

            return Inertia::render('dashboard', [
                'roleView' => 'mentor',
                'todayLabel' => $todayName.', '.$today->format('d M Y'),
                'broadcasts' => $recentBroadcasts,
                'mentorStats' => [
                    'validSessionsMonth' => $monthSessions->count(),
                    'lateSessionsMonth' => $monthSessions->where('late_minutes', '>', 0)->count(),
                    'estimatedFeeMonth' => (int) $monthSessions->sum('mentor_fee_amount'),
                    'feePerSession' => $user->mentorProfile->fee_per_session ?? 0,
                    'todayClasses' => $todayClasses->map(fn (StudyClass $c) => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'level' => $c->educationLevel?->name,
                        'session_number' => $c->session_number,
                        'start_time' => $c->start_time,
                        'end_time' => $c->end_time,
                        'students_count' => $c->active_enrollments_count,
                        'is_substitute' => in_array($c->id, $substituteClassIds, true),
                        'checked_in' => in_array($c->id, $todayDoneIds, true),
                    ]),
                ],
            ]);
        }

        $student = $user->student()->with(['educationLevel', 'activeEnrollment.studyClass.mentor'])->first();
        $unpaidInvoices = $student
            ? Invoice::query()->where('student_id', $student->id)->whereIn('status', ['unpaid', 'pending_verification'])->orderBy('billing_period')->get()
            : collect();

        $attendanceCounts = $student
            ? StudentAttendance::query()
                ->where('student_id', $student->id)
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status')
            : collect();

        $recentGrades = $student
            ? StudentGrade::query()
                ->where('student_id', $student->id)
                ->latest('graded_at')
                ->limit(5)
                ->get(['id', 'subject_topic', 'graded_at', 'score', 'notes'])
            : collect();

        $evalOpen = Setting::getValue('evaluation_open', '0') === '1';
        $evalYear = (int) Setting::getValue('evaluation_year', (string) $today->year);
        $mentorId = $student?->activeEnrollment?->studyClass?->mentor_id;
        $alreadyEvaluated = ($student && $mentorId)
            ? MentorEvaluation::query()
                ->where('period_year', $evalYear)
                ->where('student_id', $student->id)
                ->where('mentor_id', $mentorId)
                ->exists()
            : false;

        return Inertia::render('dashboard', [
            'roleView' => 'student',
            'todayLabel' => $todayName.', '.$today->format('d M Y'),
            'broadcasts' => $recentBroadcasts,
            'studentStats' => [
                'studentCode' => $student?->student_code,
                'guardianName' => $student?->guardian_name,
                'levelName' => $student?->educationLevel?->name,
                'levelSlug' => $student?->educationLevel?->slug,
                'activeClass' => $student?->activeEnrollment?->studyClass ? [
                    'name' => $student->activeEnrollment->studyClass->name,
                    'days' => $student->activeEnrollment->studyClass->days,
                    'session_number' => $student->activeEnrollment->studyClass->session_number,
                    'start_time' => $student->activeEnrollment->studyClass->start_time,
                    'end_time' => $student->activeEnrollment->studyClass->end_time,
                    'mentor_name' => $student->activeEnrollment->studyClass->mentor->name ?? '-',
                ] : null,
                'unpaidCount' => $unpaidInvoices->where('status', 'unpaid')->count(),
                'unpaidTotal' => (int) $unpaidInvoices->where('status', 'unpaid')->sum('amount'),
                'pendingVerificationCount' => $unpaidInvoices->where('status', 'pending_verification')->count(),
                'attendance' => [
                    'hadir' => (int) ($attendanceCounts['hadir'] ?? 0),
                    'sakit' => (int) ($attendanceCounts['sakit'] ?? 0),
                    'izin' => (int) ($attendanceCounts['izin'] ?? 0),
                    'alpha' => (int) ($attendanceCounts['alpha'] ?? 0),
                ],
                'recentGrades' => $recentGrades,
                'canEvaluateMentor' => $evalOpen && $mentorId !== null && ! $alreadyEvaluated,
                'evaluationYear' => $evalYear,
            ],
        ]);
    }
}
