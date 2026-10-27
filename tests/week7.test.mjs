import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {generateConfiguredCaptions} from '../lib/admin-generation.mjs';
import {parseConfigForm,safeRecord} from '../lib/week7.mjs';
const owner='00000000-0000-0000-0000-000000000001';
test('Week 7 configuration CRUD, reference safety, mix, history and authorization',async()=>{
 const db=new PGlite();
 try {
  await db.exec(`create role anon;create role authenticated;create schema auth;
   create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create function auth.jwt() returns jsonb language sql as $$select current_setting('request.jwt.claims',true)::jsonb$$;
   create table public.profiles(id uuid primary key,firstname text,lastname text);
   create table auth.users(id uuid primary key,email text,created_at timestamptz,last_sign_in_at timestamptz);
   insert into public.profiles(id) values('${owner}');`);
  for(const file of ['tests/fixtures/consumer-media.sql','supabase/migrations/20261020042634_admin_access.sql','supabase/migrations/20261020050449_admin_management.sql','supabase/migrations/20261027001320_admin_week7.sql'])await db.exec(await readFile(file,'utf8'));
  await db.exec(`insert into admin_private.members(user_id)values('${owner}');set request.jwt.claim.sub='${owner}';set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}';set role authenticated;`);
  const rpc=async(name,args=[])=> (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as data`,args)).rows[0].data;
  const write=(kind,op,id,rev,data)=>rpc('admin_config_write',[kind,op,id,rev,JSON.stringify(data)]);
  for(const [kind,data,changed] of [
   ['terms',{term:'Test slang',definition:'Meaning',example:''},{term:'Updated slang',definition:'New meaning',example:'Example'}],
   ['examples',{image_description:'A cat',caption:'A joke',explanation:''},{image_description:'A dog',caption:'New joke',explanation:'Reason'}],
   ['domains',{domain:'example.test'},{domain:'college.test'}],
   ['emails',{email:'one@example.test'},{email:'two@example.test'}],
   ['providers',{name:'Test provider',slug:'test_provider'},{name:'Updated provider',slug:'updated_provider'}],
   ['models',{name:'Test model',model_id:'test-model',provider_id:'71000000-0000-0000-0000-000000000001'},{name:'Changed model',model_id:'changed-model',provider_id:'71000000-0000-0000-0000-000000000001'}]
  ]) {
   const id=randomUUID();await write(kind,'create',id,0,data);
   assert.equal((await rpc('admin_config_record',[kind,id])).revision,1);
   await write(kind,'update',id,1,changed);
   await assert.rejects(write(kind,'update',id,1,data),/Record changed/);
   assert.equal((await rpc('admin_config_record',[kind,id])).revision,2);
   await write(kind,'delete',id,2,{});assert.equal(await rpc('admin_config_record',[kind,id]),null);
  }
  await assert.rejects(write('providers','delete','71000000-0000-0000-0000-000000000001',1,{}),/foreign key/);
  await assert.rejects(write('models','delete','72000000-0000-0000-0000-000000000001',1,{}),/foreign key/);
  await assert.rejects(write('terms','create',randomUUID(),0,{term:'',definition:'x',example:''}),/check constraint/);
  await assert.rejects(write('terms','create',randomUUID(),0,{term:'x',definition:'x',example:'',revision:100}),/Invalid fields/);
  const mix=(await rpc('admin_config_list',['mix','',1])).rows;
  for(const row of mix.slice(0,2))await write('mix','update',row.id,1,{caption_count:0});
  await assert.rejects(write('mix','update',mix[2].id,1,{caption_count:0}),/at least one/);
  await assert.rejects(write('mix','update',mix[2].id,1,{caption_count:2}),/check constraint/);
  assert.equal((await rpc('admin_generation_config')).chains.filter(c=>c.caption_count===1).length,1);
  await assert.rejects(write('chains','delete',mix[0].id,1,{}),/Invalid operation/);
  const image=randomUUID();await rpc('admin_reserve_media',[image]);
  await rpc('admin_record_generation',[image,'generated',JSON.stringify({steps:[{response:{text:'actual output'}}]})]);
  await rpc('admin_create_media',[image,'Test','a'.repeat(64),'b'.repeat(64),100,JSON.stringify({college_twist:'Test joke'}),JSON.stringify({steps:[{response:{text:'actual output'}}]})]);
  assert.equal((await rpc('admin_media_detail',[image])).captions.length,1);
  assert.equal((await rpc('admin_observability',['requests','',1])).rows[0].status,'succeeded');
  assert.equal((await rpc('admin_observability',['responses','',1])).total,2);
  await rpc('admin_delete_media',[image,1,'DELETE']);
  assert((await rpc('admin_observability',['runs','',1])).rows.some(r=>r.source==='archived_caption_run'));
  for(const resource of ['chains','steps','mix','terms','examples','providers','models','domains','emails']) assert(Array.isArray((await rpc('admin_config_list',[resource,'',1])).rows));
  await assert.rejects(db.query('select * from admin_private.terms'),/permission denied/);
  const denied=async()=>{
   for(const [name,args] of [['admin_config_list',['terms','',1]],['admin_config_record',['terms',randomUUID()]],['admin_generation_config',[]],['admin_observability',['requests','',1]],['admin_record_generation',[image,'failed','{}']]])await assert.rejects(rpc(name,args),/Admin access required|permission denied/);
   await assert.rejects(write('terms','create',randomUUID(),0,{term:'Forbidden',definition:'No',example:''}),/Admin access required|permission denied/);
  };
  await db.exec("set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002'");await denied();
  await db.exec(`set request.jwt.claim.sub='${owner}';set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"password"}]}'`);await denied();
  await db.exec(`reset role;delete from admin_private.members;set role authenticated;set request.jwt.claims='{"app_metadata":{"provider":"google"},"amr":[{"method":"oauth"}]}'`);await denied();
  await db.exec('set role anon');await denied();
  await db.exec('reset role');assert((await db.query('select count(*)::int n from admin_private.configuration_audit')).rows[0].n>=20);
 }finally{await db.close();}
});
test('configured generation honors the mix and preserves prompts and responses',async()=>{
 const config={chains:[{id:'chain',style:'college_twist',caption_count:1,steps:[{id:'step',provider:'google_gemini',model:'test-model',temperature:0.8,instructions:'College joke'}]},{style:'internet_voice',caption_count:0}],terms:[{term:'test',definition:'context'}],examples:[]};
 let calls=0;
 const result=await generateConfiguredCaptions(Buffer.from('image'),{apiKey:'test',config,fetchImpl:async(url,options)=>{calls++;assert.match(url,/test-model:generateContent/);assert.match(JSON.parse(options.body).systemInstruction.parts[0].text,/context/);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"caption":"A college joke"}'}]}}]})};}});
 assert.equal(calls,1);assert.deepEqual(result.captions,{college_twist:'A college joke'});assert.equal(result.provenance.steps.length,1);
 await assert.rejects(generateConfiguredCaptions(Buffer.from('x'),{config:{chains:[]}}),/configuration/);
 const bad=structuredClone(config);bad.chains[0].steps[0].provider='unknown';await assert.rejects(generateConfiguredCaptions(Buffer.from('x'),{config:bad}),/configuration/);
});
test('form validation and secret redaction',()=>{
 const f=new FormData();for(const [k,v]of Object.entries({resource:'terms',operation:'create',id:randomUUID(),revision:'0',term:'test',definition:'meaning',example:''}))f.set(k,v);
 assert.equal(parseConfigForm(f).data.term,'test');f.set('resource','chains');assert.throws(()=>parseConfigForm(f),/Invalid/);
 assert.deepEqual(safeRecord({api_key:'secret',nested:{inlineData:{data:'bytes'},text:'caption'}}),{api_key:'[Redacted]',nested:{inlineData:'[Redacted]',text:'caption'}});
});
