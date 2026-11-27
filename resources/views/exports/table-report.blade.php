<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #0F172A; font-size: 10.5px; margin: 18px; }
        .header { border-bottom: 3px solid #E2A829; padding-bottom: 10px; margin-bottom: 14px; }
        .brand { font-size: 16px; font-weight: bold; color: #0F172A; }
        .title { font-size: 13px; font-weight: bold; margin-top: 4px; color: #1E293B; }
        .meta { font-size: 10px; color: #64748B; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0F172A; color: #FFFFFF; padding: 6px 8px; text-align: left; font-size: 10px; }
        td { border-bottom: 1px solid #E2E8F0; padding: 6px 8px; vertical-align: top; }
        tr:nth-child(even) td { background: #F8FAFC; }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">{{ $officeName }}</div>
        <div class="title">{{ $title }}</div>
        <div class="meta">Dicetak pada: {{ $generatedAt }} WIB</div>
    </div>

    <table>
        <thead>
            <tr>
                @foreach($headers as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ is_numeric($cell) && $cell > 9999 ? number_format((float) $cell, 0, ',', '.') : $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headers) }}" style="text-align:center; color:#64748B; padding:16px;">Belum ada data pada periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
