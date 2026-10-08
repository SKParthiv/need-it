from django.core import signing
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User
from .serializers import RegisterSerializer, UserSerializer

TOKEN_SALT = "users.email-verification"

@api_view(["GET"])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    token = signing.dumps({"user_id": user.pk, "email": user.email}, salt=TOKEN_SALT)
    return Response({"user": UserSerializer(user).data, "verification_token": token},
                    status=status.HTTP_201_CREATED)


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
