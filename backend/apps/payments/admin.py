from django.contrib import admin
from .models import Payment, PaymentEvent

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("request", "status", "item_cost", "helper_fee", "provider")

@admin.register(PaymentEvent)
class PaymentEventAdmin(admin.ModelAdmin):
    list_display = ("provider_event_id", "kind", "received_at")
    readonly_fields = ("provider_event_id", "kind", "payload", "received_at")
