# Truck Scan

Look up a Class 8 by VIN, tap what is on it, and see what each fuel change is worth and how fast it pays back.

Standalone build for side-by-side comparison with another build of the same plan. Does not import Let's Truck Driveline. The fuel math is copied from Driveline so the numbers match.

Live: https://truck-scan.onrender.com (auto-deploys from `main`).

Plan and status: `docs/TRUCK_SCAN_PLAN.md`. Phase 1 is built.

## Run locally

```bash
npm install
npm run dev
```

App listens on `0.0.0.0:8080`.

```bash
npm test
npm run typecheck
npm run build
```

## Data

The VIN goes to NHTSA vPIC from the browser. Everything else stays in the browser's local storage. No accounts, no server, no API keys.
