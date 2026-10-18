<?php

namespace App\Mail;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Notifies the store inbox about a new storefront contact message.
 * Reply-To is the visitor so staff can answer straight from their mail client.
 */
class ContactMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public ContactMessage $contactMessage,
        public string $storeName,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->contactMessage->subject ?? 'New message from '.$this->contactMessage->name;

        return new Envelope(
            subject: '[Contact] '.$subject,
            replyTo: [new Address($this->contactMessage->email, $this->contactMessage->name)],
            tags: ['contact'],
            metadata: ['contact_message_id' => (string) $this->contactMessage->id],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact.message',
            text: 'emails.contact.message-text',
            with: [
                'contact' => $this->contactMessage,
                'storeName' => $this->storeName,
                'adminUrl' => rtrim((string) config('app.admin_url', ''), '/'),
            ],
        );
    }
}
