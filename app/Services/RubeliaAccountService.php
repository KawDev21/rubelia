<?php

namespace App\Services;

use App\Models\Student;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class RubeliaAccountService
{
    /**
     * Generate student code R[yy][mm][4-digit-seq] and lowercase login email.
     *
     * @return array{code: string, email: string, display_email: string}
     */
    public function generateStudentCredentials(?CarbonInterface $enrolledAt = null): array
    {
        $date = $enrolledAt ?? now();
        $prefix = 'R'.$date->format('ym');

        $latestCode = Student::query()
            ->where('student_code', 'like', $prefix.'%')
            ->orderByDesc('id')
            ->value('student_code');

        $nextNumber = 1;
        if (is_string($latestCode) && strlen($latestCode) > strlen($prefix)) {
            $numericTail = (int) substr($latestCode, strlen($prefix));
            $nextNumber = $numericTail + 1;
        }

        do {
            $seq = str_pad((string) $nextNumber, 4, '0', STR_PAD_LEFT);
            $code = $prefix.$seq;
            $email = strtolower($code).'@rubelia.com';
            $nextNumber++;
        } while (
            Student::query()->where('student_code', $code)->exists() ||
            User::query()->where('email', $email)->exists()
        );

        return [
            'code' => $code,
            'email' => $email,
            'display_email' => $code.'@rubelia.com',
        ];
    }

    public function generateStaffEmail(string $name, string $role, ?int $ignoreUserId = null): string
    {
        $domain = match ($role) {
            'master' => 'owner.rubelia.com',
            'admin' => 'admin.rubelia.com',
            'mentor' => 'mentor.rubelia.com',
            default => 'rubelia.com',
        };

        $slug = strtolower((string) preg_replace('/[^a-zA-Z0-9]/', '', $name));
        if ($slug === '') {
            $slug = $role;
        }

        $candidate = $slug.'@'.$domain;
        $counter = 2;

        while (
            User::query()
                ->where('email', $candidate)
                ->when($ignoreUserId, fn ($q) => $q->where('id', '!=', $ignoreUserId))
                ->exists()
        ) {
            $candidate = $slug.$counter.'@'.$domain;
            $counter++;
        }

        return $candidate;
    }

    public function birthDatePassword(CarbonInterface|string $birthDate): string
    {
        return Carbon::parse($birthDate)->format('dmY');
    }
}
