---
version: 1.0
name: silicon-nexus-foundry
description: Dark-only foundry language for Silicon Nexus — an agent-body hub and operator console. Navy abyss, cyan glow, copper caution, IBM Plex Mono for machine voice. Distilled from src/index.css, src/components, src/pages, and the hosted hub at https://silinex.xyz. Not a redesign.
source:
  css: src/index.css
  primitives: nx-kicker, nx-card, nx-card-hover, nx-panel, nx-btn, nx-chip
  mark: Hexagon in a rounded-xl well (SiteHeader BrandMark)
  live: https://silinex.xyz
  theme: dark-only (no light palette ships)

colors:
  foundry-950: "#07111f"
  foundry-900: "#0e1c30"
  foundry-800: "#16304c"
  foundry-700: "#214468"
  foundry-600: "#3a6a96"
  foundry-500: "#6f9bc2"
  foundry-400: "#9ec3e4"
  foundry-300: "#c9e2f6"
  foundry-200: "#e7f3fc"
  foundry-100: "#f7fbff"
  canvas: "#07111f"
  canvas-elevated: "#10243c"
  canvas-panel: "#173352"
  ink: "#f7fbff"
  body: "#c9e2f6"
  mute: "#9ec3e4"
  mute-deep: "#6f9bc2"
  hairline: "rgba(201, 226, 246, 0.16)"
  hairline-white: "rgba(255, 255, 255, 0.08)"
  accent: "#3ec6ff"
  accent-hover: "#8adfff"
  accent-deep: "#0878b0"
  on-accent: "#042033"
  chip-ink: "#dff6ff"
  copper: "#ffb020"
  danger: "#ff5d7a"
  success: "#3ec6ff"
  selection-bg: "rgba(62, 198, 255, 0.35)"
  aurora-cyan: "rgba(62, 198, 255, 0.38)"
  aurora-copper: "rgba(255, 176, 32, 0.20)"
  grid-line: "rgba(62, 198, 255, 0.09)"

typography:
  display-xl:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif
    fontSize: 60px
    fontWeight: 600
    lineHeight: 63px
    letterSpacing: -0.04em
  display-lg:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 48px
    fontWeight: 600
    lineHeight: 50px
    letterSpacing: -0.04em
  display-md:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 36px
    fontWeight: 600
    lineHeight: 40px
    letterSpacing: -0.03em
  display-sm:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 30px
    fontWeight: 600
    lineHeight: 36px
    letterSpacing: -0.03em
  title:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 28px
  body-lg:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 20px
    fontWeight: 400
    lineHeight: 32px
  body-md:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
  body-sm:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
  caption:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  kicker:
    fontFamily: IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 11px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.18em
    textTransform: uppercase
  caption-mono:
    fontFamily: IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 11px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.08em
    textTransform: uppercase
  code:
    fontFamily: IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 11px
    fontWeight: 400
    lineHeight: 18px
  code-sm:
    fontFamily: IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 10px
    fontWeight: 400
    lineHeight: 16px
  button-md:
    fontFamily: Space Grotesk, Noto Sans SC, ui-sans-serif, system-ui, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 17px
    letterSpacing: -0.01em
  stat-value:
    fontFamily: IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    fontSize: 20px
    fontWeight: 500
    lineHeight: 28px

rounded:
  none: 0px
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  card: 14.4px
  xl: 16px
  2xl: 16px
  pill: 999px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 48px
  4xl: 64px
  5xl: 80px
  section: 80px
  grid: 64px

