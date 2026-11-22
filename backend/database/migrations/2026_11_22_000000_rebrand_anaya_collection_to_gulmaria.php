<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time rebrand: replace every "Anaya Collection" reference in store
 * content (settings, catalog, banners, homepage sections, CMS pages, coupons)
 * with "Gulmaria". Covers every text/JSON column of those tables.
 */
return new class extends Migration
{
    /**
     * @var list<string>
     */
    private array $contentTables = [
        'store_settings',
        'products',
        'product_variants',
        'product_images',
        'categories',
        'banners',
        'home_sections',
        'cms_pages',
        'coupons',
    ];

    /**
     * Order matters: the two-word brand is replaced before the bare
     * "Anaya " prefix used by product names such as "Anaya Khaddar 2 Piece".
     *
     * @var array<string, string>
     */
    private array $replacements = [
        'Anaya Collection' => 'Gulmaria',
        'ANAYA COLLECTION' => 'GULMARIA',
        'anaya collection' => 'gulmaria',
        'Anaya ' => 'Gulmaria ',
    ];

    /**
     * Columns that hold URLs, slugs or file paths are left alone so existing links keep working.
     *
     * @var list<string>
     */
    private array $skippedColumns = ['slug', 'path', 'url', 'src', 'image', 'link', 'href'];

    public function up(): void
    {
        $this->replaceBrand($this->replacements);
    }

    public function down(): void
    {
        $this->replaceBrand(array_flip($this->replacements));
    }

    /**
     * Run a case-sensitive REPLACE on every string, text and JSON column of the content tables.
     *
     * @param  array<string, string>  $replacements
     */
    private function replaceBrand(array $replacements): void
    {
        foreach ($this->contentTables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            foreach ($this->textColumns($table) as $column) {
                foreach ($replacements as $from => $to) {
                    $wrapped = DB::getQueryGrammar()->wrap($column);

                    DB::table($table)
                        ->where($column, 'like', '%'.$from.'%')
                        ->update([$column => DB::raw("REPLACE({$wrapped}, ".DB::getPdo()->quote($from).', '.DB::getPdo()->quote($to).')')]);
                }
            }
        }

        Cache::forget('store_settings.all');
    }

    /**
     * @return list<string>
     */
    private function textColumns(string $table): array
    {
        $textTypes = ['char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'json', 'string'];

        return collect(Schema::getColumns($table))
            ->filter(fn (array $column): bool => in_array(strtolower($column['type_name']), $textTypes, true))
            ->reject(fn (array $column): bool => in_array(strtolower($column['name']), $this->skippedColumns, true))
            ->pluck('name')
            ->values()
            ->all();
    }
};
