from .models import Notification


def notify(user, type_, title, message, order=None):
    """Emit one in-app notification. No-op without a recipient (e.g. order with no helper yet)."""
    if user is None:
        return None
    return Notification.objects.create(
        user=user, type=type_, title=title, message=message, order=order,
    )
