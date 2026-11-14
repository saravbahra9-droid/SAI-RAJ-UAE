/* ════════════════════════════════════════════════════════════
   SAI RAJ — shop.js
   The shop app from the previous single-file site, moved to /shop.
   Behaviour is unchanged: hash routes, search / sort / filter,
   product pages, multi-item cart saved on the device, and a
   Shopify cart permalink at checkout. Data lives in catalog.js.
   ════════════════════════════════════════════════════════════ */
(function () {
const app = document.getElementById("app");

function cardHTML(p){
  return `<a class="card" href="#/product/${p.id}">
    <div class="im">
      ${p.was ? `<span class="sale">SALE</span>` : ""}
      ${p.img ? bim(p.img, p.title) : `<div class="ph2"><span>${p.cat}</span></div>`}
    </div>
    <div class="card-body">
      <span class="cat">${p.cat}</span>
      <h3>${p.title}</h3>
      <p class="sub">${p.sub}</p>
      <div class="row">
        <span class="price">${p.was ? `<span class="was">${money(conv(p.was))}</span>` : ""}${priceHTML(p.price)}</span>
        <span class="go">View →</span>
      </div>
    </div>
  </a>`;
}

/* ── Pages ── */
function pageShop(filterCat){
  document.title = filterCat ? filterCat + " — Shop — Sai Raj" : "Shop — Sai Raj | 4x4 Accessories, Canopies & Cooling";
  const landing = !filterCat;
  app.innerHTML = `
  <div class="wrap shophead">
    <p class="eyebrow">The Sai Raj shop</p>
    <h1>${landing ? "Gear your 4x4. Protect your load." : filterCat}</h1>
    <p class="sub">Canopies, drawer systems, cooler boxes and camping gear — engineered in fibreglass since 1975. Priced in AED, delivered across the Gulf, checkout by Shopify.</p>
  </div>
  ${landing && window.SRR ? SRR.landing() : ""}
  <section class="section" style="padding-top:56px"><div class="wrap">
    <div class="sec-head"><h2>${landing ? "Buy online" : "Products"}</h2><a href="#/range">Need custom work? →</a></div>
    <div class="toolbar">
      <div class="search">
        <input type="search" id="q" placeholder="Search products…" aria-label="Search products">
        <span class="ic"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6"/><path d="M14 14l4 4"/></svg></span>
      </div>
      <select class="sortsel" id="sort" aria-label="Sort products">
        <option value="feat">Featured</option>
        <option value="asc">Price: Low → High</option>
        <option value="desc">Price: High → Low</option>
      </select>
      <div class="chips" id="chips"></div>
    </div>
    <p class="count" id="count"></p>
    <div class="grid" id="grid"></div>
  </div></section>
  ${landing ? `
  <section class="section" style="padding-top:0"><div class="wrap">
    <div class="split">
      <div class="tx">
        <h2>Custom builds &amp; fleet work</h2>
        <p>Truck bodies, conversions, coldrooms and emergency vehicles — designed and fabricated by the team that's been doing it for 50 years.</p>
        <div><a class="sbtn red" href="#/range">Explore Our Range</a></div>
      </div>
      <div class="simg">${bim("trucks","Custom truck bodies")}</div>
    </div>
  </div></section>
  <section class="section grey"><div class="wrap">
    <div class="sec-head"><h2>Our Brands</h2></div>
    <div class="brandrow">${BRANDS.map(b => `<a class="b" href="#/brand/${b.k}" aria-label="${b.name}"><img src="${b.img}" alt="${b.name}" loading="lazy"></a>`).join("")}</div>
  </div></section>` : ""}`;

  const cats = ["All", ...new Set(PRODUCTS.map(p => p.cat))];
  let active = cats.includes(filterCat) ? filterCat : "All";
  const chips = document.getElementById("chips");
  const grid = document.getElementById("grid");
  const count = document.getElementById("count");
  const q = document.getElementById("q");
  const sort = document.getElementById("sort");

  function draw(){
    const term = q.value.trim().toLowerCase();
    let list = PRODUCTS.filter(p =>
      (active === "All" || p.cat === active) &&
      (!term || (p.title + " " + p.desc + " " + p.cat).toLowerCase().includes(term)));
    if (sort.value === "asc")  list = [...list].sort((a,b) => a.price - b.price);
    if (sort.value === "desc") list = [...list].sort((a,b) => b.price - a.price);
    grid.innerHTML = list.length ? list.map(cardHTML).join("")
      : `<p style="grid-column:1/-1;color:var(--mut)">No products match — try a different search, or <a href="${WA}" style="color:var(--red-deep);font-weight:600">WhatsApp us</a> and we'll source it.</p>`;
    count.textContent = `${list.length} product${list.length === 1 ? "" : "s"}${active !== "All" ? " in " + active : ""}`;
    chips.innerHTML = cats.map(c =>
      `<button class="chip${c === active ? " active" : ""}" data-cat="${c}">${c}</button>`).join("");
  }
  chips.addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    active = b.dataset.cat; draw();
  });
  /* the same search also looks through the full range (price on request) */
  const hits = document.createElement("div"); hits.id = "rangeHits"; grid.parentNode.appendChild(hits);
  function drawRange(){ if (window.SRR) { hits.innerHTML = SRR.searchHTML(q.value); SRR.refresh(); } }
  q.addEventListener("input", () => { draw(); drawRange(); });
  sort.addEventListener("change", draw);
  draw();
}

