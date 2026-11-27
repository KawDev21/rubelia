import { Head, router, useForm } from '@inertiajs/react';
import {
    CheckCircle2,
    Download,
    FileSpreadsheet,
    LocateFixed,
    MapPinOff,
    Save,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RosterItem = {
    student_id: number;
    student_code: string;
    name: string;
    guardian_phone: string;
    status: 'hadir' | 'sakit' | 'izin' | 'alpha';
    wa_notified_at?: string | null;
    wa_error?: string | null;
};

type Props = {
    roleView: 'master' | 'admin' | 'mentor' | 'student';
    date?: string;
    selectedClassId?: number | null;
    canTeach?: boolean;
    geoConfig?: {
        officeName: string;
        officeLat: number;
        officeLng: number;
        maxRadiusMeters: number;
        lateToleranceMinutes: number;
    };
    classes?: {
        id: number;
        name: string;
        session_number: number;
        start_time: string;
        end_time: string;
        days: string[];
    }[];
    activeClass?: {
        id: number;
        name: string;
        level_name?: string | null;
        days: string[];
        session_number: number;
        start_time: string;
        end_time: string;
        mentor_name: string;
        is_substitute: boolean;
        session?: {
            id: number;
            checked_in_at: string;
            distance_meters: number;
            late_minutes: number;
            taught_by?: string | null;
            topic_notes?: string | null;
        } | null;
        roster: RosterItem[];
    } | null;
    recentSessions?: {
        id: number;
        session_date: string;
        session_number: number;
        checked_in_at: string;
        distance_meters: number;
        late_minutes: number;
        hadir_count: number;
        alpha_count: number;
        study_class?: { name: string };
        teacher?: { name: string };
    }[];
    studentAttendance?: {
        records: {
            data: {
                id: number;
                status: string;
                class_session?: {
                    session_date: string;
                    session_number: number;
                    study_class?: { name: string };
                    teacher?: { name: string };
                };
            }[];
        };
        summary: { hadir: number; sakit: number; izin: number; alpha: number };
    };
};

function calcDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return Math.round(
        R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))),
    );
}

