<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\ClassSession;
use App\Models\MentorLeaveRequest;
use App\Models\Setting;
use App\Models\StudentAttendance;
use App\Models\StudentClassRequest;
use App\Models\StudyClass;
use App\Models\User;
use App\Services\FonnteService;
use App\Services\GeoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceSessionController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $date = (string) $request->query('date', now()->toDateString());
        $selectedClassId = $request->query('class_id') ? (int) $request->query('class_id') : null;

        if ($user->isStudent()) {
            $student = $user->student()->firstOrFail();
            $attendances = StudentAttendance::query()
                ->with(['classSession.studyClass:id,name,session_number', 'classSession.teacher:id,name'])
                ->where('student_id', $student->id)
                ->latest('id')
                ->paginate(30);

            $summary = StudentAttendance::query()
                ->where('student_id', $student->id)
                ->selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status');

            return Inertia::render('rubelia/attendance/index', [
                'roleView' => 'student',
                'studentAttendance' => [
                    'records' => $attendances,
                    'summary' => [
                        'hadir' => (int) ($summary['hadir'] ?? 0),
                        'sakit' => (int) ($summary['sakit'] ?? 0),
                        'izin' => (int) ($summary['izin'] ?? 0),
                        'alpha' => (int) ($summary['alpha'] ?? 0),
                    ],
                ],
            ]);
        }

        $substituteClassIds = MentorLeaveRequest::query()
            ->where('substitute_user_id', $user->id)
            ->where('status', 'approved')
            ->whereDate('session_date', $date)
            ->pluck('study_class_id')
            ->all();

        $classesQuery = StudyClass::query()
            ->with(['educationLevel:id,name,slug', 'mentor:id,name'])
            ->where('is_active', true)
            ->orderBy('session_number')
            ->orderBy('name');

        if ($user->isMentor()) {
            $classesQuery->where(function ($q) use ($user, $substituteClassIds) {
                $q->where('mentor_id', $user->id);
                if ($substituteClassIds !== []) {
                    $q->orWhereIn('id', $substituteClassIds);
                }
            });
        }

        $classes = $classesQuery->get();
        if (! $selectedClassId && $classes->isNotEmpty()) {
            $selectedClassId = $classes->first()->id;
        }

        $activeClassData = null;
        if ($selectedClassId) {
            $cls = $classes->firstWhere('id', $selectedClassId);
            if ($cls) {
                $existingSession = ClassSession::query()
                    ->with(['attendances', 'teacher:id,name'])
                    ->where('study_class_id', $cls->id)
                    ->whereDate('session_date', $date)
                    ->first();

                $enrolledStudents = $cls->activeEnrollments()
                    ->with('student.user:id,name')
                    ->get()
                    ->map(fn ($enr) => $enr->student)
                    ->filter();

                $tempInStudents = StudentClassRequest::query()
                    ->with('student.user:id,name')
                    ->where('to_class_id', $cls->id)
                    ->where('type', 'temporary')
                    ->where('status', 'approved')
                    ->whereDate('temporary_date', $date)
                    ->get()
                    ->map(fn ($req) => $req->student)
                    ->filter();

                $roster = $enrolledStudents->concat($tempInStudents)->unique('id')->values();
                $attMap = $existingSession ? $existingSession->attendances->keyBy('student_id') : collect();

                $activeClassData = [
                    'id' => $cls->id,
                    'name' => $cls->name,
                    'level_name' => $cls->educationLevel?->name,
                    'days' => $cls->days ?? [],
                    'session_number' => $cls->session_number,
                    'start_time' => $cls->start_time,
                    'end_time' => $cls->end_time,
                    'mentor_name' => $cls->mentor->name ?? '-',
                    'is_substitute' => in_array($cls->id, $substituteClassIds, true) || ($user->isMaster() && $cls->mentor_id !== $user->id),
                    'session' => $existingSession ? [
                        'id' => $existingSession->id,
                        'checked_in_at' => $existingSession->checked_in_at->format('H:i:s'),
                        'distance_meters' => $existingSession->distance_meters,
                        'late_minutes' => $existingSession->late_minutes,
                        'taught_by' => $existingSession->teacher->name,
                        'topic_notes' => $existingSession->topic_notes,
                    ] : null,
                    'roster' => $roster->map(function ($st) use ($attMap) {
                        $existing = $attMap->get($st->id);

                        return [
                            'student_id' => $st->id,
                            'student_code' => $st->student_code,
                            'name' => $st->user->name,
                            'guardian_phone' => $st->guardian_phone,
                            'status' => $existing->status ?? 'hadir',
                            'wa_notified_at' => $existing?->wa_notified_at?->format('H:i'),
                            'wa_error' => $existing?->wa_error,
                        ];
                    }),
                ];
            }
        }

        $recentSessions = ClassSession::query()
            ->with(['studyClass:id,name,session_number', 'teacher:id,name,role'])
            ->withCount([
                'attendances as hadir_count' => fn ($q) => $q->where('status', 'hadir'),
                'attendances as alpha_count' => fn ($q) => $q->where('status', 'alpha'),
            ])
            ->when($user->isMentor(), fn ($q) => $q->where('taught_by_user_id', $user->id))
            ->latest('session_date')
            ->latest('id')
            ->limit(30)
            ->get();

        return Inertia::render('rubelia/attendance/index', [
            'roleView' => $user->role,
            'date' => $date,
            'selectedClassId' => $selectedClassId,
            'canTeach' => $user->isMentor() || $user->isMaster(),
            'geoConfig' => [
                'officeName' => Setting::getValue('office_name', 'Rubelia'),
                'officeLat' => (float) Setting::getValue('office_lat', '-6.2000000'),
                'officeLng' => (float) Setting::getValue('office_lng', '106.8166660'),
                'maxRadiusMeters' => (int) Setting::getValue('office_radius_meters', '75'),
                'lateToleranceMinutes' => (int) Setting::getValue('late_tolerance_minutes', '5'),
            ],
            'classes' => $classes->map(fn (StudyClass $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'session_number' => $c->session_number,
                'start_time' => $c->start_time,
                'end_time' => $c->end_time,
                'days' => $c->days ?? [],
            ]),
            'activeClass' => $activeClassData,
            'recentSessions' => $recentSessions,
        ]);
    }

    public function store(
        Request $request,
        GeoService $geo,
        FonnteService $fonnte
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isMentor() || $user->isMaster(), 403);

        $validated = $request->validate([
            'study_class_id' => ['required', 'exists:study_classes,id'],
            'session_date' => ['required', 'date'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'topic_notes' => ['nullable', 'string', 'max:1000'],
            'attendances' => ['required', 'array'],
            'attendances.*.student_id' => ['required', 'exists:students,id'],
            'attendances.*.status' => ['required', 'in:hadir,sakit,izin,alpha'],
        ]);

        /** @var StudyClass $studyClass */
        $studyClass = StudyClass::query()->with('educationLevel')->findOrFail($validated['study_class_id']);

        if ($user->isMentor()) {
            $isAssigned = $studyClass->mentor_id === $user->id
                || MentorLeaveRequest::query()
                    ->where('study_class_id', $studyClass->id)
                    ->where('substitute_user_id', $user->id)
                    ->where('status', 'approved')
                    ->whereDate('session_date', $validated['session_date'])
                    ->exists();

            abort_unless($isAssigned, 403, 'Anda tidak terdaftar sebagai pengajar sesi ini.');
        }

        $officeLat = (float) Setting::getValue('office_lat', '-6.2000000');
        $officeLng = (float) Setting::getValue('office_lng', '106.8166660');
        $maxRadius = (int) Setting::getValue('office_radius_meters', '75');
        $tolerance = (int) Setting::getValue('late_tolerance_minutes', '5');

        $distance = $geo->distanceMeters($officeLat, $officeLng, (float) $validated['latitude'], (float) $validated['longitude']);

        $existingSession = ClassSession::query()
            ->where('study_class_id', $studyClass->id)
            ->whereDate('session_date', $validated['session_date'])
            ->first();

        if (! $existingSession && $user->isMentor() && $distance > $maxRadius) {
            throw ValidationException::withMessages([
                'latitude' => "Absen tidak valid: posisi Anda berjarak {$distance} meter dari gedung Rubelia (batas maksimal {$maxRadius} meter). Anda harus berada di lokasi Rubelia agar tercatat hadir.",
            ]);
        }

        $alphaToNotify = [];

        DB::transaction(function () use ($validated, $user, $studyClass, $existingSession, $distance, $tolerance, $geo, &$alphaToNotify) {
            $now = now();

            if (! $existingSession) {
                $lateMinutes = Carbon::parse($validated['session_date'])->isToday()
                    ? $geo->calculateLateMinutes($studyClass->start_time, $now, $tolerance)
                    : 0;

                $fee = 0;
                if ($user->isMentor()) {
                    $fee = $user->mentorProfile?->fee_per_session
                        ?: $studyClass->educationLevel->default_mentor_fee;
                }

                $session = ClassSession::query()->create([
                    'study_class_id' => $studyClass->id,
                    'session_date' => $validated['session_date'],
                    'session_number' => $studyClass->session_number,
                    'scheduled_start_time' => $studyClass->start_time,
                    'taught_by_user_id' => $user->id,
                    'is_substitute' => $studyClass->mentor_id !== $user->id,
                    'checked_in_at' => $now,
                    'latitude' => $validated['latitude'],
                    'longitude' => $validated['longitude'],
                    'distance_meters' => $distance,
                    'is_location_valid' => true,
                    'late_minutes' => $lateMinutes,
                    'mentor_fee_amount' => $fee,
                    'topic_notes' => $validated['topic_notes'] ?? null,
                ]);
            } else {
                $existingSession->update([
                    'topic_notes' => $validated['topic_notes'] ?? $existingSession->topic_notes,
                ]);
                $session = $existingSession;
            }

            foreach ($validated['attendances'] as $row) {
                $att = StudentAttendance::query()->updateOrCreate(
                    [
                        'class_session_id' => $session->id,
                        'student_id' => $row['student_id'],
                    ],
                    [
                        'status' => $row['status'],
                    ]
                );

                if ($row['status'] === 'alpha' && $att->wa_notified_at === null) {
                    $alphaToNotify[] = $att;
                }
            }
        });

        $waSentCount = 0;
        foreach ($alphaToNotify as $att) {
            if ($fonnte->sendAlphaAlert($att, $studyClass->name, Carbon::parse($validated['session_date'])->format('d-m-Y'))) {
                $waSentCount++;
            }
        }

        $msg = 'Absensi sesi & kehadiran murid berhasil disimpan.';
        if (count($alphaToNotify) > 0) {
            $msg .= ' Notifikasi WA Alpha diproses untuk '.count($alphaToNotify)." murid ({$waSentCount} terkirim).";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $msg]);

        return back();
    }
}
