/* ════════════════════════════════════════════════════════════
   SAI RAJ — site.js  (shared by every page)
   Navigation, phone menu, scroll reveals, small utilities.
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SR = (window.SRSite = { rm: RM, lenis: null });

  /* ── Footer year ── */
  doc.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ── Nav: solid once the page has moved ── */
  var nav = doc.getElementById("nav");
  var wa = doc.getElementById("wa");
  var waAlways = wa && !wa.classList.contains("is-hidden");
  var themed = [].slice.call(doc.querySelectorAll("[data-nav-theme]"));
  var waOff = [].slice.call(doc.querySelectorAll("[data-wa-off]"));
  function onScrollNav() {
    var y = window.scrollY || root.scrollTop || 0;
    if (nav && !nav.classList.contains("nav--static")) {
      nav.classList.toggle("is-solid", y > 24);
      /* the bar takes the tone of whichever section sits under it */
      var mid = nav.offsetHeight * 0.6, light = false;
      for (var i = 0; i < themed.length; i++) {
        var r = themed[i].getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) light = themed[i].getAttribute("data-nav-theme") === "light";
      }
      nav.classList.toggle("nav--light", light);
    }
    if (wa && !waAlways) {
      var vh = window.innerHeight, hide = y < vh * 0.6;
      for (var j = 0; j < waOff.length && !hide; j++) {
        var q = waOff[j].getBoundingClientRect();
        if (q.top < vh * 0.5 && q.bottom > vh * 0.92) hide = true;   /* a pinned scene owns the bottom of the screen */
      }
      wa.classList.toggle("is-hidden", hide);
    }
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ── Phone / tablet menu ── */
  var burger = doc.getElementById("burger");
  var menu = doc.getElementById("menu");
  var main = doc.getElementById("main");
  function setMenu(open) {
    if (!menu || !burger) return;
    if (open === root.classList.contains("menu-open")) return;
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (main) { if (open) main.setAttribute("inert", ""); else main.removeAttribute("inert"); }
    if (SR.lenis) { if (open) SR.lenis.stop(); else SR.lenis.start(); }
    if (open) menu.scrollTop = 0;
    doc.dispatchEvent(new CustomEvent("sr:menu", { detail: { open: open } }));
  }
  SR.setMenu = setMenu;
  if (burger && menu) {
    burger.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("menu-open")) { setMenu(false); burger.focus(); }
    });
    /* leaving phone width with the menu open must not strand the page locked */
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && root.classList.contains("menu-open")) setMenu(false);
    });
  }

  /* ── In-page anchors: one scroll path for nav, menu, buttons ── */
  SR.scrollTo = function (target, instant) {
    var el = typeof target === "string" ? doc.querySelector(target) : target;
    if (!el) return;
    var y = el.getBoundingClientRect().top + (window.scrollY || 0);
    if (!el.hasAttribute("data-pin")) y -= 0; /* sections are full-bleed; the nav floats over them */
    if (SR.lenis && !instant) SR.lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: RM || instant ? "auto" : "smooth" });
  };
  doc.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"], a[href^="/#"]');
    if (!a) return;
    var href = a.getAttribute("href");
    var hash = href.slice(href.indexOf("#"));
    if (href.charAt(0) === "/" && location.pathname !== "/" && location.pathname !== "/index.html") return; /* other page → normal nav */
    if (hash.length < 2) return;
    var el = doc.getElementById(hash.slice(1));
    if (!el) return;
    e.preventDefault();
    setMenu(false);
    /* let the menu unlock the page before measuring */
    requestAnimationFrame(function () {
      SR.scrollTo(el);
      try { history.replaceState(null, "", hash); } catch (err) {}
      doc.dispatchEvent(new CustomEvent("sr:anchor", { detail: { link: a, target: el } }));
    });
  });

  /* ── Scroll reveals ── */
  var reveals = doc.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    if (RM || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }
})();
