import type { ReactNode } from 'react';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

/** Light Swiss Grid shell shared by public SPA pages (matches Wire SSR). */
export function WirePublicShell({
  children,
  activeChannel,
}: {
  children: ReactNode;
  activeChannel?: string;
}) {
  return (
    <div className="wire-public-shell min-h-screen">
      <SiteHeader variant="public" activeChannel={activeChannel} />
      <main className="wrap wire-public-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
