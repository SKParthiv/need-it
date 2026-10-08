from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "name", "college_email", "email", "role",
                  "hostel_block", "pickup_point", "is_verified_student",
                  "status", "joined_date")
        read_only_fields = ("is_verified_student",)

    name = serializers.SerializerMethodField()
    college_email = serializers.EmailField(source="email", read_only=True)
    status = serializers.SerializerMethodField()
    joined_date = serializers.DateTimeField(source="date_joined", read_only=True)

    def get_status(self, obj):
        return "active" if obj.is_active else "inactive"

    def get_name(self, obj):
        return obj.get_full_name() or obj.email


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    policy_accept = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "password", "role", "first_name", "last_name",
                  "hostel_block", "pickup_point", "policy_accept")

    def validate_email(self, value):
        email = value.lower().strip()
        domains = getattr(settings, "COLLEGE_EMAIL_DOMAINS", [])
        if domains and email.rsplit("@", 1)[-1] not in domains:
            raise serializers.ValidationError("Use an approved college email.")
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def validate(self, attrs):
        if not attrs.pop("policy_accept"):
            raise serializers.ValidationError({"policy_accept": "Policy acceptance is required."})
        return attrs

    def create(self, validated_data):
        email = validated_data.pop("email")
        user = User.objects.create_user(username=email, email=email, **validated_data)
        user.policy_accepted_at = timezone.now()
        user.save(update_fields=("policy_accepted_at",))
        return user
