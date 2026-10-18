New contact message from the {{ $storeName }} website

Name: {{ $contact->name }}
Email: {{ $contact->email }}
@if ($contact->phone)
Phone: {{ $contact->phone }}
@endif
@if ($contact->subject)
Subject: {{ $contact->subject }}
@endif

{{ $contact->message }}

Reply to this email to answer {{ $contact->name }} directly.
@if ($adminUrl)
Admin panel: {{ $adminUrl }}/messages
@endif
