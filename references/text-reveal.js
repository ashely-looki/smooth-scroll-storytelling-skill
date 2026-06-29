// Word-by-word blur text reveal + intro timeline + reduced-motion fallback.
//
// 1) splitText wraps each word in <span class="word">, preserving whitespace so
//    line-wrapping survives.
// 2) intro() animates the hero words in (light blur, small y, staggered).
// 3) revealWithoutMotion() is the no-motion / no-GSAP fallback.

function splitText(selector) {
  document.querySelectorAll(selector).forEach((node) => {
    const text = node.textContent.trim();
    if (!text) return;

    const tokens = text.split(/(\s+)/); // keep the whitespace tokens
    node.textContent = "";

    tokens.forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        node.append(document.createTextNode(token)); // real space → wrapping works
        return;
      }
      const span = document.createElement("span");
      span.className = "word"; // CSS: .word { display:inline-block; white-space:pre-wrap; will-change:transform,opacity,filter }
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

function intro(gsap) {
  // Keep entry blur LIGHT (~6px). Heavy blur (9–10px) reads as smeared.
  gsap.set(".word", { autoAlpha: 0, y: 20, filter: "blur(6px)" });
  gsap.set([".main-card", ".prompt-bar"], { autoAlpha: 0, y: 24, filter: "blur(6px)" });

  gsap.timeline({ delay: 0.1 })
    .to(".hero .word", {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      stagger: { each: 0.035, from: "start" },
      duration: 0.9,
    })
    .to(".main-card", { autoAlpha: 1, y: 0, filter: "blur(0px)" }, "-=0.6")
    .to(".prompt-bar", { autoAlpha: 1, y: 0, filter: "blur(0px)" }, "-=0.2");
}

// Standard bootstrap with reduced-motion + no-GSAP guard:
//
//   const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
//   splitText("[data-split]");
//   if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
//     document.documentElement.classList.add("no-motion");
//     revealWithoutMotion();
//     // also: draw guide line statically, render one static canvas frame
//     return;
//   }
//   const { gsap, ScrollTrigger } = window;
//   gsap.registerPlugin(ScrollTrigger);
//   gsap.defaults({ ease: "power3.out", duration: 0.7 });
//   ... build proxy, scenes, line, core ...
//   window.addEventListener("load", () => ScrollTrigger.refresh());
