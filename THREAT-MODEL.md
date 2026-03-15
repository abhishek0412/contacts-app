# Contact Manager — STRIDE Threat Model

## 1. System Overview

| Component | Technology | Port | Description |
|-----------|-----------|------|-------------|
| Frontend | React (CRA) + Redux Toolkit / RTK Query | 3000 | SPA serving the UI, client-side routing, form validation |
| API Server | json-server v1 (beta) | 3001 | RESTful CRUD endpoints (`/contacts`) |
| Data Store | db.json | — | Flat JSON file on disk |
| Transport | HTTP (no TLS) | — | Unencrypted communication between frontend and API |

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
 ┌──────────────────────────┐
 │  json-server (port 3001) │
 │  No auth · No rate limit │
 │  No input validation     │
 └────────┬─────────────────┘
          │ fs read/write
          ▼
 ┌──────────────────────────┐
 │  db.json                 │
 │  PII: names, phones      │
 └──────────────────────────┘
```

### Trust Boundaries

| # | Boundary | Description |
|---|----------|-------------|
| TB-1 | Browser ↔ API Server | Network boundary; no authentication or authorization |
| TB-2 | API Server ↔ File System | json-server reads/writes db.json with full fs access |
| TB-3 | User ↔ Browser | User-supplied input enters the system via forms |

---

## 2. Assets

| ID | Asset | Sensitivity | Location |
|----|-------|-------------|----------|
| A-1 | Contact records (name, phone) | PII — moderate | db.json, RTK Query cache, DOM |
| A-2 | db.json file | Data integrity | Server file system |
| A-3 | API server availability | Business continuity | localhost:3001 |
| A-4 | Frontend application code | Intellectual property | localhost:3000 (public) |
| A-5 | Redux store / browser state | PII in memory | Browser memory |

---

## 3. STRIDE Threat Analysis

### S — Spoofing (Identity)

| ID | Threat | Description | Affected Component | Risk |
|----|--------|-------------|--------------------|------|
| S-1 | **No authentication** | The API has zero authentication. Any client on the network can call `GET /POST /DELETE /contacts` and impersonate a legitimate user. | API Server (TB-1) | **Critical** |
| S-2 | **No CSRF protection** | No CSRF tokens are used. A malicious page opened in the same browser could issue state-changing requests (POST, DELETE) to `localhost:3001` on behalf of the user. | Frontend → API | **High** |
| S-3 | **No session or identity** | There is no concept of user identity. All operations are anonymous, so one user's actions are indistinguishable from another's. | Entire system | **High** |

#### Mitigations

| Threat | Recommended Mitigation |
|--------|----------------------|
| S-1 | Add authentication (JWT, OAuth 2.0, or API keys) to all API endpoints. |
| S-2 | Implement CSRF tokens or use `SameSite` cookies. Use CORS with a strict `Access-Control-Allow-Origin`. |
| S-3 | Introduce user accounts with session management; associate contacts with user IDs. |

---

### T — Tampering (Data Integrity)

| ID | Threat | Description | Affected Component | Risk |
|----|--------|-------------|--------------------|------|
| T-1 | **Unrestricted DELETE** | Any network client can delete any contact by ID (`DELETE /contacts/:id`) without authorization. Mass deletion is trivial. | API Server | **Critical** |
| T-2 | **Unrestricted POST (data injection)** | Any client can inject arbitrary contacts. json-server accepts any JSON body — fields beyond `name` and `phone` (e.g., `isAdmin`, `__proto__`) are persisted to db.json. | API Server | **High** |
| T-3 | **No server-side validation** | Validation exists only on the client (Zod schema). Attackers can bypass it entirely by calling the API directly with `curl`/Postman and submit empty, malformed, or oversized payloads. | API Server | **High** |
| T-4 | **db.json direct modification** | The data file has no integrity protection (checksums, file permissions). Any process with fs access can alter it. | File System (TB-2) | **Medium** |
| T-5 | **Man-in-the-middle (HTTP)** | Traffic between browser and API is unencrypted. An attacker on the same network can intercept and modify requests/responses in transit. | Network (TB-1) | **High** |
| T-6 | **Prototype pollution** | json-server may be vulnerable to `__proto__` or `constructor` payloads in POST body that could pollute JavaScript object prototypes. | API Server | **Medium** |

#### Mitigations

| Threat | Recommended Mitigation |
|--------|----------------------|
| T-1, T-2 | Add authorization; validate that the requester owns the resource before allowing mutations. |
| T-3 | Implement server-side input validation and schema enforcement (e.g., migrate to Express/Fastify with Zod middleware). |
| T-4 | Use a proper database (SQLite, PostgreSQL). Set restrictive file permissions on db.json. |
| T-5 | Enforce HTTPS with TLS certificates (even in development, use `mkcert`). |
| T-6 | Sanitize incoming JSON keys; reject payloads containing `__proto__`, `constructor`, or `prototype`. |

---

### R — Repudiation (Audit Trail)

| ID | Threat | Description | Affected Component | Risk |
|----|--------|-------------|--------------------|------|
| R-1 | **No audit logging** | No server-side logs record who performed what action and when. Deletions and additions are untraceable. | API Server | **High** |
| R-2 | **No timestamps on records** | Contact records have no `createdAt` / `updatedAt` fields. There's no way to determine when data was modified. | db.json | **Medium** |
| R-3 | **Client-side notifications only** | The notification system (`notificationSlice`) fires toasts in the browser but nothing is logged server-side. A user can deny having deleted a contact. | Frontend | **Medium** |

#### Mitigations

| Threat | Recommended Mitigation |
|--------|----------------------|
| R-1 | Add structured server-side logging (Winston, Pino) with request metadata (IP, timestamp, method, path, body). |
| R-2 | Add `createdAt` and `updatedAt` timestamps to all records (json-server middleware or real backend). |
| R-3 | Persist an append-only audit log on the server for all write operations. |

---

### I — Information Disclosure (Confidentiality)

| ID | Threat | Description | Affected Component | Risk |
|----|--------|-------------|--------------------|------|
| I-1 | **Full contact list exposed** | `GET /contacts` returns all 100 contacts to any requester with no access control. PII (names, phone numbers) is freely accessible. | API Server (TB-1) | **Critical** |
| I-2 | **HTTP plaintext transmission** | Contact data (PII) travels over unencrypted HTTP. Susceptible to network sniffing. | Network | **High** |
| I-3 | **PII in browser state** | All contacts are cached in the Redux store (RTK Query cache) and accessible via browser DevTools. | Frontend (Browser) | **Medium** |
| I-4 | **Verbose error messages** | React ErrorBoundary and json-server may expose stack traces or internal paths in error responses. | Frontend, API | **Low** |
| I-5 | **Source maps in production** | CRA includes source maps in production builds by default, exposing full frontend source code. | Frontend build | **Medium** |
| I-6 | **CDN dependency leaks** | Semantic UI CSS is loaded from `cdnjs.cloudflare.com` (unused). The CDN can track user IPs and the external request exposes browsing to third parties. | index.html | **Low** |

#### Mitigations

| Threat | Recommended Mitigation |
|--------|----------------------|
| I-1 | Add authentication + authorization. Scope data access per user. |
| I-2 | Enforce HTTPS everywhere. |
| I-3 | Limit cache lifetime. Clear sensitive data on logout. Don't store more than needed. |
| I-4 | Use generic error messages in production. Disable stack traces. |
| I-5 | Set `GENERATE_SOURCEMAP=false` in production builds. |
| I-6 | Remove the unused Semantic UI CDN link from `index.html`. |

---

### D — Denial of Service (Availability)

| ID | Threat | Description | Affected Component | Risk |
|----|--------|-------------|--------------------|------|
| D-1 | **No rate limiting** | The API has no rate limiting. An attacker can flood `POST /contacts` to bloat db.json or spam `DELETE` to wipe all data. | API Server | **Critical** |
| D-2 | **db.json exhaustion** | Repeated POST requests will grow db.json unboundedly until disk space is exhausted, crashing json-server. | File System | **High** |
| D-3 | **Single-threaded server** | json-server runs on a single Node.js thread. CPU-intensive or concurrent requests can block the event loop. | API Server | **Medium** |
| D-4 | **No payload size limit** | No `Content-Length` or body size restrictions. An attacker could send a multi-GB POST body. | API Server | **High** |
| D-5 | **Mass deletion** | Without auth, an attacker can script `DELETE /contacts/:id` for every known ID and wipe the entire contact list. | API Server | **Critical** |
| D-6 | **Frontend crash via malformed data** | If db.json is corrupted (e.g., injected HTML/script in names), React could error during rendering. The ErrorBoundary catches this but the app becomes unusable. | Frontend | **Medium** |

#### Mitigations

| Threat | Recommended Mitigation |
|--------|----------------------|
| D-1 | Implement rate limiting middleware (e.g., `express-rate-limit`). |
| D-2 | Set storage quotas; use a real database with size management. |
| D-3 | Deploy behind a reverse proxy (Nginx) with connection limits; consider clustering. |
| D-4 | Enforce maximum request body size (e.g., `body-parser` limit of 10KB). |
| D-5 | Require authentication for destructive operations. Implement soft-delete with recovery. |
| D-6 | Sanitize all data before rendering. Use server-side validation to reject malformed input. |

---

### E — Elevation of Privilege

| ID | Threat | Description | Affected Component | Risk |
|----|--------|-------------|--------------------|------|
| E-1 | **No authorization model** | There are no roles or permissions. Every user (or anonymous client) has full admin-level access: read all, create, delete any record. | Entire system | **Critical** |
| E-2 | **Client-side routing bypass** | Route protection is purely client-side. An attacker can call API endpoints directly, bypassing any UI-level restrictions. | Frontend → API | **High** |
| E-3 | **json-server arbitrary field injection** | POST `/contacts` accepts any JSON fields. An attacker could inject `role: "admin"` or other fields that a future version of the app might trust. | API Server | **Medium** |
| E-4 | **Dependency vulnerabilities** | json-server beta, React scripts, and transitive dependencies may contain known CVEs that could enable remote code execution. | All | **Medium** |

#### Mitigations

| Threat | Recommended Mitigation |
|--------|----------------------|
| E-1 | Implement RBAC (Role-Based Access Control) with at least user/admin roles. |
| E-2 | Enforce authorization on the server. Never rely on client-side guards alone. |
| E-3 | Whitelist allowed fields in POST/PUT body (e.g., only accept `name` and `phone`). |
| E-4 | Run `npm audit` regularly. Pin dependency versions. Replace beta dependencies with stable releases. |

---

## 4. Risk Summary Matrix

| STRIDE Category | Critical | High | Medium | Low | Total |
|----------------|----------|------|--------|-----|-------|
| **S** — Spoofing | 1 | 2 | 0 | 0 | 3 |
| **T** — Tampering | 1 | 3 | 2 | 0 | 6 |
| **R** — Repudiation | 0 | 1 | 2 | 0 | 3 |
| **I** — Information Disclosure | 1 | 1 | 2 | 2 | 6 |
| **D** — Denial of Service | 2 | 2 | 2 | 0 | 6 |
| **E** — Elevation of Privilege | 1 | 1 | 2 | 0 | 4 |
| **Total** | **6** | **10** | **10** | **2** | **28** |

---

## 5. Top 5 Priority Threats

| Priority | ID | Threat | Risk | Effort to Mitigate |
|----------|----|--------|------|---------------------|
| 1 | S-1 / E-1 | No authentication or authorization — entire API is open | Critical | High (requires backend rewrite) |
| 2 | T-1 / D-5 | Unrestricted mass deletion of contacts | Critical | Medium (add auth + soft delete) |
| 3 | I-1 | Full PII exposure without access control | Critical | High (coupled with auth) |
| 4 | D-1 / D-2 | No rate limiting — API flooding / storage exhaustion | Critical | Low (add middleware) |
| 5 | T-3 | No server-side input validation | High | Medium (migrate to Express + Zod) |

---

## 6. Recommended Remediation Roadmap

### Phase 1 — Quick Wins (Low Effort)
- [ ] Remove unused Semantic UI CDN link from `index.html`
- [ ] Set `GENERATE_SOURCEMAP=false` for production builds
- [ ] Add `Content-Security-Policy` and `X-Content-Type-Options` headers
- [ ] Run `npm audit fix` on both frontend and server-api
- [ ] Add `createdAt` / `updatedAt` timestamps to records

### Phase 2 — API Hardening (Medium Effort)
- [ ] Add rate limiting middleware (`express-rate-limit`)
- [ ] Enforce request body size limits
- [ ] Add CORS configuration with strict `Access-Control-Allow-Origin`
- [ ] Implement server-side input validation (whitelist `name`, `phone` fields only)
- [ ] Add structured request logging (method, path, IP, timestamp)
- [ ] Sanitize JSON keys to prevent prototype pollution

### Phase 3 — Authentication & Authorization (High Effort)
- [ ] Migrate from json-server to Express/Fastify with a real database
- [ ] Implement user authentication (JWT or session-based)
- [ ] Add RBAC with user-scoped data access
- [ ] Enforce HTTPS with TLS
- [ ] Add CSRF protection
- [ ] Implement soft-delete with audit trail

---

*Generated: March 2026 · Methodology: STRIDE (Microsoft Threat Modeling)*
