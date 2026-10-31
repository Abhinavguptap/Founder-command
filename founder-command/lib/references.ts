import type {State,ReferenceFile} from './workspace';
export const MAX_REFERENCES=20;
export const MAX_REFERENCE_BYTES=50*1024*1024;
export function referenceIds(value:unknown):string[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>MAX_REFERENCES||value.some(id=>typeof id!=='string'||!/^[a-zA-Z0-9-]+$/.test(id)))throw Error('Choose up to 20 valid reference files');
 return [...new Set(value)];
}
export function filesFor(s:State,ids:string[]=[]){return ids.map(id=>s.files.find(f=>f.id===id)).filter((f):f is ReferenceFile=>!!f).map(f=>({...f,readUrl:'/api/files?id='+encodeURIComponent(f.id),previewUrl:f.mediaType?.startsWith('image/')?'/api/files?id='+encodeURIComponent(f.id)+'&preview=1':undefined}));}
export function validateReferences(s:State,company:string,ids:string[]){
 const files=ids.map(id=>s.files.find(f=>f.id===id&&f.company===company));
 if(files.some(f=>!f))throw Error('Reference file not found in this company');
 if(files.reduce((n,f)=>n+f!.size,0)>MAX_REFERENCE_BYTES)throw Error('References must total 50 MB or less');
}
export function relativePath(value:string){
 const path=value.replace(/\\/g,'/');
 if(path.length>1000||path.startsWith('/')||path.split('/').some(p=>!p||p==='.'||p==='..')||/[\x00-\x1f\x7f]/.test(path))throw Error('Invalid folder path');
 return path;
}
export function imageType(bytes:Uint8Array){
 if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return 'image/png';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(String.fromCharCode(...bytes.slice(0,6)).match(/^GIF8[79]a$/))return 'image/gif';
 if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 return 'application/octet-stream';
}
