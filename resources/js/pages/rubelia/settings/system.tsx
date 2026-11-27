import { Head, useForm } from '@inertiajs/react';
import { LocateFixed, Save } from 'lucide-react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { levelBadgeClass } from '@/lib/rubelia';

type LevelItem = {
    id: number;
    name: string;
    slug: string;
    monthly_fee: number;
    default_mentor_fee: number;
};

type Props = {
    settings: {
        office_name: string;
        office_address: string;
        office_lat: string;
        office_lng: string;
        office_radius_meters: number;
        late_tolerance_minutes: number;
        max_class_switches_per_year: number;
        bank_name: string;
        bank_account_number: string;
        bank_account_holder: string;
        fonnte_token: string;
        evaluation_open: boolean;
        evaluation_year: number;
    };
    levels: LevelItem[];
};

export default function SystemSettings({ settings, levels }: Props) {
    const form = useForm({
        ...settings,
        levels: levels.map((l) => ({
            id: l.id,
            name: l.name,
            slug: l.slug,
            monthly_fee: l.monthly_fee,
            default_mentor_fee: l.default_mentor_fee,
        })),
    });

    const captureCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Browser tidak mendukung pembacaan lokasi GPS.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                form.setData((prev) => ({
                    ...prev,
                    office_lat: pos.coords.latitude.toFixed(7),
                    office_lng: pos.coords.longitude.toFixed(7),
                }));
                toast.success(
                    'Titik koordinat gedung berhasil diambil dari lokasi Anda saat ini.',
                );
            },
            () =>
                toast.error(
                    'Gagal mengambil titik GPS. Pastikan izin lokasi browser diaktifkan.',
                ),
            { enableHighAccuracy: true },
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.put('/system-settings');
    };

    return (
        <>
            <Head title="Pengaturan Sistem Rubelia" />

            <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Pengaturan Sistem & Tarif Rubelia
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Atur harga SPP per jenjang, titik koordinat GPS
                            gedung, rekening transfer, WhatsApp Fonnte, dan
                            periode evaluasi.
                        </p>
                    </div>
                    <Button
                        type="submit"
                        disabled={form.processing}
                        className="h-11 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                    >
                        <Save className="mr-1.5 size-4" />
                        {form.processing
                            ? 'Menyimpan...'
                            : 'Simpan Semua Pengaturan'}
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            1. Tarif SPP Bulanan & Honor Dasar per Jenjang
                        </h2>
                        <div className="space-y-3">
                            {form.data.levels.map((lvl, idx) => (
                                <div
                                    key={lvl.id}
                                    className="grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 sm:grid-cols-3 sm:items-center"
                                >
                                    <div>
                                        <span
                                            className={`inline-block rounded-md border px-2.5 py-1 text-xs font-semibold ${levelBadgeClass(lvl.slug)}`}
                                        >
                                            {lvl.name}
                                        </span>
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            SPP Bulanan (Rp)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={lvl.monthly_fee}
                                            onChange={(e) => {
                                                const copy = [
                                                    ...form.data.levels,
                                                ];
                                                copy[idx] = {
                                                    ...copy[idx],
                                                    monthly_fee: Number(
                                                        e.target.value,
                                                    ),
                                                };
                                                form.setData('levels', copy);
                                            }}
                                            className="mt-1 h-10 bg-white font-mono"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">
                                            Tarif Sesi Default (Rp)
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={lvl.default_mentor_fee}
                                            onChange={(e) => {
                                                const copy = [
                                                    ...form.data.levels,
                                                ];
                                                copy[idx] = {
                                                    ...copy[idx],
                                                    default_mentor_fee: Number(
                                                        e.target.value,
                                                    ),
                                                };
                                                form.setData('levels', copy);
                                            }}
                                            className="mt-1 h-10 bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                2. Titik Koordinat GPS Gedung & Aturan Kelas
                            </h2>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={captureCurrentLocation}
                            >
                                <LocateFixed className="mr-1.5 size-3.5" />
                                Ambil GPS Saat Ini
                            </Button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <Label>Nama Instansi</Label>
                                <Input
                                    value={form.data.office_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'office_name',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label>Alamat Gedung Rubelia</Label>
                                <Input
                                    value={form.data.office_address}
                                    onChange={(e) =>
                                        form.setData(
                                            'office_address',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10"
                                />
                            </div>
                            <div>
                                <Label>Latitude Gedung</Label>
                                <Input
                                    value={form.data.office_lat}
                                    onChange={(e) =>
                                        form.setData(
                                            'office_lat',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                                <InputError message={form.errors.office_lat} />
                            </div>
                            <div>
                                <Label>Longitude Gedung</Label>
                                <Input
                                    value={form.data.office_lng}
                                    onChange={(e) =>
                                        form.setData(
                                            'office_lng',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                                <InputError message={form.errors.office_lng} />
                            </div>
                            <div>
                                <Label>Radius Absen Valid (Meter)</Label>
                                <Input
                                    type="number"
                                    value={form.data.office_radius_meters}
                                    onChange={(e) =>
                                        form.setData(
                                            'office_radius_meters',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                            <div>
                                <Label>Toleransi Keterlambatan (Menit)</Label>
                                <Input
                                    type="number"
                                    value={form.data.late_tolerance_minutes}
                                    onChange={(e) =>
                                        form.setData(
                                            'late_tolerance_minutes',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label>
                                    Batas Maksimal Pindah Kelas Murid per Tahun
                                </Label>
                                <Input
                                    type="number"
                                    value={
                                        form.data.max_class_switches_per_year
                                    }
                                    onChange={(e) =>
                                        form.setData(
                                            'max_class_switches_per_year',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            3. Rekening Pembayaran SPP Rubelia
                        </h2>
                        <div className="grid gap-3">
                            <div>
                                <Label>Nama Bank</Label>
                                <Input
                                    value={form.data.bank_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'bank_name',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10"
                                />
                            </div>
                            <div>
                                <Label>Nomor Rekening</Label>
                                <Input
                                    value={form.data.bank_account_number}
                                    onChange={(e) =>
                                        form.setData(
                                            'bank_account_number',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                            <div>
                                <Label>Atas Nama Rekening</Label>
                                <Input
                                    value={form.data.bank_account_holder}
                                    onChange={(e) =>
                                        form.setData(
                                            'bank_account_holder',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            4. WhatsApp Gateway (Fonnte) & Evaluasi Akhir Tahun
                        </h2>
                        <div className="grid gap-3">
                            <div>
                                <Label>
                                    API Token Fonnte (Notifikasi WA Otomatis
                                    saat Murid Alpha)
                                </Label>
                                <Input
                                    type="password"
                                    value={form.data.fonnte_token}
                                    onChange={(e) =>
                                        form.setData(
                                            'fonnte_token',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Masukkan token perangkat dari dashboard fonnte.com"
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                            <div className="grid gap-3 pt-2 sm:grid-cols-2">
                                <div>
                                    <Label>Tahun Evaluasi Mentor</Label>
                                    <Input
                                        type="number"
                                        value={form.data.evaluation_year}
                                        onChange={(e) =>
                                            form.setData(
                                                'evaluation_year',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="mt-1 h-10 font-mono"
                                    />
                                </div>
                                <div>
                                    <Label>
                                        Status Form Penilaian Mentor oleh Murid
                                    </Label>
                                    <select
                                        value={
                                            form.data.evaluation_open
                                                ? '1'
                                                : '0'
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                'evaluation_open',
                                                e.target.value === '1',
                                            )
                                        }
                                        className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
                                    >
                                        <option value="0">Ditutup</option>
                                        <option value="1">
                                            Dibuka untuk Murid
                                        </option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </form>
        </>
    );
}
