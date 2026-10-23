import { Link } from 'react-router-dom';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { useT } from '../i18n/I18nProvider';

export function CookbookPage() {
  const t = useT();
  const c = t.cookbook;
  const recipes: Array<{
    title: string;
    body: string;
    code: string;
    tip?: string;
    legacy?: boolean;
  }> = [
    { title: c.memoryTitle, body: c.memoryBody, code: c.memoryCode },
    { title: c.taskTitle, body: c.taskBody, code: c.taskCode, tip: c.continuityTip },
    { title: c.geoTitle, body: c.geoBody, code: c.geoCode, legacy: true },
  ];

  return (
    <div className="min-h-screen bg-foundry-950 foundry-grid text-foundry-100">
      <SiteHeader compact />
      <main className="mx-auto max-w-3xl px-5 py-8 md:px-6">
        <p className="nx-kicker mb-2">{c.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{c.title}</h1>
        <p className="mt-4 leading-relaxed text-foundry-400">{c.lead}</p>
        <ol className="mt-10 space-y-6">
          {recipes.map((recipe, i) => (
            <li key={recipe.title} className="nx-card p-5">
              <p className="font-mono text-[11px] tracking-[0.16em] text-teal-glow">
                {recipe.legacy ? 'LEGACY' : `0${i + 1}`}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{recipe.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-foundry-400">{recipe.body}</p>
              {recipe.tip ? (
                <p className="mt-2 text-sm leading-relaxed text-foundry-400">{recipe.tip}</p>
              ) : null}
              <pre className="mt-4 overflow-x-auto rounded border border-white/10 bg-foundry-950 p-3 font-mono text-[11px] leading-relaxed text-foundry-200">
                {recipe.code}
              </pre>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/connect" className="nx-btn nx-btn-primary">
            {t.connect.pageTitle}
          </Link>
          <Link to="/console" className="nx-btn nx-btn-ghost">
            {t.nav.openConsole}
          </Link>
        </div>
      </main>
      <SiteFooter tagline={t.landing.footer} copyright={t.landing.copyright} />
    </div>
  );
}
