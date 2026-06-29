---
name: smooth-scroll-storytelling
description: Build a calm, editorial, "spring-smoothed" scroll-storytelling page in the style of solomei.ai — using vanilla HTML/CSS/GSAP. Use when the user wants a smooth scroll narrative, word-by-word blur text reveal, a guide line threading the page, a scroll-reactive canvas centerpiece, sticky scroll scenes, or that "Solomei / Framer Motion" smooth feel without a build step.
metadata:
  tags: scroll-storytelling, gsap, scrolltrigger, smooth-scroll, canvas, svg, text-reveal, solomei, vanilla-js, motion
---

# Smooth Scroll Storytelling

Build a quiet, editorial, scroll-driven narrative page that *feels* spring-smoothed — the look of sites like solomei.ai. Plain HTML/CSS/JS + GSAP (CDN), no build step. Pairs with the **gsap-ui-motion** skill; read its `references/gsap-scrolltrigger` and `references/gsap-performance` for the underlying GSAP rules.

This skill is the recipe distilled from building such a page end to end, including the mistakes that cost time. Prefer copying the verified snippets in `references/` over reinventing them.

## When to Use

- "Make the scroll feel smooth / silky / like Solomei / like Framer Motion."
- Scroll storytelling: sections that reveal as you descend, text appearing word by word from blur to sharp.
- A single line/path that threads the whole page and draws as you scroll.
- A scroll-reactive visual centerpiece (canvas) as a reference object the eye can anchor to.
- Calm, editorial, sparse pages — large-ish serif headings, glass UI, restrained motion.

## The Core Idea: a Smoothing Proxy

The single biggest contributor to the "smooth" feeling is **not** scrubbing animations directly to raw scroll. Instead:

1. Read raw scroll progress (0–1) on every ScrollTrigger update.
2. Keep a separate `smooth` value that **eases toward** `raw` once per frame on `gsap.ticker` (a lerp).
3. Drive ambient/visual motion from `smooth`, not `raw`.

The lag between `raw` and `smooth` is what makes the page feel damped instead of hard-pinned to the wheel. Per-tween `scrub` adds a first layer of smoothing for scene timelines; the proxy adds a second, slower, page-wide layer. See `references/scroll-proxy.js`.

For anything that still looks "steppy" (notably an SVG line being drawn), give it its **own second lerp** on top of the proxy — two stacked low-pass filters glide where one still ticks. See `references/guide-line.js`.

## Page Anatomy

A typical layout (see `references/page-skeleton.html` + `references/styles-core.css`):

- Fixed glass top bar (brand + chapter nav). `pointer-events: none` on the bar, `auto` on the chips.
- **Hero**: heading + sub copy on one side, a canvas centerpiece on the other.
- **Story sections**: each `min-height: ~200vh` with a `position: sticky; top: 0` inner scene, so the visual holds while you scroll its range.
- **End panel** + a fixed glass prompt bar (the "AI guide" entry motif).
- A full-document SVG **guide line** behind the content.

## Build Order (and the pitfalls at each step)

### 1. Typography & altitude — start restrained
Oversized headings read as "AI default". Use a **medium editorial scale**: `h1` ≈ `clamp(40px, 5.2vw, 64px)`, `h2` ≈ `clamp(30px, 3.6vw, 44px)`, tight line-height (~1.0–1.1). Leave room for a visual reference element — a wall of huge text with nothing beside it feels empty. Set headings `overflow-wrap: anywhere; text-wrap: balance` so long lines wrap cleanly.

For the UI sans, avoid the overused defaults (Inter, Roboto, Geist, Plus Jakarta Sans, Space Grotesk, Fraunces). Pick something with more character and expose it as one `--sans` variable so it's a single point of change. Body in a serif (`--serif`).

### 2. Split text into words, then reveal by word
Wrap each whitespace-delimited token in `<span class="word">` (keep the whitespace as text nodes so wrapping survives). Animate `autoAlpha + y + filter: blur()` with a small per-word `stagger`. See `references/text-reveal.js`.

**Pitfall — blur too strong:** keep entry blur light (~`5–6px`, not `9–10px`). And on the **exit** of a scroll-scrubbed scene, do NOT fade text to near-invisible (`autoAlpha: 0.2, blur(7px)` makes it vanish on the way out). Keep it readable: `autoAlpha: ~0.62, blur(2px)`.

**Pitfall — reveal window:** for scrubbed scenes, reveal between ~10%–45% of the section's scroll range, hold the middle, ease out after ~78–84%. Don't start at 0 or end at 100% or it feels abrupt.

### 3. Sticky scroll scenes
Tall section (`~200vh`) + sticky inner scene. Drive a GSAP timeline with `scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: ~1.05 }`. Put the ScrollTrigger on the **timeline**, never on a child tween. See `references/sticky-scene.js`.

### 4. The guide line (the "one line through the page")
If the user wants a line that **physically threads the whole document** (scrolls with content), NOT a fixed line redrawn in the viewport:

