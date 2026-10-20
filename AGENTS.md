# COMS6998 admin application

- This is the separate Week 6 admin app, not the public consumer app.
- Read `Documentation/WEEK6_UPDATED_BRIEF.md` and `Documentation/JOURNAL.md`
  before starting implementation.
- The consumer app lives beside this repository at `../COMS6998`. Inspect its
  migrations, schema and authentication implementation as needed; do not assume
  the slides match the implemented database.
- Use this repository for admin code. Do not scaffold inside the consumer repo.
- Verify the intended Supabase project before schema or data changes. Preserve
  existing RLS, user ownership, votes and generation provenance. Never change
  Supabase-managed schemas or assume course-staging access.
- Every admin data page, action, API and media endpoint needs server-side Google
  authentication and a trusted database privilege check. Login alone is not
  authorization. Login/callback entry points must expose no admin data.
- A first-admin grant must target the explicitly identified owner through a
  trusted administration channel; do not guess an account or allow self-promotion.
- Never expose service-role/provider secrets to browser code, Git or logs.
- Configure this project's own Vercel environment and OAuth callback allowlist,
  including its commit-specific URLs. The consumer app's wildcard is not proof
  that the admin app's domains are covered.
- Consult bundled Next.js documentation in `node_modules/next/dist/docs/` before
  coding once dependencies are installed.
- Keep this project's journal current and distinguish local checks, user reports,
  verified deployments and unconfirmed submissions.
