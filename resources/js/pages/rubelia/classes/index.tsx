import { Head, router, useForm } from '@inertiajs/react';
import { CalendarPlus, Edit3 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { levelBadgeClass } from '@/lib/rubelia';

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

type ClassItem = {
    id: number;
    name: string;
    education_level_id: number;
    level_name: string;
    level_slug: string;
    mentor_id?: number | null;
    mentor_name: string;
    days: string[];
    session_number: number;
    start_time: string;
    end_time: string;
    quota: number;
    enrolled_count: number;
    remaining_quota: number;
    is_active: boolean;
};

type Props = {
    classes: ClassItem[];
    levels: { id: number; name: string; slug: string }[];
    mentors: { id: number; name: string }[];
    canManage: boolean;
    filters: { level_id: string };
};

export default function ClassesIndex({
    classes,
    levels,
    mentors,
    canManage,
    filters,
}: Props) {
    const [editing, setEditing] = useState<ClassItem | null>(null);

    const form = useForm({
        education_level_id: levels[0]?.id ?? 1,
        mentor_id: '' as string | number,
        name: '',
        days: ['Senin', 'Rabu', 'Jumat'] as string[],
        session_number: 1,
        start_time: '14:00',
        end_time: '15:30',
        quota: 12,
        is_active: true,
    });

    const toggleDay = (day: string) => {
        const exists = form.data.days.includes(day);
        form.setData(
            'days',
            exists
                ? form.data.days.filter((d) => d !== day)
                : [...form.data.days, day],
        );
    };

    const startEdit = (cls: ClassItem) => {
        setEditing(cls);
        form.setData({
            education_level_id: cls.education_level_id,
            mentor_id: cls.mentor_id ?? '',
            name: cls.name,
            days: cls.days,
            session_number: cls.session_number,
            start_time: cls.start_time,
            end_time: cls.end_time,
            quota: cls.quota,
            is_active: cls.is_active,
        });
    };

    const resetForm = () => {
        setEditing(null);
        form.setData({
            education_level_id: levels[0]?.id ?? 1,
            mentor_id: '',
            name: '',
            days: ['Senin', 'Rabu', 'Jumat'],
            session_number: 1,
            start_time: '14:00',
            end_time: '15:30',
            quota: 12,
            is_active: true,
        });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...form.data,
            mentor_id:
                form.data.mentor_id === '' ? null : Number(form.data.mentor_id),
        };

        if (editing) {
            router.put(`/classes/${editing.id}`, payload, {
                onSuccess: () => resetForm(),
            });
        } else {
            router.post('/classes', payload, {
                onSuccess: () => resetForm(),
            });
        }
    };

    return (
        <>
            <Head title="Jadwal & Kelas Rubelia" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Jadwal Kelas & Sesi Belajar (Sesi 1 - 7)
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Pengaturan kelas berdasarkan jenjang, mentor
                            pengajar, jadwal hari/jam sesi, serta sisa slot
                            kuota murid.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                        <button
                            type="button"
                            onClick={() =>
                                router.get(
                                    '/classes',
                                    {},
                                    { preserveState: true },
                                )
                            }
                            className={`h-9 rounded-lg px-3 text-xs font-semibold ${
                                filters.level_id === ''
                                    ? 'bg-[#0F172A] text-white'
                                    : 'border border-[#E2E8F0] bg-white text-[#475569]'
                            }`}
                        >
                            Semua Jenjang
                        </button>
                        {levels.map((lvl) => (
                            <button
                                key={lvl.id}
                                type="button"
                                onClick={() =>
                                    router.get(
                                        '/classes',
                                        { level_id: lvl.id },
                                        { preserveState: true },
                                    )
                                }
                                className={`h-9 rounded-lg px-3 text-xs font-semibold ${
                                    filters.level_id === String(lvl.id)
                                        ? 'bg-[#0F172A] text-white'
                                        : 'border border-[#E2E8F0] bg-white text-[#475569]'
                                }`}
                            >
                                {lvl.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className={`grid gap-6 ${canManage ? 'lg:grid-cols-[1fr_2fr]' : ''}`}
                >
                    {canManage && (
                        <form
                            onSubmit={submit}
                            className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                        >
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                {editing
                                    ? `Edit Kelas: ${editing.name}`
                                    : 'Buat Jadwal Kelas Baru'}
                            </h2>

                            <div className="grid gap-1.5">
                                <Label>Jenjang Pendidikan</Label>
                                <select
                                    value={form.data.education_level_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'education_level_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    {levels.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Nama Kelas</Label>
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: SMP Reguler B - Sesi 4"
                                    required
                                    className="h-11"
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Mentor Pengajar</Label>
                                <select
                                    value={form.data.mentor_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'mentor_id',
                                            e.target.value,
                                        )
                                    }
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="">-- Pilih Mentor --</option>
                                    {mentors.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Hari Pertemuan</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {ALL_DAYS.map((day) => {
                                        const selected =
                                            form.data.days.includes(day);
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`h-9 rounded-lg border px-3 text-xs font-semibold ${
                                                    selected
                                                        ? 'border-[#0F172A] bg-[#0F172A] text-[#E2A829]'
                                                        : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#475569]'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                                <InputError message={form.errors.days} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Urutan Sesi (1-7)</Label>
                                    <select
                                        value={form.data.session_number}
                                        onChange={(e) =>
                                            form.setData(
                                                'session_number',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="mt-1 h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 font-mono text-sm"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                            <option key={n} value={n}>
                                                Sesi {n}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Kuota Maksimal Murid</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={form.data.quota}
                                        onChange={(e) =>
                                            form.setData(
                                                'quota',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="mt-1 h-11 font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Jam Mulai</Label>
                                    <Input
                                        type="time"
                                        value={form.data.start_time}
                                        onChange={(e) =>
                                            form.setData(
                                                'start_time',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 h-11 font-mono"
                                    />
                                </div>
                                <div>
                                    <Label>Jam Selesai</Label>
                                    <Input
                                        type="time"
                                        value={form.data.end_time}
                                        onChange={(e) =>
                                            form.setData(
                                                'end_time',
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1 h-11 font-mono"
                                    />
                                </div>
                            </div>

                            {editing && (
                                <div className="grid gap-1.5">
                                    <Label>Status Kelas</Label>
                                    <select
                                        value={form.data.is_active ? '1' : '0'}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_active',
                                                e.target.value === '1',
                                            )
                                        }
                                        className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                    >
                                        <option value="1">Aktif</option>
                                        <option value="0">Nonaktif</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                    className="h-11 flex-1 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                                >
                                    <CalendarPlus className="mr-1.5 size-4" />
                                    {editing
                                        ? 'Simpan Perubahan'
                                        : 'Tambah Kelas'}
                                </Button>
                                {editing && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-11"
                                        onClick={resetForm}
                                    >
                                        Batal
                                    </Button>
                                )}
                            </div>
                        </form>
                    )}

                    <div className="space-y-3">
                        {classes.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white p-10 text-center text-sm text-[#64748B]">
                                Belum ada jadwal kelas untuk filter jenjang ini.
                            </div>
                        ) : (
                            classes.map((cls) => (
                                <div
                                    key={cls.id}
                                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:flex-row sm:items-center"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${levelBadgeClass(cls.level_slug)}`}
                                            >
                                                {cls.level_name}
                                            </span>
                                            <span className="rounded bg-[#0F172A] px-2 py-0.5 font-mono text-xs font-semibold text-[#E2A829]">
                                                Sesi {cls.session_number}
                                            </span>
                                            <h3 className="font-display text-base font-bold text-[#0F172A]">
                                                {cls.name}
                                            </h3>
                                            {!cls.is_active && (
                                                <span className="rounded bg-[#FFF1F2] px-2 py-0.5 text-xs font-semibold text-[#BE123C]">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#475569]">
                                            Hari:{' '}
                                            <strong>
                                                {cls.days.join(', ')}
                                            </strong>{' '}
                                            | Jam:{' '}
                                            <span className="font-mono font-semibold text-[#0F172A]">
                                                {cls.start_time} -{' '}
                                                {cls.end_time}
                                            </span>{' '}
                                            | Mentor:{' '}
                                            <strong>{cls.mentor_name}</strong>
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                                        <div className="text-right">
                                            <p className="font-mono text-sm font-bold text-[#0F172A]">
                                                {cls.enrolled_count} /{' '}
                                                {cls.quota} murid
                                            </p>
                                            <p
                                                className={`text-xs font-semibold ${
                                                    cls.remaining_quota > 0
                                                        ? 'text-[#047857]'
                                                        : 'text-[#BE123C]'
                                                }`}
                                            >
                                                {cls.remaining_quota > 0
                                                    ? `Sisa ${cls.remaining_quota} slot`
                                                    : 'Kuota Penuh'}
                                            </p>
                                        </div>

                                        {canManage && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEdit(cls)}
                                            >
                                                <Edit3 className="mr-1 size-3.5" />
                                                Edit
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
