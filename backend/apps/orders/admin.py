from django.contrib import admin
from .models import Request, RequestItem, StatusChange

class RequestItemInline(admin.TabularInline):
    model = RequestItem
    extra = 0

@admin.register(Request)
class RequestAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "helper", "status", "pickup_point", "needed_by", "is_urgent")
    list_filter = ("status", "is_urgent")
    inlines = [RequestItemInline]

@admin.register(StatusChange)
class StatusChangeAdmin(admin.ModelAdmin):
    list_display = ("request", "from_status", "to_status", "actor", "at")
    readonly_fields = ("request", "from_status", "to_status", "actor", "at")
