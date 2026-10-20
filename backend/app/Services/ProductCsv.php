<?php

namespace App\Services;

use App\Enums\InventoryReason;
use App\Http\Requests\Admin\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Tag;
use App\Models\User;
use App\Support\Money;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Validator as ValidatorInstance;

/**
 * Shopify-style product CSV: one row per variant. Product columns are read from
 * the first row of each Handle group; later rows of the same Handle only carry
 * variant columns. Prices are in major units (rupees).
 */
class ProductCsv
{
    public const MAX_ROWS = 5000;

    private const MAX_REPORTED_ERRORS = 200;

    /**
     * Column header => internal key.
     *
     * @var array<string, string>
     */
    public const COLUMNS = [
        'Handle' => 'handle',
        'Title' => 'name',
        'Product SKU' => 'sku',
        'Category' => 'category',
        'Status' => 'status',
        'Brand' => 'brand',
        'Fabric' => 'fabric',
        'Pieces' => 'pieces',
        'Price' => 'price',
        'Sale Price' => 'sale_price',
        'Featured' => 'is_featured',
        'Low Stock Threshold' => 'low_stock_threshold',
        'Short Description' => 'short_description',
        'Description' => 'description',
        'Details' => 'details',
        'Tags' => 'tags',
        'SEO Title' => 'meta_title',
        'SEO Description' => 'meta_description',
        'Published At' => 'published_at',
        'Variant SKU' => 'variant_sku',
        'Variant Name' => 'variant_name',
        'Option1 Name' => 'option1_name',
        'Option1 Value' => 'option1_value',
        'Option2 Name' => 'option2_name',
        'Option2 Value' => 'option2_value',
        'Option3 Name' => 'option3_name',
        'Option3 Value' => 'option3_value',
        'Variant Price' => 'variant_price',
        'Variant Sale Price' => 'variant_sale_price',
        'Variant Stock' => 'variant_stock',
        'Variant Active' => 'variant_active',
        'Image URLs' => 'images',
    ];

    public function __construct(private ProductWriter $writer, private InventoryService $inventory) {}

    /**
     * Stream the products matched by the query as CSV to the given handle.
     *
     * @param  Builder<Product>  $query
     * @param  resource  $out
     */
    public function export(Builder $query, $out): void
    {
        fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel opens Urdu/accents correctly.
        fputcsv($out, array_keys(self::COLUMNS), escape: '');

        $query->with(['category', 'variants', 'tags', 'images'])->lazy(200)->each(function (Product $product) use ($out): void {
            foreach ($product->variants as $index => $variant) {
                fputcsv($out, array_map($this->escapeCell(...), $this->exportRow($product, $variant, $index === 0)), escape: '');
            }
        });
    }

    /**
     * @return list<string|int|float|null>
     */
    private function exportRow(Product $product, ProductVariant $variant, bool $first): array
    {
        $options = array_slice((array) ($variant->options ?? []), 0, 3, true);
        $optionCells = [];
        foreach (range(0, 2) as $i) {
            $name = array_keys($options)[$i] ?? null;
            $optionCells[] = $name;
            $optionCells[] = $name === null ? null : $options[$name];
        }

        $productCells = $first ? [
            $product->name,
            $product->sku,
            $product->category?->slug,
            $product->status->value,
            $product->brand,
            $product->fabric,
            $product->pieces,
            Money::toMajor($product->price),
            Money::toMajor($product->sale_price),
            $product->is_featured ? 'TRUE' : 'FALSE',
            $product->low_stock_threshold,
            $product->short_description,
            $product->description,
            implode(' | ', (array) ($product->details ?? [])),
            $product->tags->pluck('name')->implode(', '),
            $product->meta_title,
            $product->meta_description,
            $product->published_at?->toDateTimeString(),
        ] : array_fill(0, 18, null);

        return [
            $product->slug,
            ...$productCells,
            $variant->sku,
            $variant->name,
            ...$optionCells,
            Money::toMajor($variant->price),
            Money::toMajor($variant->sale_price),
            $variant->stock,
            $variant->is_active ? 'TRUE' : 'FALSE',
            $first ? $product->images->map->url()->implode(' | ') : null,
        ];
    }