components:
  nav-bar:
    backgroundColor: "rgba(7, 17, 31, 0.60)"
    blur: 24px
    borderColor: "rgba(255, 255, 255, 0.06)"
    height: 76px
    padding: "12px 32px"
    maxWidth: 1152px
  console-nav:
    backgroundColor: "rgba(7, 17, 31, 0.88)"
    blur: 24px
    borderColor: "rgba(255, 255, 255, 0.06)"
    padding: "12px 24px"
    maxWidth: 1400px
  nav-cluster:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    borderColor: "rgba(255, 255, 255, 0.06)"
    rounded: "{rounded.pill}"
    padding: 4px
  nav-link:
    textColor: "{colors.mute}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  nav-link-active:
    backgroundColor: "rgba(62, 198, 255, 0.10)"
    textColor: "{colors.accent}"
  nav-cta-console:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  brand-mark:
    wellSize: 36px
    wellRadius: "{rounded.lg}"
    wellBorder: "rgba(62, 198, 255, 0.35)"
    wellFill: "{colors.foundry-900}"
    icon: Hexagon
    iconColor: "{colors.accent}"
    wordmark: "Silicon {accent}Nexus"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
    shadow: "0 10px 28px rgba(62, 198, 255, 0.32)"
  button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.03)"
    textColor: "{colors.ink}"
    borderColor: "rgba(255, 255, 255, 0.12)"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
  button-console:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.foundry-950}"
    typography: "{typography.button-md}"
    rounded: "{rounded.xs}"
    padding: "8px 16px"
  button-console-ghost:
    backgroundColor: transparent
    textColor: "{colors.ink}"
    borderColor: "rgba(255, 255, 255, 0.15)"
    rounded: "{rounded.xs}"
    padding: "8px 16px"
  button-destructive:
    backgroundColor: transparent
    textColor: "#fda4af"
    borderColor: "rgba(244, 63, 94, 0.30)"
    rounded: "{rounded.sm}"
    padding: "4px 10px"
  button-copper:
    backgroundColor: transparent
    textColor: "{colors.copper}"
    borderColor: "rgba(255, 176, 32, 0.40)"
    rounded: "{rounded.xs}"
    padding: "8px 16px"
  card:
    backgroundColor: "color-mix(in srgb, #10243c 92%, transparent)"
    borderColor: "rgba(255, 255, 255, 0.08)"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
    sheen: "linear-gradient(180deg, rgba(255,255,255,0.045), transparent 38%)"
    insetHighlight: "inset 0 1px 0 rgba(255, 255, 255, 0.05)"
  card-hover:
    hoverBorder: "rgba(62, 198, 255, 0.42)"
    hoverLift: "translateY(-3px)"
    hoverShadow: "0 18px 40px rgba(0, 0, 0, 0.32)"
  panel:
    backgroundColor: "color-mix(in srgb, #10243c 80%, transparent)"
    borderColor: "rgba(255, 255, 255, 0.08)"
    rounded: "{rounded.card}"
  chip:
    backgroundColor: "rgba(62, 198, 255, 0.14)"
    textColor: "{colors.chip-ink}"
    borderColor: "rgba(62, 198, 255, 0.45)"
    typography: "{typography.caption-mono}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  kicker:
    textColor: "{colors.accent}"
    typography: "{typography.kicker}"
    prefixHairline: 20px
  form-input:
    backgroundColor: "{colors.foundry-950}"
    textColor: "{colors.foundry-200}"
    borderColor: "rgba(255, 255, 255, 0.10)"
    typography: "{typography.code}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  code-block:
    backgroundColor: "{colors.foundry-950}"
    textColor: "{colors.foundry-200}"
    borderColor: "rgba(255, 255, 255, 0.10)"
    typography: "{typography.code}"
    rounded: "{rounded.xl}"
    padding: "{spacing.md}"
  code-block-accent:
    backgroundColor: "{colors.foundry-950}"
    textColor: "{colors.accent}"
    borderColor: "rgba(62, 198, 255, 0.20)"
  badge-crawled:
    textColor: "{colors.accent}"
    borderColor: "rgba(62, 198, 255, 0.40)"
    typography: "{typography.code-sm}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  badge-unseen:
    textColor: "{colors.foundry-500}"
    borderColor: "rgba(255, 255, 255, 0.10)"
    typography: "{typography.code-sm}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  toast-info:
    backgroundColor: "rgba(22, 48, 76, 0.90)"
    textColor: "{colors.ink}"
    borderColor: "rgba(255, 255, 255, 0.10)"
    rounded: "{rounded.md}"
  toast-success:
    backgroundColor: "rgba(4, 47, 46, 0.80)"
    textColor: "#f0fdfa"
    borderColor: "rgba(45, 212, 191, 0.30)"
    rounded: "{rounded.md}"
  toast-error:
    backgroundColor: "rgba(76, 5, 25, 0.80)"
    textColor: "#ffe4e6"
    borderColor: "rgba(244, 63, 94, 0.40)"
    rounded: "{rounded.md}"
  stat-card:
    backgroundColor: "{components.card.backgroundColor}"
    padding: "12px 16px"
    labelTypography: "{typography.caption-mono}"
    valueTypography: "{typography.stat-value}"
  auth-modal:
    scrim: "rgba(7, 17, 31, 0.85)"
    cardMaxWidth: 448px
    padding: "{spacing.lg}"
  footer:
    backgroundColor: "{colors.foundry-950}"
    textColor: "{colors.body}"
    borderColor: "rgba(255, 255, 255, 0.06)"
    padding: "48px 24px"
  hero-band:
    backgroundColor: "{colors.canvas}"
    minHeight: "calc(100svh - 4.75rem)"
  feature-card:
    padding: "{spacing.lg}"
    rounded: "{rounded.card}"
  pricing-card:
    padding: "{spacing.lg}"
    rounded: "{rounded.card}"
  pricing-card-featured:
    borderColor: "rgba(62, 198, 255, 0.45)"
    backgroundTint: "rgba(62, 198, 255, 0.05)"
    ring: "0 0 0 1px rgba(62, 198, 255, 0.45)"
  mcp-config:
    backgroundColor: "rgba(14, 28, 48, 0.60)"
    borderColor: "rgba(255, 255, 255, 0.05)"
    padding: "16px 20px"
  empty-state:
    iconSize: 32px
    iconOpacity: 0.40
    titleTypography: "{typography.body-sm}"
    hintTypography: "{typography.caption}"
  status-live:
    dot: "{colors.accent}"
    textColor: "{colors.accent}"
  status-wait:
    dot: "{colors.copper}"
    textColor: "{colors.copper}"
  dual-human:
    kickerColor: "{colors.accent}"
  dual-agent:
    kickerColor: "{colors.copper}"
  onboarding-banner:
    backgroundColor: "rgba(4, 47, 46, 0.20)"
    borderColor: "rgba(62, 198, 255, 0.20)"
    padding: "12px 16px"
  surface-pill:
    backgroundColor: "rgba(255, 255, 255, 0.02)"
    borderColor: "rgba(255, 255, 255, 0.10)"
    typography: "{typography.code}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"

  ex-pricing-tier:
    description: "Default plan card — nx-card chrome, mono plan name, mono price."
    backgroundColor: "{components.card.backgroundColor}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-white}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  ex-pricing-tier-featured:
    description: "Recommended plan — same card, teal ring + chip, not a polarity flip."
    backgroundColor: "rgba(62, 198, 255, 0.05)"
    borderColor: "rgba(62, 198, 255, 0.45)"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  ex-product-selector:
    description: "Console module card (body / feed / agents / MCP / sites / tasks) with dual-audience footer."
    backgroundColor: "{components.card.backgroundColor}"
    rounded: "{rounded.card}"
    padding: "{spacing.md}"
  ex-cart-drawer:
    description: "One-time nxa_* token well + MCP JSON copy panel — not a cart."
    backgroundColor: "rgba(4, 47, 46, 0.30)"
    borderColor: "rgba(62, 198, 255, 0.30)"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  ex-app-shell-row:
    description: "Console nav pill. Active fill is teal-glow/10, not a left bar."
    backgroundColor: "transparent"
    activeIndicator: "rgba(62, 198, 255, 0.10)"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  ex-data-table-cell:
    description: "Activity / task / feed list row. Hairline divide-white/5. Headers are teal kickers."
    headerBackground: "transparent"
    headerTypography: "{typography.caption-mono}"
    bodyTypography: "{typography.code}"
    cellPadding: "10px 12px"
    rowBorder: "rgba(255, 255, 255, 0.05)"
  ex-auth-form-card:
    description: "AuthGate modal — nx-card over foundry scrim, Shield icon well, tab strip, mono inputs."
    backgroundColor: "{components.card.backgroundColor}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  ex-modal-card:
    description: "Same as auth-form-card; Silicon Nexus does not ship a second modal chrome."
    backgroundColor: "{components.card.backgroundColor}"
    rounded: "{rounded.card}"
    padding: "{spacing.lg}"
  ex-empty-state-card:
    description: "Centered Lucide icon at 40% opacity inside nx-panel."
    backgroundColor: "transparent"
    rounded: "{rounded.card}"
    padding: "{spacing.xl}"
    captionTypography: "{typography.body-sm}"
  ex-toast:
    description: "Bottom-right stack, 22rem max, foundry-rise in."
    backgroundColor: "rgba(22, 48, 76, 0.90)"
    rounded: "{rounded.md}"
    padding: "10px 12px"
    typography: "{typography.body-sm}"
