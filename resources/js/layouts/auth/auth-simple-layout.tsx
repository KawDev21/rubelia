import { Link } from '@inertiajs/react';
import {
    CalendarCheck2,
    GraduationCap,
    MapPinCheckInside,
    ShieldCheck,
} from 'lucide-react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-[100dvh] bg-[#F8FAFC] lg:grid-cols-[5fr_6fr]">
            <aside className="flex flex-col justify-between bg-[#0F172A] p-6 text-[#F8FAFC] lg:p-12">
                <div className="flex items-center justify-between">
                    <Link
                        href={home()}
                        className="inline-flex items-center gap-3"
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[#E2A829] text-[#0F172A]">
                            <GraduationCap className="size-6 stroke-[2.25]" />
                        </div>
                        <div>
                            <span className="block font-display text-xl font-bold tracking-tight text-white">
                                Rubelia
                            </span>
                            <span className="block text-xs text-slate-400">
                                Portal Manajemen Bimbingan Belajar
                            </span>
                        </div>
                    </Link>
                    <span className="rounded-full border border-[#FFF1F2]/20 bg-[#FFF1F2]/10 px-3 py-1 text-xs font-medium text-[#FECDD3]">
                        Bimba - SD - SMP - SMA/SMK
                    </span>
                </div>

                <div className="my-8 hidden space-y-6 lg:block">
                    <div className="space-y-3">
                        <p className="inline-block rounded-md bg-[#E2A829]/15 px-2.5 py-1 font-mono text-xs font-semibold text-[#E2A829]">
                            SISTEM INTERNAL TERPADU
                        </p>
                        <h2 className="font-display text-3xl leading-tight font-bold text-white">
                            Pantau jadwal belajar, kehadiran, nilai, dan SPP
                            dalam satu pintu.
                        </h2>
                        <p className="max-w-[52ch] text-sm leading-relaxed text-slate-300">
                            Dirancang agar mudah digunakan oleh Wali Murid,
                            Mentor, Admin, dan Owner di layar HP maupun
                            komputer.
                        </p>
                    </div>

                    <div className="grid gap-3 pt-2 text-xs text-slate-300">
                        <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#1E293B]/70 p-3.5">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#E2A829]" />
                            <div>
                                <p className="font-semibold text-white">
                                    Format Email Login Resmi
                                </p>
                                <p className="mt-0.5 text-slate-300">
                                    Murid/Wali:{' '}
                                    <span className="font-mono text-[#FEF9C3]">
                                        R26110001@rubelia.com
                                    </span>{' '}
                                    | Mentor:{' '}
                                    <span className="font-mono text-[#FEF9C3]">
                                        nama@mentor.rubelia.com
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-[#1E293B]/50 p-3">
                                <MapPinCheckInside className="mt-0.5 size-4 shrink-0 text-[#E2A829]" />
                                <span>
                                    Presensi GPS terverifikasi & info WA
                                    otomatis ke Wali Murid
                                </span>
                            </div>
                            <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-[#1E293B]/50 p-3">
                                <CalendarCheck2 className="mt-0.5 size-4 shrink-0 text-[#E2A829]" />
                                <span>
                                    Tagihan SPP transparan tiap tanggal 28
                                    beserta kuitansi PDF
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="hidden text-xs text-slate-400 lg:block">
                    Bimbingan Belajar Rubelia - Akses khusus pengguna terdaftar
                </p>
            </aside>

            <main className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
                <div className="w-full max-w-md rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-[0_16px_32px_-12px_rgba(15,23,42,0.06)] sm:p-8">
                    <div className="mb-6 space-y-1.5">
                        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
                            {title}
                        </h1>
                        <p className="text-sm text-[#475569]">{description}</p>
                    </div>
                    {children}
                </div>
            </main>
        </div>
    );
}
