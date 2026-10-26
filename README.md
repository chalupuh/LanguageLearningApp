# À l’Oreille

A French and Swedish listening-practice app running on Vinext, React, Cloudflare
D1, and R2. Lessons combine listening, contextual phrase review, rehearsal, and
retelling. French and Swedish learning data is isolated; appearance is shared.

Application code lives in `app/`, authored lessons and releases in `content/`,
learning rules and validators in `lib/`, and database migrations in `drizzle/`.
The hosting manifest preserves the existing Site identity and storage bindings.

Use `npm run typecheck` to generate scoped Worker types and check TypeScript,
`npm test` to build and run every test, or `npm run test:unit` after a successful
build to rerun tests. Render tests require `dist/server/index.js`. `npm run lint`
excludes generated runtime directories but still reports existing authored-code
lint debt. See `docs/review-fixes-2026-10-18.md` for validation and remaining work.

Local development uses the existing ignored environment configuration; production
configuration is managed by Sites. `ALLOWED_USER_EMAILS` controls invitations,
`OWNER_EMAIL` enables owner surfaces, and `OPENAI_API_KEY` enables optional AI
coaching. Never commit those values. Localhost uses a separate development identity.
No AI key is needed for bundled lesson audio or mocked automated tests.

## Working across devices

The shared source repository is [chalupuh/LanguageLearningApp](https://github.com/chalupuh/LanguageLearningApp).
The repository workflow for coding agents is in [AGENTS.md](AGENTS.md).

On a new device:

```sh
git clone https://github.com/chalupuh/LanguageLearningApp.git
cd LanguageLearningApp
npm ci
```

Before each work session, preserve any local edits and run `git fetch origin`.
On a clean `main`, run `git pull --ff-only origin main`. If it cannot fast-forward,
reconcile the changes before continuing; do not overwrite work from another device.

After verifying changes, commit them and run `git push origin main` (or push the
feature branch you are using). Fetch again and confirm the remote branch contains
the commit before switching devices. Avoid editing the same branch simultaneously
on multiple devices; use separate feature branches for concurrent work.

GitHub and Sites are separate destinations: Sites publication does not push to
GitHub, and a GitHub push does not publish the app. Push the source commits created
by the Sites workflow to GitHub as well. Local `.env*`, dependencies, build outputs,
and development databases are intentionally excluded. Configure each device locally;
production learning data remains in the hosted app.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This starter does not use `wrangler.jsonc`.

## Included Shape

- edit site code under `app/`
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/schema.ts` starts intentionally empty
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Email and name are intended for display or contact purposes.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty
`name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs
optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in
  or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity header injection. Do not implement app routes for
those reserved paths. Routes that do not import and call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the
Sites hosting platform's access policy controls for workspace-wide restrictions,
or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build the app and run the complete regression suite
- `npm run db:generate`: generate Drizzle migrations after schema changes

## Recording maintenance

Run `npm run audio:generate` (or `npm run audio:swedish`) with the existing ignored
`OPENAI_API_KEY` configuration to refresh the complete recording catalog. Both use
the same generator and resume completed turns from ignored `work/aligned-audio/`.
Each dialogue turn is synthesized separately using its assigned voice. PCM samples
are joined into one seekable WAV, with transcript/voice signatures and turn timings
in `content/audio-recordings.ts`. Changed text, voice, or speech instructions creates
a new recording URL. Bump `RECORDING_VERSION` when changing the generation policy.

Run `node --experimental-strip-types --test tests/passage-speech.test.mjs` to check
every catalog recording, speaker assignment, turn boundary, and missing-file fallback.
Do not replace a conversation with one narrator; ambiguous short phrases should
use the original conversation recording rather than guessing a speaker.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
