import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { approval, dashboardFilters } from "../lib/dashboard.mjs";

test("dashboard filters and zero-vote approval", () => {
  assert.deepEqual(dashboardFilters({ range:"all",page:"2" }), { range:"all",days:0,page:2 });
  assert.deepEqual(dashboardFilters({ range:"invalid",page:"-1" }), { range:"30",days:30,page:1 });
  assert.equal(approval({ votes:0,upvotes:0 }), "No votes yet");
  assert.equal(approval({ votes:4,upvotes:3 }), "75%");
});

test("dashboard aggregates use current votes, preserve zero days and deny non-admins", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create function public.is_admin() returns boolean language sql as
      $$ select coalesce(current_setting('test.admin',true),'false')='true' $$;
      create table public.profiles(id int);
      create table public.caption_images(id uuid primary key,alt_text text,published boolean,created_at timestamptz);
      create table public.captions(id uuid primary key,image_id uuid,text text,style text,active boolean);
      create table public.caption_votes(caption_id uuid,value smallint);
      create table public.caption_vote_events(value smallint,created_at timestamptz);
      insert into public.profiles values (1),(2);
      insert into public.caption_images values
        ('00000000-0000-0000-0000-000000000001','Image one',true,now()),
        ('00000000-0000-0000-0000-000000000002','Image two',false,now()-interval '2 days');
      insert into public.captions values
        ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','Dry','dry_self_deprecating',true),
        ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','Online','internet_voice',true),
        ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000001','College','college_twist',true),
        ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000001','Human','human',true);
      insert into public.caption_votes values
        ('00000000-0000-0000-0000-000000000011',1),
        ('00000000-0000-0000-0000-000000000011',1),
        ('00000000-0000-0000-0000-000000000011',-1),
        ('00000000-0000-0000-0000-000000000012',-1),
        ('00000000-0000-0000-0000-000000000014',1);
      insert into public.caption_vote_events values (1,now()),(-1,now()),(null,now());
    `);
    await db.exec(await readFile(new URL("../supabase/migrations/20261020044012_admin_dashboard.sql",import.meta.url),"utf8"));
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select public.admin_dashboard()"), /Admin access required/);
    await db.exec("set test.admin='true'");
    const result = async(days=7,page=1) => (await db.query("select public.admin_dashboard($1,$2) as data",[days,page])).rows[0].data;
    const d = await result();
    assert.deepEqual(d.totals,{ users:2,posts:2,published_posts:1,votes:5 });
    assert.equal(d.activity.length,7);
    assert.equal(d.activity.at(-1).vote_actions,2);
    assert.equal(d.activity.at(-1).vote_removals,1);
    assert.equal(d.activity.at(-2).posts,0);
    assert.equal(d.top_posts.length,1);
    assert.equal(d.top_posts[0].upvotes,3);
    assert.equal(d.top_posts[0].downvotes,2);
    assert.equal(d.top_posts[0].caption,"Dry");
    assert.equal(d.styles[0].votes,3);
    assert.equal(d.styles[0].upvotes,2);
    assert.equal(d.styles[2].votes,0);
    assert.equal(d.other_style_votes,1);
    assert.equal(d.style_image_count,1);
    assert.equal(d.style_images[0].styles[2].votes,0);
    assert.equal((await result(7,2)).style_images.length,0);
    assert.equal((await result(30)).activity.length,30);
    assert.equal((await result(0)).activity.length,3);
    await assert.rejects(result(99), /Invalid dashboard filter/);
    await db.exec("set test.admin='false'");
    await assert.rejects(result(), /Admin access required/);
    await db.exec("set role anon");
    await assert.rejects(result(), /permission denied/);
  } finally { await db.close(); }
});
