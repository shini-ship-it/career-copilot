# Repository guidance

## Project structure
- Keep the Spring Boot application in `backend/`.
- Keep the browser UI source in `frontend/`.
- The deployable UI is served from `backend/src/main/resources/static/`.
- Keep the frontend source and Spring Boot static copies in sync.
- Keep HTML in the page shell, styles in `styles.css`, and browser behavior in `app.js`.
- Group browser code into clearly named sections: state, DOM references, persistence, rendering, application actions, profile actions, and event bindings.

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
