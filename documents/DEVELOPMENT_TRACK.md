# Career Copilot Development Track

This is the working checkpoint log for feature development. Keep it concise and update it whenever a feature is started, completed, deferred, or materially reprioritized. Use `MILESTONES.md` for milestone scope and exit criteria.

## Current checkpoint

- **Product stage:** Local MVP; single shared workspace, no authentication.
- **Current branch:** `codex/resume-match`.
- **Current pull request:** Not opened yet.
- **Included work:** M0 local MVP baseline, complete local setup handoff, Java and frontend GitHub Actions builds, and resume-to-job skill matching in progress.
- **Build checkpoint:** Maven package and frontend build passed. A local smoke check on port 8082 confirmed the health/page endpoints, public job-page extraction, and rejection of a loopback URL. Automated tests were not run.
- **Local UI note:** Port 8081 still serves the pre-feature process (PID 48651). This shell could not signal it, and Terminal UI control is restricted; restart with the documented command to load the feature on 8081.
- **Next checkpoint:** Open the feature PR, then continue M1 reliability and automated coverage.

## Work log

| Checkpoint | Change | Status | Evidence / follow-up |
|---|---|---|---|
| Baseline | Application tracker, profile editor, H2 persistence, CSV export, local fallback | Existing | No automated tests found at the last inspection. |
| M0 | Repository startup fix, recent activity, agent handoff notes | Complete | PR #4 merged. |
| CI | GitHub Actions Java verification and frontend static build checks | In progress | Added on `codex/resume-match`; workflow runs Maven `clean verify` and `npm run build` on pull requests. |
| Resume match | Saved resume text, pasted or public URL job input, skill coverage score and skill lists | In progress | Current branch `codex/resume-match`; Java package and frontend sync/build passed; URL smoke check read a public page and rejected loopback. |
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
