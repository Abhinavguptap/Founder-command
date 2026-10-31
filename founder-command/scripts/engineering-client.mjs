// Service access is passed through stdin only. Never put it in arguments or files.
import readline from 'node:readline';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
const lines=readline.createInterface({input:process.stdin,terminal:false});
console.log('Ready for engineering request JSON on stdin.');
lines.once('line',async line=>{try{const {token,request,method='POST'}=JSON.parse(line);const response=await fetch('https://founder-command.abhi-gupta0416.chatgpt.site/api/engineering',{method,redirect:'error',headers:{'Content-Type':'application/json','OAI-Sites-Authorization':'Bearer '+token},body:method==='GET'?undefined:JSON.stringify(request),signal:AbortSignal.timeout(30000)});let data;try{data=await response.json();}catch{data={error:'Non-JSON response'};}console.log(JSON.stringify({status:response.status,data}));}catch(e){console.log(JSON.stringify({status:0,error:e.message}));process.exitCode=1;}finally{lines.close();process.stdin.pause();process.stdin.destroy();}});
