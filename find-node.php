<?php
echo "<pre>\n";
$paths = [
    '/usr/bin/node',
    '/usr/local/bin/node',
    '/opt/alt/alt-nodejs22/root/usr/bin/node',
    '/opt/alt/alt-nodejs20/root/usr/bin/node',
    '/opt/alt/alt-nodejs18/root/usr/bin/node',
    '/opt/cpanel/ea-nodejs22/root/usr/bin/node',
    '/opt/cpanel/ea-nodejs20/root/usr/bin/node',
    '/opt/cpanel/ea-nodejs18/root/usr/bin/node',
];
foreach ($paths as $p) {
    echo "$p: " . (file_exists($p) ? "EXISTS" : "not found") . "\n";
}
echo "\nwhich node:\n";
$o = [];
exec("which node 2>&1", $o);
echo implode("\n", $o) . "\n";
$o = [];
exec("find /opt -name 'node' -type f 2>/dev/null | head -10", $o);
echo "\nfind node:\n" . implode("\n", $o) . "\n";
$o = [];
exec("ls /opt/alt/ 2>/dev/null | head -20", $o);
echo "\n/opt/alt/:\n" . implode("\n", $o) . "\n";
echo "</pre>\n";
