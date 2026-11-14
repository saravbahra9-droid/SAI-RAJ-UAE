/* Sai Raj — parts finder (/parts/).
   Data: window.SR_PARTS from assets/js/parts-data.js = { v: [ { id, mk, md, va:[…], c:[ [category, [[description, partNo, unit], …], note?], … ] } ] }
   Views are driven by the URL hash, so every view can be linked and the back button works:
     #/            all vehicles            #/m/Toyota     one make
     #/v/<id>      one vehicle             #/q/<words>    search */
(function () {
  "use strict";
  var D = window.SR_PARTS, app = document.getElementById("pfApp");
  if (!D || !app) return;
  var doc = document, root = doc.documentElement, V = D.v, byId = {};
  V.forEach(function (v) { byId[v.id] = v; v.n = v.c.reduce(function (s, c) { return s + c[1].length; }, 0); });
  byId.range = { id: "range", mk: "", md: "From the shop (tell us your vehicle)", va: [], c: [], n: 0 };      // items added in the shop that fit several vehicles
  var $ = function (id) { return doc.getElementById(id); };
  var q = $("pfQ"), bar = $("pfBar"), countEl = $("pfCount"), sheet = $("pfSheet"), listEl = $("pfList"), form = $("pfForm"),
      status = $("pfStatus"), send = $("pfSend"), wa = $("pfWa"), msg = $("pfMessage"), sendHTML = send.innerHTML;
  var WA = "https://wa.me/971543256505", KEY = "sr-parts-list", MAXQ = 300;
  var ARR = '<svg class="arr" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M0 5h14M10 1l4 4-4 4"/></svg>';
  var I_ADD = '<svg class="i-add" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 2v12M2 8h12"/></svg>' +
              '<svg class="i-in" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M2.5 8.5l3.5 3.5 7.500-8"/></svg>';
  var I_X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 2l12 12M14 2 2 14"/></svg>';
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var plain = function (v) { return v.id === "general" || v.id === "range"; };
  var title = function (v) { return plain(v) ? v.md : v.mk + " " + v.md; };
  var full = function (v) { return plain(v) ? v.md : title(v) + " (" + v.va.join(" · ") + ")"; };
  var plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };

  /* ── the list ── */
  var list = [];
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "[]"); if (Array.isArray(saved)) list = saved.filter(function (x) { return x && x.k && x.d && byId[x.v]; }); } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }
  function keyOf(vid, r) { return vid + "|" + r[0] + "|" + r[1]; }
  function indexOf(k) { for (var i = 0; i < list.length; i++) if (list[i].k === k) return i; return -1; }
  function toggle(vid, r) {
    var k = keyOf(vid, r), i = indexOf(k);
    if (i > -1) list.splice(i, 1); else list.push({ k: k, v: vid, d: r[0], p: r[1], u: r[2], q: 1 });
    save(); sync();
  }
  function text(limit) {
    var out = ["Parts enquiry from sairaj.global", ""], groups = {}, order = [], shown = 0;
    list.forEach(function (x) { if (!groups[x.v]) { groups[x.v] = []; order.push(x.v); } groups[x.v].push(x); });
    for (var g = 0; g < order.length; g++) {
      out.push(full(byId[order[g]]));
      for (var i = 0; i < groups[order[g]].length; i++) {
        var x = groups[order[g]][i], line = "- " + x.q + " x " + x.d + (x.p ? " [" + x.p + "]" : " [no part number listed]");
        if (limit && out.join("\n").length + line.length > limit) { out.push("… and " + plural(list.length - shown, "more item") + " (please ask me for the full list)"); return out.join("\n"); }
        out.push(line); shown++;
      }
      out.push("");
    }
    return out.join("\n").trim();
  }
  function sync() {
    var n = list.length;
    bar.hidden = n === 0; root.classList.toggle("pf-has-list", n > 0);
    countEl.innerHTML = plural(n, "item") + '<span class="pf-bar__more"> in your list</span>';
    [].forEach.call(app.querySelectorAll(".pr__add"), function (b) {
      var v = byId[b.getAttribute("data-v")], r = v.c[+b.getAttribute("data-c")][1][+b.getAttribute("data-r")], on = indexOf(keyOf(v.id, r)) > -1;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.querySelector(".sr-only").textContent = (on ? "Remove from your list: " : "Add to your list: ") + r[0];
    });
    wa.href = WA + "?text=" + encodeURIComponent(n ? text(1700) : "Hello, I found you on your website and would like to ask about 4x4 parts.");
    if (!sheet.hidden) drawList();
  }
  function drawList() {
    if (!list.length) { listEl.innerHTML = '<p class="pf-empty">Your list is empty. Tick the parts you need and they will appear here.</p>'; return; }
    var groups = {}, order = [], h = "";
    list.forEach(function (x, i) { if (!groups[x.v]) { groups[x.v] = []; order.push(x.v); } groups[x.v].push([x, i]); });
    order.forEach(function (vid) {
      h += '<div class="pf-list__g"><h3>' + esc(full(byId[vid])) + "</h3><ul>";
      groups[vid].forEach(function (p) {
        var x = p[0], i = p[1];
        h += '<li class="pf-li"><div class="pf-li__d">' + esc(x.d) + "<small>" + (x.p ? esc(x.p) : "Part no. on request") + "</small></div>" +
             '<div class="pf-qty"><button type="button" data-q="-1" data-i="' + i + '" aria-label="One fewer">−</button><output aria-label="Quantity">' + x.q +
             '</output><button type="button" data-q="1" data-i="' + i + '" aria-label="One more">+</button></div>' +
             '<button type="button" class="pf-rm" data-rm="' + i + '" aria-label="Remove ' + esc(x.d) + '">' + I_X + "</button></li>";
      });
      h += "</ul></div>";
    });
    listEl.innerHTML = h;
  }

  /* ── views ── */
  function rowHTML(v, ci, ri, withCat) {
    var r = v.c[ci][1][ri];
    return '<li class="pr"><div class="pr__d">' + (withCat && v.c[ci][0] ? "<small>" + esc(v.c[ci][0]) + "</small>" : "") + esc(r[0]) + '</div><div class="pr__p">' +
      (r[1] ? '<span class="pr__pn">' + esc(r[1]) + "</span>" : '<span class="pr__na">Part no. on request</span>') + (r[2] ? '<span class="pr__u">' + esc(r[2]) + "</span>" : "") +
      '</div><button type="button" class="pr__add" data-v="' + v.id + '" data-c="' + ci + '" data-r="' + ri + '" aria-pressed="false"><span class="sr-only"></span>' + I_ADD + "</button></li>";
  }
  function home(make) {
    var makes = [], seen = {};
    V.forEach(function (v) { if (v.id !== "general" && !seen[v.mk]) { seen[v.mk] = 0; makes.push(v.mk); } if (v.id !== "general") seen[v.mk]++; });
    if (!seen.hasOwnProperty(make)) make = "";
    var h = '<div class="pf__makes" role="group" aria-label="Filter by make"><a class="chip" href="#/"' + (make ? "" : ' aria-current="true"') + ">All <span>" + (V.length - 1) + "</span></a>" +
      makes.map(function (m) { return '<a class="chip" href="#/m/' + encodeURIComponent(m) + '"' + (m === make ? ' aria-current="true"' : "") + ">" + esc(m) + " <span>" + seen[m] + "</span></a>"; }).join("") + '</div><ul class="pf__grid">';
    V.forEach(function (v) {
      if (v.id === "general" ? !!make : (make && v.mk !== make)) return;
      h += '<li><a class="vc' + (v.id === "general" ? " vc--general" : "") + '" href="#/v/' + v.id + '"><span class="vc__mk">' + esc(v.mk) + "</span><b>" + esc(v.md) + '</b><span class="vc__va">' + esc(v.va.join(" · ")) +
           '</span><span class="vc__n">' + plural(v.n, "part") + ARR + "</span></a></li>";
    });
    app.innerHTML = h + "</ul>";
  }
  function vehicle(v) {
    var h = '<a class="pf__back" href="#/">' + ARR + 'All vehicles</a><header class="pv__head"><p class="eyebrow">' + (v.id === "general" ? "For all vehicles" : "Accessories to suit · " + esc(v.mk)) +
      "</p><h2>" + esc(title(v)) + '</h2><p class="pv__va">' + v.va.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("") + '</p><p class="pv__n">' + plural(v.n, "part") + " in " + plural(v.c.length, "categor").replace(/categors$/, "categories").replace(/categor$/, "category") +
      '</p></header><div class="pv__cats" role="group" aria-label="Jump to a category">' +
      v.c.map(function (c, i) { return '<button type="button" class="chip" data-jump="' + i + '">' + esc(c[0]) + "</button>"; }).join("") + "</div>";
    v.c.forEach(function (c, ci) {
      h += '<section class="pc" id="pc' + ci + '"><h3>' + esc(c[0]) + "<span>" + c[1].length + '</span></h3><ul>' + c[1].map(function (_, ri) { return rowHTML(v, ci, ri, false); }).join("") + "</ul>" +
           (c[2] ? '<p class="pc__note">' + esc(c[2]) + "</p>" : "") + "</section>";
    });
    app.innerHTML = h;
  }
  function search(term) {
    var t = term.toLowerCase().trim(), tn = t.replace(/[\s\-\/.]/g, ""), hits = [], total = 0;
    if (t.length < 2) { home(""); return; }
    V.forEach(function (v) {
      var rows = [];
      v.c.forEach(function (c, ci) {
        c[1].forEach(function (r, ri) {
          var p = r[1].toLowerCase();
          if (r[0].toLowerCase().indexOf(t) > -1 || p.indexOf(t) > -1 || (tn.length > 2 && p.replace(/[\s\-\/.]/g, "").indexOf(tn) > -1)) rows.push([ci, ri]);
        });
      });
      if (rows.length) { hits.push([v, rows]); total += rows.length; }
    });
    if (!total) {
      app.innerHTML = '<div class="ps__none"><b>Nothing found for “' + esc(term) + '”.</b>Check the spelling or try fewer characters of the part number. You can also <a class="tlink" href="/contact/#enquiry">ask us directly</a> or <a class="tlink" href="#/">pick your vehicle</a>.</div>';
      return;
    }
    var shown = 0, h = '<p class="ps__sum"><b>' + plural(total, "match").replace(/matchs$/, "matches") + "</b> for “" + esc(term) + "” across " + plural(hits.length, "vehicle") +
      (total > MAXQ ? ". Showing the first " + MAXQ + "; add a few more characters to narrow it." : ".") + "</p>";
    for (var g = 0; g < hits.length && shown < MAXQ; g++) {
      var v = hits[g][0], rows = hits[g][1].slice(0, MAXQ - shown); shown += rows.length;
      h += '<section class="ps__g"><h3><span>' + esc(title(v)) + (v.id === "general" ? "" : "<small>" + esc(v.va.join(" · ")) + "</small>") + '</span><a href="#/v/' + v.id + '">All ' + v.n + " parts " + "→</a></h3><ul>" +
           rows.map(function (p) { return rowHTML(v, p[0], p[1], true); }).join("") + "</ul></section>";
    }
    app.innerHTML = h;
  }

  /* ── routing ── */
  var first = true;
  function route() {
    var h = location.hash.replace(/^#\/?/, ""), m;
    try { h = decodeURIComponent(h); } catch (e) {}
    if ((m = h.match(/^v\/(.+)$/)) && byId[m[1]] && !plain(byId[m[1]]) || h === "v/general") { q.value = ""; vehicle(byId[h.slice(2)]); }
    else if ((m = h.match(/^q\/(.+)$/))) { if (doc.activeElement !== q) q.value = m[1]; search(m[1]); }
    else if ((m = h.match(/^m\/(.+)$/))) { q.value = ""; home(m[1]); }
    else if (h === "list") { home(""); sync(); openSheet($("pfOpen")); first = false; return; }      // #/list: straight to the list (the shop links here)
    else { if (doc.activeElement !== q) q.value = ""; home(""); }
    sync();
    if (!first && doc.activeElement !== q) {       // a new view starts at its top, not wherever the last one was scrolled to
      var y = app.getBoundingClientRect().top + window.pageYOffset - 150;
      if (window.pageYOffset > y) window.scrollTo(0, Math.max(0, y));
    }
    first = false;
  }
  window.addEventListener("hashchange", route);
  var timer;
  q.addEventListener("input", function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var t = q.value.trim(), target = t.length >= 2 ? "#/q/" + encodeURIComponent(t) : "#/";
      if (location.hash === target) return;
      if (/^#\/q\//.test(location.hash) && t.length >= 2) { history.replaceState(null, "", target); route(); }     // typing does not fill the history
      else location.hash = target;
    }, 160);
  });
  q.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); q.blur(); } });

  /* ── clicks inside the app ── */
  app.addEventListener("click", function (e) {
    var add = e.target.closest(".pr__add"), jump = e.target.closest("[data-jump]");
    if (add) { var v = byId[add.getAttribute("data-v")]; toggle(v.id, v.c[+add.getAttribute("data-c")][1][+add.getAttribute("data-r")]); }
    else if (jump) { var s = $("pc" + jump.getAttribute("data-jump")); if (s) s.scrollIntoView({ block: "start" }); }
  });

  /* ── the sheet ── */
  var opener = null;
  function openSheet(o) { opener = o || doc.activeElement; drawList(); sheet.hidden = false; root.classList.add("pf-open"); $("pfClose").focus(); }
  function closeSheet() { sheet.hidden = true; root.classList.remove("pf-open"); if (opener && opener.focus) opener.focus(); }
  $("pfOpen").addEventListener("click", function () { openSheet(this); });
  $("pfClose").addEventListener("click", closeSheet);
  sheet.addEventListener("click", function (e) { if (e.target === sheet) closeSheet(); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !sheet.hidden) closeSheet(); });
  listEl.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-rm")) list.splice(+b.getAttribute("data-rm"), 1);
    else if (b.hasAttribute("data-q")) { var x = list[+b.getAttribute("data-i")]; x.q = Math.max(1, Math.min(999, x.q + +b.getAttribute("data-q"))); }
    else return;
    save(); sync();
  });

  /* ── sending ── */
  form.addEventListener("input", function (e) { var f = e.target.closest(".pff"); if (f) f.classList.remove("is-bad"); });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var bad = null;
    [].forEach.call(form.querySelectorAll("[required]"), function (el) {
      var ok = el.value.trim() !== "" && (el.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()));
      el.closest(".pff").classList.toggle("is-bad", !ok);
      if (!ok && !bad) bad = el;
    });
    if (!list.length) { status.className = "pf-msg err"; status.textContent = "Your list is empty. Tick the parts you need first."; return; }
    if (bad) { status.className = "pf-msg err"; status.textContent = "Please add your name and a valid email."; bad.focus(); return; }
    var note = form.elements.note.value.trim();
    msg.value = text(0) + (note ? "\n\nNote: " + note : "");
    var data = new FormData(form);
    send.disabled = true; send.textContent = "Sending…"; status.className = "pf-msg"; status.textContent = "";
    fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("bad status"); return r; })
      .then(function () {
        var n = list.length; list = []; save(); form.reset(); sync();
        status.className = "pf-msg ok"; status.textContent = "Sent: " + plural(n, "item") + ". We'll get back to you within one working day.";
      })
      .catch(function () {
        status.className = "pf-msg err";
        status.innerHTML = 'Couldn\'t send. Your list is still here: please try <a href="' + esc(wa.href) + '" target="_blank" rel="noopener">WhatsApp</a> or email <a href="mailto:info@sairaj.global">info@sairaj.global</a>.';
      })
      .then(function () { send.disabled = false; send.innerHTML = sendHTML; });
  });

  route();
})();
