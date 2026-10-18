<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="x-apple-disable-message-reformatting">
    <meta name="color-scheme" content="light">
    <title>{{ $badge }} · {{ $storeName }}</title>
    <style>
        @media only screen and (max-width: 620px) {
            .container { width: 100% !important; }
            .px { padding-left: 20px !important; padding-right: 20px !important; }
            .stack { display: block !important; width: 100% !important; }
            .step-label { font-size: 9px !important; }
        }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#eef1ea; font-family:Arial, Helvetica, sans-serif; color:#0b1d36;">
{{-- Inbox preview text --}}
<div style="display:none; max-height:0; overflow:hidden; opacity:0;">{{ $heading }} · {{ $localMessage }}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef1ea;">
    <tr>
        <td align="center" style="padding:32px 12px;">
            <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px; background-color:#ffffff; border:1px solid #e6e6e6;">

                {{-- Header --}}
                <tr>
                    <td align="center" style="background-color:#0b1d36; padding:28px 24px;">
                        <a href="{{ $shopUrl }}" style="text-decoration:none; color:#ffffff;">
                            @if ($storeLogo)
                                <img src="{{ $storeLogo }}" alt="{{ $storeName }}" width="180" height="77" style="display:block; width:180px; max-width:100%; height:auto; border:0; outline:none; text-decoration:none;">
                            @else
                                <span style="font-family:Georgia, 'Times New Roman', serif; font-size:26px; letter-spacing:2px; color:#ffffff;">{{ $storeName }}</span>
                            @endif
                        </a>
                    </td>
                </tr>

                {{-- Status badge + heading --}}
                <tr>
                    <td class="px" align="center" style="padding:36px 40px 8px;">
                        <span style="display:inline-block; padding:6px 16px; border-radius:999px; background-color:{{ $accent }}; color:#ffffff; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase;">{{ $badge }}</span>
                        <h1 style="margin:20px 0 12px; font-family:Georgia, 'Times New Roman', serif; font-size:26px; line-height:1.3; font-weight:normal; color:#0b1d36;">{{ $heading }}</h1>
                        <p style="margin:0 0 10px; font-size:15px; line-height:1.6; color:#374151;">{{ $intro }}</p>
                        @if ($localMessage !== '')
                            <p style="margin:0; font-size:15px; line-height:1.6; color:#0b1d36; font-weight:bold;">{{ $localMessage }}</p>
                        @endif
                    </td>
                </tr>

                {{-- Progress tracker --}}
                @if ($currentStep >= 0)
                    <tr>
                        <td class="px" style="padding:28px 40px 8px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    @foreach ($steps as $i => $step)
                                        <td width="20%" align="center" valign="top" style="padding:0 3px;">
                                            <div style="height:6px; border-radius:3px; background-color:{{ $i <= $currentStep ? $accent : '#e6e6e6' }};"></div>
                                            <p class="step-label" style="margin:8px 0 0; font-size:10px; line-height:1.3; letter-spacing:0.5px; text-transform:uppercase; font-weight:bold; color:{{ $i <= $currentStep ? '#0b1d36' : '#9ca3af' }};">{{ $step }}</p>
                                        </td>
                                    @endforeach
                                </tr>
                            </table>
                        </td>
                    </tr>
                @endif

                {{-- Order meta --}}
                <tr>
                    <td class="px" style="padding:24px 40px 0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef1ea;">
                            <tr>
                                <td class="stack" width="50%" style="padding:16px 18px;" valign="top">
                                    <p style="margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Order number</p>
                                    <p style="margin:4px 0 0; font-size:16px; font-weight:bold; color:#0b1d36;">#{{ $number }}</p>
                                </td>
                                <td class="stack" width="50%" style="padding:16px 18px;" valign="top">
                                    <p style="margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Order date</p>
                                    <p style="margin:4px 0 0; font-size:14px; color:#0b1d36;">{{ $placedAt }}</p>
                                </td>
                            </tr>
                            <tr>
                                <td class="stack" width="50%" style="padding:0 18px 16px;" valign="top">
                                    <p style="margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Payment</p>
                                    <p style="margin:4px 0 0; font-size:14px; color:#0b1d36;">{{ $paymentMethod }}@if ($isPaid) · <span style="color:#16a34a; font-weight:bold;">Paid</span>@endif</p>
                                </td>
                                <td class="stack" width="50%" style="padding:0 18px 16px;" valign="top">
                                    <p style="margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">Delivery</p>
                                    <p style="margin:4px 0 0; font-size:14px; color:#0b1d36;">{{ $shippingMethod }}</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Tracking block (shipped / out for delivery) --}}
                @if ($showTracking)
                    <tr>
                        <td class="px" style="padding:20px 40px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dashed {{ $accent }};">
                                <tr>
                                    <td align="center" style="padding:20px;">
                                        @if ($trackingNumber)
                                            <p style="margin:0; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6b7280;">{{ $carrier ?: 'Courier' }} tracking number</p>
                                            <p style="margin:6px 0 0; font-family:'Courier New', Courier, monospace; font-size:22px; font-weight:bold; letter-spacing:2px; color:#0b1d36;">{{ $trackingNumber }}</p>
                                            @if ($trackingUrl)
                                                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 0;">
                                                    <tr>
                                                        <td style="background-color:{{ $accent }};">
                                                            <a href="{{ $trackingUrl }}" target="_blank" style="display:inline-block; padding:12px 28px; font-size:13px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; color:#ffffff; text-decoration:none;">Track shipment</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            @endif
                                        @else
                                            <p style="margin:0; font-size:14px; color:#374151;">Tracking details will be shared with you shortly.</p>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                @endif

                {{-- Cash due notice (COD, not yet paid) --}}
                @if ($amountDue && $status !== \App\Enums\OrderStatus::Delivered)
                    <tr>
                        <td class="px" style="padding:20px 40px 0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff7ed; border-left:4px solid #ea580c;">
                                <tr>
                                    <td style="padding:14px 18px; font-size:14px; line-height:1.5; color:#7c2d12;">
                                        <strong>Amount to pay on delivery: {{ $amountDue }}</strong><br>
                                        Please keep the exact cash amount ready for the rider.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                @endif

                {{-- Items --}}
                @if (count($items) > 0)
                    <tr>
                        <td class="px" style="padding:28px 40px 0;">
                            <p style="margin:0 0 10px; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#0b1d36;">Order summary</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e6e6e6;">
                                @foreach ($items as $item)
                                    <tr>
                                        <td width="64" valign="top" style="padding:14px 0; border-bottom:1px solid #e6e6e6;">
                                            @if ($item['image'])
                                                <img src="{{ $item['image'] }}" alt="" width="56" height="70" style="display:block; width:56px; height:70px; object-fit:cover; border:0; background-color:#eef1ea;">
                                            @else
                                                <div style="width:56px; height:70px; background-color:#eef1ea;"></div>
                                            @endif
                                        </td>
                                        <td valign="top" style="padding:14px 12px; border-bottom:1px solid #e6e6e6; font-size:14px; line-height:1.4; color:#0b1d36;">
                                            <strong>{{ $item['name'] }}</strong>
                                            @if ($item['variant'])
                                                <br><span style="font-size:12px; color:#6b7280;">{{ $item['variant'] }}</span>
                                            @endif
                                            <br><span style="font-size:12px; color:#6b7280;">{{ $item['quantity'] }} × {{ $item['unitPrice'] }}</span>
                                        </td>
                                        <td align="right" valign="top" style="padding:14px 0; border-bottom:1px solid #e6e6e6; font-size:14px; font-weight:bold; white-space:nowrap; color:#0b1d36;">{{ $item['lineTotal'] }}</td>
                                    </tr>
                                @endforeach
                            </table>

                            {{-- Totals --}}
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
                                @foreach ($totals as $row)
                                    <tr>
                                        <td style="padding:5px 0; font-size:14px; color:#374151;">{{ $row['label'] }}</td>
                                        <td align="right" style="padding:5px 0; font-size:14px; color:#374151;">{{ $row['value'] }}</td>
                                    </tr>
                                @endforeach
                                <tr>
                                    <td style="padding:12px 0 0; border-top:2px solid #0b1d36; font-size:16px; font-weight:bold; color:#0b1d36;">{{ $isCashOnDelivery && ! $isPaid ? 'Total (pay on delivery)' : 'Total' }}</td>
                                    <td align="right" style="padding:12px 0 0; border-top:2px solid #0b1d36; font-size:18px; font-weight:bold; color:#0b1d36;">{{ $grandTotal }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                @endif

                {{-- Delivery address --}}
                @if (count($address) > 0)
                    <tr>
                        <td class="px" style="padding:28px 40px 0;">
                            <p style="margin:0 0 8px; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#0b1d36;">Delivery address</p>
                            <p style="margin:0; font-size:14px; line-height:1.6; color:#374151;">
                                @foreach ($address as $line)
                                    {{ $line }}@if (! $loop->last)<br>@endif
                                @endforeach
                            </p>
                        </td>
                    </tr>
                @endif

                {{-- CTA --}}
                <tr>
                    <td class="px" align="center" style="padding:32px 40px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="background-color:#0b1d36;">
                                    <a href="{{ $orderUrl }}" target="_blank" style="display:inline-block; padding:14px 34px; font-size:13px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#ffffff; text-decoration:none;">{{ $orderUrlLabel }}</a>
                                </td>
                            </tr>
                        </table>
                        @if ($orderUrlLabel === 'Track your order')
                            <p style="margin:12px 0 0; font-size:12px; color:#6b7280;">Use order number <strong>#{{ $number }}</strong> with your email or phone.</p>
                        @endif
                    </td>
                </tr>

                {{-- Support --}}
                <tr>
                    <td class="px" align="center" style="padding:24px 40px; background-color:#eef1ea; border-top:1px solid #e6e6e6;">
                        <p style="margin:0 0 6px; font-size:14px; font-weight:bold; color:#0b1d36;">Need help with your order?</p>
                        <p style="margin:0; font-size:13px; line-height:1.7; color:#374151;">
                            @if ($storePhone)
                                Call <a href="tel:{{ preg_replace('/[^0-9+]/', '', $storePhone) }}" style="color:#0b1d36;">{{ $storePhone }}</a>
                            @endif
                            @if ($storeWhatsapp)
                                &nbsp;·&nbsp; WhatsApp <a href="https://wa.me/{{ preg_replace('/[^0-9]/', '', $storeWhatsapp) }}" style="color:#0b1d36;">{{ $storeWhatsapp }}</a>
                            @endif
                            @if ($storeEmail)
                                <br>Email <a href="mailto:{{ $storeEmail }}" style="color:#0b1d36;">{{ $storeEmail }}</a>
                            @endif
                            @if ($storeHours)
                                <br><span style="color:#6b7280;">{{ $storeHours }}</span>
                            @endif
                        </p>
                    </td>
                </tr>

                {{-- Footer --}}
                <tr>
                    <td align="center" style="padding:22px 24px; background-color:#0b1d36;">
                        @if (count($social) > 0)
                            <p style="margin:0 0 10px; font-size:12px;">
                                @foreach ($social as $link)
                                    <a href="{{ $link['href'] }}" target="_blank" style="color:#ffffff; text-decoration:none; margin:0 8px;">{{ $link['label'] }}</a>
                                @endforeach
                            </p>
                        @endif
                        @if ($storeAddress)
                            <p style="margin:0 0 6px; font-size:11px; color:#cbd5e1;">{{ $storeAddress }}</p>
                        @endif
                        <p style="margin:0; font-size:11px; color:#cbd5e1;">&copy; {{ $year }} {{ $copyright }}</p>
                        <p style="margin:6px 0 0; font-size:11px; color:#94a3b8;">You're receiving this email because you placed order #{{ $number }} at {{ $storeName }}.</p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
