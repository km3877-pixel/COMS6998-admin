# Admin authentication setup

## Implemented locally

Google OAuth uses Supabase PKCE and a fixed `/auth/callback` destination.
The callback establishes a session and redirects to `/admin`, whose server
guard independently checks the user, verified JWT and current `is_admin()` result.
The API example at `/api/admin/session` performs the same checks.
No membership is cached across requests. Database/auth failures deny access.

Admin cookies have their own name so localhost ports do not share the consumer
session. Sign-out is a POST Server Action with Next.js origin protection.
It remains available to non-admin users and never reads administrative data.

The panel includes live statistics, user lists, media CRUD and detailed ratings.
Its guarded media endpoint serves published and draft images; draft access uses
a server-only Storage client after Google/admin checks.
Every new data function, action and media/API handler must independently invoke
the guard. Privileged database operations must also enforce current membership
inside their transaction; a page/layout check alone is insufficient.

## Database setup — applied October 19, 2026 (Pacific)

Local consumer configuration points to `thrkmilojkqqntdnrgwo.supabase.co`.
MCP verified that same project URL and inspected the hosted profile schema.
Migration `20261020042634_admin_access.sql` is applied. The explicitly
identified Google account `km3877@columbia.edu` is the sole approved admin.
Database checks pass for its Google OAuth identity and reject non-members and
password sessions. The public API now rejects anonymous RPC access with 401
instead of reporting a missing function. Browser sign-in after the grant still
needs user confirmation.

The following describes setup for a fresh environment; do not reapply the
migration to the configured project:

1. Connect Supabase and verify that project against the consumer deployment.
2. Inspect hosted `public.profiles`, grants, RLS, and existing `is_admin` or
   `admin_private` objects. Do not overwrite existing objects blindly.
3. Apply `supabase/migrations/20261020042634_admin_access.sql` as database owner.
   It creates a private membership table and a current-caller boolean RPC.
   It does not alter consumer tables/policies or Supabase-managed schemas.
4. Enable/confirm the existing Google provider in Supabase Auth.
5. Add `http://localhost:3001/auth/callback` to Auth's redirect allowlist.
6. Sign in with the intended owner's Google account. Through a trusted
   administration channel, verify its exact Auth UUID, Google identity, email
   and matching profile. The user must explicitly identify the owner.
7. Only after that verification, grant that exact UUID:

   ```sql
   -- Replace only after explicitly verifying the intended owner.
   insert into admin_private.members (user_id)
   values ('VERIFIED_OWNER_UUID'::uuid);
   ```

   To revoke:

   ```sql
   delete from admin_private.members
   where user_id = 'VERIFIED_OWNER_UUID'::uuid;
   ```

There is no grant endpoint, email allowlist, first-signup promotion or
browser-writable admin field. Ordinary profile updates cannot change membership.
No service-role credential is required by this authentication foundation.

## Local use

Node 22+ is required. Run `npm install`, `npm test`, `npm run dev`.
The dev server uses port 3001 to avoid the consumer app's port 3000.
Use `.env.example` for public configuration names and `.env.local` for values.
Never commit real environment files. A production build is `npm run build`.

## Deployment and live verification — still pending

Create this repo's own Vercel project and configure both public Supabase
variables plus server-only `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` in
Production and Preview. Use the same verified Supabase project as the consumer.
Add this admin project's production,
preview and commit-specific callback URLs to Supabase; do not rely on the
consumer project's wildcard. Leave the consumer Site URL intact.

Disable Vercel deployment protection per the course brief; retain application
authentication/authorization. Test in Incognito:

- Signed-out `/admin` redirects to login; `/api/admin/session` returns 401.
- Ordinary Google user gets no admin content; API returns 403.
- Approved Google admin gets the shell and API 200.
- Expired/invalid session cannot enter.
- Revoke membership and reload; access is denied immediately.
- Callback with missing, duplicate or invalid code cannot establish access.
- Sign out, switch account, then confirm no previous-session content is returned.

Unit tests simulate authorization responses; they do not establish live Google
OAuth success or deployment correctness.

Reference: [Supabase SSR documentation](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
