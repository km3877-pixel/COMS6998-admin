# Admin app progress and handoff

## October 19, 2026: Repository setup

- User created https://github.com/km3877-pixel/COMS6998-admin.git.
- Cloned the initially empty repository to
  `C:\Users\meeple\IdeaProjects\COMS6998-admin`, beside the consumer app.
- Added admin-specific guidance, README and the updated Week 6 requirements.
  No application, dependencies, Vercel project or database changes yet.
- Main app: `../COMS6998`. Course/source context and the newly supplied PDF
  remain in its Documentation directory. The copied Week 6 brief's source-PDF
  reference refers to that consumer repository's Documentation directory.
- Current assignment deadline: at the user's Feedback Group meeting during
  October 19–23; exact meeting time unknown. Rubric: feedback 50/admin 50.
- Consumer feedback already addressed in code: sign-in return/header fixes,
  upload-only Create with required written or AI caption, feed text/button
  cleanup and automatic scrolling. User confirmed the OAuth wildcard fixed
  commit-specific URL login. Later production QA/submission remains unconfirmed.
- Consumer schema includes profiles, caption images, captions/runs, votes/events
  and generation records. No is_superadmin field was found in its local sources.
  Hosted schema and owner account for the initial privilege grant need checking.
- Secrets were not copied. Do not commit environment files with real credentials.

## Next

1. Open this folder as the Codex/IDE project and start an admin-focused chat.
2. Inspect sibling consumer schema and current course requirements.
3. Scaffold the admin app here; implement authorization before exposing data.
4. Build statistics, profile reads, media CRUD and ratings reads.
5. Create the separate Vercel project from this GitHub repository once it has
   runnable code; configure its variables and callback URLs, test both roles
   and submit both apps' latest commit-specific URLs.

Setup files are uncommitted. No commit, push or deployment has been performed.

## October 19, 2026: Authentication foundation

- Built the separate Next.js 16.3.5 app with pinned dependencies, Google OAuth
  PKCE login, fixed callback destination, server-side sign-out, denied screen
  and protected admin overview shell. Users/media/ratings are explicitly marked
  upcoming; no fabricated statistics or administrative data features yet.
- The server guard validates the user with Supabase Auth, checks verified JWT
  subject/expiry, requires Google provider and OAuth authentication, then invokes
  the current-caller `is_admin()` RPC on each request. A protected API example
  returns 401/403/503 on failure. No service-role credential is used.
- Prepared, but DID NOT APPLY, `202610190001_admin_access.sql`. It creates
  private owner-managed membership and a narrowly granted boolean RPC, with no
  existing consumer RLS, profile function, ownership, vote or provenance changes.
  The private table avoids adding a privilege to browser-editable profiles.
- Copied only the two public Supabase configuration variables from the consumer
  app into ignored `.env.local`. Configured host is
  `thrkmilojkqqntdnrgwo.supabase.co`; hosted project/schema are not verified.
  Admin cookies use a separate name to avoid consumer collisions on localhost.
- Reviewed bundled Next.js auth/proxy/cookies/redirect docs and Supabase SSR
  documentation. Installed dependencies after approved network access.
- Local verification: production build passed; authorization unit tests and
  PGlite SQL role/permission tests passed. Covered missing/expired/forged session
  handling, non-Google/password sessions, editable metadata, strict boolean
  membership, database failure and immediate privilege revocation.
- Running production HTTP tests passed for login/denied entry points,
  anonymous and forged-cookie admin access, RSC redirect payload, API 401 and
  invalid callbacks. RSC uses a redirect instruction within HTTP 200, so the
  test checks its payload rather than incorrectly demanding HTTP 307.
- Headless browser checks passed: desktop/mobile login, no horizontal overflow
  or browser exceptions, anonymous redirect, denied screen and sign-out.
  Visually inspected desktop and mobile login screenshots in ignored `.tools`.
- Supabase integration was found but is not installed/connected. No hosted
  migration, owner grant, live Google OAuth success, Vercel setup, commit, push
  or deployment is claimed. Full admin/ordinary-user OAuth testing remains.
- Local preview runs at `http://localhost:3001/login`. See `AUTH_SETUP.md`
  for verified-target requirements, owner bootstrap and deployment steps.

### Next steps after this build

1. Connect Supabase; verify intended project and hosted schema.
2. Apply reviewed migration and add localhost admin callback to Auth allowlist.
3. User explicitly identifies the owner Google account; verify exact Auth UUID
   and grant membership through a trusted channel.
