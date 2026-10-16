# Silicon Nexus design system — Foundry Workbench

**1 · 铸造厂工作台.** Dark, calm, high-density operator UI. Linear-like layout rhythm (precision, speed, tight chrome) — **not** Linear purple/glow, and **not** a marketing poster.

This file is the source of truth for visual language. It matches shipped tokens in `src/index.css` and the React shell. Docs-only PR [#2](https://github.com/killua-xiao/Silicon-Nexus/pull/2) described the previous navy + cyan-glow look; **this document supersedes it.**

Live hub: https://silinex.xyz · Product frame: [`docs/PRODUCT.md`](./docs/PRODUCT.md) · Dual audience: [`docs/DUAL_AUDIENCE.md`](./docs/DUAL_AUDIENCE.md)

---

## Intent

Silicon Nexus is a **portable body hub** (console + REST/MCP). The UI should feel like a foundry workbench you sit down and use:

- Open the console and work — no giant hero, no waiting for an illustration to finish.
- MCP, memory, feed, tasks are **process panels** (status, IDs, JSON), not product posters.
- Humans and agents share the same state. Chrome can differ; facts cannot.

Learn **density and speed** from Linear. Do not copy Linear branding.

---

## Do / don't

| Do | Don't |
|----|--------|
| Graphite canvas, hairline borders, small radius | Navy abyss + cyan neon stacks |
| 13–14px body, 11px mono for status / IDs / JSON | Display-xl marketing headlines as the first screen |
| Compact header (~44px), tight section gaps | Full-viewport heroes, 80px section padding |
| Flat cards; hover = tint + border, not lift | Glow orbs, mesh/aurora gradients, card lift + bloom |
| Brass accent used sparingly (focus, links, labels) | Accent as a glow, orb, or full-width wash |
| Keyboard-visible `:focus-visible` rings | Decorative SVG replacing live status |
| Honest crawl badges (`observed`, not “indexed”) | Fake inclusion / SEO chrome |
| Dual-audience surfaces (`llms.txt`, `agent.json`) | Tokens or secrets on public/directory UI |

---

## Tokens

Defined in `src/index.css` (`@theme` + `:root`). Tailwind names `foundry-*` stay. `teal-glow` / `teal-deep` are **legacy class aliases** for accent — same hex as `accent` / `accent-dim`. Prefer `text-accent` / `bg-accent` in new code.

### Color

| Token | Hex | Use |
|-------|-----|-----|
| `foundry-950` / `--bg` | `#0e0f12` | Canvas |
| `foundry-900` / `--bg-elevated` | `#16181d` | Header, cards, elevated wells |
| `foundry-800` / `--bg-panel` | `#1c2028` | Process panels, hover wells |
| `foundry-700` | `#2a2f38` | Skeleton, strong hairline |
| `foundry-600` | `#4a5160` | Dim labels |
| `foundry-500` | `#6b7380` | Muted body |
| `foundry-400` | `#8b93a0` | Secondary text |
| `foundry-300` | `#b8bdc6` | Tertiary |
| `foundry-200` | `#d6d8de` | Near-ink |
| `foundry-100` / `--text` | `#eceae4` | Primary ink (warm paper) |
| `accent` / `teal-glow` | `#c4a574` | Brass — links, kickers, focus, primary fill |
| `accent-hover` | `#d4b98a` | Primary hover |
| `accent-dim` / `teal-deep` | `#8a7349` | Pressed / chip fill |
| `on-accent` | `#1a160f` | Ink on brass buttons |
| `ok` | `#7d9a6f` | Linked / crawled / success |
| `copper` | `#c4844a` | Caution, agent-side labels, processing |
| `danger` | `#c45c5c` | Fail, revoke, wipe |
| `--border` | `rgba(236, 234, 228, 0.10)` | Default hairline |
| `--text-muted` | `#8b93a0` | Alias of foundry-400 |

No light theme ships. `theme-color` in `index.html` is `#0e0f12`.

**Audience tint (optional, not neon):** operator chrome can use brass; agent/machine labels can use copper. Status online uses `ok`, not accent glow.

### Type

| Role | Stack | Size / weight |
|------|--------|----------------|
| UI / body | IBM Plex Sans, Noto Sans SC, ui-sans-serif | 14px / 400, line 22px |
| Title | same | 20–24px / 600, tracking `-0.02em` |
| Page title (public) | same | 28–32px / 600 — **not** 48–60px heroes |
| Kicker | IBM Plex Mono | 11px / 500, tracking `0.12em`, uppercase |
| Status / IDs / paths | IBM Plex Mono | 10–12px / 400 |
| JSON / curl / MCP | IBM Plex Mono | 11px / 400, line 18px |
| Stat value | IBM Plex Mono | 18–20px / 500 |

Space Grotesk is **retired** (too display/marketing). Mono is mandatory for tokens (`nxo_*`, `nxa_*`), agent IDs, slugs, timestamps, HTTP methods, JSON.

### Spacing (4px base)

| Step | px | Typical |
|------|----|---------|
| `xxs` | 4 | Icon gaps |
| `xs` | 8 | Chip / compact control pad |
| `sm` | 12 | Panel header pad |
| `md` | 16 | Card pad, form gaps |
| `lg` | 24 | Section stack |
| `xl` | 32 | Public page top |
| `2xl` | 40 | Rare |

Public sections: **32–40px** vertical, not 80px. Console main: `px-4 py-4` / `md:px-6 md:py-5`. Header target **44px**.

### Radius

| Name | Value | Use |
|------|-------|-----|
| `xs` / console control | 4px | Inputs, small buttons, chips |
| `sm` / `--radius` | 6px | Cards, panels, primary buttons |
| `md` | 8px | Dialogs |
| Pill | **avoid** | Former marketing nav; workbench uses 4–6px |

### Elevation

One hairline. No drop-shadow bloom, no inset sheen gradient, no `translateY` lift.

```
border: 1px solid var(--border);
background: var(--bg-elevated);
```

Hover: `border-color` + `background` tint only.

### Motion

- Prefer none. Optional 120ms fade on toasts.
- `prefers-reduced-motion: reduce` disables leftover motion.
- No looping aurora, scanlines, orb drift, or brand pulse.

---

## Primitives (`src/index.css`)

| Class | Role |
|-------|------|
| `.nx-kicker` | Mono uppercase label (section / panel) |
| `.nx-card` | Elevated surface — modules, pricing, public articles |
| `.nx-card-hover` | Border/bg tint on hover (no lift) |
| `.nx-panel` | Process surface — memory vault, task queue, activity, MCP JSON |
| `.nx-btn` / `.nx-btn-primary` / `.nx-btn-ghost` | 6px radius, dense pad (`7px 12px`) |
| `.nx-chip` | Mono status / capability tag, 4px radius |
| `.nx-input` | Shared field chrome (mono for IDs / JSON) |
| `.foundry-grid` / `.foundry-glow` | **No-ops** kept so old class names do not paint mesh/aurora |

Focus: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`

---

## Layout

### Public shell

- Sticky header, hairline bottom, solid `foundry-950` (light blur optional, not frosted theater).
- Wordmark: Hexagon in a 28px 6px well, brass icon, **no pulse overlay**. “Silicon Nexus” in ink — accent only on the mark, not the whole title.
- Nav: text links, 6px pad, active = brass text + faint brass well. Not a pill cluster.
- Primary CTA: “Open console”.
- Footer: compact (`py-8`), mono discovery links (`llms.txt`, `agent.json`).

### Landing — open and work

Landing is a **short workbench intro**, not a campaign hero:

1. Kicker + title (~32px) + one paragraph + chips + two buttons.
2. Three capability cards (body / continuity / observation) — process density, numbered in mono.
3. Connect strip: steps as a compact ordered list + machine surfaces as mono chips.

No `HeroBackdrop`, no full-viewport stage, no orbs.

### Console shell

- Same brand + denser nav (Overview, Agents, Events, Surfaces, Account, Admin, API).
- Right cluster: locale, **Linked / Awaiting key** (`ok` or `copper`, mono), worker, Lock.
- Main max-width `1400px`.
- Onboarding is a thin checklist bar, not a poster.

### Process panels

Memory vault, task queue, activity feed, MCP config, continuity, sites/feed editors:

- `nx-panel`, fixed-ish height (`min(600px, 70vh)` where already used).
- Header row: mono kicker + compact controls.
- Body: mono JSON / rows / IDs.
- Empty states: small icon + one title + one hint — no illustration.

### Shared controls

- Primary: brass fill, `on-accent` ink.
- Ghost: hairline, ink text, brass border on hover.
- Destructive: `danger` text, no red glow.
- Tables: hairline divides, mono IDs, 8–10px vertical pad.

---

## Agent prompt (for future UI work)

You are restyling Silicon Nexus. Keep the product frame (portable body, continuity, honest observation). Apply **Foundry Workbench**: graphite + brass + copper caution + muted ok. High density. Mono for machine voice. No glow orbs, mesh gradients, Linear purple, or sparse AI-startup landing. Tokens live in `src/index.css`. Update this file if tokens change. Dual-audience: every status a human sees must stay available as JSON/MCP. Never put secrets on public surfaces.

---

## Implementation checklist

- [ ] Tokens in `src/index.css` match this file (no leftover `#3ec6ff` / `#07111f` paint).
- [ ] Landing has no decorative hero stage.
- [ ] Console / MCP / memory / feed read as process panels.
- [ ] Status, IDs, JSON are IBM Plex Mono.
- [ ] Focus rings visible; reduced-motion respected.
- [ ] Public discovery links remain (`llms.txt`, `feed.json`, `agent.json`).
- [ ] No tokens/secrets on directory or feed chrome.
- [ ] `npm run lint` and `npm run build` pass.
