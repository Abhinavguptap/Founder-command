/** A repository address is metadata, never a credential or an execution grant. */
export function githubRepositoryUrl(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048) throw Error('Invalid GitHub repository link');
  const text = value.trim();
  if (!text) return '';
  let u: URL;
  try { u = new URL(text); } catch { throw Error('Use https://github.com/owner/repository'); }
  if (u.protocol !== 'https:' || u.hostname !== 'github.com' || u.port || u.username || u.password || u.search || u.hash)
    throw Error('Use a GitHub HTTPS repository link without credentials, query or fragment');
  const parts = u.pathname.replace(/\/$/, '').split('/');
  if (parts.length !== 3) throw Error('Use the repository root: https://github.com/owner/repository');
  const owner = parts[1], repo = parts[2].replace(/\.git$/, '');
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
      !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) || ['.', '..'].includes(repo))
    throw Error('Invalid GitHub owner or repository name');
  return `https://github.com/${owner}/${repo}`;
}
