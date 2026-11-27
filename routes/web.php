<?php

use App\Http\Controllers\Rubelia\AcademicController;
use App\Http\Controllers\Rubelia\AttendanceSessionController;
use App\Http\Controllers\Rubelia\DashboardController;
use App\Http\Controllers\Rubelia\FinanceController;
use App\Http\Controllers\Rubelia\NotificationAndExportController;
use App\Http\Controllers\Rubelia\ScheduleRequestController;
use App\Http\Controllers\Rubelia\StaffAccountController;
use App\Http\Controllers\Rubelia\StudentManagementController;
use App\Http\Controllers\Rubelia\StudyClassController;
use App\Http\Controllers\Rubelia\SystemSettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function (Request $request) {
    return $request->user()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // PWA Web Push Subscriptions
    Route::post('push-subscriptions', [NotificationAndExportController::class, 'storePushSubscription'])
        ->name('push-subscriptions.store');
    Route::delete('push-subscriptions', [NotificationAndExportController::class, 'destroyPushSubscription'])
        ->name('push-subscriptions.destroy');

    // Exports & Kuitansi (role-checked inside controller)
    Route::get('exports/{type}/{format}', [NotificationAndExportController::class, 'exportReport'])
        ->name('rubelia.export-report');
    Route::get('payments/{payment}/receipt', [NotificationAndExportController::class, 'paymentReceiptPdf'])
        ->name('rubelia.payments.receipt');

    // Jadwal Kelas (Staff kelola, Mentor lihat jadwalnya)
    Route::middleware('role:master,admin,mentor')->group(function () {
        Route::get('classes', [StudyClassController::class, 'index'])->name('rubelia.classes.index');
    });
    Route::middleware('role:master,admin')->group(function () {
        Route::post('classes', [StudyClassController::class, 'store'])->name('rubelia.classes.store');
        Route::put('classes/{studyClass}', [StudyClassController::class, 'update'])->name('rubelia.classes.update');
    });

    // Manajemen & Pendaftaran Murid Baru (Master & Admin)
    Route::middleware('role:master,admin')->group(function () {
        Route::get('students', [StudentManagementController::class, 'index'])->name('rubelia.students.index');
        Route::post('students', [StudentManagementController::class, 'store'])->name('rubelia.students.store');
        Route::put('students/{student}', [StudentManagementController::class, 'update'])->name('rubelia.students.update');
        Route::post('students/{student}/reset-password', [StudentManagementController::class, 'resetPassword'])
            ->name('rubelia.students.reset-password');
        Route::get('students/import-template', [StudentManagementController::class, 'downloadImportTemplate'])
            ->name('rubelia.students.import-template');
        Route::post('students/import', [StudentManagementController::class, 'importExcel'])
            ->name('rubelia.students.import');
    });

    // Pengajuan Pindah Kelas Murid & Izin Mentor
    Route::get('schedule-requests', [ScheduleRequestController::class, 'index'])->name('rubelia.schedule-requests.index');
    Route::post('schedule-requests/student', [ScheduleRequestController::class, 'storeStudentRequest'])
        ->middleware('role:student')
        ->name('rubelia.schedule-requests.student.store');
    Route::post('schedule-requests/mentor', [ScheduleRequestController::class, 'storeMentorRequest'])
        ->middleware('role:mentor')
        ->name('rubelia.schedule-requests.mentor.store');
    Route::middleware('role:master,admin')->group(function () {
        Route::post('schedule-requests/student/{studentClassRequest}/review', [ScheduleRequestController::class, 'reviewStudentRequest'])
            ->name('rubelia.schedule-requests.student.review');
        Route::post('schedule-requests/mentor/{mentorLeaveRequest}/review', [ScheduleRequestController::class, 'reviewMentorRequest'])
            ->name('rubelia.schedule-requests.mentor.review');
    });

    // Absensi Sesi GPS Mentor & Kehadiran Murid
    Route::get('attendance', [AttendanceSessionController::class, 'index'])->name('rubelia.attendance.index');
    Route::post('attendance', [AttendanceSessionController::class, 'store'])
        ->middleware('role:master,mentor')
        ->name('rubelia.attendance.store');

    // Nilai Akademik & Penilaian Akhir Tahun Mentor
    Route::get('grades', [AcademicController::class, 'gradesIndex'])->name('rubelia.grades.index');
    Route::post('grades', [AcademicController::class, 'storeGrade'])
        ->middleware('role:master,admin,mentor')
        ->name('rubelia.grades.store');
    Route::delete('grades/{studentGrade}', [AcademicController::class, 'destroyGrade'])
        ->middleware('role:master,admin,mentor')
        ->name('rubelia.grades.destroy');

    Route::get('evaluations', [AcademicController::class, 'evaluationsIndex'])
        ->middleware('role:master,admin,student')
        ->name('rubelia.evaluations.index');
    Route::post('evaluations', [AcademicController::class, 'storeEvaluation'])
        ->middleware('role:student')
        ->name('rubelia.evaluations.store');

    // Keuangan SPP Murid/Wali
    Route::middleware('role:student')->group(function () {
        Route::get('student/invoices', [FinanceController::class, 'studentInvoices'])->name('rubelia.student.invoices');
        Route::post('student/payments', [FinanceController::class, 'submitTransferPayment'])->name('rubelia.student.payments.store');
    });

    // Keuangan Kas & Verifikasi SPP (Master & Admin)
    Route::middleware('role:master,admin')->group(function () {
        Route::get('finance', [FinanceController::class, 'staffIndex'])->name('rubelia.finance.index');
        Route::post('finance/payments/{payment}/verify', [FinanceController::class, 'verifyPayment'])->name('rubelia.finance.verify');
        Route::post('finance/pay-cash', [FinanceController::class, 'payCashDirect'])->name('rubelia.finance.pay-cash');
        Route::post('finance/generate-bills', [FinanceController::class, 'generateMonthlyBills'])->name('rubelia.finance.generate-bills');
        Route::post('finance/transactions', [FinanceController::class, 'storeCashTransaction'])->name('rubelia.finance.transactions.store');

        Route::get('broadcasts', [NotificationAndExportController::class, 'broadcastsIndex'])->name('rubelia.broadcasts.index');
        Route::post('broadcasts', [NotificationAndExportController::class, 'sendBroadcast'])->name('rubelia.broadcasts.store');
    });

    // Khusus Master (Owner): Kelola Staf/Mentor, Rekap Fee/Kinerja Mentor, Pengaturan Sistem
    Route::middleware('role:master')->group(function () {
        Route::get('staff-accounts', [StaffAccountController::class, 'index'])->name('rubelia.staff.index');
        Route::post('staff-accounts', [StaffAccountController::class, 'store'])->name('rubelia.staff.store');
        Route::put('staff-accounts/{user}', [StaffAccountController::class, 'update'])->name('rubelia.staff.update');
        Route::post('staff-accounts/{user}/reset-password', [StaffAccountController::class, 'resetPassword'])
            ->name('rubelia.staff.reset-password');

        Route::get('mentor-payroll', [FinanceController::class, 'mentorPayroll'])->name('rubelia.mentor-payroll');

        Route::get('system-settings', [SystemSettingController::class, 'edit'])->name('rubelia.system-settings.edit');
        Route::put('system-settings', [SystemSettingController::class, 'update'])->name('rubelia.system-settings.update');
    });
});

require __DIR__.'/settings.php';