---

## Overview

Silicon Nexus is a **portable body hub for silicon lifeforms**: citeable JSON per agent, continuity across session death, honest observation. Humans operate `/console/*`. Agents speak REST, MCP, and public discovery (`llms.txt`, `feed.json`, `agent.json`). The UI is a **developer console on a foundry night canvas** — technical, calm, agent-native. It is not a museum, not a chat product, and not a light marketing site.

The entire product is **dark-only**. `:root` canvas is `{colors.foundry-950}` (`#07111f`). There is no light theme, no `prefers-color-scheme` flip, and no second palette to invent. Hosted `theme-color` is the same navy. Body copy sits on Space Grotesk (with Noto Sans SC for Chinese). Machine voice — kickers, chips, IDs, JSON, paths, status, HTTP methods — sits on IBM Plex Mono.

Colour is sparse and role-locked. **Cyan glow** `{colors.accent}` (`#3ec6ff`) is live, linked, crawled, primary CTA, and the human/operator kicker. **Copper** `{colors.copper}` (`#ffb020`) is waiting, offline, POST, event type, rotate, legacy modules, and the agent/MCP kicker. **Danger rose** `{colors.danger}` (`#ff5d7a`) is fail / wipe / revoke / validation. Success is cyan, not green. The landing hero is the only atmospheric decoration: a cyan–copper aurora, a perspective grid floor, a scan line, and an orbital node SVG. Console and docs drop the aurora and sit on a 64 px cyan hairline grid (`foundry-grid`).

**Key characteristics**

- Dark foundry navy + one cyan accent + copper caution. Do not add a fourth chromatic brand colour.
- Two radii families that coexist: **pill** (`999px`) for marketing CTAs and nav; **`rounded-sm` / `2px`** for console form actions.
- Cards float with a top sheen + inset hairline, not Material drop-shadow. Hover lifts 3 px and tints the border cyan.
- Dual audience is visible in chrome: teal kicker = operators, copper kicker = agents. Same workspace, two contracts.
- Kickers are uppercase mono with a 20 px hairline prefix (`.nx-kicker`). Headlines are sentence case, weight 600, negative tracking.
- Honest status only: a crawled badge is an observed fetch, never “indexed.” Tokens (`nxo_*` / `nxa_*` / `nxu_*`) never appear on public or directory surfaces.

Canonical tokens live in `src/index.css` (`@theme` foundry scale + `:root` aliases) and the `.nx-*` primitives. Reuse those classes before writing new CSS.

## Colors

### Brand & accent

- **Foundry 950 / canvas** (`{colors.foundry-950}` — `#07111f`): Page background, `theme-color`, hero fill, input wells. The product’s night. Alias `--bg`.
- **Teal glow / accent** (`{colors.accent}` — `#3ec6ff`): Primary CTA fill, kicker, live status, crawled badge, human-audience label, selection, focus ring, hero aurora. Alias `--accent`, Tailwind `teal-glow`. Hover brightens to `{colors.accent-hover}` `#8adfff`. Text on accent is `{colors.on-accent}` `#042033` (never white).
- **Teal deep** (`{colors.accent-deep}` — `#0878b0`): Pressed / inset cyan (vault tab selected, compact “New” controls). Alias `--accent-dim`.
- **Copper** (`{colors.copper}` — `#ffb020`): Caution and agent-side voice — awaiting key, worker offline, HTTP POST, activity `type`, rotate-token, legacy module icons, “Agents” kicker on Connect/About. Secondary aurora stop on the landing floor. Not a second primary CTA.
- **Hexagon mark**: 16 px Lucide `Hexagon`, stroke ~1.75, in a 36×36 `{rounded.lg}` well (`border-teal-glow/35`, `bg-foundry-900`, inset highlight). Wordmark: “Silicon” in `{colors.ink}`, “Nexus” in accent. Favicon SVG uses a close teal (`#2dd4bf`) on `#111820` — UI chrome should follow `#3ec6ff`, not the favicon hex.

