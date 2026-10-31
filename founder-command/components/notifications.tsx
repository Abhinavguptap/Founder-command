'use client';
import {useEffect,useState} from 'react';
export default function Notifications(){
 const [supported,S]=useState(false),[active,A]=useState(false),[busy,B]=useState(false),[message,M]=useState('Checking this device…');
 async function api(action:string,endpoint:string){const r=await fetch('/api/notifications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,endpoint})});const d:any=await r.json();if(!r.ok)throw Error(d.error||d.message||'Notification request failed');return d;}
 useEffect(()=>{const ok='serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;S(ok);if(!ok){M('Push is unavailable in this browser. On iPhone, add this site to your Home Screen and open it there.');return;}
 navigator.serviceWorker.getRegistration('/').then(async reg=>{if(reg)await reg.update();const sub=await reg?.pushManager.getSubscription();if(sub){const d=await api('status',sub.endpoint);A(d.registered&&Notification.permission==='granted');M(d.registered?'Registered on this device. Use Test notification to check delivery.':'Enable notifications to register this device.');}else M(Notification.permission==='denied'?'Notifications blocked. Allow them in browser or device settings, then reload.':'Notifications are off on this device.');}).catch(()=>M('Could not check notification setup. Reload to retry.'));
 },[]);
 async function run(action:string){B(true);try{
 if(action==='enable'){
 const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('Permission was not granted. Allow notifications in your device/browser settings.');
 const r=await fetch('/api/notifications',{cache:'no-store'});const d:any=await r.json();if(!d.configured)throw Error('Server push configuration is unavailable.');
 const registration=await navigator.serviceWorker.register('/sw.js',{scope:'/'});await registration.update();
 const reg=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>setTimeout(()=>reject(Error('Service worker did not become ready. Reload and retry.')),15000))]);
 const key=Uint8Array.from(atob(d.publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
 const sub=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
 await api('subscribe',sub.endpoint);A(true);M('Enabled on this device. Send a test notification to verify delivery.');
 }else{
 const reg=await navigator.serviceWorker.getRegistration('/');const sub=await reg?.pushManager.getSubscription();if(!sub)throw Error('Enable notifications first.');
 if(action==='disable'){await api('unsubscribe',sub.endpoint);await sub.unsubscribe();A(false);M('Notifications disabled on this device.');}
 else{const d=await api('test',sub.endpoint);M(d.message);}
 }
 }catch(e){M(e instanceof Error?e.message:'Notification setup failed');}finally{B(false);}}
 return <section className="panel notification-settings"><h2>Device notifications</h2><p>Get an alert when work starts, is ready for review, becomes blocked, or the CEO needs your answer. Alerts also cover CEO replies and completed decisions.</p><p className="muted">Enable separately on your phone and laptop. Your device controls sound, volume, silent mode and Do Not Disturb. Alerts contain no task details.</p><p role="status">{message}</p><div className="card-actions"><button className="primary" disabled={busy||!supported} onClick={()=>run(active?'disable':'enable')}>{active?'Disable on this device':'Enable on this device'}</button>{active&&<button className="secondary" disabled={busy} onClick={()=>run('test')}>Test notification</button>}</div><p className="fine">iPhone/iPad: Safari → Share → Add to Home Screen; open the installed app, then enable notifications. Delivery can be delayed by the browser, network or device settings. This does not make queued AI work start sooner.</p></section>;
}
