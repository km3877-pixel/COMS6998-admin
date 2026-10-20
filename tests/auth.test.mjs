import test from "node:test";
import assert from "node:assert/strict";
import { checkAccess } from "../lib/auth/check-access.mjs";

function fixture(options = {}) {
  let calls = 0;
  const user = { id: "owner-id", email: "owner@example.test", user_metadata: { is_admin: true } };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: options.anonymous ? null : user }, error: options.userError }),
      getClaims: async () => ({ data: { claims: {
        sub: options.sub ?? user.id,
        exp: options.exp ?? Date.now() / 1000 + 3600,
        app_metadata: { provider: options.provider ?? "google" },
        amr: options.amr ?? [{ method: "oauth" }],
      } }, error: options.claimsError }),
    },
    rpc: async name => {
      assert.equal(name, "is_admin");
      calls++;
      if (options.throws) throw new Error("database down");
      return { data: options.allowed ?? false, error: options.dbError };
    },
  };
  return { client, calls: () => calls, options };
}

test("anonymous and rejected sessions never query admin membership", async () => {
  for (const options of [{ anonymous: true }, { userError: {} }, { claimsError: {} }, { sub: "another-user" }, { exp: 1 }]) {
    const f = fixture(options);
    assert.equal((await checkAccess(f.client)).status, "anonymous");
    assert.equal(f.calls(), 0);
  }
});
test("non-Google sessions cannot enter even with admin membership", async () => {
  const f = fixture({ provider: "email", allowed: true });
  assert.equal((await checkAccess(f.client)).status, "denied");
  assert.equal(f.calls(), 0);
});
test("user metadata cannot grant admin access", async () => {
  assert.equal((await checkAccess(fixture().client)).status, "denied");
});
test("a password session for a Google-linked account is denied", async () => {
  assert.equal((await checkAccess(fixture({ allowed: true, amr: [{ method: "password" }] }).client)).status, "denied");
});
test("only a strict true database result grants access", async () => {
  for (const allowed of [false, "true", 1, {}, []]) {
    assert.equal((await checkAccess(fixture({ allowed }).client)).status, "denied");
  }
  assert.deepEqual(await checkAccess(fixture({ allowed: true }).client), {
    status: "authorized", user: { id: "owner-id", email: "owner@example.test" },
  });
});
test("missing RPC, database errors and network errors fail closed", async () => {
  for (const options of [{ allowed: true, dbError: {} }, { throws: true }]) {
    assert.equal((await checkAccess(fixture(options).client)).status, "unavailable");
  }
});
test("membership revocation is seen on the very next check", async () => {
  const f = fixture({ allowed: true });
  assert.equal((await checkAccess(f.client)).status, "authorized");
  f.options.allowed = false;
  assert.equal((await checkAccess(f.client)).status, "denied");
  assert.equal(f.calls(), 2);
});
