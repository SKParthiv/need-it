from django.conf import settings
from django.db import models


class Report(models.Model):
    """Trust-and-safety report on an order. Resolved manually via Django admin
    (PRD §16) — no event-sourced timeline, single status field."""

    class IssueType(models.TextChoices):
        ITEM_PROBLEM = "Item missing or damaged", "Item missing or damaged"
        PRICE_DISPUTE = "Price dispute", "Price dispute"
        NO_SHOW = "No-show at handover", "No-show at handover"
        BEHAVIOR = "Inappropriate behavior", "Inappropriate behavior"
        OTHER = "Other", "Other"

    class Priority(models.TextChoices):
        HIGH = "High", "High"
        MEDIUM = "Medium", "Medium"
        LOW = "Low", "Low"

    class Status(models.TextChoices):
        OPEN = "Open", "Open"
        INVESTIGATING = "Investigating", "Investigating"
        RESOLVED = "Resolved", "Resolved"

    order = models.ForeignKey("orders.Request", on_delete=models.CASCADE,
                              related_name="reports")
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                 related_name="reports_filed")
    reporter_role = models.CharField(max_length=10)  # customer | helper
    issue_type = models.CharField(max_length=40, choices=IssueType.choices)
    details = models.TextField(max_length=2000)
    photo_url = models.URLField(blank=True, default="")
    priority = models.CharField(max_length=10, choices=Priority.choices,
                                default=Priority.MEDIUM)
    status = models.CharField(max_length=15, choices=Status.choices,
                              default=Status.OPEN, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Report #{self.pk} order {self.order_id} ({self.issue_type}, {self.status})"
