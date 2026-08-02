# SafeDeck — Web frontend

React + Vite + TypeScript. Dashboard, deal detail, onboarding.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev          # localhost:3000
```

## Build

```bash
npm run build        # → dist/
npm run preview      # serve dist/ locally
```

## Test

```bash
npm test
```

## Deploy

The GitHub Actions workflow `.github/workflows/deploy-dev.yml` builds and uploads to S3 + CloudFront on push to `develop`.

## Local API target

Set `VITE_API_BASE_URL` in `.env.local` to point at your local SAM stack:
```bash
VITE_API_BASE_URL=http://localhost:3001
```

`sam local start-api` listens on 3000 by default; map to 3001 to avoid conflict with Vite.
