// No caching: revoking membership must take effect on the next request.
export async function checkAccess(client) {
  try {
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError || !userData?.user) return { status: "anonymous" };
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
    const { data: allowed, error: permissionError } = await client.rpc("is_admin");
    if (permissionError) return { status: "unavailable" };
    if (allowed !== true) return { status: "denied" };
    return { status: "authorized", user: { id: userData.user.id, email: userData.user.email } };
  } catch {
    return { status: "unavailable" };
  }
}
