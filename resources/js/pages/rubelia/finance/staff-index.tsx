import { Head, router, useForm } from '@inertiajs/react';
import {
    Banknote,
    Check,
    Download,
    ExternalLink,
    FileSpreadsheet,
    Plus,
    Receipt,
    X,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/lib/rubelia';

type PendingPayment = {
    id: number;
    payment_code: string;
    total_amount: number;
    proof_path?: string | null;
    paid_at?: string | null;
    student?: {
        student_code: string;
        user?: { name: string };
        education_level?: { name: string };
    };
    invoices: {
        id: number;
        invoice_number: string;
        billing_period: string;
        amount: number;
    }[];
};

type Props = {
    month: string;
    pendingPayments: PendingPayment[];
    recentPayments: {
        id: number;
        payment_code: string;
        method: string;
        total_amount: number;
        status: string;
        student?: { user?: { name: string } };
        verifier?: { name: string };
    }[];
    unpaidInvoices: {
        id: number;
        invoice_number: string;
        billing_period: string;
        amount: number;
        student_id: number;
        student?: {
            student_code: string;
            user?: { name: string };
            education_level?: { name: string };
        };
    }[];
    transactions: {
        id: number;
        transaction_code: string;
        type: 'income' | 'expense';
        category: string;
        amount: number;
        transaction_date: string;
        description: string;
        creator?: { name: string };
    }[];
    summary: {
        incomeTotal: number;
        expenseTotal: number;
        netBalance: number;
        unpaidCount: number;
        unpaidSum: number;
    };
};

export default function StaffFinanceIndex({
    month,
    pendingPayments,
    recentPayments,
    unpaidInvoices,
    transactions,
    summary,
}: Props) {
    const [rejectReasons, setRejectReasons] = useState<Record<number, string>>(
        {},
    );

    const billForm = useForm({
        billing_period: month,
    });

    const cashForm = useForm({
        type: 'expense' as 'income' | 'expense',
        category: 'operasional',
        amount: 0,
        transaction_date: new Date().toISOString().slice(0, 10),
        description: '',
    });

    return (
        <>
            <Head title="Verifikasi SPP & Keuangan Rubelia" />

            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                            Verifikasi SPP & Buku Kas Keuangan Rubelia
                        </h1>
                        <p className="text-sm text-[#475569]">
                            Kelola verifikasi bukti transfer wali murid,
                            pelunasan tunai di tempat, serta arus kas masuk dan
                            keluar.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            type="month"
                            value={month}
                            onChange={(e) =>
                                router.get(
                                    '/finance',
                                    { month: e.target.value },
                                    { preserveState: true },
                                )
                            }
                            className="h-10 w-40 bg-white font-mono"
                        />
                        <Button asChild variant="outline" className="h-10">
                            <a href={`/exports/finance/pdf?month=${month}`}>
                                <Download className="mr-1.5 size-4" />
                                Kas PDF
                            </a>
                        </Button>
                        <Button asChild variant="outline" className="h-10">
                            <a href={`/exports/finance/excel?month=${month}`}>
                                <FileSpreadsheet className="mr-1.5 size-4" />
                                Kas Excel
                            </a>
                        </Button>
                    </div>
                </div>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                        <p className="text-xs font-semibold text-[#64748B]">
                            PEMASUKAN ({month})
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold text-[#047857]">
                            {formatRupiah(summary.incomeTotal)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                        <p className="text-xs font-semibold text-[#64748B]">
                            PENGELUARAN ({month})
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold text-[#BE123C]">
                            {formatRupiah(summary.expenseTotal)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#E2E8F0] bg-[#0F172A] p-5 text-white">
                        <p className="text-xs font-semibold text-slate-300">
                            SALDO BERSIH ({month})
                        </p>
                        <p className="mt-2 font-mono text-2xl font-bold text-[#E2A829]">
                            {formatRupiah(summary.netBalance)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                        <p className="text-xs font-semibold text-[#64748B]">
                            PIUTANG SPP BELUM BAYAR
                        </p>
                        <p className="mt-2 font-mono text-xl font-bold text-[#0F172A]">
                            {formatRupiah(summary.unpaidSum)}
                        </p>
                        <p className="text-xs text-[#64748B]">
                            {summary.unpaidCount} tagihan terbuka
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border-2 border-[#0F172A] bg-white p-5 sm:p-6">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Antrean Verifikasi Bukti Transfer SPP (
                                {pendingPayments.length})
                            </h2>
                            <p className="text-xs text-[#64748B]">
                                Cek kesesuaian nominal bukti transfer sebelum
                                menekan ACC Lunas. Jika ditolak, tagihan kembali
                                ke daftar belum dibayar.
                            </p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                billForm.post('/finance/generate-bills');
                            }}
                            className="flex items-center gap-2"
                        >
                            <Input
                                type="month"
                                value={billForm.data.billing_period}
                                onChange={(e) =>
                                    billForm.setData(
                                        'billing_period',
                                        e.target.value,
                                    )
                                }
                                className="h-10 w-36 font-mono"
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={billForm.processing}
                                className="h-10 text-xs font-semibold"
                            >
                                Terbitkan Tagihan SPP
                            </Button>
                        </form>
                    </div>

                    <div className="mt-4 space-y-3">
                        {pendingPayments.length === 0 ? (
                            <p className="rounded-xl bg-[#F8FAFC] p-6 text-center text-sm text-[#64748B]">
                                Tidak ada antrean bukti transfer yang menunggu
                                verifikasi.
                            </p>
                        ) : (
                            pendingPayments.map((p) => (
                                <div
                                    key={p.id}
                                    className="space-y-3 rounded-xl border border-[#E2E8F0] p-4"
                                >
                                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="font-semibold text-[#0F172A]">
                                                {p.student?.user?.name}{' '}
                                                <span className="font-mono text-xs text-[#64748B]">
                                                    ({p.student?.student_code} -{' '}
                                                    {
                                                        p.student
                                                            ?.education_level
                                                            ?.name
                                                    }
                                                    )
                                                </span>
                                            </p>
                                            <p className="font-mono text-sm font-bold text-[#0F172A]">
                                                Total Transfer:{' '}
                                                {formatRupiah(p.total_amount)} |
                                                Bulan:{' '}
                                                {p.invoices
                                                    .map(
                                                        (i) => i.billing_period,
                                                    )
                                                    .join(', ')}
                                            </p>
                                        </div>

                                        {p.proof_path && (
                                            <a
                                                href={`/storage/${p.proof_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#E2E8F0]"
                                            >
                                                <ExternalLink className="size-3.5" />
                                                Lihat Bukti Transfer
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() =>
                                                router.post(
                                                    `/finance/payments/${p.id}/verify`,
                                                    {
                                                        decision: 'approved',
                                                    },
                                                )
                                            }
                                            className="h-10 bg-[#E2A829] font-semibold text-[#0F172A] hover:bg-[#CA8A04]"
                                        >
                                            <Check className="mr-1.5 size-4" />
                                            ACC Sesuai & Lunasi
                                        </Button>
                                        <Input
                                            placeholder="Alasan penolakan (jika nominal tidak sesuai / buram)..."
                                            value={rejectReasons[p.id] ?? ''}
                                            onChange={(e) =>
                                                setRejectReasons((prev) => ({
                                                    ...prev,
                                                    [p.id]: e.target.value,
                                                }))
                                            }
                                            className="h-10 flex-1 text-xs"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                                router.post(
                                                    `/finance/payments/${p.id}/verify`,
                                                    {
                                                        decision: 'rejected',
                                                        rejection_note:
                                                            rejectReasons[
                                                                p.id
                                                            ] ||
                                                            'Nominal atau bukti transfer belum sesuai.',
                                                    },
                                                )
                                            }
                                            className="h-10 border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]"
                                        >
                                            <X className="mr-1 size-4" />
                                            Tolak
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            Pelunasan SPP Tunai di Tempat (
                            {unpaidInvoices.length})
                        </h2>
                        <div className="max-h-96 divide-y divide-[#F1F5F9] overflow-y-auto">
                            {unpaidInvoices.length === 0 ? (
                                <p className="py-6 text-center text-sm text-[#64748B]">
                                    Semua tagihan SPP sudah lunas.
                                </p>
                            ) : (
                                unpaidInvoices.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center justify-between gap-2 py-3"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-[#0F172A]">
                                                {inv.student?.user?.name}{' '}
                                                <span className="font-mono text-xs text-[#64748B]">
                                                    ({inv.billing_period})
                                                </span>
                                            </p>
                                            <p className="font-mono text-xs text-[#475569]">
                                                {formatRupiah(inv.amount)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Lunasi tunai SPP ${inv.billing_period} untuk ${inv.student?.user?.name}?`,
                                                    )
                                                ) {
                                                    router.post(
                                                        '/finance/pay-cash',
                                                        {
                                                            invoice_ids: [
                                                                inv.id,
                                                            ],
                                                        },
                                                    );
                                                }
                                            }}
                                            className="h-9 text-xs font-semibold"
                                        >
                                            <Banknote className="mr-1.5 size-3.5 text-[#047857]" />
                                            Lunasi Tunai
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="border-t border-[#F1F5F9] pt-4">
                            <h3 className="font-display text-sm font-bold text-[#0F172A]">
                                Pembayaran Terverifikasi Terbaru
                            </h3>
                            <div className="mt-2 space-y-2">
                                {recentPayments.slice(0, 6).map((rp) => (
                                    <div
                                        key={rp.id}
                                        className="flex items-center justify-between text-xs"
                                    >
                                        <span>
                                            <strong>
                                                {rp.student?.user?.name}
                                            </strong>{' '}
                                            —{' '}
                                            <span className="font-mono">
                                                {formatRupiah(rp.total_amount)}
                                            </span>{' '}
                                            ({rp.status})
                                        </span>
                                        {rp.status === 'approved' && (
                                            <a
                                                href={`/payments/${rp.id}/receipt`}
                                                className="inline-flex items-center gap-1 font-semibold text-[#0F172A] underline"
                                            >
                                                <Receipt className="size-3" />{' '}
                                                Kuitansi
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                        <h2 className="font-display text-lg font-bold text-[#0F172A]">
                            Catat Pemasukan / Pengeluaran Kas Operasional
                        </h2>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                cashForm.post('/finance/transactions', {
                                    onSuccess: () =>
                                        cashForm.reset('amount', 'description'),
                                });
                            }}
                            className="grid gap-3 sm:grid-cols-2"
                        >
                            <div>
                                <Label>Jenis Arus Kas</Label>
                                <select
                                    value={cashForm.data.type}
                                    onChange={(e) =>
                                        cashForm.setData(
                                            'type',
                                            e.target.value as
                                                | 'income'
                                                | 'expense',
                                        )
                                    }
                                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="expense">
                                        Pengeluaran (Kas Keluar)
                                    </option>
                                    <option value="income">
                                        Pemasukan Lainnya (Kas Masuk)
                                    </option>
                                </select>
                            </div>
                            <div>
                                <Label>Kategori</Label>
                                <select
                                    value={cashForm.data.category}
                                    onChange={(e) =>
                                        cashForm.setData(
                                            'category',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm"
                                >
                                    <option value="operasional">
                                        Operasional (Listrik, ATK, Air)
                                    </option>
                                    <option value="gaji_mentor">
                                        Honor / Gaji Mentor
                                    </option>
                                    <option value="spp">SPP</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <Label>Nominal (Rp)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    value={cashForm.data.amount || ''}
                                    onChange={(e) =>
                                        cashForm.setData(
                                            'amount',
                                            Number(e.target.value),
                                        )
                                    }
                                    required
                                    className="mt-1 h-10 font-mono"
                                />
                                <InputError message={cashForm.errors.amount} />
                            </div>
                            <div>
                                <Label>Tanggal Transaksi</Label>
                                <Input
                                    type="date"
                                    value={cashForm.data.transaction_date}
                                    onChange={(e) =>
                                        cashForm.setData(
                                            'transaction_date',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    className="mt-1 h-10 font-mono"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Label>Keterangan</Label>
                                <Input
                                    value={cashForm.data.description}
                                    onChange={(e) =>
                                        cashForm.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    required
                                    placeholder="Contoh: Pembelian spidol papan tulis & kertas HVS..."
                                    className="mt-1 h-10"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <Button
                                    type="submit"
                                    disabled={cashForm.processing}
                                    className="h-10 w-full bg-[#E2A829] font-semibold text-[#0F172A]"
                                >
                                    <Plus className="mr-1.5 size-4" />
                                    Simpan Catatan Kas
                                </Button>
                            </div>
                        </form>

                        <div className="max-h-72 divide-y divide-[#F1F5F9] overflow-y-auto border-t border-[#F1F5F9] pt-3">
                            {transactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between py-2.5 text-xs"
                                >
                                    <div>
                                        <p className="font-semibold text-[#0F172A]">
                                            {t.description}
                                        </p>
                                        <p className="font-mono text-[#64748B]">
                                            {t.transaction_date} |{' '}
                                            {t.category.toUpperCase()}
                                        </p>
                                    </div>
                                    <span
                                        className={`font-mono font-bold ${
                                            t.type === 'income'
                                                ? 'text-[#047857]'
                                                : 'text-[#BE123C]'
                                        }`}
                                    >
                                        {t.type === 'income' ? '+' : '-'}{' '}
                                        {formatRupiah(t.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
