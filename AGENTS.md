# Repository workflow

GitHub is the shared source of truth across devices:
https://github.com/chalupuh/LanguageLearningApp

## Before changing code

- Inspect `git status`, the current branch, and remotes. Preserve uncommitted work.
- Fetch `origin` and compare the current branch with its GitHub counterpart before editing.
- On a clean `main`, use `git pull --ff-only origin main` to bring in other-device changes.
- If histories diverge, reconcile them without discarding either device's work. Never force-push or reset away user changes.
- Use `codex/` branches for isolated work when needed; keep the shared `main` current with completed, verified changes.

## Finish and handoff

- Run checks appropriate to the change. For application changes, use `npm run typecheck`, `npm test`, and `npm run lint:baseline`; validate affected browser flows when available.
- Commit the finished changes, fetch again to check for intervening work, then push to GitHub. Verify the remote branch SHA matches the intended commit before reporting synchronization complete.
- A Sites deployment or push to the Sites source repository does **not** update GitHub. After Sites creates source commits, push those commits to the corresponding GitHub branch too. Keep `origin` pointing at GitHub.
- Follow the Sites publishing workflow for deployment; a GitHub push alone does not deploy this app.
- If authentication, permissions, or conflicts block synchronization, preserve all work and report exactly what remains local or unpublished.
- Include the branch and commit in a cross-device handoff so another device can fetch the same version.

## Local state and secrets

- Never commit `.env*`, credentials, `.sites-runtime/`, `.wrangler/`, generated build outputs, or private recordings and test artifacts.
- Keep `.openai/hosting.json` tracked with the existing Site identity and storage bindings.
- Each device needs its own ignored local configuration and dependencies; GitHub synchronizes source and bundled assets, not production user data or local databases.

## Studio agents (AIDevCompanyHQ engine)
- Work only on branches named `studio/<task>`; never commit to `main`.
- Open a PR labelled `owner-review`; the owner merges and publishes to Sites. The studio never deploys.
- Specs and intake work orders live in `docs/specs/` and `docs/intake/`.
- Progress: `node "<HQ>/.studio/studio.js" log <agent> <pct> "<msg>"` when the HQ checkout is present.
