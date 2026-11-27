<?php

namespace App\Console\Commands;

use App\Services\BillingService;
use App\Services\WebPushService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class GenerateMonthlyInvoicesCommand extends Command
{
    protected $signature = 'rubelia:generate-invoices {--period= : Periode tagihan YYYY-MM} {--force : Jalankan walau bukan tanggal 28/27}';

    protected $description = 'Terbitkan tagihan SPP bulanan setiap tanggal 28 (atau Sabtu tanggal 27 jika 28 jatuh pada hari Minggu).';

    public function handle(BillingService $billing, WebPushService $webPush): int
    {
        $today = Carbon::today();
        $force = (bool) $this->option('force');

        if (! $force && ! $billing->isBillingTriggerDate($today)) {
            $this->info('Hari ini bukan jadwal penagihan SPP otomatis (tanggal 28 atau Sabtu 27).');

            return self::SUCCESS;
        }

        // Tagihan yang terbit setiap tanggal 28 menagih periode bulan berikutnya secara konsisten (atau sesuai opsi --period).
        $period = (string) ($this->option('period') ?: $today->copy()->addMonthNoOverflow()->format('Y-m'));

        $count = $billing->generateMonthlyInvoices($period, $webPush, true);
        $this->info("Berhasil menerbitkan {$count} tagihan SPP untuk periode {$period}.");

        return self::SUCCESS;
    }
}
