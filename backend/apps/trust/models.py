from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Rating(models.Model):
    """Two-direction 1-5 rating after a completed order. v1 stores data only —
    blocking runs on problem counts, not stars (decisions.md D7)."""

    order = models.ForeignKey("orders.Request", on_delete=models.CASCADE,
                              related_name="ratings")
    rater = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="ratings_given")
    ratee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name="ratings_received")
    stars = models.PositiveSmallIntegerField(
        validators=(MinValueValidator(1), MaxValueValidator(5)))
    note = models.CharField(max_length=280, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = (
            models.UniqueConstraint(fields=("order", "rater"), name="one_rating_per_side"),
        )

    def __str__(self):
        return f"Rating order {self.order_id}: {self.rater_id} → {self.ratee_id} ({self.stars})"


class ProblemEvent(models.Model):
    """One counted problem against a user: an admin-confirmed report or a
    flake (helper accepts then cancels / lets the order go stale). Blocks
    compare a user's event count against TrustPolicy thresholds."""

    class Kind(models.TextChoices):
        REPORT = "report", "Confirmed report"
        FLAKE = "flake", "Flake (accept then drop)"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                             related_name="problem_events", db_index=True)
    order = models.ForeignKey("orders.Request", on_delete=models.SET_NULL,
                              null=True, blank=True)
    kind = models.CharField(max_length=10, choices=Kind.choices)
    # Idempotency for admin actions: one event per confirmed report.
    report = models.OneToOneField("reports.Report", on_delete=models.SET_NULL,
                                  null=True, blank=True)
    note = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"Problem({self.kind}) user {self.user_id} order {self.order_id}"


class TrustPolicy(models.Model):
    """Singleton (pk=1): the admin-tunable thresholds — tune live in /admin/
    during the pilot to find the sweet spot."""

    helper_max_problems = models.PositiveSmallIntegerField(
        default=3, help_text="Helpers at or above this count cannot accept orders.")
    customer_max_problems = models.PositiveSmallIntegerField(
        default=3, help_text="Customers at or above this count cannot post orders.")

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return (f"Trust policy (helpers ≥{self.helper_max_problems}, "
                f"customers ≥{self.customer_max_problems} problems blocked)")
