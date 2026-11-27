<?php

use App\Models\CashTransaction;
use App\Models\ClassSession;
use App\Models\EducationLevel;
use App\Models\Invoice;
use App\Models\MentorEvaluation;
use App\Models\MentorProfile;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudyClass;
use App\Models\User;
use App\Services\BillingService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Setting::clearCache();
    Setting::setMany([
        'office_name' => 'Rubelia Test',
        'office_lat' => '-6.2000000',
        'office_lng' => '106.8166660',
        'office_radius_meters' => '75',
        'late_tolerance_minutes' => '5',
        'max_class_switches_per_year' => '1',
        'fonnte_token' => 'test-fonnte-token',
        'evaluation_open' => '1',
        'evaluation_year' => '2026',
    ]);
});

test('walk-in student registration generates R-code email, hashed birth-date password, and paid first-month SPP', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $level = EducationLevel::query()->create([
        'name' => 'SMP',
        'slug' => 'smp',
        'monthly_fee' => 325000,
        'default_mentor_fee' => 50000,
    ]);
    $class = StudyClass::query()->create([
        'education_level_id' => $level->id,
        'name' => 'SMP A',
        'days' => ['Senin', 'Rabu'],
        'session_number' => 1,
        'start_time' => '14:00',
        'end_time' => '15:30',
        'quota' => 10,
    ]);

    $this->actingAs($admin)
        ->post(route('rubelia.students.store'), [
            'name' => 'Alya Putri',
            'birth_date' => '2013-08-05',
            'education_level_id' => $level->id,
            'study_class_id' => $class->id,
            'guardian_name' => 'Bapak Hendra',
            'guardian_phone' => '081299887766',
            'school_name' => 'SMPN 1',
            'address' => 'Jl. Mawar',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $student = Student::query()->with('user')->firstOrFail();
    $ym = now()->format('ym');

    expect($student->student_code)->toBe("R{$ym}0001")
        ->and($student->user->email)->toBe(strtolower("R{$ym}0001@rubelia.com"))
        ->and(Hash::check('05082013', $student->user->password))->toBeTrue();

    expect(Invoice::query()->where('student_id', $student->id)->where('status', 'paid')->count())->toBe(1)
        ->and(CashTransaction::query()->where('type', 'income')->sum('amount'))->toBe(325000);

    // Verify login works even when typing uppercase R-code email
    $this->post(route('logout'));
    $this->post(route('login.store'), [
        'email' => "R{$ym}0001@rubelia.com",
        'password' => '05082013',
    ])->assertRedirect(route('dashboard', absolute: false));
});

test('monthly billing trigger handles both normal 28th and Sunday 28th shifted to Saturday 27th', function () {
    $billing = app(BillingService::class);

    // Nov 2026: Nov 28, 2026 is Saturday -> triggers on 28th, not 27th
    expect($billing->isBillingTriggerDate(Carbon::parse('2026-11-27')))->toBeFalse()
        ->and($billing->isBillingTriggerDate(Carbon::parse('2026-11-28')))->toBeTrue();

    // Jun 2026: Jun 28, 2026 is Sunday -> triggers on Saturday Jun 27, not Sunday Jun 28
    expect($billing->isBillingTriggerDate(Carbon::parse('2026-06-27')))->toBeTrue()
        ->and($billing->isBillingTriggerDate(Carbon::parse('2026-06-28')))->toBeFalse();
});

test('mentor GPS attendance rejects far coordinates and triggers Fonnte WA only for alpha students', function () {
    Http::fake([
        'https://api.fonnte.com/send' => Http::response(['status' => true], 200),
    ]);

    $mentor = User::factory()->create(['role' => 'mentor']);
    MentorProfile::query()->create(['user_id' => $mentor->id, 'fee_per_session' => 55000]);

    $level = EducationLevel::query()->create([
        'name' => 'SD',
        'slug' => 'sd',
        'monthly_fee' => 250000,
        'default_mentor_fee' => 40000,
    ]);
    $class = StudyClass::query()->create([
        'education_level_id' => $level->id,
        'mentor_id' => $mentor->id,
        'name' => 'SD Sesi 2',
        'days' => ['Senin'],
        'session_number' => 2,
        'start_time' => '15:00',
        'end_time' => '16:30',
        'quota' => 10,
    ]);

    $u1 = User::factory()->create(['role' => 'student', 'name' => 'Murid Hadir']);
    $s1 = Student::query()->create([
        'user_id' => $u1->id,
        'student_code' => 'R26110010',
        'education_level_id' => $level->id,
        'guardian_name' => 'Wali 1',
        'guardian_phone' => '0811111111',
        'enrolled_at' => now()->toDateString(),
    ]);

    $u2 = User::factory()->create(['role' => 'student', 'name' => 'Murid Alpha']);
    $s2 = Student::query()->create([
        'user_id' => $u2->id,
        'student_code' => 'R26110011',
        'education_level_id' => $level->id,
        'guardian_name' => 'Wali 2',
        'guardian_phone' => '0822222222',
        'enrolled_at' => now()->toDateString(),
    ]);

    // 1. Far away (~1.5km) -> rejected
    $this->actingAs($mentor)
        ->post(route('rubelia.attendance.store'), [
            'study_class_id' => $class->id,
            'session_date' => '2026-11-25',
            'latitude' => -6.2150000,
            'longitude' => 106.8166660,
            'attendances' => [
                ['student_id' => $s1->id, 'status' => 'hadir'],
                ['student_id' => $s2->id, 'status' => 'alpha'],
            ],
        ])
        ->assertSessionHasErrors('latitude');

    expect(ClassSession::query()->count())->toBe(0);

    // 2. Within 75m radius -> accepted, fee recorded, WA sent ONLY to Wali 2 (alpha)
    $this->actingAs($mentor)
        ->post(route('rubelia.attendance.store'), [
            'study_class_id' => $class->id,
            'session_date' => '2026-11-25',
            'latitude' => -6.2001000,
            'longitude' => 106.8166660,
            'topic_notes' => 'Pecahan campuran',
            'attendances' => [
                ['student_id' => $s1->id, 'status' => 'izin'],
                ['student_id' => $s2->id, 'status' => 'alpha'],
            ],
        ])
        ->assertSessionHasNoErrors();

    $session = ClassSession::query()->firstOrFail();
    expect($session->mentor_fee_amount)->toBe(55000);

    Http::assertSentCount(1);
    Http::assertSent(fn ($req) => $req['target'] === '0822222222');
});

test('multi-invoice SPP transfer rejection keeps bills unpaid and approval marks paid with receipt PDF', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $studentUser = User::factory()->create(['role' => 'student']);
    $level = EducationLevel::query()->create(['name' => 'SMA/SMK', 'slug' => 'sma-smk', 'monthly_fee' => 400000, 'default_mentor_fee' => 60000]);
    $student = Student::query()->create([
        'user_id' => $studentUser->id,
        'student_code' => 'R26110099',
        'education_level_id' => $level->id,
        'guardian_name' => 'Ibu Rina',
        'guardian_phone' => '081355667788',
        'enrolled_at' => '2026-09-01',
    ]);

    $inv1 = Invoice::query()->create([
        'invoice_number' => 'INV-202610-0099-AAA',
        'student_id' => $student->id,
        'billing_period' => '2026-10',
        'description' => 'SPP 2026-10',
        'amount' => 400000,
        'due_date' => '2026-10-10',
        'status' => 'unpaid',
    ]);
    $inv2 = Invoice::query()->create([
        'invoice_number' => 'INV-202611-0099-BBB',
        'student_id' => $student->id,
        'billing_period' => '2026-11',
        'description' => 'SPP 2026-11',
        'amount' => 400000,
        'due_date' => '2026-11-10',
        'status' => 'unpaid',
    ]);

    $this->actingAs($studentUser)
        ->post(route('rubelia.student.payments.store'), [
            'invoice_ids' => [$inv1->id, $inv2->id],
            'proof' => UploadedFile::fake()->create('bukti.jpg', 120, 'image/jpeg'),
        ])
        ->assertSessionHasNoErrors();

    $payment = Payment::query()->firstOrFail();
    expect($payment->total_amount)->toBe(800000)
        ->and($inv1->fresh()->status)->toBe('pending_verification');

    // Reject -> invoices revert to unpaid
    $this->actingAs($admin)
        ->post(route('rubelia.finance.verify', $payment), [
            'decision' => 'rejected',
            'rejection_note' => 'Foto buram',
        ])
        ->assertSessionHasNoErrors();

    expect($inv1->fresh()->status)->toBe('unpaid')
        ->and($inv2->fresh()->status)->toBe('unpaid');

    // Re-submit & Approve -> paid + receipt PDF works
    $this->actingAs($studentUser)
        ->post(route('rubelia.student.payments.store'), [
            'invoice_ids' => [$inv1->id, $inv2->id],
            'proof' => UploadedFile::fake()->create('bukti-jelas.jpg', 150, 'image/jpeg'),
        ])
        ->assertSessionHasNoErrors();

    $payment2 = Payment::query()->latest('id')->firstOrFail();

    $this->actingAs($admin)
        ->post(route('rubelia.finance.verify', $payment2), [
            'decision' => 'approved',
        ])
        ->assertSessionHasNoErrors();

    expect($inv1->fresh()->status)->toBe('paid')
        ->and($inv2->fresh()->status)->toBe('paid');

    $this->actingAs($studentUser)
        ->get(route('rubelia.payments.receipt', $payment2))
        ->assertOk();
});

