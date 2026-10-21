import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolveSpaPageMeta } from '../lib/spaPageMeta';

/** Keep the tab title in lockstep with the production HTML-shell rewriter. */
export function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = resolveSpaPageMeta(pathname).title;
  }, [pathname]);
  return null;
}
