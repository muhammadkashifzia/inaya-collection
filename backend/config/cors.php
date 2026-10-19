<?php

/**
 * CORS for the first-party storefront (Next.js) and admin (React) SPAs.
 * Credentials are allowed so Sanctum's session cookies work cross-origin,
 * which requires an explicit origin allow-list (no "*").
 */
return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 7200,

    'supports_credentials' => true,

];
