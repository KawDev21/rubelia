<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\Setting;
use Illuminate\Support\Collection;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\VAPID;
use Minishlink\WebPush\WebPush;
use Throwable;

class WebPushService
{
    /** @return array{publicKey: string, privateKey: string} */
    public function getOrCreateVapidKeys(): array
    {
        $public = Setting::getValue('vapid_public_key');
        $private = Setting::getValue('vapid_private_key');

        if ($public && $private) {
            return ['publicKey' => $public, 'privateKey' => $private];
        }

        try {
            $keys = VAPID::createVapidKeys();
            Setting::setMany([
                'vapid_public_key' => $keys['publicKey'],
                'vapid_private_key' => $keys['privateKey'],
            ]);

            return [
                'publicKey' => $keys['publicKey'],
                'privateKey' => $keys['privateKey'],
            ];
        } catch (Throwable) {
            // Fallback on local OpenSSL configs missing EC curve support
            return ['publicKey' => '', 'privateKey' => ''];
        }
    }

    /**
     * @param  Collection<int, int>|array<int, int>  $userIds
     */
    public function sendToUsers(Collection|array $userIds, string $title, string $body, string $url = '/dashboard'): int
    {
        $ids = $userIds instanceof Collection ? $userIds->all() : $userIds;
        if ($ids === []) {
            return 0;
        }

        $subscriptions = PushSubscription::query()->whereIn('user_id', $ids)->get();
        if ($subscriptions->isEmpty()) {
            return 0;
        }

        $keys = $this->getOrCreateVapidKeys();
        if ($keys['publicKey'] === '' || $keys['privateKey'] === '') {
            return 0;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('app.url', 'https://rubelia.com'),
                    'publicKey' => $keys['publicKey'],
                    'privateKey' => $keys['privateKey'],
                ],
            ]);

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'url' => $url,
            ], JSON_THROW_ON_ERROR);

            foreach ($subscriptions as $sub) {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->public_key,
                        'authToken' => $sub->auth_token,
                        'contentEncoding' => $sub->content_encoding ?: 'aesgcm',
                    ]),
                    $payload
                );
            }

            $sent = 0;
            foreach ($webPush->flush() as $report) {
                if ($report->isSuccess()) {
                    $sent++;
                } elseif ($report->isSubscriptionExpired()) {
                    PushSubscription::query()
                        ->where('endpoint_hash', hash('sha256', $report->getEndpoint()))
                        ->delete();
                }
            }

            return $sent;
        } catch (Throwable) {
            return 0;
        }
    }
}
