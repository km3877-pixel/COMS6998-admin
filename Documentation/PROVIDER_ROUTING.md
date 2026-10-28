# Admin caption provider routing

New admin image captions execute the model selected on each enabled prompt
chain's step. The current chains each contain one step and produce one caption
per enabled style. Saved generations retain a snapshot of their configuration,
provider, model, prompt, output, usage and duration.

## Configure a model

1. Configure the provider's secret on the admin application's server/Vercel
   environment and redeploy: `GEMINI_API_KEY`, `OPENAI_API_KEY`, or
   `ANTHROPIC_API_KEY`. Never enter credentials in a provider record.
2. In **LLM providers**, create a provider with identifier `google_gemini`,
   `openai`, or `anthropic`. The page reports credential presence, not account
   balance or permission to use a particular model.
3. In **LLM models**, enter the exact model identifier from that provider and
   associate it with the provider record. Choose a model that accepts images
   and supports structured JSON output (Anthropic may use the SDK's JSON tool
   fallback).
4. In **Prompt chain steps**, edit the relevant step and select the model.
   Providers without configured credentials cannot be selected through the UI.
5. Include the chain in **Prompt chain mix**, then upload an image with caption
   generation enabled. Inspect **Generation requests** and **LLM responses**.

The database model identifier is sent to the selected provider at generation
time; adding another supported model does not require editing application code.
A new provider protocol still needs an adapter. Unknown provider identifiers can
be stored for registry purposes but cannot execute requests.

## Execution and failure behavior

- Fixed provider endpoints prevent database entries from redirecting secrets.
- All configuration reads/writes and upload actions require live Google admin
  authorization. Model reassignment is revision-checked and audited in SQL.
- Missing credentials fail before a media reservation or paid provider call.
- Each call has a 25-second timeout, no automatic retries and a 2,048 output
  token limit. The existing upload rate limit applies.
- Google uses the step's configured temperature. OpenAI and Anthropic use their
  model defaults to accommodate models with restricted sampling parameters.
- Model existence, access and image/output capability are checked by the real
  provider call. An invalid model or failed response fails the generation; no
  partial caption set is published and safe failure provenance is recorded.
- Credentials, HTTP headers and image request bodies are never saved in
  generation history. Raw successful provider response bodies are retained.
- This routing controls admin uploads. The separate consumer app's generation
  implementation does not read this admin configuration.

## Verification on October 27, 2026

All 23 tests and the production build passed. Tests exercise the three actual
SDK adapters against HTTP fixtures, missing credentials, safe failure history,
database reassignment, stale writes, foreign keys and authorization. Hosted SQL
verification ran inside a rolled-back transaction. A real Gemini request with a
synthetic image succeeded. OpenAI/Anthropic keys were absent locally and in
production, so those providers have fixture coverage, not live account tests.