4. Verify real Google login, ordinary-user denial and admin access/revocation.
5. Connect this repository to its own Vercel project; configure environment and
   its own production/preview/commit-specific OAuth callback URLs.

## October 19, 2026: Minimal interface

- User requested a functional, barebones admin panel with clear labels.
  Keep this design preference for subsequent admin features.
- Removed promotional copy, decorative graphics, custom web fonts, colored
  banners and sidebar cards. Login is a plain heading and Google button.
  The protected overview uses an account header, sign-out and a simple table
  explicitly labeling unfinished features. Access errors use direct wording.
- Authentication and database authorization logic are unchanged.
- Local production build, HTTP smoke checks and desktop/mobile browser checks
  passed. Visually inspected the simplified mobile login; no horizontal overflow
  or browser exceptions. Local preview remains on port 3001.
- Hosted Supabase setup, first-admin grant and deployment remain pending.

## October 19, 2026: Restrained color and formatting

- User refined the design preference: functional and clear, with some color
  and formatting rather than completely bare styling.
- Added muted blue buttons/headings, a pale gray background, white panels,
  consistent spacing, a tinted admin header and alternating table rows.
  Retained direct copy and system fonts; authentication is unchanged.
- Production build and desktop/mobile browser checks passed. Inspected the
  desktop login screenshot. Local preview remains on port 3001; no deployment.

## October 19, 2026: Login redirect report

- User reports Google login returns to the original consumer website.
- Rechecked the admin code: it requests the current origin's `/auth/callback`,
  and that callback only redirects locally to `/admin` or `/login`.
- Likely cause is the pending Supabase redirect allowlist entry for
  `http://localhost:3001/auth/callback`. Hosted settings have not been inspected,
  so this diagnosis is not yet confirmed.
- No connected Supabase tool or browser tab is available to edit/verify those
  settings. Add the exact local callback under Authentication > URL Configuration
  > Redirect URLs, retaining the consumer Site URL, then retry from localhost.
- No code change, hosted configuration change or successful OAuth retest claimed.

## October 19, 2026: MCP authorization and local network fix

- Added the user-supplied project-scoped Supabase MCP server using Codex CLI.
  The user completed OAuth; CLI returned "Successfully logged in."
  Supabase tools are not yet exposed in this existing chat session.
- Investigated the subsequent local `sign_in_failed` report. A server-side
  request to Supabase Auth settings failed with EACCES inside the sandbox and
  returned HTTP 200 outside it. The preview server had been started sandboxed.
- Stopped that server and restarted port 3001 with approved network access.
  HTTP access-control smoke checks passed afterward. User must start a fresh
  Google login to verify the complete exchange; no end-to-end success claimed.
- No hosted schema or data changes made. Admin migration/owner bootstrap remain
  pending. A new/reloaded Codex session may be needed to expose the new MCP tools.

## October 19, 2026: Supabase agent skills

- Ran the user-requested `npx skills add supabase/agent-skills`, targeting Codex
  non-interactively in this project.
- Installer completed successfully; verified `supabase` and
  `supabase-postgres-best-practices` SKILL.md files under `.agents/skills`.
  Installer also created `skills-lock.json`.
- This installs guidance only; it does not apply database changes or verify
  that MCP tools have loaded into the current session.

## October 19, 2026: Admin permission error confirmed

- User now reaches "Access check unavailable" after Google login.
- Read-only call to this project's `/rest/v1/rpc/is_admin` returned HTTP 404,
  PGRST202: `public.is_admin` without parameters is absent from the API schema
  cache. This matches the still-unapplied admin migration.
- Supabase MCP OAuth previously completed, but no Supabase tools are exposed
  in the current session. Reload/reopen Codex to load the configured MCP before
  hosted schema inspection and migration. No credentials were extracted and no
  database changes were made.
- Need the user's explicit owner Google email, then trusted verification of its
  Auth UUID, before granting the first admin membership.

## October 19, 2026: Hosted admin setup and owner grant verified

- MCP tools became available after restart. User explicitly authorized admin
  access for `km3877@columbia.edu`.
- Verified MCP project URL matches `thrkmilojkqqntdnrgwo.supabase.co`.
  Inspected hosted profile columns/constraints and confirmed admin objects absent.
  Exactly one matching user had confirmed email, matching Google identity and
  an existing profile: `3a6475d9-ebdb-4830-83f8-b149e801eb71`.
