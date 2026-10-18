<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Builds the initial attribute list (e.g. Color) from the option keys and
 * values already stored on product variants, so the Attributes page is not
 * empty after deploy.
 */
return new class extends Migration
{
    public function up(): void
    {
        /** @var array<string, array<string, true>> $found */
        $found = [];

        DB::table('product_variants')->whereNotNull('options')->orderBy('id')->select(['id', 'options'])
            ->chunkById(500, function ($rows) use (&$found): void {
                foreach ($rows as $row) {
                    $options = json_decode((string) $row->options, true);
                    if (! is_array($options)) {
                        continue;
                    }
                    foreach ($options as $key => $value) {
                        $slug = Str::slug((string) $key, '_');
                        $value = trim((string) $value);
                        if ($slug !== '' && $value !== '' && mb_strlen($value) <= 60) {
                            $found[$slug][$value] = true;
                        }
                    }
                }
            });

        $now = now();
        $order = 0;
        foreach ($found as $slug => $values) {
            if (DB::table('product_attributes')->where('slug', $slug)->exists()) {
                continue;
            }

            $attributeId = DB::table('product_attributes')->insertGetId([
                'name' => Str::of($slug)->replace('_', ' ')->title()->toString(),
                'slug' => Str::limit($slug, 60, ''),
                'sort_order' => $order++,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $names = array_keys($values);
            natcasesort($names);
            $seen = [];
            $position = 0;
            foreach ($names as $value) {
                if (isset($seen[mb_strtolower($value)])) {
                    continue;
                }
                $seen[mb_strtolower($value)] = true;
                DB::table('product_attribute_values')->insert([
                    'product_attribute_id' => $attributeId,
                    'value' => $value,
                    'sort_order' => $position++,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        // Seeded rows are indistinguishable from admin-created ones; the create migration's down() drops the tables.
    }
};
