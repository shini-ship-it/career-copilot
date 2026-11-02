# Career Copilot

A full-stack career workspace for tracking job applications and tailoring your resume to a specific job posting.

## Features
- Track applications through **Saved, Applied, Interviewing, Offer, and Rejected**
- Store company, role, job URL, location, date, follow-up date, and notes
- Search/filter applications and export the tracker to CSV
- Persist workspace data with Spring Boot + JPA (H2 locally; PostgreSQL via Docker Compose)
- **AI resume tailoring:** paste your current resume and either a public HTTPS job-posting URL or the job description
- Get a revised resume, relevant supported keywords, potential requirement gaps, and questions that may help strengthen your experience
- Download the tailored resume as a text file or copy it to your clipboard

## Tech stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Java 17, Spring Boot 3.4, Spring Web, Spring Data JPA, Jsoup
- Database: H2 locally or PostgreSQL 16 using Docker Compose
- AI: OpenAI Responses API (key kept on the server)

## Run locally
Prerequisites: Java 17+ and Maven 3.9+.

Set your API key as an environment variable; never commit it to source control.

```bash
export OPENAI_API_KEY="your-api-key"
# Optional; defaults to gpt-4.1-mini
export OPENAI_MODEL="gpt-4.1-mini"
cd backend
mvn spring-boot:run
```

Open http://localhost:8080. Without `OPENAI_API_KEY`, the tracker still works, but resume tailoring returns a configuration message.

## Run with PostgreSQL
Prerequisites: Docker Desktop / Docker Engine with Compose. Export `OPENAI_API_KEY` in the shell before starting Compose:

```bash
export OPENAI_API_KEY="your-api-key"
docker compose up --build
```

## API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/workspace` | Load workspace |
| PUT | `/api/workspace` | Save workspace |
| DELETE | `/api/workspace` | Clear workspace |
| POST | `/api/tailor-resume` | Tailor resume to a job URL or description |

Resume-tailoring request JSON:
```json
{
  "resume": "Paste your current resume text",
  "jobUrl": "https://example.com/jobs/123",
  "jobDescription": ""
}
```
Use either `jobUrl` or `jobDescription`, or both. Some job sites block automated access; paste the description when a URL cannot be read.

## Important limitations
This is an MVP with one shared workspace and no authentication. Keep it local; do not deploy with real personal data until login, per-user authorization, HTTPS, rate limits, secrets management, and backups are implemented. Job discovery has intentionally been left out of this version.

Resume tailoring must be reviewed by the user. The AI is instructed not to invent qualifications, employers, achievements, dates, or skills. Job-page extraction may fail for login-gated, JavaScript-heavy, or bot-protected sites.

## Roadmap
1. Add authentication and per-user workspaces.
2. Add automated tests and database migrations.
3. Add secure resume file upload/parsing and downloadable DOCX/PDF output.
