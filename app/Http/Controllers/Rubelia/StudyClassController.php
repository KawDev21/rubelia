<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use App\Models\StudyClass;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudyClassController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $levelFilter = $request->query('level_id');

        $query = StudyClass::query()
            ->with(['educationLevel:id,name,slug', 'mentor:id,name'])
            ->withCount('activeEnrollments')
            ->when($levelFilter, fn ($q) => $q->where('education_level_id', $levelFilter))
            ->when($user->isMentor(), fn ($q) => $q->where('mentor_id', $user->id))
            ->orderBy('education_level_id')
            ->orderBy('session_number')
            ->orderBy('name');

        return Inertia::render('rubelia/classes/index', [
            'classes' => $query->get()->map(fn (StudyClass $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'education_level_id' => $c->education_level_id,
                'level_name' => $c->educationLevel?->name,
                'level_slug' => $c->educationLevel?->slug,
                'mentor_id' => $c->mentor_id,
                'mentor_name' => $c->mentor->name ?? 'Belum ditentukan',
                'days' => $c->days ?? [],
                'session_number' => $c->session_number,
                'start_time' => $c->start_time,
                'end_time' => $c->end_time,
                'quota' => $c->quota,
                'enrolled_count' => $c->active_enrollments_count,
                'remaining_quota' => max(0, $c->quota - $c->active_enrollments_count),
                'is_active' => $c->is_active,
            ]),
            'levels' => EducationLevel::query()->orderBy('sort_order')->get(['id', 'name', 'slug']),
            'mentors' => User::query()
                ->where('role', 'mentor')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'canManage' => $user->isStaff(),
            'filters' => [
                'level_id' => $levelFilter ? (string) $levelFilter : '',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'education_level_id' => ['required', 'exists:education_levels,id'],
            'mentor_id' => ['nullable', 'exists:users,id'],
            'name' => ['required', 'string', 'max:120'],
            'days' => ['required', 'array', 'min:1'],
            'days.*' => ['string', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'],
            'session_number' => ['required', 'integer', 'min:1', 'max:7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'quota' => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        StudyClass::query()->create([
            ...$validated,
            'is_active' => true,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Jadwal kelas baru berhasil ditambahkan.']);

        return back();
    }

    public function update(Request $request, StudyClass $studyClass): RedirectResponse
    {
        $validated = $request->validate([
            'education_level_id' => ['required', 'exists:education_levels,id'],
            'mentor_id' => ['nullable', 'exists:users,id'],
            'name' => ['required', 'string', 'max:120'],
            'days' => ['required', 'array', 'min:1'],
            'days.*' => ['string', 'in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu'],
            'session_number' => ['required', 'integer', 'min:1', 'max:7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'quota' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['required', 'boolean'],
        ]);

        $studyClass->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data kelas berhasil diperbarui.']);

        return back();
    }
}
