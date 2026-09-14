# PathaoPoth

A delivery exception desk built from the supplied `06-PathaoPoth.pdf` requirements. The application lives in `app/`.

## Run locally

Use Node.js 24 or newer (the API uses Node's built-in SQLite support).

```sh
cd app
npm install
npm run server
```

In another terminal:

```sh
cd app
npm run dev
```

Open **https://pbngdj-elhjx.slsblx.com:5173** and use **Sign in with Blocks**. The demo address is `demouser140826@yopmail.com`; its password is deliberately not stored in this repository.

The current machine has the domain mapped to `127.0.0.1`, a generated development certificate, and that certificate trusted in the user's login keychain. Another machine needs `npm run cert`, its own hosts entry, and local certificate trust. Both `https://pbngdj-elhjx.slsblx.com/login/callback` and the `:5173` callback are registered with Blocks.

## Demo walkthrough

1. Sign in and use the **Nabila · Mirpur hub** demo persona. Open a refused-delivery exception for `PP-826500`: the manifest supplies COD ৳2,300. If that parcel already has an open test case, open the existing case instead.
2. Add the rider's rough Banglish note. Save it, then select **Structure incident**. Review attempts, address quality, availability, evidence, and the recommended evening window.
3. Request a handoff to **Ayesha · Care**. Nabila remains the owner. Switch to Ayesha, open the case, and **Accept ownership**.
4. Review the evidence, confirm the next step, and request a handoff to **Rafi · Destination hub**. Ayesha remains the owner until Rafi accepts.
5. Switch to Rafi, acknowledge, and resolve with a recorded outcome. The complete ownership trail remains available.
6. Switch to **Nova Fashion · Sender** to see only sender-safe public updates.
7. Switch to **Farhan · Ops manager**, open **Route intelligence**, inspect hub/route/rider comparisons, and create the pre-call plan.

The six personas are available only to the specific demo account with its verified `pathao-demo` role. They act on an isolated sample workspace. Ordinary accounts cannot switch personas or access that workspace.

## Implementation

- React/Vite frontend with responsive case table, case drawer, four-field intake, note review, handoffs, resolution, CSV export, sender timeline, and network intelligence.
- Blocks-hosted OIDC login with a public PKCE client. The API verifies the live Blocks identity and profile on every request, checks the tenant, then derives its role and scope on the server.
- SQLite persistence in `app/.data/pathaopoth.sqlite`. This is **local application storage**, not Blocks Data Gateway storage. Neither the database nor credentials are committed.
- Optimistic workspace versions prevent a stale or concurrent update from overwriting a handoff. One named owner remains accountable until an explicit acknowledgement changes ownership.
- Sender responses are constructed from an allowlist; internal notes, receiver contact information, analyses, and ownership records never enter sender responses.
- SLA states are recomputed from timestamps on each read, with 48-hour warning and 72-hour breach thresholds. Resolved cases stop aging. The UI refreshes every 30 seconds.
- Route rates use parcel-volume denominators. Forecasts use a documented statistical trend and an indicative interval; they are not calibrated probabilities of future route failure. Sample measurements are labeled.
- Live operations can import parcel manifests and current/previous weekly route measurements from the operations screen. These imports are server-validated. Parcel imports do not overwrite existing parcels; route imports replace the measurement snapshot. Staff directory entries are registered after each user's first successful sign-in.

## Application roles

| Blocks role | Server scope |
|---|---|
| `pathao-hub-mirpur` | Mirpur cases, owned cases, and handoffs addressed to this user |
| `pathao-hub-chattogram` | Chattogram cases, owned cases, and handoffs addressed to this user |
| `pathao-rider` | Parcels assigned to the authenticated rider ID |
| `pathao-care` | Cross-team cases and confirmation of reviewed next steps |
| `pathao-ops` | Cross-team view, route analytics, pre-call decisions, and data import |
| `pathao-sender` | Sender-safe updates for parcels whose sender ID matches the authenticated user |
| `pathao-demo` | Isolated sample workspace for the specifically provisioned demo user |

These roles do not grant broad Blocks platform administration. Real staff accounts must be assigned the appropriate role; sender/rider IDs in imported manifests must match their Blocks user IDs.

## Language-model integration

Live model inference is **not configured yet**. Without a model, the app explicitly labels note processing **Rules-assisted extraction** and requires manual review. It does not represent the fallback as a live AI result.

To enable the server-side connector, copy `app/.env.server.example` to the ignored `app/.env.server` and configure a trusted chat-completions-compatible `AI_ENDPOINT`, `AI_MODEL`, and, if required, `AI_API_KEY`. Restart the API. Never put the key in a `VITE_` variable. Rider notes are sent to that configured endpoint only when a staff member requests analysis; choose a provider suitable for that data.

Model output is checked for structure, confidence bounds, and verbatim supporting evidence. Failure or unverifiable output falls back to explicitly labeled manual review. No recommendation executes a handoff or resolution automatically. Route prediction currently uses the statistical estimator, not language-model inference.

## Checks

```sh
cd app
npm run lint
npm run test
npm run build
```

The unit tests cover continuous ownership, acknowledgement restrictions, sender redaction, role scoping, manual review, rate denominators, and route decisions. The original domain tests are also runnable with `node --test domain/cases.test.mjs` from the repository root.

With both local servers running, `npm run test:e2e` executes the browser walkthrough using Chrome. Supply the demo password in the process environment as `PATHAO_TEST_PASSWORD`; the test never writes it to disk. Screenshots go to the ignored `app/artifacts/` directory. The test creates and resolves a sample case in the isolated demo workspace, records both acknowledgements, verifies persistence after reload, inspects sender API redaction, checks analytics and the pre-call decision, and checks the mobile layout.

## Deployment status

This app is running locally. It has **not been deployed** to the linked Blocks release repository. A production installation needs the Node API behind HTTPS and a persistent volume for SQLite; a static-only frontend deployment cannot provide the case API. The local hosts mapping means this machine resolves the app's hostname to the local development server.

The source routing/skill install is described in [BOOTSTRAP-REPORT.md](BOOTSTRAP-REPORT.md). Nothing has been committed or pushed.