    /**
     * Prevent spreadsheet formula injection; the import strips this prefix again.
     */
    private function escapeCell(string|int|float|null $value): string|int|float|null
    {
        if (is_string($value) && $value !== '' && in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$value;
        }

        return $value;
    }

    /**
     * @param  resource  $handle
     * @return array{created: int, updated: int, skipped: int, errors: list<array{row: int, handle: string, message: string}>}
     */
    public function import($handle, bool $overwrite, User $actor): array
    {
        $groups = $this->readGroups($handle);
        $result = ['created' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];

        foreach ($groups as $handleKey => $rows) {
            try {
                $outcome = $this->importProduct($handleKey, $rows, $overwrite, $actor);
                $result[$outcome]++;
            } catch (ValidationException $e) {
                foreach ($e->errors() as $field => $messages) {
                    $result['errors'][] = [
                        'row' => $this->rowForField($field, $rows),
                        'handle' => $handleKey,
                        'message' => $messages[0],
                    ];
                }
            }
        }

        $result['errors'] = array_slice($result['errors'], 0, self::MAX_REPORTED_ERRORS);

        return $result;
    }

    /**
     * @param  resource  $handle
     * @return array<string, list<array{line: int, cells: array<string, string>, present: array<string, true>}>>
     */
    private function readGroups($handle): array
    {
        $header = fgetcsv($handle, escape: '');
        if ($header === false || $header === [null]) {
            throw ValidationException::withMessages(['file' => 'The file is empty.']);
        }

        $lookup = [];
        foreach (self::COLUMNS as $label => $key) {
            $lookup[Str::lower($label)] = $key;
        }

        $columns = [];
        foreach ($header as $i => $label) {
            $label = Str::lower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $label)));
            if (isset($lookup[$label])) {
                $columns[$i] = $lookup[$label];
            }
        }

        $present = array_fill_keys(array_values($columns), true);
        if (! isset($present['handle']) && ! isset($present['sku'])) {
            throw ValidationException::withMessages(['file' => 'The file needs a "Handle" or "Product SKU" column. Download the sample CSV for the expected format.']);
        }
        if (! isset($present['variant_sku'])) {
            throw ValidationException::withMessages(['file' => 'The file needs a "Variant SKU" column.']);
        }

        $groups = [];
        $line = 1;
        $previousKey = null;
        while (($row = fgetcsv($handle, escape: '')) !== false) {
            $line++;
            if ($row === [null] || implode('', $row) === '') {
                continue;
            }
            if ($line - 1 > self::MAX_ROWS) {
                throw ValidationException::withMessages(['file' => 'Import up to '.self::MAX_ROWS.' rows at a time.']);
            }

            $cells = [];
            foreach ($columns as $i => $key) {
                $cells[$key] = $this->unescapeCell(trim((string) ($row[$i] ?? '')));
            }

            $key = ($cells['handle'] ?? '') ?: ($cells['sku'] ?? '') ?: $previousKey;
            if ($key === null) {
                throw ValidationException::withMessages(['file' => "Row {$line} has no Handle or Product SKU."]);
            }
            $previousKey = $key;
            $groups[$key][] = ['line' => $line, 'cells' => $cells, 'present' => $present];
        }

        if ($groups === []) {
            throw ValidationException::withMessages(['file' => 'The file has no product rows.']);
        }

        return $groups;
    }

    private function unescapeCell(string $value): string
    {
        if (strlen($value) > 1 && $value[0] === "'" && in_array($value[1], ['=', '+', '-', '@'], true)) {
            return substr($value, 1);
        }

        return $value;
    }

    /**
     * @param  list<array{line: int, cells: array<string, string>, present: array<string, true>}>  $rows
     * @return 'created'|'updated'|'skipped'
     */
    private function importProduct(string $handleKey, array $rows, bool $overwrite, User $actor): string
    {
        $first = $rows[0]['cells'];
        $present = $rows[0]['present'];

        $existing = $this->findExisting($first['sku'] ?? '', $first['handle'] ?? '');
        if ($existing?->trashed()) {
            throw ValidationException::withMessages(['sku' => 'This product is deleted. Restore it before importing changes.']);
        }
        if ($existing !== null && ! $overwrite) {
            return 'skipped';
        }

        $payload = $this->buildPayload($existing, $rows, $present);

        $validator = Validator::make($payload, ProductRequest::rulesFor($existing));
        $validator->after(fn (ValidatorInstance $v) => ProductRequest::checkVariants($v, $payload));
        $data = $validator->validate();

        DB::transaction(function () use ($existing, $data, $payload, $actor): void {
            $product = $this->writer->save($existing, $data, $actor);

            // Stock for variants that already existed is set as an absolute level.
            foreach ($payload['variants'] as $input) {
                if (empty($input['id']) || ! array_key_exists('import_stock', $input)) {
                    continue;
                }
                $variant = $product->variants()->whereKey($input['id'])->lockForUpdate()->firstOrFail();
                $this->inventory->setStock($variant, (int) $input['import_stock'], InventoryReason::Correction, $actor, 'CSV import');
            }
        });

        return $existing === null ? 'created' : 'updated';
    }

    private function findExisting(string $sku, string $handle): ?Product
    {
        $query = Product::withTrashed()->with(['variants', 'tags']);

        if ($sku !== '') {
            if ($product = (clone $query)->where('sku', $sku)->first()) {
                return $product;
            }
        }

        return $handle !== '' ? $query->where('slug', $handle)->first() : null;
    }

    /**
     * Build a ProductRequest-shaped payload. For existing products, columns that
     * are missing from the file (or blank) keep their current values.
     *
     * @param  list<array{line: int, cells: array<string, string>, present: array<string, true>}>  $rows
     * @param  array<string, true>  $present
     * @return array<string, mixed>
     */
    private function buildPayload(?Product $existing, array $rows, array $present): array
    {
        $cells = $rows[0]['cells'];
        $pick = fn (string $key, mixed $current) => isset($present[$key]) && ($cells[$key] ?? '') !== '' ? $cells[$key] : $current;

        $payload = [
            'category_id' => isset($present['category']) && $cells['category'] !== ''
                ? $this->categoryId($cells['category'])
                : $existing?->category_id,
            'name' => $pick('name', $existing?->name),
            'slug' => $pick('handle', $existing?->slug),
            'sku' => $pick('sku', $existing?->sku),
            'brand' => $pick('brand', $existing?->brand),
            'short_description' => $pick('short_description', $existing?->short_description),
            'description' => $pick('description', $existing?->description),
            'details' => isset($present['details']) && $cells['details'] !== ''
                ? array_values(array_filter(array_map('trim', explode('|', $cells['details'])), fn ($d) => $d !== ''))
                : ($existing?->details ?? []),
            'fabric' => $pick('fabric', $existing?->fabric),
            'pieces' => $pick('pieces', $existing?->pieces),
            'price' => $pick('price', Money::toMajor($existing?->price)),
            'sale_price' => $pick('sale_price', Money::toMajor($existing?->sale_price)),
            'status' => Str::lower((string) $pick('status', $existing?->status->value ?? 'draft')),
            'is_featured' => $this->bool($pick('is_featured', null)) ?? ($existing?->is_featured ?? false),
            'low_stock_threshold' => $pick('low_stock_threshold', $existing?->low_stock_threshold),
            'meta_title' => $pick('meta_title', $existing?->meta_title),
            'meta_description' => $pick('meta_description', $existing?->meta_description),
            'published_at' => $pick('published_at', $existing?->published_at?->toDateTimeString()),
        ];

        if (isset($present['tags']) && ($cells['tags'] ?? '') !== '') {
            $payload['tag_ids'] = $this->tagIds($cells['tags']);
        }

        $payload['variants'] = array_map(fn (array $row) => $this->buildVariant($existing, $row['cells'], $row['present']), $rows);

        return $payload;
    }

    /**
     * @param  array<string, string>  $cells
     * @param  array<string, true>  $present
     * @return array<string, mixed>
     */
    private function buildVariant(?Product $existing, array $cells, array $present): array
    {
        $current = $existing?->variants->firstWhere('sku', $cells['variant_sku'] ?? '');
        $has = fn (string $key): bool => isset($present[$key]) && ($cells[$key] ?? '') !== '';

        $options = [];
        foreach ([1, 2, 3] as $n) {
            $name = $cells["option{$n}_name"] ?? '';
            $value = $cells["option{$n}_value"] ?? '';
            if ($name !== '' && $value !== '') {
                $options[Str::lower($name)] = $value;
            }
        }
        if ($options === [] && $current !== null) {
            $options = (array) ($current->options ?? []);
        }

        $name = $has('variant_name')
            ? $cells['variant_name']
            : ($current?->name ?? ($options !== [] ? implode(' / ', $options) : 'Default'));

        $variant = [
            'sku' => $cells['variant_sku'] ?? '',
            'name' => $name,
            'options' => $options === [] ? null : $options,
            'price' => $has('variant_price') ? $cells['variant_price'] : Money::toMajor($current?->price),
            'sale_price' => $has('variant_sale_price') ? $cells['variant_sale_price'] : Money::toMajor($current?->sale_price),
            'is_active' => $this->bool($cells['variant_active'] ?? '') ?? ($current?->is_active ?? true),
        ];

        if ($current !== null) {
            $variant['id'] = $current->id;
            if ($has('variant_stock')) {
                $variant['import_stock'] = $this->stockValue($cells['variant_stock']);
            }
        } elseif ($has('variant_stock')) {
            $variant['stock'] = $this->stockValue($cells['variant_stock']);
        }

        return $variant;
    }

    private function stockValue(string $value): int|string
    {
        if (! preg_match('/^\d+$/', $value) || (int) $value > 1000000) {
            throw ValidationException::withMessages(['variants' => "Stock \"{$value}\" must be a whole number between 0 and 1,000,000."]);
        }

        return (int) $value;
    }

    private function categoryId(string $value): int
    {
        $id = Category::query()->where('slug', $value)->value('id')
            ?? Category::query()->whereRaw('LOWER(name) = ?', [Str::lower($value)])->value('id');

        if ($id === null) {
            throw ValidationException::withMessages(['category_id' => "Category \"{$value}\" was not found."]);
        }

        return (int) $id;
    }

    /**
     * Resolve comma-separated tag names, creating missing tags.
     *
     * @return list<int>
     */
    private function tagIds(string $value): array
    {
        $ids = [];
        foreach (array_unique(array_filter(array_map('trim', explode(',', $value)))) as $name) {
            $slug = Str::slug($name);
            if ($slug === '' || mb_strlen($name) > 80) {
                throw ValidationException::withMessages(['tag_ids' => "Tag \"{$name}\" is not valid."]);
            }
            $ids[] = Tag::query()->firstOrCreate(['slug' => $slug], ['name' => $name])->id;
        }

        return array_values(array_unique($ids));
    }

    private function bool(?string $value): ?bool
    {
        return match (Str::lower(trim((string) $value))) {
            'true', '1', 'yes', 'y' => true,
            'false', '0', 'no', 'n' => false,
            default => null,
        };
    }

    /**
     * Map a validation error key to the CSV line it came from.
     *
     * @param  list<array{line: int, cells: array<string, string>, present: array<string, true>}>  $rows
     */
    private function rowForField(string $field, array $rows): int
    {
        if (preg_match('/^variants\.(\d+)\./', $field, $m) && isset($rows[(int) $m[1]])) {
            return $rows[(int) $m[1]]['line'];
        }

        return $rows[0]['line'];
    }
}
