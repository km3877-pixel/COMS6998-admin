import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("database membership cannot be read or changed by browser roles", async () => {
  const db = new PGlite();
  try {
    // Local facsimile only. The production migration never creates/modifies auth.
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create function auth.uid() returns uuid language sql as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function auth.jwt() returns jsonb language sql as
        $$ select current_setting('request.jwt.claims', true)::jsonb $$;
      create table public.profiles(id uuid primary key);
      insert into public.profiles values
        ('00000000-0000-0000-0000-000000000001'),
        ('00000000-0000-0000-0000-000000000002');
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20261020042634_admin_access.sql", import.meta.url), "utf8"));
    await db.exec(`
      insert into admin_private.members(user_id) values ('00000000-0000-0000-0000-000000000001');
      set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
      set request.jwt.claims = '{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}';
      set role authenticated;
    `);
    const allowed = async () => (await db.query("select public.is_admin() as allowed")).rows[0].allowed;
    assert.equal(await allowed(), true);
    for (const sql of [
      "select * from admin_private.members",
      "insert into admin_private.members(user_id) values ('00000000-0000-0000-0000-000000000002')",
      "delete from admin_private.members",
      "update admin_private.members set granted_at = now()",
    ]) await assert.rejects(db.exec(sql), /permission denied/);
    await db.exec(`set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002'`);
    assert.equal(await allowed(), false);
    await db.exec(`
      set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
      set request.jwt.claims = '{"app_metadata":{"provider":"google"},"amr":[{"method":"password"}]}';
    `);
    assert.equal(await allowed(), false);
    await db.exec(`
      set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
      set request.jwt.claims = '{"app_metadata":{"provider":"email"},"user_metadata":{"is_admin":true}}';
    `);
    assert.equal(await allowed(), false);
    await db.exec(`
      reset role;
      delete from admin_private.members;
      set request.jwt.claims = '{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}';
      set role authenticated;
    `);
    assert.equal(await allowed(), false);
    await db.exec("set role anon");
    await assert.rejects(db.exec("select public.is_admin()"), /permission denied/);
    await assert.rejects(db.exec("select * from admin_private.members"), /permission denied/);
  } finally { await db.close(); }
});
