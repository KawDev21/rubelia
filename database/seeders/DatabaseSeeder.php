<?php

namespace Database\Seeders;

use App\Models\ClassEnrollment;
use App\Models\EducationLevel;
use App\Models\MentorProfile;
use App\Models\Setting;
use App\Models\Student;
use App\Models\StudyClass;
use App\Models\User;
use App\Services\BillingService;
use App\Services\RubeliaAccountService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = app(RubeliaAccountService::class);
        $billing = app(BillingService::class);

        Setting::setMany([
            'office_name' => 'Bimbingan Belajar Rubelia',
            'office_address' => 'Jl. Pendidikan No. 18, Rubelia Center',
            'office_lat' => '-6.2000000',
            'office_lng' => '106.8166660',
            'office_radius_meters' => '75',
            'late_tolerance_minutes' => '5',
            'max_class_switches_per_year' => '2',
            'bank_name' => 'BCA',
            'bank_account_number' => '7410889921',
            'bank_account_holder' => 'Bimbingan Belajar Rubelia',
            'fonnte_token' => '',
            'evaluation_open' => '0',
            'evaluation_year' => (string) now()->year,
        ]);

        $levels = [
            ['name' => 'Bimba', 'slug' => 'bimba', 'monthly_fee' => 200000, 'default_mentor_fee' => 35000, 'sort_order' => 1],
            ['name' => 'SD', 'slug' => 'sd', 'monthly_fee' => 250000, 'default_mentor_fee' => 40000, 'sort_order' => 2],
            ['name' => 'SMP', 'slug' => 'smp', 'monthly_fee' => 325000, 'default_mentor_fee' => 50000, 'sort_order' => 3],
            ['name' => 'SMA/SMK', 'slug' => 'sma-smk', 'monthly_fee' => 400000, 'default_mentor_fee' => 60000, 'sort_order' => 4],
        ];

        $levelMap = [];
        foreach ($levels as $lvl) {
            $levelMap[$lvl['slug']] = EducationLevel::query()->updateOrCreate(
                ['slug' => $lvl['slug']],
                $lvl
            );
        }

        $master = User::query()->updateOrCreate(
            ['email' => 'ratnasari@owner.rubelia.com'],
            [
                'name' => 'Ratna Sari',
                'role' => 'master',
                'birth_date' => '1988-05-12',
                'phone' => '081288001100',
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => $accounts->birthDatePassword('1988-05-12'),
            ]
        );

        $admin = User::query()->updateOrCreate(
            ['email' => 'dewilestari@admin.rubelia.com'],
            [
                'name' => 'Dewi Lestari',
                'role' => 'admin',
                'birth_date' => '1998-08-20',
                'phone' => '081288002200',
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => $accounts->birthDatePassword('1998-08-20'),
            ]
        );

        $mentor1 = User::query()->updateOrCreate(
            ['email' => 'sigithadipratama@mentor.rubelia.com'],
            [
                'name' => 'Sigit Hadi Pratama',
                'role' => 'mentor',
                'birth_date' => '2003-04-15',
                'phone' => '081388003300',
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => $accounts->birthDatePassword('2003-04-15'),
            ]
        );
        MentorProfile::query()->updateOrCreate(
            ['user_id' => $mentor1->id],
            ['fee_per_session' => 50000, 'specialization' => 'Matematika & IPA SMP/SMA']
        );

        $mentor2 = User::query()->updateOrCreate(
            ['email' => 'nadiaputrirahayu@mentor.rubelia.com'],
            [
                'name' => 'Nadia Putri Rahayu',
                'role' => 'mentor',
                'birth_date' => '2004-01-10',
                'phone' => '081388004400',
                'is_active' => true,
                'email_verified_at' => now(),
                'password' => $accounts->birthDatePassword('2004-01-10'),
            ]
        );
        MentorProfile::query()->updateOrCreate(
            ['user_id' => $mentor2->id],
            ['fee_per_session' => 40000, 'specialization' => 'Bimba & Tematik SD']
        );

        $classBimba = StudyClass::query()->firstOrCreate(
            ['name' => 'Bimba Ceria A - Sesi 1'],
            [
                'education_level_id' => $levelMap['bimba']->id,
                'mentor_id' => $mentor2->id,
                'days' => ['Senin', 'Rabu', 'Jumat'],
                'session_number' => 1,
                'start_time' => '09:00',
                'end_time' => '10:30',
                'quota' => 8,
                'is_active' => true,
            ]
        );

        $classSd = StudyClass::query()->firstOrCreate(
            ['name' => 'SD Reguler A - Sesi 3'],
            [
                'education_level_id' => $levelMap['sd']->id,
                'mentor_id' => $mentor2->id,
                'days' => ['Selasa', 'Kamis', 'Sabtu'],
                'session_number' => 3,
                'start_time' => '13:30',
                'end_time' => '15:00',
                'quota' => 12,
                'is_active' => true,
            ]
        );

        $classSmp = StudyClass::query()->firstOrCreate(
            ['name' => 'SMP Unggulan A - Sesi 5'],
            [
                'education_level_id' => $levelMap['smp']->id,
                'mentor_id' => $mentor1->id,
                'days' => ['Senin', 'Rabu', 'Jumat'],
                'session_number' => 5,
                'start_time' => '16:00',
                'end_time' => '17:30',
                'quota' => 12,
                'is_active' => true,
            ]
        );

        StudyClass::query()->firstOrCreate(
            ['name' => 'SMP Unggulan B - Sesi 6'],
            [
                'education_level_id' => $levelMap['smp']->id,
                'mentor_id' => $mentor1->id,
                'days' => ['Selasa', 'Kamis', 'Sabtu'],
                'session_number' => 6,
                'start_time' => '17:30',
                'end_time' => '19:00',
                'quota' => 12,
                'is_active' => true,
            ]
        );

        StudyClass::query()->firstOrCreate(
            ['name' => 'SMA/SMK Intensif - Sesi 7'],
            [
                'education_level_id' => $levelMap['sma-smk']->id,
                'mentor_id' => $mentor1->id,
                'days' => ['Senin', 'Kamis'],
                'session_number' => 7,
                'start_time' => '19:00',
                'end_time' => '20:30',
                'quota' => 10,
                'is_active' => true,
            ]
        );

        if (Student::query()->count() === 0) {
            $sampleStudents = [
                [
                    'name' => 'Alya Maharani',
                    'birth_date' => '2012-03-18',
                    'guardian_name' => 'Hendra Wijaya',
                    'guardian_phone' => '081299001122',
                    'school_name' => 'SMPN 4',
                    'address' => 'Jl. Melati No. 12',
                    'level' => $levelMap['smp'],
                    'class' => $classSmp,
                ],
                [
                    'name' => 'Rizky Ramadhan',
                    'birth_date' => '2016-09-05',
                    'guardian_name' => 'Siti Aminah',
                    'guardian_phone' => '081299003344',
                    'school_name' => 'SDN 2 Harapan',
                    'address' => 'Jl. Kenanga Blok B4',
                    'level' => $levelMap['sd'],
                    'class' => $classSd,
                ],
                [
                    'name' => 'Kirana Azzahra',
                    'birth_date' => '2020-11-22',
                    'guardian_name' => 'Bagus Santoso',
                    'guardian_phone' => '081299005566',
                    'school_name' => 'TK Tunas Bangsa',
                    'address' => 'Perum Griya Asri C9',
                    'level' => $levelMap['bimba'],
                    'class' => $classBimba,
                ],
            ];

            foreach ($sampleStudents as $item) {
                $enrolledAt = Carbon::now();
                $creds = $accounts->generateStudentCredentials($enrolledAt);

                $studentUser = User::query()->create([
                    'name' => $item['name'],
                    'email' => $creds['email'],
                    'role' => 'student',
                    'birth_date' => $item['birth_date'],
                    'phone' => $item['guardian_phone'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                    'password' => $accounts->birthDatePassword($item['birth_date']),
                ]);

                $student = Student::query()->create([
                    'user_id' => $studentUser->id,
                    'student_code' => $creds['code'],
                    'education_level_id' => $item['level']->id,
                    'guardian_name' => $item['guardian_name'],
                    'guardian_phone' => $item['guardian_phone'],
                    'school_name' => $item['school_name'],
                    'address' => $item['address'],
                    'enrolled_at' => $enrolledAt->toDateString(),
                ]);

                ClassEnrollment::query()->create([
                    'student_id' => $student->id,
                    'study_class_id' => $item['class']->id,
                    'status' => 'active',
                    'started_at' => $enrolledAt->toDateString(),
                ]);

                $student->setRelation('user', $studentUser);
                $billing->createInitialPaidInvoice($student, $item['level']->monthly_fee, $admin->id);
            }
        }
    }
}