function pageProduct(id){
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) { location.hash = "#/shop"; return; }
  document.title = p.title + " — Sai Raj";
  let qty = 1;
  const related = PRODUCTS.filter(x => x.cat === p.cat && x.id !== p.id).slice(0,3);

  app.innerHTML = `
  <div class="wrap">
    <p class="crumb"><a href="/">Home</a> / <a href="#/shop">Shop</a> / <a href="#/shop/${p.cat}">${p.cat}</a> / ${p.title}</p>
    <div class="pdp">
      <div class="imbox">
        ${p.was ? `<span class="sale">SALE</span>` : ""}
        ${p.img ? bim(p.img, p.title) : `<div class="ph2" style="height:100%"><span>${p.cat}</span></div>`}
      </div>
      <div>
        <span class="cat">${p.cat}</span>
        <h1>${p.title}</h1>
        <p class="price">${p.was ? `<span class="was">${price(p.was)}</span> ` : ""}${priceHTML(p.price)}</p>
        <p class="desc">${p.desc}</p>
        <div class="specs">${p.specs.map(([k,v]) => `<div><b>${k}</b><span>${v}</span></div>`).join("")}</div>
        <div class="qtyrow">
          <div class="qty" aria-label="Quantity">
            <button id="minus" aria-label="Decrease">−</button>
            <span id="qtyVal">1</span>
            <button id="plus" aria-label="Increase">+</button>
          </div>
          <button class="sbtn red" id="buyBtn" type="button">Add to Cart</button>
          <a class="sbtn line" href="${WA}?text=${encodeURIComponent("Hello, I'm interested in the " + p.title)}">Ask on WhatsApp</a>
        </div>
        <p class="note">GCC delivery · worldwide shipping on request · <a href="/#enquiry">Contact us</a></p>
      </div>
    </div>
    ${related.length ? `
    <div class="sec-head"><h2>You Might Also Like</h2></div>
    <div class="grid" style="margin-bottom:64px">${related.map(cardHTML).join("")}</div>` : ""}
  </div>`;

  const val = document.getElementById("qtyVal");
  document.getElementById("minus").onclick = () => { if (qty > 1) { qty--; val.textContent = qty; } };
  document.getElementById("plus").onclick = () => { if (qty < 99) { qty++; val.textContent = qty; } };
  document.getElementById("buyBtn").onclick = () => addToCart(p.id, qty);
}

function pageRange(){
  document.title = "Our Range — Sai Raj";
  app.innerHTML = `
  <section class="section"><div class="wrap">
    <div class="sec-head"><h2>Our Full Range</h2><a href="#/shop">Shop retail →</a></div>
    <p style="color:var(--mut);max-width:70ch;margin:-14px 0 30px;font-size:15px">
      Bespoke fabrication and fleet work. Tell us what you're building — we'll spec it with you.</p>
    <div class="range-grid">
      ${RANGE.map(([name,im]) => `
      <article class="rcard">
        <div class="rim">${bim(im, name)}</div>
        <div class="rb">
          <h3>${name}</h3>
          <a href="${WA}?text=${encodeURIComponent("Hello, I'd like to enquire about " + name.toLowerCase())}">Enquire →</a>
        </div>
      </article>`).join("")}
    </div>
  </div></section>

  <div class="cta-band">
    <h2>Fleet or project in mind?</h2>
    <p>We've built for logistics fleets, farms, emergency services and resorts across two continents.</p>
    <a class="sbtn dark" href="/#enquiry">Send an Enquiry</a>
  </div>`;
}

