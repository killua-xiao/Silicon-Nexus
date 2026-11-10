import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { matchSiteHubSlug, resolveHubPageMeta } from '../lib/hubPageMeta';

/** Keep the tab title in lockstep with the production HTML-shell rewriter. */
export function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const mapped = resolveHubPageMeta(pathname);
    if (mapped) {
      document.title = mapped.title;
      return;
    }
    const siteSlug = matchSiteHubSlug(pathname);
    if (siteSlug) {
      document.title = `${siteSlug} · Silicon Nexus hub`;
      return;
    }
    document.title = 'Silicon Nexus';
  }, [pathname]);
  return null;
}
