from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "role", "hostel_block",
                  "pickup_point", "is_verified_student")
        read_only_fields = ("is_verified_student",)