test('annual mentor evaluation is readable by owner and admin but forbidden to mentor', function () {
    $master = User::factory()->create(['role' => 'master']);
    $mentor = User::factory()->create(['role' => 'mentor']);
    $studentUser = User::factory()->create(['role' => 'student']);
    $level = EducationLevel::query()->create(['name' => 'SMP', 'slug' => 'smp-eval', 'monthly_fee' => 300000, 'default_mentor_fee' => 50000]);
    $student = Student::query()->create([
        'user_id' => $studentUser->id,
        'student_code' => 'R26110200',
        'education_level_id' => $level->id,
        'guardian_name' => 'Pak Budi',
        'guardian_phone' => '081200001111',
        'enrolled_at' => '2026-01-10',
    ]);

    $this->actingAs($studentUser)
        ->post(route('rubelia.evaluations.store'), [
            'mentor_id' => $mentor->id,
            'review_text' => 'Kakak mentor mengajar sangat sabar dan mudah dimengerti.',
        ])
        ->assertSessionHasNoErrors();

    expect(MentorEvaluation::query()->count())->toBe(1);

    $this->actingAs($mentor)->get(route('rubelia.evaluations.index'))->assertForbidden();
    $this->actingAs($master)->get(route('rubelia.evaluations.index'))->assertOk();
    $this->actingAs($master)->get('/exports/mentor-evaluations/excel?year=2026')->assertOk();
});
