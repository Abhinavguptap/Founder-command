import {change,read,log,checkedText} from './workspace';
import {oldestFirst,cancelTask} from './queue';
import {engine} from './engineering';
import {referenceIds,validateReferences,filesFor} from './references';
import {engineeringTarget,engineeringTargets} from './engineering-targets';
export type CeoRequest={referenceIds?:string[];id:string;company:string;text:string;created:string;status:'Queued'|'Planning'|'Delegated'|'Advice ready'|'Needs your answer'|'Blocked'|'Cancelled';reply?:string;taskId?:string;runId?:string;leaseHash?:string;expires?:string};
async function hash(t:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
export async function ceoAction(b:any){
 if(b.action==='status'){const {state}=await read();return {enabled:engine(state).enabled,targets:engineeringTargets(state.companies),requests:(state.ceoRequests||[]).map(r=>({...r,references:filesFor(state,r.referenceIds)})),companies:state.companies,tasks:state.tasks,focus:state.focus,settings:state.settings};}
 if(b.action==='submit'){
  const id=checkedText(b.id,80),text=checkedText(b.text,6000),company=checkedText(b.company,100);
  if(!/^[a-zA-Z0-9-]+$/.test(id)||!text)throw Error('Please describe what you want to achieve');
  const refs=referenceIds(b.referenceIds);
  return change(s=>{s.ceoRequests||=[];if(s.ceoRequests.some(r=>r.id===id))return;if(!s.companies.some(c=>c.id===company))throw Error('Choose a company');validateReferences(s,company,refs);if(s.ceoRequests.length>=100)throw Error('Request capacity reached');s.ceoRequests.unshift({id,company,text,referenceIds:refs,created:new Date().toISOString(),status:'Queued'});log(s,'Sent a plain-language request to CEO');});
 }
 if(b.action==='cancel'){return change(s=>{const r=s.ceoRequests?.find(r=>r.id===b.id);if(!r)throw Error('Request not found');if(r.status==='Cancelled')return;if(r.taskId){cancelTask(s,r.taskId);}else{if(!['Queued','Needs your answer'].includes(r.status))throw Error('Only waiting requests can be cancelled');r.status='Cancelled';}log(s,'Cancelled CEO request; history preserved');});}
 if(b.action==='answer'){
  const text=checkedText(b.text,6000);if(!text)throw Error('Add your answer');
  return change(s=>{const r=s.ceoRequests?.find(r=>r.id===b.id);if(!r||r.status!=='Needs your answer')throw Error('This request is not waiting for an answer');if(r.text.length+text.length>12000)throw Error('Please submit a shorter answer');r.text+='\n\nFounder clarification: '+text;r.status='Queued';r.reply=undefined;});
 }
 if(b.action==='claim'){
  const runId=checkedText(b.runId,100);if(!/^[a-zA-Z0-9-]+$/.test(runId))throw Error('Unique run ID required');
  const token=crypto.randomUUID()+crypto.randomUUID(),leaseHash=await hash(token);let claimedId='';
  const out=await change(s=>{claimedId='';s.ceoRequests||=[];for(const r of s.ceoRequests){if(r.status==='Planning'&&Date.parse(r.expires||'')<Date.now()){r.status='Blocked';r.reply='CEO planning lease expired. Submit a new request after checking for existing work.';}}
   if(!engine(s).enabled||s.ceoRequests.some(r=>r.status==='Planning'||r.runId===runId))return;
   const r=oldestFirst(s.ceoRequests.filter(r=>r.status==='Queued'))[0];if(!r)return;r.status='Planning';r.runId=runId;r.leaseHash=leaseHash;r.expires=new Date(Date.now()+30*60000).toISOString();claimedId=r.id;
  });
  const r=out.state.ceoRequests?.find(r=>r.id===claimedId);return r?{claimed:true,request:{...r,leaseHash:undefined,references:filesFor(out.state,r.referenceIds)},leaseToken:token}:{claimed:false};
 }
 if(b.action==='result'){
  const leaseHash=await hash(checkedText(b.leaseToken,200)),reply=checkedText(b.reply,12000);if(!reply)throw Error('CEO explanation required');
  if(!['Delegated','Advice ready','Needs your answer','Blocked'].includes(b.status))throw Error('Invalid CEO result');
  const title=b.status==='Delegated'?checkedText(b.title,200):'',criteria=b.status==='Delegated'?checkedText(b.criteria,6000):'';
  if(b.status==='Delegated'&&(!title||!criteria))throw Error('A bounded task and acceptance checks are required');
  return change(s=>{const r=s.ceoRequests?.find(r=>r.id===b.id);if(!r||r.leaseHash!==leaseHash)throw Error('Invalid CEO lease');if(r.status!=='Planning'){if(r.status===b.status&&r.reply===reply)return;throw Error('CEO request already closed');}if(Date.parse(r.expires||'')<Date.now())throw Error('CEO lease expired');
   if(b.status==='Delegated'){if(!engineeringTarget(r.company,s.companies))throw Error('Company engineering is not authorised');if(s.tasks.length>=500)throw Error('Task capacity reached');const taskId='ceo-'+r.id;if(s.tasks.some(t=>t.id===taskId))throw Error('Linked task already exists');s.tasks.unshift({id:taskId,company:r.company,title,criteria,referenceIds:r.referenceIds||[],role:'Engineering',status:'Queued',evidence:'',due:'',created:new Date().toISOString()});r.taskId=taskId;}
   r.status=b.status;r.reply=reply;log(s,'CEO returned a plan: '+b.status);
  });
 }
 throw Error('Unknown CEO action');
}
