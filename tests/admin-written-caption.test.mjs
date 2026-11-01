import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const owner='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002',id='10000000-0000-0000-0000-000000000001';
test('admin written caption publishes atomically, records authorship and rejects unauthorized/stale/duplicate writes',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql as $$select current_setting('request.jwt.claims',true)::jsonb$$;
   create table public.profiles(id uuid primary key,firstname text,lastname text);
   create table auth.users(id uuid primary key,email text,created_at timestamptz,last_sign_in_at timestamptz);
   insert into public.profiles(id) values('${owner}'),('${other}');`);
  for(const file of ['tests/fixtures/consumer-media.sql','supabase/migrations/20261020042634_admin_access.sql','supabase/migrations/20261020050449_admin_management.sql','supabase/migrations/20261101021352_admin_written_caption.sql']) await db.exec(await readFile(file,'utf8'));
  await db.exec(`insert into admin_private.members(user_id) values('${owner}');
   insert into public.caption_images(id,storage_path,alt_text,source_sha256,hosted_sha256,hosted_bytes,provenance,uploaded_by)
    values('${id}','fixture.webp','Original',repeat('a',64),repeat('b',64),100,'{}','${other}');
   set request.jwt.claim.sub='${owner}';set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}';set role authenticated;`);
  const save=(revision=0,text='A written caption',alt='Updated',publish=true)=>db.query('select public.admin_save_media_with_caption($1,$2,$3,$4,$5,$6)',[id,revision,alt,publish,'[]',text]);
  await assert.rejects(save(0,' '),/Enter a caption/);
  await assert.rejects(save(0,'x'.repeat(501)),/Enter a caption/);
  await assert.rejects(save(9),/reload/);
  await assert.rejects(save(0,'Valid',''),/Invalid media/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int n from public.captions')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from public.caption_runs')).rows[0].n,0);
  await db.exec(`set role authenticated;set request.jwt.claim.sub='${other}'`);
  await assert.rejects(save(),/Admin access required/);
  await db.exec(`set request.jwt.claim.sub='${owner}';set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"password"}]}'`);
  await assert.rejects(save(),/Admin access required/);
  await db.exec(`set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}'`);
  await save();
  await assert.rejects(save(0),/reload/);
  await assert.rejects(save(1),/already have/);
  await db.exec('reset role');
  const image=(await db.query('select * from public.caption_images')).rows[0];
  assert.equal(image.published,true);assert.equal(image.alt_text,'Updated');assert.equal(image.uploaded_by,other);
  const caption=(await db.query('select * from public.captions')).rows[0];
  assert.equal(caption.authored_by,owner);assert.equal(caption.style,'human');assert.equal(caption.generated_by,null);assert.equal(caption.provenance.source,'admin_written');
  assert.equal((await db.query('select count(*)::int n from admin_private.media_audit')).rows[0].n,1);
  await db.exec(`delete from admin_private.members;set role authenticated`);
  await assert.rejects(save(1),/Admin access required/);
  await db.exec('reset role;set role anon');await assert.rejects(save(1),/permission denied/);
 } finally {await db.close();}
});
