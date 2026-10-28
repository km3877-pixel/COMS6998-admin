export default function ModelHelp() {
 return <div className="notice">
  <h3>Set up a model for captions</h3>
  <ol>
   <li>Choose a model from your provider’s console that accepts images and supports structured JSON output. Copy its exact API model identifier.</li>
   <li>Add the model here and associate it with the matching provider. The display name is your own label; the model identifier must match the provider’s API.</li>
   <li>Check <a href="/admin/config/providers">LLM providers</a> for missing credentials. Add the required API key securely in the admin app’s Vercel environment, then redeploy.</li>
   <li>Select the model in <a href="/admin/config/steps">Prompt chain steps</a> and include its chain in <a href="/admin/config/mix">Prompt chain mix</a>.</li>
   <li><a href="/admin/images/new">Upload an image with caption generation enabled</a>, then review <a href="/admin/observability/requests">Generation requests</a> and <a href="/admin/observability/responses">LLM responses</a>.</li>
  </ol>
  <p>Saving a model does not activate it or verify access. Its provider needs server credentials before the model can be selected for a step. Model access and compatibility are checked when generation runs; simulated API tests do not verify your account.</p>
 </div>;
}
