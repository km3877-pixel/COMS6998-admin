# Week 6: Admin Panel — current brief and implementation context

Received October 19, 2026 from the user's pasted assignment, rubric and lecture
notes. These are supplied course materials, not independently verified website
content. This document supersedes the older Week 6 deadline and feature summary
in Assignments_forclass.txt; the original source remains preserved.

## Deadline, deliverables and rubric

- Due at the student's Feedback Group meeting between **Monday October 19 and
  Friday October 23, 2026**. The student's specific meeting time is not supplied.
  Do not use the older October 22, 3 PM deadline for this updated brief.
- Create a **new GitHub repository and a new Vercel project** for the admin app.
  Do not scaffold it inside the existing consumer app.
- Build an admin interface with interesting statistics and thoughtful visual
  presentation, using actual database data.
- Required operations:

| Resource | Required operations |
| --- | --- |
| Users/profiles | Read |
| AI-generated media | Create, read, update, delete |
| Upvotes/downvotes/ratings | Read |

- Protect every admin area route with Google login **and** a trusted database
  privilege such as `profiles.is_superadmin = true`.
- Disable Vercel deployment protection so the site can be reached in Incognito.
  The application's own authentication and admin authorization must still apply.
- Submit the latest **commit-specific URLs of both apps**: consumer
  creation/rating app and admin app.

| Rubric category | Points |
| --- | --- |
| Implementation of previous week's feedback | 50 |
| Admin panel with the listed read/CRUD capabilities | 50 |

The new brief explicitly includes ratings read access. It does not ask for
editing/deleting users or modifying ratings. It uses "AI generated media,"
broader than the older image/caption shorthand.

## Authorization and first-admin setup