- SVG is `position: absolute` over the **full document height** (set in JS), inside a `position: relative` body.
- Generate the path `d` from **real page pixels** (`viewBox = 0 0 pageW pageH`, `preserveAspectRatio="none"`).
- Draw on scroll via `stroke-dasharray` + `stroke-dashoffset` tied to the smoothing proxy (+ its own lerp).

**Pitfall — sharp corners:** naïvely alternating left/right control points gives **kinks** at the turns. Use a **Catmull-Rom → cubic-Bézier** conversion so every turn has a continuous tangent (C1) = rounded arcs, no corners.

**Pitfall — too regular:** a perfectly symmetric S-curve looks mechanical. Jitter each anchor's horizontal reach and vertical spacing with a **seeded** PRNG (stable across reloads/resizes — never `Math.random()`, or the line jumps on every relayout). The Catmull-Rom smoothing keeps it kink-free even after jitter.

**Pitfall — page height changes:** recompute the path + dash length on `resize`, `window load`, AND `ScrollTrigger` `refresh` (fonts/images change document height; a stale length breaks the draw). See `references/guide-line.js`.

### 5. Canvas centerpiece (scroll-reactive reference object)
A "Rive-like" anchor with zero assets: a soft glowing core + a few tilted elliptical orbit rings with particles riding them (fake depth: dots on the near half are bigger/darker). Make it **clearly scale with scroll** (e.g. `0.7 → 1.3 → 0.7` via `sin(p·π)`), not just micro-breathe — users read a subtle breathe as "not reacting." See `references/orbital-core.js`.

**Pitfalls:**
- Cap DPR at 2; pause the rAF loop when the hero leaves the viewport (IntersectionObserver).
- No `Date.now()` / `Math.random()` for the loop — advance a `t += 0.016` counter and use a seeded PRNG, so it's deterministic and resume-safe.
- Fold scroll-scale + breathe into one `base` radius and DON'T re-multiply them in the orbit math (double-scaling bug).
- When the canvas becomes the centerpiece, remove competing decorations (extra rings/blobs) and shrink any HUD card so it labels rather than fights the core.

### 6. Reduced motion & no-JS fallback
Always handle `prefers-reduced-motion` and a no-GSAP path: reveal all words immediately, draw the guide line fully (static), render one static canvas frame. See the top of `references/text-reveal.js` and the static fallbacks in the line/core snippets.

## Performance Rules (carried from gsap-performance)

- Animate `transform`/`opacity`/`autoAlpha` and `filter`; avoid layout props.
- Write frequently-updated CSS custom properties directly with `el.style.setProperty(...)` inside the ticker — avoid `gsap.quickSetter` edge cases with custom properties.
- One `gsap.ticker.add` per concern; bail early when nothing moved.
- `will-change: transform, opacity, filter` only on elements actually animating (e.g. `.word`).

## How to Run / Verify

No build step. Open `index.html` directly, or `python3 -m http.server 5177` then visit `http://localhost:5177`. Keep the server running in the background while iterating.

Verify what you *can* from the shell — you can't see the rendered feel:
- `node --check app.js` for syntax.
- For path geometry, evaluate the generator in `node` and assert tangent continuity (max kink ≈ 0°) and anchor irregularity. See the verification snippet in `references/guide-line.js`.
- Then explicitly tell the user which qualities (smoothness, scale, rhythm) need their eyes, and which knobs to turn (proxy `EASE`, line `LINE_EASE`, jitter amounts, scale curve).

## Do Not

- ❌ Scrub everything to raw scroll and expect "smooth" — add the proxy.
- ❌ Use heavy blur, or fade text to near-invisible on exit.
- ❌ Build the guide line as alternating hard control points (kinks) or a perfectly symmetric weave (mechanical).
- ❌ Use `Math.random()` / `Date.now()` in generators or loops — seed them, so layout is stable and runs are reproducible.
- ❌ Oversize headings with no reference object beside them.
- ❌ Put a ScrollTrigger on a child tween inside a timeline; put it on the timeline.
- ❌ Forget `ScrollTrigger.refresh()`-time relayout for anything sized to document height.

## Reference Files

- `references/page-skeleton.html` — minimal page structure (bar, hero+canvas, sticky sections, prompt bar, guide-line SVG).
- `references/styles-core.css` — variables, glass surfaces, sticky scenes, guide-line + canvas positioning, reduced-motion block.
- `references/scroll-proxy.js` — the smoothing proxy (raw → smoothed progress on the ticker).
- `references/text-reveal.js` — split-into-words, intro timeline, reduced-motion fallback.
- `references/sticky-scene.js` — per-section scrubbed reveal timeline with safe in/out windows.
- `references/guide-line.js` — full-document SVG line: page-pixel sizing, Catmull-Rom smoothing, seeded jitter, scroll-draw with its own lerp, relayout, static fallback, + a node verification snippet.
- `references/orbital-core.js` — the scroll-reactive canvas centerpiece.

## Runnable Example

`examples/demo/` is a complete, no-build page wiring all of the above together —
open `examples/demo/index.html` directly (or serve the folder). It's the
assembled version of the `references/` snippets; use it to see the techniques
working and as a starting point to copy from.
