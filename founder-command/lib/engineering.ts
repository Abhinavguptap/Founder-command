import {queuedTasks} from './queue';
import {filesFor} from './references';
import {engineeringTarget,engineeringTargets} from './engineering-targets';
import {change,read,log,checkedText,State,Task} from './workspace';
export const repository='Abhinavguptap/VaartaX';
export const directory='VaartaX-Cloudflare-GitHub';
export type Job={company?:string;repository?:string;directory?:string;baseBranch?:string;id:string;taskId:string;runId:string;branch:string;started:string;expires:string;leaseHash:string;status:'Running'|'Review'|'Blocked';evidence:string;pr?:string;commit?:string;tests?:string};
export type Engineering={enabled:boolean;jobs:Job[];lastCheck?:string;automationId?:string};
export function engine(s:State):Engineering{return s.engineering||{enabled:false,jobs:[]};}
async function hash(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
export async function engineeringAction(b:any){
 if(b.action==='status'){const {state}=await read();return {repository,directory,targets:engineeringTargets(state.companies),engineering:engine(state),tasks:state.tasks.filter(t=>engineeringTarget(t.company,state.companies)&&['Engineering','Security'].includes(t.role)).map(t=>({...t,target:engineeringTarget(t.company,state.companies),references:filesFor(state,t.referenceIds)}))};}
 if(b.action==='enable'){return change(s=>{s.engineering={...engine(s),enabled:b.enabled===true};log(s,b.enabled?'Enabled cloud engineering queue':'Paused cloud engineering queue');});}
 if(b.action==='register-schedule'){const automationId=checkedText(b.automationId,120);if(!/^Automation_[a-zA-Z0-9]+$/.test(automationId))throw Error('Invalid schedule');return change(s=>{s.engineering={...engine(s),automationId};log(s,'Linked cloud engineering schedule');});}
 if(b.action==='enqueue'){
 const title=checkedText(b.title,200),criteria=checkedText(b.criteria,6000),id=checkedText(b.taskId||crypto.randomUUID(),100);if(!title||!criteria||!/^[a-zA-Z0-9-]+$/.test(id))throw Error('Task title, criteria and valid ID required');
 const company=checkedText(b.company||'vaartax',100);
 return change(s=>{if(!engineeringTarget(company,s.companies))throw Error('Enable engineering for this company first');if(s.tasks.some(t=>t.id===id))return;if(s.tasks.length>=500)throw Error('Task capacity reached');s.tasks.unshift({id,company,title,criteria,role:'Engineering',status:'Queued',evidence:'',due:'',created:new Date().toISOString()});log(s,`CEO queued engineering task: ${title}`);});
 }
 if(b.action==='claim'){
 const runId=checkedText(b.runId,100);if(!/^[a-zA-Z0-9-]+$/.test(runId))throw Error('Use a unique run ID');
 const token=crypto.randomUUID()+crypto.randomUUID(),leaseHash=await hash(token),jobId=crypto.randomUUID();
 const output=await change(s=>{const e=engine(s);s.engineering=e;e.lastCheck=new Date().toISOString();
 for(const j of e.jobs){if(j.status==='Running'&&Date.parse(j.expires)<Date.now()){j.status='Blocked';j.evidence='Worker lease expired. Inspect its existing branch before explicitly requeuing; no automatic replay.';const t=s.tasks.find(t=>t.id===j.taskId);if(t&&t.status==='In progress'){t.status='Blocked';t.evidence=j.evidence;}log(s,'Engineering lease expired; task blocked to avoid duplicate work');}}
 if(!e.enabled||e.jobs.some(j=>j.status==='Running')||e.jobs.some(j=>j.runId===runId))return;
 const t=queuedTasks(s)[0];if(!t)return;
 const branch='founder/'+runId.toLowerCase(),target=engineeringTarget(t.company,s.companies)!;
 const j:Job={id:jobId,taskId:t.id,runId,branch,company:t.company,repository:target.repository,directory:target.directory,baseBranch:target.baseBranch,started:new Date().toISOString(),expires:new Date(Date.now()+90*60*1000).toISOString(),leaseHash,status:'Running',evidence:''};
 e.jobs.unshift(j);e.jobs=e.jobs.slice(0,150);t.status='In progress';log(s,`Cloud engineer claimed: ${t.title}`);
 });
 const j=output.state.engineering?.jobs.find(j=>j.id===jobId);
 const task=output.state.tasks.find(t=>t.id===j?.taskId);
 return j?{claimed:true,job:{...j,leaseHash:undefined},leaseToken:token,task:task&&{...task,references:filesFor(output.state,task.referenceIds)},repository:j.repository,baseBranch:j.baseBranch,directory:j.directory,policy:{maxFiles:8,maxChangedLines:500,productionDeployment:false,autoMerge:false,paidCalls:false}}:{claimed:false,reason:'Queue paused, empty, already claimed or another engineer is active'};
 }
 if(b.action==='result'){
 const id=checkedText(b.jobId,100),leaseHash=await hash(checkedText(b.leaseToken,200)),evidence=checkedText(b.evidence,12000),tests=checkedText(b.tests||'Not run',6000);
 if(!evidence)throw Error('Evidence required');if(!['Review','Blocked'].includes(b.status))throw Error('Result must request review or report blocked work');
 const pr=checkedText(b.pr||'',500),commit=checkedText(b.commit||'',50);
 if(commit&&!/^[a-f0-9]{40}$/.test(commit))throw Error('Invalid commit SHA');if(b.status==='Review'&&(!pr||!commit))throw Error('A PR and exact commit SHA are required for engineering review');
 return change(s=>{const e=engine(s),j=e.jobs.find(j=>j.id===id);if(!j||j.leaseHash!==leaseHash)throw Error('Invalid job lease');
 const expected='https://github.com/'+(j.repository||repository)+'/pull/';
 if(pr&&(!pr.startsWith(expected)||!(/^[1-9][0-9]*$/).test(pr.slice(expected.length))))throw Error('Pull request must match this job repository');
 if(j.status!=='Running'){if(j.status===b.status&&j.pr===pr&&j.commit===commit)return;throw Error('Job already closed');}
 if(Date.parse(j.expires)<Date.now())throw Error('Lease expired. Inspect and requeue explicitly.');
 const t=s.tasks.find(t=>t.id===j.taskId);if(!t)throw Error('Task not found');j.status=b.status;j.evidence=evidence;j.pr=pr;j.commit=commit;j.tests=tests;
 t.status=b.status;t.evidence=[evidence,pr&&'Pull request: '+pr,commit&&'Commit: '+commit,'Verification: '+tests].filter(Boolean).join('\n\n');log(s,`Cloud engineer returned ${t.title}: ${b.status}`);
 });
 }
 throw Error('Unknown engineering action');
}
