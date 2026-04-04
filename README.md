# Credora

A web app for coordinating **card-linked offers** between trusted members: list safe card metadata, search what others have shared, and send or manage **share requests** in one place.

**Security note:** The product intentionally stores only **non-sensitive metadata** (network, issuer nickname, last four digits). Never collect or store full PAN, CVV, PIN, or magnetic stripe data—that requires PCI compliance and creates serious legal risk.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router, React 19, Server Actions)
- [Supabase](https://supabase.com/) (Auth + Postgres + Row Level Security)
- [Tailwind CSS v4](https://tailwindcss.com/)

## What you need from Supabase

1. Create a project at [supabase.com](https://supabase.com/).
2. Open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public` key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In **Authentication → Providers → Email**, turn **Confirm email** off while you are prototyping (no verification, as requested).
4. Under **Authentication → URL Configuration**, set **Site URL** to `http://localhost:3000` for local dev, and add the same under **Redirect URLs**.

## Database (create tables from your machine)

Supabase’s **anon** key only uses the REST API; it **cannot** run `CREATE TABLE` (that would be unsafe). You apply the schema with a normal **Postgres** connection, once:

**Option A — password in the terminal (no `DATABASE_URL` in files)**  
Keep `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` (you already have it). Then run:

```bash
npm run db:apply
```

When prompted, type your **database password** (the one from Supabase → Project Settings → Database; it is not echoed). The script connects to `db.<your-ref>.supabase.co:5432`.

**Option B — `DATABASE_URL` in `.env.local`**  
Supabase → **Database** → **Connection string** → **URI**, paste into `.env.local`, then `npm run db:apply` (no prompt).

Either way, this runs `supabase/schema.sql` and creates `profiles`, `cards`, `share_requests`, RLS, and the signup trigger.

## Local setup

```bash
cp .env.local.example .env.local
# Add NEXT_PUBLIC_* vars and DATABASE_URL, then:

npm install
npm run db:apply
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## App structure

| Area | Purpose |
|------|---------|
| `/` | Landing |
| `/signup`, `/login` | Email + password auth |
| `/dashboard?tab=uploaded` | Add/remove your listed cards |
| `/dashboard?tab=search` | Search others’ cards; send a share request |
| `/dashboard?tab=requests` | Incoming and outgoing requests |

## Production checklist

- Re-enable **email confirmation** (or add magic links / OAuth).
- Tighten RLS or move sensitive transitions to **database functions** if you expose the REST API directly.
- Add terms of use covering issuer rules and local regulations for sharing payment methods.
- Replace password auth with your preferred enterprise flow if needed.
