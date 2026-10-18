<?php

use App\Models\CmsPage;
use Illuminate\Database\Migrations\Migration;

/**
 * The Contact Us page now shows phone, WhatsApp, email, address and hours from
 * store settings, plus a contact form. Drop the hardcoded seed sections so the
 * details are not shown twice. Pages already edited by an admin are left alone.
 */
return new class extends Migration
{
    private const SEEDED_SECTIONS = [
        ['body' => 'Have a question about an order, fabric or delivery? Our team is happy to help.'],
        ['heading' => 'Phone / WhatsApp', 'body' => '+92 300 0000000 (Mon – Sat, 10am – 7pm)'],
        ['heading' => 'Email', 'body' => 'support@example.com – we reply within 24 hours.'],
    ];

    private const NEW_SECTIONS = [
        ['body' => 'Have a question about an order, fabric or delivery? Our team is happy to help. Reach us on the channels below or send a message using the form and we will get back to you within one working day.'],
    ];

    public function up(): void
    {
        $page = CmsPage::query()->where('slug', 'contact-us')->first();

        if ($page !== null && $page->sections === self::SEEDED_SECTIONS) {
            $page->update(['sections' => self::NEW_SECTIONS]);
        }
    }

    public function down(): void
    {
        $page = CmsPage::query()->where('slug', 'contact-us')->first();

        if ($page !== null && $page->sections === self::NEW_SECTIONS) {
            $page->update(['sections' => self::SEEDED_SECTIONS]);
        }
    }
};
