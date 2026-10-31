import {db,endpoint,publicKey,sendPush} from '../../../lib/push';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){return json({configured:!!publicKey(),publicKey:publicKey()});}
export async function POST(r:Request){
 try{
 if(r.headers.get('origin')!==new URL(r.url).origin)return json({error:'Same-origin browser request required'},403);
 if(!r.headers.get('content-type')?.includes('application/json'))return json({error:'JSON required'},415);
 const text=await r.text();if(text.length>6000)return json({error:'Request too large'},413);
 const b=JSON.parse(text),url=endpoint(b.endpoint),database=await db();
 if(b.action==='subscribe'){
 if(!publicKey())throw Error('Push not configured');
 const count=await database.prepare('SELECT count(*) AS n FROM push_devices').first<{n:number}>();
 const exists=await database.prepare('SELECT endpoint FROM push_devices WHERE endpoint=?').bind(url).first();
 if(!exists&&(count?.n||0)>=10)throw Error('Maximum 10 devices. Disable an old device first.');
 await database.prepare('INSERT OR IGNORE INTO push_devices(endpoint,created) VALUES (?,?)').bind(url,new Date().toISOString()).run();
 return json({saved:true});
 }
 if(b.action==='unsubscribe'){await database.prepare('DELETE FROM push_devices WHERE endpoint=?').bind(url).run();return json({removed:true});}
 const row=await database.prepare('SELECT last_status,last_attempt FROM push_devices WHERE endpoint=?').bind(url).first<{last_status:number|null;last_attempt:string|null}>();
 if(b.action==='status')return json({registered:!!row,lastStatus:row?.last_status,lastAttempt:row?.last_attempt});
 if(b.action==='test'){
 if(!row)throw Error('Enable this device first');
 if(row.last_attempt&&Date.now()-Date.parse(row.last_attempt)<10000)return json({error:'Wait 10 seconds before another test'},429);
 const accepted=await sendPush(url);return json({accepted,message:accepted?'Push service accepted the alert. Check this device; receipt and sound depend on device settings.':'Alert delivery failed on the server. Your registration is saved; try the test again later.'},accepted?200:502);
 }
 throw Error('Unknown action');
 }catch(e){return json({error:e instanceof Error?e.message:'Notification setup failed'},400);}
}
