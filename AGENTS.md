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
- The API defaults to port 8080 and uses a file-backed H2 database. For this macOS ARM64 workspace use port 8081 because 8080 may already be occupied.
- Local build tools are in `work/tools/`: Java at `work/tools/jdk-17.0.21+9/Contents/Home` and Maven at `work/tools/apache-maven-3.9.9/bin/mvn`. Maven dependencies are cached in `work/m2/`.
- Build from the repository root with:
  `JAVA_HOME="$PWD/work/tools/jdk-17.0.21+9/Contents/Home" PATH="$PWD/work/tools/jdk-17.0.21+9/Contents/Home/bin:$PATH" "$PWD/work/tools/apache-maven-3.9.9/bin/mvn" -B -Dmaven.repo.local="$PWD/work/m2" -f backend/pom.xml -DskipTests package`
- If the local Java or Maven folders are missing, install Java 17 ARM64 and Maven 3.9+ from their official distributions into `work/tools/`, then run the build command above. Do not install into or change ownership of system/Homebrew directories to work around local permissions.
- Start the app from the repository root with:
  `JAVA_HOME="$PWD/work/tools/jdk-17.0.21+9/Contents/Home" "$PWD/work/tools/jdk-17.0.21+9/Contents/Home/bin/java" -jar backend/target/career-copilot-1.0.0.jar --server.port=8081 --server.address=127.0.0.1 --spring.datasource.url="jdbc:h2:file:$PWD/work/data8081/localdb"`
- Keep the Java process attached to a persistent terminal session. If a detached session is explicitly needed, use `nohup` and redirect output to `work/startup.log`; verify it stays up after the launch command returns.
- Before starting, inspect port 8081 with `lsof -nP -iTCP:8081 -sTCP:LISTEN`. If it is occupied by a stale Career Copilot process, stop that process gracefully before relaunching; duplicate instances can lock the H2 file and make the page hang. Never kill a process until its command/cwd confirms it is this app.
- Verify startup by checking `http://127.0.0.1:8081/api/health` returns `status: ok`, `/` returns the page body, and `/styles.css` and `/app.js` return HTTP 200. A health response alone does not confirm static assets load.
- Use the separate H2 file `work/data8081/localdb` for the 8081 instance to avoid colliding with the default local database. Do not add `AUTO_SERVER=TRUE` in environments that block H2's secondary socket.
- Keep downloaded runtimes, Maven cache, logs, database files, and other generated files under `work/`; do not commit them.
- A prior startup issue came from the nested `WorkspaceRepository` interface not being discovered by Spring Data. The application now provides it through `JpaRepositoryFactory` in a `@Bean`; retain this wiring unless the repository is moved to a top-level package and verified.
- Current UI includes application tracking, profile editing, and a recent-activity list backed by the existing workspace `activity` array. Preserve escaping of user-controlled values and existing local-storage fallback.
