# ID.Me by Inspironics

Digital business cards and professional networking: **Create → Connect → Capture → Qualify → Nurture → Convert → Measure.**

> Status: **Phase 0 (foundation) complete.** The architecture, governance documents and a tested walking skeleton exist.
> No product features (accounts, cards, contacts, leads) are usable yet. See [docs/project-status.md](docs/project-status.md).

## Stack

Java 25 · Spring Boot 4.1 (Security, Validation, JDBC, Flyway, Actuator, springdoc) · Spring Modulith · PostgreSQL 18 ·
React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · TanStack Query · Vitest · Playwright. Rationale and pinned versions:
[ADR-0002](docs/decisions/ADR-0002-technology-stack-and-version-policy.md).

## Prerequisites

* JDK 25 (or use a portable JDK; Maven is provided by the wrapper `backend/mvnw`)
* Node.js ≥ 22.12 and npm
* PostgreSQL 18, via **either** Docker **or** local binaries

## Run locally

### 1. Database

With Docker:
```bash
cp .env.example .env          # optional; development-only defaults
docker compose up -d postgres # creates roles idme_owner/idme_app and databases idme, idme_test
```

Without Docker (any PostgreSQL 18 binaries; set `PG_BIN` if they are not in `.tools/pgsql/bin` or on `PATH`):
```bash
scripts/dev-db.sh init        # first time: cluster on 127.0.0.1:55432 + roles + databases
scripts/dev-db.sh start | stop | status
```

### 2. Backend (http://localhost:8080)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```
The `dev` profile enables API docs at `/swagger-ui.html` and uses the development database passwords. Flyway migrates on startup.

### 3. Frontend (http://localhost:5173)
```bash
cd frontend
npm ci
npm run dev                   # proxies /api and /actuator/health to :8080
```
Open http://localhost:5173. The workspace preview is at `/app`.

## Tests

```bash
# Backend: unit + modularity + PostgreSQL integration tests
cd backend
IDME_TEST_JDBC_URL=jdbc:postgresql://127.0.0.1:55432/idme_test ./mvnw verify
# (omit IDME_TEST_JDBC_URL to use Testcontainers, which requires Docker)

# Frontend
cd frontend
npm run typecheck && npm run lint && npm test && npm run build

# End-to-end (backend must be running on :8080; Playwright starts Vite)
npm run e2e:install           # first time: downloads Chromium
npm run e2e
```
Latest results: [docs/test-evidence.md](docs/test-evidence.md).

## Documentation

| Document | Purpose |
|---|---|
| [docs/source-review.md](docs/source-review.md) | What each source says, conflicts, excluded claims |
| [docs/requirements-traceability.md](docs/requirements-traceability.md) | Every requirement ID → phase → status → evidence |
| [docs/architecture.md](docs/architecture.md) | Modules, cross-cutting design, configuration |
| [docs/permissions.md](docs/permissions.md) | Roles and permission matrix |
| [docs/data-model.md](docs/data-model.md) | Implemented and planned schema, retention |
| [docs/api-contract.yaml](docs/api-contract.yaml) | OpenAPI contract (implemented + planned operations) |
| [docs/decisions/](docs/decisions/README.md) | Architecture decision records |
| [docs/test-evidence.md](docs/test-evidence.md) | Commands run and actual results |
| [docs/project-status.md](docs/project-status.md) | Phase plan, acceptance, blockers |

Source materials are kept read-only in `docs/sources/` on the project workstation. They are internal documents and are
deliberately not committed to this public repository; their SHA-256 hashes are listed in `docs/source-review.md`.

## Security notes

* Credentials in `application-dev.yml`, `scripts/` and `.env.example` are **development-only**. Production secrets come from
  the environment or a secret manager. `application.yml` defaults are production-safe (secure cookies, API docs off).
* The application connects as the restricted `idme_app` role; only migrations use `idme_owner`.
