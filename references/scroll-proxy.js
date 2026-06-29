// Smoothing proxy — the core of the "spring-smoothed" feel.
//
// Read raw scroll progress on every ScrollTrigger update, then ease a separate
// `smooth` value toward it once per frame on gsap.ticker. Drive ambient visuals
// from `smooth`, not `raw`. The lag is the smooth feeling.
//
// Returns a live `state` object; other modules read `state.smooth` (0..1).

function startScrollProxy(gsap, ScrollTrigger) {
  const state = { raw: 0, smooth: 0 };
  // Lerp factor per frame — lower = more lag / softer, higher = snappier.
  const EASE = 0.06;

  ScrollTrigger.create({
    trigger: document.documentElement,
    start: "top top",
    end: "bottom bottom",
    onUpdate(self) {
      state.raw = self.progress;
    },
  });

  const root = document.documentElement.style;

  gsap.ticker.add(() => {
    const next = state.smooth + (state.raw - state.smooth) * EASE;
    const settled = Math.abs(next - state.raw) < 0.0002;
    if (settled && state.smooth === state.raw) return; // nothing moved this frame
    state.smooth = settled ? state.raw : next;

    // Example: drive CSS custom properties for a drifting background glow.
    // Written directly (not via gsap.quickSetter) to avoid custom-property edge
    // cases. Define `--field-shift` / `--field-glow` with defaults in :root and
    // consume them in body::before / body::after gradients.
    root.setProperty("--field-shift", `${(state.smooth * 60).toFixed(2)}px`);
    root.setProperty("--field-glow", (0.12 + state.smooth * 0.16).toFixed(3));
  });

  return state;
}

// Usage:
//   gsap.registerPlugin(ScrollTrigger);
//   const proxy = startScrollProxy(gsap, ScrollTrigger);
//   // pass `proxy` to the guide line and the canvas core so they read proxy.smooth