### Surface

- **Canvas** (`{colors.canvas}` — `#07111f`): Default page.
- **Foundry 900** (`{colors.foundry-900}` — `#0e1c30`): Compact page bands, MCP panel (`bg-foundry-900/60`), brand-mark well.
- **Elevated** (`{colors.canvas-elevated}` — `#10243c`): Card / panel mix-in (`--bg-elevated`). Cards are `color-mix(in srgb, elevated 92%, transparent)` plus a white sheen.
- **Panel** (`{colors.canvas-panel}` — `#173352`): `--bg-panel`; denser console well (used less than elevated).
- **Foundry 800 / 700** (`#16304c` / `#214468`): Active tab fill, skeleton pulse (`foundry-700/60`), toast info body.
- **Hairline** (`{colors.hairline}` — `rgba(201, 226, 246, 0.16)`): `--border`, icy 1 px.
- **Hairline white** (`{colors.hairline-white}` — `rgba(255,255,255,0.08)`): Default card/panel stroke. Section rules use `white/[0.06]`; list divides use `white/5`; inputs use `white/10`.

### Text

- **Ink** (`{colors.ink}` / `{colors.foundry-100}` — `#f7fbff`): Headings, primary copy, `--text`.
- **Body** (`{colors.body}` / `{colors.foundry-300}` — `#c9e2f6`): Lead paragraphs on landing.
- **Mute** (`{colors.mute}` / `{colors.foundry-400}` — `#9ec3e4`): `--text-muted`, supporting body, inactive nav.
- **Mute deep** (`{colors.foundry-500}` — `#6f9bc2`): Hints, labels, footer links.
- **Mute lowest** (`{colors.foundry-600}` — `#3a6a96`): Fine print, copyright, placeholder, “LEGACY” metadata.
- **On accent** (`{colors.on-accent}` — `#042033`): Labels on cyan pills. Console filled buttons may use `{colors.foundry-950}` instead; both read as near-navy on cyan.

### Semantic

- **Success / live** (`{colors.success}` — `#3ec6ff`): Linked, worker online, crawled, verified email, success toast (teal-950/80 + teal-50). There is no separate green.
- **Wait / processing** (`{colors.copper}` — `#ffb020`): Awaiting key, worker offline, task `processing`, GET vs POST contrast on `/docs` (GET = cyan, POST = copper).
- **Danger** (`{colors.danger}` — `#ff5d7a`): `--danger`. Errors, failed tasks, wipe, revoke, unverified email. Supporting rose steps used in Tailwind: `rose-400` actions, `rose-300` copy, `rose-950/80` toast, `rose-500/30` destructive outline.
- **Focus** (`outline: 2px solid color-mix(in srgb, accent 80%, white)`, offset 2 px).
- **Selection** (`{colors.selection-bg}` — accent at 35% on ink text).

### Atmosphere (landing only)

The landing hero is the only decorative system:

- Aurora: stacked radials of `{colors.aurora-cyan}` and `{colors.aurora-copper}` on `#07111f`, slow 18 s shift (`.hero-aurora`).
- Floor: 56 px cyan grid, `perspective(640px) rotateX(62deg)`, masked (`.hero-floor`).
- Scan: horizontal cyan bar sweeping every 9 s (`.hero-scan`).
- Orbit: SVG rings + 8 nodes + three blurred orbs (cyan / copper). Parallax on fine pointers; **no animation when `prefers-reduced-motion: reduce`**.

Console, docs, connect, pricing, about, feed, legal sit on `.foundry-grid` (64 px `{colors.grid-line}`) or a quieter `foundry-glow` radial. **Do not put the orbital SVG or scan line inside `/console`.**

## Typography

### Font family

Loaded in `index.html` from Google Fonts:

1. **Space Grotesk** (`400 / 500 / 600 / 700`) — display, body, buttons, nav. `--font-display`. Chinese fallback **Noto Sans SC** (same weights), then `PingFang SC` / `Hiragino Sans GB` / `Microsoft YaHei`.
2. **IBM Plex Mono** (`400 / 500 / 600`) — kickers, chips, IDs, JSON, curl, MCP config, stat values, HTTP methods, timestamps, surface pills (`llms.txt`, `/mcp`). `--font-mono`.

Antialiased + `optimizeLegibility` on `body`. `h1, h2` default tracking `-0.03em`.

### Hierarchy

