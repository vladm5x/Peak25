# Peak 25 Challenge

A clean four-person iPhone challenge tracker for Vlad, Simon, Ali, and Loren, built with Expo and React Native.

## Run it on an iPhone

1. Install **Expo Go** from the App Store.
2. On the development computer, run:

```bash
npm install
npm start
```

On Windows PowerShell, if `npm` is blocked by the local execution policy, use:

```powershell
npm.cmd install
npm.cmd start
```

If the iPhone cannot be on the same Wi-Fi as the computer, use Expo tunnel mode:

```powershell
npm.cmd run start:tunnel
```

If Expo says port 8081 is already in use, close any older Expo terminal windows. You can also find and stop the stale process:

```powershell
netstat -ano | findstr :8081
Stop-Process -Id <PID> -Force
```

If tunnel mode fails with `Cannot read properties of undefined (reading 'body')` or `remote gone away`, Expo's shared ngrok tunnel is unavailable from your machine/network. Use the deployed website link for immediate phone access, or deploy a real TestFlight/iOS build instead of relying on Expo Go.

3. Scan the displayed QR code with the iPhone camera.

For a browser preview, run `npm run web`.

## Run with shared device sync

### Supabase cloud sync

For tracking across phones and computers from anywhere, use a free Supabase project.

1. Create a free Supabase project.
2. Open the Supabase SQL Editor and run `supabase/peak25_schema.sql`.
3. Add your project values to `.env`:

```powershell
EXPO_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-public-anon-or-publishable-key"
```

Use the public anon/publishable key only. Do not put a Supabase service-role key in the app.

For GitHub Pages, add these as repository variables before deploying:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Local computer sync fallback

Open two terminals on the development computer:

```powershell
npm.cmd run sync
npm.cmd run web
```

The website runs on `http://localhost:8081` and the sync API runs on `http://localhost:8787`.
Devices on the same Wi-Fi should open the computer's LAN address instead, for example `http://192.168.1.98:8081`.
The app automatically talks to the same host on port `8787`, so activity and exclusion records are stored in `data/shared-sync-state.json` and shared across devices while the sync server is running.

If Supabase variables are present, the app uses Supabase instead of this local fallback.

For Expo Go/native testing, set `EXPO_PUBLIC_SYNC_URL` to the computer's LAN sync URL before starting Expo:

```powershell
$env:EXPO_PUBLIC_SYNC_URL="http://192.168.1.98:8787"
npm.cmd run web
```

## Check the app

```bash
npm run typecheck
npm test
```

## Refresh previous activity data

The app seeds previous-day activities from the Google Sheet's `Aktivitetslogg` tab.

```powershell
npm.cmd run import:sheet
npm.cmd run build:web
```

## Implemented

- Four participant profiles
- Activity logging with contract-aware validation
- Gym, leg day, running, StairMaster, cycling, swimming, walking golf, and other sports
- Strict one-counted-activity-per-day behavior
- Friction-light activity logging without a proof requirement
- Sickness/injury exclusions
- 6/7 eligible-day calculation over the complete challenge period
- Weekly leg-day tracking
- Live group progress screen
- Compact rules reference based on the signed contract
- Google Sheet import for previous activity days
- Offline storage on the device
- Supabase cloud sync support
- Haptic feedback on iPhone

## Contract model

- Period: 1 September through 20 December 2026, inclusive
- 111 total challenge days
- 96 required activity days before exclusions
- 16 calendar weeks with a leg-day requirement
- 1,000 SEK paid by each failed participant and divided among successful participants

## Next development milestone

Supabase sync is wired without accounts so the shared website can stay simple. A stricter production setup would add:

- Apple/email sign-in
- One account mapped to each participant
- Group approval for medical exclusions
- Audit history so records cannot be silently changed

Core rules and calculations live in `src/data.ts`, separate from the interface, so backend sync and Excel import can be added without rebuilding the screens.
