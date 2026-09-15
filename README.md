# Truck Scan

Photograph a Class 8, type the VIN and engine serial, get the specs, get a ranked list of fuel changes with break-even.

Standalone build. Does not import Let's Truck Driveline. Built for side-by-side comparison with another implementation of the same plan.

Plan: `docs/TRUCK_SCAN_PLAN.md`. Section 5 (file layout) in that doc still describes the Driveline layout and will be rewritten when phase 1 starts.

## Run locally

```bash
npm install
npm run dev
```

App listens on `0.0.0.0:8080`.

## Deploy

Vercel: import this repo. Framework preset Vite. No env vars needed for the empty page.
