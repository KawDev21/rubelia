<?php

namespace App\Services;

use Carbon\CarbonInterface;

class GeoService
{
    public function distanceMeters(float $lat1, float $lng1, float $lat2, float $lng2): int
    {
        $earthRadius = 6371000.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        $c = 2 * atan2(sqrt($a), sqrt(max(0.0, 1 - $a)));

        return (int) round($earthRadius * $c);
    }

    public function calculateLateMinutes(string $scheduledStartTime, CarbonInterface $checkedInAt, int $toleranceMinutes = 5): int
    {
        [$hour, $minute] = array_pad(explode(':', $scheduledStartTime), 2, '0');

        $scheduled = $checkedInAt->copy()->setTime((int) $hour, (int) $minute, 0);
        if ($checkedInAt->lessThanOrEqualTo($scheduled)) {
            return 0;
        }

        $diffMinutes = (int) floor($scheduled->diffInSeconds($checkedInAt) / 60);

        return $diffMinutes > $toleranceMinutes ? $diffMinutes : 0;
    }
}
