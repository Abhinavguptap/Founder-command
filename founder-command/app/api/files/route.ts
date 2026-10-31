import {env} from 'cloudflare:workers';
import {change,log,read,checkedText} from '../../../lib/workspace';
import {imageType,relativePath} from '../../../lib/references';
export async function POST(r:Request){try{
 if(r.headers.get('origin')&&new URL(r.headers.get('origin')!).host!==new URL(r.url).host)return Response.json({error:'Cross-origin request denied'},{status:403});
 if(Number(r.headers.get('content-length'))>11*1024*1024)throw Error('Choose a file up to 10 MB');
 const form=await r.formData(),file=form.get('file'),company=String(form.get('company'));
 if(!(file instanceof File)||file.size>10*1024*1024||!file.size)throw Error('Choose a non-empty file up to 10 MB');
 const id=checkedText(form.get('id')||crypto.randomUUID(),80);
 if(!/^[a-zA-Z0-9-]+$/.test(id))throw Error('Invalid file ID');
 const path=relativePath(String(form.get('path')||file.name));
 const bytes=await file.arrayBuffer(),mediaType=imageType(new Uint8Array(bytes));
 const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');
 const current=await read();if(!current.state.companies.some(c=>c.id===company))throw Error('Unknown company');
 const prior=current.state.files.find(f=>f.id===id);
 if(prior){if(prior.company!==company||prior.sha256!==sha256||prior.path!==path)throw Error('File ID already used by another upload');return Response.json({...current,file:prior});}
 const storageKey=id+'-'+sha256;
 const meta={id,company,name:file.name.slice(0,200),path,size:file.size,mediaType,sha256,storageKey};
 if(current.state.files.length>=1000||current.state.files.reduce((n,f)=>n+f.size,0)+file.size>250*1024*1024)throw Error('Workspace file capacity reached (250 MB / 1,000 files)');
 if(!env.BUCKET)throw Error('File storage unavailable');
 await env.BUCKET.put(storageKey,bytes,{httpMetadata:{contentType:mediaType}});
 try{
 const result=await change(s=>{const existing=s.files.find(f=>f.id===id);if(existing){if(existing.sha256!==sha256||existing.company!==company||existing.path!==path)throw Error('Conflicting upload');return;}if(s.files.length>=1000||s.files.reduce((n,f)=>n+f.size,0)+file.size>250*1024*1024)throw Error('Workspace file capacity reached');s.files.unshift(meta);log(s,'Uploaded reference: '+meta.name);});
 return Response.json({...result,file:meta},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){const saved=(await read()).state.files.some(f=>f.storageKey===storageKey);if(!saved)await env.BUCKET.delete(storageKey);throw e;}
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Upload failed'},{status:400});}}
export async function GET(r:Request){
 const url=new URL(r.url),id=url.searchParams.get('id'),{state}=await read(),meta=state.files.find(f=>f.id===id);
 if(!meta)return new Response('Not found',{status:404});
 const object=await env.BUCKET!.get(meta.storageKey||meta.id);if(!object)return new Response('Not found',{status:404});
 const preview=url.searchParams.get('preview')==='1'&&['image/png','image/jpeg','image/gif','image/webp'].includes(meta.mediaType||'');
 return new Response(object.body,{headers:{'Content-Type':preview?meta.mediaType!:'application/octet-stream','Content-Disposition':`${preview?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,'X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'private, no-store'}});
}
