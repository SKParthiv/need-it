import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.conf import settings

# Seeding creates a SUPERUSER with a known password. It must never run
# against a real database by accident.
if not settings.DEBUG and os.environ.get("ALLOW_SEED") != "true":
    raise SystemExit(
        "Refusing to seed test accounts when DEBUG is off. "
        "Set ALLOW_SEED=true only if you really mean it."
    )

from apps.users.models import User
from rest_framework.authtoken.models import Token

# Passwords come from the environment; these defaults are for local dev only
# (the script is gated on DEBUG above).
SEED_PASSWORD = os.environ.get("SEED_PASSWORD", "TestPass123!")
SEED_ADMIN_PASSWORD = os.environ.get("SEED_ADMIN_PASSWORD", "AdminPass123!")

def seed():
    accounts = [
        {
            "username": "customer@sastra.ac.in",
            "email": "customer@sastra.ac.in",
            "first_name": "Aarav",
            "last_name": "Sharma",
            "role": User.Role.CUSTOMER,
            "hostel_block": "Hostel Block A, Room 312",
            "pickup_point": "Boys’ Hostel Area",
            "password": SEED_PASSWORD,
        },
        {
            "username": "helper@sastra.ac.in",
            "email": "helper@sastra.ac.in",
            "first_name": "Priya",
            "last_name": "K.",
            "role": User.Role.HELPER,
            "hostel_block": "Girls’ Hostel Area",
            "pickup_point": "Girls’ Hostel Area",
            "password": SEED_PASSWORD,
        },
        {
            "username": "admin@sastra.ac.in",
            "email": "admin@sastra.ac.in",
            "first_name": "Campus",
            "last_name": "Admin",
            "role": User.Role.CUSTOMER,
            "hostel_block": "Admin / Dev HQ",
            "pickup_point": "ASK Building / Fountain Area",
            "password": SEED_ADMIN_PASSWORD,
            "is_staff": True,
            "is_superuser": True,
        },
    ]

    for acc in accounts:
        email = acc["email"]
        user = User.objects.filter(username=email).first()
        if not user:
            user = User.objects.filter(email=email).first()

        if not user:
            user = User(
                username=email,
                email=email,
                first_name=acc["first_name"],
                last_name=acc["last_name"],
                role=acc["role"],
                hostel_block=acc.get("hostel_block", ""),
                pickup_point=acc.get("pickup_point", ""),
                is_verified_student=True,
                is_staff=acc.get("is_staff", False),
                is_superuser=acc.get("is_superuser", False),
            )
            user.set_password(acc["password"])
            user.save()
            print(f"[CREATED] {email} (role: {user.role})")
        else:
            user.role = acc["role"]
            user.first_name = acc["first_name"]
            user.last_name = acc["last_name"]
            user.is_verified_student = True
            if "is_staff" in acc:
                user.is_staff = acc["is_staff"]
                user.is_superuser = acc["is_superuser"]
            user.set_password(acc["password"])
            user.save()
            print(f"[UPDATED] {email} (role: {user.role})")

        token, _ = Token.objects.get_or_create(user=user)
        print(f"         Token: {token.key}")

if __name__ == "__main__":
    seed()
