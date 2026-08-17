# Design — Kernel Sprint

A locked design system for this app. Every page redesign reads this file
before emitting code. Extend or amend this file when the system needs to
grow — don't regenerate per page.

## Genre

modern-minimal (dev-tool / infra school) — a kernel scheduler research and
orchestration platform reads closer to a technical product dashboard than an
editorial or atmospheric AI-tool surface.

## Macrostructure family

Two families, split by what the page actually is:

- **App pages** (Lab, Benchmark, Patch, Experiments, Chaos) — *Workbench*.
  Function-first: real-time data, live terminals, running pipelines. No
  decorative enrichment — hallmark's own rule for app pages: function
  carries the page, not imagery. Structure stays close to what's already
  there (PageHeader → live component), since these components are real,
  tested, WebSocket-wired dashboards, not marketing surfaces.
- **Content pages** (Home, Features, Orchestrate, Kernel Workflow, Setup,
  Docs, Results) — *Stat-Led / icon-grid hybrid*. Icon-labeled sections
  instead of paragraph walls; numbered steps for procedural content (Setup);
  card grids with icon + short body instead of prose (Features, Docs); real
  data surfaced as stat callouts instead of described in a sentence
  (Results).

## Theme

This project has a coherent, non-templated palette, now shipped in **both**
light and dark — the original dark palette was preserved as-is, and a light
counterpart was added rather than replacing it. Class-based dark mode via
Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *));`
(`app/globals.css`), toggled by adding/removing `.dark` on `<html>`.
`ThemeScript.tsx` applies the stored/system preference before first paint
(no flash); `ThemeToggle.tsx` (in `Nav`) flips it and persists to
`localStorage`. Defaults to the visitor's OS preference on first visit.

Expressed as the Tailwind v4 class pairs actually in use (this app styles
via Tailwind utility classes, not raw CSS custom properties — the "tokens"
below are the locked *Tailwind class vocabulary*, serving the same
consistency purpose as a `tokens.css` would):

| Role | Light | Dark |
|---|---|---|
| Paper (page bg) | `bg-white` | `dark:bg-black` |
| Panel bg | `bg-zinc-50` | `dark:bg-zinc-950` |
| Panel border | `border-zinc-200` | `dark:border-zinc-800` |
| Body text | `text-zinc-600` | `dark:text-zinc-400` |
| Heading text | `text-zinc-900` | `dark:text-zinc-100` |
| Accent | `text-emerald-600` | `dark:text-emerald-400` (fill `bg-emerald-500` unchanged both) |
| Danger/chaos | `text-rose-600`, `border-rose-300` | `dark:text-rose-400`, `dark:border-rose-900` |
| Warning | `text-amber-600` | `dark:text-amber-500` |

Framer Motion `animate={{ backgroundColor: ... }}` targets (the three
step-diagram components: `ProcessLifecycle`, `KernelWorkflowDiagram`,
`RealKernelWorkflow`) can't use Tailwind's `dark:` classes — motion needs a
concrete color to interpolate, not a CSS variable — so they read
`useIsDark()` (`src/hooks/useIsDark.ts`, a `MutationObserver` on `<html>`'s
class list) and branch their hex literals explicitly.

Accent (emerald) stays under 5% of any viewport — used for active states,
key numbers, and icons, never as a fill background beyond buttons.

## Typography

- Display/body: Geist Sans (`next/font`, variable `--font-geist-sans`) —
  already in place, keep.
- Mono: Geist Mono (`--font-geist-mono`) — used for all real data (commands,
  metrics, code, kernel output). This mono-for-data / sans-for-prose split
  is already correct and should stay locked.
- No italic headers (project already follows this).

## Spacing

Tailwind's default scale, used consistently (`p-4`/`p-5`/`p-6`, `gap-3`/`gap-4`,
`mt-8`/`mt-10`/`mt-16`). No new scale needed.

## Motion

- Framer Motion already in use: `initial`/`animate` opacity+y fades,
  duration 0.3–0.6s, no bounce/overshoot.
- Reveal pattern: fade + slight y-offset on mount; color/border transitions
  on active states (0.3–0.4s).
- Respect `prefers-reduced-motion` — Framer Motion's defaults handle this;
  no custom override needed at this scale.

## Microinteractions stance

- Silent success (a completed benchmark run just shows its result — no
  toast).
- Live status indicated by color (emerald = connected/done, amber = running,
  rose = error) plus a pulsing dot for "in progress" states (already the
  pattern in `LiveMonitor`/`PatchRunner`/`ChaosPanel`).

## CTA voice

- Primary: `bg-emerald-500 text-black` filled pill/rounded-md button.
- Secondary: `border-zinc-700` outline button, `hover:border-zinc-500`.
- Both already consistent across the app — keep.

## Per-page allowances

- **Content pages** MAY use icon-led structure, small inline diagrams
  (existing `ArchitectureDiagram`/`KernelWorkflowDiagram`/`ProcessLifecycle`
  pattern), and stat callouts pulling from real `/api/results` data.
- **App pages** MUST NOT gain decorative enrichment — only chrome-level
  polish (spacing, PageHeader consistency). The live components themselves
  (RealTerminal, LiveMonitor, PatchRunner, ChaosPanel, ExperimentsPanel,
  SchedulerCompare, LiveBenchmarkRunner) are out of scope for structural
  change — real WebSocket/HTTP wiring, do not touch the logic.

## What pages MUST share

- The `kernel-sprint` wordmark and Nav structure (already grouped
  Learn/Do/Results with icons).
- The emerald accent and its restrained placement.
- Geist Sans + Geist Mono, with the mono-for-data convention.
- The `PageHeader` icon + title + description pattern (`src/components/PageHeader.tsx`).
- The icon set at `src/components/Icons.tsx` — new icons follow its
  hand-authored stroke-SVG style (24×24 viewBox, `currentColor`,
  `strokeWidth={1.6}`), not a new icon library.

## What pages MAY differ on

- Content pages may vary structure within the Stat-Led/icon-grid family
  (Setup is step-numbered; Features/Docs are card-grid; Results is
  stat-callout-led; Orchestrate is diagram-led).
- App pages vary only in which live component(s) they host.
