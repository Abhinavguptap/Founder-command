'use client';
import type {FormEvent} from 'react';
import {ArrowUpRight} from 'lucide-react';
import type {Company} from '../lib/workspace';
import {githubRepositoryUrl} from '../lib/github-link';
import {companyEngineering} from '../lib/engineering-targets';

export default function CompanyGithub({company, busy, onSubmit, onConfigure, onDisable}: {
  company: Company; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onConfigure:(event:FormEvent<HTMLFormElement>)=>void;onDisable:()=>void;
}) {
  let url = '';
  try { url = githubRepositoryUrl(company.github || ''); } catch { /* Never render an unsafe stored URL. */ }
  const target=companyEngineering(company);
  return <>
    {url && <a className="secondary website-link" href={url} target="_blank" rel="noopener noreferrer">
      Open GitHub <ArrowUpRight size={14}/>
    </a>}
    <details className="website-editor">
      <summary>{company.github ? 'Edit GitHub repository' : 'Add GitHub repository'}</summary>
      <form onSubmit={onSubmit}>
        <input type="hidden" name="id" value={company.id}/>
        <label>GitHub repository<input key={company.github || 'empty'} type="url" name="github"
          defaultValue={company.github || ''} maxLength={2048} placeholder="https://github.com/owner/repository"/></label>
        <button className="secondary" disabled={busy}>Save GitHub link</button>
        <p className="fine">Public or private repository. Leave blank to remove. Never paste a token or password.</p>
        <p className="fine">Use the engineering controls below to authorise coding for this company.</p>
      </form>
    </details>
    <section className="company-engineering">
      <p className="fine">{target?.enabled?`Engineering enabled · ${target.repository} · ${target.directory}`:'Engineering disabled for this company'}</p>
      <details className="website-editor">
        <summary className="secondary">{target?.enabled?'Configure engineering':'Enable engineering'}</summary>
        <form key={JSON.stringify(target)} onSubmit={onConfigure}>
          <input type="hidden" name="id" value={company.id}/>
          <input type="hidden" name="enabled" value="true"/>
          <label>Repository<input name="repository" type="url" required maxLength={2048}
            defaultValue={target?.repository?'https://github.com/'+target.repository:url} placeholder="https://github.com/owner/repository"/></label>
          <label>App folder<input name="directory" required maxLength={300} defaultValue={target?.directory||'.'} placeholder=". for repository root"/></label>
          <label>Base branch<input name="baseBranch" required maxLength={100} defaultValue={target?.baseBranch||'main'}/></label>
          <button className="primary" disabled={busy}>{target?.enabled?'Save engineering settings':'Enable engineering'}</button>
          <p className="fine">Authorises the worker to read and change code here through draft PRs. GitHub access is checked when work is picked up. Merge and deployment stay with you.</p>
          <p className="fine">Use . for the whole repository. The shared worker checks hourly; enable it under Engineering if paused.</p>
        </form>
      </details>
      {target?.enabled&&<button className="secondary" type="button" disabled={busy} onClick={onDisable}>Disable engineering</button>}
      <p className="fine">Disabling stops new claims. A job already running may finish. Blocked requests need a new request or explicit retry.</p>
    </section>
  </>;
}
