# Repository guidance

## Project structure
- Keep the Spring Boot application in `backend/`.
- Keep the browser UI source in `frontend/`.
- The deployable UI is served from `backend/src/main/resources/static/`.
- Keep the frontend source and Spring Boot static copies in sync.
- Keep HTML in the page shell, styles in `styles.css`, and browser behavior in `app.js`.
- Group browser code into clearly named sections: state, DOM references, persistence, rendering, application actions, profile actions, and event bindings.
- Keep the two UI copies byte-for-byte in sync: after changing `frontend/index.html`, `frontend/app.js`, or `frontend/styles.css`, copy each changed file to `backend/src/main/resources/static/`.

## UI and behavior
- Preserve the existing green-and-cream Career Copilot visual identity unless a task explicitly asks for a redesign.
- Use semantic HTML, accessible labels, button types, and descriptive empty states.
- Escape user-provided values before inserting them into HTML.
- Keep application data and profile data in the existing workspace payload; do not introduce a second persistence mechanism.
- Preserve tracker CRUD, filtering, CSV export, and local-storage fallback.
- Do not show placeholder navigation for features that are implemented.

## Engineering workflow
- Make changes on a feature branch and open a pull request targeting `main`.
- Never push feature work directly to `main` or merge a pull request.
- Keep dependencies minimal and do not commit secrets.
- Update both UI copies whenever browser UI code changes.
- Run the available build/tests when possible and report anything not run.

## Local development handoff
- The API defaults to port 8080 and uses a file-backed H2 database. If 8080 is occupied, use `--server.port=8081`.
- This workspace may contain a local ARM64 Java 17 runtime and Maven under `work/tools/`; invoke Maven with `-Dmaven.repo.local="$PWD/work/m2"` when the normal user Maven cache is inaccessible.
- For the local 8081 instance, use `--spring.datasource.url="jdbc:h2:file:$PWD/work/data8081/localdb"` to avoid colliding with another app instance. Do not add `AUTO_SERVER=TRUE` in environments that block H2's secondary socket.
- A prior startup issue came from the nested `WorkspaceRepository` interface not being discovered by Spring Data. The application now provides it through `JpaRepositoryFactory` in a `@Bean`; retain this wiring unless the repository is moved to a top-level package and verified.
- Current UI includes application tracking, profile editing, and a recent-activity list backed by the existing workspace `activity` array. Preserve escaping of user-controlled values and existing local-storage fallback.
- Local startup sessions may terminate when a managed terminal ends. Confirm the current server state before assuming a previous `localhost:8081` tab still has a live backend.
