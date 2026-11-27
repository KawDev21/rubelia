import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Download,
    FileSpreadsheet,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/lib/rubelia';

type PayrollRow = {
    mentor_id: number;
    name: string;
    email: string;
    is_active: boolean;
    fee_per_session: number;
    total_sessions: number;
    substitute_sessions: number;
    late_sessions: number;
    total_late_minutes: number;
    total_fee: number;
    details: {
        id: number;
        date: string;
        class_name: string;
        session_number: number;
        scheduled_start: string;
        checked_in_at: string;
        distance_meters: number;
        late_minutes: number;
        is_substitute: boolean;
        fee: number;
    }[];
};

type Props = {
    month: string;
    payrollRows: PayrollRow[];
    grandTotalFee: number;
};

export default function MentorPayrollPage({
    month,
    payrollRows,
    grandTotalFee,
}: Props) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    return (
        <>
            <Head title="Gaji & Evaluasi Kinerja Mentor" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Rekap Fee Sesi & Kinerja Kehadiran Mentor
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Dihitung dari sesi mengajar berlokasi GPS valid
                            beserta detail jam hadir dan keterlambatan sebagai
                            bahan evaluasi Owner.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) =>
                                router.get(
                                    '/mentor-payroll',
                                    { month: e.target.value },
                                    { preserveState: true },
                                )
                            }
                            className="h-10 w-40 bg-white font-mono"
                        />
                        <Button asChild variant="outline" className="h-10">
                            <a
                                href={`/exports/mentor-attendance/pdf?month=${month}`}
                            >
                                <Download className="mr-1.5 size-4" />
                                PDF
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-10">
                            <a
                                href={`/exports/mentor-attendance/excel?month=${month}`}
                            >
                                <FileSpreadsheet className="mr-1.5 size-4" />
                                Excel
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-[#0F172A] p-5 text-white">
                    <p className="text-xs font-semibold text-slate-300 uppercase">
                        TOTAL ESTIMASI PEMBAYARAN FEE MENTOR ({month})
                    </p>
                    <p className="mt-1 font-mono text-3xl font-bold text-[#E2A829]">
                        {formatRupiah(grandTotalFee)}
                    </p>
                </div>

                <div className="space-y-3">
                    {payrollRows.map((row) => {
                        const open = expandedId === row.mentor_id;
                        return (
                            <div
                                key={row.mentor_id}
                                className="rounded-2xl border border-[#E2E8F0] bg-white p-5"
                            >
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <p className="font-display text-lg font-bold text-[#0F172A]">
                                            {row.name}
                                        </p>
                                        <p className="font-mono text-xs text-[#64748B]">
                                            {row.email} | Tarif Dasar:{' '}
                                            {formatRupiah(row.fee_per_session)}
                                            /sesi
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                            <span className="rounded bg-[#ECFDF5] px-2.5 py-0.5 font-semibold text-[#047857]">
                                                {row.total_sessions} Sesi Valid
                                            </span>
                                            {row.substitute_sessions > 0 && (
                                                <span className="rounded bg-[#FEF9C3] px-2.5 py-0.5 font-semibold text-[#713F12]">
                                                    {row.substitute_sessions}{' '}
                                                    Sesi Pengganti
                                                </span>
                                            )}
                                            <span
                                                className={`rounded px-2.5 py-0.5 font-semibold ${
                                                    row.late_sessions > 0
                                                        ? 'bg-[#FFF1F2] text-[#BE123C]'
                                                        : 'bg-[#F1F5F9] text-[#475569]'
                                                }`}
                                            >
                                                Telat: {row.late_sessions}x (
                                                {row.total_late_minutes} menit)
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                                        <div className="text-right">
                                            <p className="text-xs text-[#64748B]">
                                                Total Fee Bulan Ini
                                            </p>
                                            <p className="font-mono text-xl font-bold text-[#0F172A]">
                                                {formatRupiah(row.total_fee)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setExpandedId(
                                                    open ? null : row.mentor_id,
                                                )
                                            }
                                        >
                                            {open ? (
                                                <ChevronUp className="size-4" />
                                            ) : (
                                                <ChevronDown className="size-4" />
                                            )}
                                            <span className="ml-1">
                                                Detail Jam
                                            </span>
                                        </Button>
                                    </div>
                                </div>

                                {open && (
                                    <div className="mt-4 overflow-x-auto border-t border-[#F1F5F9] pt-4">
                                        {row.details.length === 0 ? (
                                            <p className="text-xs text-[#64748B]">
                                                Belum ada sesi mengajar pada
                                                bulan ini.
                                            </p>
                                        ) : (
                                            <table className="w-full min-w-[600px] text-left text-xs">
                                                <thead>
                                                    <tr className="bg-[#F8FAFC] font-semibold text-[#475569]">
                                                        <th className="px-3 py-2">
                                                            Tanggal
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Kelas & Sesi
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Jadwal vs Jam Absen
                                                        </th>
                                                        <th className="px-3 py-2">
                                                            Jarak GPS
                                                        </th>
                                                        <th className="px-3 py-2 text-right">
                                                            Fee Sesi
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-[#F1F5F9]">
                                                    {row.details.map((d) => (
                                                        <tr key={d.id}>
                                                            <td className="px-3 py-2 font-mono">
                                                                {d.date}
                                                            </td>
                                                            <td className="px-3 py-2 font-semibold text-[#0F172A]">
                                                                {d.class_name}{' '}
                                                                (Sesi{' '}
                                                                {
                                                                    d.session_number
                                                                }
                                                                )
                                                                {d.is_substitute &&
                                                                    ' [Pengganti]'}
                                                            </td>
                                                            <td className="px-3 py-2 font-mono">
                                                                {
                                                                    d.scheduled_start
                                                                }{' '}
                                                                {'->'}{' '}
                                                                {
                                                                    d.checked_in_at
                                                                }
                                                                {d.late_minutes >
                                                                    0 && (
                                                                    <span className="ml-1.5 font-bold text-[#BE123C]">
                                                                        (Telat{' '}
                                                                        {
                                                                            d.late_minutes
                                                                        }
                                                                        m)
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2 font-mono">
                                                                {
                                                                    d.distance_meters
                                                                }{' '}
                                                                m
                                                            </td>
                                                            <td className="px-3 py-2 text-right font-mono font-semibold">
                                                                {formatRupiah(
                                                                    d.fee,
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
