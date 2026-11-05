from datetime import timezone as datetime_timezone

from django.utils import timezone


def pharmacy_order_local_time(value):
    """Convert an order timestamp to IST, treating legacy naive values as UTC."""
    if value is None:
        return None
    if timezone.is_naive(value):
        value = timezone.make_aware(value, datetime_timezone.utc)
    return timezone.localtime(value, timezone.get_fixed_timezone(330))
