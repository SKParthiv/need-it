from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        HELPER = "helper", "Helper"
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    hostel_block = models.CharField(max_length=60, blank=True)
    pickup_point = models.CharField(max_length=120, blank=True)
    is_verified_student = models.BooleanField(default=False)  # college email verified
    policy_accepted_at = models.DateTimeField(null=True, blank=True)
    upi_id = models.CharField(
        max_length=80, blank=True,
        validators=[RegexValidator(
            r"^[\w.\-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,30}$",
            "Enter a valid UPI ID (e.g. name@okhdfcbank).")],
        help_text="Helper payout address — founders settle payouts to this UPI ID.",
    )

    # TODO: college-email domain allowlist + verification token flow (PRD §1).
