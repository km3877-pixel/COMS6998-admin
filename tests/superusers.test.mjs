import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("superuser changes require live Google admin membership, preserve a last admin and audit changes", async () => {
  const db = new PGlite();
  const owner = "00000000-0000-0000-0000-000000000001";
  const other = "00000000-0000-0000-0000-000000000002";
  const password = "00000000-0000-0000-0000-000000000003";
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create function auth.jwt() returns jsonb language sql as $$select current_setting('request.jwt.claims',true)::jsonb$$;
      create table public.profiles(id uuid primary key, firstname text, lastname text);
      create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
      create table auth.identities(user_id uuid, provider text);
      insert into public.profiles values('${owner}','Owner','One'),('${other}','Other','Two'),('${password}','Password','Three');
      insert into auth.users values('${owner}','owner@example.test',now()),('${other}','other@example.test',now()),('${password}','password@example.test',now());
      insert into auth.identities values('${owner}','google'),('${other}','google'),('${password}','email');`);
    for (const file of ["20261020042634_admin_access.sql", "20261020060232_admin_superusers.sql"]) {
      await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
    }
    await db.exec(`insert into admin_private.members(user_id) values('${owner}');
      set request.jwt.claim.sub='${owner}';
      set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}';
      set role authenticated;`);
    const change = (email, enabled) => db.query("select public.admin_set_superuser($1,$2)", [email, enabled]);
    const list = () => db.query("select public.admin_superusers() as data");
    assert.equal((await list()).rows[0].data.length, 1);
    await assert.rejects(change("owner@example.test", false), /last superuser/);
    await assert.rejects(change("missing@example.test", true), /Existing account/);
    await assert.rejects(change("password@example.test", true), /Confirmed Google/);
    await change(" OTHER@example.test ", true);
    await change("other@example.test", true); // idempotent; no duplicate audit
    assert.equal((await list()).rows[0].data.length, 2);
    await assert.rejects(db.query("select * from admin_private.membership_audit"), /permission denied/);
    await assert.rejects(db.query(`insert into admin_private.members values('${password}',now())`), /permission denied/);
    await db.exec(`set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"password"}]}'`);
    await assert.rejects(change("password@example.test", true), /Admin access required/);
    await assert.rejects(list(), /Admin access required/);
    await db.exec(`set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}'`);
    await change("owner@example.test", false);
    await assert.rejects(change("owner@example.test", true), /Admin access required/);
    await assert.rejects(list(), /Admin access required/);
    await db.exec(`set request.jwt.claim.sub='${other}'`);
    await assert.rejects(change("other@example.test", false), /last superuser/);
    await change("owner@example.test", true);
    await db.exec("set role anon");
    await assert.rejects(list(), /permission denied/);
    await assert.rejects(change("other@example.test", false), /permission denied/);
    await db.exec("reset role");
    const audit = (await db.query("select actor_id,target_id,action from admin_private.membership_audit order by id")).rows;
    assert.deepEqual(audit, [
      { actor_id: owner, target_id: other, action: "grant" },
      { actor_id: owner, target_id: owner, action: "revoke" },
      { actor_id: other, target_id: owner, action: "grant" },
    ]);
  } finally { await db.close(); }
});

