<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <title>New contact message</title>
    <style>
        @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .px { padding-left: 16px !important; padding-right: 16px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:Arial, Helvetica, sans-serif; color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
        <td align="center" style="padding:32px 12px;">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px;">

                {{-- Header --}}
                <tr>
                    <td class="px" style="padding:24px 28px; border-bottom:1px solid #e5e7eb;">
                        <h1 style="margin:0; font-size:20px; font-weight:bold; color:#111827;">New contact message</h1>
                        <p style="margin:6px 0 0; font-size:13px; color:#6b7280;">Sent from the {{ $storeName }} website on {{ $contact->created_at?->format('d M Y, h:i A') ?? 'just now' }}</p>
                    </td>
                </tr>

                {{-- Contact details --}}
                <tr>
                    <td class="px" style="padding:20px 28px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px; line-height:1.6;">
                            @if (filled($contact->name))
                            <tr>
                                <td width="80" style="padding:6px 0; color:#6b7280; vertical-align:top;">Name</td>
                                <td style="padding:6px 0; color:#111827; font-weight:600;">{{ $contact->name }}</td>
                            </tr>
                            @endif
                            @if (filled($contact->email))
                            <tr>
                                <td width="80" style="padding:6px 0; color:#6b7280; vertical-align:top;">Email</td>
                                <td style="padding:6px 0;"><a href="mailto:{{ $contact->email }}" style="color:#1d4ed8; text-decoration:none;">{{ $contact->email }}</a></td>
                            </tr>
                            @endif
                            @if (filled($contact->phone))
                            <tr>
                                <td width="80" style="padding:6px 0; color:#6b7280; vertical-align:top;">Phone</td>
                                <td style="padding:6px 0; color:#111827;">{{ $contact->phone }}</td>
                            </tr>
                            @endif
                            @if (filled($contact->subject))
                            <tr>
                                <td width="80" style="padding:6px 0; color:#6b7280; vertical-align:top;">Subject</td>
                                <td style="padding:6px 0; color:#111827;">{{ $contact->subject }}</td>
                            </tr>
                            @endif
                        </table>
                    </td>
                </tr>

                {{-- Message body --}}
                <tr>
                    <td class="px" style="padding:16px 28px;">
                        <div style="padding:16px; background:#f9fafb; border-radius:6px; font-size:14px; line-height:1.7; color:#374151; white-space:pre-line;">{{ $contact->message ?? 'No message provided.' }}</div>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td class="px" style="padding:0 28px 24px;">
                        <p style="margin:0 0 6px; font-size:13px; color:#6b7280;">Reply to this email to answer {{ $contact->name ?? 'the visitor' }} directly.</p>
                        @if ($adminUrl)
                            <p style="margin:0; font-size:13px;"><a href="{{ $adminUrl }}/messages" style="color:#1d4ed8; text-decoration:none;">Open messages in the admin panel</a></p>
                        @endif
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>
</body>
</html>
