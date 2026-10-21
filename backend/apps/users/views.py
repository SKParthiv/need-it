import logging

from django.core import signing
from django.contrib.auth import authenticate
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
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
def google_auth(request):
    """Sign in (or create) an account with a Google ID token.

    SASTRA email is Google Workspace, so a verified Google token with
    hd == an allowed college domain IS student verification — the account
    is born is_verified_student=True. First sign-in creates the account
    (role taken from the request); later sign-ins link by email.
    """
    if not settings.GOOGLE_CLIENT_ID:
        return Response({"detail": "Google sign-in is not configured."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE)
    id_token = str(request.data.get("id_token", "")).strip()
    if not id_token:
        return Response({"detail": "id_token is required."},
                        status=status.HTTP_400_BAD_REQUEST)
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token
    try:
        claims = google_id_token.verify_oauth2_token(
            id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except ValueError:
        return Response({"detail": "Invalid Google token."},
                        status=status.HTTP_400_BAD_REQUEST)
    email = str(claims.get("email", "")).lower().strip()
    hosted_domain = str(claims.get("hd", "")).lower().strip()
    domains = getattr(settings, "COLLEGE_EMAIL_DOMAINS", [])
    if not claims.get("email_verified") or not email:
        return Response({"detail": "Google account email is not verified."},
                        status=status.HTTP_403_FORBIDDEN)
    # hd (Workspace hosted domain) is the unforgeable campus proof; fall
    # back to the email's domain only when hd is absent.
    domain_ok = (hosted_domain in domains) if domains else True
    if domains and not domain_ok:
        domain_ok = not hosted_domain and email.rsplit("@", 1)[-1] in domains
    if not domain_ok:
        return Response({"detail": "Sign in with your college Google account."},
                        status=status.HTTP_403_FORBIDDEN)
    user = User.objects.filter(email__iexact=email).first()
    if user is None:
        role = str(request.data.get("role", "")).lower().strip()
        if role not in (User.Role.CUSTOMER, User.Role.HELPER):
            return Response(
                {"detail": "role (customer|helper) is required for first sign-in."},
                status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(
            username=email, email=email,
            first_name=claims.get("given_name", "")[:150],
            last_name=claims.get("family_name", "")[:150],
            role=role)
        user.set_unusable_password()
        user.save()
    if not user.is_verified_student:
        user.is_verified_student = True
        user.save(update_fields=["is_verified_student"])
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": UserSerializer(user).data})


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


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def collateral_status(request):
    return Response({
        "collateralBalance": getattr(request.user, "collateral_balance", 200),
        "role": request.user.role,
        "isVerifiedStudent": request.user.is_verified_student,
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_overview(request):
    from apps.orders.models import Request, OrderStatus
    from apps.reports.models import Report
    return Response({
        "openOrders": Request.objects.filter(status=OrderStatus.OPEN).count(),
        "activeOrders": Request.objects.exclude(
            status__in=[OrderStatus.COMPLETED, OrderStatus.CANCELLED]
        ).count(),
        "totalUsers": User.objects.count(),
        "pendingReports": Report.objects.filter(status=Report.Status.OPEN).count(),
    })


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_set_collateral(request, user_id):
    user = User.objects.filter(pk=user_id).first()
    if not user:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    try:
        user.collateral_balance = max(0, int(request.data.get("amount", 200)))
        user.save(update_fields=["collateral_balance"])
    except (TypeError, ValueError):
        return Response({"detail": "Invalid amount."}, status=status.HTTP_400_BAD_REQUEST)
    # Audit + visibility: the affected user always sees their new deposit.
    import logging
    logger = logging.getLogger("django.request")
    logger.info("collateral set user_id=%s amount=%s actor=%s request_id=%s",
                user.pk, user.collateral_balance, request.user.pk, request.headers.get("X-Request-ID", "-"))
    from apps.notifications.services import notify
    from apps.notifications.models import Notification
    notify(user, Notification.Type.BROADCAST, "Deposit updated",
           f"Your security deposit is now ₹{user.collateral_balance}.", order=None)
    return Response({"userId": user.pk, "collateralBalance": user.collateral_balance})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_reports_list(request):
    from apps.reports.models import Report
    from apps.reports.views import _serialize
    qs = Report.objects.all().order_by("-created_at")[:50]
    return Response({"reports": [_serialize(r) for r in qs]})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_resolve_report(request, report_id):
    from apps.reports.models import Report
    from apps.reports.views import _serialize
    report = Report.objects.filter(pk=report_id).first()
    if not report:
        return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
    status_val = request.data.get("status")
    if status_val not in Report.Status.values:
        return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)
    blame = request.data.get("blame")
    if blame is not None and blame not in ("customer", "helper"):
        return Response({"detail": "Invalid blame. Use 'customer' or 'helper'."}, status=status.HTTP_400_BAD_REQUEST)
    report.status = status_val
    report.save(update_fields=["status"])
    if blame:
        # Mirror the /admin/ resolve actions: count one problem against the
        # accused party (idempotent per report via ProblemEvent.report).
        from apps.trust.services import record_problem
        from apps.trust.models import ProblemEvent
        accused = report.order.helper if blame == "helper" else report.order.customer
        record_problem(accused, ProblemEvent.Kind.REPORT,
                       order=report.order, report=report)
    return Response(_serialize(report))
