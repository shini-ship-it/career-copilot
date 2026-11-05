# Career Copilot Milestones

Milestones are product checkpoints, not fixed delivery dates. Adjust ordering as feature requests arrive, and note the reason for material changes in `DEVELOPMENT_TRACK.md`.

## M0 — Local MVP baseline

**Status: In review** — current work is in PR #4.

- [x] Track applications through Saved, Applied, Interviewing, Offer, and Rejected.
- [x] Edit and delete applications; search and filter the tracker.
- [x] Store a professional profile in the workspace.
- [x] Persist the shared workspace through Spring Boot and local H2; retain browser local-storage fallback.
- [x] Export application data to CSV.
- [x] Record and display recent workspace activity.
- [x] Fix startup wiring for the nested workspace repository.
- [ ] Merge PR #4 after review.

**Exit criteria:** PR #4 is integrated; a fresh local setup can build and run the app, and the documented health, page, CSS, and JavaScript checks pass.

## M1 — Reliable, testable MVP

**Status: Planned.**

- [ ] Add GitHub Actions checks for Java and frontend builds on pull requests.
- [ ] Add automated tests for workspace API validation, load/save/delete, and repository persistence.
- [ ] Add frontend checks for tracker CRUD, search/filter behavior, profile save, and CSV export.
- [ ] Make startup and database behavior predictable when a second instance already owns the H2 file; document the recovery path.
- [ ] Add clear handling for backend save failures so local and server workspace state do not silently diverge.
- [ ] Verify responsive layout and keyboard operation for the application dialog and navigation.
- [ ] Confirm empty, loading, backend-connected, and local-fallback states are understandable.

**Exit criteria:** automated checks cover the core workspace flows, local startup and duplicate-instance behavior are documented, and manual smoke checks pass at desktop and narrow widths.

## M2 — Secure, per-user workspaces

**Status: Planned; prerequisite for public deployment with personal data.**

- [ ] Select an authentication approach and define session/token handling.
- [ ] Associate every workspace with an authenticated user and enforce authorization on every API operation.
- [ ] Add account lifecycle and recovery flows.
- [ ] Configure production HTTPS, secret handling, request limits, and safe logging.
- [ ] Add migration and backup/restore plans for user data.

**Exit criteria:** users can access only their own workspaces, security-sensitive configuration is externalized, and recovery is documented and verified.

## M3 — Structured job-search data

**Status: Planned.**

- [ ] Move applications from a single JSON workspace payload to normalized records with database migrations.
- [ ] Preserve existing tracker data during migration and provide a rollback or backup strategy.
- [ ] Add sorting and useful follow-up views, including overdue and upcoming dates.
- [ ] Improve activity history with meaningful records and retention rules.

**Exit criteria:** migrations are repeatable, user data survives upgrades, and tracker workflows remain available through the API and UI.

## M4 — Resume and AI assistance

**Status: Planned; scope and data handling need design before implementation.**

- [ ] Define resume file types, size limits, retention, and deletion behavior.
- [ ] Add resume upload and parsing with explicit user review of extracted details.
- [ ] Add job-to-profile matching with understandable reasons and user control.
- [ ] Keep AI suggestions assistive; do not submit applications or make decisions on the user's behalf.

**Exit criteria:** users can review and correct extracted information, understand match suggestions, and control stored resume data.

## M5 — Authorized job sources and alerts

**Status: Planned.**

- [ ] Select job sources with documented permission and supported access methods.
- [ ] Add saved searches and alert preferences with opt-in controls.
- [ ] Respect source rate limits and provide a way to pause or remove alerts.

**Exit criteria:** integrations use authorized access, alert delivery is user-controlled, and failures or source changes are visible.
