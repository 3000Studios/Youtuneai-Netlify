# Youtuneai-Netlify
High-conversion Netlify landing site for YouTuneAI - built for traffic, funnels, and monetization.

## Voice Admin (Netlify Identity + Functions)
Admin console: `/admin`

Required Netlify environment variables:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default: gpt-4o-mini)
- `GITHUB_TOKEN` (repo write + PR scope)
- `GITHUB_REPO` (format: owner/repo)
- `GITHUB_BASE_BRANCH` (optional, default: main)
- `ADMIN_ROLE` (optional, set to require that Netlify Identity role)

Enable Netlify Identity in the Netlify dashboard before using the admin console.
