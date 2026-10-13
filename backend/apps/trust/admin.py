from django.contrib import admin

from .models import ProblemEvent, Rating, TrustPolicy


@admin.register(TrustPolicy)
class TrustPolicyAdmin(admin.ModelAdmin):
    """The pilot tuning knobs — edit the singleton, never create rows."""

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        from django.shortcuts import redirect
        return redirect("admin:trust_trustpolicy_change", TrustPolicy.get().pk)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "rater", "ratee", "stars", "created_at")
    list_filter = ("stars",)
    search_fields = ("order__id", "rater__email", "ratee__email")

    def has_add_permission(self, request):
        return False


@admin.register(ProblemEvent)
class ProblemEventAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "kind", "order", "report", "created_at")
    list_filter = ("kind",)
    search_fields = ("user__email", "order__id", "note")
    readonly_fields = ("user", "kind", "order", "report", "note", "created_at")

    def has_add_permission(self, request):
        return False
