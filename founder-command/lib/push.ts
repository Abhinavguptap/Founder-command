import {env} from 'cloudflare:workers';
import type {State} from './workspace';
const config=()=>env as unknown as {PUSH_PRIVATE_JWK?:string;PUSH_PUBLIC_KEY?:string};
export function publicKey(){return config().PUSH_PUBLIC_KEY||'';}
export function endpoint(value:unknown){
 if(typeof value!=='string'||value.length>4096)throw Error('Invalid subscription');
 const u=new URL(value);
 const host=u.hostname;
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||
 !(host==='fcm.googleapis.com'||host==='updates.push.services.mozilla.com'||host.endsWith('.push.services.mozilla.com')||host==='web.push.apple.com'||host.endsWith('.notify.windows.com')))throw Error('Unsupported push service');
 return u.href;
}
export async function db(){
 if(!env.DB)throw Error('Cloud database unavailable');
 await env.DB.prepare('CREATE TABLE IF NOT EXISTS push_devices (endpoint TEXT PRIMARY KEY, created TEXT NOT NULL, last_status INTEGER, last_attempt TEXT)').run();
 return env.DB;
}
const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
export async function authorization(url:string){
 const c=config();if(!c.PUSH_PRIVATE_JWK||!c.PUSH_PUBLIC_KEY)throw Error('Push not configured');
 const encode=(v:unknown)=>b64(new TextEncoder().encode(JSON.stringify(v)));
 const unsigned=encode({typ:'JWT',alg:'ES256'})+'.'+encode({aud:new URL(url).origin,exp:Math.floor(Date.now()/1000)+3600,sub:'https://founder-command.abhi-gupta0416.chatgpt.site'});
 const key=await crypto.subtle.importKey('jwk',JSON.parse(c.PUSH_PRIVATE_JWK),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);
 const sig=await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(unsigned));
 return 'vapid t='+unsigned+'.'+b64(new Uint8Array(sig))+', k='+c.PUSH_PUBLIC_KEY;
}
export async function sendPush(target:string){
 const safe=endpoint(target);const database=await db();
 let stage='signing';
 try{
 const auth=await authorization(safe);stage='sending';
 // Empty Web Push: no private task content or decryption keys leave the Site.
 const r=await fetch(safe,{method:'POST',headers:{Authorization:auth,TTL:'3600',Urgency:'normal'},redirect:'manual',signal:AbortSignal.timeout(5000)});
 if(r.status===404||r.status===410)await database.prepare('DELETE FROM push_devices WHERE endpoint=?').bind(safe).run();
 else await database.prepare('UPDATE push_devices SET last_status=?,last_attempt=? WHERE endpoint=?').bind(r.status,new Date().toISOString(),safe).run();
 return r.status===201||r.status===202;
 }catch(e){const name=e instanceof Error?e.name:'Unknown';console.warn('Push failure stage='+stage+' kind='+(['TypeError','SyntaxError','DataError','NotSupportedError','OperationError','TimeoutError','InvalidAccessError'].includes(name)?name:'Other'));await database.prepare('UPDATE push_devices SET last_status=0,last_attempt=? WHERE endpoint=?').bind(new Date().toISOString(),safe).run();return false;}
}
export function changedForNotification(before:State,after:State){
 return after.tasks.some(t=>['In progress','Review','Blocked','Approved','Done'].includes(t.status)&&before.tasks.some(p=>p.id===t.id&&p.status!==t.status))||
 (after.ceoRequests||[]).some(t=>['Planning','Delegated','Advice ready','Needs your answer','Blocked'].includes(t.status)&&(before.ceoRequests||[]).some(p=>p.id===t.id&&p.status!==t.status));
}
export async function notifyChanges(before:State,after:State){
 if(!publicKey()||!changedForNotification(before,after))return;
 try{const database=await db();const rows=await database.prepare('SELECT endpoint FROM push_devices LIMIT 10').all<{endpoint:string}>();await Promise.all(rows.results.map(r=>sendPush(r.endpoint)));}catch{console.warn('Push delivery unavailable; workspace change remains saved');}
}
