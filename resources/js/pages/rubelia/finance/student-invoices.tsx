import { Head, useForm } from '@inertiajs/react';
import { CheckCircle2, Copy, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/lib/rubelia';

type InvoiceItem = {
    id: number;
    invoice_number: string;
    billing_period: string;
    description: string;
    amount: number;
    due_date: string;
    status: string;
};

type PaymentItem = {
    id: number;
    payment_code: string;
    method: 'transfer' | 'cash';
    total_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    rejection_note?: string | null;
    paid_at?: string | null;
    invoices: {
        id: number;
        invoice_number: string;
        billing_period: string;
        amount: number;
    }[];
};

type Props = {
    unpaidInvoices: InvoiceItem[];
    pendingInvoices: InvoiceItem[];
    paidInvoices: InvoiceItem[];
    payments: PaymentItem[];
    bankInfo: {
        bank_name: string;
        bank_account_number: string;
        bank_account_holder: string;
    };
};

export default function StudentInvoices({
    unpaidInvoices,
    pendingInvoices,
    payments,
    bankInfo,
}: Props) {
    const form = useForm<{
        invoice_ids: number[];
        proof: File | null;
    }>({
        invoice_ids: unpaidInvoices[0] ? [unpaidInvoices[0].id] : [],
        proof: null,
    });

    const toggleInvoice = (id: number) => {
        const exists = form.data.invoice_ids.includes(id);
        form.setData(
            'invoice_ids',
            exists
                ? form.data.invoice_ids.filter((x) => x !== id)
                : [...form.data.invoice_ids, id],
        );
    };

    const selectedTotal = unpaidInvoices
        .filter((inv) => form.data.invoice_ids.includes(inv.id))
        .reduce((acc, cur) => acc + cur.amount, 0);

    const submitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/student/payments', {
            forceFormData: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <>
            <Head title="Tagihan & Pembayaran SPP" />

            <div className="space-y-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-[#0F172A]">
                        Tagihan SPP Bulanan & Riwayat Pembayaran
                    </h1>
                    <p className="text-sm text-[#475569]">
                        Pilih satu atau beberapa bulan tagihan sekaligus,
                        transfer sesuai total nominal, lalu unggah bukti
                        transfer.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                    <div className="space-y-6">
                        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                    Tagihan Belum Dibayar (
                                    {unpaidInvoices.length})
                                </h2>
                                {unpaidInvoices.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            form.setData(
                                                'invoice_ids',
                                                unpaidInvoices.map((i) => i.id),
                                            )
                                        }
                                        className="text-xs font-semibold text-[#0F172A] underline"
                                    >
                                        Pilih Semua Tagihan
                                    </button>
                                )}
                            </div>

                            {unpaidInvoices.length === 0 ? (
                                <div className="rounded-xl border border-emerald-200 bg-[#ECFDF5] p-6 text-center">
                                    <CheckCircle2 className="mx-auto size-7 text-[#047857]" />
                                    <p className="mt-2 font-semibold text-[#047857]">
                                        Tidak ada tunggakan SPP saat ini.
                                    </p>
                                    <p className="mt-0.5 text-xs text-[#047857]">
                                        Tagihan SPP terbit setiap tanggal 28
                                        (atau hari Sabtu tanggal 27 bila tanggal
                                        28 jatuh pada hari Minggu).
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {unpaidInvoices.map((inv) => {
                                        const checked =
                                            form.data.invoice_ids.includes(
                                                inv.id,
                                            );
                                        return (
                                            <label
                                                key={inv.id}
                                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition-colors ${
                                                    checked
                                                        ? 'border-[#E2A829] bg-[#FEF9C3]/60'
                                                        : 'border-[#E2E8F0] bg-[#F8FAFC]'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() =>
                                                            toggleInvoice(
                                                                inv.id,
                                                            )
                                                        }
                                                        className="size-5 rounded accent-[#0F172A]"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-[#0F172A]">
                                                            {inv.description}
                                                        </p>
                                                        <p className="font-mono text-xs text-[#64748B]">
                                                            {inv.invoice_number}{' '}
                                                            | Jatuh tempo:{' '}
                                                            {inv.due_date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-mono text-sm font-bold text-[#0F172A]">
                                                    {formatRupiah(inv.amount)}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {pendingInvoices.length > 0 && (
                                <div className="mt-4 rounded-xl border border-amber-200 bg-[#FFFBEB] p-4">
                                    <p className="text-xs font-bold text-[#B45309] uppercase">
                                        Menunggu Verifikasi Admin (
                                        {pendingInvoices.length} Tagihan)
                                    </p>
                                    <ul className="mt-1 space-y-1 text-xs text-[#713F12]">
                                        {pendingInvoices.map((p) => (
                                            <li key={p.id}>
                                                {p.description} —{' '}
                                                <span className="font-mono font-semibold">
                                                    {formatRupiah(p.amount)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6">
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Riwayat Pembayaran & Kuitansi Resmi
                            </h2>
                            <div className="mt-4 space-y-3">
                                {payments.length === 0 ? (
                                    <p className="text-sm text-[#64748B]">
                                        Belum ada riwayat pembayaran.
                                    </p>
                                ) : (
                                    payments.map((pay) => (
                                        <div
                                            key={pay.id}
                                            className="flex flex-col justify-between gap-3 rounded-xl border border-[#E2E8F0] p-4 sm:flex-row sm:items-center"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-[#0F172A]">
                                                        {pay.payment_code}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                            pay.status ===
                                                            'approved'
                                                                ? 'bg-[#ECFDF5] text-[#047857]'
                                                                : pay.status ===
                                                                    'rejected'
                                                                  ? 'bg-[#FFF1F2] text-[#BE123C]'
                                                                  : 'bg-[#FFFBEB] text-[#B45309]'
                                                        }`}
                                                    >
                                                        {pay.status ===
                                                        'approved'
                                                            ? 'Lunas Terverifikasi'
                                                            : pay.status ===
                                                                'rejected'
                                                              ? 'Ditolak'
                                                              : 'Menunggu Verifikasi'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-mono text-sm font-bold text-[#0F172A]">
                                                    Total:{' '}
                                                    {formatRupiah(
                                                        pay.total_amount,
                                                    )}{' '}
                                                    <span className="font-sans text-xs font-normal text-[#64748B]">
                                                        (
                                                        {pay.invoices
                                                            .map(
                                                                (i) =>
                                                                    i.billing_period,
                                                            )
                                                            .join(', ')}
                                                        )
                                                    </span>
                                                </p>
                                                {pay.rejection_note && (
                                                    <p className="mt-1 text-xs font-semibold text-[#BE123C]">
                                                        Alasan ditolak:{' '}
                                                        {pay.rejection_note}
                                                    </p>
                                                )}
                                            </div>

                                            {pay.status === 'approved' && (
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-10 shrink-0"
                                                >
                                                    <a
                                                        href={`/payments/${pay.id}/receipt`}
                                                    >
                                                        <Download className="mr-1.5 size-4" />
                                                        Unduh Kuitansi PDF
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div>
                        <form
                            onSubmit={submitPayment}
                            className="sticky top-20 space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
                        >
                            <h2 className="font-display text-lg font-bold text-[#0F172A]">
                                Konfirmasi & Kirim Bukti Transfer
                            </h2>

                            <div className="rounded-xl bg-[#0F172A] p-4 text-white">
                                <p className="text-xs text-slate-300">
                                    Rekening Tujuan Transfer Rubelia
                                </p>
                                <p className="mt-1 font-display text-base font-bold text-[#E2A829]">
                                    Bank {bankInfo.bank_name}
                                </p>
                                <div className="mt-1 flex items-center justify-between gap-2">
                                    <span className="font-mono text-lg font-bold tracking-wide">
                                        {bankInfo.bank_account_number}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void navigator.clipboard.writeText(
                                                bankInfo.bank_account_number,
                                            );
                                            toast.success(
                                                'Nomor rekening Rubelia disalin.',
                                            );
                                        }}
                                        className="inline-flex items-center gap-1 rounded bg-[#1E293B] px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
                                    >
                                        <Copy className="size-3.5" /> Salin
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-slate-300">
                                    a.n. {bankInfo.bank_account_holder}
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                                <p className="text-xs text-[#64748B]">
                                    Total Nominal yang Harus Ditransfer (
                                    {form.data.invoice_ids.length} bulan
                                    dipilih)
                                </p>
                                <p className="mt-1 font-mono text-2xl font-bold text-[#0F172A]">
                                    {formatRupiah(selectedTotal)}
                                </p>
                            </div>

                            <div className="grid gap-1.5">
                                <Label>Unggah Foto / PDF Bukti Transfer</Label>
                                <Input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                                    onChange={(e) =>
                                        form.setData(
                                            'proof',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    required
                                    className="h-11"
                                />
                                <InputError message={form.errors.proof} />
                                <InputError message={form.errors.invoice_ids} />
                            </div>

                            <Button
                                type="submit"
                                disabled={
                                    form.processing ||
                                    form.data.invoice_ids.length === 0 ||
                                    !form.data.proof
                                }
                                className="h-12 w-full bg-[#E2A829] font-bold text-[#0F172A] hover:bg-[#CA8A04]"
                            >
                                <Upload className="mr-1.5 size-4" />
                                {form.processing
                                    ? 'Mengirim Bukti...'
                                    : 'Kirim Bukti Pembayaran'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