export default function AttendanceIndex({
    roleView,
    date = '',
    selectedClassId,
    canTeach = false,
    geoConfig,
    classes = [],
    activeClass,
    recentSessions = [],
    studentAttendance,
}: Props) {
    const [gpsStatus, setGpsStatus] = useState<
        'idle' | 'loading' | 'ready' | 'error'
    >('idle');
    const [liveDistance, setLiveDistance] = useState<number | null>(null);

    const form = useForm({
        study_class_id: activeClass?.id ?? 0,
        session_date: date,
        latitude: '' as string | number,
        longitude: '' as string | number,
        topic_notes: activeClass?.session?.topic_notes ?? '',
        attendances: (activeClass?.roster ?? []).map((r) => ({
            student_id: r.student_id,
            status: r.status,
        })),
    });

    useEffect(() => {
        form.setData({
            study_class_id: activeClass?.id ?? 0,
            session_date: date,
            latitude: form.data.latitude,
            longitude: form.data.longitude,
            topic_notes: activeClass?.session?.topic_notes ?? '',
            attendances: (activeClass?.roster ?? []).map((r) => ({
                student_id: r.student_id,
                status: r.status,
            })),
        });
    }, [activeClass?.id, date]);

    const requestGps = () => {
        if (!navigator.geolocation || !geoConfig) {
            setGpsStatus('error');
            return;
        }
        setGpsStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = Number(pos.coords.latitude.toFixed(7));
                const lng = Number(pos.coords.longitude.toFixed(7));
                const dist = calcDistanceMeters(
                    geoConfig.officeLat,
                    geoConfig.officeLng,
                    lat,
                    lng,
                );
                setLiveDistance(dist);
                setGpsStatus('ready');
                form.setData((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));
            },
            () => {
                setGpsStatus('error');
                toast.error('Izin lokasi GPS belum aktif di browser Anda.');
            },
            { enableHighAccuracy: true, timeout: 12000 },
        );
    };

    useEffect(() => {
        if (canTeach && geoConfig) {
            requestGps();
        }
    }, [canTeach]);

    if (roleView === 'student' && studentAttendance) {
        return (
            <>
                <Head title="Riwayat Kehadiran Belajar" />
                <div className="space-y-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                                Daftar Kehadiran Murid
                            </h1>
                            <p className="text-sm text-[#475569]">
                                Rekap presensi setiap sesi bimbingan belajar di
                                Rubelia.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" className="h-10">
                                <a href="/exports/student-attendance/pdf">
                                    <Download className="mr-1.5 size-4" />
                                    Unduh PDF
                                </a>
                            </Button>
                            <Button asChild variant="outline" className="h-10">
                                <a href="/exports/student-attendance/excel">
                                    <FileSpreadsheet className="mr-1.5 size-4" />
                                    Unduh Excel
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-emerald-200 bg-[#ECFDF5] p-4">
                            <p className="font-mono text-2xl font-bold text-[#047857]">
                                {studentAttendance.summary.hadir}
                            </p>
                            <p className="text-xs font-semibold text-[#047857]">
                                Hadir
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                            <p className="font-mono text-2xl font-bold text-[#334155]">
                                {studentAttendance.summary.sakit}
                            </p>
                            <p className="text-xs font-semibold text-[#475569]">
                                Sakit
                            </p>
                        </div>
                        <div className="rounded-2xl border border-amber-200 bg-[#FFFBEB] p-4">
                            <p className="font-mono text-2xl font-bold text-[#B45309]">
                                {studentAttendance.summary.izin}
                            </p>
                            <p className="text-xs font-semibold text-[#B45309]">
                                Izin
                            </p>
                        </div>
                        <div className="rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4">
                            <p className="font-mono text-2xl font-bold text-[#BE123C]">
                                {studentAttendance.summary.alpha}
                            </p>
                            <p className="text-xs font-semibold text-[#BE123C]">
                                Alpha (Tanpa Keterangan)
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-6">
                        <div className="divide-y divide-[#F1F5F9]">
                            {studentAttendance.records.data.length === 0 ? (
                                <p className="py-6 text-center text-sm text-[#64748B]">
                                    Belum ada catatan kehadiran.
                                </p>
                            ) : (
                                studentAttendance.records.data.map((row) => (
                                    <div
                                        key={row.id}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div>
                                            <p className="font-semibold text-[#0F172A]">
                                                {row.class_session?.study_class
                                                    ?.name ?? '-'}{' '}
                                                (Sesi{' '}
                                                {
                                                    row.class_session
                                                        ?.session_number
                                                }
                                                )
                                            </p>
                                            <p className="font-mono text-xs text-[#64748B]">
                                                Tanggal:{' '}
                                                {
                                                    row.class_session
                                                        ?.session_date
                                                }{' '}
                                                | Pengajar:{' '}
                                                {row.class_session?.teacher
                                                    ?.name ?? '-'}
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                                row.status === 'hadir'
                                                    ? 'bg-[#ECFDF5] text-[#047857]'
                                                    : row.status === 'alpha'
                                                      ? 'bg-[#FFF1F2] text-[#BE123C]'
                                                      : 'bg-[#FFFBEB] text-[#B45309]'
                                            }`}
                                        >
                                            {row.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const setStudentStatus = (
        studentId: number,
        status: 'hadir' | 'sakit' | 'izin' | 'alpha',
    ) => {
        form.setData(
            'attendances',
            form.data.attendances.map((a) =>
                a.student_id === studentId ? { ...a, status } : a,
            ),
        );
    };

    const withinRadius =
        liveDistance !== null && geoConfig
            ? liveDistance <= geoConfig.maxRadiusMeters
            : false;

    return (
        <>
            <Head title="Absensi Sesi GPS & Kehadiran Murid" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Presensi GPS Mentor & Daftar Hadir Murid
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Murid berstatus{' '}
                            <strong className="text-[#BE123C]">Alpha</strong>{' '}
                            otomatis memicu notifikasi WhatsApp Fonnte ke nomor
                            Wali Murid.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" className="h-10">
                            <a href="/exports/mentor-attendance/pdf">
                                <Download className="mr-1.5 size-4" />
                                Rekap Sesi (PDF)
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-10">
                            <a href="/exports/mentor-attendance/excel">
                                <FileSpreadsheet className="mr-1.5 size-4" />
                                Rekap Sesi (Excel)
                            </a>
                        </Button>
                        {(roleView === 'master' || roleView === 'admin') && (
                            <Button asChild variant="outline" className="h-10">
                                <a href="/exports/student-attendance/excel">
                                    <FileSpreadsheet className="mr-1.5 size-4" />
                                    Absen Murid (Excel)
                                </a>
                            </Button>
                        )}
                    </div>
                </div>

                <section className="flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <Label>Pilih Kelas & Sesi</Label>
                        <select
                            value={selectedClassId ?? ''}
                            onChange={(e) =>
                                router.get(
                                    '/attendance',
                                    { class_id: e.target.value, date },
                                    { preserveState: true },
                                )
                            }
                            className="mt-1 h-11 w-full rounded-xl border border-[#CBD5E1] bg-white px-3 text-sm"
                        >
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    Sesi {c.session_number} ({c.start_time}-
                                    {c.end_time}) - {c.name} [
                                    {c.days.join(', ')}]
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <Label>Tanggal Pertemuan</Label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) =>
                                router.get(
                                    '/attendance',
                                    {
                                        class_id: selectedClassId,
                                        date: e.target.value,
                                    },
                                    { preserveState: true },
                                )
                            }
                            className="mt-1 h-11 font-mono"
                        />
                    </div>
                    {canTeach && (
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11"
                            onClick={requestGps}
                        >
                            <LocateFixed className="mr-1.5 size-4" />
                            Perbarui Titik GPS
                        </Button>
                    )}
                </section>

                {canTeach && geoConfig && (
                    <section
                        className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                            gpsStatus === 'ready' && withinRadius
                                ? 'border-emerald-200 bg-[#ECFDF5]'
                                : 'border-[#FECDD3] bg-[#FFF1F2]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {gpsStatus === 'ready' && withinRadius ? (
                                <CheckCircle2 className="size-5 shrink-0 text-[#047857]" />
                            ) : (
                                <MapPinOff className="size-5 shrink-0 text-[#BE123C]" />
                            )}
                            <div>
                                <p className="text-sm font-bold text-[#0F172A]">
                                    {gpsStatus === 'loading' &&
                                        'Mendeteksi titik koordinat GPS HP Anda...'}
                                    {gpsStatus === 'ready' &&
                                        `Jarak posisi Anda ke ${geoConfig.officeName}: ${liveDistance} meter (Batas radius: ${geoConfig.maxRadiusMeters}m)`}
                                    {gpsStatus === 'error' &&
                                        'Lokasi GPS belum terbaca. Aktifkan izin lokasi di browser untuk melakukan absensi sesi.'}
                                </p>
                                <p className="text-xs text-[#475569]">
                                    Toleransi keterlambatan sesi:{' '}
                                    {geoConfig.lateToleranceMinutes} menit dari
                                    jam mulai kelas.
                                </p>
                            </div>
                        </div>
                        <InputError message={form.errors.latitude} />
                    </section>
                )}

                {activeClass && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            form.post('/attendance');
                        }}
                        className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                    >
                        <div className="flex flex-col justify-between gap-2 border-b border-[#F1F5F9] pb-4 sm:flex-row sm:items-center">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded bg-[#0F172A] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#E2A829]">
                                        Sesi {activeClass.session_number} (
                                        {activeClass.start_time}-
                                        {activeClass.end_time})
                                    </span>
                                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                        {activeClass.name}
                                    </h2>
                                    {activeClass.is_substitute && (
                                        <span className="rounded bg-[#FEF9C3] px-2 py-0.5 text-xs font-semibold text-[#713F12]">
                                            Mode Pengganti / Owner
                                        </span>
                                    )}
                                </div>
                                {activeClass.session && (
                                    <p className="mt-1 font-mono text-xs text-[#047857]">
                                        Tercatat Check-in:{' '}
                                        {activeClass.session.checked_in_at} oleh{' '}
                                        {activeClass.session.taught_by} | Jarak:{' '}
                                        {activeClass.session.distance_meters}m
                                        {activeClass.session.late_minutes > 0
                                            ? ` | Terlambat ${activeClass.session.late_minutes} menit`
                                            : ' | Tepat Waktu'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {activeClass.roster.length === 0 ? (
                            <p className="py-6 text-center text-sm text-[#64748B]">
                                Belum ada murid aktif yang terdaftar pada kelas
                                ini.
                            </p>
                        ) : (
                            <div className="divide-y divide-[#F1F5F9]">
                                {activeClass.roster.map((st) => {
                                    const currentStatus =
                                        form.data.attendances.find(
                                            (a) =>
                                                a.student_id === st.student_id,
                                        )?.status ?? 'hadir';
                                    return (
                                        <div
                                            key={st.student_id}
                                            className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                                        >
                                            <div>
                                                <p className="font-semibold text-[#0F172A]">
                                                    {st.name}{' '}
                                                    <span className="font-mono text-xs text-[#64748B]">
                                                        ({st.student_code})
                                                    </span>
                                                </p>
                                                <p className="font-mono text-xs text-[#64748B]">
                                                    WA Wali: {st.guardian_phone}
                                                    {st.wa_notified_at && (
                                                        <span className="ml-2 text-[#047857]">
                                                            [WA Terkirim{' '}
                                                            {st.wa_notified_at}]
                                                        </span>
                                                    )}
                                                    {st.wa_error && (
                                                        <span className="ml-2 text-[#BE123C]">
                                                            [{st.wa_error}]
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-4 gap-1.5 sm:w-80">
                                                {(
                                                    [
                                                        'hadir',
                                                        'sakit',
                                                        'izin',
                                                        'alpha',
                                                    ] as const
                                                ).map((opt) => {
                                                    const active =
                                                        currentStatus === opt;
                                                    return (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            disabled={!canTeach}
                                                            onClick={() =>
                                                                setStudentStatus(
                                                                    st.student_id,
                                                                    opt,
                                                                )
                                                            }
                                                            className={`h-11 rounded-xl border text-xs font-bold uppercase transition-colors ${
                                                                active
                                                                    ? opt ===
                                                                      'hadir'
                                                                        ? 'border-[#047857] bg-[#047857] text-white'
                                                                        : opt ===
                                                                            'alpha'
                                                                          ? 'border-[#BE123C] bg-[#BE123C] text-white'
                                                                          : 'border-[#0F172A] bg-[#0F172A] text-[#E2A829]'
                                                                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {canTeach && activeClass.roster.length > 0 && (
                            <div className="space-y-3 border-t border-[#F1F5F9] pt-4">
                                <div>
                                    <Label>
                                        Catatan Materi / Perkembangan Sesi
                                        (Jurnal Mengajar)
                                    </Label>
                                    <Input
                                        value={form.data.topic_notes}
                                        onChange={(e) =>
                                            form.setData(
                                                'topic_notes',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Latihan persamaan linear satu variabel & evaluasi kuis..."
                                        className="mt-1 h-11"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        form.data.latitude === ''
                                    }
                                    className="h-12 w-full bg-[#E2A829] text-sm font-bold text-[#0F172A] hover:bg-[#CA8A04] sm:w-auto sm:px-8"
                                >
                                    <Save className="mr-2 size-4" />
                                    {form.processing
                                        ? 'Menyimpan Absen & Memproses WA...'
                                        : 'Simpan Absensi Sesi & Kirim WA untuk Murid Alpha'}
                                </Button>
                            </div>
                        )}
                    </form>
                )}

                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                    <h2 className="font-display text-lg font-bold text-[#0F172A]">
                        Riwayat Sesi & Ketepatan Waktu Absen Mentor Terbaru
                    </h2>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs font-semibold text-[#475569] uppercase">
                                    <th className="px-3 py-2.5">Tanggal</th>
                                    <th className="px-3 py-2.5">
                                        Kelas & Sesi
                                    </th>
                                    <th className="px-3 py-2.5">Pengajar</th>
                                    <th className="px-3 py-2.5">
                                        Jam Absen & GPS
                                    </th>
                                    <th className="px-3 py-2.5">
                                        Hadir / Alpha
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {recentSessions.map((s) => (
                                    <tr key={s.id}>
                                        <td className="px-3 py-3 font-mono text-xs">
                                            {s.session_date}
                                        </td>
                                        <td className="px-3 py-3 font-semibold text-[#0F172A]">
                                            {s.study_class?.name} (Sesi{' '}
                                            {s.session_number})
                                        </td>
                                        <td className="px-3 py-3">
                                            {s.teacher?.name}
                                        </td>
                                        <td className="px-3 py-3 font-mono text-xs">
                                            {s.checked_in_at.slice(11, 19) ||
                                                s.checked_in_at}{' '}
                                            ({s.distance_meters}m)
                                            {s.late_minutes > 0 ? (
                                                <span className="ml-1.5 rounded bg-[#FFF1F2] px-1.5 py-0.5 font-bold text-[#BE123C]">
                                                    Telat {s.late_minutes}m
                                                </span>
                                            ) : (
                                                <span className="ml-1.5 rounded bg-[#ECFDF5] px-1.5 py-0.5 font-bold text-[#047857]">
                                                    Tepat
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 font-mono text-xs">
                                            Hadir: {s.hadir_count} | Alpha:{' '}
                                            {s.alpha_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </>
    );
}
