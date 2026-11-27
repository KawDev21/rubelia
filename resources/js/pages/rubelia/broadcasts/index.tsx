import { Head, useForm } from '@inertiajs/react';
import { BellRing, Send } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roleLabel } from '@/lib/rubelia';

type Props = {
    broadcasts: {
        id: number;
        title: string;
        body: string;
        target_role: string;
        sent_count: number;
        created_at: string;
        creator?: { name: string };
    }[];
    subscriberCount: number;
};

export default function BroadcastsIndex({
    broadcasts,
    subscriberCount,
}: Props) {
    const form = useForm({
        title: '',
        body: '',
        target_role: 'all',
    });

    return (
        <>
            <Head title="Broadcast Notifikasi Layar HP" />

            <div className="space-y-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                        Broadcast Pengumuman & Notifikasi Layar HP
                    </h1>
                    <p className="text-sm text-[#475569]">
                        Pesan dikirim langsung ke bar notifikasi layar HP
                        pengguna yang mengaktifkan tombol Notif HP (
                        {subscriberCount} perangkat aktif).
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/broadcasts', {
                                onSuccess: () => form.reset('title', 'body'),
                            });
                        }}
                        className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                    >
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            Kirim Pengumuman Baru
                        </h2>

                        <div className="grid gap-1.5">
                            <Label>Tujuan Penerima</Label>
                            <select
                                value={form.data.target_role}
                                onChange={(e) =>
                                    form.setData('target_role', e.target.value)
                                }
                                className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                            >
                                <option value="all">
                                    Semua Pengguna (Murid/Wali, Mentor, Admin)
                                </option>
                                <option value="student">
                                    Khusus Murid / Wali Murid
                                </option>
                                <option value="mentor">Khusus Mentor</option>
                                <option value="admin">
                                    Khusus Admin / Staff
                                </option>
                            </select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Judul Notifikasi</Label>
                            <Input
                                value={form.data.title}
                                onChange={(e) =>
                                    form.setData('title', e.target.value)
                                }
                                required
                                placeholder="Contoh: Informasi Libur Nasional & Jadwal Pengganti"
                                className="h-11"
                            />
                            <InputError message={form.errors.title} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label>Isi Pesan Broadcast</Label>
                            <textarea
                                rows={4}
                                value={form.data.body}
                                onChange={(e) =>
                                    form.setData('body', e.target.value)
                                }
                                required
                                placeholder="Tulis pesan singkat dan jelas untuk muncul di layar HP..."
                                className="rounded-xl border border-[#CBD5E1] p-3 text-sm"
                            />
                            <InputError message={form.errors.body} />
                        </div>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                        >
                            <Send className="mr-1.5 size-4" />
                            {form.processing
                                ? 'Mengirim ke Perangkat HP...'
                                : 'Kirim Broadcast Sekarang'}
                        </Button>
                    </form>

                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            Riwayat Broadcast Terkirim
                        </h2>
                        <div className="mt-4 space-y-3">
                            {broadcasts.length === 0 ? (
                                <p className="text-sm text-[#64748B]">
                                    Belum ada pengumuman broadcast yang dikirim.
                                </p>
                            ) : (
                                broadcasts.map((b) => (
                                    <div
                                        key={b.id}
                                        className="rounded-xl border border-[#E2E8F0] p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-1.5 rounded bg-[#FFF1F2] px-2.5 py-0.5 text-xs font-semibold text-[#BE123C]">
                                                <BellRing className="size-3" />
                                                Target:{' '}
                                                {b.target_role === 'all'
                                                    ? 'Semua Peran'
                                                    : roleLabel(b.target_role)}
                                            </span>
                                            <span className="font-mono text-xs text-[#64748B]">
                                                Terkirim ke {b.sent_count}{' '}
                                                perangkat HP
                                            </span>
                                        </div>
                                        <p className="mt-2 font-semibold text-[#0F172A]">
                                            {b.title}
                                        </p>
                                        <p className="mt-1 text-sm text-[#475569]">
                                            {b.body}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
