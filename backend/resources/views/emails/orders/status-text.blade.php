{!! $storeName !!} · {!! $badge !!}

{!! $heading !!}

{!! $intro !!}
@if ($localMessage !== '')
{!! $localMessage !!}
@endif

Order number: #{!! $number !!}
Order date: {!! $placedAt !!}
Payment: {!! $paymentMethod !!}{!! $isPaid ? ' (Paid)' : '' !!}
Delivery: {!! $shippingMethod !!}
@if ($showTracking)

@if ($trackingNumber)
{!! $carrier ?: 'Courier' !!} tracking number: {!! $trackingNumber !!}
@if ($trackingUrl)
Track shipment: {!! $trackingUrl !!}
@endif
@else
Tracking details will be shared with you shortly.
@endif
@endif
@if ($amountDue && $status !== \App\Enums\OrderStatus::Delivered)

Amount to pay on delivery: {!! $amountDue !!}
@endif

ORDER SUMMARY
@foreach ($items as $item)
- {!! $item['name'] !!}{!! $item['variant'] ? ' ('.$item['variant'].')' : '' !!} · {!! $item['quantity'] !!} × {!! $item['unitPrice'] !!} = {!! $item['lineTotal'] !!}
@endforeach

@foreach ($totals as $row)
{!! $row['label'] !!}: {!! $row['value'] !!}
@endforeach
Total: {!! $grandTotal !!}
@if (count($address) > 0)

DELIVERY ADDRESS
@foreach ($address as $line)
{!! $line !!}
@endforeach
@endif

{!! $orderUrlLabel !!}: {!! $orderUrl !!}

Need help? @if ($storePhone)Call {!! $storePhone !!}. @endif @if ($storeEmail)Email {!! $storeEmail !!}.@endif

© {!! $year !!} {!! $copyright !!}
