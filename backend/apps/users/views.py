import logging

from django.core import signing
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User
from .serializers import RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)

TOKEN_SALT = "users.email-verification"


def _send_verification_email(user, token):
    """Send the one-click verification link. Raises on provider failure —
    callers decide how to degrade."""
    verify_url = f"{settings.PUBLIC_API_BASE_URL}/api/auth/verify/?token={token}"
    send_mail(
        "Verify your Need It account",
        f"Hi {user.first_name or 'there'},\n\nConfirm your student email to activate "
        f"your Need It account:\n\n{verify_url}\n\nThis link expires in 24 hours.",
        None,
        [user.email],
        fail_silently=False,
    )

@api_view(["GET", "PATCH"])
def me(request):
    if request.method == "PATCH":
        # Whitelist: users may edit their own payout/profile basics only.
        data = {key: request.data[key] for key in ("upi_id", "hostel_block", "pickup_point")
                if key in request.data}
        serializer = UserSerializer(request.user, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token = signing.dumps({"user_id": user.pk, "email": user.email}, salt=TOKEN_SALT)
    if settings.EMAIL_CONFIGURED:
        try:
            _send_verification_email(user, token)
        except Exception:
            # The account EXISTS at this point — never 500 over email.
            # Provider outages/bad keys degrade to pilot-style recovery.
            logger.exception("verification email failed for user %s", user.pk)
            return Response(
                {"user": UserSerializer(user).data,
                 "email_sent": False,
                 "detail": "Account created, but the verification email could not "
                           "be sent — use /api/auth/resend-verification/ to get "
                           "a new link once email is back."},
                status=status.HTTP_201_CREATED)
        return Response({"user": UserSerializer(user).data,
                         "email_sent": True,
                         "detail": "Verification email sent."},
                        status=status.HTTP_201_CREATED)
    # Pilot mode (no SMTP configured): token travels in the response.
    return Response({"user": UserSerializer(user).data, "verification_token": token},
                    status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_verification(request):
    """Fresh verification link for an unverified account.

    Always answers 200 with a generic message for unknown/verified accounts
    (no account enumeration); the only exception is a provider failure, where
    honesty is more useful than secrecy.
    """
    email = str(request.data.get("email", "")).lower().strip()
    try:
        user = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        user = None
    if user is not None and not user.is_verified_student:
        token = signing.dumps({"user_id": user.pk, "email": user.email}, salt=TOKEN_SALT)
        if settings.EMAIL_CONFIGURED:
            try:
                _send_verification_email(user, token)
            except Exception:
                logger.exception("resend verification email failed for user %s", user.pk)
                return Response(
                    {"detail": "Email is having problems right now — try again later."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE)
        else:
            # Pilot mode: token travels in the response, same as register.
            return Response({"verification_token": token})
    return Response({"detail": "If an unverified account exists for that email, "
                               "a new link is on its way."})


_VERIFY_OK_HTML = (
    "<html><body style='font-family:sans-serif;text-align:center;padding:3rem'>"
    "<h2>Email verified</h2><p>Your Need It account is active — open the app and log in.</p>"
    "</body></html>"
)
_VERIFY_BAD_HTML = (
    "<html><body style='font-family:sans-serif;text-align:center;padding:3rem'>"
    "<h2>Link invalid or expired</h2><p>Register again to get a fresh link.</p>"
    "</body></html>"
)


@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email_link(request):
    """One-click verification from the email link (GET so mail clients can open it)."""
    try:
        payload = signing.loads(request.GET.get("token", ""), salt=TOKEN_SALT, max_age=86400)
        user = User.objects.get(pk=payload["user_id"], email=payload["email"])
    except (signing.BadSignature, User.DoesNotExist, KeyError):
        return HttpResponse(_VERIFY_BAD_HTML, status=400)
    if not user.is_verified_student:
        user.is_verified_student = True
        user.save(update_fields=("is_verified_student",))
    return HttpResponse(_VERIFY_OK_HTML)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_email(request):
    try:
        payload = signing.loads(request.data["token"], salt=TOKEN_SALT, max_age=86400)
        user = User.objects.get(pk=payload["user_id"], email=payload["email"])
    except (KeyError, signing.BadSignature, User.DoesNotExist):
        return Response({"detail": "Invalid or expired verification token."},
                        status=status.HTTP_400_BAD_REQUEST)
    user.is_verified_student = True
    user.save(update_fields=("is_verified_student",))
    return Response(UserSerializer(user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = str(request.data.get("email", "")).lower().strip()
    user = authenticate(username=email, password=request.data.get("password"))
    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


@api_view(["POST"])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
