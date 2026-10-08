# Need It Backend: Setup, CI/CD, and Deployment

This document is the source of truth for running and deploying the backend.
The backend is Django 5.2 with Django REST Framework and PostgreSQL. It owns
the order state machine, escrow state, permissions, and API contract.

## Final runtime stack

| Concern | Technology | Role |
| --- | --- | --- |
| API | Django + Django REST Framework | HTTP API and authorization |
| Application server | Gunicorn | Production WSGI process |
| Database | PostgreSQL | Users, orders, escrow records, audit rows |
| Background jobs | Celery + Redis | Payment timeouts, pruning, notifications |
| Object storage | Cloudflare R2 or Backblaze B2 | Chat/item photos; only URLs go in PostgreSQL |
| Push notifications | FCM | Optional push delivery |
| Hosting | Render or Railway | Web service and worker processes |
| CI | GitHub Actions | Checks, migrations, and tests on every backend change |

SQLite is available only as a local fallback when `POSTGRES_HOST` is unset.
Production must always use PostgreSQL.

## Local development

### 1. Create and activate the virtual environment

PowerShell:

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

macOS/Linux:

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 2. Configure environment

Copy `backend/.env.example` to `backend/.env`. Set at least:

```dotenv
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
COLLEGE_EMAIL_DOMAINS=campus.edu
PROHIBITED_ITEMS=
PAYMENT_PROVIDER=manual
```

For local PostgreSQL, also set `POSTGRES_HOST`, `POSTGRES_DB`,
`POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_PORT`. Do not commit
`.env` or any credential.

### 3. Initialize the database and run checks

```powershell
python manage.py migrate
python manage.py check
python manage.py test apps.users apps.orders apps.payments apps.chat
python manage.py runserver
```

The initial migrations are committed. Do not run `makemigrations` as part of a
normal startup; run it only after an intentional model change, review the
generated migration, and commit it with the model change.

## Local multi-user hosting (LAN and small pilots)

Use one of these depending on what you are validating.

### Option A: Fast LAN test from one machine

Use this when you want 2-10 users on phones/laptops to hit one backend quickly.

1. Start backend on the host machine:

   ```powershell
   cd backend
   .venv\Scripts\Activate.ps1
   python manage.py migrate
   python manage.py runserver 0.0.0.0:8000
   ```

2. On the host machine, find the LAN IP:

   ```powershell
   ipconfig
   ```

3. Set `DJANGO_ALLOWED_HOSTS` in `.env` to include that IP
   (for example `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,192.168.1.10`),
   then restart the server.

4. On other devices in the same network, use:
   `http://<host-lan-ip>:8000/`.

5. Keep `PAYMENT_PROVIDER=manual` for shared testing.

This is the quickest route but still single-process unless you run Gunicorn.

### Option B: Scalable local stack via Docker Compose

Use this when you want production-like behavior on a local machine:
separate API process, Postgres, Redis, Celery worker, and Celery beat.

1. Copy local env template:

   ```bash
   cd backend
   cp .env.local.example .env.local
   ```

2. Start all services:

   ```bash
   docker compose -f docker-compose.local.yml up --build -d
   ```

3. Check health:

   ```bash
   docker compose -f docker-compose.local.yml ps
   docker compose -f docker-compose.local.yml logs api --tail 100
   ```

4. API is available at `http://localhost:8000` on the host machine.
   For other devices in the same LAN, use `http://<host-lan-ip>:8000`.

5. Shut down:

   ```bash
   docker compose -f docker-compose.local.yml down
   ```

   Add `-v` to also remove Postgres/Redis local data volumes.

## Scalable architecture for growth

Start with one API container and one worker, then scale horizontally by role.

### Baseline services

1. **API nodes (stateless):** Django + Gunicorn, multiple replicas behind a
   load balancer.
2. **Database (stateful):** managed PostgreSQL with backups and point-in-time
   recovery.
3. **Queue/broker:** managed Redis for Celery.
4. **Background workers:** Celery worker pool for async and retries.
5. **Scheduler:** one Celery beat instance only.
6. **Object storage:** R2/B2 for media URLs.

