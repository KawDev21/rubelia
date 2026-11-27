<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default('student')->after('email');
            $table->date('birth_date')->nullable()->after('role');
            $table->string('phone', 30)->nullable()->after('birth_date');
            $table->boolean('is_active')->default(true)->after('phone');

            $table->index(['role', 'is_active']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::create('education_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50);
            $table->string('slug', 50)->unique();
            $table->unsignedBigInteger('monthly_fee')->default(0);
            $table->unsignedBigInteger('default_mentor_fee')->default(0);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('mentor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('fee_per_session')->default(0);
            $table->string('specialization')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('student_code', 30)->unique();
            $table->foreignId('education_level_id')->constrained()->restrictOnDelete();
            $table->string('guardian_name');
            $table->string('guardian_phone', 30);
            $table->string('school_name')->nullable();
            $table->text('address')->nullable();
            $table->date('enrolled_at');
            $table->timestamps();

            $table->index('education_level_id');
            $table->index('guardian_phone');
        });

        Schema::create('study_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('education_level_id')->constrained()->restrictOnDelete();
            $table->foreignId('mentor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name');
            $table->json('days');
            $table->unsignedTinyInteger('session_number')->default(1);
            $table->string('start_time', 5);
            $table->string('end_time', 5);
            $table->unsignedSmallInteger('quota')->default(12);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['education_level_id', 'is_active']);
            $table->index(['mentor_id', 'is_active']);
        });

        Schema::create('class_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('study_class_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20)->default('active');
            $table->date('started_at');
            $table->date('ended_at')->nullable();
            $table->timestamps();

            $table->index(['study_class_id', 'status']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('student_class_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('from_class_id')->constrained('study_classes')->cascadeOnDelete();
            $table->foreignId('to_class_id')->constrained('study_classes')->cascadeOnDelete();
            $table->string('type', 20)->default('permanent');
            $table->date('temporary_date')->nullable();
            $table->text('reason');
            $table->string('status', 20)->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        Schema::create('mentor_leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('study_class_id')->constrained()->cascadeOnDelete();
            $table->date('session_date');
            $table->text('reason');
            $table->string('status', 20)->default('pending');
            $table->foreignId('substitute_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->timestamps();

            $table->index(['status', 'session_date']);
            $table->index(['substitute_user_id', 'session_date']);
        });

        Schema::create('class_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('study_class_id')->constrained()->cascadeOnDelete();
            $table->date('session_date');
            $table->unsignedTinyInteger('session_number')->default(1);
            $table->string('scheduled_start_time', 5);
            $table->foreignId('taught_by_user_id')->constrained('users')->restrictOnDelete();
            $table->boolean('is_substitute')->default(false);
            $table->timestamp('checked_in_at');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->unsignedInteger('distance_meters')->default(0);
            $table->boolean('is_location_valid')->default(true);
            $table->unsignedSmallInteger('late_minutes')->default(0);
            $table->unsignedBigInteger('mentor_fee_amount')->default(0);
            $table->text('topic_notes')->nullable();
            $table->timestamps();

            $table->unique(['study_class_id', 'session_date']);
            $table->index(['taught_by_user_id', 'session_date']);
        });

        Schema::create('student_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('status', 20);
            $table->timestamp('wa_notified_at')->nullable();
            $table->string('wa_error')->nullable();
            $table->timestamps();

            $table->unique(['class_session_id', 'student_id']);
            $table->index(['student_id', 'status']);
        });

        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('study_class_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('mentor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('subject_topic');
            $table->date('graded_at');
            $table->decimal('score', 5, 2);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'graded_at']);
        });

        Schema::create('mentor_evaluations', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('period_year');
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('study_class_id')->nullable()->constrained()->nullOnDelete();
            $table->text('review_text');
            $table->timestamps();

            $table->unique(['period_year', 'student_id', 'mentor_id']);
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 40)->unique();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('billing_period', 7);
            $table->string('description');
            $table->unsignedBigInteger('amount');
            $table->date('due_date');
            $table->string('status', 30)->default('unpaid');
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'billing_period']);
            $table->index(['status', 'billing_period']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_code', 40)->unique();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('method', 20)->default('transfer');
            $table->unsignedBigInteger('total_amount');
            $table->string('proof_path')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('rejection_note')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('student_id');
        });

        Schema::create('invoice_payment', function (Blueprint $table) {
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_id')->constrained()->cascadeOnDelete();

            $table->primary(['payment_id', 'invoice_id']);
        });

        Schema::create('cash_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('transaction_code', 40)->unique();
            $table->string('type', 20);
            $table->string('category', 40);
            $table->unsignedBigInteger('amount');
            $table->date('transaction_date');
            $table->string('description');
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['type', 'transaction_date']);
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->unique();
            $table->string('public_key')->nullable();
            $table->string('auth_token')->nullable();
            $table->string('content_encoding', 30)->default('aesgcm');
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->string('target_role', 20)->default('all');
            $table->unsignedInteger('sent_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('cash_transactions');
        Schema::dropIfExists('invoice_payment');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('mentor_evaluations');
        Schema::dropIfExists('student_grades');
        Schema::dropIfExists('student_attendances');
        Schema::dropIfExists('class_sessions');
        Schema::dropIfExists('mentor_leave_requests');
        Schema::dropIfExists('student_class_requests');
        Schema::dropIfExists('class_enrollments');
        Schema::dropIfExists('study_classes');
        Schema::dropIfExists('students');
        Schema::dropIfExists('mentor_profiles');
        Schema::dropIfExists('education_levels');
        Schema::dropIfExists('settings');

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role', 'is_active']);
            $table->dropColumn(['role', 'birth_date', 'phone', 'is_active']);
        });
    }
};