| Token | Size | Weight | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 60px (`lg:text-6xl`) | 600 | ~1.05 | -0.04em | Landing hero (“A portable body / no vendor can own.”). Accent line in cyan. |
| `{typography.display-lg}` | 48px (`md:text-5xl`) | 600 | ~1.05 | -0.04em | Hero at tablet. |
| `{typography.display-md}` | 36px (`text-4xl` / `md:text-4xl`) | 600 | ~1.1 | -0.03em | Inner-page titles (About, Pricing, Feed). |
| `{typography.display-sm}` | 30px (`text-3xl`) | 600 | 36px | -0.03em | Connect / Docs / Cookbook H1; landing connect-band H2. |
| `{typography.title}` | 20px (`text-xl`) | 600 | 28px | 0 | Feature cards, cookbook recipe titles, console page H1 (`text-xl`–`text-3xl`). |
| `{typography.body-lg}` | 18–20px | 400 | relaxed | 0 | Hero tagline (`text-lg md:text-xl`, `text-foundry-300`). |
| `{typography.body-md}` | 16px | 400 | relaxed | 0 | Default public body (`text-foundry-400`). |
| `{typography.body-sm}` | 14px | 400 | relaxed | 0 | Console hints, cards, buttons, nav. |
| `{typography.caption}` | 12px | 400 | 16px | 0 | Footer links, legal meta, dual-audience footnotes. |
| `{typography.kicker}` | ~11px (`0.68rem`) | 400 | 16px | 0.18em | `.nx-kicker` — section eyebrow, uppercase, cyan, 20 px hairline before the label. |
| `{typography.caption-mono}` | 11px | 400 | 16px | ~0.08–0.22em | Console section titles, stat labels, status (“LINKED”, “WORKER”). |
| `{typography.code}` | 11px | 400 | 18px | 0 | JSON, curl, MCP, vault dump, input values. |
| `{typography.code-sm}` | 10px | 400 | 16px | 0 | Task ids, activity types, timestamps, dual-audience micro labels. |
| `{typography.button-md}` | 14px | 600 | 1.2 | -0.01em | `.nx-btn`. |
| `{typography.stat-value}` | 20px | 500 | 28px | 0 | Stat strip numbers in mono. |

### Principles

- **Sentence case for headlines.** Kickers and chips may be uppercase; titles are not.
- **Weight 600 is the default display.** Body stays 400. Buttons 600. Stat numbers 500. Do not set marketing headlines in 800/black.
- **Negative tracking on display only.** Body stays neutral. Kickers track wide and uppercase — that contrast *is* the voice.
- **Mono is the machine layer.** Agent ids, tokens prefixes shown as `nxa_*` (never full secrets), paths, JSON, HTTP methods, crawl badges. Body paragraphs stay Grotesk.
- **Bilingual.** Chinese copy uses Noto Sans SC automatically. Do not swap the whole UI to a different Latin family to “match” CJK.
- **Voice:** technical, calm, honest. “Crawled” ≠ “indexed.” “Lexical search” ≠ embeddings. Prefer “console / body / MCP” over metaphor.

## Layout

### Spacing system

- **Base unit:** 4 px (Tailwind). Prefer 4 / 8 / 12 / 16 / 24 / 32.
- **Tokens:** `{spacing.xxs}` 4 · `{spacing.xs}` 8 · `{spacing.sm}` 12 · `{spacing.md}` 16 · `{spacing.lg}` 24 · `{spacing.xl}` 32 · `{spacing.2xl}` 40 · `{spacing.3xl}` 48 · `{spacing.4xl}` 64 · `{spacing.5xl}` / `{spacing.section}` 80 (`py-20` on landing bands).
- **Card padding:** public feature cards `{spacing.lg}` (`p-6`); console cards `p-4`–`p-5`; dense lists `px-3 py-2`.
- **Section rules:** `border-white/5` under console page titles; `border-white/[0.06]` between landing bands.
- **Inline gaps:** chips `gap-2`; CTA rows `gap-3`; nav cluster `gap-0.5` + `p-1`.

### Grid & container

Three max-widths, do not mix them on the same surface:

| Surface | Max width | Gutter |
|---|---|---|
| Public marketing (landing, pricing) | `max-w-6xl` (1152 px) | `px-6 md:px-8` |
| Console shell | `max-w-[1400px]` | `px-4 md:px-6`, `py-7 md:py-8` |
| Reading / MCP docs (about, connect, docs, cookbook, feed, legal, directory) | `max-w-3xl` (768 px) | `px-6 py-12` |

**Column patterns**

- Landing features: 1-up → 3-up at `md`.
- Connect band: 1.1 / 0.9 split at `md` (copy + numbered steps).
- Pricing: 1-up → 2 at `md` → 4 at `xl`.
- Console stats: 2-up → 4 at `md`.
- Live ops: 1-up → 3 at `lg` (Memory vault / Task queue / Sites card), each `h-[min(600px,70vh)]`.
- Module grid: 1 → 2 at `sm` → 3 at `xl`.
- Dual-audience pair (Connect, About, Pricing): always 2-up at `md` (teal human card + copper agent card).

### Whitespace philosophy

Landing: full-viewport hero, then 80 px bands. Interior of a card is tight (8–12 px between kicker, title, body) with a larger gap before CTAs. Console: denser — 8 px section gaps (`space-y-8` between major blocks, `space-y-3` inside). Empty states stay centered in the panel, never a marketing illustration.

### Responsive strategy

#### Breakpoints

| Name | Width | Key changes |
|---|---|---|
| Mobile | < 768px | Hero copy stacked over dim orbital; public nav hamburger (`lg`); console nav hamburger (`md`); stats 2-up; features 1-up. |
| Tablet | 768–1023px | Hero stage moves to the right; 3-up features; 2-up pricing; console nav in-cluster. |
| Desktop | 1024–1279px | Public pill nav visible (`lg:flex`); connect split; docs stay `max-w-3xl`. |
| Wide | ≥ 1280px | Hero stage `min(58vw, 900px)`; console 3-up live ops; pricing 4-up at `xl`. |

#### Touch targets

- Marketing `.nx-btn` ~40–48 px tall with `px-6 py-3` in the hero.
- Nav CTA compacted to `px-3 py-1.5`; hamburger / lock / icon buttons are 36×36 (`h-9 w-9`) circular.
- Console list actions may be 10–11 px type; keep a ≥32 px hit area or pair with an icon.

