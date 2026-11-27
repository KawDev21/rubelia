<?php

namespace App\Http\Controllers\Rubelia;

use App\Http\Controllers\Controller;
use App\Models\EducationLevel;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemSettingController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('rubelia/settings/system', [
            'settings' => [
                'office_name' => Setting::getValue('office_name', 'Bimbingan Belajar Rubelia'),
                'office_address' => Setting::getValue('office_address', ''),
                'office_lat' => Setting::getValue('office_lat', '-6.2000000'),
                'office_lng' => Setting::getValue('office_lng', '106.8166660'),
                'office_radius_meters' => (int) Setting::getValue('office_radius_meters', '75'),
                'late_tolerance_minutes' => (int) Setting::getValue('late_tolerance_minutes', '5'),
                'max_class_switches_per_year' => (int) Setting::getValue('max_class_switches_per_year', '2'),
                'bank_name' => Setting::getValue('bank_name', 'BCA'),
                'bank_account_number' => Setting::getValue('bank_account_number', ''),
                'bank_account_holder' => Setting::getValue('bank_account_holder', ''),
                'fonnte_token' => Setting::getValue('fonnte_token', ''),
                'evaluation_open' => Setting::getValue('evaluation_open', '0') === '1',
                'evaluation_year' => (int) Setting::getValue('evaluation_year', (string) now()->year),
            ],
            'levels' => EducationLevel::query()->orderBy('sort_order')->get(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'office_name' => ['required', 'string', 'max:150'],
            'office_address' => ['nullable', 'string', 'max:255'],
            'office_lat' => ['required', 'numeric', 'between:-90,90'],
            'office_lng' => ['required', 'numeric', 'between:-180,180'],
            'office_radius_meters' => ['required', 'integer', 'min:15', 'max:2000'],
            'late_tolerance_minutes' => ['required', 'integer', 'min:0', 'max:120'],
            'max_class_switches_per_year' => ['required', 'integer', 'min:0', 'max:20'],
            'bank_name' => ['required', 'string', 'max:60'],
            'bank_account_number' => ['required', 'string', 'max:60'],
            'bank_account_holder' => ['required', 'string', 'max:120'],
            'fonnte_token' => ['nullable', 'string', 'max:255'],
            'evaluation_open' => ['required', 'boolean'],
            'evaluation_year' => ['required', 'integer', 'min:2024', 'max:2100'],
            'levels' => ['required', 'array'],
            'levels.*.id' => ['required', 'exists:education_levels,id'],
            'levels.*.monthly_fee' => ['required', 'integer', 'min:0'],
            'levels.*.default_mentor_fee' => ['required', 'integer', 'min:0'],
        ]);

        Setting::setMany([
            'office_name' => $validated['office_name'],
            'office_address' => $validated['office_address'] ?? '',
            'office_lat' => $validated['office_lat'],
            'office_lng' => $validated['office_lng'],
            'office_radius_meters' => $validated['office_radius_meters'],
            'late_tolerance_minutes' => $validated['late_tolerance_minutes'],
            'max_class_switches_per_year' => $validated['max_class_switches_per_year'],
            'bank_name' => $validated['bank_name'],
            'bank_account_number' => $validated['bank_account_number'],
            'bank_account_holder' => $validated['bank_account_holder'],
            'fonnte_token' => $validated['fonnte_token'] ?? '',
            'evaluation_open' => $validated['evaluation_open'] ? '1' : '0',
            'evaluation_year' => $validated['evaluation_year'],
        ]);

        foreach ($validated['levels'] as $lvlData) {
            EducationLevel::query()->whereKey($lvlData['id'])->update([
                'monthly_fee' => $lvlData['monthly_fee'],
                'default_mentor_fee' => $lvlData['default_mentor_fee'],
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengaturan sistem & tarif jenjang berhasil disimpan.']);

        return back();
    }
}
