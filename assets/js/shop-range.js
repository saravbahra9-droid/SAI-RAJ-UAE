/* Sai Raj — the full range inside the shop.
   The 12 priced products live in catalog.js and check out through Shopify. Everything else comes from the product
   catalogue (window.SR_PARTS, assets/js/parts-data.js) and is "price on request": it goes into the enquiry list that
   the parts finder also uses (localStorage "sr-parts-list"), and is sent from /parts/#/list.

   Routes added to the shop:  #/cat/<category>   #/item/<product key>

   Odoo, for later: each product can carry its own sairaj.com link. Put { "<product key>": "<url>" } in window.SR_ODOO_LINKS
   (or run an import that writes it) and the product page uses that link instead of the part-number search. */
(function () {
  "use strict";
  var D = window.SR_PARTS, SR = window.SR;
  if (!D || !SR) return;
  var KEY = "sr-parts-list", PAGE = 60;
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var slug = function (t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
  var plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };
  var ARR = '<svg class="arr" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M0 5h14M10 1l4 4-4 4"/></svg>';
  var I_ADD = '<svg class="i-add" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg>' +
              '<svg class="i-in" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.5-8"/></svg>';
  var HAS_IMG = { "bull-bars": 1, "steps-bars": 1, racks: 1, canopies: 1, suspension: 1, wheels: 1, recovery: 1, lighting: 1, camping: 1, care: 1 };

  /* ── index: one entry per distinct product (description + part number), with the vehicles it fits ── */
  var CATS = D.sc.map(function (c) { return { k: c[0], t: c[1], names: c[2], items: [] }; }), catOf = {}, catBy = {};
  CATS.forEach(function (c) { catBy[c.k] = c; c.names.forEach(function (n) { catOf[n] = c; }); });
  var vById = {}, items = [], byKey = {}, seen = {}, used = {};
  D.v.forEach(function (v) {
    vById[v.id] = v;
    v.c.forEach(function (c) {
      c[1].forEach(function (r) {
        var id = r[0] + "|" + r[1], it = seen[id];
        if (!it) {
          var k = slug(r[1] || r[0]) || "item", n = 2, base = k;
          while (used[k]) k = base + "-" + n++;
          used[k] = 1;
          it = seen[id] = byKey[k] = { k: k, d: r[0], p: r[1], u: r[2], cat: catOf[c[0]], sub: c[0], fits: [] };
          items.push(it); it.cat.items.push(it);
        }
        if (v.id !== "general" && it.fits.indexOf(v.id) < 0) it.fits.push(v.id);
      });
    });
  });
  var vName = function (id) { var v = vById[id]; return v.mk + " " + v.md + " (" + v.va.join(" · ") + ")"; };

  /* ── the enquiry list, shared with the parts finder ── */
  function getList() { try { var l = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function setList(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  function listKey(it) { return (it.fits.length === 1 ? it.fits[0] : it.fits.length ? "range" : "general") + "|" + it.d + "|" + it.p; }
  function inList(it, l) { l = l || getList(); var k = listKey(it); return l.some(function (x) { return x.k === k; }); }
  function toggle(it) {
    var l = getList(), k = listKey(it), i = -1;
    l.forEach(function (x, n) { if (x.k === k) i = n; });
    if (i > -1) l.splice(i, 1); else l.push({ k: k, v: k.split("|")[0], d: it.d, p: it.p, u: it.u, q: 1 });
    setList(l); refresh();
    return i < 0;
  }
  function refresh() {
    var l = getList();
    [].forEach.call(document.querySelectorAll("[data-rr]"), function (b) {
      var it = byKey[b.getAttribute("data-rr")], on = it && inList(it, l);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      var t = b.querySelector("[data-t]"); if (t) t.textContent = on ? "In your enquiry list" : "Add to enquiry list";
    });
    if (window.SRShop) window.SRShop.renderCart();
  }

  /* ── pieces ── */
  function rowHTML(it) {
    return '<li class="rr"><a class="rr__d" href="#/item/' + it.k + '">' + esc(it.d) + '<small>' + esc(it.sub) + (it.fits.length ? " · fits " + plural(it.fits.length, "vehicle") : "") + '</small></a>' +
      '<span class="rr__p">' + (it.p ? esc(it.p) : "<em>Part no. on request</em>") + '</span><span class="rr__price">Price on request</span>' +
      '<button type="button" class="rr__add" data-rr="' + it.k + '" aria-pressed="false" aria-label="Add to enquiry list: ' + esc(it.d) + '">' + I_ADD + "</button></li>";
  }
  function tileHTML(c) {
    return '<a class="rtile' + (HAS_IMG[c.k] ? "" : " rtile--plain") + '" href="#/cat/' + c.k + '">' +
      (HAS_IMG[c.k] ? '<span class="rtile__im"><img src="/assets/img/shop/cat-' + c.k + '.webp" alt="" loading="lazy" decoding="async"></span>' : '<span class="rtile__im"><span>Sai Raj</span></span>') +
      '<span class="rtile__b"><b>' + esc(c.t) + "</b><i>" + plural(c.items.length, "product") + ARR + "</i></span></a>";
  }
  function landing() {
    var makes = [], n = {};
    D.v.forEach(function (v) { if (v.id !== "general") { if (!n[v.mk]) { n[v.mk] = 0; makes.push(v.mk); } n[v.mk]++; } });
    return '<section class="section rsec"><div class="wrap"><div class="sec-head"><h2>Shop the range</h2><a href="/parts/">Parts finder →</a></div>' +
      '<p class="rsec__lede">' + items.length.toLocaleString("en-US") + ' products from the Sai Raj catalogue. Add what you need to your enquiry list and we will quote it.</p>' +
      '<div class="rtiles">' + CATS.map(tileHTML).join("") + "</div></div></section>" +
      '<section class="section rsec"><div class="wrap"><div class="sec-head"><h2>Shop by vehicle</h2><a href="/parts/">All vehicles →</a></div>' +
      '<div class="rmakes" role="group" aria-label="Filter by make"><button type="button" class="chip active" data-make="">All</button>' +
      makes.map(function (m) { return '<button type="button" class="chip" data-make="' + esc(m) + '">' + esc(m) + "</button>"; }).join("") + "</div>" +
      '<div class="rvehs">' + D.v.filter(function (v) { return v.id !== "general"; }).map(function (v) {
        return '<a class="rveh" data-mk="' + esc(v.mk) + '" href="/parts/#/v/' + v.id + '"><span class="rveh__im"><img src="/assets/img/shop/veh/' + v.id + '.webp" alt="" loading="lazy" decoding="async" width="309" height="230"></span>' +
          "<b>" + esc(v.mk + " " + v.md) + "</b><small>" + esc(v.va.join(" · ")) + "</small></a>";
      }).join("") + "</div></div></section>";
  }
  function searchHTML(term) {
    var t = term.toLowerCase().trim(), tn = t.replace(/[\s\-\/.]/g, "");
    if (t.length < 2) return "";
    var hits = items.filter(function (it) { var p = it.p.toLowerCase(); return it.d.toLowerCase().indexOf(t) > -1 || p.indexOf(t) > -1 || (tn.length > 2 && p.replace(/[\s\-\/.]/g, "").indexOf(tn) > -1); });
    if (!hits.length) return "";
    return '<div class="rhits"><div class="sec-head"><h2>From the range</h2><span>' + plural(hits.length, "product") + (hits.length > 24 ? ", first 24 shown" : "") + '</span></div><ul class="rrs">' +
      hits.slice(0, 24).map(rowHTML).join("") + "</ul></div>";
  }

  /* ── pages ── */
  function pageCat(app, k) {
    var c = catBy[k]; if (!c) { location.hash = "#/shop"; return; }
    document.title = c.t + " — Shop — Sai Raj";
    var sub = "", term = "", shown = PAGE, subs = {};
    c.items.forEach(function (it) { subs[it.sub] = (subs[it.sub] || 0) + 1; });
    var priced = SR.PRODUCTS.filter(function (p) { return (SR.SHOP_CAT_OF || {})[p.id] === k; });
    app.innerHTML = '<div class="wrap shophead rhead' + (HAS_IMG[k] ? " rhead--im" : "") + '"><div><p class="crumb"><a href="/">Home</a> / <a href="#/shop">Shop</a> / ' + esc(c.t) + '</p><p class="eyebrow">The Sai Raj range</p><h1>' + esc(c.t) +
      '</h1><p class="sub">' + plural(c.items.length, "product") + ". Prices on request: add what you need to your enquiry list and we will quote it.</p></div>" +
      (HAS_IMG[k] ? '<div class="rhead__im"><img src="/assets/img/shop/cat-' + k + '.webp" alt=""></div>' : "") + "</div>" +
      '<section class="section" style="padding-top:36px"><div class="wrap">' +
      (priced.length ? '<div class="sec-head"><h2>Buy online</h2></div><div class="grid" id="catGrid" style="margin-bottom:48px">' + priced.map(window.SRShop.cardHTML).join("") + '</div><div class="sec-head"><h2>On request</h2></div>' : "") +
      '<div class="toolbar"><div class="search"><input type="search" id="rq" placeholder="Search this category…" aria-label="Search this category"><span class="ic"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg></span></div><span class="count" id="rcount"></span></div>' +
      '<div class="chips" id="rsubs"></div><ul class="rrs" id="rlist"></ul><div class="rmore"><button type="button" class="sbtn ghost" id="rmoreBtn">Show more</button></div></div></section>';
    var listEl = document.getElementById("rlist"), q = document.getElementById("rq"), more = document.getElementById("rmoreBtn"), chips = document.getElementById("rsubs");
    function draw() {
      var t = term.toLowerCase(), tn = t.replace(/[\s\-\/.]/g, "");
      var l = c.items.filter(function (it) { return (!sub || it.sub === sub) && (!t || it.d.toLowerCase().indexOf(t) > -1 || it.p.toLowerCase().indexOf(t) > -1 || (tn.length > 2 && it.p.toLowerCase().replace(/[\s\-\/.]/g, "").indexOf(tn) > -1)); });
      listEl.innerHTML = l.length ? l.slice(0, shown).map(rowHTML).join("") : '<li class="rr rr--none">Nothing matches. Try fewer characters, or <a href="' + SR.WA + '">WhatsApp us</a> and we will find it.</li>';
      document.getElementById("rcount").textContent = plural(l.length, "product");
      more.parentNode.style.display = l.length > shown ? "" : "none";
      more.textContent = "Show more (" + (l.length - shown) + " left)";
      chips.innerHTML = Object.keys(subs).length > 1 ? '<button class="chip' + (sub ? "" : " active") + '" data-sub="">All</button>' +
        Object.keys(subs).map(function (s) { return '<button class="chip' + (s === sub ? " active" : "") + '" data-sub="' + esc(s) + '">' + esc(s.charAt(0) + s.slice(1).toLowerCase()) + " · " + subs[s] + "</button>"; }).join("") : "";
      refresh();
    }
    q.addEventListener("input", function () { term = q.value.trim(); shown = PAGE; draw(); });
    chips.addEventListener("click", function (e) { var b = e.target.closest(".chip"); if (!b) return; sub = b.getAttribute("data-sub"); shown = PAGE; draw(); });
    more.addEventListener("click", function () { shown += PAGE * 2; draw(); });
    draw();
  }
  function odooLink(it) {
    var o = SR.ODOO || {}, own = (window.SR_ODOO_LINKS || {})[it.k];
    if (own) return own;
    return o.base && it.p ? o.base + o.search + encodeURIComponent(it.p) : "";
  }
  function pageItem(app, k) {
    var it = byKey[k]; if (!it) { location.hash = "#/shop"; return; }
    document.title = it.d + " — Shop — Sai Raj";
    var c = it.cat, link = odooLink(it), ask = SR.WA + "?text=" + encodeURIComponent("Hello Sai Raj, I'd like a price for: " + it.d + (it.p ? " [" + it.p + "]" : ""));
    app.innerHTML = '<section class="section" style="padding-top:40px"><div class="wrap"><p class="crumb"><a href="/">Home</a> / <a href="#/shop">Shop</a> / <a href="#/cat/' + c.k + '">' + esc(c.t) + "</a> / " + esc(it.d) + "</p>" +
      '<div class="ritem"><div class="ritem__im' + (HAS_IMG[c.k] ? "" : " ritem__im--plain") + '">' + (HAS_IMG[c.k] ? '<img src="/assets/img/shop/cat-' + c.k + '.webp" alt=""><span>Range photo: ' + esc(c.t.toLowerCase()) + "</span>" : "<b>Sai Raj</b>") + "</div>" +
      '<div class="ritem__b"><span class="cat">' + esc(it.sub) + "</span><h1>" + esc(it.d) + '</h1><dl class="ritem__dl"><div><dt>Part number</dt><dd>' + (it.p ? esc(it.p) : "On request") + "</dd></div>" +
      (it.u ? "<div><dt>Sold by</dt><dd>" + esc(it.u.charAt(0) + it.u.slice(1).toLowerCase()) + "</dd></div>" : "") + "<div><dt>Price</dt><dd>On request</dd></div></dl>" +
      '<div class="ritem__cta"><button type="button" class="sbtn red" data-rr="' + it.k + '" aria-pressed="false"><span data-t>Add to enquiry list</span></button><a class="sbtn ghost" href="' + ask + '" target="_blank" rel="noopener">Ask on WhatsApp</a></div>' +
      (link ? '<p class="ritem__odoo"><a href="' + esc(link) + '" target="_blank" rel="noopener" data-odoo>Find this on sairaj.com, our Kenya shop ' + "→</a></p>" : "") +
      (it.fits.length ? '<h2 class="ritem__h">Fits ' + plural(it.fits.length, "vehicle") + '</h2><ul class="ritem__fits">' + it.fits.map(function (id) { return '<li><a href="/parts/#/v/' + id + '">' + esc(vName(id)) + "</a></li>"; }).join("") + "</ul>"
        : '<h2 class="ritem__h">Fitment</h2><p class="ritem__gen">Listed for all vehicles in the catalogue. Tell us your vehicle and we will confirm it fits.</p>') +
      "</div></div></div></section>";
    refresh();
  }
  function cartBlock() {
    var l = getList(); if (!l.length) return "";
    return '<div class="creq"><p class="creq__h">Price on request <span>' + l.length + "</span></p><ul>" + l.map(function (x, i) {
      return "<li><span>" + esc(x.d) + (x.p ? "<small>" + esc(x.p) + "</small>" : "") + '</span><button type="button" data-rr-rm="' + i + '" aria-label="Remove ' + esc(x.d) + '">✕</button></li>'; }).join("") +
      '</ul><a class="sbtn ghost creq__go" href="/parts/#/list">Review and send enquiry →</a></div>';
  }

  /* ── clicks ── */
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-rr]"), rm = e.target.closest("[data-rr-rm]"), mk = e.target.closest("[data-make]");
    if (add) { e.preventDefault(); toggle(byKey[add.getAttribute("data-rr")]); }
    else if (rm) { var l = getList(); l.splice(+rm.getAttribute("data-rr-rm"), 1); setList(l); refresh(); }
    else if (mk) {
      var m = mk.getAttribute("data-make");
      [].forEach.call(mk.parentNode.children, function (b) { b.classList.toggle("active", b === mk); });
      [].forEach.call(document.querySelectorAll(".rveh"), function (a) { a.hidden = !!m && a.getAttribute("data-mk") !== m; });
    }
  });

  window.SRR = { cats: CATS, items: items, byKey: byKey, landing: landing, searchHTML: searchHTML, pageCat: pageCat, pageItem: pageItem, cartBlock: cartBlock, refresh: refresh, getList: getList, odooLink: odooLink };
})();
