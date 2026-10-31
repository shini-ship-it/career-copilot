# Career Copilot

A full-stack job-search workspace for managing applications, tracking interview stages, and keeping job-search notes in one place.

## Features
- Track jobs through **Saved, Applied, Interviewing, Offer, and Rejected**
- Store company, role, job URL, location, applied date, follow-up date, and notes
- Search and filter applications
- Persistent backend storage with Spring Boot + JPA
- H2 file database for local development; PostgreSQL option with Docker Compose
- Export your application tracker to CSV

## Tech stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Java 17, Spring Boot 3.4, Spring Web, Spring Data JPA
- Database: H2 locally or PostgreSQL 16 using Docker Compose

## Run locally
Prerequisites: Java 17+ and Maven 3.9+.

```bash
cd backend
mvn spring-boot:run
```

Open http://localhost:8080.

## Run with PostgreSQL
Prerequisites: Docker Desktop / Docker Engine with Compose.

```bash
cd backend
docker compose up --build
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/workspace` | Load workspace |
| PUT | `/api/workspace` | Save workspace |
| DELETE | `/api/workspace` | Clear workspace |

## Important limitations
This is an MVP with one shared workspace and no authentication. Do not deploy it publicly with real personal data until login, per-user authorization, HTTPS, rate limits, secrets management, and backups are implemented. Job discovery, resume parsing, and AI matching are planned future features; job links are opened by the user rather than applying automatically.

## Roadmap
1. Add authentication and per-user workspaces.
2. Add tests, database migrations, and normalized application tables.
3. Add resume upload/parsing and AI-powered job matching.
4. Add authorized job-source integrations and saved-search alerts.
