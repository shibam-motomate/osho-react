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

## Speed and offline

- **Artwork** is self-hosted in `public/art/` as small (`NN-sm.webp`, list rows) and large
  (`NN-lg.webp`, hero, cover, player) copies of the oshoworld.com photos. The originals are
  1–11 MB each, so never point the app back at them. `scripts/art/` has the source list and
  the resize script.
- **Service worker** (`vite-plugin-pwa`, configured in `vite.config.js`) keeps the code, both
  catalogues and the small artwork on the device, so the app opens instantly and works on a
  weak connection. After a deploy, an open app picks up the new version on its next launch.
- **Caching headers** in `netlify.toml` let browsers keep hashed assets, fonts and artwork for
  a year. If an artwork file ever changes, give it a new name.
- **Supabase** is loaded only when needed (a saved session, or opening the login screen), so
  guests never wait for it. See `src/lib/supabaseClient.js`.
- The first-visit load screen (quote + progress) shows once; later launches go straight to Home.

## Login & saved series (Supabase)

Login uses [Supabase](https://supabase.com) for auth, and saved series sync to a
`saved_series` table so they follow the user across devices. Guests can still
save series without logging in — those saves live in `localStorage` and get
merged into the account the first time they log in.

Set these before running/building:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Table + row-level security (run once in the Supabase SQL editor):

```sql
create table saved_series (
  user_id uuid references auth.users(id) on delete cascade not null,
  series_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, series_id)
);

alter table saved_series enable row level security;

create policy "Users can view their own saved series"
  on saved_series for select using (auth.uid() = user_id);
create policy "Users can insert their own saved series"
  on saved_series for insert with check (auth.uid() = user_id);
create policy "Users can delete their own saved series"
  on saved_series for delete using (auth.uid() = user_id);
```

If these env vars aren't set, the app runs fine without login — saved series
just stay local to the browser.

## Google Analytics

Set this environment variable before building:

```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Local development

Copy `.env.example` to `.env.local` and fill in the Supabase and Google
Analytics values above.

## Netlify

Build command:

```bash
pnpm install --frozen-lockfile && pnpm build
```

Publish directory:

```bash
dist
```

Environment variables:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
