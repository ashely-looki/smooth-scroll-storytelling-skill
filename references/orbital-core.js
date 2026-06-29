// Scroll-reactive canvas centerpiece — a "Rive-like" reference object with zero
// assets: a glowing core + tilted elliptical orbit rings with particles riding
// them (fake depth = near-half dots bigger/darker). Lessons baked in:
//   - it CLEARLY scales with scroll (0.7→1.3→0.7), not just micro-breathe
//   - deterministic: advance `t += 0.016`, no Date.now()/Math.random()
//   - cap DPR at 2; pause the rAF loop when the hero leaves the viewport
//   - fold scroll-scale + breathe into ONE `base`; don't re-multiply in orbits
//
// HTML: <canvas data-field class="field-canvas"></canvas> inside .hero-visual.

function startField({ reduceMotion, proxy }) {
  const canvas = document.querySelector("[data-field]");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, rafId = 0, t = 0;

  // [radius factor, Y-squash tilt, base rotation, particle count, spin speed]
  const ORBITS = [
    { rf: 0.34, tilt: 0.42, rot: 0.0, n: 5, spin: 0.55 },
    { rf: 0.52, tilt: 0.30, rot: 1.1, n: 7, spin: -0.4 },
    { rf: 0.72, tilt: 0.50, rot: 2.3, n: 9, spin: 0.3 },
  ];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * DPR);
    canvas.height = Math.round(h * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.5, cy = h * 0.5;
    const p = proxy ? proxy.smooth : 0;

    // THE scroll cue: grow toward mid-scroll, settle back. Make it obvious.
    const scaleScroll = 0.7 + Math.sin(p * Math.PI) * 0.6; // 0.7 → 1.3 → 0.7
    const breathe = 1 + Math.sin(t * 0.6) * 0.03;
    const base = Math.min(w, h) * 0.5 * scaleScroll * breathe; // folds in both
    const energy = 1 + p * 0.9; // particle speed

    // Glow + core.
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.95);
    glow.addColorStop(0, `rgba(199, 156, 91, ${(0.5 + p * 0.2).toFixed(3)})`);
    glow.addColorStop(0.4, "rgba(199, 156, 91, 0.12)");
    glow.addColorStop(1, "rgba(199, 156, 91, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, base * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(24, 22, 18, 0.82)";
    ctx.beginPath(); ctx.arc(cx, cy, base * 0.16, 0, Math.PI * 2); ctx.fill();

    // Orbits (base already includes scale+breathe — do NOT re-apply).
    for (const o of ORBITS) {
      const rx = base * o.rf, ry = rx * o.tilt;
      const ringRot = o.rot + t * o.spin * 0.25;

      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(ringRot);
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(24, 22, 18, 0.16)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();

      for (let i = 0; i < o.n; i++) {
        const a = (i / o.n) * Math.PI * 2 + t * o.spin * energy;
        const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
        const px = cx + ex * Math.cos(ringRot) - ey * Math.sin(ringRot);
        const py = cy + ex * Math.sin(ringRot) + ey * Math.cos(ringRot);
        const depth = (Math.sin(a) + 1) / 2; // near half = bigger/darker
        ctx.beginPath();
        ctx.fillStyle = `rgba(24, 22, 18, ${(0.28 + depth * 0.45).toFixed(3)})`;
        ctx.arc(px, py, 1.4 + depth * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function loop() { t += 0.016; draw(); rafId = requestAnimationFrame(loop); }

  resize();

  if (reduceMotion) { canvas.style.opacity = "1"; draw(); return; } // one static frame

  let resizeTimer = 0;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 200); });

  // Pause when the hero scrolls away.
  const heroVisual = canvas.closest(".hero-visual");
  if (heroVisual && "IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      const visible = entries[0] && entries[0].isIntersecting;
      if (visible && !rafId) loop();
      else if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }, { threshold: 0 }).observe(heroVisual);
  } else {
    loop();
  }
}
