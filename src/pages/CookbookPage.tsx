import { Link } from 'react-router-dom';
import { WirePublicShell } from '../components/WirePublicShell';
import { useT } from '../i18n/I18nProvider';

export function CookbookPage() {
  const t = useT();
  const c = t.cookbook;
  const recipes = [
    { title: c.memoryTitle, body: c.memoryBody, code: c.memoryCode },
    { title: c.taskTitle, body: c.taskBody, code: c.taskCode },
    { title: c.geoTitle, body: c.geoBody, code: c.geoCode, legacy: true },
  ];

  return (
    <WirePublicShell>

        <p className="nx-kicker mb-2">{c.eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{c.title}</h1>
        <p className="mt-4 leading-relaxed text-ink-muted">{c.lead}</p>
        <ol className="mt-10 space-y-6">
          {recipes.map((recipe, i) => (
            <li key={recipe.title} className="nx-card p-5">
              <p className="font-mono text-[11px] tracking-[0.16em] text-wire-blue">
                {recipe.legacy ? 'LEGACY' : `0${i + 1}`}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{recipe.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{recipe.body}</p>
              <pre className="mt-4 overflow-x-auto rounded border border-grid-line bg-carbon-paper p-3 font-mono text-[11px] leading-relaxed text-ink">
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
      </WirePublicShell>
  );
}
