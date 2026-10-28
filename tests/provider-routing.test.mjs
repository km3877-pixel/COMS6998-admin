import test from 'node:test';
import assert from 'node:assert/strict';
import {generateConfiguredCaptions} from '../lib/admin-generation.mjs';
import {checkGenerationConfig,providerStatus} from '../lib/provider-routing.mjs';
const config=provider=>({chains:[{id:'chain',style:'college_twist',caption_count:1,steps:[{id:'step',provider,model:'test-model',instructions:'Be funny',temperature:0.8}]}],terms:[],examples:[]});
const env={GEMINI_API_KEY:'google-test',OPENAI_API_KEY:'openai-test',ANTHROPIC_API_KEY:'anthropic-test'};
test('provider readiness blocks missing keys and unsupported adapters before requests',()=>{
 assert.throws(()=>checkGenerationConfig(config('openai'),{}),/OPENAI_API_KEY/);
 assert.throws(()=>checkGenerationConfig(config('unknown'),env),/unsupported/);
 assert.equal(providerStatus(env).filter(p=>p.configured).length,3);
 assert(!JSON.stringify(providerStatus(env)).includes('openai-test'));
});
for(const provider of ['openai','anthropic']) test(`${provider} sends image and structured schema to its own authenticated endpoint`,async()=>{
 let calls=0;
 const result=await generateConfiguredCaptions(Buffer.from('image'),{config:config(provider),env,fetchImpl:async(url,options)=>{
  calls++;const headers=new Headers(options.headers),body=JSON.parse(options.body);
  assert.equal(body.model,'test-model');assert(JSON.stringify(body).includes('aW1hZ2U='));
  assert(JSON.stringify(body).includes('caption'));
  if(provider==='openai') {
   assert.equal(String(url),'https://api.openai.com/v1/responses');assert.equal(headers.get('authorization'),'Bearer openai-test');
   return Response.json({id:'resp_test',created_at:1,model:'test-model',status:'completed',output:[{type:'message',id:'msg_test',role:'assistant',status:'completed',content:[{type:'output_text',text:'{"caption":"Test joke"}',annotations:[]}]}],usage:{input_tokens:10,output_tokens:10,total_tokens:20}});
  }
  assert.equal(String(url),'https://api.anthropic.com/v1/messages');assert.equal(headers.get('x-api-key'),'anthropic-test');
  // Generic models use the SDK's JSON tool fallback.
  return Response.json({id:'msg_test',type:'message',role:'assistant',model:'test-model',content:body.tools?.length?[{type:'tool_use',id:'tool_test',name:body.tools[0].name,input:{caption:'Test joke'}}]:[{type:'text',text:'{"caption":"Test joke"}'}],stop_reason:body.tools?.length?'tool_use':'end_turn',stop_sequence:null,usage:{input_tokens:10,output_tokens:10}});
 }});
 assert.equal(calls,1);assert.equal(result.captions.college_twist,'Test joke');assert.equal(result.provenance.steps[0].provider,provider);
 assert(!JSON.stringify(result).includes(env[provider==='openai'?'OPENAI_API_KEY':'ANTHROPIC_API_KEY']));
});
test('provider failures retain safe provenance and never publish a partial caption set',async()=>{
 const c=config('openai');let calls=0;
 await assert.rejects(generateConfiguredCaptions(Buffer.from('image'),{config:c,env,fetchImpl:async()=>{calls++;return Response.json({error:{message:'sensitive provider error'}},{status:401});}}),e=>{
  assert.equal(e.provenance.steps[0].model,'test-model');assert.equal(e.provenance.steps[0].error,'provider_failed');assert(!JSON.stringify(e).includes('sensitive'));return true;
 });assert.equal(calls,1);
});
