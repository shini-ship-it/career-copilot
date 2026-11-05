# Career Copilot Development Track

This is the working checkpoint log for feature development. Keep it concise and update it whenever a feature is started, completed, deferred, or materially reprioritized. Use `MILESTONES.md` for milestone scope and exit criteria.

## Current checkpoint

- **Product stage:** Local MVP; single shared workspace, no authentication.
- **Current branch:** `codex/recent-activity-handoff`.
- **Current pull request:** [#4 — Add recent activity and local setup guidance](https://github.com/shini-ship-it/career-copilot/pull/4), open and unmerged at the last update.
- **Included work:** Spring Boot repository wiring fix, tracker recent-activity panel, and local setup instructions in `AGENTS.md`.
- **Build checkpoint:** Maven package succeeded with tests skipped. The local app was verified on port 8081; health, page, CSS, and JavaScript endpoints returned successfully after restarting the stale process.
- **Next checkpoint:** Establish automated backend and browser-facing coverage, then address the remaining MVP reliability gaps listed under M1 in `MILESTONES.md`.

## Work log

| Checkpoint | Change | Status | Evidence / follow-up |
|---|---|---|---|
| Baseline | Application tracker, profile editor, H2 persistence, CSV export, local fallback | Existing | No automated tests found at the last inspection. |
| Current | Repository startup fix, recent activity, agent handoff notes | In PR | PR #4; update status after review or merge. |
| Next | MVP reliability and test coverage | Planned | See M1 exit criteria in `MILESTONES.md`. |

## Feature request workflow

For each new feature request:

1. Add the feature to the relevant milestone, or create a new milestone if it changes scope materially.
2. Record its status here as **Planned**, **In progress**, **In review**, **Complete**, or **Deferred**.
3. As work proceeds, add the branch or PR and the verification evidence.
4. On completion, check off the milestone acceptance criteria and leave a brief checkpoint entry.
5. Preserve uncompleted requests and their next steps when handing work to another session.

## Status definitions

- **Planned:** agreed scope, no implementation started.
- **In progress:** implementation underway.
- **In review:** a PR is open and not merged.
- **Complete:** acceptance criteria are met and the change is integrated or explicitly accepted as complete.
- **Deferred:** intentionally postponed; retain the reason and revisit condition.
