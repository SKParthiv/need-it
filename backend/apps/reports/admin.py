from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    """Manual resolution happens here (PRD §16)."""

    list_display = ("id", "order", "reporter", "issue_type", "priority", "status", "created_at")
    list_filter = ("status", "priority", "issue_type")
    search_fields = ("order__id", "reporter__email", "details")
    list_editable = ("status", "priority")