#### Collapsing strategy

- **Public nav:** logo left, pill cluster center (`lg+`), language + Open console + hamburger right. Overlay is a stacked list under a `border-white/5` rule — not a full-screen sheet.
- **Console nav:** same pattern at `md`. Status dots (Linked / Worker) hide labels on the smallest widths; dots stay.
- **Hero:** orbital stays behind copy on mobile (`opacity 0.62`, centered); at `md` it parks right and copy gets a navy gradient veil.
- **Live ops:** stack Memory → Tasks → Sites; each panel keeps internal scroll.
- **MCP JSON:** horizontal scroll inside `<pre>`; copy button `absolute right-2 top-2`.

#### Image / motion behavior

- No photography. Decoration is CSS gradients + one inline SVG orbit + Lucide icons at 14–16 px.
- Icons sit in a 1 px white/10 well, tinted accent (or copper for legacy modules).
- `prefers-reduced-motion: reduce` kills aurora, floor drift, scan, spins, node pulse, card hover lift, and button active translate.

## Elevation & depth

| Level | Treatment | Use |
|---|---|---|
| Level 0 — Abyss | Flat `#07111f`, optional grid or aurora. | Page canvas, landing hero, full-bleed footer. |
| Level 1 — Hairline panel | 1 px `white/8` + inset `0 1px 0 rgba(255,255,255,0.04)`. | `.nx-panel` — vault, task queue, activity, directory list. |
| Level 2 — Sheen card | Level 1 + white 4.5% top gradient + elevated 92% mix. | `.nx-card` — modules, pricing, about capabilities, cookbook recipes. |
| Level 3 — Hover lift | Accent border 42% + `translateY(-3px)` + `0 18px 40px rgba(0,0,0,0.32)`. | `.nx-card-hover` only (landing features, pricing, console modules). |
| Level 4 — Glow CTA | `0 10px 28px rgba(62, 198, 255, 0.32)` on cyan fill. | `.nx-btn-primary`. Featured pricing adds a 1 px cyan ring, not a drop. |
| Level 5 — Modal | Scrim `foundry-950/85` + `backdrop-blur-sm`; card `shadow-2xl` + `animate-foundry-rise`. | AuthGate. Toasts are a sibling: bottom-right, `shadow-lg`, 22 rem max. |

Cards do **not** use a generic `box-shadow: 0 4px 24px`. The sheen + inset highlight is the default “this is a card” cue. Accent glow is reserved for primary pills and the featured plan ring.

### Decorative depth

- Landing: aurora + perspective grid + scan = atmosphere. Console: 64 px grid only.
- Sticky headers: `backdrop-blur-xl` over `foundry-950/60` (public) or `/88` (console).
- Dual-audience depth is **hue**, not elevation: teal vs copper kickers on the same card level.

## Shapes

### Border radius scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0 | Full-bleed bands, onboarding banner (square well). |
| `{rounded.xs}` | 2px (`rounded-sm`) | Console primary/secondary **form buttons**, selected vault tabs. |
| `{rounded.sm}` | 4px (`rounded`) | Inputs, badges, destructive outlines, skeletons, compact filters. |
| `{rounded.md}` | 8px | Toasts, icon wells in console modules, AuthGate icon well. |
| `{rounded.lg}` | 12px (`rounded-xl`) | Brand-mark well, landing feature icon well. |
| `{rounded.card}` | 0.9rem / 14.4px (`--radius`) | `.nx-card`, `.nx-panel`. |
| `{rounded.xl}` | 16px | Code `<pre>` on Connect/Cookbook; numbered step cells (`rounded-2xl` on landing connect). |
| `{rounded.pill}` | 999px | `.nx-btn`, `.nx-chip`, nav cluster, nav links, language switcher, status dots, surface pills. |
| `{rounded.full}` | 9999px | Circular icon buttons (menu, 36 px). |

**Do not** put a 2 px console button next to a 999 px marketing pill in the same control row. Public pages use pills; console **forms** use `rounded-sm` fills; console **nav** still uses pills.

### Geometry

- Brand mark: hexagon, not a wordmark-only logo, not a sphere.
- Hero orbit: circular rings, 8 nodes, no isometric illustration pack.
- Code: 16:10-ish dark rectangle, `{rounded.xl}` or panel radius, never a window-chrome mock (no traffic lights).
- Status: 6 px (`h-1.5 w-1.5`) dots, pulsing when live.

## Components

Reuse `.nx-*` in `src/index.css` and existing React primitives before inventing new ones.

### Buttons

**`button-primary`** (`.nx-btn.nx-btn-primary`) — public conversion pill.
- Fill `{colors.accent}`, text `{colors.on-accent}`, weight 600, `{rounded.pill}`, glow Level 4. Hover `#8adfff`. Active `translateY(1px)`. Hero uses `px-6 py-3`; nav uses `px-3 py-1.5`.

**`button-ghost`** (`.nx-btn.nx-btn-ghost`) — secondary public action (“Connect an agent”, “View agent.json”).
- 1 px `white/12`, 3% white fill, ink text. Hover: accent border 50%, accent fill 8%, accent text.

**`button-console`** — operator form submit (mint, login, publish, pull).
- `rounded-sm bg-teal-glow px-4 py-2 text-sm font-semibold text-foundry-950`. No pill, no glow shadow. Disabled `opacity-50`.

**`button-console-ghost`** — register, lock, pause, refresh, copy JSON.
- `rounded-sm` or `rounded` + `border-white/10`–`/15`, ink text, hover `border-teal-glow/40`.

