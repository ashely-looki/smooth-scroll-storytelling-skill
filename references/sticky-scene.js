// Per-section scrubbed reveal timeline for sticky scroll scenes.
//
// HTML: each section is `min-height: ~200vh` with an inner `.sticky-scene`
// (`position: sticky; top: 0; min-height: 100vh`). The visual holds while you
// scroll the section's range; the timeline below reveals content within it.
//
// KEY RULES:
//  - ScrollTrigger goes on the TIMELINE, never on a child tween.
//  - Reveal window: enter ~10%–45%, hold, ease out after ~78–84%. Not 0→100%.
//  - Exit keeps text READABLE (autoAlpha ~0.62, blur 2px) — never near-invisible.

function buildScrollScenes(gsap, ScrollTrigger) {
  document.querySelectorAll(".story-section").forEach((section) => {
    const words = section.querySelectorAll(".word");
    const art = section.querySelector(".art-card");
    const reverse = section.classList.contains("reverse");

    gsap.set(words, { autoAlpha: 0, y: 18, filter: "blur(5px)" });
    gsap.set(art, { autoAlpha: 0.3, y: 34, scale: 0.96, filter: "blur(6px)" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.05, // first smoothing layer (the proxy is the second, page-wide one)
      },
    });

    // Enter (positions are timeline-time, mapped across the scroll range).
    tl.to(art, { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.22 }, 0.1)
      .to(words, {
        autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.3,
        stagger: { each: 0.012, from: "start" },
      }, 0.16)
      // Drift through the middle.
      .to(art, { y: -42, rotation: reverse ? -2 : 2, duration: 0.5, ease: "none" }, 0.4)
      // Gentle, still-readable exit.
      .to(words, {
        autoAlpha: 0.62, y: -12, filter: "blur(2px)", duration: 0.2,
        stagger: { each: 0.006, from: "end" },
      }, 0.8)
      .to(art, { autoAlpha: 0.5, filter: "blur(3px)", duration: 0.16 }, 0.84);
  });
}
