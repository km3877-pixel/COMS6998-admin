# Week 7 Admin Panel with More Observability

Implementation update October 26: the requested admin pages and configuration
CRUD are now implemented; see JOURNAL.md for applied migration and verification.
The gap table below preserves the initial assessment before implementation.

Assignment supplied by the user on October 26, 2026. Extend the existing admin
application. Due **Thursday, October 29, 2026 at 11:00 AM PDT**.

## Deliverables and grading

- Previous week's feedback implementation: **50 points**. The specific new
  feedback has not been supplied; earlier fixes are recorded in JOURNAL.md.
- Technical implementation: **50 points**, covering the operations below.
- Disable Vercel deployment protection so both apps can be reached in Incognito.
  Retain application Google authentication and trusted admin authorization.
- Submit the latest commit-specific URLs of both the caption creation/rating
  app and this admin app in Submissions.

## Required operations and current gaps

Status is based on local source inspection and the existing journal, not a fresh
hosted schema or authenticated production verification.

| Resource | Required operations | Current implementation |
| --- | --- | --- |
| Users or profiles | Read | Existing searchable, paginated Users page |
| Prompt chains | Read | No admin page found |
| Prompt chain steps | Read | No admin page found |
| Prompt chain mix | Read, update | No admin page found |
| Terms | Create, read, update, delete | No admin page found |
| AI generated media | Read, view | Existing Media pages; verify coverage of generated images and captions |
| Generation requests | Read | Consumer migrations contain caption and image request tables; no dedicated admin viewer |
| AI generation examples | Create, read, update, delete | No admin page found |
| LLM models | Create, read, update, delete | No admin page found |
| LLM providers | Create, read, update, delete | No admin page found |
| LLM responses | Read | Consumer caption requests contain provider responses; no dedicated admin viewer |
| Allowed signup domains | Create, read, update, delete | No admin page found |
| Whitelisted email addresses | Create, read, update, delete | No admin page found; existing Superusers membership is a separate privilege |
| Images, if uploads are supported | Create, read, update, delete, including upload | Applicable: existing upload/create, edit and delete flows; authenticated end-to-end verification remains |

The Week 7 AI media requirement is read/view. Image CRUD is separately required
because this application supports uploads. Existing ratings and statistics can
remain, but do not substitute for the new requirements.

## Implementation constraints and sequence

1. Obtain the previous week's specific feedback and track each improvement.
2. Verify the intended hosted database against the app configuration. The last
   verified project was `thrkmilojkqqntdnrgwo`. Inspect actual tables and consumer
   generation/authentication code before deciding which new schema is needed.
   Course terminology does not establish that corresponding tables exist.
3. Map prompt chains, steps and mix to the actual generation pipeline. Determine
   what mix values mean before designing updates. Do not invent historical
   generation records or present configuration as active without integration.
4. Add protected request/response viewers and the required configuration CRUD.
   Preserve provider/model provenance when configuration changes or is deleted.
   Signup allowlists are distinct from admin membership; decide their intended
   enforcement from the actual signup implementation.
5. Verify image upload and CRUD, generated-media viewing, each required operation,
   and anonymous, ordinary-user and revoked-admin denial at all server boundaries.
6. Deploy and verify both latest commit-specific URLs, OAuth callbacks and
   Incognito reachability. Record actual submission separately from deployment.

Continue following AGENTS.md: preserve RLS, ownership, votes and generation
provenance; never expose provider/service-role secrets or modify managed schemas.
The prior journal records disabled admin deployment protection and user-reported
Google login success. Those historical checks do not establish Week 7 completion.
