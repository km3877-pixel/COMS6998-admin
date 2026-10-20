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

test("transient token rejection repeats authentication and requires a fresh grant", async () => {
  const f = fixture({ allowed: true, dbError: { code: "PGRST303" } });
  let users = 0;
  const getUser = f.client.auth.getUser;
  f.client.auth.getUser = async () => { users++; return getUser(); };
  const result = await checkAccess(f.client, { wait: async ms => {
    assert.equal(ms, 1000);
    f.options.dbError = null;
  } });
  assert.equal(result.status, "authorized");
  assert.equal(users, 2);
  assert.equal(f.calls(), 2);
});

test("retry is bounded and never bypasses revocation or rejected authentication", async () => {
  for (const outcome of ["persistent", "revoked", "signed-out"]) {
    const f = fixture({ allowed: true, dbError: { code: "PGRST303" } });
    const result = await checkAccess(f.client, { wait: async () => {
      if (outcome === "revoked") { f.options.dbError = null; f.options.allowed = false; }
      if (outcome === "signed-out") f.options.anonymous = true;
    } });
    assert.equal(result.status, { persistent: "unavailable", revoked: "denied", "signed-out": "anonymous" }[outcome]);
    assert.ok(f.calls() <= 2);
  }
});

test("diagnostics exclude raw error content and cannot affect the access decision", async () => {
  const diagnostics = [];
  const f = fixture({ dbError: { code: "PGRST303", message: "JWT issued at future secret-token", details: "private" } });
  await checkAccess(f.client, { wait: async () => {}, report: d => diagnostics.push(d) });
  assert.deepEqual(diagnostics[0], { stage: "permission", code: "PGRST303", reason: "token_time", status: null, attempt: 0 });
  assert.equal(JSON.stringify(diagnostics).includes("secret-token"), false);
  assert.equal(JSON.stringify(diagnostics).includes("private"), false);
  assert.equal((await checkAccess(fixture({ dbError: {} }).client, {
    report: () => { throw new Error("logger failed"); },
  })).status, "unavailable");
});
