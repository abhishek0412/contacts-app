# Contact Manager — STRIDE Threat Model

## 1. System Overview

| Component  | Technology                              | Port | Description                                              |
| ---------- | --------------------------------------- | ---- | -------------------------------------------------------- |
| Frontend   | React (CRA) + Redux Toolkit / RTK Query | 3000 | SPA serving the UI, client-side routing, form validation |
| API Server | Express + express-rate-limit             | 3001 | RESTful CRUD endpoints (`/contacts`) with rate limiting  |
| Data Store | db.json                                 | —    | Flat JSON file on disk                                   |
| Transport  | HTTP (no TLS)                           | —    | Unencrypted communication between frontend and API       |

### Data Flow Diagram

```
 ┌──────────────────────────┐
 │  Browser (User Agent)    │
 │  React App + Redux Store │
 └────────┬─────────────────┘
          │ HTTP (plaintext)
          │ GET  /contacts
          │ POST /contacts        { name, phone }
          │ DELETE /contacts/:id
          ▼
 ┌──────────────────────────────────────┐
 │  Express Server (port 3001)          │
 │  No auth · Rate limited              │
 │  Server-side validation · CORS       │
 │  Field whitelisting · 10KB body cap  │
 └────────┬─────────────────────────────┘
          │ fs read/write
          ▼
 ┌──────────────────────────┐
 │  db.json                 │
 │  PII: names, phones      │
 └──────────────────────────┘
```

### Trust Boundaries

| #    | Boundary                 | Description                                          |
| ---- | ------------------------ | ---------------------------------------------------- |
| TB-1 | Browser ↔ API Server     | Network boundary; no authentication or authorization |
| TB-2 | API Server ↔ File System | json-server reads/writes db.json with full fs access |
| TB-3 | User ↔ Browser           | User-supplied input enters the system via forms      |

---

## 2. Assets

| ID  | Asset                         | Sensitivity           | Location                      |
| --- | ----------------------------- | --------------------- | ----------------------------- |
| A-1 | Contact records (name, phone) | PII — moderate        | db.json, RTK Query cache, DOM |
| A-2 | db.json file                  | Data integrity        | Server file system            |
| A-3 | API server availability       | Business continuity   | localhost:3001                |
| A-4 | Frontend application code     | Intellectual property | localhost:3000 (public)       |
| A-5 | Redux store / browser state   | PII in memory         | Browser memory                |

---

## 3. STRIDE Threat Analysis

### S — Spoofing (Identity)

| ID  | Threat                     | Description                                                                                                                                                        | Affected Component | Risk         |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------ |
| S-1 | **No authentication**      | The API has zero authentication. Any client on the network can call `GET /POST /DELETE /contacts` and impersonate a legitimate user.                               | API Server (TB-1)  | **Critical** |
| S-2 | **No CSRF protection**     | No CSRF tokens are used. However, CORS now restricts origins to `http://localhost:3000`. Cross-origin requests from other pages are blocked by the browser's preflight check. Residual risk: same-origin attacks, non-browser clients. | Frontend → API     | ~~High~~ → **Medium** |
| S-3 | **No session or identity** | There is no concept of user identity. All operations are anonymous, so one user's actions are indistinguishable from another's.                                    | Entire system      | **High**     |

#### Mitigations

| Threat | Recommended Mitigation                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------ |
| S-1    | Add authentication (JWT, OAuth 2.0, or API keys) to all API endpoints.                                 |
| S-2    | ✅ Partially mitigated — strict CORS (`Access-Control-Allow-Origin: http://localhost:3000`) implemented. Add CSRF tokens for full protection. |
| S-3    | Introduce user accounts with session management; associate contacts with user IDs.                     |

---

### T — Tampering (Data Integrity)

