# COMS6998 Admin

Separate Week 6 admin application for Punchline.

Repository: https://github.com/km3877-pixel/COMS6998-admin

The Next.js admin application includes Google login, server-side session and
database membership checks, an access-denied screen, and sign-out.
The dashboard now shows live user/post/vote totals, UTC activity with 7-day,
30-day and all-time filters, most-liked published posts, and overall/per-image
approval for the three original caption styles.
Users and ratings have searchable, paginated read-only lists. Media management
supports AI caption creation, draft review, editing, publishing and deletion
with retained audit history. Database setup and first-admin approval are complete.
Vercel deployment is still pending.

Run `npm install`, `npm test`, then `npm run dev` (port 3001).
See [authentication setup](Documentation/AUTH_SETUP.md) for environment,
database bootstrap and deployment instructions.

Vercel: import this repository as a separate Next.js project, use Node 24.x,
and configure the four variables in `.env.example` for Production and Preview.
Keep `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` server-only. Never upload
`.env.local`. Add the actual admin deployment callback URLs to Supabase Auth
before testing Google sign-in. See the journal for verified deployment status.

Start with [the Week 6 brief](Documentation/WEEK6_UPDATED_BRIEF.md) and
[the implementation journal](Documentation/JOURNAL.md).

Required features: useful statistics, profiles read access, AI media CRUD and
ratings read access. Google login and a database admin flag must protect admin
functionality. This app is intended to administer the existing consumer data;
verify the database target before implementation.
