from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Manual resolution happens here (PRD §16)."""

    list_display = ("id", "order", "reporter", "issue_type", "priority", "status", "created_at")
    list_filter = ("status", "priority", "issue_type")
    search_fields = ("order__id", "reporter__email", "details")
    list_editable = ("status", "priority")
    actions = ("resolve_against_customer", "resolve_against_helper")

    def _resolve_against(self, request, queryset, accused_role):
        """Resolve the report AND count one problem against the accused party
        (trust v1). Idempotent per report via the ProblemEvent.report link."""
        from apps.trust.services import record_problem
        from apps.trust.models import ProblemEvent
        counted = 0
        for report in queryset:
            order = report.order
            accused = order.customer if accused_role == "customer" else order.helper
            if accused is None:
                continue
            report.status = Report.Status.RESOLVED
            report.save(update_fields=("status",))
            if record_problem(accused, ProblemEvent.Kind.REPORT, order=order,
                              report=report, note=f"Report #{report.pk}: {report.issue_type}"):
                counted += 1
        if request is not None:  # actions are also callable from code/tests
            self.message_user(request, f"Resolved {queryset.count()} report(s); "
                                       f"{counted} new problem(s) counted against the {accused_role}.")

    @admin.action(description="Resolve — count problem against the CUSTOMER")
    def resolve_against_customer(self, request, queryset):
        self._resolve_against(request, queryset, "customer")

    @admin.action(description="Resolve — count problem against the HELPER")
    def resolve_against_helper(self, request, queryset):
        self._resolve_against(request, queryset, "helper")
