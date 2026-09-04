# GitHub Pages Deploy

This app is configured to deploy like the current `imotive.se` website: a static GitHub Pages site with the domain attached through a `CNAME` file.

## What is configured

- `public/CNAME` contains `imotive.se`.
- `public/.nojekyll` keeps GitHub Pages from ignoring the Expo `_expo` asset folder.
- `.github/workflows/deploy-github-pages.yml` builds `npm run build:web` and publishes `dist-web` to GitHub Pages.
- The workflow passes the optional repository variable `EXPO_PUBLIC_SYNC_URL` into the web build. Set that variable when a hosted sync API is available.

## GitHub setup

1. Push this project to the GitHub repository that should host Peak 25.
2. In GitHub, open the repository settings.
3. Go to `Pages`.
4. Set `Source` to `GitHub Actions`.
5. Run the `Deploy GitHub Pages` workflow or push to `main`.

## Sync note

GitHub Pages only hosts static files, so it cannot run `scripts/sync-server.cjs`.
The deployed site will work as a local tracker by default. For shared tracking across devices from the public site, host the sync API separately or replace it with Supabase/Firebase, then add that API URL as the repository variable `EXPO_PUBLIC_SYNC_URL` before deploying.

## Domain handoff

The current DNS for `imotive.se` already points to GitHub Pages:

- Apex `A` records point to GitHub Pages IPs.
- `www.imotive.se` is a `CNAME` to `vladm5x.github.io`.

To move the domain without deleting the old website, remove the `CNAME` file or custom domain setting from the old GitHub Pages repository, then keep the DNS records as they are. The Peak 25 repository will claim `imotive.se` through `public/CNAME` after GitHub Pages deploys.
