<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Kuitansi {{ $payment->payment_code }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0F172A; font-size: 12px; line-height: 1.5; margin: 24px; }
        .header { border-bottom: 3px solid #E2A829; padding-bottom: 12px; margin-bottom: 20px; }
        .brand { font-size: 20px; font-weight: bold; color: #0F172A; }
        .sub { color: #475569; font-size: 11px; }
        .badge { display: inline-block; background: #FEF9C3; color: #0F172A; border: 1px solid #E2A829; padding: 3px 10px; font-weight: bold; font-size: 11px; border-radius: 4px; }
        table.meta { width: 100%; margin-bottom: 18px; border-collapse: collapse; }
        table.meta td { padding: 4px 0; vertical-align: top; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.items th { background: #0F172A; color: #F8FAFC; text-align: left; padding: 8px 10px; font-size: 11px; }
        table.items td { border-bottom: 1px solid #E2E8F0; padding: 8px 10px; }
        .total-row td { font-weight: bold; background: #F8FAFC; font-size: 13px; border-top: 2px solid #0F172A; }
        .footer { margin-top: 32px; font-size: 11px; color: #475569; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">{{ $officeName }}</div>
        @if($officeAddress)
            <div class="sub">{{ $officeAddress }}</div>
        @endif
        <div style="margin-top: 8px;">
            <span class="badge">KUITANSI PEMBAYARAN RESMI - LUNAS</span>
        </div>
    </div>

    <table class="meta">
        <tr>
            <td width="22%"><strong>Kode Pembayaran</strong></td>
            <td width="30%">: {{ $payment->payment_code }}</td>
            <td width="20%"><strong>Tanggal Lunas</strong></td>
            <td width="28%">: {{ ($payment->verified_at ?? $payment->paid_at)?->format('d M Y H:i') }}</td>
        </tr>
        <tr>
            <td><strong>Nama Murid</strong></td>
            <td>: {{ $payment->student?->user?->name ?? '-' }} ({{ $payment->student?->student_code }})</td>
            <td><strong>Jenjang</strong></td>
            <td>: {{ $payment->student?->educationLevel?->name ?? '-' }}</td>
        </tr>
        <tr>
            <td><strong>Wali Murid</strong></td>
            <td>: {{ $payment->student?->guardian_name ?? '-' }}</td>
            <td><strong>Metode Bayar</strong></td>
            <td>: {{ $payment->method === 'cash' ? 'Tunai di Rubelia' : 'Transfer Bank' }}</td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th>No. Tagihan</th>
                <th>Periode</th>
                <th>Keterangan</th>
                <th style="text-align:right;">Nominal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($payment->invoices as $inv)
                <tr>
                    <td>{{ $inv->invoice_number }}</td>
                    <td>{{ $inv->billing_period }}</td>
                    <td>{{ $inv->description }}</td>
                    <td style="text-align:right;">Rp {{ number_format($inv->amount, 0, ',', '.') }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="3">TOTAL PEMBAYARAN DITERIMA</td>
                <td style="text-align:right;">Rp {{ number_format($payment->total_amount, 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        Diverifikasi oleh: <strong>{{ $payment->verifier?->name ?? 'Admin Rubelia' }}</strong><br>
        Dicetak otomatis oleh Sistem Manajemen Rubelia
    </div>
</body>
</html>
