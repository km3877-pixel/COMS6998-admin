import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://localhost:3001";
for (const path of ["/login", "/access-denied"]) {
  const response = await fetch(base + path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get("cache-control"), /no-store/);
  assert.doesNotMatch(await response.text(), /Most-liked posts|Caption-style approval/);
}
for (const headers of [{}, { Cookie: "punchline-admin-auth=forged-session" }, { RSC: "1" }]) {
  let response = await fetch(base + "/admin", { redirect: "manual", headers });
  // Next.js canonicalizes raw RSC requests before invoking the page.
  if (response.headers.get("location") === "/admin?_rsc") {
    response = await fetch(base + "/admin?_rsc", { redirect: "manual", headers });
  }
  const body = await response.text();
  if (headers.RSC) {
    assert.equal(response.status, 200);
    assert.match(body, /NEXT_REDIRECT;replace;\/login;307;/);
  } else {
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "/login");
  }
  assert.doesNotMatch(body, /Most-liked posts|Caption-style approval/);
}
const api = await fetch(base + "/api/admin/session");
assert.equal(api.status, 401);
assert.deepEqual(await api.json(), { error: "Sign in required" });
const media = await fetch(base + "/api/admin/media/00000000-0000-0000-0000-000000000001");
assert.equal(media.status, 401);
for (const path of ["/admin/superusers","/admin/users","/admin/ratings","/admin/media","/admin/media/new","/admin/media/00000000-0000-0000-0000-000000000001"]) {
  for (const headers of [{},{Cookie:"punchline-admin-auth=forged-session"}]) {
    const response=await fetch(base+path,{redirect:"manual",headers});
    assert.equal(response.status,307,path);
    assert.equal(response.headers.get("location"),"/login",path);
    assert.doesNotMatch(await response.text(),/owner@example|Record information|Generate 3 captions/);
  }
}
for (const path of ["/auth/callback", "/auth/callback?code=a&code=b", "/auth/callback?error=denied&next=https://example.com"]) {
  const response = await fetch(base + path, { redirect: "manual" });
  assert.equal(response.status, 303);
  assert.equal(new URL(response.headers.get("location")).pathname, "/login");
}
console.log("HTTP smoke passed: public entry points, anonymous/forged/RSC requests, API 401, invalid callbacks.");
