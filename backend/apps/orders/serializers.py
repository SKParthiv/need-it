from django.conf import settings
from rest_framework import serializers
from .models import Request, RequestItem


class RequestItemSerializer(serializers.ModelSerializer):
    expectedPrice = serializers.IntegerField(source="expected_price")
    actualPrice = serializers.IntegerField(source="actual_price", allow_null=True, required=False)
    replacementProposal = serializers.JSONField(source="replacement_proposal", allow_null=True, required=False)

    class Meta:
        model = RequestItem
        fields = ("id", "name", "quantity", "expectedPrice", "actualPrice",
                  "notes", "status", "replacementProposal")
        read_only_fields = ("id", "actualPrice", "status", "replacementProposal")


class RequestSerializer(serializers.ModelSerializer):
    items = RequestItemSerializer(many=True)
    neededBy = serializers.DateTimeField(source="needed_by")
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    pickupPoint = serializers.CharField(source="pickup_point")
    isUrgent = serializers.BooleanField(source="is_urgent", required=False)
    expectedTotal = serializers.IntegerField(source="expected_total")
    customerName = serializers.CharField(source="customer.get_full_name", read_only=True)
    helperId = serializers.IntegerField(source="helper_id", read_only=True, allow_null=True)

    class Meta:
        model = Request
        fields = ("id", "customerName", "neededBy", "isUrgent", "pickupPoint",
                  "expectedTotal", "status", "createdAt", "helperId", "items")
        read_only_fields = ("id", "customerName", "status", "createdAt", "helperId")

    def validate_items(self, items):
        prohibited = {item.lower() for item in getattr(settings, "PROHIBITED_ITEMS", [])}
        for item in items:
            if item["name"].strip().lower() in prohibited:
                raise serializers.ValidationError(
                    f"'{item['name']}' is not allowed in a request."
                )
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        return items

    def create(self, validated_data):
        items = validated_data.pop("items")
        request = Request.objects.create(customer=self.context["request"].user, **validated_data)
        RequestItem.objects.bulk_create(
            [RequestItem(request=request, **item) for item in items]
        )
        return request
