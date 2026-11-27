<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\StudentAttendance;
use Illuminate\Support\Facades\Http;
use Throwable;

class FonnteService
{
    public function sendAlphaAlert(StudentAttendance $attendance, string $className, string $sessionDate): bool
    {
        if ($attendance->status !== 'alpha') {
            return false;
        }

        $token = Setting::getValue('fonnte_token', config('services.fonnte.token', ''));
        if (! $token) {
            $attendance->update(['wa_error' => 'Token Fonnte belum diatur di Pengaturan Sistem.']);

            return false;
        }

        $student = $attendance->student()->with('user')->first();
        if (! $student || ! $student->guardian_phone) {
            $attendance->update(['wa_error' => 'Nomor WhatsApp wali murid kosong.']);

            return false;
        }

        $studentName = $student->user->name;
        $guardianName = $student->guardian_name;
        $message = "Pemberitahuan Kehadiran Rubelia\n\n"
            ."Yth. Bapak/Ibu {$guardianName},\n"
            ."Kami menginformasikan bahwa ananda *{$studentName}* ({$student->student_code}) tercatat *TIDAK HADIR TANPA KETERANGAN (ALPHA)* pada sesi bimbingan kelas *{$className}* tanggal *{$sessionDate}*.\n\n"
            .'Mohon konfirmasi kepada Admin Rubelia apabila terdapat kendala. Terima kasih.';

        try {
            $response = Http::timeout(10)
                ->withHeaders(['Authorization' => $token])
                ->asForm()
                ->post('https://api.fonnte.com/send', [
                    'target' => $student->guardian_phone,
                    'message' => $message,
                    'countryCode' => '62',
                ]);

            if ($response->successful() && ($response->json('status') !== false)) {
                $attendance->update([
                    'wa_notified_at' => now(),
                    'wa_error' => null,
                ]);

                return true;
            }

            $attendance->update([
                'wa_error' => substr((string) ($response->json('reason') ?? $response->body()), 0, 190),
            ]);
        } catch (Throwable $e) {
            $attendance->update([
                'wa_error' => substr($e->getMessage(), 0, 190),
            ]);
        }

        return false;
    }
}
