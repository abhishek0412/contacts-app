# Contact Manager

Contact Manager is a full-stack contacts app with Firebase OAuth on the frontend and a token-protected Express API backed by PostgreSQL.

## What It Does

- Sign in with Google or GitHub via Firebase Authentication
- Store and manage contacts per authenticated user
- Search, paginate, add, view, and delete contacts
- Show inline validation and UI notifications
- Expose API docs at /api-docs and health at /healthz

## Stack

- Frontend: React, Redux Toolkit, RTK Query, React Router, Firebase Web SDK, Zod
- Backend: Node.js, Express, PostgreSQL, Firebase Admin SDK, Swagger
- Runtime: Nginx (SPA + proxy), Docker Compose
- Testing: Jest, Supertest, Playwright

## Quick Start (Recommended)

1. Create root environment file next to docker-compose.yml:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

2. Build and run:

```bash
docker compose up -d --build
docker compose ps
```

3. Open:

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/api-docs

> [!NOTE]
> Firebase values are baked into the frontend build. If you change REACT_APP_FIREBASE_* values, rebuild frontend:
>
> docker compose build frontend
>
> docker compose up -d --force-recreate frontend

## Local Development (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 17 (or compatible)

### Install

```bash
cd frontend && npm install
cd ../server-api && npm install
cd .. && npm install
```

### Frontend Environment

Create frontend/.env:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### API Environment (Optional Overrides)

```env
PORT=3001
DATABASE_URL=postgresql://contacts_user:contacts_pass@localhost:5432/contacts
FIREBASE_PROJECT_ID=your_firebase_project_id
CORS_ORIGIN=http://localhost:3000
```

### Run

```bash
# terminal 1
cd server-api
npm start

# terminal 2
cd frontend
npm start
```

## Key Folders

```text
frontend/
    src/
        contexts/AuthContext.js
        features/apiSlice.js
        pages/Login.js
    nginx.conf
    Dockerfile

server-api/
    db/init.sql
    server.js
    Dockerfile

e2e/
    *.spec.js
    pages/

docker-compose.yml
```

## Troubleshooting

- Frontend login says Firebase authentication is not configured:
    Set root REACT_APP_FIREBASE_* values and rebuild frontend image.
- Frontend container shows entrypoint not found:
    Rebuild frontend image to refresh line ending normalization.
- OAuth popup blocked/cancelled:
    The app falls back to redirect flow; allow popups for localhost if your browser blocks them.
- Browser CSP errors during auth:
    Rebuild frontend so latest nginx.conf is used.

## CI/CD and Infra

- CI/CD pipelines: azure-pipelines.yml and pipelines/
- Infra templates: pipelines/infra (Bicep)
- Deployment architecture and security docs: ARCHITECTURE.md and THREAT-MODEL.md
