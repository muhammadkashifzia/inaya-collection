<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('max_execution_time', 300);
set_time_limit(300);

echo "<pre>\n";
$basePath = dirname(dirname(__FILE__));
echo "Base: $basePath\nPHP: " . phpversion() . "\n\n";

// Disable platform check
$pc = $basePath . '/vendor/composer/platform_check.php';
file_put_contents($pc, "<?php\n// disabled\n");
echo "Platform check disabled.\n";

// Fix permissions on vendor
$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($basePath . '/vendor', RecursiveDirectoryIterator::SKIP_DOTS),
    RecursiveIteratorIterator::SELF_FIRST
);
$c = 0;
foreach ($it as $item) {
    if ($item->isDir()) @chmod($item->getPathname(), 0755);
    else @chmod($item->getPathname(), 0644);
    $c++;
}
echo "Fixed perms on $c vendor items.\n\n";

echo "Loading autoload...\n"; flush();
require $basePath . '/vendor/autoload.php';
echo "OK.\n"; flush();

echo "Loading app...\n"; flush();
$app = require $basePath . '/bootstrap/app.php';
echo "Laravel " . $app->version() . "\n"; flush();

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
echo "Bootstrapped.\n\n"; flush();

$commands = [
    ['config:clear', []],
    ['cache:clear', []],
    ['storage:link', ['--force' => true]],
    ['migrate', ['--force' => true]],
    ['db:seed', ['--force' => true]],
    ['config:cache', []],
    ['route:cache', []],
    ['view:cache', []],
];

foreach ($commands as [$cmd, $args]) {
    echo "> artisan $cmd\n"; flush();
    try {
        $status = \Illuminate\Support\Facades\Artisan::call($cmd, $args);
        echo \Illuminate\Support\Facades\Artisan::output();
        echo "Exit: $status\n\n";
    } catch (\Throwable $e) {
        echo "ERROR: " . $e->getMessage() . "\n\n";
    }
    flush();
}

echo "=== DEPLOYMENT COMPLETE ===\n</pre>\n";