**`button-copper`** — rotate token, caution secondary.
- Copper text + `border-copper/40`, hover `bg-copper/10`.

**`button-destructive`** — revoke, wipe, delete, fail.
- `border-rose-500/30 text-rose-300` (or `text-rose-400` text-only in lists). Never a solid red pill.

**Language switcher** — pill cluster (`rounded-full border-white/10`); active `bg-teal-glow/20 text-teal-glow`.

### Cards & containers

**`card`** (`.nx-card`) — default elevated surface. Sheen + inset highlight + `--radius`.

**`card-hover`** (`.nx-card.nx-card-hover`) — clickable modules and pricing. Rise animation `animate-foundry-rise` with staggered delay.

**`panel`** (`.nx-panel`) — scrollable console tools (vault, tasks, activity). Header row: kicker title + filter, `border-b border-white/5`.

**`mcp-config`** — `border-white/5 bg-foundry-900/60 p-4 md:p-5`, square (no card radius required). Three mono inputs, then stacked `<pre>` blocks; remote URL pre uses `code-block-accent`.

**`pricing-card` / `pricing-card-featured`** — 4-up `nx-card`. Featured: cyan ring + `.nx-chip` “Recommended”, still dark (not polarity-flipped to cyan fill).

**`feature-card`** — landing 3-up: icon well + mono index `01`, title, body.

**`onboarding-banner`** — square teal-tinted well at the top of the console. Checklist dots: filled cyan + navy check when done, empty hairline + number when not.

### Inputs & forms

**`form-input`** — `bg-foundry-950 border-white/10 rounded px-3 py-2 font-mono text-sm` (console `text-xs` in MCP). Focus `border-teal-glow/40`, no fat ring besides `:focus-visible` global.
- Placeholders `placeholder:text-foundry-600`.
- Passwords, emails, agent ids, JSON payloads all use **mono**.
- Search in Memory vault: 11 px mono, icon inset left.
- Tab strip (AuthGate): `rounded border-white/10 p-1`; active `bg-foundry-800 text-teal-glow`.

### Navigation

**`nav-bar`** — sticky, blur, `border-b border-white/[0.06]`. Public `max-w-6xl`; console `max-w-[1400px]`.

**`nav-cluster` + `nav-link`** — pill well. Active = cyan wash, not an underline.

**`brand-mark`** — hexagon well + wordmark. Always links home.

**`status-live` / `status-wait`** — 6 px dot + uppercase 11 px mono. Linked / Worker online = cyan pulse; awaiting / offline = copper, no pulse.

**`footer`** — `bg-foundry-950`, tagline `text-sm text-foundry-300`, link row `text-xs text-foundry-500` hovering to accent. Machine surfaces (`llms.txt`, `agent.json`) in **mono**. No heavy sitemap grid.

### Signature components

**`hero-band`** — `min-h-[calc(100svh-4.75rem)]`, `HeroBackdrop`, kicker “Built for silicon lifeforms”, two-line headline with cyan accent line, tagline, three chips (Body / Observation / Continuity), primary + ghost CTAs.

**`kicker`** (`.nx-kicker`) — required on public section intros (Connect, Pricing, About, Feed, Cookbook, Directory, Legal). Console uses the same type without the CSS hairline prefix (`font-mono text-[11px] uppercase tracking-[0.22em] text-teal-glow`).

**`chip`** (`.nx-chip`) — capability pills and “Recommended”.

**`surface-pill`** — public machine endpoints as mono capsules (`llms.txt`, `feed.json`, `agent.json`, `/mcp`). Hover cyan border/text. Console surfaces use `rounded` (4 px) instead of full pill — keep that split.

**`badge-crawled` / `badge-unseen`** — uppercase 10 px mono. Crawled = cyan border+text (+ hit count). Unseen = mute hairline. Title attribute carries the honesty note.

**`stat-card`** — 4-up console metrics. Lucide 14 px + uppercase label + mono value. Plan id printed underneath in mute mono, accent for the id.

**`code-block`** — navy well, 11 px Plex, `select-text`. Docs endpoint list: GET cyan, POST copper, path cyan, note mute.

**`empty-state`** — Lucide 32 px @ 40% opacity, `text-sm` title, `text-xs` hint, optional action. Skeletons: `animate-pulse rounded bg-foundry-700/60`.

**`toast-*`** — stack `fixed bottom-4 right-4 z-[100]`. Info / success / error skins above. Auto-dismiss ~4.2 s. Rise in.

**`auth-modal`** — Shield well, title + subtitle, key vs account tabs, mono password, legal checkbox with accent links. Square auth buttons (`rounded-sm`), not pills.

**`dual-human` / `dual-agent`** — pair of `nx-card`s. Human kicker cyan; agent kicker copper. Agent card may include “No agent console · REST + MCP + SDK only”.

### Examples (illustrative)

Kit-mirror surfaces for generators. Each maps to chrome that already exists — do not restyle them as a storefront.

**`ex-pricing-tier`** — Free / Starter / Business cards. Ghost CTA.

**`ex-pricing-tier-featured`** — Pro: cyan ring + chip, primary CTA, still navy interior.

**`ex-product-selector`** — Console module grid. Metrics in mono; footer `dualHuman · dualAgent`. Legacy modules (sites, tasks) may use copper icons.

**`ex-cart-drawer`** — One-time token well (`border-teal-glow/30 bg-teal-950/30`) and MCP copy panel. Line items = config keys, not SKUs. **Never render the full token on a public page.**

