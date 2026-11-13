/* ════════════════════════════════════════════════════════════
   SAI RAJ — home.js
   Preloader · smooth scroll · hero (flat frames, then lazy 3D) ·
   statement · story map · capabilities · product rail · enquiry.
   No framework. Scroll scenes are plain position:sticky sections
   whose progress is read each frame, which is what keeps them
   steady on iPhone and iPad Safari.
   ════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement, S = window.SRSite || {}, RM = !!S.rm;
  var q = new URLSearchParams(location.search);
  var $ = function (id) { return doc.getElementById(id); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ── Smooth wheel scrolling: desktop pointers only. Touch keeps native momentum. ── */
  var lenis = null;
  var finePointer = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
  if (!RM && finePointer && window.Lenis) {
    try { lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 }); S.lenis = lenis; } catch (e) { lenis = null; }
  }

  /* ════════ HERO ════════ */
  var hero = $("top"), heroSticky = hero.querySelector(".hero__sticky"), heroBar = $("heroBar");
  var heroCanvas = $("heroCanvas"), heroFocus = $("heroFocus"), heroPins = [].slice.call($("heroPins").children);
  var posters = [].slice.call(hero.querySelectorAll(".hero__posters .p"));
  var hero3d = null, heroP = 0, postersLoaded = false, menuOpen = false;

  function loadPosters() {
    if (postersLoaded) return; postersLoaded = true;
    posters.forEach(function (im) { var d = im.getAttribute("data-src"); if (d) { im.src = d; im.removeAttribute("data-src"); } });
  }
  function heroUpdate() {
    var r = hero.getBoundingClientRect();
    var total = r.height - heroSticky.offsetHeight;
    heroP = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    var beat = heroP < 0.13 ? "a" : heroP < 0.5 ? "b" : "c";
    if (hero.getAttribute("data-beat") !== beat) hero.setAttribute("data-beat", beat);
    heroBar.style.transform = "scaleX(" + heroP.toFixed(4) + ")";
    hero.classList.toggle("is-scrolled", heroP > 0.02);
    if (hero3d) hero3d.setProgress(heroP);
    else if (heroP > 0.01) loadPosters();
  }

  function webglOK() {
    try { var c = doc.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
    catch (e) { return false; }
  }
  function load3d() {
    if (RM || q.get("flat") === "1" || !webglOK()) { loadPosters(); return; }
    if (navigator.connection && navigator.connection.saveData) { loadPosters(); return; }
    var go = function () {
      import("/assets/js/hero3d.js?v=2").then(function (m) {
        var ctl = m.init({
          canvas: heroCanvas, focus: heroFocus, pins: heroPins,
          onReady: function () { hero.classList.add("is-3d"); },
          onFail: function () { hero.classList.remove("is-3d"); hero3d = null; loadPosters(); }
        });
        if (!ctl) { loadPosters(); return; }
        hero3d = ctl; ctl.setProgress(heroP); ctl.start();
        if ("ResizeObserver" in window) {
          var w0 = 0, h0 = 0;
          new ResizeObserver(function () {
            var w = heroCanvas.clientWidth, h = heroCanvas.clientHeight;
            if (w !== w0 || h !== h0) { w0 = w; h0 = h; if (hero3d) hero3d.resize(); }
          }).observe(heroCanvas);
          new ResizeObserver(function () { if (hero3d) hero3d.resize(); }).observe(heroFocus);
        } else window.addEventListener("resize", function () { if (hero3d) hero3d.resize(); });
      }).catch(function () { loadPosters(); });
    };
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 900 }); else setTimeout(go, 250);
  }

  /* ════════ PRELOADER ════════ */
  /* the 3D arrives after the curtain has lifted, so compiling it never competes with the intro */
  function heroReady(delay) { hero.classList.add("is-ready"); setTimeout(load3d, delay || 0); }
  (function preloader() {
    var pre = $("pre");
    if (!pre || !root.classList.contains("pre-on")) { requestAnimationFrame(function () { heroReady(0); }); return; }
    var yEl = $("preYear"), bar = $("preBar"), y0 = 1975, y1 = new Date().getFullYear();
    $("preNow").textContent = y1;
    var t0 = performance.now(), dur = 1150, done = false;
    function lift() {
      if (done) return; done = true;
      try { sessionStorage.setItem("sr-pre", "1"); } catch (e) {}
      root.classList.remove("pre-lock");
      pre.classList.add("is-done");
      heroReady(1250);
      setTimeout(function () { pre.classList.add("is-gone"); root.classList.remove("pre-on"); }, 1100);
    }
    function tick(now) {
      var t = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - t, 3);
      yEl.textContent = Math.round(y0 + (y1 - y0) * e);
      bar.style.transform = "scaleX(" + e + ")";
      if (t < 1) requestAnimationFrame(tick);
      else {
        var fonts = doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve();
        Promise.race([fonts, new Promise(function (r) { setTimeout(r, 450); })]).then(function () { setTimeout(lift, 120); });
      }
    }
    requestAnimationFrame(tick);
    setTimeout(lift, 3500); /* never hold the page hostage */
  })();

  /* ════════ STATEMENT — words light as they pass ════════ */
  var stEl = $("statementText"), stWords = [], stLit = -1;
  if (stEl && !RM) {
    var words = stEl.textContent.trim().split(/\s+/);
    stEl.setAttribute("aria-label", stEl.textContent.trim());
    stEl.innerHTML = words.map(function (w) { return '<span class="w" aria-hidden="true">' + w + "</span>"; }).join(" ");
    stWords = [].slice.call(stEl.children);
  }
  function statementUpdate(vh) {
    if (!stWords.length) return;
    var r = stEl.getBoundingClientRect();
    var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.34), 0, 1);
    var n = Math.round(p * stWords.length);
    if (n === stLit) return; stLit = n;
    for (var i = 0; i < stWords.length; i++) stWords[i].classList.toggle("on", i < n);
  }

  /* ════════ STORY ════════ */
  var story = $("story"), storySticky = story.querySelector(".story__sticky");
  var chapters = [].slice.call(story.querySelectorAll(".chapter"));
  var rail = [].slice.call(story.querySelectorAll(".story__rail button"));
  var storyNum = $("storyNum"), storyYear = $("storyYear"), pinNbo = $("pinNbo"), pinDxb = $("pinDxb");
  var NCH = chapters.length, storyS = 0, storyIdx = -1, storyVisible = false;
  var YEAR_TXT = { 0: "1975", 3: "10+" };

  function storyUpdate() {
    if (RM) return;
    var r = story.getBoundingClientRect();
    var total = r.height - storySticky.offsetHeight;
    var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    storyS = Math.min(p * NCH, NCH - 0.0001);
    var idx = Math.floor(storyS);
    for (var i = 0; i < rail.length; i++) rail[i].firstElementChild.style.setProperty("--f", clamp(storyS - i, 0, 1).toFixed(3));
    if (idx === storyIdx) return;
    storyIdx = idx;
    story.setAttribute("data-ch", idx);
    chapters.forEach(function (c, i) { c.classList.toggle("is-active", i === idx); });
    rail.forEach(function (b, i) { b.classList.toggle("is-on", i === idx); b.setAttribute("aria-current", i === idx ? "step" : "false"); });
    storyNum.textContent = "0" + (idx + 1);
    if (YEAR_TXT[idx]) storyYear.textContent = YEAR_TXT[idx];
  }
  rail.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = +b.getAttribute("data-go");
      var r = story.getBoundingClientRect(), total = r.height - storySticky.offsetHeight;
      var y = r.top + (window.scrollY || 0) + total * ((i + 0.4) / NCH);
      if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: "smooth" });
    });
  });
  if (RM) chapters.forEach(function (c) { c.classList.add("is-active"); });

  /* ── the dot map ── */
  var MAP = window.SR_MAP, cv = $("storyMap"), ctx = cv && cv.getContext ? cv.getContext("2d") : null;
  var cw = 0, chh = 0, mapDpr = 1, cam = null, mapRaf = 0, mapLast = 0, navH = 72;
  var NBO = MAP ? { x: MAP.nairobi[0], y: MAP.nairobi[1] } : null, DXB = MAP ? { x: MAP.dubai[0], y: MAP.dubai[1] } : null;
  var KF = MAP ? [
    { cx: NBO.x - 26, cy: NBO.y - 14, fw: 430, fh: 430 },
    { cx: NBO.x - 26, cy: NBO.y - 14, fw: 370, fh: 370 },
    { cx: NBO.x - 26, cy: NBO.y - 14, fw: 370, fh: 370 },
    { cx: 392, cy: 505, fw: 840, fh: 1010 },
    { cx: (NBO.x + DXB.x) / 2 + 6, cy: (NBO.y + DXB.y) / 2 + 4, fw: 430, fh: 600 }
  ] : [];
  var KF_STATIC = { cx: 420, cy: 470, fw: 880, fh: 1010 };
  if (MAP) MAP.dots.forEach(function (d) { d[3] = Math.hypot(d[0] - NBO.x, d[1] - NBO.y); });

  function mapSize() {
    if (!ctx) return;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    mapDpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === cw && h === chh && cv.width === Math.round(w * mapDpr)) return;
    cw = w; chh = h; cv.width = Math.round(w * mapDpr); cv.height = Math.round(h * mapDpr);
    var nv = $("nav"); navH = nv ? nv.offsetHeight : 72;
  }
  function mapTarget(s) {
    var i = Math.min(NCH - 1, Math.floor(s)), t = s - i, a = KF[i], b = KF[Math.min(NCH - 1, i + 1)], k = smooth(0.6, 1, t);
    return { cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), fw: lerp(a.fw, b.fw, k), fh: lerp(a.fh, b.fh, k) };
  }
  function mapDraw(time, s, isStatic) {
    if (!ctx || !cw) return;
    var tg = isStatic ? KF_STATIC : mapTarget(s);
    if (!cam || isStatic) cam = { cx: tg.cx, cy: tg.cy, fw: tg.fw, fh: tg.fh };
    else {
      var dt = mapLast ? Math.min(100, time - mapLast) : 16.7, k = 1 - Math.exp(-dt / 170);
      cam.cx += (tg.cx - cam.cx) * k; cam.cy += (tg.cy - cam.cy) * k; cam.fw += (tg.fw - cam.fw) * k; cam.fh += (tg.fh - cam.fh) * k;
    }
    mapLast = time;
    var inset = RM ? 0 : navH;                         /* the nav bar floats over the top of the panel */
    var sc = Math.min(cw / cam.fw, (chh - inset) / cam.fh), ox = cw / 2 - cam.cx * sc, oy = inset + (chh - inset) * 0.5 - cam.cy * sc;
    var X = function (x) { return ox + x * sc; }, Y = function (y) { return oy + y * sc; };
    ctx.setTransform(mapDpr, 0, 0, mapDpr, 0, 0);
    ctx.clearRect(0, 0, cw, chh);

    var rad = Math.max(1.1, 15.5 * sc * 0.245), pad = rad * 3;
    var wave = isStatic ? 0 : smooth(2.86, 3.12, s) * (1 - smooth(3.9, 4.06, s));
    var gulf = isStatic ? 1 : smooth(4.5, 4.86, s);
    var arc = isStatic ? 1 : smooth(4.03, 4.52, s);
    var ph = (time * 0.00021) % 1, dots = MAP.dots, i, d, x, y;

    /* base land */
    var cols = ["rgba(119,105,80,.20)", "rgba(119,105,80,.46)", "rgba(119,105,80,.30)"];
    for (var f = 0; f < 3; f++) {
      ctx.fillStyle = cols[f]; ctx.beginPath();
      for (i = 0; i < dots.length; i++) {
        d = dots[i]; if (d[2] !== f) continue;
        x = X(d[0]); y = Y(d[1]);
        if (x < -pad || y < -pad || x > cw + pad || y > chh + pad) continue;
        ctx.moveTo(x + rad, y); ctx.arc(x, y, rad, 0, 6.2832);
      }
      ctx.fill();
    }
    /* exports: rings travelling out from Nairobi across the continent */
    if (wave > 0.01) {
      for (i = 0; i < dots.length; i++) {
        d = dots[i]; if (d[2] !== 1) continue;
        x = X(d[0]); y = Y(d[1]);
        if (x < -pad || y < -pad || x > cw + pad || y > chh + pad) continue;
        var I = 0;
        for (var k = 0; k < 3; k++) { var R = ((ph + k / 3) % 1) * 820, u = (d[3] - R) / 44; I = Math.max(I, Math.exp(-u * u) * (1 - R / 900)); }
        if (I < 0.06) continue;
        ctx.globalAlpha = Math.min(1, I * 1.25) * wave; ctx.fillStyle = "#C9A227";
        ctx.beginPath(); ctx.arc(x, y, rad * (1 + I * 0.7), 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    /* the Gulf lights up once the route lands */
    if (gulf > 0.01) {
      ctx.globalAlpha = gulf; ctx.fillStyle = "#C9A227"; ctx.beginPath();
      for (i = 0; i < dots.length; i++) {
        d = dots[i]; if (d[2] !== 2) continue;
        x = X(d[0]); y = Y(d[1]); ctx.moveTo(x + rad * 1.15, y); ctx.arc(x, y, rad * 1.15, 0, 6.2832);
      }
      ctx.fill(); ctx.globalAlpha = 1;
    }
    /* Nairobi → Dubai */
    var nx = X(NBO.x), ny = Y(NBO.y), dx = X(DXB.x), dy = Y(DXB.y);
    if (arc > 0.001) {
      var mx = (nx + dx) / 2 + (dy - ny) * -0.28, my = (ny + dy) / 2 + (dx - nx) * 0.28;
      ctx.strokeStyle = "#ED1C24"; ctx.lineWidth = 1.6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(nx, ny);
      var hx = nx, hy = ny, steps = 64, lim = Math.round(steps * arc);
      for (i = 1; i <= lim; i++) {
        var t = i / steps, it = 1 - t;
        hx = it * it * nx + 2 * it * t * mx + t * t * dx; hy = it * it * ny + 2 * it * t * my + t * t * dy;
        ctx.lineTo(hx, hy);
      }
      ctx.stroke();
      if (arc < 1) { ctx.fillStyle = "#ED1C24"; ctx.beginPath(); ctx.arc(hx, hy, 3.4, 0, 6.2832); ctx.fill(); }
    }
    /* pins */
    var pulse = isStatic ? 0.5 : (time * 0.0006) % 1;
    function pin(px, py, a) {
      if (a <= 0.01) return;
      ctx.globalAlpha = a * (1 - pulse) * 0.55; ctx.strokeStyle = "#ED1C24"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(px, py, 6 + pulse * 20, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = a; ctx.fillStyle = "#ED1C24"; ctx.beginPath(); ctx.arc(px, py, 5.2, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#FCFAF4"; ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 1;
    }
    var dxbOn = isStatic ? 1 : smooth(0.92, 1, arc);
    var nboOn = isStatic ? 1 : 1 - smooth(0.82, 1, s) + smooth(2.8, 3, s);   /* steps aside while the two vignettes play */
    pin(nx, ny, nboOn); pin(dx, dy, dxbOn);
    pinNbo.style.transform = "translate3d(" + nx.toFixed(1) + "px," + (ny - 13).toFixed(1) + "px,0)";
    pinDxb.style.transform = "translate3d(" + dx.toFixed(1) + "px," + (dy - 13).toFixed(1) + "px,0)";
    var idx = Math.floor(s);
    pinNbo.classList.toggle("on", isStatic || idx === 0 || idx >= 3);
    pinDxb.classList.toggle("on", isStatic || dxbOn > 0.5);
  }
  function mapLoop(time) {
    mapRaf = 0;
    if (!storyVisible || doc.hidden || menuOpen) return;
    mapSize(); mapDraw(time, storyS, false);
    mapRaf = requestAnimationFrame(mapLoop);
  }
  if (ctx && MAP) {
    if (RM) {
      var drawStatic = function () { mapSize(); mapDraw(0, NCH - 0.001, true); };
      drawStatic(); window.addEventListener("resize", drawStatic);
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        storyVisible = es[0].isIntersecting;
        if (storyVisible && !mapRaf) { mapLast = 0; mapRaf = requestAnimationFrame(mapLoop); }
      }, { rootMargin: "20% 0px" }).observe(story);
      doc.addEventListener("visibilitychange", function () { if (!doc.hidden && storyVisible && !mapRaf) mapRaf = requestAnimationFrame(mapLoop); });
    }
  }

  /* ════════ CAPABILITIES — image pane follows the row ════════ */
  var capsList = $("capsList"), capsFrame = $("capsFrame"), capN = $("capsCapN"), capT = $("capsCapT");
  var SRC = window.SR || null, capsBuilt = false, slides = {};
  var SNOW = '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M32 6v52M9.5 19l45 26M9.5 45l45-26"/><path d="M26 10l6 6 6-6M26 54l6-6 6 6M11 27l8-2-2-8M53 37l-8 2 2 8M11 37l8 2-2 8M53 27l-8-2 2-8"/></svg>';
  function capsBuild() {
    if (capsBuilt || !capsList) return; capsBuilt = true;
    var rows = [].slice.call(capsList.querySelectorAll("a"));
    rows.forEach(function (a, i) {
      var key = a.getAttribute("data-img") || "", title = a.querySelector(".t").textContent;
      var th = a.querySelector(".th");
      if (key && SRC && SRC.PIC[key]) {
        if (th) th.innerHTML = SRC.bim(key, title);
        if (!slides[key]) { capsFrame.insertAdjacentHTML("beforeend", SRC.bim(key, title)); slides[key] = capsFrame.lastElementChild; }
      } else {
        if (th) { th.innerHTML = SNOW; th.style.color = "var(--gold)"; th.style.display = ""; th.classList.add("th--icon"); }
        if (!slides._none) { capsFrame.insertAdjacentHTML("beforeend", '<div class="none">' + SNOW + "</div>"); slides._none = capsFrame.lastElementChild; }
      }
      var show = function () {
        Object.keys(slides).forEach(function (k) { slides[k].classList.toggle("is-on", k === (slides[key] ? key : "_none")); });
        capN.textContent = a.querySelector(".n").textContent; capT.textContent = title;
      };
      a.addEventListener("mouseenter", show); a.addEventListener("focus", show);
      if (i === 0) show();
    });
  }
  if (capsList) {
    if ("IntersectionObserver" in window) {
      var cio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { capsBuild(); cio.disconnect(); } }, { rootMargin: "80% 0px" });
      cio.observe(capsList);
    } else capsBuild();
  }
  /* ════════ PRODUCT RAIL ════════ */
  var railEl = $("rail"), track = $("railTrack"), railBar = $("railBar"), prev = $("railPrev"), next = $("railNext"), railBuilt = false;
  function railBuild() {
    if (railBuilt || !track || !SRC) return; railBuilt = true;
    track.innerHTML = SRC.PRODUCTS.map(function (p) {
      return '<li class="pc"><a href="/shop/#/product/' + p.id + '">' +
        '<div class="pc__im">' + (p.img ? SRC.bim(p.img, p.title) : '<div class="pc__ph"><span>' + p.cat + "</span></div>") + "</div>" +
        '<div><span class="pc__cat">' + p.cat + "</span><h3>" + p.title + '</h3><p class="pc__sub">' + p.sub + "</p></div>" +
        '<div class="pc__row"><span class="pc__price"><small>AED</small>' + SRC.money(p.price) + '</span><span class="pc__go">View</span></div>' +
        "</a></li>";
    }).join("");
    railSync();
  }
  function railSync() {
    if (!railEl) return;
    var max = railEl.scrollWidth - railEl.clientWidth, x = railEl.scrollLeft;
    var frac = railEl.clientWidth / Math.max(1, railEl.scrollWidth), barW = railBar.parentNode.clientWidth;
    railBar.style.width = (frac * 100).toFixed(2) + "%";
    railBar.style.transform = "translateX(" + ((max > 0 ? x / max : 0) * barW * (1 - frac)).toFixed(1) + "px)";
    prev.disabled = x <= 2; next.disabled = x >= max - 2;
  }
  if (railEl) {
    railEl.addEventListener("scroll", function () { requestAnimationFrame(railSync); }, { passive: true });
    var stepBy = function (dir) {
      var card = track.firstElementChild, w = card ? card.getBoundingClientRect().width + 20 : 300;
      railEl.scrollBy({ left: dir * Math.max(w, Math.floor(railEl.clientWidth * 0.8 / w) * w), behavior: RM ? "auto" : "smooth" });
    };
    prev.addEventListener("click", function () { stepBy(-1); });
    next.addEventListener("click", function () { stepBy(1); });
    /* mouse drag (touch already scrolls natively) */
    var drag = null;
    railEl.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse" || e.button !== 0) return; drag = { x: e.clientX, left: railEl.scrollLeft, moved: false }; });
    window.addEventListener("pointermove", function (e) {
      if (!drag) return; var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; railEl.classList.add("is-drag"); }
      if (drag.moved) railEl.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", function () { if (!drag) return; var m = drag.moved; drag = null; if (m) setTimeout(function () { railEl.classList.remove("is-drag"); }, 0); });
    if ("IntersectionObserver" in window) {
      var rio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { railBuild(); rio.disconnect(); } }, { rootMargin: "80% 0px" });
      rio.observe(railEl);
    } else railBuild();
    window.addEventListener("resize", railSync);
  }

  /* nothing animates behind the open menu */
  doc.addEventListener("sr:menu", function (e) {
    var open = e.detail.open;
    if (hero3d) { if (open) hero3d.stop(); else hero3d.start(); }
    menuOpen = open;
    if (!open && storyVisible && !mapRaf && !RM) { mapLast = 0; mapRaf = requestAnimationFrame(mapLoop); }
  });

  /* ════════ One scroll/resize pump ════════ */
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (!RM) { heroUpdate(); storyUpdate(); }
    statementUpdate(vh);
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("orientationchange", request);
  if (lenis) {
    lenis.on("scroll", request);
    var lraf = function (t) { lenis.raf(t); requestAnimationFrame(lraf); };
    requestAnimationFrame(lraf);
  }
  update();

  /* arriving on a deep link (/#enquiry) — settle once layout and fonts are in */
  if (location.hash.length > 1) {
    window.addEventListener("load", function () {
      var el = doc.getElementById(location.hash.slice(1));
      if (el && S.scrollTo) setTimeout(function () { S.scrollTo(el, true); request(); }, 60);
    });
  }
})();
