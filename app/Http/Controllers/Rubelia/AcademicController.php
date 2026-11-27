<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\MentorEvaluation;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudyClass;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicController extends Controller
{
    public function gradesIndex(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isStudent()) {
            $student = $user->student()->firstOrFail();
            $grades = StudentGrade::query()
                ->with(['studyClass:id,name', 'mentor:id,name'])
                ->where('student_id', $student->id)
                ->latest('graded_at')
                ->paginate(30);

            return Inertia::render('rubelia/grades/index', [
                'roleView' => 'student',
                'grades' => $grades,
                'averageScore' => round((float) StudentGrade::query()->where('student_id', $student->id)->avg('score'), 1),
            ]);
        }

        $classId = $request->query('class_id') ? (int) $request->query('class_id') : null;

        $classes = StudyClass::query()
            ->where('is_active', true)
            ->when($user->isMentor(), fn ($q) => $q->where('mentor_id', $user->id))
            ->orderBy('session_number')
            ->get(['id', 'name', 'session_number']);

        if (! $classId && $classes->isNotEmpty()) {
            $classId = $classes->first()->id;
        }

        $studentsInClass = $classId
            ? Student::query()
                ->with('user:id,name')
                ->whereHas('activeEnrollment', fn ($q) => $q->where('study_class_id', $classId))
                ->get()
                ->map(fn (Student $s) => [
                    'id' => $s->id,
                    'student_code' => $s->student_code,
                    'name' => $s->user->name,
                ])
            : collect();

        $grades = StudentGrade::query()
            ->with(['student.user:id,name', 'studyClass:id,name', 'mentor:id,name'])
            ->when($user->isMentor(), fn ($q) => $q->where('mentor_id', $user->id))
            ->when($classId, fn ($q) => $q->where('study_class_id', $classId))
            ->latest('graded_at')
            ->latest('id')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('rubelia/grades/index', [
            'roleView' => $user->role,
            'classes' => $classes,
            'selectedClassId' => $classId,
            'studentsInClass' => $studentsInClass,
            'grades' => $grades,
        ]);
    }

    public function storeGrade(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isMentor() || $user->isStaff(), 403);

        $validated = $request->validate([
            'student_id' => ['required', 'exists:students,id'],
            'study_class_id' => ['nullable', 'exists:study_classes,id'],
            'subject_topic' => ['required', 'string', 'max:150'],
            'graded_at' => ['required', 'date'],
            'score' => ['required', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        StudentGrade::query()->create([
            ...$validated,
            'mentor_id' => $user->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Nilai murid berhasil disimpan.']);

        return back();
    }

    public function destroyGrade(Request $request, StudentGrade $studentGrade): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isStaff() || $studentGrade->mentor_id === $user->id, 403);

        $studentGrade->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data nilai dihapus.']);

        return back();
    }

    public function evaluationsIndex(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_if($user->isMentor(), 403, 'Hasil penilaian tahunan hanya dapat diakses oleh Owner dan Admin.');

        $evalOpen = Setting::getValue('evaluation_open', '0') === '1';
        $evalYear = (int) ($request->query('year') ?: Setting::getValue('evaluation_year', (string) now()->year));

        if ($user->isStudent()) {
            $student = $user->student()->with('activeEnrollment.studyClass.mentor')->firstOrFail();
            $studyClass = $student->activeEnrollment?->studyClass;
            $mentor = $studyClass?->mentor;

            $existing = ($mentor)
                ? MentorEvaluation::query()
                    ->where('period_year', $evalYear)
                    ->where('student_id', $student->id)
                    ->where('mentor_id', $mentor->id)
                    ->first()
                : null;

            return Inertia::render('rubelia/evaluations/index', [
                'roleView' => 'student',
                'evaluationOpen' => $evalOpen,
                'evaluationYear' => $evalYear,
                'studentTarget' => $mentor ? [
                    'mentor_id' => $mentor->id,
                    'mentor_name' => $mentor->name,
                    'class_id' => $studyClass->id,
                    'class_name' => $studyClass->name,
                    'already_submitted' => $existing !== null,
                    'submitted_text' => $existing?->review_text,
                ] : null,
            ]);
        }

        $mentorFilter = $request->query('mentor_id') ? (int) $request->query('mentor_id') : null;

        $reviews = MentorEvaluation::query()
            ->with(['student.user:id,name', 'mentor:id,name', 'studyClass:id,name'])
            ->where('period_year', $evalYear)
            ->when($mentorFilter, fn ($q) => $q->where('mentor_id', $mentorFilter))
            ->latest()
            ->get();

        return Inertia::render('rubelia/evaluations/index', [
            'roleView' => $user->role,
            'evaluationOpen' => $evalOpen,
            'evaluationYear' => $evalYear,
            'selectedMentorId' => $mentorFilter,
            'mentors' => User::query()->where('role', 'mentor')->orderBy('name')->get(['id', 'name']),
            'reviews' => $reviews,
        ]);
    }

    public function storeEvaluation(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isStudent(), 403);

        abort_unless(Setting::getValue('evaluation_open', '0') === '1', 422, 'Periode penilaian akhir tahun belum dibuka.');

        $student = $user->student()->with('activeEnrollment.studyClass')->firstOrFail();
        $evalYear = (int) Setting::getValue('evaluation_year', (string) now()->year);

        $validated = $request->validate([
            'mentor_id' => ['required', 'exists:users,id'],
            'review_text' => ['required', 'string', 'min:10', 'max:2000'],
        ]);

        MentorEvaluation::query()->updateOrCreate(
            [
                'period_year' => $evalYear,
                'student_id' => $student->id,
                'mentor_id' => $validated['mentor_id'],
            ],
            [
                'study_class_id' => $student->activeEnrollment?->study_class_id,
                'review_text' => $validated['review_text'],
            ]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Terima kasih, ulasan tahunan untuk mentor telah dikirim.']);

        return back();
    }
}
