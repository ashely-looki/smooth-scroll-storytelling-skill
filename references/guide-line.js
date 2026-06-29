// Full-document SVG guide line — "one line threading the whole page", drawn on
// scroll. The hardest-won snippet. Lessons baked in:
//   - sized in REAL page pixels (scrolls with content, no skew)
//   - Catmull-Rom smoothing → rounded arcs, no kinks at the turns
//   - SEEDED jitter → hand-drawn irregularity, stable across reloads/relayouts
//   - draw via stroke-dashoffset, tied to the proxy + its OWN second lerp
//   - relayout on resize / load / ScrollTrigger refresh (page height changes)
//
// HTML:
//   <svg class="guide-line" preserveAspectRatio="none" aria-hidden="true">
//     <path data-guide-path fill="none" vector-effect="non-scaling-stroke" />
//   </svg>
// CSS: body { position: relative } .guide-line { position:absolute; top:0; left:0;
//   width:100%; height:100%; z-index:0; pointer-events:none } (JS sets real height)

function buildGuidePath(pageW, pageH) {
  const left = pageW * 0.16, right = pageW * 0.84;
  const top = pageH * 0.05, bottom = pageH * 0.96;
  const span = bottom - top;
  const segments = Math.max(3, Math.round(span / window.innerHeight)); // ~1 swing/viewport
  const step = span / segments;
  const mid = (left + right) / 2, half = (right - left) / 2;

  // Seeded PRNG — NEVER Math.random(), or the line jumps on every relayout.
  let seed = 7333;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

  // Anchors: alternate sides, descend — with per-anchor jitter (reach + spacing)
  // so the weave is irregular, not metronomic.
  const pts = [];
  let onRight = true;
  pts.push({ x: left + (rnd() - 0.5) * half * 0.3, y: top });
  for (let i = 1; i <= segments; i++) {
    const dir = onRight ? 1 : -1;
    const reach = half * (0.7 + rnd() * 0.42);        // 0.70–1.12 of half-width
    const yJit = i < segments ? (rnd() - 0.5) * step * 0.44 : 0; // ±22% of a step
    pts.push({ x: mid + dir * reach, y: top + step * i + yJit });
    onRight = !onRight;
  }

  // Catmull-Rom → cubic Bézier. Control points from neighbouring anchors give a
  // CONTINUOUS tangent at each anchor (C1) ⇒ rounded arcs, no sharp corners —
  // even after the jitter above.
  const k = 0.5; // tension; higher = rounder turns
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + ((p2.x - p0.x) / 6) * k * 2, c1y = p1.y + ((p2.y - p0.y) / 6) * k * 2;
    const c2x = p2.x - ((p3.x - p1.x) / 6) * k * 2, c2y = p2.y - ((p3.y - p1.y) / 6) * k * 2;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function pageHeight() {
  const b = document.body, e = document.documentElement;
  return Math.max(b.scrollHeight, e.scrollHeight, b.offsetHeight, e.offsetHeight);
}

function bindGuideLine(gsap, proxy) {
  const svg = document.querySelector(".guide-line");
  const path = document.querySelector("[data-guide-path]");
  if (!svg || !path || typeof path.getTotalLength !== "function") return;

  let length = 1;

  const layout = () => {
    const w = document.documentElement.clientWidth;
    const h = pageHeight();
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`); // 1:1 with the document
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.style.height = `${h}px`;
    path.setAttribute("d", buildGuidePath(w, h));
    length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    const drawn = Math.min(1, proxy.smooth); // preserve drawn fraction across relayout
    path.style.strokeDashoffset = `${length * (1 - drawn)}`;
  };

  layout();

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(layout, 200); });
  if (window.ScrollTrigger) window.ScrollTrigger.addEventListener("refresh", layout);
  window.addEventListener("load", layout); // fonts/images change page height

  // Second smoothing pass: ease toward the (already smoothed) proxy. Two stacked
  // low-pass filters → the tip glides instead of ticking forward.
  let drawn = Math.min(1, proxy.smooth);
  const LINE_EASE = 0.12;
  gsap.ticker.add(() => {
    const target = Math.min(1, proxy.smooth);
    drawn += (target - drawn) * LINE_EASE;
    if (Math.abs(target - drawn) < 0.00005) drawn = target;
    path.style.strokeDashoffset = `${(length * (1 - drawn)).toFixed(2)}`;
  });
}

// Reduced-motion / no-GSAP fallback: show the whole line at once.
function drawGuideLineStatic() {
  const svg = document.querySelector(".guide-line");
  const path = document.querySelector("[data-guide-path]");
  if (!svg || !path) return;
  const w = document.documentElement.clientWidth, h = pageHeight();
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("width", w); svg.setAttribute("height", h); svg.style.height = `${h}px`;
  path.setAttribute("d", buildGuidePath(w, h));
  path.style.strokeDasharray = "none";
  path.style.strokeDashoffset = "0";
}

// ---------------------------------------------------------------------------
// VERIFY THE GEOMETRY FROM THE SHELL (you can't see the render):
// Paste buildGuidePath into node (stub window.innerHeight) and assert:
//   1) tangent continuity at anchors (max kink ≈ 0° ⇒ no sharp corners)
//   2) anchor reaches/spacings differ ⇒ irregular, not mechanical
// Reuse the control-point math; compute incoming dir (c2→p2) vs outgoing
// (next p1→c1) at each shared anchor and confirm the angle delta ≈ 0.
