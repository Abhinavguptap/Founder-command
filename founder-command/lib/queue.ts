import type {State,Task} from './workspace';
import {engineeringTarget} from './engineering-targets';
export function eligible(t:Task,s:State){return !!engineeringTarget(t.company,s.companies)&&['Engineering','Security'].includes(t.role);}
export function oldestFirst<T extends {id:string;created:string}>(rows:T[]){return [...rows].sort((a,b)=>(Date.parse(a.created)||0)-(Date.parse(b.created)||0)||a.id.localeCompare(b.id));}
export function queuedTasks(s:State){return oldestFirst(s.tasks.filter(t=>eligible(t,s)&&t.status==='Queued'));}
export function taskReason(s:State,t:Task){
 if(t.status==='Cancelled')return 'Cancelled by you. Preserved in history and excluded from worker claims.';
 if(t.status==='Review')return 'Your action: review the evidence and PR. Approve the result or request changes. Code is not merged or deployed.';
 if(t.status==='Approved')return 'Accepted by you. Approval only records your decision; GitHub merge and deployment are separate.';
 if(t.status==='Blocked')return 'Cannot continue. Open the task to read the blocker and required next action.';
 if(t.status==='Done')return 'Recorded as finished. See evidence for what was actually verified.';
 const active=s.engineering?.jobs.find(j=>j.taskId===t.id&&j.status==='Running');
 if(t.status==='In progress')return active?'Cloud engineer claimed this task. Evidence will appear when it returns.':'Manually marked in progress. No active cloud engineer claim is recorded.';
 if(!eligible(t,s))return ['Engineering','Security'].includes(t.role)?'Waiting: enable engineering on this company card under Companies.':'Manual task — this role is not executed by the coding worker. Ask CEO can provide planning advice.';
 if(!s.engineering?.enabled)return 'Waiting: cloud coordinator is paused. Enable it under Engineering.';
 if(!s.engineering.automationId)return 'Waiting: no cloud schedule is linked. Enabling the queue alone cannot start a worker.';
 const running=s.engineering.jobs.find(j=>j.status==='Running');
 const position=queuedTasks(s).findIndex(v=>v.id===t.id)+1;
 return running?`Waiting behind the active engineering job. Queue position ${position}. The next hourly check picks up pending work after the worker is free.`:`Ready for the next hourly check. Queue position ${position}; oldest eligible request first. Submitting does not start an immediate run.`;
}
export function cancelTask(s:State,id:string){
 const t=s.tasks.find(t=>t.id===id);if(!t)throw Error('Task not found');
 if(s.engineering?.jobs.some(j=>j.taskId===id&&j.status==='Running'))throw Error('A running job cannot be cancelled here. Pause new work and review its result.');
 if(t.status==='Cancelled')return;
 if(t.status!=='Queued')throw Error('Only queued tasks can be cancelled');
 t.status='Cancelled';const r=s.ceoRequests?.find(r=>r.taskId===id);if(r)r.status='Cancelled';
}
export function restoreTask(s:State,id:string){
 const t=s.tasks.find(t=>t.id===id);if(!t||t.status!=='Cancelled')throw Error('Only cancelled tasks can be restored');
 if(s.engineering?.jobs.some(j=>j.taskId===id))throw Error('Existing engineering evidence found. Ask CEO to inspect the branch before requeuing.');
 t.status='Queued';const r=s.ceoRequests?.find(r=>r.taskId===id);if(r)r.status='Delegated';
}
