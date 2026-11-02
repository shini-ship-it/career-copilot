# Backend

Spring Boot REST API with JPA persistence and optional OpenAI-powered resume tailoring.

## Run locally
Requires Java 17+ and Maven 3.9+. For AI tailoring, configure the API key in the environment (never commit it):

```bash
export OPENAI_API_KEY="your-api-key"
export OPENAI_MODEL="gpt-4.1-mini" # optional
mvn spring-boot:run
```

The default profile uses a file-backed H2 database at `data/careercopilot`. The H2 console is available at `/h2-console` during local development.

## PostgreSQL with Docker
Export `OPENAI_API_KEY` first, then run:

```bash
docker compose up --build
```

## Endpoints
- `GET /api/health`
- `GET /api/workspace`
- `PUT /api/workspace` with a JSON object containing a `jobs` array
- `DELETE /api/workspace`
- `POST /api/tailor-resume` with `resume` plus either `jobUrl` or `jobDescription`

The tailoring endpoint calls the OpenAI Responses API from the server. If a public HTTPS job link cannot be read, paste the job description instead. API keys must remain in environment variables.

**Security note:** This MVP has one shared workspace and no authentication. Keep it local; do not deploy with real user data until authentication and per-user authorization are implemented.