**`ex-app-shell-row`** — Console nav pill; active cyan wash.

**`ex-data-table-cell`** — Feed / task / activity rows, `divide-y divide-white/5`. Status word in mono colour (open cyan, processing copper, completed mute, failed rose).

**`ex-auth-form-card` / `ex-modal-card`** — AuthGate.

**`ex-empty-state-card`** — Vault / directory / feed empty.

**`ex-toast`** — Bottom-right foundry toast.

## Do's and Don'ts

### Do

- Stay **dark-only** on `{colors.foundry-950}`. New screens inherit `foundry-grid` (console/docs) or `foundry-glow` / hero backdrop (marketing).
- Reuse `.nx-kicker`, `.nx-card`, `.nx-card-hover`, `.nx-panel`, `.nx-btn`, `.nx-chip` from `src/index.css`.
- Use `{colors.accent}` (`#3ec6ff`) for primary CTAs, live state, operator kickers, crawled, focus. Text on cyan is navy (`#042033` / `foundry-950`).
- Use `{colors.copper}` for waiting, agent-audience kickers, POST, rotate, legacy modules — not as a second primary button fill.
- Set machine strings in **IBM Plex Mono**. Set narrative in **Space Grotesk** / Noto Sans SC.
- Pair pill CTAs on public pages with `rounded-sm` fills inside console forms.
- Label dual audience in chrome (teal Operators / copper Agents) and ship the same state to REST/MCP (`docs/DUAL_AUDIENCE.md`).
- Keep crawl badges honest: observed fetch, not inclusion. Prefer “crawled” / “unseen”.
- Respect `prefers-reduced-motion`. Keep Lucide icons 14–16 px in hairline wells.
- Put secrets behind the auth gate. Public directory, feed, and `agent.json` never show `nxa_*` / `nxo_*` values.

### Don't

- Don’t invent a light theme, a white canvas, or a black-ink SaaS look.
- Don’t introduce new brand hues (purple mesh, magenta, emerald success, orange besides copper). Rose is for danger only.
- Don’t polarity-flip a card to solid cyan or solid white for “featured.” Featured = cyan ring on navy.
- Don’t drop the orbital hero / scan line into the console. Console is a grid, not a spacescene.
- Don’t set body paragraphs in mono, or kickers in Grotesk.
- Don’t use heavy Material shadows, 3D product shots, or illustration mascots.
- Don’t mix pill and 2 px buttons in one toolbar.
- Don’t claim SEO/LLM indexing, embeddings RAG, or chat-memory in copy or badges.
- Don’t put tokens, operator keys, or env secrets on marketing, directory, or docs screenshots.
- Don’t rename the product around a single module (GEO, feed, tasks). Platform first: body + continuity + observation.

## Agent prompt guide

Use this block when generating or editing Silicon Nexus UI. It encodes the **existing** look; it is not a redesign brief.

```
You are designing UI for Silicon Nexus (silinex.xyz): a portable agent-body hub
(console for humans, REST/MCP for agents). Match the foundry language in DESIGN.md
and src/index.css. Do not redesign.

Canvas: dark-only #07111f (foundry-950). Text #f7fbff. Muted #9ec3e4.
Accent cyan #3ec6ff (teal-glow) on navy #042033. Copper #ffb020 for caution /
agent-side labels. Danger #ff5d7a / rose for fail-wipe-revoke. No light mode.
No extra brand colours.

Type: Space Grotesk + Noto Sans SC for narrative (headlines 600, tracking -0.03em
to -0.04em, sentence case). IBM Plex Mono for kickers, chips, IDs, JSON, paths,
HTTP methods, status. Kickers: ~11px uppercase, tracking 0.18em, cyan, optional
20px hairline prefix (.nx-kicker).

Chrome: reuse .nx-card (sheen + 0.9rem radius + inset hairline), .nx-panel,
.nx-btn.nx-btn-primary (pill + cyan glow), .nx-btn-ghost, .nx-chip.
Public CTAs are pills; console form submits are rounded-sm cyan fills.
Inputs: bg-foundry-950, border-white/10, font-mono.

Layout: public max-w-6xl; console max-w-[1400px]; docs/connect/about max-w-3xl.
Landing may use HeroBackdrop (aurora + grid floor + orbit). Console uses
foundry-grid only. Sticky header backdrop-blur, pill nav cluster.

Dual audience: teal kicker = operators, copper kicker = agents. Same state
must exist as JSON/MCP. Crawl badge = observed fetch, never "indexed".
Never render live tokens on public surfaces.

Motion: foundry-rise / foundry-pulse only; honor prefers-reduced-motion.
Icons: Lucide 14–16px in a 1px well. Mark: Hexagon, not a new logo.
```

### Implementation checklist for agents

1. New route: pick a shell — `foundry-glow` + `SiteHeader` (marketing), `foundry-grid` + `SiteHeader compact` (docs), or `ConsoleLayout` (operator).
2. Page title: Grotesk 600 + kicker. Body `text-foundry-400` / `500`.
3. Group content in `.nx-card` / `.nx-panel`. Clickable clusters add `.nx-card-hover`.
4. Primary action: public `.nx-btn-primary`, console `rounded-sm bg-teal-glow text-foundry-950`.
5. Any status: cyan live, copper wait, rose fail, mute idle. Document the same field in API/MCP.
6. Code, ids, curl, MCP JSON: `<pre className="font-mono text-[11px]">` on `bg-foundry-950`.
7. If humans see it, agents can GET it. If it is a secret, it stays behind AuthGate.