### Recommended scaling path

- **Stage 1 (pilot):** 1 API + 1 worker + 1 beat
- **Stage 2 (moderate load):** 2-3 API replicas + 2 worker replicas
- **Stage 3 (higher load):** autoscaled API/worker pools, read replicas for
  PostgreSQL, centralized observability, and blue/green deploys

### Non-negotiable architecture rules

- API processes remain stateless; no local disk assumptions.
- Do not store media blobs in PostgreSQL.
- Run exactly one beat scheduler in each environment.
- Roll out schema migrations before scaling traffic to new application code.
- Keep order/payment state transitions backend-enforced and audited.

## PostgreSQL initialization

Create a database and role in PostgreSQL, then grant ownership:

```sql
CREATE ROLE needit LOGIN PASSWORD 'use-a-secret-manager-value';
CREATE DATABASE needit OWNER needit;
```

Set the corresponding `POSTGRES_*` variables and run:

```bash
python manage.py migrate
python manage.py createsuperuser
```

For managed PostgreSQL, use the provider's SSL connection settings and restrict
network access to the application service where supported.

## Production configuration

Set these values in the hosting provider's secret/environment configuration:

- `DJANGO_SECRET_KEY`: unique long random value
- `DJANGO_DEBUG=false`
- `DJANGO_ALLOWED_HOSTS`: deployed API hostname
- `POSTGRES_*`: managed PostgreSQL connection
- `CELERY_BROKER_URL`: Upstash Redis or another managed Redis URL
- `S3_ENDPOINT_URL`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: R2/B2
- `FCM_SERVER_KEY`: only when push delivery is enabled
- `PAYMENT_PROVIDER=manual` for the pilot, or `razorpay` only after the
  Razorpay Route integration and KYC are complete

Never place secrets in GitHub workflow files, Dockerfiles, migrations, or
frontend source.

## Deploying on Render

Create one web service and two background workers from the same repository:

| Service | Command |
| --- | --- |
| Web | `cd backend && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT` |
| Celery worker | `cd backend && celery -A config worker --loglevel=INFO` |
| Celery beat | `cd backend && celery -A config beat --loglevel=INFO` |

Set the build command to:

```bash
pip install -r backend/requirements.txt && python backend/manage.py migrate
```

Set health-check path to `/admin/login/` or another authenticated-safe health
endpoint once one is provided. Configure the same environment values on all
three services. Run migrations before routing traffic to a new release.

## CI/CD pipeline

`.github/workflows/backend-ci.yml` runs for pull requests and pushes that
change `backend/` or this deployment guide. It:

1. Uses Python 3.12.
2. Installs the pinned backend requirements.
3. Runs `manage.py check`.
4. Verifies migrations are committed with `makemigrations --check`.
5. Runs the isolated backend test labels.

CI uses SQLite because it must be deterministic and does not need secrets.
Deployments use PostgreSQL through the hosting provider. The deployment
platform should run `python manage.py migrate` as the release step, followed by
the web/worker processes above.

### Release checklist

- [ ] CI is green on the PR.
- [ ] No frontend files were changed for a backend-only PR.
- [ ] `python manage.py makemigrations --check` passes.
- [ ] PostgreSQL backup and restore policy is configured.
- [ ] Environment values are set in the hosting provider, not in Git.
- [ ] Web, Celery worker, and Celery beat use the same release.
- [ ] Smoke-test registration, feed, payment status, and chat polling.
- [ ] Confirm logs contain no secrets or payment credentials.

## Storage and retention rules

- Photos must be uploaded to R2/B2; PostgreSQL stores only URL strings.
- Notifications older than 30 days should be pruned by Celery beat.
- Status-change audit rows older than 90 days should be pruned by Celery beat.
- Do not add AskNeedit tables or endpoints.
- Preserve the exact order statuses: `open`, `accepted`, `purchased`,
  `handed_over`, `completed`, and `cancelled`.
