from rest_framework.permissions import BasePermission


class IsVerifiedStudent(BasePermission):
    message = "Verify your college email before making changes."

    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and
            (request.method in ("GET", "HEAD", "OPTIONS") or
             request.user.is_verified_student)
        )
