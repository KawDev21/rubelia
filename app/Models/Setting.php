<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $primaryKey = 'key';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    /** @var array<string, string|null>|null */
    protected static ?array $cached = null;

    /** @return array<string, string|null> */
    public static function allMap(): array
    {
        if (static::$cached === null) {
            static::$cached = static::query()->pluck('value', 'key')->all();
        }

        return static::$cached;
    }

    public static function getValue(string $key, ?string $default = null): ?string
    {
        $map = static::allMap();

        return array_key_exists($key, $map) && $map[$key] !== null && $map[$key] !== ''
            ? $map[$key]
            : $default;
    }

    /** @param array<string, scalar|null> $values */
    public static function setMany(array $values): void
    {
        foreach ($values as $key => $value) {
            static::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value === null ? null : (string) $value]
            );
        }

        static::$cached = null;
    }

    public static function clearCache(): void
    {
        static::$cached = null;
    }
}
