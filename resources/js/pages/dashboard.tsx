import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    BellRing,
    CalendarCheck,
    CheckCircle2,
    ClipboardCheck,
    Clock,
    MapPin,
    MessageSquareText,
    UserPlus,
    Users,
    Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRupiah, levelBadgeClass, roleLabel } from '@/lib/rubelia';
import type { Auth } from '@/types';

type BroadcastItem = {
    id: number;
    title: string;
    body: string;
    created_at: string;
};

type DashboardProps = {
    roleView: 'master' | 'admin' | 'mentor' | 'student';
    todayLabel: string;
    broadcasts: BroadcastItem[];
    staffStats?: {
        activeStudents: number;
        activeMentors: number;
        activeClasses: number;
        unpaidInvoices: number;
        pendingPayments: number;
        pendingRequests: number;
        monthIncome: number;
        monthExpense: number;
        levels: {
            id: number;
            name: string;
            slug: string;
            monthly_fee: number;
            active_students_count: number;
        }[];
        todayClasses: {
            id: number;
            name: string;
            level: string;
            level_slug: string;
            session_number: number;
            start_time: string;
            end_time: string;
            mentor_name: string;
            students_count: number;
            quota: number;
            checked_in: boolean;
            taught_by?: string | null;
            late_minutes: number;
        }[];
    };
    mentorStats?: {
        validSessionsMonth: number;
        lateSessionsMonth: number;
        estimatedFeeMonth: number;
        feePerSession: number;
        todayClasses: {
            id: number;
            name: string;
            level: string;
            session_number: number;
            start_time: string;
            end_time: string;
            students_count: number;
            is_substitute: boolean;
            checked_in: boolean;
        }[];
    };
    studentStats?: {
        studentCode?: string | null;
        guardianName?: string | null;
        levelName?: string | null;
        levelSlug?: string | null;
        activeClass?: {
            name: string;
            days: string[];
            session_number: number;
            start_time: string;
            end_time: string;
            mentor_name: string;
        } | null;
        unpaidCount: number;
        unpaidTotal: number;
        pendingVerificationCount: number;
        attendance: {
            hadir: number;
            sakit: number;
            izin: number;
            alpha: number;
        };
        recentGrades: {
            id: number;
            subject_topic: string;
            graded_at: string;
            score: number;
            notes?: string | null;
        }[];
        canEvaluateMentor: boolean;
        evaluationYear: number;
    };
};