- Read logs and security/performance advisories before changes. Applied the
  locally tested admin_access migration; hosted version is `20261020042634`.
  Renamed the local migration to match that authoritative version.
- Granted membership to the exact verified account through MCP SQL, with
  UUID/email/Google identity/profile predicates. There is exactly one admin.
  No existing consumer policies, votes, ownership or provenance were changed.
- Hosted transaction-scoped role/claim tests: owner Google OAuth=true;
  nonmember=false; owner password session=false. Permission inspection confirms
  authenticated cannot access the private schema, read memberships or insert
  them; anon cannot execute is_admin. Public API now returns expected 401/42501
  instead of missing-function 404.
- Post-change advisories flag the intentionally policy-free private membership
  table and authenticated security-definer RPC. This narrowly scoped RPC returns
  only the caller's membership boolean, fixes search_path and denies anon.
  See [RLS policy advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
  and [function advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
  Pre-existing consumer advisories were not altered in this task.
- Local eight-test suite passed before application; final browser access using
  the owner's actual session remains user-confirmed QA, not a claimed result.
  Vercel setup/deployment and data-management features remain pending.

## October 19, 2026: Live statistics dashboard

- User confirmed the local panel is accessible and requested totals, activity,
  most-liked posts, and approval rates for the three original caption styles.
- Inspected the verified hosted project and consumer vote implementation.
  Styles are dry_self_deprecating, internet_voice and college_twist; human and
  on_demand are separate and excluded from the three-style comparison.
- Added all-time totals (profiles, image posts, current votes), a UTC activity
  chart with 7/30/all-time filters and expandable exact daily counts, top 10
  published images ranked by aggregate net caption score, overall style approval,
  and paginated per-image comparisons with expandable caption text.
- Current votes drive totals/rankings/approval. Immutable events drive activity;
  the UI labels them "vote actions" (new/changed votes) and separately lists
  removals. Date filter applies only to activity. Earlier caption versions are
  included and labeled in per-image details. No votes displays "No votes yet".
- Created migration with Supabase CLI, tested locally in PGlite, then applied
  via MCP; local filename matches hosted version 20261020044012_admin_dashboard.
  Added only an admin-checked aggregate RPC, with fixed search_path, anonymous
  execution revoked, and live membership checked inside the database.
  No existing table grants, consumer policies, or source data were changed.
- Media endpoint independently verifies Google session/admin membership and
  uses existing Storage RLS for published derivatives; no service-role secret,
  signed URL bypass or extra Storage policy. Unpublished images are labeled.
- Live result at verification: 3 profiles, 63 images (33 published), 31 current
  votes. Style approvals: dry 8/13, internet 4/6, college 7/7; 5 other-style votes.
  60 images have all three original styles; 12 per comparison page.
- Verified owner RPC success, non-admin rejection, anonymous execution denied,
  seven-day/all-time output lengths, last-page output and 33 readable media
  objects under owner Google claims.
- Post-change advisor flags the authenticated SECURITY DEFINER RPC as expected:
  it intentionally returns admin-only aggregates after a membership guard.
  [Advisor documentation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Ten local tests and production build passed. HTTP tests verify anonymous,
  forged-cookie/RSC and media access restrictions. Isolated rendering of the
  actual dashboard component with the verified RPC result passed desktop/mobile
  overflow, disclosure and link checks; desktop screenshot inspected. That
  visual fixture does not establish authenticated browser thumbnail loading.
- Restarted production preview with network access at localhost:3001. User's
  authenticated browser confirmation of the new dashboard remains pending.
  No Vercel deployment, commit or push performed.

## October 19, 2026: Dashboard navigation and dropdowns

- User requested selectable views instead of a long page of all statistics.
- Added Overview, Activity, Most-liked posts and Caption styles navigation.
  Only the selected section renders; Overview defaults to the three totals.
- Added automatic GET dropdowns for activity date range, top 5/10 posts, and
  overall/per-image style comparisons. No-JavaScript users get an Apply button.
  View/filter/page state is in the URL; pagination retains the style view.
- Database aggregates and authorization are unchanged. Production build and
  HTTP authorization checks passed.
- Isolated browser checks against actual view components verified menu changes,
  dropdown submissions, top-five row count, style-mode isolation, pagination,
  refresh persistence and mobile width. Inspected desktop Overview screenshot.
- Restarted the local preview on port 3001. No deployment performed.

## October 19, 2026: Users, media management and ratings

- Added primary Statistics / Users / Media / Ratings navigation. Users and
  ratings are searchable, paginated, read-only lists. Ratings distinguish current
  selections, vote events/removals, and deleted-post event history.
- Verified project `thrkmilojkqqntdnrgwo` and actual consumer constraints/FKs.
  Applied migration `20261020050449_admin_management`; all new RPCs check live
  trusted admin membership and deny anonymous execution. No consumer table
  grants, RLS policies, ownership rules or Supabase-managed schemas changed.
- Media supports reading published/draft records, editing descriptions and the
  original three AI caption styles, publishing/unpublishing, and confirmed
  deletion. Caption edits create a new UUID and deactivate the previous version;
  existing votes stay attached to their original text. Personal/on-demand and
  human captions remain read-only to preserve existing ownership constraints.
- Delete atomically snapshots image, captions, runs, exposures, impressions,
  current votes, events and generation requests into private audit storage,
  then removes those active records in FK order. Private image derivatives are
  retained as audit artifacts; the deleted record cannot be served through the
  admin endpoint or consumer RLS. Shared batches remain. There is no restore UI.
  Pending generation blocks deletion; writer locks have a three-second timeout.
  Existing consumer source rows were not edited or deleted during verification.
- Creation code uploads a still JPEG/PNG/WebP, normalizes it to a WebP derivative
  below 256 KB, generates the three style captions with Gemini, and saves an
  unpublished draft. Provider provenance is retained. Reservations prevent
  duplicate submissions and cap creation at 20/day and one per 30 seconds.
  A failed/ambiguous save retains the private uploaded artifact because the DB
  may have committed; compare `admin/<request UUID>.webp` with media records
  before manual orphan cleanup. Creation does not generate the image pixels.
- Every new page/action/media endpoint checks server-side Google/admin access.
  Private Storage access uses a server-only service-role client after checks;
  the object path comes from a protected DB record, not browser input.
- **Configuration still pending:** neither `SUPABASE_SERVICE_ROLE_KEY` nor
  `GEMINI_API_KEY` was found in local process variables or the consumer's
  `.env.local`. Asked for a local credentials-file path, not key values in chat.
  Create is disabled with a setup notice until both are present. Published
  thumbnails retain the existing authenticated RLS fallback; draft previews
  require the service-role key. No real provider call/upload was performed.
- Twelve local tests passed, including realistic FK/uniqueness constraints,
  versioned edits preserving votes, archive deletion, pending-job protection,
  non-admin/anonymous/revoked access, image validation and mocked provider output.
  Hosted rollback-only synthetic CRUD verification passed; existing data remains
  3 profiles, 63 media records, 31 current votes and 51 vote events.
- Hosted advisors flag intentional policy-free private tables and authenticated
  security-definer RPCs; internal membership guards are verified. Existing
  unrelated consumer advisories remain unchanged.
- Production build passed. HTTP smoke checks passed for all new routes with
  anonymous/forged sessions. Isolated rendering of actual page components passed
  desktop/mobile layout and delete-confirmation checks; screenshot inspected.
  This is not authenticated browser or live provider/storage end-to-end QA.
- Dependency audit found existing Next.js issues and a sharp advisory; pinned
  patched Next.js 16.3.8 and sharp 0.35.5. Final install audit: zero vulnerabilities.
  Local preview restarted on port 3001. No Vercel deployment, commit or push.
  Provider structured output checked against
  https://ai.google.dev/gemini-api/docs/structured-output and Storage service-key
  behavior against https://supabase.com/docs/guides/storage/security/access-control.

## October 19, 2026: Local creation credentials configured

- On the user's request, rechecked the consumer `.env.local`; both required
  server-only keys are now present. Copied only `SUPABASE_SERVICE_ROLE_KEY` and
  `GEMINI_API_KEY` into the admin `.env.local` without displaying their values.
  Verified source and destination point to `thrkmilojkqqntdnrgwo`.
- Confirmed `.env.local` is ignored by Git. Read-only checks returned HTTP 200
  for the private caption-images bucket and configured Gemini model.
- Restarted the local admin server on port 3001 to load the credentials.
  This supersedes the pending local configuration note above. Actual AI
  generation/upload through an authenticated browser remains unverified.
  No Vercel environment changes or deployment performed.

## October 19, 2026: Vercel preparation

- User authorized starting Vercel setup for this separate admin app.
- Confirmed the admin GitHub remote is empty and local main has no commits.
  Prepared the initial application commit, deployment configuration and upload
  exclusions. Real environment files, local tools/skills and supplied course
  PDFs are excluded. A scan of staged content found no configured API key values
  or private-key blocks.
- Vercel project creation is still pending account access. The discovered
  Vercel plugin is not connected, no authenticated CLI was found in PATH, and
  the available browser inventory is empty. Requested the Vercel connection.
  No admin project, environment settings, redirect allowlist or deployment has
  been created/changed yet.

## October 19, 2026: Vercel project configured

- Initial application commit `845d75e` was pushed to the admin GitHub repository.
  User completed Vercel CLI device authorization after installing the plugin.
- Created and verified separate project `coms6998-admin`
  (`prj_ADZ6oWfHROEis5OvjRq2C83PqU0f`) in `km3877-coms-6998`
  (`team_73LcaBA92Qh0sAoP7qW9UgC0`), with Next.js and Node 24.x.
- Connected `km3877-pixel/COMS6998-admin` through the Vercel Git integration.
  Saved the four required environment variables for Production and Preview;
  Supabase service-role and Gemini keys are Secrets. Values were transmitted
  through stdin and not displayed or committed. Local environment retained.
- Disabled the project's Vercel Authentication protection to satisfy the course
  brief. Application Google/admin authorization remains enforced.
- First Git deployment and Supabase callback allowlist verification are next;
  no successful live deployment is claimed by this entry.
- First Git build failed because an unanchored `supabase` exclusion in
  `.vercelignore` also removed `lib/supabase`. Anchored exclusions at the root;
  CLI dry run now includes all four app Supabase modules and excludes local
  environment files. Pinned Node 24.x to match the configured runtime.

## October 19, 2026: First verified admin deployment

- Git commit `04a9194fdc046239a25799c8e576f5832c48618d` deployed successfully:
  `dpl_81DoPCZ2EdFQ5hJ7KWCkccWit2UN`, production, status Ready.
- Production URL:
  https://coms6998-admin-km3877-coms-6998.vercel.app
- Commit-specific URL:
  https://coms6998-admin-ga4wyw6va-km3877-coms-6998.vercel.app
- Additional assigned aliases: `coms6998-admin-five.vercel.app` and
  `coms6998-admin-git-main-km3877-coms-6998.vercel.app`.
- Unauthenticated public requests reach the app without Vercel's login wall.
  The full HTTP smoke suite passed on the commit-specific URL, including
  anonymous/forged sessions, protected routes, RSC redirects, API/media 401s
  and invalid callbacks. Production alias login returned 200, admin redirected
  to login, and session API returned 401.
- Downloaded the ten JavaScript assets referenced by the production login page;
  neither configured private key appeared in those assets.
- **Pending user action:** connected Supabase MCP lacks Auth configuration
  tools; Supabase CLI is not authenticated. Asked user to add these redirects
  while preserving the existing consumer Site URL and redirect entries:
  `https://coms6998-admin-km3877-coms-6998.vercel.app/auth/callback`
  and `https://coms6998-admin-*-km3877-coms-6998.vercel.app/auth/callback`.
  These cover the recommended production URL, branch and immutable deployment
  URLs. The short `coms6998-admin-five.vercel.app` alias needs its own exact
  callback if used for sign-in.
- Actual hosted Google sign-in, authenticated page reads and provider/media
  mutations remain unverified. No submission was made. This journal entry is
  a local post-deployment record; the verified deployment is the commit above.

## October 19, 2026: Hosted permission-check investigation

- User reported "Access check unavailable" after Google sign-in. Hosted owner
  membership and authenticated EXECUTE permission remain present.
- Supabase logs at 2026-10-20 05:42:15 UTC show a successful Auth user request
  followed by is_admin responses 200 and 401. The failed response proxy-status
  identifies PGRST303 (JWT claims validation/parsing). The precise cause is
  not yet established; no membership, RLS, or key changes were made.
- Added one delayed retry specifically for PGRST303, repeating Google identity,
  token and database membership checks. Persistent failures still deny access.
  Added sanitized server diagnostics containing only stage, constrained error
  code, classified reason, HTTP status and attempt number.
- Local validation: all 15 tests passed, including retry bounds, revocation,
  sign-out during retry, and diagnostic redaction. Production build passed.
  Deployment and user-authenticated verification are pending for this change.
