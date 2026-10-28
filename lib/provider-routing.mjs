import {createGoogle} from '@ai-sdk/google';
import {createOpenAI} from '@ai-sdk/openai';
import {createAnthropic} from '@ai-sdk/anthropic';
import {generateText, Output, jsonSchema} from 'ai';

export const providerDefinitions={
 google_gemini:{name:'Google Gemini',key:'GEMINI_API_KEY'},
 openai:{name:'OpenAI',key:'OPENAI_API_KEY'},
 anthropic:{name:'Anthropic',key:'ANTHROPIC_API_KEY'},
};
export function providerStatus(env=process.env) {
 return Object.entries(providerDefinitions).map(([slug,p])=>({slug,name:p.name,environmentVariable:p.key,configured:Boolean(env[p.key]?.trim())}));
}
export function checkGenerationConfig(config,env=process.env) {
 const chains=config?.chains?.filter(c=>c.caption_count===1);
 if(!chains?.length||chains.length>3||chains.some(c=>c.steps?.length!==1)) throw Error('Generation configuration requires one step per enabled chain.');
 for(const chain of chains) {
  const step=chain.steps[0],provider=Object.hasOwn(providerDefinitions,step.provider)?providerDefinitions[step.provider]:null;
  if(!provider||typeof step.model!=='string'||!/^[a-zA-Z0-9._-]{1,100}$/.test(step.model)) throw Error('Generation configuration contains an unsupported provider or model identifier.');
  if(!env[provider.key]?.trim()) throw Error(`${provider.name} credentials are missing on this server. Configure ${provider.key} before enabling this model.`);
 }
 return chains;
}
export async function generateProviderCaption(bytes,step,instructions,{env=process.env,fetchImpl=fetch}={}) {
 const definition=Object.hasOwn(providerDefinitions,step.provider)?providerDefinitions[step.provider]:null;
 if(!definition||!env[definition.key]?.trim()) throw Error('Provider is not configured.');
 const options={apiKey:env[definition.key],fetch:fetchImpl};
 // Fixed adapters and endpoints: database entries cannot redirect credentials.
 const model=step.provider==='google_gemini'?createGoogle(options)(step.model):step.provider==='openai'?createOpenAI(options).responses(step.model):createAnthropic(options)(step.model);
 const settings={maxOutputTokens:2048,maxRetries:0};
 const result=await generateText({model,...settings,
  ...(step.provider==='google_gemini'?{temperature:Number(step.temperature)}:{}),
  system:instructions,
  messages:[{role:'user',content:[{type:'text',text:'Caption this image in at most 240 characters.'},{type:'file',data:bytes,mediaType:'image/webp'}]}],
  output:Output.object({schema:jsonSchema({type:'object',properties:{caption:{type:'string'}},required:['caption'],additionalProperties:false})}),
  abortSignal:AbortSignal.timeout(25000),include:{responseBody:true},
 });
 const caption=result.output?.caption;
 if(result.finishReason!=='stop'||typeof caption!=='string'||!caption.trim()||[...caption.trim()].length>240) throw Error('Invalid provider response');
 // Do not persist request bodies, image bytes, credentials or HTTP headers.
 return {caption:caption.trim(),response:result.response.body??{text:result.text},usage:result.usage,
  finish_reason:result.finishReason,generation_config:{...settings,...(step.provider==='google_gemini'?{temperature:Number(step.temperature)}:{temperature:'provider default'})}};
}
