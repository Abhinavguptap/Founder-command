import type {Company} from './workspace';
import {githubRepositoryUrl} from './github-link';
export type CompanyEngineering={enabled:boolean;repository:string;directory:string;baseBranch:string;authorisedAt?:string};
// Retain the founder's existing grants until that company's controls are saved.
export const engineeringDefaults = [
  {company:'vaartax',name:'VaartaX',repository:'Abhinavguptap/VaartaX',directory:'VaartaX-Cloudflare-GitHub',baseBranch:'main'},
  {company:'8261167d-1962-4913-b474-686de4d8f293',name:'Braingame',repository:'Abhinavguptap/Braingame',directory:'gate-runner',baseBranch:'main'},
] as const;
export function companyEngineering(company:Company):CompanyEngineering|undefined{
  if(company.engineering)return company.engineering;
  const previous=engineeringDefaults.find(t=>t.company===company.id);
  return previous?{enabled:true,...previous}:undefined;
}
export function engineeringTarget(id:string,companies:Company[]){
  const company=companies.find(c=>c.id===id);if(!company)return undefined;
  const target=companyEngineering(company);if(!target?.enabled)return undefined;
  return {company:id,name:company.name,repository:target.repository,directory:target.directory,baseBranch:target.baseBranch};
}
export function engineeringTargets(companies:Company[]){return companies.map(c=>engineeringTarget(c.id,companies)).filter((t):t is NonNullable<typeof t>=>!!t);}
export function checkedEngineering(input:{repository:unknown;directory:unknown;baseBranch:unknown}):CompanyEngineering{
  const url=githubRepositoryUrl(input.repository);if(!url)throw Error('Add a GitHub repository to enable engineering');
  const directory=typeof input.directory==='string'?input.directory.trim():'';
  if(!directory||directory.length>300||(directory!=='.'&&directory.split('/').some(p=>!p||p==='.'||p==='..'||!(/^[A-Za-z0-9_. -]+$/).test(p))))throw Error('Use a relative app folder, or . for the repository root');
  const baseBranch=typeof input.baseBranch==='string'?input.baseBranch.trim():'';
  if(!baseBranch||baseBranch.length>100||!(/^[A-Za-z0-9][A-Za-z0-9_./-]*$/).test(baseBranch)||baseBranch.includes('..')||baseBranch.split('/').some(p=>!p||p.startsWith('.')||p.endsWith('.')||p.endsWith('.lock')))throw Error('Use a valid base branch such as main');
  return {enabled:true,repository:url.slice('https://github.com/'.length),directory,baseBranch,authorisedAt:new Date().toISOString()};
}
