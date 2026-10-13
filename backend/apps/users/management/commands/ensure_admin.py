"""Create (or repair) the Django superuser from env, idempotently.

Render's free tier has no shell, so this runs in the deploy build command.
No-ops unless BOTH ADMIN_EMAIL and ADMIN_PASSWORD are set.
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create/update the superuser from ADMIN_EMAIL + ADMIN_PASSWORD env vars."

    def handle(self, *args, **options):
        email = os.environ.get("ADMIN_EMAIL", "").strip()
        password = os.environ.get("ADMIN_PASSWORD", "")
        if not email or not password:
            self.stdout.write("ensure_admin: ADMIN_EMAIL/ADMIN_PASSWORD not set, skipping.")
            return

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=email,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_verified_student": True,
            },
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"ensure_admin: created superuser {email}"))
        else:
            # Existing account: guarantee the flags, never clobber the password.
            fixed = False
            for field in ("is_staff", "is_superuser", "is_verified_student"):
                if not getattr(user, field):
                    setattr(user, field, True)
                    fixed = True
            if fixed:
                user.save(update_fields=("is_staff", "is_superuser", "is_verified_student"))
            self.stdout.write(f"ensure_admin: {email} already exists (flags ensured).")
