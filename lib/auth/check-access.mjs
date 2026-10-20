// No caching: revoking membership must take effect on the next request.
export async function checkAccess(client, {
  report = () => {},
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
} = {}, attempt = 0) {
  let stage = "user";
  const diagnose = (error, status) => {
    // Never log raw errors, messages, claims, cookies, or account identifiers.
    const code = /^(PGRST\d{3}|[0-9A-Z]{5})$/.test(error?.code ?? "")
      ? error.code : "unknown";
    const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";
    const reason = message.includes("expired") ? "expired"
      : message.includes("not yet valid") || message.includes("issued at future") ? "token_time"
      : "unspecified";
    try { report({ stage, code, reason, status: Number.isInteger(status) ? status : null, attempt }); }
    catch { /* Diagnostics must never affect authorization. */ }
  };
  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) return { status: "anonymous" };
    stage = "claims";
    const { data, error } = await client.auth.getClaims();
    const claims = data?.claims;
    if (error || claims?.sub !== userData.user.id ||
        !Number.isFinite(claims?.exp) || claims.exp <= Date.now() / 1000) {
      return { status: "anonymous" };
    }
    // app_metadata comes from a verified JWT, never editable user_metadata.
    if (claims.app_metadata?.provider !== "google" ||
        !Array.isArray(claims.amr) ||
        !claims.amr.some(entry => entry.method === "oauth")) return { status: "denied" };
    stage = "permission";
    const { data: allowed, error: permissionError, status } = await client.rpc("is_admin");
    if (permissionError) {
      diagnose(permissionError, status);
      // A newly issued token can be accepted by Auth but temporarily rejected
      // by the Data API. Retry once; repeat every check and never reuse a grant.
      if (permissionError.code === "PGRST303" && attempt === 0) {
        await wait(1000);
        return checkAccess(client, { report, wait }, 1);
      }
      return { status: "unavailable" };
    }
    if (allowed !== true) return { status: "denied" };
    return { status: "authorized", user: { id: userData.user.id, email: userData.user.email } };
  } catch (error) {
    diagnose(error);
    return { status: "unavailable" };
  }
}
