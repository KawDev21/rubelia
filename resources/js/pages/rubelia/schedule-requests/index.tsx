import { Head, router, useForm } from '@inertiajs/react';
import { Check, Send, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roleLabel } from '@/lib/rubelia';

type Props = {
    roleView: 'master' | 'admin' | 'mentor' | 'student';
    studentContext?: {
        currentClass?: {
            id: number;
            name: string;
            days: string[];
            session_number: number;
            start_time: string;
            end_time: string;
        } | null;
        maxSwitchesPerYear: number;
        usedThisYear: number;
        remainingSwitches: number;
        availableClasses: {
            id: number;
            name: string;
            days: string[];
            session_number: number;
            start_time: string;
            end_time: string;
            mentor_name: string;
            remaining_quota: number;
        }[];
        requests: {
            id: number;
            type: 'permanent' | 'temporary';
            temporary_date?: string | null;
            reason: string;
            status: 'pending' | 'approved' | 'rejected';
            review_note?: string | null;
            from_class?: { name: string };
            to_class?: { name: string };
        }[];
    };
    mentorContext?: {
        classes: {
            id: number;
            name: string;
            days: string[];
            session_number: number;
            start_time: string;
            end_time: string;
        }[];
        leaveRequests: {
            id: number;
            session_date: string;
            reason: string;
            status: 'pending' | 'approved' | 'rejected';
            review_note?: string | null;
            study_class?: { name: string; session_number: number };
            substitute?: { name: string; role: string } | null;
        }[];
        substitutions: {
            id: number;
            session_date: string;
            mentor?: { name: string };
            study_class?: {
                name: string;
                session_number: number;
                start_time: string;
                end_time: string;
            };
        }[];
    };
    staffContext?: {
        studentRequests: {
            id: number;
            type: 'permanent' | 'temporary';
            temporary_date?: string | null;
            reason: string;
            status: 'pending' | 'approved' | 'rejected';
            student?: {
                student_code: string;
                user?: { name: string };
                education_level?: { name: string };
            };
            from_class?: { name: string };
            to_class?: { name: string };
        }[];
        mentorRequests: {
            id: number;
            session_date: string;
            reason: string;
            status: 'pending' | 'approved' | 'rejected';
            mentor?: { id: number; name: string };
            study_class?: {
                name: string;
                session_number: number;
                start_time: string;
                end_time: string;
            };
            substitute?: { name: string; role: string } | null;
        }[];
        substituteCandidates: { id: number; name: string; role: string }[];
    };
};

