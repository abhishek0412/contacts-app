# Contact Manager Architecture

Last updated: March 17, 2026

## 1. System Overview

Contact Manager is a full-stack web application with:

- React SPA frontend served by Nginx
- Firebase Authentication (Google and GitHub OAuth)
- Express API protected by Firebase Admin token verification
- PostgreSQL persistence (per-user contact isolation)
- Docker Compose local orchestration

Primary local endpoints:

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API docs: http://localhost:3001/api-docs
- Postgres: localhost:5432

## 2. High-Level Architecture

```mermaid
graph LR
    U[User Browser]
    FE[Nginx + React SPA]
    FID[Firebase Auth]
    API[Express API]
    PG[(PostgreSQL)]

    U -->|HTTPS or HTTP in local| FE
    FE -->|OAuth popup or redirect| FID
    FE -->|Bearer token in Authorization| API
    API -->|verifyIdToken| FID
    API -->|SQL queries| PG
```

## 3. Runtime Components

### Frontend container

- Source: frontend/
- Build: multi-stage Docker build (Node build stage + Nginx runtime)
- Responsibilities:
  - Serve static SPA assets
  - Route all non-file paths to index.html
  - Reverse proxy /api/\* to backend service
  - Emit security headers (CSP, frame protections, referrer policy, etc.)

### API container

- Source: server-api/
- Runtime: Node.js + Express
- Responsibilities:
  - Validate Firebase ID tokens
  - Enforce user-level data scoping on all contact routes
  - Validate request payload basics for write operations
  - Expose Swagger docs and health endpoint
  - Enforce global and write-specific rate limits

### Database container

- Engine: PostgreSQL 17 (alpine)
- Schema bootstrap: server-api/db/init.sql
- Contacts table stores user_id, name, phone, created_at

## 4. Frontend Architecture

Key modules:

- Auth context: frontend/src/contexts/AuthContext.js
  - Handles OAuth login/logout
  - Falls back popup login to redirect when popup fails
  - Converts common Firebase auth errors to user-friendly messages
- Firebase bootstrap: frontend/src/firebase.js
  - Reads REACT*APP_FIREBASE*\* config
  - Guards against missing config
- API data layer: frontend/src/features/apiSlice.js
  - RTK Query base query
  - Injects Firebase ID token in Authorization header when present
- Routing: frontend/src/App.js
  - Protected routes for contacts pages
  - Public login route

## 5. API Architecture

Core endpoints:

- GET /healthz (unauthenticated)
- GET /api-docs (unauthenticated)
- GET /contacts (authenticated)
- GET /contacts/:id (authenticated)
- POST /contacts (authenticated + write rate limit)
- DELETE /contacts/:id (authenticated + write rate limit)

Authentication flow:

1. Frontend obtains Firebase user session
2. Frontend sends ID token as Bearer token
3. API verifies token via Firebase Admin SDK
4. API maps decoded uid to req.userId
5. SQL queries enforce WHERE user_id = req.userId

## 6. Data Model

contacts table:

- id: UUID primary key
- user_id: string (Firebase uid)
- name: string
- phone: string
- created_at: timestamp default now

Index:

- idx_contacts_user_id on user_id

## 7. Deployment and Delivery

Local orchestration:

- docker-compose.yml defines frontend, api, postgres
- Health-based startup ordering:
  - api waits for postgres healthy
  - frontend waits for api healthy

CI/CD:

- CI pipeline: pipelines/ci.yml
  - Scan -> Test -> E2E -> Build
- CD pipeline: pipelines/cd.yml
  - Push images -> Deploy region
- Legacy router pipeline: azure-pipelines.yml

## 8. Cross-Cutting Concerns

### Security

- Firebase token verification on API
- User-scoped SQL access control
- CORS handling for localhost origins
- Rate limiting:
  - Global: 100 requests per 15 minutes per IP
  - Writes: 10 requests per minute per IP
- Nginx security headers and CSP

### Reliability

- Health checks for all containers
- Restart policy set to unless-stopped
- Frontend startup normalizes shell script line endings in image build

### Observability

- Basic server startup logs
- No centralized structured logging/tracing yet

## 9. Key Architectural Decisions

1. Firebase Auth for identity provider and token format consistency
2. Firebase Admin verification on backend for server-trust boundary
3. PostgreSQL for persistent multi-user data over file-based storage
4. RTK Query for cached data fetching and invalidation patterns
5. Nginx reverse proxy for frontend static hosting + API forwarding

## 10. Known Gaps and Improvement Targets

1. Refactor server-api/server.js into layered modules (router/service/repository)
2. Add structured logging and request correlation IDs
3. Tighten CORS policy for non-local deployments
4. Add request schema validation library for stronger payload contracts
5. Add migration tooling (instead of bootstrap SQL only)
6. Add TLS-first deployment defaults outside local development
