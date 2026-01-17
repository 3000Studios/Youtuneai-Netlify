# Youtuneai-Netlify
High-conversion Netlify landing site for YouTuneAI - built for traffic, funnels, and monetization.

## Voice Admin (Cloudflare Worker)
Admin console: `/admin`

Required runtime env (set as Worker secrets):
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default: gpt-4o-mini)
- `GITHUB_TOKEN` (repo write + PR scope)
- `GITHUB_REPO` (format: owner/repo)
- `GITHUB_BASE_BRANCH` (optional, default: main)
- `ADMIN_ROLE` (optional; for now, admin runs without an IdP)

Deploy/CI env (not secrets in the Worker, but needed for `wrangler deploy`):
- `CF_API_TOKEN` (Workers Scripts + Workers Routes edit)
- `CF_ACCOUNT_ID`

Notes:
- Netlify Identity is not used in the Cloudflare deployment; the admin page will run in “Cloudflare mode”.
- Worker routes are set to `youtuneai.com/*` and `www.youtuneai.com/*`.

## Auto-sync (commit/push/deploy)
- A GitHub Actions workflow auto-deploys on every push to `main` (`.github/workflows/deploy.yml`).
- Optional local helper: `./auto-sync.ps1` will watch for changes, auto-commit, and push to `main` on a loop (Ctrl+C to stop). Configure via env:
  - `GIT_BRANCH` (default `main`)
  - `SYNC_INTERVAL` seconds (default `15`)
  - `COMMIT_PREFIX` (default `auto: sync`)
