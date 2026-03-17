# Contact Manager Threat Model (STRIDE)

Last updated: March 17, 2026

## 1. Scope

In scope:

- Frontend SPA and Nginx reverse proxy
- Firebase Authentication integration
- Express API and token verification middleware
- PostgreSQL data store
- Docker Compose local runtime

Out of scope:

- Azure account governance and tenant-wide policies
- Client device compromise and browser extension malware

## 2. System and Trust Boundaries

### Components

- Browser client
- Frontend container (Nginx + React build)
- Firebase Authentication service
- API container (Express + Firebase Admin SDK)
- PostgreSQL container

### Trust boundaries

- TB-1: Browser <-> Frontend/API over network
- TB-2: Frontend/API <-> Firebase managed service
- TB-3: API <-> PostgreSQL data boundary
- TB-4: Container runtime and environment variable/secret boundary

## 3. Assets

- A-1: User identity tokens and authentication state
- A-2: Contact data (name, phone)
- A-3: Database integrity and availability
- A-4: API availability and correctness
- A-5: Build/runtime configuration and secrets

## 4. Existing Security Controls

1. Firebase ID token verification on API routes
2. User-scoped data queries using user_id from verified token
3. IP-based rate limits for global and write traffic
4. Basic request validation for required write fields
5. Nginx security headers and CSP
6. Container health checks and service dependency ordering

## 5. STRIDE Analysis

### S: Spoofing

Threats:

1. Stolen bearer token replay from compromised client
2. Forged token attempts against API

Current posture:

- Forged tokens are mitigated by Firebase Admin verification
- Replay risk remains if tokens are stolen from browser context

Recommended improvements:

1. Short token/session lifetimes and forced re-auth for sensitive actions
2. Device/session visibility and revocation UX
3. Add anomaly detection for unusual login patterns

### T: Tampering

Threats:

1. Request body manipulation for unauthorized field injection
2. Contact mutation attempts against other users' data
3. SQL abuse via malformed parameters

Current posture:

- API enforces user scoping in SQL where clauses
- Only expected fields are persisted for contact creation
- Parameterized SQL protects against classic injection

Recommended improvements:

1. Introduce schema-based validation (zod/joi) on all write routes
2. Add immutable audit records for mutation operations
3. Add optimistic concurrency support for future update endpoints

### R: Repudiation

Threats:

1. User denies creating/deleting contacts without audit trail
2. Insufficient forensic context during incidents

Current posture:

- Limited runtime logs; no structured audit log by user/action

Recommended improvements:

1. Add structured logs with uid, action, resource id, timestamp, request id
2. Persist append-only audit events for write operations
3. Define retention and review policy for security-relevant logs

### I: Information Disclosure

Threats:

1. Data leakage through weak CORS or misconfiguration
2. Sensitive values exposed via source maps or browser storage
3. Overly broad CSP allowances enabling third-party script risk
4. Secret leakage through environment mishandling

Current posture:

- API uses localhost-based CORS checks in current implementation
- Frontend build embeds Firebase public client config
- No dedicated secret management layer in local dev

Recommended improvements:

1. Harden CORS allowlist per deployment environment
2. Disable production source maps for frontend release builds
3. Review and tighten CSP domains and script allowances over time
4. Use managed secret stores for non-local environments

### D: Denial of Service

Threats:

1. High request volume against API endpoints
2. Write flooding to exhaust DB/storage capacity
3. Dependency outages (Firebase or DB) causing degraded service

Current posture:

- Global and write rate limits are in place
- Health checks are in place for container services

Recommended improvements:

1. Add uid-aware and endpoint-aware limit strategies
2. Add DB connection pool tuning and circuit-breaker style safeguards
3. Add operational runbooks and SLO alerts for health degradation

### E: Elevation of Privilege

Threats:

1. Unauthorized access to another user's records
2. Abuse of trusted service privileges in backend runtime
3. Future admin-level operations introduced without role model

Current posture:

- Row access is scoped by uid in read/delete queries
- No RBAC model yet beyond per-user isolation

Recommended improvements:

1. Add explicit authorization layer for role/capability decisions
2. Define least-privilege model for future admin/support endpoints
3. Add policy tests that enforce access boundaries

## 6. Risk Summary

Current highest-priority risks:

1. Incomplete auditability (repudiation)
2. CORS/CSP configuration drift across environments
3. Operational resilience under dependency failures
4. Missing formal authorization model for future privileged features

## 7. Remediation Roadmap

### Phase 1: High impact, low complexity

1. Structured logging with request and user context
2. Strong schema validation for all write requests
3. Environment-specific CORS configuration
4. CI rule to block accidental secret commits

### Phase 2: Security depth

1. Add durable audit event store for mutations
2. Add RBAC foundation and policy checks
3. Tighten CSP and security header policy by environment
4. Add secure secret management pattern for deployment environments

### Phase 3: Resilience and governance

1. Error budgets/SLOs and alerting
2. Dependency failure playbooks (Firebase/Postgres outage)
3. Security-focused architecture reviews per release

## 8. Verification Checklist

Use this checklist in release validation:

1. Auth-required endpoints reject missing/invalid bearer tokens
2. User cannot access or mutate another user's records
3. Rate limits trigger expected 429 behavior
4. Health endpoint reflects dependency status
5. Security headers and CSP are present on frontend responses
6. No secrets are present in committed files
