<?php

namespace App\Http\Middleware;

use App\Models\MentorLeaveRequest;
use App\Models\Payment;
use App\Models\StudentClassRequest;
use App\Services\WebPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $pendingBadges = [
            'payments' => 0,
            'scheduleRequests' => 0,
        ];
        $vapidPublicKey = '';

        if ($user && Schema::hasTable('settings')) {
            if ($user->isStaff()) {
                $pendingBadges['payments'] = Payment::query()->where('status', 'pending')->count();
                $pendingBadges['scheduleRequests'] = StudentClassRequest::query()->where('status', 'pending')->count()
                    + MentorLeaveRequest::query()->where('status', 'pending')->count();
            }

            $vapidPublicKey = app(WebPushService::class)->getOrCreateVapidKeys()['publicKey'];
        }

        return [
            ...parent::share($request),
            'name' => config('app.name', 'Rubelia'),
            'auth' => [
                'user' => $user,
            ],
            'pendingBadges' => $pendingBadges,
            'vapidPublicKey' => $vapidPublicKey,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
