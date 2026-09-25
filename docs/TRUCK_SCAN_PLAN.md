# Truck Scan — plan

Photograph the truck, type the VIN and engine serial, get the specs, get a ranked list of fuel changes with break-even. Feeds the Fuel calculator. Starts inside Driveline as an installable web app. Moves toward an app-store build later without a rewrite.

Decisions already made:

- Build it inside Driveline first. Go native later.
- Photos do two jobs: identify fuel-relevant equipment, and stay on file with the truck.
- No OEM engine-serial API. An AI model fills gaps. Every filled value is labeled as an estimate.
- New tool. Reuses `src/lib/fuel/math.ts` and `src/lib/fuel/presets.ts`. Does not fork the math.

---

## 1. What the driver does

1. Opens `/scan`. No login.
2. Takes four photos: front three-quarter, driver side, rear of tractor with trailer gap, one tire. Optional: door-jamb sticker, dash.
3. Types the VIN. Types the engine serial if they have it.
4. Sees the spec sheet. Each line says where it came from: VIN, photo, typed, or estimate. Fixes anything wrong with one tap.
5. Sees the equipment list: skirts, tail, gap fairing, roof fairing, chassis fairings, tire type, APU or generator. Each is yes / no / unsure. Photos pre-fill it. Driver confirms.
6. Types MPG, miles per year, and cruise speed. Garage truck fills these if there is one.
7. Gets the list: each change, MPG gain, cost, dollars per year, months to break even. Sorted by break-even.
8. Taps a row. It opens in place with the full numbers: MPG, ¢/mile, gallons, dollars at three diesel prices, cost, and net after 1, 3, and 5 years.

First answer works with VIN plus typed MPG and miles. Photos and engine serial are optional. This keeps rule 6 of the launch plan: no garage, no login, still an answer.

---

## 2. What each input gives us

### VIN (free, reliable)

NHTSA vPIC. Server-side fetch, no key, no rate limit we have hit. Checked on a real 2018 Cascadia VIN. Returns:

| Field | Example | Use |
| --- | --- | --- |
| ModelYear, Make, Model | 2018 Freightliner Cascadia | Spec sheet header, aero baseline |
| EngineModel, DisplacementL | Detroit Diesel DD15, 14.8 L | Engine family, idle GPH default |
| DriveType | 6x4 | 6x2 conversion is or is not on the table |
| Trim / BodyCabType | 126" sleeper, conventional | Roof height guess, sleeper vs day cab |
| GVWR, BodyClass | Class 8, truck-tractor | Reject non-Class 8 early |

Does not return: horsepower rating, transmission, axle ratio, tire size. Those come from photos, the driver, or the estimate step.

vPIC sometimes flags "model year may be incorrect." Show the year and let the driver correct it.

### Engine serial (no public API)

Cummins QuickServe, Detroit DDEC, and PACCAR portals need an account and have no API we can call. The serial still earns its place:

- Stored with the truck. The driver has it in one place for the shop and the buyer.
- Sent to the estimate step with the VIN. The model can often place build date and rating family from the serial format. Labeled estimate.
- Linked out. One button per OEM opens their lookup page in a new tab. Same pattern as TruckPaper in Hunt: link, do not scrape.

### Photos (AI vision)

xAI `grok-4.6` accepts JPEG or PNG image input. Same account and key as Smart parse (`XAI_API_KEY`). Request shape:

```json
{ "role": "user", "content": [
  { "type": "input_image", "image_url": "data:image/jpeg;base64,..." },
  { "type": "input_text", "text": "..." }
] }
```

The prompt asks for one JSON object, `true` / `false` / `null` per equipment item, plus tire profile, roof height, and mirror type. Same JSON-only, null-when-unsure pattern as `src/lib/truck-value/parse-report-fn.ts`.

Client resizes each photo to 1280 px long edge, JPEG quality 0.8, before upload. About 200 to 350 KB each. Four photos in one request.

Rate limit: new `allowScanVision()` in `src/lib/ai-guard.server.ts`. Lower caps than Smart parse because images cost more: anon 3 per hour, 8 per day; signed-in 6 per hour, 20 per day. When the key is missing or the cap is hit, the equipment list is still there. The driver taps it by hand.

### Typed

MPG, miles per year, cruise speed, diesel price. Same inputs as Fuel. Garage truck fills them when present.

---

## 3. Recommendations

No new math. Every row is a Fuel intervention run through the existing functions:

| Finding | Row in `presets.ts` | Function |
| --- | --- | --- |
| No trailer skirts | `skirts` | `fuelMath` |
| No trailer tail | `tail` | `fuelMath` |
| Open tractor-trailer gap | `gap` | `fuelMath` |
| No tractor aero set | `aero` | `fuelMath` |
| Cruise above 65 | `speed` | `speedMath` |
| No APU, or ICE generator | idle plan | `idleMath` |
| Lug tires on a highway truck | new row: low rolling resistance tires | `fuelMath` |

Rules the list follows:

- Equipment already on the truck does not appear. Skirts confirmed means no skirts row.
- Owned trailer vs pulled trailer is one question. Trailer rows hide when the driver does not own the trailer.
- Day cab hides the idle row.
- Sort by months to break even. Zero-cost rows (speed) go first.
- Each row shows: MPG now, MPG after, gallons saved, dollars per year, cost, break-even. Same labels as Fuel.
- One line under the list: planning numbers, from the same table as the Fuel calculator. Not a quote.

A new preset row for tires needs a planning number and a note. Add it to `INTERVENTIONS` so Fuel gets it too.

---

## 4. Storage

Same rule as the rest of Driveline: numbers stay on the device unless the driver signs in and saves.

**Local (phase 1):** one `scan` record in the desk store: VIN, serial, decoded specs, equipment answers, photo list. Photos as blobs in IndexedDB, keyed by scan id. Not localStorage. Four photos at 300 KB each fit; twenty scans do too.

**Cloud (later):** `user_desk` needs `'scan'` added to `user_desk_tool_check` in a new `0003_scan.sql`. The JSON payload syncs like garage does (`mergeGarage` pattern in `src/lib/desk/payload.ts`). Photos do not go in Postgres. They need object storage (Vercel Blob or S3) and a signed-URL path. That is its own step. Until then, cloud save holds the answers and not the pictures.

---

## 5. Files

Standalone app. Vite, React, TypeScript. Static site on Render. No server. Does not import Driveline.

Phase 1 (built):

- `src/lib/fuel.ts`: `fuelMath`, `speedMath`, and payback copied from Driveline `src/lib/fuel/math.ts`. Same numbers as the Fuel calculator. Copy again if Driveline's math changes.
- `src/lib/interventions.ts`: planning table. Aero rows copied from Driveline `src/lib/fuel/presets.ts`. Tire row 0.3 MPG, $3,500 per section 8. Idle burn rates 0.8, 0.2, and 0 gal/hr.
- `src/lib/vin.ts`: VIN cleanup, check digit, NHTSA vPIC call from the browser, field mapping. vPIC sends `Access-Control-Allow-Origin: *`, so no server is needed.
- `src/lib/recommend.ts`: pure function. Equipment, cab, and numbers in. Sorted rows out.
- `src/lib/storage.ts`: current scan and saved trucks in `localStorage`.
- `src/components/`: one component per page section.
- Tests next to the code: `vin.test.ts` against a real NHTSA response, `recommend.test.ts` for every rule in section 3.

Later phases add `src/lib/photos.ts` (IndexedDB), a vision call, and an estimate call. Those need a server for the API key. Plan: one small serverless function, not a full backend.

---

## 6. Phases

Each phase ships on its own. Do not start the next until the current one passes section 2 of `LAUNCH_PLAN.md` on a phone.

**Phase 1 — VIN and checklist. No AI, no photos.**
VIN decode, spec sheet, tap-to-answer equipment list, typed MPG and miles, ranked list with full numbers per row. Everything on device. This is most of the value and has no per-call cost. Built 2026-09-25.

Phase 1 rules that are not in section 3:

- The tractor aero kit includes extenders. When chassis fairings are missing, the kit row shows and the gap row does not.
- Roof fairing is not asked. The planning table has no row for it yet.
- Idle rows show gallons and dollars saved. Payback waits until the driver types a quote. The table has no planning cost for an APU.
- A truck with a diesel APU gets one row: battery APU instead of the diesel APU.
- An answer of "Not sure" keeps the row and tags it "Not checked yet." Trailer rows are tagged "Only if you own the trailer" until that question is answered.

**Phase 2 — Photos.**
Capture, resize, store on device, show in the record. Send to vision to pre-fill the checklist. Driver confirms before anything is recommended. Rate limited. Works without the key.

**Phase 3 — Engine serial and estimate.**
Serial field, OEM links, estimate step for horsepower, transmission, ratio. Estimate lines carry the label and a "fix" tap. Cloud save for the answers.

**Phase 4 — App store.**
Wrap the same code with Capacitor. One codebase, real App Store and Play listings, native camera plugin, share sheet, file storage. Expo or Swift only if Capacitor cannot do something we need. It can do this list.

---

## 7. Rollout

Truck Scan is a Fuel feeder. It goes out free and public, right after Fuel is done, and before Load Profit. Reason: "scan your truck, see what the changes are worth" is a share and search hook Fuel alone does not have. Home page lists it under Fuel.

Photos and the estimate step cost money per call. The caps in section 2 hold that. If the tool gets traffic, the paid version of the caps is: members get more scans, not different math.

---

## 8. Decisions on the open questions

Answered by Kevin, 2026-09-15.

- **Owned vs pulled trailer:** ask once per scan. One yes/no on the scan page. No garage truck needed.
- **Tire row:** low rolling resistance tires, 0.3 MPG gain, $3,500 planning cost, full set of 18 over lug tread. Note: SmartWay-verified tires. Your quote will differ.
- **Estimate step:** runs only on a tap. A "Fill the gaps" button. Never automatic.
- **Photo retention:** keep on the device until the driver deletes them. Add a clear-photos button on the scan record.