| ID  | Threat                                 | Description                                                                                                                                                                             | Affected Component | Risk         |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------ |
| T-1 | **Unrestricted DELETE**                | Any network client can delete any contact by ID (`DELETE /contacts/:id`) without authorization. Mass deletion is trivial.                                                               | API Server         | **Critical** |
| T-2 | ~~**Unrestricted POST (data injection)**~~ | ✅ **MITIGATED.** Server now whitelists only `name` and `phone` fields. Arbitrary fields like `isAdmin` or `__proto__` are ignored.                                                    | API Server         | ~~High~~ → **Resolved** |
| T-3 | ~~**No server-side validation**~~          | ✅ **MITIGATED.** Express server validates that `name` and `phone` are present; returns 400 if missing. Body size capped at 10KB via `express.json({ limit: "10kb" })`.              | API Server         | ~~High~~ → **Resolved** |
| T-4 | **db.json direct modification**        | The data file has no integrity protection (checksums, file permissions). Any process with fs access can alter it.                                                                       | File System (TB-2) | **Medium**   |
| T-5 | **Man-in-the-middle (HTTP)**           | Traffic between browser and API is unencrypted. An attacker on the same network can intercept and modify requests/responses in transit.                                                 | Network (TB-1)     | **High**     |
| T-6 | ~~**Prototype pollution**~~            | ✅ **MITIGATED.** Server destructures only `{ name, phone }` from request body. `__proto__`, `constructor`, and other keys are never persisted.                                         | API Server         | ~~Medium~~ → **Resolved** |

#### Mitigations

| Threat   | Recommended Mitigation                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------- |
| T-1      | Add authorization; validate that the requester owns the resource before allowing mutations.                            |
| T-2      | ✅ Resolved — field whitelisting implemented in Express server.                                                        |
| T-3      | ✅ Resolved — server-side validation implemented; rejects empty `name`/`phone`. 10KB body limit enforced.             |
| T-4      | Use a proper database (SQLite, PostgreSQL). Set restrictive file permissions on db.json.                              |
| T-5      | Enforce HTTPS with TLS certificates (even in development, use `mkcert`).                                              |
| T-6      | ✅ Resolved — only `name` and `phone` are destructured; all other keys are discarded.                                 |

---

### R — Repudiation (Audit Trail)

| ID  | Threat                             | Description                                                                                                                                            | Affected Component | Risk       |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ---------- |
| R-1 | **No audit logging**               | No server-side logs record who performed what action and when. Deletions and additions are untraceable.                                                | API Server         | **High**   |
| R-2 | **No timestamps on records**       | Contact records have no `createdAt` / `updatedAt` fields. There's no way to determine when data was modified.                                          | db.json            | **Medium** |
| R-3 | **Client-side notifications only** | The notification system (`notificationSlice`) fires toasts in the browser but nothing is logged server-side. A user can deny having deleted a contact. | Frontend           | **Medium** |

#### Mitigations

| Threat | Recommended Mitigation                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| R-1    | Add structured server-side logging (Winston, Pino) with request metadata (IP, timestamp, method, path, body). |
| R-2    | Add `createdAt` and `updatedAt` timestamps to all records (json-server middleware or real backend).           |
| R-3    | Persist an append-only audit log on the server for all write operations.                                      |

---

### I — Information Disclosure (Confidentiality)

| ID  | Threat                          | Description                                                                                                                                            | Affected Component | Risk         |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------ |
| I-1 | **Full contact list exposed**   | `GET /contacts` returns all 100 contacts to any requester with no access control. PII (names, phone numbers) is freely accessible.                     | API Server (TB-1)  | **Critical** |
| I-2 | **HTTP plaintext transmission** | Contact data (PII) travels over unencrypted HTTP. Susceptible to network sniffing.                                                                     | Network            | **High**     |
| I-3 | **PII in browser state**        | All contacts are cached in the Redux store (RTK Query cache) and accessible via browser DevTools.                                                      | Frontend (Browser) | **Medium**   |
| I-4 | **Verbose error messages**      | React ErrorBoundary and json-server may expose stack traces or internal paths in error responses.                                                      | Frontend, API      | **Low**      |
| I-5 | **Source maps in production**   | CRA includes source maps in production builds by default, exposing full frontend source code.                                                          | Frontend build     | **Medium**   |
| I-6 | **CDN dependency leaks**        | Semantic UI CSS is loaded from `cdnjs.cloudflare.com` (unused). The CDN can track user IPs and the external request exposes browsing to third parties. | index.html         | **Low**      |

