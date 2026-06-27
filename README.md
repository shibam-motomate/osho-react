# Osho React App

React/Vite version of the Osho discourse web app.

## Run Locally

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

The production output is generated in `dist/`.

## Google Analytics

Set this environment variable before building:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For local development, copy `.env.example` to `.env.local` and replace the placeholder.

## Netlify

Build command:

```bash
pnpm install --frozen-lockfile && pnpm build
```

Publish directory:

```bash
dist
```

Environment variable:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
