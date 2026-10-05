from django.contrib.auth.models import AbstractUser
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

    # TODO: college-email domain allowlist + verification token flow (PRD §1).
