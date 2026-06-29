# smooth-scroll-storytelling

A Claude skill for building calm, editorial, **spring-smoothed scroll-storytelling pages** — the motion feel of sites like [solomei.ai](https://solomei.ai) — using plain HTML/CSS/GSAP with **no build step**.

It captures a recipe distilled from building such a page end to end, including the mistakes that cost time, and ships verified, copy-ready code snippets.

## What it covers

- **Smoothing proxy** — the core "silky" feel: ease a proxy value toward raw scroll on `gsap.ticker`, drive visuals from the proxy (not raw scroll).
- **Word-by-word blur text reveal** — split into words, reveal with light blur + stagger; readable on the way out.
- **Sticky scroll scenes** — tall sections with a sticky inner scene and scrubbed reveal timelines.
- **Full-document guide line** — one SVG path threading the whole page, drawn on scroll: Catmull-Rom rounded arcs (no kinks), seeded irregular weave, relayout-safe.
- **Scroll-reactive canvas centerpiece** — a Rive-like "orbital core" that clearly scales with scroll, zero external assets.
- **Reduced-motion & no-JS fallbacks**, plus performance rules.

## Structure

```
smooth-scroll-storytelling/
├── SKILL.md                  # method, build order, pitfalls, Do/Don't
└── references/
    ├── page-skeleton.html    # page structure
    ├── styles-core.css       # variables, glass, sticky scenes, positioning, mobile, reduced-motion
    ├── scroll-proxy.js       # the smoothing proxy
    ├── text-reveal.js        # split-into-words + intro timeline + fallback
    ├── sticky-scene.js       # per-section scrubbed reveal
    ├── guide-line.js         # full-document guide line (+ geometry verification)
    └── orbital-core.js       # scroll-reactive canvas centerpiece
```

## Install

**Claude Code** (local/team) — clone into your skills directory:

```bash
git clone https://github.com/ashely-looki/smooth-scroll-storytelling-skill.git \
  ~/.claude/skills/smooth-scroll-storytelling
```

(or place it under a project's `.claude/skills/`).

**claude.ai / API** — download the repo as a ZIP and upload it as a skill.

## License

MIT
