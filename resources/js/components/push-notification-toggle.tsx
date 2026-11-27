import { usePage } from '@inertiajs/react';
import { Bell, BellOff, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { csrfToken, urlBase64ToUint8Array } from '@/lib/rubelia';

export function PushNotificationToggle() {
    const { vapidPublicKey } = usePage<{ vapidPublicKey?: string }>().props;
    const [supported, setSupported] = useState(false);
    const [subscribed, setSubscribed] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (
            typeof window === 'undefined' ||
            !('serviceWorker' in navigator) ||
            !('PushManager' in window)
        ) {
            return;
        }

        setSupported(true);

        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) => reg.pushManager.getSubscription())
            .then((sub) => setSubscribed(Boolean(sub)))
            .catch(() => setSupported(false));
    }, []);

    if (!supported || !vapidPublicKey) {
        return null;
    }

    const togglePush = async () => {
        setBusy(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const existing = await registration.pushManager.getSubscription();

            if (existing) {
                await fetch('/push-subscriptions', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-XSRF-TOKEN': csrfToken(),
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({ endpoint: existing.endpoint }),
                });
                await existing.unsubscribe();
                setSubscribed(false);
                toast.success('Notifikasi layar HP dinonaktifkan.');
                return;
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error(
                    'Izin notifikasi ditolak di pengaturan browser HP Anda.',
                );
                return;
            }

            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            const json = sub.toJSON();
            const res = await fetch('/push-subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': csrfToken(),
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    endpoint: json.endpoint,
                    keys: json.keys,
                    contentEncoding: (
                        PushManager.supportedContentEncodings ?? ['aesgcm']
                    )[0],
                }),
            });

            if (res.ok) {
                setSubscribed(true);
                toast.success('Notifikasi layar HP aktif untuk akun ini.');
            } else {
                toast.error('Gagal menyimpan langganan notifikasi.');
            }
        } catch {
            toast.error(
                'Perangkat belum mendukung Web Push. Di iPhone, pilih Tambahkan ke Layar Utama terlebih dahulu.',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <Button
            type="button"
            variant={subscribed ? 'secondary' : 'default'}
            size="sm"
            onClick={togglePush}
            disabled={busy}
            className="h-9 gap-1.5 text-xs font-semibold"
        >
            {subscribed ? (
                <>
                    <CheckCircle2 className="size-3.5 text-[#047857]" />
                    <span className="hidden sm:inline">Notif HP Aktif</span>
                </>
            ) : (
                <>
                    <Bell className="size-3.5" />
                    <span>Aktifkan Notif HP</span>
                </>
            )}
            {subscribed && (
                <BellOff className="size-3 text-muted-foreground sm:ml-0.5" />
            )}
        </Button>
    );
}