export default function Dashboard({
    roleView,
    todayLabel,
    broadcasts,
    staffStats,
    mentorStats,
    studentStats,
}: DashboardProps) {
    const { auth } = usePage<{ auth: Auth }>().props;

    return (
        <>
            <Head title="Dashboard Rubelia" />

            <div className="space-y-6">
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#0F172A] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#E2A829]">
                                {roleLabel(auth.user.role)}
                            </span>
                            <span className="font-mono text-xs text-[#64748B]">
                                {todayLabel}
                            </span>
                        </div>
                        <h1 className="mt-2 font-display text-2xl font-bold text-[#0F172A] sm:text-3xl">
                            Selamat datang, {auth.user.name}
                        </h1>
                        <p className="mt-0.5 text-sm text-[#475569]">
                            Login sebagai{' '}
                            <span className="font-mono text-[#0F172A]">
                                {auth.user.email}
                            </span>
                        </p>
                    </div>

                    {(roleView === 'master' || roleView === 'admin') && (
                        <div className="flex flex-wrap gap-2.5">
                            <Button
                                asChild
                                className="h-11 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                <Link href="/students">
                                    <UserPlus className="mr-1.5 size-4" />
                                    Daftar Murid Baru
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11">
                                <Link href="/finance">
                                    <Wallet className="mr-1.5 size-4" />
                                    Verifikasi SPP
                                </Link>
                            </Button>
                        </div>
                    )}

                    {roleView === 'mentor' && (
                        <Button
                            asChild
                            className="h-11 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                        >
                            <Link href="/attendance">
                                <MapPin className="mr-1.5 size-4" />
                                Absen GPS Sesi Sekarang
                            </Link>
                        </Button>
                    )}

                    {roleView === 'student' && (
                        <Button
                            asChild
                            className="h-11 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                        >
                            <Link href="/student/invoices">
                                <Wallet className="mr-1.5 size-4" />
                                Cek & Bayar Tagihan SPP
                            </Link>
                        </Button>
                    )}
                </section>

                {broadcasts.length > 0 && (
                    <section className="rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4 sm:p-5">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#BE123C] uppercase">
                            <BellRing className="size-4" />
                            <span>Pengumuman Rubelia Terbaru</span>
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            {broadcasts.map((b) => (
                                <div
                                    key={b.id}
                                    className="rounded-xl border border-[#FECDD3]/70 bg-white p-3.5"
                                >
                                    <p className="font-semibold text-[#0F172A]">
                                        {b.title}
                                    </p>
                                    <p className="mt-1 text-sm text-[#475569]">
                                        {b.body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {staffStats && (
                    <>
                        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                                <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                                    <span>TOTAL MURID AKTIF</span>
                                    <Users className="size-4 text-[#0F172A]" />
                                </div>
                                <p className="mt-2 font-mono text-3xl font-bold text-[#0F172A]">
                                    {staffStats.activeStudents}
                                </p>
                                <p className="mt-1 text-xs text-[#64748B]">
                                    Tersebar di {staffStats.activeClasses} kelas
                                    aktif ({staffStats.activeMentors} mentor)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                                <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                                    <span>VERIFIKASI PEMBAYARAN</span>
                                    <Wallet className="size-4 text-[#CA8A04]" />
                                </div>
                                <p className="mt-2 font-mono text-3xl font-bold text-[#0F172A]">
                                    {staffStats.pendingPayments}
                                </p>
                                <p className="mt-1 text-xs text-[#64748B]">
                                    Menunggu ACC ({staffStats.unpaidInvoices}{' '}
                                    tagihan belum dibayar)
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                                <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                                    <span>PENGAJUAN JADWAL</span>
                                    <Clock className="size-4 text-[#BE123C]" />
                                </div>
                                <p className="mt-2 font-mono text-3xl font-bold text-[#0F172A]">
                                    {staffStats.pendingRequests}
                                </p>
                                <p className="mt-1 text-xs text-[#64748B]">
                                    Permintaan pindah kelas murid / izin mentor
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-[#0F172A] p-5 text-white">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                                    <span>KAS MASUK BULAN INI</span>
                                    <span className="rounded bg-[#E2A829] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0F172A]">
                                        AKTIF
                                    </span>
                                </div>
                                <p className="mt-2 font-mono text-2xl font-bold text-[#E2A829]">
                                    {formatRupiah(staffStats.monthIncome)}
                                </p>
                                <p className="mt-1 font-mono text-xs text-slate-300">
                                    Pengeluaran:{' '}
                                    {formatRupiah(staffStats.monthExpense)}
                                </p>
                            </div>
                        </section>

                        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                            Jadwal Sesi Kelas Hari Ini
                                        </h2>
                                        <p className="text-xs text-[#64748B]">
                                            Pantau keterlaksanaan sesi dan
                                            ketepatan waktu absen GPS mentor
                                        </p>
                                    </div>
                                    <Link
                                        href="/attendance"
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F172A] hover:underline"
                                    >
                                        Buka Absensi{' '}
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>

                                {staffStats.todayClasses.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">
                                        Tidak ada kelas terjadwal pada hari ini.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-[#F1F5F9]">
                                        {staffStats.todayClasses.map((cls) => (
                                            <div
                                                key={cls.id}
                                                className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span
                                                            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${levelBadgeClass(cls.level_slug)}`}
                                                        >
                                                            {cls.level}
                                                        </span>
                                                        <span className="font-semibold text-[#0F172A]">
                                                            {cls.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-[#475569]">
                                                        Sesi{' '}
                                                        {cls.session_number} (
                                                        <span className="font-mono">
                                                            {cls.start_time}-
                                                            {cls.end_time}
                                                        </span>
                                                        ) | Mentor:{' '}
                                                        <strong>
                                                            {cls.mentor_name}
                                                        </strong>{' '}
                                                        | Kuota:{' '}
                                                        <span className="font-mono">
                                                            {cls.students_count}
                                                            /{cls.quota}
                                                        </span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {cls.checked_in ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-1 text-xs font-semibold text-[#047857]">
                                                            <CheckCircle2 className="size-3.5" />
                                                            Hadir (
                                                            {cls.taught_by})
                                                            {cls.late_minutes >
                                                                0 &&
                                                                ` - Telat ${cls.late_minutes}m`}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFFBEB] px-3 py-1 text-xs font-semibold text-[#B45309]">
                                                            <span className="size-2 animate-pulse rounded-full bg-[#D97706]" />
                                                            Belum Absen
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                    Sebaran Murid per Jenjang
                                </h2>
                                <p className="mb-4 text-xs text-[#64748B]">
                                    Tarif SPP bulanan ditagih otomatis setiap
                                    tanggal 28 (Sabtu 27 bila Minggu)
                                </p>
                                <div className="space-y-3">
                                    {staffStats.levels.map((lvl) => (
                                        <div
                                            key={lvl.id}
                                            className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"
                                        >
                                            <div>
                                                <span
                                                    className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${levelBadgeClass(lvl.slug)}`}
                                                >
                                                    {lvl.name}
                                                </span>
                                                <p className="mt-1 font-mono text-xs text-[#475569]">
                                                    SPP:{' '}
                                                    {formatRupiah(
                                                        lvl.monthly_fee,
                                                    )}
                                                    /bln
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono text-xl font-bold text-[#0F172A]">
                                                    {lvl.active_students_count}
                                                </p>
                                                <p className="text-[11px] text-[#64748B]">
                                                    murid aktif
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {mentorStats && (
                    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Sesi Mengajar Anda Hari Ini
                            </h2>
                            <p className="mb-4 text-xs text-[#64748B]">
                                Pastikan Anda berada di area gedung Rubelia saat
                                melakukan check-in GPS setiap sesi
                            </p>

                            {mentorStats.todayClasses.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-8 text-center text-sm text-[#64748B]">
                                    Tidak ada jadwal sesi mengajar Anda hari
                                    ini.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {mentorStats.todayClasses.map((cls) => (
                                        <div
                                            key={cls.id}
                                            className="flex flex-col justify-between gap-3 rounded-xl border border-[#E2E8F0] p-4 sm:flex-row sm:items-center"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded bg-[#0F172A] px-2 py-0.5 font-mono text-xs font-semibold text-[#E2A829]">
                                                        Sesi{' '}
                                                        {cls.session_number}
                                                    </span>
                                                    <span className="font-semibold text-[#0F172A]">
                                                        {cls.name}
                                                    </span>
                                                    {cls.is_substitute && (
                                                        <span className="rounded bg-[#FEF9C3] px-2 py-0.5 text-xs font-semibold text-[#713F12]">
                                                            Pengganti
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-[#475569]">
                                                    Jam{' '}
                                                    <span className="font-mono">
                                                        {cls.start_time} -{' '}
                                                        {cls.end_time}
                                                    </span>{' '}
                                                    | {cls.students_count} murid
                                                    terdaftar
                                                </p>
                                            </div>
                                            <Button
                                                asChild
                                                size="sm"
                                                className={
                                                    cls.checked_in
                                                        ? 'h-10 bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5]'
                                                        : 'h-10 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]'
                                                }
                                            >
                                                <Link
                                                    href={`/attendance?class_id=${cls.id}`}
                                                >
                                                    <ClipboardCheck className="mr-1.5 size-4" />
                                                    {cls.checked_in
                                                        ? 'Lihat / Edit Absen'
                                                        : 'Absen GPS & Murid'}
                                                </Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[#E2E8F0] bg-[#0F172A] p-5 text-white">
                                <p className="text-xs font-semibold text-slate-300 uppercase">
                                    ESTIMASI FEE MENGAJAR BULAN INI
                                </p>
                                <p className="mt-2 font-mono text-2xl font-bold text-[#E2A829]">
                                    {formatRupiah(
                                        mentorStats.estimatedFeeMonth,
                                    )}
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    {mentorStats.validSessionsMonth} sesi valid
                                    x {formatRupiah(mentorStats.feePerSession)}
                                    /sesi
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                                <p className="text-xs font-semibold text-[#64748B] uppercase">
                                    CATATAN KETEPATAN WAKTU BULAN INI
                                </p>
                                <p className="mt-2 font-mono text-2xl font-bold text-[#0F172A]">
                                    {mentorStats.lateSessionsMonth} sesi
                                    terlambat
                                </p>
                                <div className="mt-4">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-10 w-full"
                                    >
                                        <Link href="/schedule-requests">
                                            Ajukan Izin / Ganti Jadwal
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {studentStats && (
                    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="space-y-6">
                            {studentStats.canEvaluateMentor && (
                                <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#E2A829] bg-[#FEF9C3] p-4 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="font-display text-base font-bold text-[#0F172A]">
                                            Penilaian Akhir Tahun Mentor (
                                            {studentStats.evaluationYear})
                                            Dibuka
                                        </p>
                                        <p className="text-xs text-[#713F12]">
                                            Berikan ulasan jujur mengenai cara
                                            mengajar mentor di kelas Anda. Hanya
                                            Owner & Admin yang dapat membaca
                                            ulasan ini.
                                        </p>
                                    </div>
                                    <Button
                                        asChild
                                        className="h-10 shrink-0 bg-[#0F172A] text-white hover:bg-[#1E293B]"
                                    >
                                        <Link href="/evaluations">
                                            <MessageSquareText className="mr-1.5 size-4" />
                                            Isi Ulasan Mentor
                                        </Link>
                                    </Button>
                                </div>
                            )}

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <span
                                            className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${levelBadgeClass(studentStats.levelSlug)}`}
                                        >
                                            Jenjang{' '}
                                            {studentStats.levelName ?? '-'}
                                        </span>
                                        <h2 className="mt-2 font-display text-lg font-bold text-[#0F172A]">
                                            Informasi Kelas Aktif
                                        </h2>
                                    </div>
                                    <span className="rounded-lg bg-[#F1F5F9] px-3 py-1 font-mono text-xs font-semibold text-[#0F172A]">
                                        ID: {studentStats.studentCode}
                                    </span>
                                </div>

                                {studentStats.activeClass ? (
                                    <div className="mt-4 grid gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-[#64748B]">
                                                Nama Kelas & Sesi
                                            </p>
                                            <p className="font-semibold text-[#0F172A]">
                                                {studentStats.activeClass.name}{' '}
                                                (Sesi{' '}
                                                {
                                                    studentStats.activeClass
                                                        .session_number
                                                }
                                                )
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#64748B]">
                                                Hari & Jam Belajar
                                            </p>
                                            <p className="font-mono text-sm font-semibold text-[#0F172A]">
                                                {studentStats.activeClass.days.join(
                                                    ', ',
                                                )}{' '}
                                                |{' '}
                                                {
                                                    studentStats.activeClass
                                                        .start_time
                                                }
                                                -
                                                {
                                                    studentStats.activeClass
                                                        .end_time
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#64748B]">
                                                Mentor Pengajar
                                            </p>
                                            <p className="font-semibold text-[#0F172A]">
                                                {
                                                    studentStats.activeClass
                                                        .mentor_name
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#64748B]">
                                                Wali Murid Terdaftar
                                            </p>
                                            <p className="font-semibold text-[#0F172A]">
                                                {studentStats.guardianName}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-3 text-sm text-[#64748B]">
                                        Belum terdaftar pada kelas aktif.
                                    </p>
                                )}

                                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                                    <div className="rounded-xl bg-[#ECFDF5] p-3">
                                        <p className="font-mono text-xl font-bold text-[#047857]">
                                            {studentStats.attendance.hadir}
                                        </p>
                                        <p className="text-xs font-medium text-[#047857]">
                                            Hadir
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-[#F1F5F9] p-3">
                                        <p className="font-mono text-xl font-bold text-[#334155]">
                                            {studentStats.attendance.sakit}
                                        </p>
                                        <p className="text-xs font-medium text-[#475569]">
                                            Sakit
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-[#FFFBEB] p-3">
                                        <p className="font-mono text-xl font-bold text-[#B45309]">
                                            {studentStats.attendance.izin}
                                        </p>
                                        <p className="text-xs font-medium text-[#B45309]">
                                            Izin
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-[#FFF1F2] p-3">
                                        <p className="font-mono text-xl font-bold text-[#BE123C]">
                                            {studentStats.attendance.alpha}
                                        </p>
                                        <p className="text-xs font-medium text-[#BE123C]">
                                            Alpha
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-display text-base font-bold text-[#0F172A]">
                                        Nilai Akademik Terbaru
                                    </h3>
                                    <Link
                                        href="/grades"
                                        className="text-xs font-semibold text-[#0F172A] hover:underline"
                                    >
                                        Semua Nilai & Ekspor
                                    </Link>
                                </div>
                                {studentStats.recentGrades.length === 0 ? (
                                    <p className="text-sm text-[#64748B]">
                                        Belum ada nilai yang diinput oleh
                                        mentor.
                                    </p>
                                ) : (
                                    <div className="divide-y divide-[#F1F5F9]">
                                        {studentStats.recentGrades.map((g) => (
                                            <div
                                                key={g.id}
                                                className="flex items-center justify-between py-2.5"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-[#0F172A]">
                                                        {g.subject_topic}
                                                    </p>
                                                    <p className="font-mono text-xs text-[#64748B]">
                                                        {g.graded_at}
                                                    </p>
                                                </div>
                                                <span className="rounded-lg bg-[#FEF9C3] px-3 py-1 font-mono text-sm font-bold text-[#0F172A]">
                                                    {g.score}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-[#E2E8F0] bg-[#0F172A] p-5 text-white">
                                <p className="text-xs font-semibold text-slate-300 uppercase">
                                    STATUS TAGIHAN SPP
                                </p>
                                <p className="mt-2 font-mono text-2xl font-bold text-[#E2A829]">
                                    {formatRupiah(studentStats.unpaidTotal)}
                                </p>
                                <p className="mt-1 text-xs text-slate-300">
                                    {studentStats.unpaidCount} bulan belum
                                    dibayar
                                    {studentStats.pendingVerificationCount >
                                        0 &&
                                        ` (${studentStats.pendingVerificationCount} menunggu verifikasi)`}
                                </p>
                                <Button
                                    asChild
                                    className="mt-4 h-11 w-full bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                                >
                                    <Link href="/student/invoices">
                                        Lihat & Bayar SPP
                                    </Link>
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                                <h3 className="font-display text-base font-bold text-[#0F172A]">
                                    Aksi Cepat Wali / Murid
                                </h3>
                                <div className="mt-3 grid gap-2">
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-11 justify-start"
                                    >
                                        <Link href="/schedule-requests">
                                            <CalendarCheck className="mr-2 size-4" />
                                            Ajukan Pindah Kelas / Jadwal
                                        </Link>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-11 justify-start"
                                    >
                                        <a href="/exports/student-grades/pdf">
                                            <Award className="mr-2 size-4" />
                                            Unduh Rapor Nilai (PDF)
                                        </a>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="h-11 justify-start"
                                    >
                                        <a href="/exports/student-attendance/pdf">
                                            <ClipboardCheck className="mr-2 size-4" />
                                            Unduh Rekap Kehadiran (PDF)
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}
