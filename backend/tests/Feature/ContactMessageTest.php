<?php

namespace Tests\Feature;

use App\Mail\ContactMessageMail;
use App\Models\ContactMessage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactMessageTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, string>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'name' => 'Ayesha Khan',
            'email' => 'Ayesha@Example.com',
            'phone' => '0300 1234567',
            'subject' => 'Fabric question',
            'message' => 'Is the khaddar suit available in maroon?',
            ...$overrides,
        ];
    }

    public function test_visitor_can_submit_the_contact_form(): void
    {
        Mail::fake();

        $this->postJson('/api/v1/contact', $this->payload())->assertCreated()->assertJsonStructure(['message']);

        $this->assertDatabaseHas('contact_messages', [
            'name' => 'Ayesha Khan',
            'email' => 'ayesha@example.com',
            'subject' => 'Fabric question',
            'read_at' => null,
        ]);
        Mail::assertSent(ContactMessageMail::class, fn (ContactMessageMail $mail): bool => $mail->hasReplyTo('ayesha@example.com'));
    }

    public function test_submission_is_validated(): void
    {
        $this->postJson('/api/v1/contact', ['name' => '', 'email' => 'not-an-email', 'message' => 'short'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'message']);

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_honeypot_submissions_are_rejected(): void
    {
        $this->postJson('/api/v1/contact', $this->payload(['website' => 'http://spam.test']))->assertUnprocessable();

        $this->assertDatabaseCount('contact_messages', 0);
    }

    public function test_admin_can_list_filter_and_read_messages(): void
    {
        $admin = User::factory()->admin()->create();
        $unread = ContactMessage::factory()->create(['name' => 'Unread Person']);
        ContactMessage::factory()->read()->create(['name' => 'Read Person']);

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/messages')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('unread_count', 1);

        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/messages?status=unread')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Unread Person');

        $this->actingAs($admin, 'sanctum')->getJson("/api/v1/admin/messages/{$unread->id}")
            ->assertOk()
            ->assertJsonPath('is_read', true);
        $this->assertNotNull($unread->fresh()->read_at);

        $this->actingAs($admin, 'sanctum')->patchJson("/api/v1/admin/messages/{$unread->id}/status", ['is_read' => false])
            ->assertOk()
            ->assertJsonPath('is_read', false);
    }

    public function test_admin_can_delete_a_message(): void
    {
        $message = ContactMessage::factory()->create();

        $this->actingAs(User::factory()->admin()->create(), 'sanctum')
            ->deleteJson("/api/v1/admin/messages/{$message->id}")
            ->assertNoContent();

        $this->assertModelMissing($message);
    }

    public function test_customers_cannot_view_messages(): void
    {
        $this->actingAs(User::factory()->create(), 'sanctum')->getJson('/api/v1/admin/messages')->assertForbidden();
    }
}
