(() => {
  "use strict";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  ready(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    splitText("[data-split]");

    if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
      document.documentElement.classList.add("no-motion");
      revealWithoutMotion();
      // The canvas field is decorative motion only; draw one calm static frame
      // so reduced-motion users still get a finished-looking hero.
      startField({ reduceMotion: true });
      // Show the full guide line statically (no draw-on-scroll animation).
      drawGuideLineStatic();
      return;
    }

    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out", duration: 0.7 });

    const proxy = startScrollProxy(gsap, ScrollTrigger);

    intro(gsap);
    buildScrollScenes(gsap, ScrollTrigger);
    bindMeter(gsap, ScrollTrigger);
    bindNav(gsap, ScrollTrigger);
    bindPrompt(gsap);
    startField({ reduceMotion: false, proxy });
    bindGuideLine(gsap, proxy);

    window.addEventListener("load", () => ScrollTrigger.refresh());
  });

  function splitText(selector) {
    document.querySelectorAll(selector).forEach((node) => {
      const text = node.textContent.trim();
      if (!text) return;

      const tokens = text.split(/(\s+)/);
      node.textContent = "";

      tokens.forEach((token) => {
        if (!token) return;
        if (/^\s+$/.test(token)) {
          node.append(document.createTextNode(token));
          return;
        }

        const span = document.createElement("span");
        span.className = "word";
        span.textContent = token;
        node.append(span);
      });
    });
  }

  function revealWithoutMotion() {
    document.querySelectorAll(".word").forEach((word) => {
      word.style.opacity = "1";
      word.style.filter = "none";
      word.style.transform = "none";
    });
  }

  /**
   * The heart of the Solomei "smooth" feeling: raw scroll progress is read on
   * every ScrollTrigger update, but the value that drives ambient visuals is a
   * proxy that *eases toward* the raw value once per frame on gsap.ticker. The
   * lag between raw and proxy is what makes the whole page feel spring-damped
   * rather than hard-pinned to the scroll wheel.
   *
   * ScrollTrigger's per-tween `scrub` already smooths the scene timelines; this
   * proxy adds a second, slower smoothing layer for the page-wide drift
   * (background light, hero parallax) so motion arrives a beat behind the eye.
   */
  function startScrollProxy(gsap, ScrollTrigger) {
    const state = { raw: 0, smooth: 0 };
    // Lerp factor per frame — lower = more lag / softer. Tuned for ~60fps.
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
      // Frame-rate independent-ish lerp; tiny epsilon snap to avoid endless tiny work.
      const next = state.smooth + (state.raw - state.smooth) * EASE;
      const settled = Math.abs(next - state.raw) < 0.0002;
      if (settled && state.smooth === state.raw) return; // nothing moved this frame
      state.smooth = settled ? state.raw : next;

      // Drive a couple of CSS custom properties from the smoothed progress so
      // the background light and a soft glow drift behind the content. Written
      // directly (not via GSAP) to avoid quickSetter/custom-property edge cases.
      root.setProperty("--field-shift", `${(state.smooth * 60).toFixed(2)}px`);
      root.setProperty("--field-glow", (0.12 + state.smooth * 0.16).toFixed(3));
    });

    return state;
  }

  function intro(gsap) {
    gsap.set(".word", { autoAlpha: 0, y: 20, filter: "blur(6px)" });
    gsap.set([".main-card", ".floating-ring", ".grain-plane", ".prompt-bar"], {
      autoAlpha: 0,
      y: 24,
      filter: "blur(6px)",
    });
    gsap.set(".field-canvas", { autoAlpha: 0 });

    gsap.timeline({ delay: 0.1 })
      .to(".hero .word", {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: { each: 0.035, from: "start" },
        duration: 0.9,
      })
      .to(".field-canvas", { autoAlpha: 1, duration: 1.2 }, "-=0.7")
      .to([".main-card", ".floating-ring", ".grain-plane"], {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        stagger: 0.08,
      }, "-=0.95")
      .to(".prompt-bar", {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
      }, "-=0.2");

    gsap.to(".floating-ring", {
      rotation: 360,
      duration: 28,
      repeat: -1,
      ease: "none",
    });

    gsap.to(".grain-plane", {
      y: -24,
      x: 18,
      scale: 1.08,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  function buildScrollScenes(gsap, ScrollTrigger) {
    document.querySelectorAll(".story-section").forEach((section) => {
      const words = section.querySelectorAll(".word");
      const art = section.querySelector(".art-card");
      const orbA = section.querySelector(".orb-a");
      const orbB = section.querySelector(".orb-b");
      const reverse = section.classList.contains("reverse");

      gsap.set(words, { autoAlpha: 0, y: 18, filter: "blur(5px)" });
      gsap.set(art, { autoAlpha: 0.3, y: 34, scale: 0.96, filter: "blur(6px)" });
      gsap.set([orbA, orbB], { autoAlpha: 0.4, scale: 0.82 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.05,
        },
      });

      // Reveal window: art + words enter between ~10%–45% of the section's
      // scroll range, hold through the middle, then blur back out after ~78%.
      tl.to(art, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.22,
      }, 0.1)
        .to([orbA, orbB], {
          autoAlpha: 1,
          scale: 1,
          duration: 0.28,
          stagger: 0.05,
        }, 0.1)
        .to(words, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.3,
          stagger: { each: 0.012, from: "start" },
        }, 0.16)
        .to(art, {
          y: -42,
          rotation: reverse ? -2 : 2,
          duration: 0.5,
          ease: "none",
        }, 0.4)
        .to(orbA, {
          x: reverse ? 60 : -55,
          y: -110,
          scale: 1.18,
          duration: 0.7,
          ease: "none",
        }, 0.2)
        .to(orbB, {
          x: reverse ? -76 : 72,
          y: 90,
          scale: 0.94,
          duration: 0.7,
          ease: "none",
        }, 0.2)
        // Gentle exit: text stays clearly readable as it leaves (keeps most of
        // its opacity, only a touch of blur) instead of vanishing on the way out.
        .to(words, {
          autoAlpha: 0.62,
          y: -12,
          filter: "blur(2px)",
          duration: 0.2,
          stagger: { each: 0.006, from: "end" },
        }, 0.8)
        .to(art, {
          autoAlpha: 0.5,
          filter: "blur(3px)",
          duration: 0.16,
        }, 0.84);
    });
  }

  function bindMeter(gsap, ScrollTrigger) {
    const fill = document.querySelector(".scroll-meter i");
    const label = document.querySelector("[data-progress-label]");
    if (!fill) return;

    ScrollTrigger.create({
      trigger: document.documentElement,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        gsap.to(fill, {
          scaleY: self.progress,
          duration: 0.35,
          overwrite: "auto",
          ease: "power2.out",
        });
        if (label) label.textContent = `${Math.round(self.progress * 100)}%`;
      },
    });
  }

  function bindNav(gsap, ScrollTrigger) {
    const links = [...document.querySelectorAll(".chapter-nav a")];
    const byHash = new Map(links.map((link) => [link.getAttribute("href"), link]));

    document.querySelectorAll("section[id]").forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: "top center",
        end: "bottom center",
        onToggle(self) {
          if (!self.isActive) return;
          links.forEach((link) => link.classList.remove("is-active"));
          const active = byHash.get(`#${section.id}`);
          if (active) active.classList.add("is-active");
        },
      });
    });

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function bindPrompt(gsap) {
    const prompt = document.querySelector(".prompt-bar");
    const button = document.querySelector(".prompt-bar button");
    if (!prompt || !button) return;

    prompt.addEventListener("pointermove", (event) => {
      const rect = prompt.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (event.clientY - rect.top - rect.height / 2) / rect.height;
      gsap.to(prompt, {
        xPercent: -50,
        x: x * 8,
        y: y * 6,
        duration: 0.35,
        overwrite: "auto",
      });
    });

    prompt.addEventListener("pointerleave", () => {
      gsap.to(prompt, { xPercent: -50, x: 0, y: 0, duration: 0.45, overwrite: "auto" });
    });

    button.addEventListener("click", () => {
      gsap.fromTo(prompt,
        { scale: 0.985 },
        { scale: 1, duration: 0.45, ease: "elastic.out(1, 0.45)" }
      );
    });
  }

  /**
   * Build a serpentine "right→down" path string that spans the full page
   * height. The line starts near the top, then weaves left/right as it descends
   * the whole document, so it physically threads every section. Coordinates are
   * in real page pixels (the SVG viewBox is set to the page size in JS).
   */
  function buildGuidePath(pageW, pageH) {
    // Horizontal extents the weave swings between (keep some margin off-edge).
    const left = pageW * 0.16;
    const right = pageW * 0.84;
    // Vertical span: start a little below the top, end a little above the bottom.
    const top = pageH * 0.05;
    const bottom = pageH * 0.96;
    // One full left↔right swing roughly per viewport height of scrolling.
    const span = bottom - top;
    const segments = Math.max(3, Math.round(span / window.innerHeight));
    const step = span / segments;
    const mid = (left + right) / 2;
    const half = (right - left) / 2;

    // Seeded PRNG so the irregularity is stable across reloads and resize
    // relayouts (the line shouldn't jump when the page is recomputed).
    let seed = 7333;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    // Build the anchor points: alternating left/right, descending — but with
    // per-anchor jitter so the weave looks hand-drawn, not metronomic:
    //  - each swing reaches a slightly different horizontal extent (not always
    //    the full left/right), and overshoots/undershoots a touch;
    //  - the vertical spacing between turns varies, so turns aren't evenly spaced.
    const pts = [];
    let onRight = true;
    pts.push({ x: left + (rnd() - 0.5) * half * 0.3, y: top });
    for (let i = 1; i <= segments; i++) {
      const dir = onRight ? 1 : -1;
      // 0.7–1.12 of the half-width, around the mid — varies reach per turn.
      const reach = half * (0.7 + rnd() * 0.42);
      const x = mid + dir * reach;
      // Jitter the vertical position of each turn by up to ~22% of a step.
      const yJit = i < segments ? (rnd() - 0.5) * step * 0.44 : 0;
      pts.push({ x, y: top + step * i + yJit });
      onRight = !onRight;
    }

    // Smooth the polyline through those anchors with a Catmull-Rom → cubic-Bézier
    // conversion. This makes every turn a rounded arc with a CONTINUOUS tangent
    // (C1 continuity), so there are no sharp corners at the swing points.
    const k = 0.5; // smoothing strength (tension); higher = rounder turns.
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      // Control points derived from neighbouring anchors → tangents line up.
      const c1x = p1.x + ((p2.x - p0.x) / 6) * k * 2;
      const c1y = p1.y + ((p2.y - p0.y) / 6) * k * 2;
      const c2x = p2.x - ((p3.x - p1.x) / 6) * k * 2;
      const c2y = p2.y - ((p3.y - p1.y) / 6) * k * 2;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  }

  /** Current full document height (the page can be taller than the viewport). */
  function pageHeight() {
    const b = document.body;
    const e = document.documentElement;
    return Math.max(b.scrollHeight, e.scrollHeight, b.offsetHeight, e.offsetHeight);
  }

  /**
   * The guide line: one SVG path that physically runs the full length of the
   * document. We size the SVG to the page, generate the serpentine path from the
   * real page dimensions, then draw it on scroll via stroke-dashoffset. The draw
   * follows the smoothed scroll proxy, so the leading tip trails the scroll with
   * the same soft lag as the rest of the page.
   */
  function bindGuideLine(gsap, proxy) {
    const svg = document.querySelector(".guide-line");
    const path = document.querySelector("[data-guide-path]");
    if (!svg || !path || typeof path.getTotalLength !== "function") return;

    let length = 1;

    const layout = () => {
      const w = document.documentElement.clientWidth;
      const h = pageHeight();
      // Match the SVG's coordinate system to real page pixels so the path lines
      // up 1:1 with the document and never skews under preserveAspectRatio=none.
      svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
      svg.setAttribute("width", w);
      svg.setAttribute("height", h);
      svg.style.height = `${h}px`;
      path.setAttribute("d", buildGuidePath(w, h));
      length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      // Preserve current drawn fraction across relayout.
      const drawn = Math.min(1, proxy.smooth);
      path.style.strokeDashoffset = `${length * (1 - drawn)}`;
    };

    layout();

    // Recompute when the page size changes (resize, fonts, ScrollTrigger refresh).
    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 200);
    });
    if (window.ScrollTrigger) window.ScrollTrigger.addEventListener("refresh", layout);
    window.addEventListener("load", layout);

    // The line gets its OWN second smoothing pass on top of the proxy: it eases
    // toward the (already smoothed) proxy value every frame. Two stacked low-pass
    // filters remove the residual stepiness so the drawn tip glides instead of
    // ticking forward, even on fast scroll or low frame rates.
    let drawn = Math.min(1, proxy.smooth);
    const LINE_EASE = 0.12;
    gsap.ticker.add(() => {
      const target = Math.min(1, proxy.smooth);
      drawn += (target - drawn) * LINE_EASE;
      if (Math.abs(target - drawn) < 0.00005) drawn = target;
      path.style.strokeDashoffset = `${(length * (1 - drawn)).toFixed(2)}`;
    });
  }

  /** Reduced-motion / no-GSAP fallback: lay out the full guide line, undrawn-free. */
  function drawGuideLineStatic() {
    const svg = document.querySelector(".guide-line");
    const path = document.querySelector("[data-guide-path]");
    if (!svg || !path) return;
    const w = document.documentElement.clientWidth;
    const h = pageHeight();
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", w);
    svg.setAttribute("height", h);
    svg.style.height = `${h}px`;
    path.setAttribute("d", buildGuidePath(w, h));
    path.style.strokeDasharray = "none";
    path.style.strokeDashoffset = "0";
  }

  /**
   * The hero's main visual reference: a single "orbital core" rendered on
   * canvas with zero external assets — a soft glowing center wrapped in a few
   * tilted elliptical orbits, with particles riding those orbits. It reads as
   * one 3D-ish object the eye can anchor to (a Rive-like centerpiece). It
   * rotates and breathes continuously, and energizes with the scroll proxy so
   * it stays tied to the page's motion. Capped DPR keeps it cheap; it idles via
   * requestAnimationFrame and respects reduced-motion.
   */
  function startField({ reduceMotion, proxy }) {
    const canvas = document.querySelector("[data-field]");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let rafId = 0;
    let t = 0; // animation time, advanced per frame (no Date/random needed)

    // Tilted orbit rings: [radius factor, tilt (squash on Y), base rotation,
    // particle count, spin speed]. Mild differences give a layered, 3D feel.
    const ORBITS = [
      { rf: 0.34, tilt: 0.42, rot: 0.0, n: 5, spin: 0.55 },
      { rf: 0.52, tilt: 0.30, rot: 1.1, n: 7, spin: -0.4 },
      { rf: 0.72, tilt: 0.5, rot: 2.3, n: 9, spin: 0.3 },
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

      const cx = w * 0.5;
      const cy = h * 0.5;
      const p = proxy ? proxy.smooth : 0;
      // Scroll-driven scale: the whole core noticeably grows then settles back as
      // you move through the page (peaks around mid-scroll), plus a subtle
      // time-based breathing on top. This is the main "react to scroll" cue.
      const scaleScroll = 0.7 + Math.sin(p * Math.PI) * 0.6; // 0.7 → 1.3 → 0.7
      const breathe = 1 + Math.sin(t * 0.6) * 0.03;
      const base = Math.min(w, h) * 0.5 * scaleScroll * breathe;
      // Orbit particle motion energizes with scroll too.
      const energy = 1 + p * 0.9;

      // Soft glowing core.
      const coreR = base * 0.16;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 0.95);
      glow.addColorStop(0, `rgba(199, 156, 91, ${(0.5 + p * 0.2).toFixed(3)})`);
      glow.addColorStop(0.4, "rgba(199, 156, 91, 0.12)");
      glow.addColorStop(1, "rgba(199, 156, 91, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, base * 0.95, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(24, 22, 18, 0.82)";
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Orbit rings + the particles riding them. (base already folds in the
      // scroll scale and breathing, so don't re-apply them here.)
      for (const o of ORBITS) {
        const rx = base * o.rf;
        const ry = rx * o.tilt;
        const ringRot = o.rot + t * o.spin * 0.25;

        // The elliptical ring stroke.
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ringRot);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(24, 22, 18, 0.16)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // Particles spaced around the ring, advancing with time + energy.
        for (let i = 0; i < o.n; i++) {
          const a = (i / o.n) * Math.PI * 2 + t * o.spin * energy;
          // Point on the (untilted) ellipse, then rotate into the ring's plane.
          const ex = Math.cos(a) * rx;
          const ey = Math.sin(a) * ry;
          const px = cx + ex * Math.cos(ringRot) - ey * Math.sin(ringRot);
          const py = cy + ex * Math.sin(ringRot) + ey * Math.cos(ringRot);
          // Fake depth: dots on the lower half of the sine are "in front" → bigger/darker.
          const depth = (Math.sin(a) + 1) / 2;
          const r = 1.4 + depth * 2.4;
          ctx.beginPath();
          ctx.fillStyle = `rgba(24, 22, 18, ${(0.28 + depth * 0.45).toFixed(3)})`;
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function loop() {
      t += 0.016;
      draw();
      rafId = requestAnimationFrame(loop);
    }

    resize();

    if (reduceMotion) {
      // One static frame, no animation loop.
      canvas.style.opacity = "1";
      draw();
      return;
    }

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    // Pause the loop when the hero scrolls out of view to save work.
    const heroVisual = canvas.closest(".hero-visual");
    if (heroVisual && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible && !rafId) {
          loop();
        } else if (!visible && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }, { threshold: 0 });
      io.observe(heroVisual);
    } else {
      loop();
    }
  }
})();