#### Mitigations

| Threat | Recommended Mitigation                                                              |
| ------ | ----------------------------------------------------------------------------------- |
| I-1    | Add authentication + authorization. Scope data access per user.                     |
| I-2    | Enforce HTTPS everywhere.                                                           |
| I-3    | Limit cache lifetime. Clear sensitive data on logout. Don't store more than needed. |
| I-4    | Use generic error messages in production. Disable stack traces.                     |
| I-5    | Set `GENERATE_SOURCEMAP=false` in production builds.                                |
| I-6    | Remove the unused Semantic UI CDN link from `index.html`.                           |

---

### D — Denial of Service (Availability)

| ID  | Threat                                | Description                                                                                                                                                     | Affected Component | Risk         |
| --- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------ |
| D-1 | ~~**No rate limiting**~~              | ✅ **MITIGATED.** Global: 100 req/15min per IP. Write ops (POST/DELETE): 10 req/min per IP. Returns `429` with `Retry-After` header when exceeded.              | API Server         | ~~Critical~~ → **Resolved** |
| D-2 | **db.json exhaustion**                | **REDUCED.** Rate limiting slows flooding (max 10 POSTs/min), but sustained attack can still grow db.json over time. No storage quota enforced.                  | File System        | ~~High~~ → **Medium** |
| D-3 | **Single-threaded server**            | Express runs on a single Node.js thread. CPU-intensive or concurrent requests can block the event loop.                                                         | API Server         | **Medium**   |
| D-4 | ~~**No payload size limit**~~         | ✅ **MITIGATED.** `express.json({ limit: "10kb" })` rejects bodies larger than 10KB with `413 Payload Too Large`.                                              | API Server         | ~~High~~ → **Resolved** |
| D-5 | **Mass deletion**                     | Without auth, an attacker can script `DELETE /contacts/:id` for every known ID and wipe the entire contact list.                                                | API Server         | **Critical** |
| D-6 | **Frontend crash via malformed data** | If db.json is corrupted (e.g., injected HTML/script in names), React could error during rendering. The ErrorBoundary catches this but the app becomes unusable. | Frontend           | **Medium**   |

#### Mitigations

| Threat | Recommended Mitigation                                                                    |
| ------ | ----------------------------------------------------------------------------------------- |
| D-1    | ✅ Resolved — `express-rate-limit` implemented (global 100/15min, writes 10/min).          |
| D-2    | Partially mitigated by rate limiting. Still need storage quotas or a real database.        |
| D-3    | Deploy behind a reverse proxy (Nginx) with connection limits; consider clustering.         |
| D-4    | ✅ Resolved — `express.json({ limit: "10kb" })` enforced.                                |
| D-5    | Require authentication for destructive operations. Implement soft-delete with recovery.   |
| D-6    | Sanitize all data before rendering. Use server-side validation to reject malformed input. |

---

### E — Elevation of Privilege

| ID  | Threat                                    | Description                                                                                                                                      | Affected Component | Risk         |
| --- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ------------ |
| E-1 | **No authorization model**                | There are no roles or permissions. Every user (or anonymous client) has full admin-level access: read all, create, delete any record.            | Entire system      | **Critical** |
| E-2 | **Client-side routing bypass**            | Route protection is purely client-side. An attacker can call API endpoints directly, bypassing any UI-level restrictions.                        | Frontend → API     | **High**     |
| E-3 | ~~**Arbitrary field injection**~~         | ✅ **MITIGATED.** Server destructures only `{ name, phone }` from POST body. Extra fields like `role: "admin"` are discarded.                    | API Server         | ~~Medium~~ → **Resolved** |
| E-4 | **Dependency vulnerabilities**            | ~~json-server beta~~, React scripts, and transitive dependencies may contain known CVEs. json-server replaced with Express (stable).             | All                | **Low**      |

#### Mitigations

