from django.conf import settings
from django.db import models


class AvailabilityWindow(models.Model):
    """A helper's declared window for taking orders (PRD: helper availability)."""

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    helper = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                               related_name="availability_windows")
    date = models.DateField()
    time_window = models.CharField(max_length=60)  # e.g. "5 PM - 8 PM"
    status = models.CharField(max_length=20, choices=Status.choices,
                              default=Status.ACTIVE, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("date", "time_window")

    def __str__(self):
        return f"{self.helper_id} {self.date} {self.time_window} ({self.status})"