function pageBrand(k){
  const b = BRANDS.find(x => x.k === k);
  if (!b) { location.hash = "#/shop"; return; }
  document.title = b.name + " — Sai Raj";
  const prods = PRODUCTS.filter(p => b.ids.includes(p.id));
  app.innerHTML = `
  <div class="wrap">
    <p class="crumb"><a href="/">Home</a> / Brands / ${b.name}</p>
    <div class="bhero">
      <div class="blogo"><img src="${b.img}" alt="${b.name}"></div>
      <div>
        <h1>${b.name}</h1>
        <p class="btag">${b.tag}</p>
        <p class="bdesc">${b.desc}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          ${b.shop ? `<a class="sbtn red" href="${b.shop}">Shop ${b.name}</a>` : ""}
          <a class="sbtn line" href="${WA}?text=${encodeURIComponent("Hello, I'd like to enquire about " + b.name)}">Enquire on WhatsApp</a>
        </div>
      </div>
    </div>
    ${prods.length ? `
    <div class="sec-head" style="margin-top:56px"><h2>${b.name} Products</h2><a href="#/shop">All products →</a></div>
    <div class="grid" style="margin-bottom:64px">${prods.map(cardHTML).join("")}</div>`
    : `
    <div class="cta-band" style="border-radius:var(--rad);margin:48px 0 64px">
      <h2>Built to order</h2>
      <p>${b.name} work is specced per project — tell us what you need and we'll quote it.</p>
      <a class="sbtn dark" href="/#enquiry">Send an Enquiry</a>
    </div>`}
  </div>`;
}

function pageRewards(){
  document.title = "Sai Raj Club — Rewards";
  app.innerHTML = `
  <section class="shero"><div class="wrap">
    <p class="kick">Sai Raj Club · Member Rewards</p>
    <h1>Loyalty, rewarded in gold.</h1>
    <p>Join the Sai Raj Club free and earn store credit on every purchase — plus priority workshop booking, member pricing and first access to new ranges.</p>
    <div class="cta"><a class="sbtn red" href="#joinclub">Join Free</a><a class="sbtn ghost" href="#/shop">Shop &amp; Earn</a></div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="sec-head"><h2>Membership Tiers</h2></div>
    <div class="tiers">
      <div class="tier">
        <p class="tname">Silver</p>
        <p class="tspend">Free to join</p>
        <ul>
          <li>3% back in store credit on every order</li>
          <li>Member-only offers on WhatsApp</li>
          <li>Birthday reward</li>
        </ul>
      </div>
      <div class="tier gold">
        <span class="badge">Most Popular</span>
        <p class="tname">Gold</p>
        <p class="tspend">AED 10,000+ / year</p>
        <ul>
          <li>5% back in store credit</li>
          <li>Priority workshop &amp; fitment booking</li>
          <li>Early access to new ranges</li>
          <li>Free delivery across the UAE</li>
        </ul>
      </div>
      <div class="tier">
        <p class="tname">Platinum</p>
        <p class="tspend">AED 25,000+ / year</p>
        <ul>
          <li>7% back in store credit</li>
          <li>Dedicated account manager</li>
          <li>Free fitment on all purchases</li>
          <li>Invitations to desert drive events</li>
        </ul>
      </div>
    </div>
  </div></section>

  <section class="section grey"><div class="wrap">
    <div class="sec-head"><h2>How It Works</h2></div>
    <div class="feat">
      <div class="fcard"><b>1 — Join free</b><p>Sign up below with the same email or phone you use at checkout.</p></div>
      <div class="fcard"><b>2 — Shop as normal</b><p>Every order, online or direct with our team, counts toward your tier and credit.</p></div>
      <div class="fcard"><b>3 — Credit lands</b><p>Store credit is added to your member account within 48 hours of each order.</p></div>
      <div class="fcard"><b>4 — Redeem anywhere</b><p>Use credit on any product or fitment — just quote your member number at checkout or on WhatsApp.</p></div>
    </div>
  </div></section>

  <section class="section" id="joinclub"><div class="wrap">
    <div class="cwrap">
      <div class="formcard">
        <h3>Join the Sai Raj Club</h3>
        <p class="fsub">Free forever. We'll confirm your membership number by email or WhatsApp within one working day.</p>
        <form id="clubForm">
          <div class="fgrid">
            <div><label class="fl" for="cName">Name *</label><input class="fin" id="cName" name="name" required></div>
            <div><label class="fl" for="cEmail">Email *</label><input class="fin" id="cEmail" name="email" type="email" required></div>
            <div class="full"><label class="fl" for="cPhone">Phone / WhatsApp *</label><input class="fin" id="cPhone" name="phone" required></div>
            <input type="hidden" name="_subject" value="Sai Raj Club signup">
            <input type="hidden" name="topic" value="Rewards signup">
            <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
          </div>
          <div style="margin-top:16px"><button class="sbtn red" type="submit" id="cSend">Join Free</button></div>
          <p class="fmsg" id="cStatus" role="status"></p>
        </form>
      </div>
      <div class="feat" style="grid-template-columns:1fr">
        <div class="fcard"><b>Fleet &amp; trade?</b><p>Corporate buyers get bespoke terms instead — trade pricing, net terms and a dedicated desk. <a href="/#enquiry">Talk to us</a>.</p></div>
        <div class="fcard"><b>The fine print</b><p>Tier level is based on rolling 12-month spend. Store credit is valid for 12 months and can't be exchanged for cash. Full terms shared on joining.</p></div>
      </div>
    </div>
  </div></section>`;

  const form = document.getElementById("clubForm");
  const status = document.getElementById("cStatus");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = new FormData(form);
    const btn = document.getElementById("cSend");
    btn.disabled = true; btn.textContent = "Joining…";
    try {
      const r = await fetch(`https://formspree.io/f/${FORMSPREE.id}`,
        { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error();
      form.reset();
      status.className = "fmsg ok";
      status.textContent = "Welcome to the club — membership number on its way!";
    } catch {
      status.className = "fmsg err";
      status.innerHTML = `Couldn't send — try <a href="${WA}" style="color:inherit">WhatsApp</a> instead.`;
    }
    btn.disabled = false; btn.textContent = "Join Free";
  });
}

