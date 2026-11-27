<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\MentorProfile;
use App\Models\User;
use App\Services\RubeliaAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StaffAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $roleFilter = (string) $request->query('role', 'all');
        $search = trim((string) $request->query('search', ''));

        $users = User::query()
            ->with('mentorProfile')
            ->whereIn('role', ['master', 'admin', 'mentor'])
            ->when($roleFilter !== 'all', fn ($q) => $q->where('role', $roleFilter))
            ->when($search !== '', fn ($q) => $q->where(function ($sub) use ($search) {
                $sub->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->orderByRaw("CASE role WHEN 'master' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END")
            ->orderBy('name')
            ->get();

        return Inertia::render('rubelia/staff/index', [
            'staffList' => $users->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'birth_date' => $u->birth_date?->format('Y-m-d'),
                'phone' => $u->phone,
                'is_active' => $u->is_active,
                'fee_per_session' => $u->mentorProfile->fee_per_session ?? 0,
                'specialization' => $u->mentorProfile->specialization ?? '',
            ]),
            'filters' => [
                'role' => $roleFilter,
                'search' => $search,
            ],
            'createdCredentials' => $request->session()->get('created_credentials'),
        ]);
    }

    public function store(Request $request, RubeliaAccountService $accounts): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'role' => ['required', 'in:master,admin,mentor'],
            'birth_date' => ['required', 'date'],
            'phone' => ['nullable', 'string', 'max:30'],
            'fee_per_session' => ['nullable', 'integer', 'min:0'],
            'specialization' => ['nullable', 'string', 'max:150'],
        ]);

        $credentials = DB::transaction(function () use ($validated, $accounts) {
            $email = $accounts->generateStaffEmail($validated['name'], $validated['role']);
            $plainPassword = $accounts->birthDatePassword($validated['birth_date']);

            $user = User::query()->create([
                'name' => $validated['name'],
                'email' => $email,
                'role' => $validated['role'],
                'birth_date' => $validated['birth_date'],
                'phone' => $validated['phone'] ?? null,
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => $plainPassword,
            ]);

            if ($validated['role'] === 'mentor') {
                MentorProfile::query()->create([
                    'user_id' => $user->id,
                    'fee_per_session' => (int) ($validated['fee_per_session'] ?? 0),
                    'specialization' => $validated['specialization'] ?? null,
                ]);
            }

            return [
                'name' => $user->name,
                'role' => $user->role,
                'email' => $user->email,
                'password' => $plainPassword,
            ];
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Akun staf/mentor berhasil dibuat.']);

        return back()->with('created_credentials', $credentials);
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        abort_unless(in_array($user->role, ['master', 'admin', 'mentor'], true), 404);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'birth_date' => ['required', 'date'],
            'phone' => ['nullable', 'string', 'max:30'],
            'is_active' => ['required', 'boolean'],
            'fee_per_session' => ['nullable', 'integer', 'min:0'],
            'specialization' => ['nullable', 'string', 'max:150'],
        ]);

        if ($user->id === $request->user()?->id && ! $validated['is_active']) {
            return back()->withErrors(['is_active' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.']);
        }

        $user->update([
            'name' => $validated['name'],
            'birth_date' => $validated['birth_date'],
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        if ($user->role === 'mentor') {
            MentorProfile::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'fee_per_session' => (int) ($validated['fee_per_session'] ?? 0),
                    'specialization' => $validated['specialization'] ?? null,
                ]
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Data akun berhasil diperbarui.']);

        return back();
    }

    public function resetPassword(Request $request, User $user, RubeliaAccountService $accounts): RedirectResponse
    {
        abort_unless($user->birth_date !== null, 422, 'Tanggal lahir belum diisi.');

        $plainPassword = $accounts->birthDatePassword($user->birth_date);
        $user->update(['password' => $plainPassword]);

        Inertia::flash('toast', ['type' => 'success', 'message' => "Password {$user->name} direset ke tanggal lahir ({$plainPassword})."]);

        return back()->with('created_credentials', [
            'name' => $user->name,
            'role' => $user->role,
            'email' => $user->email,
            'password' => $plainPassword,
        ]);
    }
}
