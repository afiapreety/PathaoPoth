# PathaoPoth

A delivery exception desk built from the supplied `06-PathaoPoth.pdf` requirements.

Frontend: React 18 + Vite + TypeScript, with a real hosted Blocks IAM login and a project-scoped profile page. Every Blocks API call goes through [`@seliseblocks/client`](https://www.npmjs.com/package/@seliseblocks/client) via a single `createBlocksClient()` instance in `src/lib/blocks/client.ts` — there is no hand-written `fetch()` wrapper for Blocks endpoints anywhere in this app. Each SDK module is exercised in context rather than in one dedicated demo panel: `auth` in the hosted login flow, `iam` on the Profile page and user menu, and `localization` in `LocalizationProvider`. Add more pages under `src/features/` as your app needs them.

## Run locally

Use Node.js 24 or newer (the API uses Node's built-in SQLite support).

```sh
npm install
npm run server
```

In another terminal:

```sh
npm run dev
```

`.env` already has working defaults for this project — you only need to fill in `VITE_BLOCKS_OIDC_CLIENT_ID` (see below) before login will work.

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

## Login setup (required)

This app signs users in directly against this project's tenant (no CLI-style account impersonation) through Blocks IAM's hosted IdP controller. Before login will work, register a **public** OIDC client for this app in Blocks IAM with:

- `redirect_uris`: EVERY origin the app is served from, each with `/login/callback` -- your dev origin, and each deployed URL. `blocks release setup` assigns a random-suffixed domain (find it via `blocks release repos list --json`, the `url` field), and until that origin's callback is registered the first login there fails with `redirect_uri_not_registered`; `blocks release deploy --register-callback` registers it for you.
- `client_type`: `public` (no client secret — this is a browser app and cannot keep one; this scaffold never asks for or ships a client secret).
- `tenant_id` used for login: this project's tenant (`VITE_BLOCKS_X_BLOCKS_KEY`).

Then set `VITE_BLOCKS_OIDC_CLIENT_ID` in `.env` to the new client's id. Until then, the login page shows a setup notice instead of failing silently.

## Testing login locally over HTTPS on the real project domain

Blocks SSO sets a **Secure, domain-scoped** session-related cookie as part of the OIDC exchange; browsers refuse to store or send that on plain `http://localhost`. To test the real login flow locally, run the dev server on the project's actual domain over HTTPS instead of `localhost`:

1. Find the app's registered Blocks domain in the Blocks OS project settings, or ask whoever created the project. It must match the OIDC redirect URI's host.
2. Point it at your machine — add to your hosts file (`/etc/hosts`, or `C:\Windows\System32\drivers\etc\hosts` as Administrator): `127.0.0.1  <domain>`.
3. Confirm `.env` has `VITE_BLOCKS_DEV_HOST=<domain>` (generated from `--app-domain`) and `VITE_BLOCKS_DEV_PORT=5173`.
4. Generate a local HTTPS cert for that exact domain: `npm run cert`. Trust it in your OS store to remove the browser warning (command printed by the script), then restart the browser.
5. `npm run dev` -> open `https://<domain>:<port>` (not `localhost`).
6. Register that exact origin's `/login/callback` as a redirect URI on the OIDC client — byte-for-byte, including the port.

`.cert/` is gitignored — each developer generates and trusts their own cert.

## Blocks Release deployment

The repo includes `Dockerfile` and `nginx.conf` for Blocks Release. The Release service must pass Docker build arg `ci_build=<environment>` plus the public `VITE_BLOCKS_*` build args documented in the Dockerfile. `package.json` also provides `build:dev`, `build:test`, `build:stg`, `build:iat`, `build:uat`, `build:preprod`, `build:prodshadow`, and `build:prod` scripts for local checks.

During each environment build, `scripts/write-release-env.mjs` writes `dist/env.<environment>` from client-safe Docker build args or local `.env` files. Root `.env` remains gitignored and must not be committed.

## What's included

- `/login` — login page (redirects to Blocks IAM).
- `/login/callback` — completes the hosted IAM callback via `blocksClient.auth.idp.callback()`, then returns to the page you started from.
- `/` and `/profile` — protected; redirect to `/login` when signed out.
- Sidebar + topbar shell matching the `@seliseblocks/blocks-kit` look (icon-only rail on narrow screens, avatar dropdown, notifications menu, active-item accent bar).
- `blocks/localization/*.en.json` local i18n seed files for AI or human edits. Sync them through `blocks localization validate` and `blocks localization push`; the runtime app reads Localization service data through `blocksClient.localization`.

IAM's hosted login sets the session as a **Secure, httpOnly** cookie by default -- this app never reads, stores, or refreshes a token itself. "Signed in" is determined by calling `blocksClient.auth.userInfo()` (`GET /iam/v4/auth/me`), which the browser's cookie authenticates automatically; this is different from `blocksClient.iam.me()`, the full IAM profile call used on the Profile page. Logging out calls `blocksClient.auth.logout()` so IAM ends the session server-side. A cached bearer token (and `blocksClient.auth.oidc.refreshToken()` to refresh it) is only used if a tenant's OIDC config explicitly returns tokens in the response body instead of a cookie.

## Implementation

- React/Vite frontend with responsive case table, case drawer, four-field intake, note review, handoffs, resolution, CSV export, sender timeline, and network intelligence.
- Blocks-hosted OIDC login with a public PKCE client. The API verifies the live Blocks identity and profile on every request, checks the tenant, then derives its role and scope on the server.
- SQLite persistence in `.data/pathaopoth.sqlite`. This is **local application storage**, not Blocks Data Gateway storage. Neither the database nor credentials are committed.
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

To enable the server-side connector, copy `.env.server.example` to the ignored `.env.server` and configure a trusted chat-completions-compatible `AI_ENDPOINT`, `AI_MODEL`, and, if required, `AI_API_KEY`. Restart the API. Never put the key in a `VITE_` variable. Rider notes are sent to that configured endpoint only when a staff member requests analysis; choose a provider suitable for that data.

Model output is checked for structure, confidence bounds, and verbatim supporting evidence. Failure or unverifiable output falls back to explicitly labeled manual review. No recommendation executes a handoff or resolution automatically. Route prediction currently uses the statistical estimator, not language-model inference.

## Checks

```sh
npm run lint
npm run test
npm run build
```

The unit tests cover continuous ownership, acknowledgement restrictions, sender redaction, role scoping, manual review, rate denominators, and route decisions. The original domain tests are also runnable with `node --test domain/cases.test.mjs` from the repository root.

With both local servers running, `npm run test:e2e` executes the browser walkthrough using Chrome. Supply the demo password in the process environment as `PATHAO_TEST_PASSWORD`; the test never writes it to disk. Screenshots go to the ignored `artifacts/` directory. The test creates and resolves a sample case in the isolated demo workspace, records both acknowledgements, verifies persistence after reload, inspects sender API redaction, checks analytics and the pre-call decision, and checks the mobile layout.

## Deployment status

Deployed via SELISE Blocks Release from this repository's root (`Dockerfile`, `package.json`, and friends live at the repo root, not in a subdirectory) on the `prod` branch, matching the project's `prod` environment. A production installation needs the Node API behind HTTPS and a persistent volume for SQLite; a static-only frontend deployment cannot provide the case API.

The source routing/skill install is described in [BOOTSTRAP-REPORT.md](BOOTSTRAP-REPORT.md). Nothing has been committed or pushed.
