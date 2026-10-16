# Local Development & Testing

Everything needed to run Need It on a laptop (Windows-first; macOS/Linux
trivially adapted). Production deploys are elsewhere — see `runbook.md` — you never need production access to develop.

## Setup

```powershell
git clone https://github.com/SKParthiv/need-it.git; cd need-it

# backend
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env       # local defaults work out of the box
python manage.py migrate
python manage.py runserver        # http://127.0.0.1:8000

# web client (second terminal)
cd web
npm install
Copy-Item .env.example .env       # set VITE_ADMIN_EMAILS for admin-demo logins
npm run dev                       # http://localhost:3000
```

SQLite is the local default (no Postgres install needed). To test against
real Postgres: `docker compose -f backend/docker-compose.local.yml up postgres`
and set the `POSTGRES_*` vars in `backend/.env`.

Accounts: real SASTRA Google sign-in only (no seeded users — the seed script
was removed). For local sign-in, add `http://localhost:3000` to the OAuth
client's JavaScript origins in Google Cloud Console. Backend tests create
their own throwaway users.

## Verify before you push

```powershell
cd backend
python manage.py check
python manage.py makemigrations --check   # model changed? commit the migration
python manage.py test                     # the full suite (49 tests)
cd ..\web
npx tsc --noEmit
npm run build
```

CI runs the same backend suite in **production config** (DEBUG=false,
Postgres) on every PR — green local + green CI = mergeable.

## Smoke flow (the whole business in 8 steps)

With one customer + one helper account (seed script makes both):

1. Customer creates an order with ≥1 item.
2. Helper accepts it; a second helper gets a 409.
3. Helper proposes actual prices; customer approves every available item.
4. Customer pays with a fee inside ₹20–50 (out-of-range → 400).
5. Both confirm payment → payment becomes `held`.
6. Helper marks purchased (fails loudly if payment isn't held — that's the escrow gate).
7. Both confirm handover → `completed` + payment `released`.
8. Separately: cancel an order with a pending/held payment → `refunded`.

## Testing on your phone / another laptop (LAN)

Servers already listen on all interfaces (`runserver 0.0.0.0:8000`, Vite
`host:true`). If another device can't connect, walk this list in order:

1. **Use the real LAN IP, not the WSL one.** `start-web.ps1` prints the
   correct `192.168.x.x`/`10.x.x.x` URL; `172.x.x.x` addresses are virtual.
2. **Django DisallowedHost** — DEBUG=true accepts any host; DEBUG off needs
   the IP in `DJANGO_ALLOWED_HOSTS` (intentional).
3. **Windows firewall** — first-run "Allow access" prompt; if dismissed:
   `New-NetFirewallRule -DisplayName "NeedIt Django 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow` (same for 3000).
4. **Same network + no client isolation.** Campus/hostel Wi-Fi often
   isolates clients — use your own hotspot for demos.
5. Direct API from another device: `http://<LAN-IP>:8000/api/...` works
   without the Vite proxy.

## The mobile app

`apps/mobile/` currently contains only the Android native shell — the
Expo/React Native source is not in this repo yet (tracked in TODO.md).
Once it lands: `cd apps/mobile; npm install; npx expo start`, point its API
base URL at the running backend, and repeat the smoke flow.