/* ── Desert Dash ─────────────────────────────────────────── */
const GAME = { raf:0, best:0, cleanup:null };

function pageGame(){
  document.title = "Desert Dash — Sai Raj";
  app.innerHTML = `
  <section class="section"><div class="wrap">
    <div class="sec-head"><h2>Desert Dash</h2><a href="#/shop">Back to shopping →</a></div>
    <div class="gamewrap">
      <canvas id="dd" height="260" aria-label="Desert Dash game"></canvas>
      <div class="gstats">
        <span>Score: <b id="gScore">0</b> m</span>
        <span>Best: <b id="gBest">${GAME.best}</b> m</span>
      </div>
      <p class="ghelp">Tap, click or press <b>Space</b> to jump. Don't hit the rocks and cones!</p>
    </div>
    <div style="text-align:center;margin-top:26px">
      <a class="sbtn line" id="shareBtn" href="${WA}" style="display:none">Share My Score on WhatsApp</a>
    </div>
  </div></section>`;

  const cv = document.getElementById("dd");
  const ctx = cv.getContext("2d");
  const scoreEl = document.getElementById("gScore");
  const bestEl = document.getElementById("gBest");
  const shareBtn = document.getElementById("shareBtn");

  let W, H, dpr;
  function size(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = 260;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener("resize", size);

  const groundY = () => H - 42;
  let state = "ready", truck, obs, speed, dist;

  function reset(){
    truck = { x:64, y:groundY(), vy:0 };
    obs = []; speed = 5.2; dist = 0;
  }
  reset();

  function jump(){
    if (state === "ready") { state = "run"; return; }
    if (state === "over")  { reset(); state = "run"; shareBtn.style.display = "none"; return; }
    if (truck.y >= groundY() - 0.5) truck.vy = -10.6;
  }
  const onKey = e => {
    if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); jump(); }
  };
  cv.addEventListener("pointerdown", jump);
  window.addEventListener("keydown", onKey);

  function spawn(){
    const last = obs[obs.length - 1];
    if (!last || last.x < W - (240 + Math.random()*260 + speed*14)) {
      const type = Math.random() < 0.45 ? "cone" : "rock";
      const h = type === "cone" ? 26 : 22 + Math.random()*14;
      const w = type === "cone" ? 20 : 26 + Math.random()*16;
      obs.push({ x: W + 20, w, h, type });
    }
  }

  function drawTruck(){
    const x = truck.x, y = truck.y;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ED1C24";
    ctx.beginPath(); ctx.roundRect(-30, -26, 62, 18, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-4, -42, 28, 18, [6,6,0,0]); ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath(); ctx.roundRect(1, -38, 15, 11, 3); ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.arc(-16, -4, 9, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(18, -4, 9, 0, 7); ctx.fill();
    ctx.fillStyle = "#888";
    ctx.beginPath(); ctx.arc(-16, -4, 4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(18, -4, 4, 0, 7); ctx.fill();
    ctx.restore();
  }

  function drawObs(o){
    const g = groundY();
    if (o.type === "cone") {
      ctx.fillStyle = "#ED1C24";
      ctx.beginPath();
      ctx.moveTo(o.x + o.w/2, g - o.h);
      ctx.lineTo(o.x + o.w, g); ctx.lineTo(o.x, g); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(o.x + o.w*0.22, g - o.h*0.55, o.w*0.56, 5);
    } else {
      ctx.fillStyle = "#8D8D8D";
      ctx.beginPath();
      ctx.roundRect(o.x, g - o.h, o.w, o.h, 6); ctx.fill();
      ctx.fillStyle = "#A9A9A9";
      ctx.beginPath();
      ctx.roundRect(o.x + o.w*0.15, g - o.h, o.w*0.4, o.h*0.4, 4); ctx.fill();
    }
  }

  function drawScene(){
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#FFF7EA"); sky.addColorStop(1, "#FFE7C8");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(245,179,1,.55)";
    ctx.beginPath(); ctx.arc(W - 70, 54, 26, 0, 7); ctx.fill();
    ctx.fillStyle = "#F6D9A8";
    for (let i = -1; i < W/180 + 1; i++) {
      const dx = (i*180) - ((dist*0.35) % 180);
      ctx.beginPath(); ctx.ellipse(dx, groundY()+4, 130, 34, 0, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = "#F1C88C";
    for (let i = -1; i < W/140 + 1; i++) {
      const dx = (i*140) - ((dist*0.7) % 140);
      ctx.beginPath(); ctx.ellipse(dx+40, groundY()+8, 95, 26, 0, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = "#111";
    ctx.fillRect(0, groundY(), W, 3);
    ctx.fillStyle = "rgba(17,17,17,.28)";
    for (let i = 0; i < W/46 + 1; i++) {
      const dx = (i*46) - (dist % 46);
      ctx.fillRect(dx, groundY() + 12, 20, 3);
    }
  }

  function overlay(title, sub){
    ctx.fillStyle = "rgba(17,17,17,.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 30px Poppins, sans-serif";
    ctx.fillText(title, W/2, H/2 - 10);
    ctx.font = "600 14px Poppins, sans-serif";
    ctx.fillText(sub, W/2, H/2 + 20);
  }

  function loop(){
    GAME.raf = requestAnimationFrame(loop);
    drawScene();

    if (state === "run") {
      speed = Math.min(11, speed + 0.0016);
      dist += speed;
      truck.vy += 0.55;
      truck.y = Math.min(groundY(), truck.y + truck.vy);
      spawn();
      obs.forEach(o => o.x -= speed);
      obs = obs.filter(o => o.x + o.w > -30);
      const tx = truck.x - 28, tw = 58, ty = truck.y - 40, th = 40;
      for (const o of obs) {
        const g = groundY();
        if (tx + 6 < o.x + o.w && tx + tw - 6 > o.x &&
            ty + th > g - o.h + 4) { state = "over"; break; }
      }
      if (state === "over") {
        const m = Math.floor(dist/12);
        if (m > GAME.best) GAME.best = m;
        bestEl.textContent = GAME.best;
        shareBtn.style.display = "inline-block";
        shareBtn.href = WA + "?text=" + encodeURIComponent(
          `I scored ${m} m on Desert Dash at Sai Raj Global! 🏜️🚙 Can you beat it?`);
      }
      scoreEl.textContent = Math.floor(dist/12);
    }

    obs.forEach(drawObs);
    drawTruck();

    if (state === "ready") overlay("DESERT DASH", "Tap or press Space to start");
    if (state === "over")  overlay("GAME OVER", "Tap or press Space to try again");
  }
  loop();

  GAME.cleanup = () => {
    cancelAnimationFrame(GAME.raf);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", size);
    GAME.cleanup = null;
  };
}

/* ── Router ── */
function route(){
  if (GAME.cleanup) GAME.cleanup();
  if (typeof closeCart === "function") closeCart();
  const h = location.hash.replace(/^#\/?/, "");
  const [page, param] = h.split("/");

  if (page === "contact") { location.href = "/#enquiry"; return; }
  if (page === "about")   { location.href = "/#story"; return; }
  if (page === "product")      pageProduct(param);
  else if (page === "range")   pageRange();
  else if (page === "brand")   pageBrand(param);
  else if (page === "game")    pageGame();
  else if (page === "rewards") pageRewards();
  else if (page === "cat" && window.SRR)  SRR.pageCat(app, param);
  else if (page === "item" && window.SRR) SRR.pageItem(app, param);
  else                         pageShop(decodeURIComponent(param || ""));

  const active = (page === "product" || page === "brand" || page === "cat" || page === "item" || !page) ? "shop" : page;
  document.querySelectorAll("[data-nav]").forEach(a =>
    a.classList.toggle("active", a.dataset.nav === active));
  window.scrollTo(0,0);
}

/* ── Cart (on-site, multi-item) ── */
const cartStore = {
  get(){ try { return JSON.parse(localStorage.getItem("srcart") || "[]"); } catch(e) { return []; } },
  set(c){ try { localStorage.setItem("srcart", JSON.stringify(c)); } catch(e) {} }
};
let CART = cartStore.get();

function cartCount(){ return CART.reduce((n,i) => n + i.qty, 0); }
function addToCart(id, qty){
  const line = CART.find(i => i.id === id);
  if (line) line.qty = Math.min(99, line.qty + qty); else CART.push({id, qty});
  cartStore.set(CART); renderCart(); openCart();
}
function renderCart(){
  const box = document.getElementById("cartItems");
  const total = document.getElementById("cartTotal");
  const go = document.getElementById("cartCheckout");
  const b1 = document.getElementById("cartBadge1");
  const b2 = document.getElementById("cartBadge2");
  const n = cartCount() + (window.SRR ? SRR.getList().length : 0);
  b1.textContent = n; b2.textContent = n;
  b1.classList.toggle("on", n > 0);
  b2.style.display = n ? "grid" : "none";

  const req = window.SRR ? SRR.cartBlock() : "";
  let note = document.getElementById("cartNote");
  if (!note) { note = document.createElement("p"); note.id = "cartNote"; note.className = "cart-note"; go.parentNode.insertBefore(note, go); }
  note.textContent = getCur() === "AED" || !CART.length ? "" : `Shown in ${getCur()} for reference. Checkout is in AED.`;
  go.parentNode.hidden = !CART.length && !!req;   // only price-on-request lines: no subtotal, no checkout
  if (!CART.length){
    box.innerHTML = (req ? "" : `<p class="cart-empty">Your cart is empty.<br><a href="#/shop" style="color:var(--red-deep);font-weight:600" onclick="closeCart()">Browse the shop →</a></p>`) + req;
    total.textContent = price(0);
    go.style.opacity = ".5"; go.style.pointerEvents = "none";
    return;
  }
  let sum = 0;
  box.innerHTML = CART.map(line => {
    const p = PRODUCTS.find(x => x.id === line.id); if (!p) return "";
    sum += p.price * line.qty;
    return `<div class="citem" data-id="${p.id}">
      <div class="ci-im">${p.img ? bim(p.img, p.title) : `<div class="ph2" style="border-radius:8px"><span style="font-size:9px;border-width:2px;padding-bottom:3px">${p.cat}</span></div>`}</div>
      <div class="ci-b">
        <h4>${p.title}</h4>
        <p class="ci-p">${price(p.price)}</p>
      </div>
      <div class="cqty">
        <button data-act="minus" aria-label="Decrease">−</button>
        <span>${line.qty}</span>
        <button data-act="plus" aria-label="Increase">+</button>
      </div>
      <button class="ci-x" data-act="remove" aria-label="Remove">✕</button>
    </div>`;
  }).join("") + req;
  total.textContent = price(sum);
  go.style.opacity = "1"; go.style.pointerEvents = "auto";
  go.href = `https://${SHOPIFY.domain}/cart/` +
    CART.map(l => `${PRODUCTS.find(x => x.id === l.id).variantId}:${l.qty}`).join(",");
}
function openCart(){
  document.getElementById("cartDr").classList.add("open");
  document.getElementById("cartOv").classList.add("open");
}
function closeCart(){
  document.getElementById("cartDr").classList.remove("open");
  document.getElementById("cartOv").classList.remove("open");
}
document.getElementById("cartItems").addEventListener("click", e => {
  const btn = e.target.closest("[data-act]"); if (!btn) return;
  if (!btn.closest(".citem")) return;
  const id = btn.closest(".citem").dataset.id;
  const line = CART.find(i => i.id === id); if (!line) return;
  if (btn.dataset.act === "plus")  line.qty = Math.min(99, line.qty + 1);
  if (btn.dataset.act === "minus") line.qty = Math.max(1, line.qty - 1);
  if (btn.dataset.act === "remove") CART = CART.filter(i => i.id !== id);
  cartStore.set(CART); renderCart();
});
document.getElementById("cartLink").addEventListener("click", e => { e.preventDefault(); renderCart(); openCart(); });
document.getElementById("cartTab").addEventListener("click", e => { e.preventDefault(); renderCart(); openCart(); });
document.getElementById("cartClose").addEventListener("click", closeCart);
document.getElementById("cartOv").addEventListener("click", closeCart);
renderCart();

/* ── Display currency (for show; checkout stays in AED) ── */
const curBar = document.createElement("div");
curBar.className = "curbar";
curBar.innerHTML = `<div class="wrap curbar__in"><span class="curbar__l">Show prices in</span><div class="cur" role="group" aria-label="Show prices in">${
  Object.keys(CURRENCY.rates).map(c => `<button type="button" data-cur="${c}">${c}</button>`).join("")}</div><span class="curbar__n" id="curNote"></span></div>`;
app.parentNode.insertBefore(curBar, app);
function drawCur(){
  const c = getCur();
  curBar.querySelectorAll("[data-cur]").forEach(b => b.setAttribute("aria-pressed", b.dataset.cur === c ? "true" : "false"));
  document.getElementById("curNote").textContent = c === "AED" ? "UAE dirhams. Checkout by Shopify."
    : c === "USD" ? "Approximate, at AED 3.6725 to US$ 1. Checkout is in AED."
    : `Approximate, at KSh ${CURRENCY.rates.KES} to AED 1 (${CURRENCY.asOf}). Checkout is in AED.`;
}
curBar.addEventListener("click", e => {
  const b = e.target.closest("[data-cur]"); if (!b) return;
  setCur(b.dataset.cur); drawCur();
  const y = window.scrollY; route(); renderCart(); window.scrollTo(0, y);
});
drawCur();
window.SRShop = { renderCart, openCart, cardHTML };

window.addEventListener("hashchange", route);
route();

window.closeCart = closeCart;   /* used by the "Browse the shop" link inside the empty cart */
if (location.hash === "#cart") { renderCart(); openCart(); }
})();

/* ── SEO: product list as structured data (as on the previous site) ── */
(function () {
  if (!window.SR) return;
  var ld = { "@context": "https://schema.org", "@type": "ItemList", "name": "Sai Raj shop",
    "itemListElement": window.SR.PRODUCTS.map(function (p, i) {
      return { "@type": "ListItem", "position": i + 1, "item": { "@type": "Product", "name": p.title, "description": p.desc,
        "brand": { "@type": "Brand", "name": "Sai Raj" }, "url": "https://sairaj.global/shop/#/product/" + p.id,
        "offers": { "@type": "Offer", "priceCurrency": "AED", "price": p.price, "url": "https://sairaj.global/shop/#/product/" + p.id } } };
    }) };
  var s = document.createElement("script"); s.type = "application/ld+json"; s.textContent = JSON.stringify(ld);
  document.head.appendChild(s);
})();
