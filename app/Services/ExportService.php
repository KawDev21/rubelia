<?php

namespace App\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function downloadPdf(string $view, array $data, string $filename, string $orientation = 'portrait'): Response
    {
        $pdf = Pdf::loadView($view, $data)->setPaper('a4', $orientation);

        return $pdf->download($filename);
    }

    /**
     * @param  array<int, string>  $headers
     * @param  iterable<int, array<int, string|int|float|null>>  $rows
     */
    public function downloadExcel(string $filename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $writer = new XlsxWriter;
            $writer->openToFile('php://output');
            $writer->addRow(Row::fromValues($headers));

            foreach ($rows as $row) {
                $writer->addRow(Row::fromValues(array_map(fn ($v) => $v ?? '', $row)));
            }

            $writer->close();
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Read rows (skipping header row 1) from an uploaded .xlsx file.
     *
     * @return array<int, array<int, string>>
     */
    public function readExcelRows(string $filePath): array
    {
        $reader = new XlsxReader;
        $reader->open($filePath);

        $rows = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            $rowIndex = 0;
            foreach ($sheet->getRowIterator() as $row) {
                $rowIndex++;
                if ($rowIndex === 1) {
                    continue;
                }

                $cells = array_map(function ($cell): string {
                    if ($cell instanceof \DateTimeInterface) {
                        return $cell->format('Y-m-d');
                    }

                    return is_scalar($cell) ? trim((string) $cell) : '';
                }, $row->toArray());
                if (implode('', $cells) === '') {
                    continue;
                }

                $rows[] = $cells;
            }
            break;
        }

        $reader->close();

        return $rows;
    }
}
