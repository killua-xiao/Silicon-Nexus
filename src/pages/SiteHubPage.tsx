import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { WirePublicShell } from '../components/WirePublicShell';

type SiteHub = {
  site: {
    slug: string;
    name: string;
    domain: string | null;
    description: string;
  };
  formats: {
    llmsTxt: string;
    feedJson: string;
    contentMd: string;
  };
};

export function SiteHubPage() {
  const { siteSlug = '' } = useParams();
  const [data, setData] = useState<SiteHub | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!siteSlug) return;
    fetch(`/api/sites/${encodeURIComponent(siteSlug)}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<SiteHub>;
      })
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch(() => setError('Site not found'));
  }, [siteSlug]);

  const site = data?.site;
  const domain = site?.domain
    ? site.domain.startsWith('http')
      ? site.domain
      : `https://${site.domain}`
    : '';

  return (
    <WirePublicShell>
      <p className="nx-kicker mb-2">Publish surface</p>
      <h1 className="text-[1.75rem] font-semibold tracking-tight text-ink md:text-[2rem]">
        {site?.name || siteSlug || 'Site hub'}
      </h1>
      <p className="mt-4 leading-relaxed text-ink-muted">
        {error ||
          site?.description ||
          'Customer site content mirrored on Silicon Nexus for agent discovery. This is a legacy publish-surface hub, not Silicon News Wire, and not a promise of search or LLM inclusion.'}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Individual mirrored pages send noindex and a canonical link to the source
        {domain ? ` (${domain})` : ''}. Prefer the canonical URL when one is listed.
      </p>
      <p className="mt-6 flex flex-wrap gap-3 font-mono text-[11px] text-ink-muted">
        <a className="text-wire-blue/80 hover:underline" href={`/sites/${encodeURIComponent(siteSlug)}/llms.txt`}>
          llms.txt
        </a>
        <a className="text-wire-blue/80 hover:underline" href={`/sites/${encodeURIComponent(siteSlug)}/feed.json`}>
          feed.json
        </a>
        <a className="text-wire-blue/80 hover:underline" href={`/sites/${encodeURIComponent(siteSlug)}.md`}>
          {siteSlug}.md
        </a>
        <Link className="text-wire-blue/80 hover:underline" to="/about">
          About the hub
        </Link>
      </p>
    </WirePublicShell>
  );
}
