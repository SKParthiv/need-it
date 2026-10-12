"""
Need It — Django settings.
Every value that depends on environment, a secret, or a paid/free account is
read from the environment. See .env.example. Nothing real is hardcoded.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Load .env file if present ---
env_path = BASE_DIR / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

# --- Core ---
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if DEBUG:
        # Local-dev convenience only. Never acceptable with DEBUG off:
        # a predictable SECRET_KEY lets anyone forge sessions/tokens.
        SECRET_KEY = "local-dev-fallback-secret-key-needit"
    else:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY must be set when DJANGO_DEBUG is not true"
        )
# ALLOWED_HOSTS: in DEBUG default to "*" so phones/other laptops on the LAN can
# reach the dev server. With DEBUG off it MUST be set explicitly via env.
if DEBUG:
    ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")
else:
    ALLOWED_HOSTS = os.environ["DJANGO_ALLOWED_HOSTS"].split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "apps.users",
    "apps.orders",
    "apps.payments",
    "apps.chat",
    "apps.notifications",
    "apps.availability",
    "apps.reports",
    "corsheaders",
]

MIDDLEWARE = [
    "config.middleware.RequestIdMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

# --- Database (Postgres in deployments, SQLite for local/test runs) ---
if os.environ.get("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.environ.get("POSTGRES_DB", "needit"),
            "USER": os.environ.get("POSTGRES_USER", "needit"),
            "PASSWORD": os.environ.get("POSTGRES_PASSWORD", ""),
            "HOST": os.environ["POSTGRES_HOST"],
            "PORT": os.environ.get("POSTGRES_PORT", "5432"),
            # Managed Postgres (Neon) REQUIRES SSL — without this the first
            # deploy's migrate fails to connect. Local docker Postgres has no
            # SSL, so default flips with DEBUG; override with POSTGRES_SSLMODE.
            "OPTIONS": {"sslmode": os.environ.get(
                "POSTGRES_SSLMODE", "disable" if DEBUG else "require")},
        }
    }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3",
                             "NAME": BASE_DIR / "db.sqlite3"}}

AUTH_USER_MODEL = "users.User"

# --- DRF: token auth (mobile, no cookies / no CSRF) ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

COLLEGE_EMAIL_DOMAINS = [
    domain.strip().lower()
    for domain in os.environ.get("COLLEGE_EMAIL_DOMAINS", "").split(",")
    if domain.strip()
]
PROHIBITED_ITEMS = [
    item.strip().lower()
    for item in os.environ.get("PROHIBITED_ITEMS", "").split(",")
    if item.strip()
]

# --- Payments: which escrow provider is active ---
# 'manual' (pilot: record confirmations) or 'razorpay' (real escrow via Route).
PAYMENT_PROVIDER = os.environ.get("PAYMENT_PROVIDER", "manual")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "")

# --- Object storage (chat + item photos) — S3-compatible ---
S3_ENDPOINT_URL = os.environ.get("S3_ENDPOINT_URL", "")
S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY", "")

# --- Production hardening ---
# Render (and any TLS-terminating proxy) forwards requests as plain HTTP;
# trust X-Forwarded-Proto so redirects/admin/secure cookies behave.
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    CSRF_TRUSTED_ORIGINS = [
        o.strip() for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o.strip()
    ]

# --- Email (verification links) ---
# Render's free tier BLOCKS outbound SMTP (ports 25/465/587), so production
# uses an HTTP email API: Brevo (300 emails/day free, no card) via anymail.
# Set BREVO_API_KEY in production. Plain SMTP (EMAIL_HOST et al.) still works
# for local/dev where port 587 is open. With neither configured, register
# returns the token in the API response (pilot mode).
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
DEFAULT_FROM_EMAIL = os.environ.get(
    "DEFAULT_FROM_EMAIL", EMAIL_HOST_USER or "Need It <noreply@needit.in>")
if BREVO_API_KEY:
    EMAIL_BACKEND = "anymail.backends.brevo.EmailBackend"
    ANYMAIL = {"BREVO_API_KEY": BREVO_API_KEY}
    EMAIL_CONFIGURED = True
elif EMAIL_HOST and EMAIL_HOST_USER:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_CONFIGURED = True
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
    EMAIL_CONFIGURED = False
EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", EMAIL_BACKEND)

# Public origin of THIS api, used to build verification links in emails.
PUBLIC_API_BASE_URL = os.environ.get("PUBLIC_API_BASE_URL", "http://localhost:8000").rstrip("/")

# --- CORS (web app on a different origin calls the API) ---
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")

# --- Push (FCM) ---
FCM_SERVER_KEY = os.environ.get("FCM_SERVER_KEY", "")

# --- Celery (timeouts: payment-expiry auto-release) ---
CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")

# --- Business rules (from PRD, tunable) ---
HELPER_FEE_MIN = int(os.environ.get("HELPER_FEE_MIN", "20"))
HELPER_FEE_MAX = int(os.environ.get("HELPER_FEE_MAX", "50"))
PAYMENT_TIMEOUT_MINUTES = int(os.environ.get("PAYMENT_TIMEOUT_MINUTES", "30"))
ORDER_VALUE_CAP = int(os.environ.get("ORDER_VALUE_CAP", "2000"))

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {
        "request_id": {"()": "config.middleware.RequestIdFilter"},
    },
    "formatters": {
        "default": {
            "format": "%(asctime)s %(levelname)s %(name)s "
                      "request_id=%(request_id)s %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
            "filters": ["request_id"],
            "formatter": "default",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": os.environ.get("LOG_LEVEL", "INFO"),
    },
}