export default function ScheduleRequestsIndex({
    roleView,
    studentContext,
    mentorContext,
    staffContext,
}: Props) {
    const [subSelect, setSubSelect] = useState<Record<number, number | ''>>({});

    const studentForm = useForm({
        to_class_id:
            studentContext?.availableClasses[0]?.id ?? ('' as number | ''),
        type: 'permanent' as 'permanent' | 'temporary',
        temporary_date: '',
        reason: '',
    });

    const mentorForm = useForm({
        study_class_id: mentorContext?.classes[0]?.id ?? ('' as number | ''),
        session_date: '',
        reason: '',
    });

    const statusBadge = (status: string) => {
        if (status === 'approved') {
            return (
                <span className="rounded-full bg-[#ECFDF5] px-2.5 py-0.5 text-xs font-semibold text-[#047857]">
                    Disetujui
                </span>
            );
        }
        if (status === 'rejected') {
            return (
                <span className="rounded-full bg-[#FFF1F2] px-2.5 py-0.5 text-xs font-semibold text-[#BE123C]">
                    Ditolak
                </span>
            );
        }
        return (
            <span className="rounded-full bg-[#FFFBEB] px-2.5 py-0.5 text-xs font-semibold text-[#B45309]">
                Menunggu ACC
            </span>
        );
    };

    return (
        <>
            <Head title="Pengajuan Pindah Kelas & Jadwal" />

            <div className="space-y-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                        {roleView === 'student'
                            ? 'Pengajuan Pindah Kelas / Ganti Jadwal Belajar'
                            : roleView === 'mentor'
                              ? 'Pengajuan Izin & Jadwal Pengganti Mentor'
                              : 'Persetujuan Pindah Kelas Murid & Pengganti Mentor'}
                    </h1>
                    <p className="text-sm text-[#475569]">
                        Semua perubahan jadwal memerlukan persetujuan Owner
                        (Master) atau Admin Rubelia.
                    </p>
                </div>

                {studentContext && (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                studentForm.post('/schedule-requests/student', {
                                    onSuccess: () =>
                                        studentForm.reset(
                                            'reason',
                                            'temporary_date',
                                        ),
                                });
                            }}
                            className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                    Form Pengajuan
                                </h2>
                                <span className="rounded-lg bg-[#FEF9C3] px-2.5 py-1 font-mono text-xs font-bold text-[#0F172A]">
                                    Sisa Kuota Tahun Ini:{' '}
                                    {studentContext.remainingSwitches}/
                                    {studentContext.maxSwitchesPerYear}
                                </span>
                            </div>

                            <div className="rounded-xl bg-[#F8FAFC] p-3.5 text-xs text-[#475569]">
                                Kelas Saat Ini:{' '}
                                <strong className="text-[#0F172A]">
                                    {studentContext.currentClass?.name ??
                                        'Belum ada'}
                                </strong>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Jenis Perubahan Jadwal</Label>
                                <select
                                    value={studentForm.data.type}
                                    onChange={(e) =>
                                        studentForm.setData(
                                            'type',
                                            e.target.value as
                                                | 'permanent'
                                                | 'temporary',
                                        )
                                    }
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="permanent">
                                        Pindah Kelas Permanen
                                    </option>
                                    <option value="temporary">
                                        Ganti Jadwal Sementara (1 Pertemuan)
                                    </option>
                                </select>
                            </div>

                            {studentForm.data.type === 'temporary' && (
                                <div className="grid gap-1.5">
                                    <Label>Tanggal Pertemuan Pengganti</Label>
                                    <Input
                                        type="date"
                                        value={studentForm.data.temporary_date}
                                        onChange={(e) =>
                                            studentForm.setData(
                                                'temporary_date',
                                                e.target.value,
                                            )
                                        }
                                        required
                                        className="h-11 font-mono"
                                    />
                                    <InputError
                                        message={
                                            studentForm.errors.temporary_date
                                        }
                                    />
                                </div>
                            )}

                            <div className="grid gap-1.5">
                                <Label>
                                    Pilih Kelas / Jadwal Tujuan yang Masih Ada
                                    Slot
                                </Label>
                                <select
                                    value={studentForm.data.to_class_id}
                                    onChange={(e) =>
                                        studentForm.setData(
                                            'to_class_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    {studentContext.availableClasses.length ===
                                        0 && (
                                        <option value="">
                                            -- Tidak ada kelas lain yang
                                            memiliki sisa slot --
                                        </option>
                                    )}
                                    {studentContext.availableClasses.map(
                                        (c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} | {c.days.join(', ')} (
                                                {c.start_time}-{c.end_time}) -
                                                Sisa {c.remaining_quota} slot
                                            </option>
                                        ),
                                    )}
                                </select>
                                <InputError
                                    message={studentForm.errors.to_class_id}
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Alasan Pengajuan</Label>
                                <textarea
                                    rows={3}
                                    value={studentForm.data.reason}
                                    onChange={(e) =>
                                        studentForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="Contoh: Jadwal ekstrakurikuler sekolah berubah ke sore hari..."
                                    className="rounded-xl border border-[#CBD5E1] p-3 text-sm"
                                />
                                <InputError
                                    message={studentForm.errors.reason}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    studentForm.processing ||
                                    studentContext.remainingSwitches <= 0 ||
                                    studentContext.availableClasses.length === 0
                                }
                                className="h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                <Send className="mr-1.5 size-4" />
                                Kirim Pengajuan
                            </Button>
                        </form>

                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Riwayat Pengajuan Anda
                            </h2>
                            <div className="mt-4 space-y-3">
                                {studentContext.requests.length === 0 ? (
                                    <p className="text-sm text-[#64748B]">
                                        Belum pernah mengajukan pindah kelas
                                        atau jadwal.
                                    </p>
                                ) : (
                                    studentContext.requests.map((r) => (
                                        <div
                                            key={r.id}
                                            className="rounded-xl border border-[#E2E8F0] p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-[#0F172A] uppercase">
                                                    {r.type === 'permanent'
                                                        ? 'Pindah Permanen'
                                                        : `Sementara (${r.temporary_date})`}
                                                </span>
                                                {statusBadge(r.status)}
                                            </div>
                                            <p className="mt-1.5 text-sm font-semibold text-[#0F172A]">
                                                {r.from_class?.name} {'->'}{' '}
                                                {r.to_class?.name}
                                            </p>
                                            <p className="mt-1 text-xs text-[#475569]">
                                                Alasan: {r.reason}
                                            </p>
                                            {r.review_note && (
                                                <p className="mt-1 text-xs font-medium text-[#0F172A]">
                                                    Catatan Admin:{' '}
                                                    {r.review_note}
                                                </p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {mentorContext && (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                mentorForm.post('/schedule-requests/mentor', {
                                    onSuccess: () =>
                                        mentorForm.reset(
                                            'session_date',
                                            'reason',
                                        ),
                                });
                            }}
                            className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                        >
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Form Izin / Ganti Jadwal Mengajar
                            </h2>
                            <p className="text-xs text-[#64748B]">
                                Jika disetujui, kelas tetap berjalan dan akan
                                digantikan oleh mentor lain yang kosong atau
                                langsung oleh Owner.
                            </p>

                            <div className="grid gap-1.5">
                                <Label>Pilih Kelas</Label>
                                <select
                                    value={mentorForm.data.study_class_id}
                                    onChange={(e) =>
                                        mentorForm.setData(
                                            'study_class_id',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="h-11 rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    {mentorContext.classes.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} (Sesi {c.session_number}:{' '}
                                            {c.start_time}-{c.end_time})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Tanggal Sesi yang Diizinkan</Label>
                                <Input
                                    type="date"
                                    value={mentorForm.data.session_date}
                                    onChange={(e) =>
                                        mentorForm.setData(
                                            'session_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="h-11 font-mono"
                                />
                                <InputError
                                    message={mentorForm.errors.session_date}
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label>
                                    Keterangan / Alasan Kampus atau Keperluan
                                </Label>
                                <textarea
                                    rows={3}
                                    value={mentorForm.data.reason}
                                    onChange={(e) =>
                                        mentorForm.setData(
                                            'reason',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="Contoh: Jadwal ujian praktikum kampus..."
                                    className="rounded-xl border border-[#CBD5E1] p-3 text-sm"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    mentorForm.processing ||
                                    mentorContext.classes.length === 0
                                }
                                className="h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                <Send className="mr-1.5 size-4" />
                                Kirim Pengajuan Izin
                            </Button>
                        </form>

                        <div className="space-y-6">
                            {mentorContext.substitutions.length > 0 && (
                                <div className="rounded-2xl border border-[#E2A829] bg-[#FEF9C3] p-5">
                                    <h3 className="font-display text-base font-bold text-[#0F172A]">
                                        Tugas Mengajar Pengganti untuk Anda
                                    </h3>
                                    <div className="mt-3 space-y-2">
                                        {mentorContext.substitutions.map(
                                            (s) => (
                                                <div
                                                    key={s.id}
                                                    className="rounded-xl bg-white p-3 text-xs"
                                                >
                                                    <span className="font-mono font-bold text-[#0F172A]">
                                                        {s.session_date}
                                                    </span>{' '}
                                                    —{' '}
                                                    <strong>
                                                        {s.study_class?.name}
                                                    </strong>{' '}
                                                    ({s.study_class?.start_time}
                                                    -{s.study_class?.end_time}),
                                                    menggantikan{' '}
                                                    {s.mentor?.name}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                    Riwayat Pengajuan Izin Anda
                                </h2>
                                <div className="mt-4 space-y-3">
                                    {mentorContext.leaveRequests.length ===
                                    0 ? (
                                        <p className="text-sm text-[#64748B]">
                                            Belum ada riwayat pengajuan izin.
                                        </p>
                                    ) : (
                                        mentorContext.leaveRequests.map((r) => (
                                            <div
                                                key={r.id}
                                                className="rounded-xl border border-[#E2E8F0] p-4"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-xs font-bold text-[#0F172A]">
                                                        Tanggal Sesi:{' '}
                                                        {r.session_date}
                                                    </span>
                                                    {statusBadge(r.status)}
                                                </div>
                                                <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                                                    {r.study_class?.name}
                                                </p>
                                                <p className="text-xs text-[#475569]">
                                                    Alasan: {r.reason}
                                                </p>
                                                {r.substitute && (
                                                    <p className="mt-1 text-xs font-semibold text-[#047857]">
                                                        Digantikan oleh:{' '}
                                                        {r.substitute.name} (
                                                        {roleLabel(
                                                            r.substitute.role,
                                                        )}
                                                        )
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {staffContext && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                1. Pengajuan Pindah Kelas / Jadwal Murid
                            </h2>
                            <div className="mt-4 space-y-3">
                                {staffContext.studentRequests.length === 0 ? (
                                    <p className="text-sm text-[#64748B]">
                                        Tidak ada pengajuan pindah kelas murid.
                                    </p>
                                ) : (
                                    staffContext.studentRequests.map((r) => (
                                        <div
                                            key={r.id}
                                            className="space-y-2 rounded-xl border border-[#E2E8F0] p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-[#0F172A]">
                                                    {r.student?.user?.name}{' '}
                                                    <span className="font-mono text-xs text-[#64748B]">
                                                        (
                                                        {
                                                            r.student
                                                                ?.student_code
                                                        }
                                                        )
                                                    </span>
                                                </p>
                                                {statusBadge(r.status)}
                                            </div>
                                            <p className="text-xs text-[#334155]">
                                                Jenis:{' '}
                                                <strong>
                                                    {r.type === 'permanent'
                                                        ? 'Permanen'
                                                        : `Sementara (${r.temporary_date})`}
                                                </strong>{' '}
                                                | {r.from_class?.name} {'->'}{' '}
                                                <strong>
                                                    {r.to_class?.name}
                                                </strong>
                                            </p>
                                            <p className="text-xs text-[#64748B]">
                                                Alasan: {r.reason}
                                            </p>

                                            {r.status === 'pending' && (
                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.post(
                                                                `/schedule-requests/student/${r.id}/review`,
                                                                {
                                                                    decision:
                                                                        'approved',
                                                                },
                                                            )
                                                        }
                                                        className="bg-[#E2A829] font-semibold text-[#0F172A]"
                                                    >
                                                        <Check className="mr-1 size-3.5" />
                                                        ACC Pindah
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            router.post(
                                                                `/schedule-requests/student/${r.id}/review`,
                                                                {
                                                                    decision:
                                                                        'rejected',
                                                                    review_note:
                                                                        'Jadwal tidak memungkinkan',
                                                                },
                                                            )
                                                        }
                                                        className="border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]"
                                                    >
                                                        <X className="mr-1 size-3.5" />
                                                        Tolak
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                2. Pengajuan Izin Mentor & Penunjukan Pengganti
                            </h2>
                            <div className="mt-4 space-y-3">
                                {staffContext.mentorRequests.length === 0 ? (
                                    <p className="text-sm text-[#64748B]">
                                        Tidak ada pengajuan izin mentor.
                                    </p>
                                ) : (
                                    staffContext.mentorRequests.map((m) => (
                                        <div
                                            key={m.id}
                                            className="space-y-2 rounded-xl border border-[#E2E8F0] p-4"
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-[#0F172A]">
                                                    {m.mentor?.name} —{' '}
                                                    <span className="font-mono text-xs">
                                                        {m.session_date}
                                                    </span>
                                                </p>
                                                {statusBadge(m.status)}
                                            </div>
                                            <p className="text-xs text-[#334155]">
                                                Kelas:{' '}
                                                <strong>
                                                    {m.study_class?.name}
                                                </strong>{' '}
                                                ({m.study_class?.start_time}-
                                                {m.study_class?.end_time})
                                            </p>
                                            <p className="text-xs text-[#64748B]">
                                                Alasan: {m.reason}
                                            </p>
                                            {m.substitute && (
                                                <p className="text-xs font-semibold text-[#047857]">
                                                    Pengganti:{' '}
                                                    {m.substitute.name} (
                                                    {roleLabel(
                                                        m.substitute.role,
                                                    )}
                                                    )
                                                </p>
                                            )}

                                            {m.status === 'pending' && (
                                                <div className="space-y-2 border-t border-[#F1F5F9] pt-2.5">
                                                    <Label className="text-xs">
                                                        Pilih Pengganti (Mentor
                                                        Kosong atau Owner
                                                        Langsung)
                                                    </Label>
                                                    <select
                                                        value={
                                                            subSelect[m.id] ??
                                                            ''
                                                        }
                                                        onChange={(e) =>
                                                            setSubSelect(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [m.id]: e
                                                                        .target
                                                                        .value
                                                                        ? Number(
                                                                              e
                                                                                  .target
                                                                                  .value,
                                                                          )
                                                                        : '',
                                                                }),
                                                            )
                                                        }
                                                        className="h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-xs"
                                                    >
                                                        <option value="">
                                                            -- Pilih Pengajar
                                                            Pengganti --
                                                        </option>
                                                        {staffContext.substituteCandidates
                                                            .filter(
                                                                (cand) =>
                                                                    cand.id !==
                                                                    m.mentor
                                                                        ?.id,
                                                            )
                                                            .map((cand) => (
                                                                <option
                                                                    key={
                                                                        cand.id
                                                                    }
                                                                    value={
                                                                        cand.id
                                                                    }
                                                                >
                                                                    {cand.name}{' '}
                                                                    (
                                                                    {cand.role ===
                                                                    'master'
                                                                        ? 'Owner Langsung Mengajar'
                                                                        : 'Mentor Pengganti'}
                                                                    )
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            disabled={
                                                                !subSelect[m.id]
                                                            }
                                                            onClick={() =>
                                                                router.post(
                                                                    `/schedule-requests/mentor/${m.id}/review`,
                                                                    {
                                                                        decision:
                                                                            'approved',
                                                                        substitute_user_id:
                                                                            subSelect[
                                                                                m
                                                                                    .id
                                                                            ],
                                                                    },
                                                                )
                                                            }
                                                            className="bg-[#E2A829] font-semibold text-[#0F172A]"
                                                        >
                                                            <Check className="mr-1 size-3.5" />
                                                            ACC & Tugaskan
                                                            Pengganti
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                router.post(
                                                                    `/schedule-requests/mentor/${m.id}/review`,
                                                                    {
                                                                        decision:
                                                                            'rejected',
                                                                    },
                                                                )
                                                            }
                                                            className="border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]"
                                                        >
                                                            <X className="mr-1 size-3.5" />
                                                            Tolak
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </>
    );
}
