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