The assignment asks how the owner can enter an admin area when a privilege flag
is required. For the student's own database, the bootstrap approach is to sign
in normally to create a profile, then use a trusted database administration
channel (for example the owner's Supabase SQL Editor) to grant the privilege to
the explicitly identified owner profile. This is a proposed implementation
approach, not a performed grant or a verbatim instructor answer.

Implementation requirements derived from the access-control requirement:

- Add a privilege field only after inspecting the target schema; default false.
- Identify the intended first admin by an exact verified auth/profile UUID.
  Never grant admin to everyone, the first random signup, or a guessed account.
- Keep privilege changes out of browser-writable profile fields and normal
  profile update RPCs. User-editable auth metadata is not an admin authority.
- Check the session and current database privilege on the server for protected
  pages, route handlers, server actions, media access and every privileged read
  or mutation. Hiding navigation is insufficient.
- Public login/callback entry points may establish a session; they must not
  expose admin data before authorization.
- Test anonymous users, ordinary Google users, approved admins, expired sessions
  and privilege revocation. Keep privileged credentials server-only.

No admin flag or authorization implementation was found in this consumer
repository's `supabase`, `lib` or `app` sources on October 19. That is a local
code finding; the hosted schema was not inspected during ingestion.

## Database scope and differences from older materials

- The updated brief contains **no explicit RLS prohibition** and no instruction
  to use a shared staging database. Older Week 6 instructions did prohibit RLS
  changes. This omission is not a request to alter existing policies.
- Preserve the consumer app's current RLS and ownership protections. Do not
  disable RLS or change Supabase-managed schemas to make admin access work.
  Evaluate any necessary application-policy change against the target database
  and current brief before implementation.
- Working direction: a separate admin app over the consumer app's existing data.
  Verify the Supabase project and environment before any schema/data changes.
  Do not assume a new database or the course staging schema is required.
- Existing consumer data includes profiles, caption images, captions/runs,
  votes/events, review exposures and generation records. Uploaded images with
  AI-generated captions and legacy AI-generated images both exist as concepts
  in the code. Define the admin media model from these actual relationships.
- Plan CRUD for image/caption posts, including AI caption content and associated
  media; do not treat a table viewer or hide/unpublish alone as full CRUD.
  Decide deletion behavior around votes, foreign keys, Storage and generation
  provenance before implementing destructive operations.

## Week 6 slides: verified source and page map

Source supplied in Downloads, copied without changing its contents to
`Documentation/the-humor-project-slides-20261019.pdf`.

- Total pages: **201**.
- SHA-256: `879B093E0D3AA711B54CFBA6E9F125CDF1370CB6BE0DBC178B6E1E5E19582ACF`.
- Read all supplied pages 70–94; page numbers here are **1-based PDF pages**.
- Rendered and visually inspected pages 70, 73, 85, 87, 93 and 94.
- Page 70 is the Week 6 divider; 71–93 are Week 6 material.
  Page 94 is the Week 7 divider.
- The older 182-page deck and its existing topic/page references are retained.
  Do not apply its page numbers to this new deck.

| New PDF pages | Guidance |
| --- | --- |
| 71–76 | Follow a deployed request from browser through Vercel/Next.js to Supabase and Postgres. Use deployment logs for builds, runtime logs for app errors, and Supabase API/Auth/Postgres/Edge logs for the corresponding boundary. |
| 77–82 | Record environment, exact time, triggering route/action, expected/actual result, status and user context. Reproduce, find the first failing hop, fix it and retest end to end. Local success does not establish production success. |
| 83–88 | Classify variables by reader, evaluation time and environment. `NEXT_PUBLIC_` values reach browser bundles; privileged/provider keys must remain server-only. Service-role keys bypass RLS and are for trusted backend work, not normal client access. |
| 89–90 | Distinguish Development, Preview and Production. Use ignored `.env.local` for real values and `.env.example` for placeholders. Public variable changes generally require redeployment. |
| 91–92 | Rotate/revoke exposed secrets; removing a line is insufficient. Inspect secret usage without printing values. |
| 93 | Verify environment/project pairing, applied migrations, private keys absent from browser/Git, and auth redirects matching deployed domains. |

## Supplied lecture notes: October 17

The user supplied lecture metadata: Saturday October 17, 2026, 11:40 AM PDT,
Math 207. A "Watch recording" label was supplied without a recording URL; no
recording was watched.

The lecture-note summary adds these points beyond the reviewed slide range:

- Weekly greenfield assignments differ from the semester project, which improves
  the existing Crackd ecosystem and prepares students for maintaining codebases.
- Initial semester-project idea approval is due "next Friday" through Slack or
  Feedback Groups. Relative to the lecture date this suggests October 23, but
  the exact deadline/approval process has not been independently verified.
- Semester-project deliverables include three build iterations and a 2–4 minute
  demonstration video. These are separately supplied lecture notes, not extra
  Week 6 rubric requirements.
- Start debugging with browser inspection/local logs, then follow the request.
  Vercel also offers analytics, speed, firewall and CDN information. Warnings
  may accompany HTTP 200, so status alone does not establish success.
- Supabase monitoring can identify slow joins; the quoted 1.5-second caption-vote
  query is a lecture example, not a measurement of this student's database.
- The course admin app developed organically over three years, adding LLM
  response viewers, image search and study wizards as needs arose. Human context
  is still needed to interpret cross-service errors.

## Remaining work and proposed build order

1. Establish the separate admin repository/workspace and Vercel project; inspect
   existing resources before creating duplicates.
2. Verify database target, schema and environment configuration. Implement
   Google login, the protected admin boundary and a controlled owner bootstrap.
3. Build an overview using actual counts and trends: users, posts/captions,
   upvotes/downvotes, most-rated content and generation success/failure.
   These are proposed statistics, not additional rubric requirements.
4. Add searchable/paginated profile reads, media CRUD, and ratings reads with
   the relevant post/user context. Handle loading, empty, failure and delete
   confirmation states.
5. Test authorization at every server entry point, CRUD persistence, rating
   accuracy, media access and the deployed environment. Configure the admin
   project's own callback allowlist for commit-specific Vercel domains.
6. Verify feedback improvements in the deployed consumer app, then submit both
   latest commit-specific URLs.

Consumer feedback already addressed in code: sign-in state/return handling,
upload-only Create with required written or AI caption, feed copy/button cleanup
and automatic scrolling. The user confirmed the wildcard OAuth redirect fix.
Latest deployment and complete production QA for every subsequent UI change
remain unverified; see JOURNAL.md. No admin app was created during ingestion.
