# Need It: app, website, and API testing

This is the repeatable local test procedure for the three product surfaces.
Run the backend checks first because both clients depend on the API.

## 1. Sync and prepare the repository

PowerShell:

```powershell
git fetch
git pull
git status --short
```

The working tree should not contain unrelated changes. Never commit `.env`,
credentials, `node_modules`, or build output.

## 2. Run the backend

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py check
python manage.py makemigrations --check
python manage.py test apps.users apps.orders apps.payments apps.chat
python manage.py runserver
```

Keep the server running at `http://127.0.0.1:8000`. For a phone on the same
LAN, use `python manage.py runserver 0.0.0.0:8000`, add the host LAN IP to
`DJANGO_ALLOWED_HOSTS`, and configure the client API base URL with that IP.

### Backend smoke flow

Use two verified student accounts: one customer and one helper. Verify the
following sequence through the client or an API tool:

1. Customer creates an order with at least one item.
2. Helper accepts it; a second helper receives a conflict response.
3. Helper proposes actual prices and customer approves every available item.
4. Customer pays with a helper fee within `HELPER_FEE_MIN` and
   `HELPER_FEE_MAX`; malformed, negative, and out-of-range fees return `400`.
5. Both parties confirm payment. The payment becomes `held`.
6. The assigned helper calls `POST /orders/<id>/mark-purchased/`; the order
   becomes `purchased`.
7. Both parties confirm the handover code; the order becomes `completed` and
   the payment becomes `released`.
8. Cancel an order with a pending or held payment and verify the payment is
   `refunded`. A different authenticated user cannot read its payment status.

The exact order vocabulary is `open`, `accepted`, `purchased`, `handed_over`,
`completed`, and `cancelled`.

## 3. Test the mobile app

The current repository contains the Android native shell under
`apps/mobile/android`, but it does not currently contain the Expo/React Native
JavaScript project (`package.json`, `app.json`, or `src/`). Therefore the
mobile UI cannot be started from this checkout yet.

Once the client source is restored:

```powershell
cd apps/mobile
npm install
npx expo start
```

Open the development build or Android emulator, set its API base URL to the
running backend, and repeat the smoke flow above. Verify loading, error, empty,
and retry states for feed, order details, payment, cancellation, and handover.
For a native Android build, use `cd apps/mobile/android; .\gradlew.bat assembleDebug`.

## 4. Test the website

```powershell
cd web
npm install
npm run dev
```

Open the displayed local URL and verify the landing page, responsive layout,
navigation, links, form validation, and API error states. The current website
uses frontend mock data; verify that this is intentional before wiring it to
the backend. The website must not implement order state transitions or payment
calculations; those remain backend responsibilities.

## 5. Release checks

Before opening a PR, run the backend commands in section 2, manually complete
the smoke flow, and confirm that no client or server logs contain secrets.
Document any blocked client test as a repository gap rather than marking it
passed.

## 6. Opening the app on other devices (phone, another laptop)

Both dev servers already listen on all interfaces (`runserver 0.0.0.0:8000`,
Vite `host: true`). If another device on the same Wi-Fi cannot connect, walk
this list in order:

1. **Use the real LAN IP, not the virtual one.** Windows machines often have
   WSL/Hyper-V adapters with `172.x.x.x` addresses — phones cannot reach those.
   `start-web.ps1` prints the correct `192.168.x.x` / `10.x.x.x` URL; use that
   one. To check by hand: `Get-NetIPAddress -AddressFamily IPv4`.
2. **Django DisallowedHost.** Fixed: with `DJANGO_DEBUG=true` the backend now
   accepts any host (`ALLOWED_HOSTS = "*"`). With DEBUG off the host list must
   be set explicitly — that is intentional and must stay.
3. **Windows Defender Firewall.** The first time node/python opened a port,
   Windows showed an "Allow access" prompt. If it was dismissed, add rules
   once in an elevated PowerShell:
   ```powershell
   New-NetFirewallRule -DisplayName "NeedIt Vite 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   New-NetFirewallRule -DisplayName "NeedIt Django 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
   ```
4. **Same network.** Phone and laptop must be on the same Wi-Fi, and the
   network must not have client isolation (common on campus/hostel Wi-Fi —
   if devices cannot ping each other, that is the cause; use your own hotspot
   for testing).
5. **Direct API testing** from another device: `http://<LAN-IP>:8000/api/...`
   works the same way; the Vite proxy is only needed for the web UI.
