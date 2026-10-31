# Backend

Spring Boot REST API with JPA persistence.

## Run locally
Requires Java 17+ and Maven 3.9+.

```bash
mvn spring-boot:run
```

The default profile uses a file-backed H2 database at `data/careercopilot`. The H2 console is available at `/h2-console` during local development.

## PostgreSQL with Docker
From this directory:

```bash
docker compose up --build
```

## Endpoints
- `GET /api/health`
- `GET /api/workspace`
- `PUT /api/workspace` with a JSON object containing a `jobs` array
- `DELETE /api/workspace`

**Security note:** This MVP has one shared workspace and no authentication. Keep it local; do not deploy with real user data until authentication and per-user authorization are implemented.
