<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>New contact message</title>
</head>
<body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;">
        <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;font-size:20px;">New contact message</h1>
                <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Sent from the {{ $storeName }} website on {{ $contact->created_at?->format('d M Y, h:i A') }}</p>
            </td>
        </tr>
        <tr>
            <td style="padding:20px 28px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.6;">
                    <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Name</td><td>{{ $contact->name }}</td></tr>
                    <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Email</td><td><a href="mailto:{{ $contact->email }}" style="color:#1d4ed8;">{{ $contact->email }}</a></td></tr>
                    @if ($contact->phone)
                        <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Phone</td><td>{{ $contact->phone }}</td></tr>
                    @endif
                    @if ($contact->subject)
                        <tr><td style="padding:2px 16px 2px 0;color:#6b7280;">Subject</td><td>{{ $contact->subject }}</td></tr>
                    @endif
                </table>
                <div style="margin-top:16px;padding:16px;background:#f9fafb;border-radius:6px;font-size:14px;line-height:1.6;white-space:pre-line;">{{ $contact->message }}</div>
                <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">Reply to this email to answer {{ $contact->name }} directly.</p>
                @if ($adminUrl)
                    <p style="margin:8px 0 0;font-size:13px;"><a href="{{ $adminUrl }}/messages" style="color:#1d4ed8;">Open messages in the admin panel</a></p>
                @endif
            </td>
        </tr>
    </table>
</body>
</html>
