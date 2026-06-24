"use strict";

/**
 * Clamp a value between min and max.
 * @param {number} val
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/**
 * @param {number} a  start
 * @param {number} b  end
 * @param {number} t  0-1 factor
 * @returns {number}
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * @returns {boolean}
 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── 2. STAR CANVAS PARTICLE SYSTEM ────────────────────────── */

const StarField = (function () {
  const canvas  = document.getElementById("starCanvas");
  const ctx     = canvas ? canvas.getContext("2d") : null;
  let   stars   = [];
  let   width   = 0;
  let   height  = 0;
  let   scrollY = 0;
  let   lastScrollY = 0;
  let   scrollVelocity = 0;
  let   animFrameId;

  /** Resize canvas to fill the viewport */
  function resize() {
    if (!canvas) return;
    width  = canvas.width  = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function generateStars(count) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x:      Math.random() * width,
        y:      Math.random() * height,
        radius: Math.random() * 1.6 + 0.2,
        alpha:  Math.random() * 0.8 + 0.2,
        speed:  Math.random() * 0.4 + 0.05,   
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinkleDir:   Math.random() < 0.5 ? 1 : -1,
      });
    }
  }

  /** Render one frame */
  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // Velocity easing
    scrollVelocity = lerp(scrollVelocity, window.scrollY - lastScrollY, 0.1);
    lastScrollY    = window.scrollY;

    stars.forEach(s => {
      // Twinkle
      s.alpha += s.twinkleSpeed * s.twinkleDir;
      if (s.alpha >= 1 || s.alpha <= 0.1) s.twinkleDir *= -1;

      // Scroll-based drift (stars further back move slower)
      const drift = scrollVelocity * s.speed * 0.15;

      ctx.beginPath();
      ctx.arc(s.x, s.y + drift, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 244, 253, ${clamp(s.alpha, 0, 1)})`;
      ctx.fill();
    });

    animFrameId = requestAnimationFrame(render);
  }

  /** Public init */
  function init() {
    if (!canvas || !ctx || prefersReducedMotion()) {
      if (canvas) canvas.style.display = "none";
      return;
    }
    resize();
    generateStars(200);
    render();

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        generateStars(200);
      }, 150);
    });
  }

  return { init };
})();

const Nav = (function () {
  const navbar = document.getElementById("navbar");

  function handleScroll() {
    if (!navbar) return;
    if (window.scrollY > 60) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  }

  function init() {
    if (!navbar) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // run once on load
  }

  return { init };
})();

const Animations = (function () {

  function waitForGSAP(callback, attempts) {
    attempts = attempts || 0;
    if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
      callback();
    } else if (attempts < 60) {
      setTimeout(function () { waitForGSAP(callback, attempts + 1); }, 50);
    } else {
      console.warn("GSAP / ScrollTrigger did not load. Falling back to CSS reveals.");
      // Graceful fallback: make all hidden elements visible
      document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right").forEach(el => {
        el.style.opacity    = "1";
        el.style.transform  = "none";
        el.style.transition = "none";
      });
    }
  }

  function setup() {
    if (prefersReducedMotion()) {
      // Skip all animations — CSS handles reduced motion
      document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right").forEach(el => {
        el.style.opacity   = "1";
        el.style.transform = "none";
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /* ── Reveal: elements that fade + slide up ── */
    document.querySelectorAll(".reveal-up").forEach(function (el) {
      const delay = parseFloat(el.dataset.delay) || 0;
      gsap.to(el, {
        opacity:   1,
        y:         0,
        duration:  0.85,
        delay:     delay,
        ease:      "power3.out",
        scrollTrigger: {
          trigger: el,
          start:   "top 88%",
          once:    true,
        }
      });
    });

    /* ── Reveal: elements that slide in from left ── */
    document.querySelectorAll(".reveal-left").forEach(function (el) {
      const delay = parseFloat(el.dataset.delay) || 0;
      gsap.to(el, {
        opacity:  1,
        x:        0,
        duration: 0.85,
        delay:    delay,
        ease:     "power3.out",
        scrollTrigger: {
          trigger: el,
          start:   "top 88%",
          once:    true,
        }
      });
    });

    /* ── Reveal: elements that slide in from right ── */
    document.querySelectorAll(".reveal-right").forEach(function (el) {
      const delay = parseFloat(el.dataset.delay) || 0;
      gsap.to(el, {
        opacity:  1,
        x:        0,
        duration: 0.85,
        delay:    delay,
        ease:     "power3.out",
        scrollTrigger: {
          trigger: el,
          start:   "top 88%",
          once:    true,
        }
      });
    });

    /* ── Hero title character stagger ── */
    const heroTitle = document.querySelector(".hero-title");
    if (heroTitle) {
      gsap.from(heroTitle, {
        opacity:   0,
        y:         60,
        duration:  5,
        ease:      "expo.out",
        delay:     0.3,
      });
    }

    /* ── Feature cards stagger on scroll ── */
    const featureCards = document.querySelectorAll(".feature-card");
    if (featureCards.length) {
      gsap.from(featureCards, {
        opacity:  0,
        y:        50,
        duration: 0.7,
        stagger:  0.1,
        ease:     "power2.out",
        scrollTrigger: {
          trigger: "#features",
          start:   "top 75%",
          once:    true,
        }
      });
    }
  }

  function init() {
    waitForGSAP(setup);
  }

  return { init };
})();

const Parallax = (function () {
  const layers = [];
  let  ticking = false;

  /** Collect all parallax layers and their speed multipliers */
  function collectLayers() {
    document.querySelectorAll(".parallax-layer[data-speed]").forEach(function (el) {
      layers.push({
        el:    el,
        speed: parseFloat(el.dataset.speed) || 0,
        currentY: 0,
      });
    });
  }

  /** Apply transforms on scroll */
  function update() {
    const scrollY = window.scrollY;

    layers.forEach(function (layer) {
      // Find which section this layer belongs to
      const parent  = layer.el.closest(".section");
      if (!parent) return;

      const rect    = parent.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2 - window.innerHeight / 2;

      // Target parallax offset relative to section centre
      const targetY = centerY * layer.speed;

      // Smooth it with lerp to avoid sharp jumps
      layer.currentY = lerp(layer.currentY, targetY, 0.08);

      layer.el.style.transform = "translateY(" + layer.currentY.toFixed(2) + "px)";
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  function init() {
    if (prefersReducedMotion()) return;
    collectLayers();
    window.addEventListener("scroll", onScroll, { passive: true });
    update(); // initial position
  }

  return { init };
})();

const Counters = (function () {
  let triggered = false;

  function animateCount(el) {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1800; // ms
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = clamp(elapsed / duration, 0, 1);
      // Ease-out quad
      const eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }

    requestAnimationFrame(step);
  }

  function onScroll() {
    if (triggered) return;

    const launchSection = document.getElementById("launch");
    if (!launchSection) return;

    const rect = launchSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.75) {
      triggered = true;
      document.querySelectorAll(".stat-number[data-count]").forEach(animateCount);
      window.removeEventListener("scroll", onScroll);
    }
  }

  function init() {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); 
  }

  return { init };
})();

const TechBars = (function () {
  let triggered = false;

  function onScroll() {
    if (triggered) return;

    const techSection = document.getElementById("tech");
    if (!techSection) return;

    const rect = techSection.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.80) {
      triggered = true;

      document.querySelectorAll(".tech-fill[data-width]").forEach(function (bar, i) {
        const targetWidth = bar.dataset.width + "%";
        // Stagger each bar slightly
        setTimeout(function () {
          bar.style.width = targetWidth;
        }, i * 80);
      });

      window.removeEventListener("scroll", onScroll);
    }
  }

  function init() {
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // check immediately
  }

  return { init };
})();

const MobileNav = (function () {
  const toggle = document.getElementById("navToggle");
  const links  = document.querySelector(".nav-links");

  function init() {
    if (!toggle || !links) return;

    toggle.addEventListener("click", function () {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen);
      // Animate the three bars into an X
      const bars = toggle.querySelectorAll("span");
      if (isOpen) {
        bars[0].style.transform = "rotate(45deg) translate(5px, 5px)";
        bars[1].style.opacity   = "0";
        bars[2].style.transform = "rotate(-45deg) translate(5px, -5px)";
      } else {
        bars[0].style.transform = "";
        bars[1].style.opacity   = "";
        bars[2].style.transform = "";
      }
    });

    // Close nav when any link is clicked
    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        const bars = toggle.querySelectorAll("span");
        bars[0].style.transform = "";
        bars[1].style.opacity   = "";
        bars[2].style.transform = "";
      });
    });

    // Close nav when clicking outside
    document.addEventListener("click", function (e) {
      if (links.classList.contains("open") &&
          !links.contains(e.target) &&
          !toggle.contains(e.target)) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        const bars = toggle.querySelectorAll("span");
        bars[0].style.transform = "";
        bars[1].style.opacity   = "";
        bars[2].style.transform = "";
      }
    });
  }

  return { init };
})();

const MouseParallax = (function () {
  const hero = document.getElementById("hero");

  function onMouseMove(e) {
    if (!hero || prefersReducedMotion()) return;

    const cx   = window.innerWidth  / 2;
    const cy   = window.innerHeight / 2;
    const dx   = (e.clientX - cx) / cx;   // -1 to 1
    const dy   = (e.clientY - cy) / cy;   // -1 to 1

    const orbs = hero.querySelectorAll(".orb");
    orbs.forEach(function (orb, i) {
      const factor = (i + 1) * 10;
      orb.style.transform =
        "translate(" + (dx * factor) + "px, " + (dy * factor) + "px)";
    });
  }

  function init() {
    document.addEventListener("mousemove", onMouseMove, { passive: true });
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", function () {
  StarField.init();
  Nav.init();
  Parallax.init();
  Animations.init();
  Counters.init();
  TechBars.init();
  MobileNav.init();
  MouseParallax.init();
});
