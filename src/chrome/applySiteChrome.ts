import { SITE_CHROME_CSS } from './siteChrome';

const STYLE_ID = 'nx-site-chrome';

/** Inject shared chrome CSS once, before the first SPA paint. */
export function applySiteChromeCss(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = SITE_CHROME_CSS;
  document.head.appendChild(style);
}

applySiteChromeCss();