| Threat | Recommended Mitigation                                                                              |
| ------ | --------------------------------------------------------------------------------------------------- |
| E-1    | Implement RBAC (Role-Based Access Control) with at least user/admin roles.                          |
| E-2    | Enforce authorization on the server. Never rely on client-side guards alone.                        |
| E-3    | ✅ Resolved — server destructures only `{ name, phone }` from request body.                          |
| E-4    | ✅ Partially resolved — json-server beta replaced with Express (stable). Continue running `npm audit`. |

---

## 4. Risk Summary Matrix

| STRIDE Category                | Critical | High | Medium | Low | Resolved | Total (active) |
| ------------------------------ | -------- | ---- | ------ | --- | -------- | -------------- |
| **S** — Spoofing               | 1        | 1    | 1      | 0   | 0        | 3              |
| **T** — Tampering              | 1        | 1    | 1      | 0   | 3        | 3              |
| **R** — Repudiation            | 0        | 1    | 2      | 0   | 0        | 3              |
| **I** — Information Disclosure | 1        | 1    | 2      | 2   | 0        | 6              |
| **D** — Denial of Service      | 0        | 0    | 3      | 0   | 3        | 3              |
| **E** — Elevation of Privilege | 1        | 1    | 0      | 1   | 1        | 3              |
| **Total**                      | **4**    | **5**| **9**  | **3**| **7**   | **21**         |

> **Post-mitigation summary:** 7 of 28 threats resolved. Critical threats reduced from 6 → 4. High threats reduced from 10 → 5.

---

## 5. Top 5 Priority Threats

| Priority | ID        | Threat                                                  | Risk     | Status                            |
| -------- | --------- | ------------------------------------------------------- | -------- | --------------------------------- |
| 1        | S-1 / E-1 | No authentication or authorization — entire API is open | Critical | **Open** — requires auth layer    |
| 2        | T-1 / D-5 | Unrestricted mass deletion of contacts                  | Critical | **Reduced** — rate limited to 10/min but still unauthenticated |
| 3        | I-1       | Full PII exposure without access control                | Critical | **Open** — coupled with auth      |
| 4        | D-1 / D-2 | ~~No rate limiting — API flooding / storage exhaustion~~ | ~~Critical~~ | ✅ **Resolved** — express-rate-limit implemented |
| 5        | T-3       | ~~No server-side input validation~~                     | ~~High~~ | ✅ **Resolved** — Express + field whitelisting  |

---

## 6. Recommended Remediation Roadmap

### Phase 1 — Quick Wins (Low Effort)

- [ ] Remove unused Semantic UI CDN link from `index.html`
- [ ] Set `GENERATE_SOURCEMAP=false` for production builds
- [ ] Add `Content-Security-Policy` and `X-Content-Type-Options` headers
- [ ] Run `npm audit fix` on both frontend and server-api
- [ ] Add `createdAt` / `updatedAt` timestamps to records

### Phase 2 — API Hardening (Medium Effort) — ✅ MOSTLY COMPLETE

- [x] ~~Add rate limiting middleware (`express-rate-limit`)~~ — Global 100/15min, writes 10/min
- [x] ~~Enforce request body size limits~~ — 10KB cap via `express.json()`
- [x] ~~Add CORS configuration with strict `Access-Control-Allow-Origin`~~ — Restricted to `http://localhost:3000`
- [x] ~~Implement server-side input validation (whitelist `name`, `phone` fields only)~~ — Destructured fields + 400 on missing
- [ ] Add structured request logging (method, path, IP, timestamp)
- [x] ~~Sanitize JSON keys to prevent prototype pollution~~ — Only `name`, `phone` extracted from body

### Phase 3 — Authentication & Authorization (High Effort)

- [x] ~~Migrate from json-server to Express/Fastify with a real database~~ — Migrated to Express (db.json retained)
- [ ] Implement user authentication (JWT or session-based)
- [ ] Add RBAC with user-scoped data access
- [ ] Enforce HTTPS with TLS
- [ ] Add CSRF protection
- [ ] Implement soft-delete with audit trail

---

_Generated: March 2026 · Updated: March 2026 (post Express migration) · Methodology: STRIDE (Microsoft Threat Modeling)_
