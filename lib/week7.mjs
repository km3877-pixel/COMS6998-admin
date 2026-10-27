import { isUuid } from './management.mjs';
const text=(key,label,max,required=true)=>({key,label,max,required,type:'text'});
const area=(key,label,max,required=true)=>({...text(key,label,max,required),type:'textarea'});
export const resources={
 chains:{title:'Prompt chains',readOnly:true,description:'Chains used for new admin image captions. Open a chain to read its ordered steps.',fields:[text('name','Name',100),text('style','Style',100),area('description','Description',2000)]},
 steps:{title:'Prompt chain steps',readOnly:true,description:'Ordered prompts, models and generation settings.',fields:[text('chain_id','Chain',36),text('position','Step',10),text('name','Name',100),area('instructions','Instructions',10000),text('model_id','Model',36),text('temperature','Temperature',10)]},
 mix:{title:'Prompt chain mix',updateOnly:true,description:'Choose which styles to generate for new admin uploads. Each style supports zero or one caption; keep at least one enabled. Existing captions and consumer tone-slider generation are unchanged.',fields:[{key:'caption_count',label:'Captions per image',type:'number',min:0,max:1,required:true}]},
 terms:{title:'Terms',description:'Humor vocabulary and context for new admin captions. Up to 50 terms, alphabetically, are included per generation.',fields:[text('term','Term',100),area('definition','Definition',2000),area('example','Example usage',1000,false)]},
 examples:{title:'AI generation examples',description:'Example image descriptions and captions for new admin generations. Up to 20 examples are included per generation.',fields:[area('image_description','Image description',1000),area('caption','Example caption',500),area('explanation','Why it works',2000,false)]},
 models:{title:'LLM models',description:'Model identifiers and provider associations. Models used by prompt steps cannot be deleted.',fields:[text('name','Display name',100),text('model_id','Provider model identifier',100),{key:'provider_id',label:'Provider',type:'provider',required:true}]},
 providers:{title:'LLM providers',description:'Provider registry. The admin caption generator currently supports google_gemini. Credentials are configured on the server, never in these records.',fields:[text('name','Name',100),text('slug','Provider identifier',80)]},
 domains:{title:'Allowed signup domains',description:'Maintain the signup domain allowlist. These records do not grant administrator access. Signup enforcement is not enabled in the existing consumer app.',fields:[text('domain','Domain (for example columbia.edu)',253)]},
 emails:{title:'Whitelisted email addresses',description:'Maintain individual signup exceptions. These records do not grant administrator access. Signup enforcement is not enabled in the existing consumer app.',fields:[{...text('email','Email address',254),type:'email'}]},
};
export function parseConfigForm(form) {
 const resource=form.get('resource'), spec=Object.hasOwn(resources,resource)?resources[resource]:null;
 const operation=form.get('operation'),id=form.get('id'),revision=Number(form.get('revision'));
 if(!spec || spec.readOnly || !isUuid(id) || !['create','update','delete'].includes(operation) || (spec.updateOnly && operation!=='update') || !Number.isSafeInteger(revision) || revision<0) throw Error('Invalid request. Reload this page.');
 if(operation==='delete') { if(form.get('confirmation')!=='DELETE') throw Error('Type DELETE to confirm.'); return {resource,operation,id,revision,data:{}}; }
 const data={};
 for(const f of spec.fields) {
  const raw=form.get(f.key); if(typeof raw!=='string') throw Error(`Enter ${f.label.toLowerCase()}.`);
  const value=raw.trim();
  if(f.required && !value) throw Error(`Enter ${f.label.toLowerCase()}.`);
  if(f.type==='number') { if(!/^\d+$/.test(value) || Number(value)<f.min || Number(value)>f.max) throw Error(`Use ${f.min} or ${f.max} for ${f.label.toLowerCase()}.`); data[f.key]=Number(value); }
  else { if(f.max && [...value].length>f.max) throw Error(`${f.label} is too long.`); data[f.key]=['email','domain'].includes(f.key)?value.toLowerCase():value; }
 }
 if(resource==='providers' && !/^[a-z][a-z0-9_]{0,79}$/.test(data.slug)) throw Error('Use lowercase letters, numbers and underscores for the provider identifier.');
 if(resource==='models' && (!isUuid(data.provider_id)|| !/^[a-zA-Z0-9._-]{1,100}$/.test(data.model_id))) throw Error('Choose a provider and enter a valid model identifier.');
 if(resource==='emails' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw Error('Enter a valid email address.');
 if(resource==='domains' && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(data.domain)) throw Error('Enter a domain without https://, paths or wildcards.');
 return {resource,operation,id,revision,data};
}
export function safeRecord(value,depth=0) {
 if(depth>15) return '[Nested content omitted]';
 if(Array.isArray(value)) return value.map(v=>safeRecord(v,depth+1));
 if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,/^(authorization|api[_-]?key|access_token|refresh_token|secret|service_role_key|inlineData|inline_data)$/i.test(k)?'[Redacted]':safeRecord(v,depth+1)]));
 return value;
}
