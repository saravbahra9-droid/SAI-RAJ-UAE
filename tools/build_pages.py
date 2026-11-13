#!/usr/bin/env python3
"""Builds every page that shares the group navigation and footer.

  python3 tools/build_pages.py

- Writes the brand pages (/cargotuff, /pulse, /safarituff, /cargocool, /deco),
  /cold-chain, /partners, /contact and /downloads from the data in this file.
- Re-injects the shared nav and footer into index.html, shop/index.html,
  privacy, terms and 404 (between the <!-- nav:start --> / <!-- foot:start --> markers).

Copy comes from the Sai Raj company profile (2024-25) and the product pages of
sairaj.global. Main pages carry no photographs: drawings are inline SVG line art.
"""
import os, re, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = "2"
ARR = '<svg class="arr" viewBox="0 0 16 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M0 5h14M10 1l4 4-4 4"/></svg>'
CDN = "https://cdn.shopify.com/s/files/1/1025/4549/0307/files/"

BRANDS = [
  dict(k="cargotuff", name="Cargotuff", acc="#E0262E", logo=CDN+"CARGO_20TUFF.webp?v=1783181922",
       short="Truck and pick-up bodies, conversions, trailers, cold rooms"),
  dict(k="pulse", name="Pulse", acc="#E0262E", logo=CDN+"Pulse_20Ambulance_20and_20Mobile_20Clinic_20Logo-01.webp?v=1783181922",
       short="Ambulances and mobile clinics"),
  dict(k="safarituff", name="Safarituff", acc="#D4A017", logo=CDN+"Safarituff_20Logo_201.webp?v=1783181922",
       short="Open game vehicles, 4x4 conversions, steel accessories"),
  dict(k="cargocool", name="Cargocool", acc="#3FA9E6", logo=CDN+"CargoCool_20Logo_205_20Approved-01.webp?v=1783181922",
       short="Portable fridge-freezers and cooler boxes"),
  dict(k="deco", name="Decoroof & Decoglaze", acc="#3FAE5A", logo=CDN+"DECO_20ROOF.webp?v=1783181922",
       logo2=CDN+"DECO_20GRAZE.webp?v=1783181923", short="Roofing sheets and polycarbonate glazing, made in Kenya"),
]

# ── line drawings (viewBox 0 0 320 200; gold strokes, one accent) ───────────
def ill(body):
    return ('<svg class="ill" viewBox="0 0 320 200" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" '
            'stroke-linejoin="round" aria-hidden="true">' + body + '</svg>')
A = 'stroke="var(--acc)"'
ILL = dict(
 truck=ill(f'<rect x="34" y="52" width="176" height="92" rx="2"/><path d="M34 144v12h176v-12"/><path d="M210 80h40l22 28v48h-62"/><path d="M222 90h24l14 18h-38z"/><circle cx="78" cy="160" r="13"/><circle cx="238" cy="160" r="13"/><path d="M20 174h284"/><path {A} d="M46 122h152" /><path d="M122 52v92" stroke-dasharray="3 6"/>'),
 pickup=ill(f'<path d="M30 150h260"/><path d="M40 136h236v-22l-30-6-22-30h-64v58"/><path d="M40 136V84h120"/><path {A} d="M44 80h112v-14a8 8 0 0 0-8-8H52a8 8 0 0 0-8 8z"/><path d="M60 66h34v14M104 66h40v14"/><circle cx="88" cy="140" r="14"/><circle cx="236" cy="140" r="14"/><path d="M170 86h42l18 22h-60z"/>'),
 cold=ill(f'<rect x="56" y="46" width="208" height="118" rx="2"/><path d="M176 164V78h56v86"/><path d="M186 122h8"/><path d="M40 164h240"/><path {A} d="M112 76v60M86 91l52 30M86 121l52-30"/><path {A} d="M104 82l8 8 8-8M104 130l8-8 8 8"/><path d="M56 62h208" stroke-dasharray="3 6"/>'),
 special=ill(f'<path d="M24 152h272"/><path d="M36 138h244v-34l-34-8-30-34H90L62 96l-26 8z"/><path d="M96 70h46v26H76zM152 70h56l22 26h-78z"/><circle cx="92" cy="142" r="14"/><circle cx="232" cy="142" r="14"/><path {A} d="M160 30l22 8v16c0 12-9 20-22 26-13-6-22-14-22-26V38z" transform="translate(0 -6) scale(.62) translate(98 14)"/><path {A} d="M150 44h20"/>'),
 fire=ill(f'<path d="M22 156h276"/><rect x="40" y="86" width="150" height="56" rx="2"/><path d="M190 100h44l26 22v20h-70"/><path d="M202 108h26l16 14h-42z"/><circle cx="84" cy="146" r="13"/><circle cx="226" cy="146" r="13"/><path {A} d="M52 86l116-40M64 82l6-12M88 74l6-12M112 66l6-12M136 58l6-12"/><path d="M52 104h36v24H52zM100 104h78"/>'),
 trailer=ill(f'<path d="M20 160h280"/><path d="M52 132h196V84H52z"/><path d="M52 132l-30 8"/><circle cx="22" cy="142" r="4"/><circle cx="176" cy="144" r="13"/><circle cx="212" cy="144" r="13"/><path {A} d="M64 84V62h172v22"/><path d="M92 84v48M132 84v48M172 84v48M212 84v48" stroke-dasharray="3 6"/>'),
 bikebox=ill(f'<path d="M26 160h268"/><circle cx="84" cy="136" r="24"/><circle cx="234" cy="136" r="24"/><path d="M84 136l40-46h46l64 46M124 90l-10-18h-18M170 90l22 46M152 136h40"/><rect {A} x="52" y="50" width="62" height="46" rx="5"/><path {A} d="M52 66h62"/>'),
 boat=ill(f'<path d="M24 132c20 10 30 10 50 0s30-10 50 0 30 10 50 0 30-10 50 0 30 10 50 0" /><path {A} d="M52 112h216l-26 26H82z"/><path d="M118 112V84h58l22 28"/><path d="M130 94h40"/><path d="M24 156c20 10 30 10 50 0s30-10 50 0 30 10 50 0 30-10 50 0 30 10 50 0" stroke-dasharray="3 6"/>'),
 mould=ill(f'<path d="M30 164h260"/><path d="M60 164V96c0-14 10-24 24-24h20c14 0 24 10 24 24v68"/><path d="M60 118h68"/><ellipse {A} cx="216" cy="74" rx="46" ry="12"/><path {A} d="M170 74v78c0 7 20 12 46 12s46-5 46-12V74"/><path d="M170 112c0 7 20 12 46 12s46-5 46-12" stroke-dasharray="3 6"/>'),
 ambulance=ill(f'<path d="M22 158h276"/><path d="M38 144h232v-40l-26-10-22-36H38z"/><path d="M168 66h44l18 30h-62z"/><circle cx="88" cy="148" r="14"/><circle cx="226" cy="148" r="14"/><path {A} d="M88 74v36M70 92h36"/><path {A} d="M40 126h34l8-14 10 26 8-18 6 6h34"/><path d="M130 58v-10h20v10"/>'),
 clinic=ill(f'<path d="M20 160h280"/><rect x="36" y="54" width="170" height="92" rx="2"/><path d="M206 84h40l24 28v34h-64"/><circle cx="82" cy="150" r="13"/><circle cx="236" cy="150" r="13"/><path d="M52 74h40v32H52zM150 74h40v72h-40"/><path {A} d="M121 76v28M107 90h28"/><path d="M218 94h22l14 18h-36z"/>'),
 game=ill(f'<path d="M22 158h276"/><path d="M40 144h240v-26l-40-8-10-18H60l-20 20z"/><path {A} d="M64 92V52h170v40"/><path {A} d="M56 52h186"/><path d="M96 92V66M140 92V66M184 92V66"/><path d="M84 118h24M128 118h24M172 118h24"/><circle cx="94" cy="148" r="15"/><circle cx="230" cy="148" r="15"/>'),
 bullbar=ill(f'<path d="M30 164h260"/><rect x="70" y="46" width="180" height="62" rx="10"/><path d="M92 60h136l10 26H82z"/><rect x="58" y="108" width="204" height="30" rx="6"/><circle cx="92" cy="123" r="8"/><circle cx="228" cy="123" r="8"/><path {A} d="M104 150V96h112v54M104 118h112M140 96v54M180 96v54"/><path d="M76 138v26h28v-26M216 138v26h28v-26"/>'),
 fridge=ill(f'<path d="M40 168h240"/><rect x="74" y="66" width="172" height="92" rx="8"/><path d="M74 92h172"/><path d="M96 66V54h128v12"/><path d="M60 100v36M260 100v36"/><path {A} d="M160 104v40M143 114l34 20M143 134l34-20"/><rect x="204" y="74" width="30" height="10" rx="2"/>'),
 roof=ill(f'<path {A} d="M30 96c10-14 20-14 30 0s20 14 30 0 20-14 30 0 20 14 30 0 20-14 30 0 20 14 30 0 20-14 30 0 20 14 30 0"/><path d="M30 96l24 60M290 96l-24 60"/><path d="M54 156c8-11 16-11 24 0s16 11 24 0 16-11 24 0 16 11 24 0 16-11 24 0 16 11 24 0 16-11 24 0 16 11 20 0"/><path d="M90 96l10 60M150 96v60M210 96l-10 60" stroke-dasharray="3 6"/><path d="M110 60l50-26 50 26"/>'),
 glaze=ill(f'<path d="M44 150l60-96h172l-60 96z"/><path d="M52 160l60-96h172l-60 96z" stroke-dasharray="3 6"/><path {A} d="M84 150l60-96M124 150l60-96M164 150l60-96M204 150l60-96"/><path d="M44 150l8 10M216 150l8 10M276 54l8 10"/>'),
 chain=ill(f'<path d="M30 132h260"/><path {A} d="M30 84h260" stroke-width="2"/><path d="M30 84h260" stroke="currentColor" stroke-width="22" opacity=".12"/><circle cx="58" cy="132" r="6"/><circle cx="126" cy="132" r="6"/><circle cx="194" cy="132" r="6"/><circle cx="262" cy="132" r="6"/><path d="M58 126V96M126 126V96M194 126V96M262 126V96" stroke-dasharray="2 5"/>'),
 solar=ill(f'<path d="M36 168h248"/><rect x="74" y="98" width="172" height="70" rx="2"/><path d="M150 168v-42h26v42"/><path d="M66 98l22-26h144l22 26"/><path d="M110 72l-8 26M140 72l-4 26M170 72v26M200 72l6 26M77 85h166"/><circle {A} cx="258" cy="40" r="13"/><path {A} d="M258 16v6M258 58v6M234 40h6M276 40h6M241 23l4 4M271 53l4 4M275 23l-4 4M245 53l-4 4"/>'),
 reefer=ill(f'<path d="M24 160h272"/><rect x="40" y="64" width="240" height="84" rx="2"/><path d="M70 64v84M100 64v84M130 64v84M160 64v84M190 64v84" stroke-dasharray="3 6"/><rect {A} x="214" y="74" width="56" height="64" rx="3"/><circle {A} cx="242" cy="98" r="12"/><path {A} d="M224 124h36"/><path d="M52 148v12M268 148v12"/>'),
 panel=ill(f'<path d="M52 150l56-96h44l-56 96z"/><path {A} d="M104 150l56-96h30l-56 96z"/><path d="M142 150l56-96h44l-56 96z" stroke-dasharray="3 6"/><path d="M194 150l56-96h20l-56 96z"/><path d="M40 166h240"/>'),
 vent=ill(f'<path d="M40 166h240"/><path d="M110 166v-34h100v34"/><path d="M124 132v-14h72v14"/><ellipse {A} cx="160" cy="82" rx="44" ry="36"/><path {A} d="M160 46c-14 12-14 60 0 72M160 46c14 12 14 60 0 72M128 58c10 14 54 14 64 0M128 106c10-14 54-14 64 0"/>'),
)

def esc(s): return html.escape(s, quote=True)

def head(title, desc, canon, css=(), robots="", theme="#171310"):
    links = "".join(f'\n<link rel="stylesheet" href="/assets/css/{c}.css?v={V}">' for c in ("base",) + tuple(css))
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canon}">{robots}
<meta name="theme-color" content="{theme}">
<meta name="format-detection" content="telephone=no">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Sai Raj">
<meta property="og:url" content="{canon}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="https://sairaj.global/assets/img/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/img/favicon.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/playfair-display-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/poppins-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<script>document.documentElement.classList.add('js');if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('rm');</script>{links}
</head>
'''

def nav(mode="light", enq="/contact/#enquiry", cart=False, current=""):
    """mode: 'light' = always-solid ivory bar (shop, legal); 'auto' = floats over a dark hero and follows the section tone."""
    cls = "nav nav--light nav--static is-solid" if mode == "light" else "nav"
    cur = lambda k: ' aria-current="page"' if k == current else ""
    panel = "".join(f'<a href="/{b["k"]}/"{cur(b["k"])}><b>{b["name"]}</b><span>{b["short"]}</span></a>' for b in BRANDS)
    cart_html = ('    <a class="nav__cart" id="cartLink" href="#cart" role="button" aria-label="Open cart"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h2.4l2 10h8.4l1.8-7H5.2"/><circle cx="7.6" cy="16.4" r="1.1"/><circle cx="14" cy="16.4" r="1.1"/></svg>Cart<span class="n" id="cartBadge1"></span></a>\n') if cart else ""
    mlinks = "".join(f'    <a href="/{b["k"]}/"><span>{i+1:02d}</span>{b["name"].replace("Decoroof & Decoglaze","Decoroof &amp; Decoglaze")}</a>\n' for i, b in enumerate(BRANDS))
    return f'''<!-- nav:start -->
<a class="skip" href="#main">Skip to content</a>
<header class="{cls}" id="nav">
  <div class="wrap nav__in">
    <a class="nav__logo" href="/" aria-label="Sai Raj — home"><img src="/assets/img/logo.webp" width="330" height="120" alt="Sai Raj"></a>
    <nav class="nav__links" aria-label="Main">
      <div class="nav__dd" id="navDd">
        <button type="button" class="nav__ddbtn" id="navDdBtn" aria-expanded="false" aria-controls="navBrands">Brands <svg viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1 1.500l5 5 5-5"/></svg></button>
        <div class="nav__panel" id="navBrands">{panel.replace("Decoroof & Decoglaze","Decoroof &amp; Decoglaze")}</div>
      </div>
      <a href="/cold-chain/"{cur("cold-chain")}>Cold chain</a>
      <a href="/partners/"{cur("partners")}>Partners</a>
      <a href="/shop/"{cur("shop")}>Shop</a>
      <a href="/contact/"{cur("contact")}>Contact</a>
    </nav>
    <a class="btn nav__cta" href="{enq}">Request a quote</a>
{cart_html}    <button class="nav__burger" id="burger" type="button" aria-expanded="false" aria-controls="menu">
      <span class="t-open">Menu</span><span class="t-close">Close</span><i aria-hidden="true"></i>
    </button>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <nav class="menu__links" aria-label="Menu">
{mlinks}    <a href="/cold-chain/"><span>06</span>Cold chain</a>
    <a href="/partners/"><span>07</span>Partners</a>
    <a href="/shop/"><span>08</span>Shop</a>
    <a href="/contact/"><span>09</span>Contact</a>
  </nav>
  <div class="menu__foot">
    <a class="btn" href="{enq}">Request a quote</a>
    <div class="row"><a href="tel:+971543256505">+971 543 256 505</a><a href="mailto:info@sairaj.global">info@sairaj.global</a></div>
    <div class="row"><span>Nairobi · Dubai</span><span>Since 1975</span></div>
  </div>
</div>
<!-- nav:end -->'''

def footer(wa_hidden=False):
    return f'''<!-- foot:start -->
<footer class="foot">
  <div class="wrap">
    <div class="foot__top">
      <div class="foot__brand">
        <img src="/assets/img/logo.webp" width="330" height="120" alt="Sai Raj" loading="lazy">
        <p>Innovation is in our DNA.</p>
      </div>
      <div>
        <h2>Brands</h2>
        <ul>
          <li><a href="/cargotuff/">Cargotuff</a></li>
          <li><a href="/pulse/">Pulse</a></li>
          <li><a href="/safarituff/">Safarituff</a></li>
          <li><a href="/cargocool/">Cargocool</a></li>
          <li><a href="/deco/">Decoroof &amp; Decoglaze</a></li>
        </ul>
      </div>
      <div>
        <h2>Company</h2>
        <ul>
          <li><a href="/#story">Our story</a></li>
          <li><a href="/cold-chain/">Cold chain</a></li>
          <li><a href="/partners/">Partners</a></li>
          <li><a href="/downloads/">Downloads</a></li>
          <li><a href="/shop/">Shop</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </div>
      <div>
        <h2>Contact</h2>
        <address>
          Sai Raj Trading FZCO<br>Jebel Ali Freezone (JAFZA), Dubai, UAE<br>
          <a href="tel:+971543256505">+971 543 256 505</a> · <a href="mailto:info@sairaj.global">info@sairaj.global</a><br>
          Sai Raj Limited, Nairobi · <a href="tel:+254708771100">+254 708 771 100</a><br>
          <a href="https://wa.me/971543256505" rel="noopener">WhatsApp</a> · <a href="https://sairaj.com" rel="noopener">sairaj.com</a>
        </address>
      </div>
    </div>
    <p class="foot__since" aria-hidden="true">Since 1975</p>
    <div class="foot__legal">
      <span>© <span data-year>2026</span> Sai Raj Limited. All rights reserved.</span>
      <a href="/privacy/">Privacy</a>
      <a href="/terms/">Terms</a>
      <a href="/shop/#/rewards">Sai Raj Club</a>
      <a href="/shop/#/game">Desert Dash</a>
      <span class="sp">Proudly made in Kenya · Checkout powered by Shopify</span>
    </div>
  </div>
</footer>

<a class="wa{" is-hidden" if wa_hidden else ""}" id="wa" href="https://wa.me/971543256505?text=Hello%2C%20I%20found%20you%20on%20your%20website%20and%20would%20like%20to%20inquire%20about%20..." rel="noopener" aria-label="Chat on WhatsApp">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.200c1.900 1 3.900 1.500 4.700 1.500 6.600 0 12-5.300 12-11.900C28 8.300 22.600 3 16 3zm6.900 16.900c-.3.8-1.700 1.600-2.400 1.600-.6.100-1.400.100-2.200-.1-.5-.2-1.200-.4-2.100-.8-3.600-1.600-6-5.200-6.200-5.500-.2-.2-1.500-2-1.500-3.800 0-1.800 1-2.700 1.300-3 .3-.4.7-.4 1-.4h.7c.2 0 .5-.1.8.6.3.8 1.100 2.600 1.200 2.800.1.200.2.400 0 .7-.1.200-.2.400-.4.600l-.6.700c-.2.200-.4.400-.2.800.2.400 1 1.700 2.200 2.700 1.500 1.400 2.800 1.800 3.200 2 .4.200.6.200.9-.1.200-.3 1-1.200 1.300-1.600.3-.4.5-.3.9-.2.4.100 2.200 1 2.600 1.200.4.200.6.300.7.500.1.200.1.900-.2 1.700z"/></svg>
</a>
<!-- foot:end -->'''

TOPICS = ["Cold-chain project","Truck bodies","Pick-up bodies","Cold rooms","Refrigerated vehicles","Speciality conversions","Ambulances and mobile clinics",
          "Fire trucks and RIVs","Trailers","Boats","Fibreglass mouldings","4x4 accessories","Roofing and glazing","Retail order","Fleet / trade","Export / international","Other"]
def enquiry(brand="", topic="", title='Tell us what you <em class="it">need.</em>', lede="Tell us the vehicle, the load and the route, and we will reply within one working day."):
    bopts = "".join(f'<option{" selected" if b["name"]==brand else ""}>{esc(b["name"])}</option>' for b in BRANDS)
    topts = "".join(f'<option{" selected" if t==topic else ""}>{t}</option>' for t in TOPICS)
    return f'''<section class="enq" id="enquiry" aria-labelledby="enqTitle">
  <div class="wrap enq__in">
    <div class="enq__lead">
      <p class="eyebrow" data-reveal>Request a quote</p>
      <h2 class="display enq__title" id="enqTitle" data-reveal="clip"><span>{title}</span></h2>
      <p class="lede" data-reveal style="--d:.1s">{lede}</p>
      <dl class="enq__contacts" data-reveal style="--d:.15s">
        <div><dt>Dubai · UAE and the Gulf</dt><dd>Sai Raj Trading FZCO<br>Jebel Ali Freezone (JAFZA), Dubai, UAE<br><a href="tel:+971543256505">+971 543 256 505</a> · <a href="https://wa.me/971543256505" rel="noopener">WhatsApp</a></dd></div>
        <div><dt>Nairobi · head office and production</dt><dd>Sai Raj Limited<br>Sai Raj Building, Baba Dogo Rd, Ruaraka<br><a href="tel:+254708771100">+254 708 771 100</a> · <a href="https://sairaj.com" rel="noopener">sairaj.com</a></dd></div>
        <div><dt>Email</dt><dd><a href="mailto:info@sairaj.global">info@sairaj.global</a></dd></div>
      </dl>
    </div>
    <form class="form" id="enqForm" data-enquiry action="https://formspree.io/f/meebvwwy" method="POST" data-reveal style="--d:.1s" novalidate>
      <p class="form__title">Project enquiry</p>
      <div class="form__grid">
        <label class="f"><span>Name *</span><input name="name" autocomplete="name" required></label>
        <label class="f"><span>Company</span><input name="company" autocomplete="organization"></label>
        <label class="f"><span>Email *</span><input name="email" type="email" autocomplete="email" inputmode="email" required></label>
        <label class="f"><span>Phone / WhatsApp</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel"></label>
        <label class="f"><span>Country</span><input name="country" autocomplete="country-name" placeholder="e.g. UAE, Kenya, KSA"></label>
        <label class="f"><span>Brand</span><select name="brand" id="enqBrand"><option value="">Not sure yet</option>{bopts}</select></label>
        <label class="f f--full"><span>What do you need?</span><select name="topic" id="enqTopic">{topts}</select></label>
        <label class="f f--full"><span>Message *</span><textarea name="message" rows="5" required placeholder="Vehicle, load, route, volume, timeline…"></textarea></label>
      </div>
      <input type="hidden" name="_subject" value="Website enquiry — sairaj.global{(" — " + brand) if brand else ""}">
      <input type="text" name="_gotcha" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="form__foot">
        <button class="btn" type="submit" id="enqSend">Send enquiry {ARR}</button>
        <p class="form__legal">By sending this you agree to our <a href="/privacy/">privacy notice</a>.</p>
      </div>
      <p class="form__msg" id="enqStatus" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>'''

def fam(n, title, text, items, art, note=""):
    lis = "".join(f'<li><b>{a}</b><span>{b}</span></li>' if b else f'<li><b>{a}</b></li>' for a, b in items)
    return f'''<article class="fam" data-reveal>
      <div class="fam__art">{ILL[art]}<span class="fam__n">{n:02d}</span></div>
      <div class="fam__body">
        <h3 class="h2 fam__t">{title}</h3>
        <p class="fam__p">{text}</p>
        <ul class="fam__list">{lis}</ul>{f'<p class="fam__note">{note}</p>' if note else ""}
      </div>
    </article>'''

def others(k):
    cards = "".join(f'<a class="ob" href="/{b["k"]}/" style="--acc:{b["acc"]}"><span class="ob__logo"><img src="{b["logo"]}" alt="{esc(b["name"])}" loading="lazy"></span><span class="ob__t">{b["short"]}</span>{ARR}</a>' for b in BRANDS if b["k"] != k)
    return f'''<section class="obs" data-nav-theme="light"><div class="wrap"><p class="eyebrow" data-reveal>The Sai Raj group</p><h2 class="h2" data-reveal="clip"><span>More from the <em class="it">family.</em></span></h2><div class="obs__grid" data-reveal>{cards}</div></div></section>'''

def brand_page(b, tag, h1, lede, intro, facts, fams, topic, extra=""):
    logos = f'<img src="{b["logo"]}" alt="{esc(b["name"])} by Sai Raj">' + (f'<img src="{b["logo2"]}" alt="Decoglaze by Sai Raj">' if b.get("logo2") else "")
    facts_html = "".join(f'<div><b>{a}</b><span>{c}</span></div>' for a, c in facts)
    fams_html = "\n".join(fam(i + 1, *f) for i, f in enumerate(fams))
    body = f'''<body class="brand" style="--acc:{b["acc"]}">
{nav("auto", "#enquiry", current=b["k"])}
<main id="main">
<section class="bhero" data-wa-off>
  <div class="bhero__grid" aria-hidden="true"></div>
  <div class="wrap bhero__in">
    <div class="bhero__copy">
      <p class="eyebrow" data-reveal>{tag}</p>
      <div class="bhero__logo" data-reveal style="--d:.05s">{logos}</div>
      <h1 class="display bhero__t" data-reveal="clip" style="--d:.1s"><span>{h1}</span></h1>
      <p class="lede" data-reveal style="--d:.2s">{lede}</p>
      <div class="bhero__cta" data-reveal style="--d:.3s"><a class="btn" href="#enquiry">Request a quote {ARR}</a><a class="btn btn--ghost" href="#range">See the range</a></div>
    </div>
    <div class="bhero__art" data-reveal style="--d:.2s">{ILL[fams[0][3]]}</div>
  </div>
</section>
<section class="bintro" data-nav-theme="light">
  <div class="wrap bintro__in">
    <p class="bintro__p" data-reveal>{intro}</p>
    <div class="bintro__facts" data-reveal style="--d:.1s">{facts_html}</div>
  </div>
</section>
<section class="range" id="range" data-nav-theme="light">
  <div class="wrap">
    <header class="sec-head"><p class="eyebrow" data-reveal>The range</p><h2 class="h2" data-reveal="clip"><span>What {b["name"].split(" &")[0]} <em class="it">builds.</em></span></h2></header>
    {fams_html}
  </div>
</section>
{extra}
{others(b["k"])}
{enquiry(b["name"] if b["k"] != "deco" else "Decoroof & Decoglaze", topic)}
</main>
{footer()}
<script src="/assets/js/site.js?v={V}" defer></script>
</body>
</html>
'''
    return body

def write(path, s):
    p = os.path.join(ROOT, path); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "w", encoding="utf-8").write(s); print("wrote", path, len(s))

# ═════════════════════════════ brand pages ═════════════════════════════
B = {b["k"]: b for b in BRANDS}
CSS = ("home", "brand")

write("cargotuff/index.html", head("Cargotuff by Sai Raj — Truck Bodies, Conversions, Trailers &amp; Cold Rooms",
  "Cargotuff by Sai Raj: insulated and dry freight fibreglass, steel and aluminium truck bodies, pick-up bodies, speciality conversions, trailers, boats and cold rooms.",
  "https://sairaj.global/cargotuff/", CSS) + brand_page(B["cargotuff"],
  "A Sai Raj brand · Vehicle bodies",
  'Built to <em class="it">last.</em>',
  "Insulated and dry freight truck bodies, pick-up bodies, conversions, trailers and cold rooms, designed and manufactured by Sai Raj.",
  "Cargotuff bodies are relied upon by East Africa’s leading businesses, transporters and long-distance hauliers to carry everything from frozen ice-cream to day-old chicks, from beef to bread, safely and hygienically.",
  [("Fibreglass", "Composite, steel and aluminium bodies"), ("65–165 mm", "Insulated panel thicknesses"), ("In-house", "Design and manufacture")],
  [
   ("Truck bodies", "Durable, efficient bodies for dry freight, specialised freight and the cold chain, with options to fit your cargo.", [
      ("Rigicore fibreglass", "Robust double-skin panel construction"), ("Single skin fibreglass", "General cargo, single or double doors, floor finish options"),
      ("Insulated bodies", "65, 90, 115 or 165 mm PU, XPS or EPS pressed fibreglass panels for chilled, frozen and deep-frozen loads"),
      ("Ferrotuff", "Polyurethane core with vapour-tight metal cover layers"), ("Open and closed steel", "Corrugated steel bodies; tail lifts can be fitted to any body"),
      ("40 ft bodies", "Insulated or dry cargo, for more payload per trip"), ("Day-old chick bodies", "Insulated and ventilated for live transport")], "truck"),
   ("Pick-up bodies", "Strong, secure bodies that do not add excessive weight to the pick-up, for government fleets, the army, commercial and leisure users.", [
      ("Precise", "Fits without changing the look of the pick-up"), ("Glide", "Multi-purpose, enclosed or windowed"), ("Rave", "Streamlined to reduce drag"),
      ("Insulated fibreglass canopy", "For perishables and temperature-sensitive medical products"), ("Steel canopy", "High load-bearing, sliding windows available"),
      ("Also in the range", "Rhinotop, Inline, Tufftop, V90, Volume Maker")], "pickup"),
   ("Cold rooms and refrigerated vehicles", "Refrigerated space for perishable goods and medical storage, as part of a complete cold chain.", [
      ("Cold rooms and pack houses", ""), ("Solar powered cold rooms", ""), ("Reefer containers", "Intermodal solutions"), ("Refrigerated vehicles", "Including electrification"),
      ("Last mile delivery cool boxes", ""), ("Medical cold rooms", "")], "cold", '<a class="tlink" href="/cold-chain/">The cold chain in full ' + ARR + '</a>'),
   ("Speciality conversions", "Custom-designed bodies and bespoke conversions for specific industries.", [
      ("Police, security and defence", "Patrol, tactical and support vehicles"), ("Cash-in-transit", "Secure vehicles for valuables"), ("Mobile banking, workshops and offices", ""),
      ("Mobile catering and vending", ""), ("Roadshow vehicles", "Mobile platforms for events"), ("Land Cruiser and van conversions", "KEBS approved seats"),
      ("Dog section bodies", ""), ("Garbage compactors, troop carriers, water bowsers", "")], "special"),
   ("Fire trucks and rapid intervention vehicles", "Functional, practical, tough and agile vehicles for emergency response. Each RIV is customised to your specification.", [
      ("Fire suppression, rescue and spill control", ""), ("Crew of three to four", ""), ("Remote command post", "With real-time communications")], "fire"),
   ("Trailers", "Your route details, combined with our fleet knowledge, produce the most suitable trailer.", [
      ("Farm, tipping and sugarcane trailers", ""), ("Food, catering and parcel vending trailers", ""), ("40 ft, fuel tank and water bowser trailers", ""),
      ("Office, workshop and camping trailers", ""), ("Dog and animal trailers, Sherp carriers", "")], "trailer"),
   ("TukTuk conversions and bike boxes", "Durable, lightweight, weather-resistant fibreglass for urban transport and delivery.", [
      ("Fibreglass bike boxes", "Courier and top boxes, with custom branding"), ("TukTuk conversions", "For passenger and freight use")], "bikebox"),
   ("Fibreglass boats", "All fibreglass is hand-laid for hull strength, and every hull is sub-floor filled with high-density foam.", [
      ("Speed, patrol and passenger boats", ""), ("Fishing and work boats", ""), ("Canoes and dinghies", ""), ("Outboard engines", "")], "boat"),
   ("Fibreglass mouldings", "We can mould any design to your specification.", [
      ("Water tanks and filters", ""), ("Furniture and flower pots", ""), ("Kiosks, guard houses, ATMs", ""), ("Play stations and slides", ""), ("3D and special mouldings", "")], "mould"),
  ], "Truck bodies"))

write("pulse/index.html", head("Pulse by Sai Raj — Ambulances &amp; Mobile Clinics",
  "Pulse by Sai Raj: ambulance and mobile clinic conversions on vans, trucks and 4x4s, from patient transport to X-ray vans.",
  "https://sairaj.global/pulse/", CSS) + brand_page(B["pulse"],
  "A Sai Raj brand · Medical vehicles",
  'Built to save <em class="it">lives.</em>',
  "Ambulances, mobile clinics and X-ray vans: East Africa’s trusted expert in medical vehicle conversions.",
  "We build secure, dependable and high-performance ambulances to empower heroes in saving lives. Each vehicle is designed with precision and configured for its medical role, with equipment from trusted suppliers.",
  [("Vans, trucks, 4x4s", "Vehicle platforms"), ("BLS to ALS", "Ambulance configurations"), ("Fibreglass", "Interiors and bodies")],
  [
   ("Ambulances", "Conversions and custom builds for ambulance and patient transport services, built to withstand rough terrain.", [
      ("Basic life support", ""), ("Advanced life support", ""), ("Patient transport", ""), ("For hospitals, NGOs, county governments and private clinics", "")], "ambulance"),
   ("Mobile clinics", "Healthcare taken to where it is needed, in a range of configurations.", [
      ("General mobile clinics", ""), ("X-ray vans", ""), ("Mobile dental and pathology units", ""), ("Mobile laboratories", ""), ("Medical transport and medical waste vehicles", "")], "clinic"),
  ], "Ambulances and mobile clinics"))

write("safarituff/index.html", head("Safarituff by Sai Raj — Game Vehicles, 4x4 Conversions &amp; Steel Accessories",
  "Safarituff by Sai Raj: open game vehicles built tough for the African terrain, 4x4 conversions and steel accessories.",
  "https://sairaj.global/safarituff/", CSS) + brand_page(B["safarituff"],
  "A Sai Raj brand · 4x4 conversions · steel accessories",
  'Built tough for the <em class="it">terrain.</em>',
  "Open game vehicles, 4x4 conversions and steel accessories, designed to be functional, practical and tough.",
  "We have infused our experience in the automotive industry to redesign the traditional open game vehicle, and we back it with the widest range of aftermarket 4x4 accessories to suit your requirements.",
  [("Open game vehicles", "Designed to your spec"), ("Steel", "Accessories, built in-house"), ("18", "Partner brands alongside")],
  [
   ("Tour and safari conversions", "Open game vehicles for national parks, wildlife safaris and off-road trips.", [
      ("Raised seating", ""), ("Open-air or pop-up roofs", ""), ("Non-slip flooring and luggage space", ""), ("Land Cruiser conversions", "Overland expedition vehicles")], "game"),
   ("Steel accessories", "Protection and utility for working and touring 4x4s.", [
      ("Bull bars and nudge bars", ""), ("Rear bars and tow hooks", ""), ("Roof racks, roll bars and side steps", ""), ("Hard lids and soft covers", "Lockable, weather-sealed"),
      ("Awnings and door visors", "")], "bullbar", '<a class="tlink" href="/shop/#/shop/4x4">Shop 4x4 accessories ' + ARR + '</a>'),
  ], "4x4 accessories"))

write("cargocool/index.html", head("Cargocool by Sai Raj — Portable Fridge-Freezers &amp; Cooler Boxes",
  "Cargocool by Sai Raj: DC portable fridge-freezers and cooler boxes for the road, the camp and the job site.",
  "https://sairaj.global/cargocool/", CSS) + brand_page(B["cargocool"],
  "A Sai Raj brand · Portable cooling",
  'Make your adventures <em class="it">cooler.</em>',
  "DC portable fridge-freezers and cooler boxes that keep food and drinks cool and fresh, wherever the road goes.",
  "Whether it is a weekend camping trip or a long road journey, a Cargocool fridge-freezer travels with you: in the boot, on the pick-up bed or on a drawer system.",
  [("12 V DC", "Runs from the vehicle"), ("4", "Fridge-freezer models"), ("45 L and 90 L", "Cooler boxes")],
  [
   ("DC portable fridge-freezers", "Compressor cooling with digital temperature control and low power draw.", [
      ("DC-15F", ""), ("GC40", ""), ("GC40e", ""), ("GC40p", "")], "fridge", '<a class="tlink" href="/shop/#/shop/Cooling">Shop cooling ' + ARR + '</a>'),
   ("Cooler boxes", "Thick insulation for desert weekends, fishing trips and site work.", [
      ("Cargocool Cooler Box 45 L", ""), ("Cargocool Cooler Box 90 L", "")], "cold"),
  ], "Retail order"))

write("deco/index.html", head("Decoroof &amp; Decoglaze by Sai Raj — Roofing Sheets &amp; Polycarbonate Glazing",
  "Decoroof uPVC roofing sheets and Decoglaze polycarbonate sheets, proudly made in Kenya by Sai Raj.",
  "https://sairaj.global/deco/", CSS) + brand_page(B["deco"],
  "Two Sai Raj brands · Building and construction",
  'Proudly made in <em class="it">Kenya.</em>',
  "Decoroof roofing sheets and Decoglaze polycarbonate glazing, for domestic, industrial and agricultural buildings.",
  "Decoroof is our registered brand for roofing products. Decoglaze is our registered brand for twin-wall polycarbonate sheets. We offer a full design-and-build service or supply only.",
  [("uPVC", "Two-layer co-extruded roofing"), ("8 mm", "Decoglaze sheet thickness"), ("10", "Decoroof colours")],
  [
   ("Decoroof roofing", "Anti-corrosive corrugated uPVC that resists chemicals, fire and impact, for roofing, siding and cladding.", [
      ("uPVC roofing sheets", "ASA Red, Brick Red, Green, Beige, Blue, Brown, White, Clear, Clearsol Green, Clearsol Blue"),
      ("Fibreglass translucent sheets", "In various corrugations and thicknesses"), ("Ridge caps and barge boards", ""), ("PVC ceiling panels", "")], "roof"),
   ("Decoglaze polycarbonate", "Transparent, light, strong, flexible and insulating. Easy to fit.", [
      ("Twin-wall polycarbonate sheets", "12.0 m × 2.10 m, 8 mm"), ("Roofing, car ports, canopies and awnings", ""), ("Domes and greenhouses", ""), ("Glazing for partitions, doors and cubicles", "")], "glaze"),
   ("Roof ventilators", "Wind-driven stainless steel ventilators that extract hot air, moisture, fumes and dust without electricity.", [
      ("For warehouses, factories, schools and public buildings", "")], "vent"),
  ], "Roofing and glazing"))

# ═════════════════════════════ cold chain ═════════════════════════════
def step(n, title, text, art):
    return f'<li class="cc" data-reveal><div class="cc__art">{ILL[art]}</div><span class="cc__n">{n:02d}</span><h3 class="h3">{title}</h3><p>{text}</p></li>'
cold = f'''<body class="brand" style="--acc:#3FA9E6">
{nav("auto", "#enquiry", current="cold-chain")}
<main id="main">
<section class="bhero" data-wa-off>
  <div class="bhero__grid" aria-hidden="true"></div>
  <div class="wrap bhero__in">
    <div class="bhero__copy">
      <p class="eyebrow" data-reveal>Sai Raj · Cold chain</p>
      <h1 class="display bhero__t" data-reveal="clip" style="--d:.1s"><span>Cold, <em class="it">unbroken.</em></span></h1>
      <p class="lede" data-reveal style="--d:.2s">From the farm to the buyer, one group builds every link: the insulated body, the refrigeration, the cold room and the last-mile box.</p>
      <div class="bhero__cta" data-reveal style="--d:.3s"><a class="btn" href="#enquiry">Plan a cold chain {ARR}</a><a class="btn btn--ghost" href="#links">See every link</a></div>
    </div>
    <div class="bhero__art" data-reveal style="--d:.2s">{ILL["chain"]}</div>
  </div>
</section>
<section class="bintro" data-nav-theme="light">
  <div class="wrap bintro__in">
    <p class="bintro__p" data-reveal>Sai Raj is a pioneer of cold room technology. Under the Cargotuff name we build bodies that carry frozen ice-cream, day-old chicks, beef and bread, and cold rooms that hold perishable goods and medical supplies.</p>
    <div class="bintro__facts" data-reveal style="--d:.1s"><div><b>65–165 mm</b><span>Insulated panel thicknesses</span></div><div><b>Chilled to deep-frozen</b><span>Body applications</span></div><div><b>Thermo King</b><span>Official dealer</span></div></div>
  </div>
</section>
<section class="range" id="links" data-nav-theme="light">
  <div class="wrap">
    <header class="sec-head"><p class="eyebrow" data-reveal>Every link</p><h2 class="h2" data-reveal="clip"><span>What we build for the <em class="it">chain.</em></span></h2></header>
    <ul class="ccgrid">
      {step(1, "Insulated truck bodies", "Pressed fibreglass panels with a PU, XPS or EPS core, in 65, 90, 115 or 165 mm, for chilled, frozen and deep-frozen loads.", "panel")}
      {step(2, "Refrigerated vehicles", "Bodies matched to their refrigeration. Sai Raj is a Thermo King official dealer and a Rivacold partner.", "truck")}
      {step(3, "Cold rooms and pack houses", "Lockable insulated doors that open from inside, stainless steel or fibreglass floors, racking to suit, digital temperature control and a monitoring recorder.", "cold")}
      {step(4, "Solar powered cold rooms", "Cold storage powered by the sun, for sites where the grid is costly or absent.", "solar")}
      {step(5, "Reefer containers", "Intermodal solutions for moving and holding temperature-controlled cargo.", "reefer")}
      {step(6, "Last mile and electrification", "Delivery cool boxes for the final leg, and electrification of refrigerated vehicles.", "bikebox")}
    </ul>
    <p class="cc__more" data-reveal>Medical cold room solutions are available too, with an optional standby refrigeration system.</p>
  </div>
</section>
<section class="sectors" id="sectors" data-nav-theme="light" aria-labelledby="sectorsTitle">
  <div class="wrap">
    <header class="sec-head"><p class="eyebrow" data-reveal>Who it is for</p><h2 class="h2" id="sectorsTitle" data-reveal="clip"><span>Built for what <em class="it">cannot wait.</em></span></h2></header>
    <ul class="sectors__grid sectors__grid--plain">
      <li class="sector" data-reveal><span class="sector__n">01</span><h3 class="h3">Horticulture</h3><p>Fresh produce kept cold from harvest to handover.</p></li>
      <li class="sector" data-reveal style="--d:.08s"><span class="sector__n">02</span><h3 class="h3">Floriculture</h3><p>Cut flowers are unforgiving. The chain cannot break between farm and buyer.</p></li>
      <li class="sector" data-reveal style="--d:.16s"><span class="sector__n">03</span><h3 class="h3">Dairy</h3><p>Milk and dairy held cold through collection, processing and distribution.</p></li>
      <li class="sector" data-reveal style="--d:.24s"><span class="sector__n">04</span><h3 class="h3">Meat processing</h3><p>Insulated bodies and cold rooms for chilled and frozen product.</p></li>
    </ul>
  </div>
</section>
{others("")}
{enquiry("Cargotuff", "Cold-chain project", 'Tell us what needs to stay <em class="it">cold.</em>', "Tell us the load, the route and the volume, and we will reply within one working day.")}
</main>
{footer()}
<script src="/assets/js/site.js?v={V}" defer></script>
</body>
</html>
'''
write("cold-chain/index.html", head("Cold Chain — Sai Raj | Insulated Bodies, Refrigerated Vehicles &amp; Cold Rooms",
  "Complete cold chain solutions from Sai Raj: insulated truck bodies, refrigerated vehicles, cold rooms and pack houses, solar cold rooms, reefer containers and last-mile cool boxes.",
  "https://sairaj.global/cold-chain/", CSS) + cold)

# ═════════════════════════════ partners ═════════════════════════════
PARTNERS = [
 ("Cold chain and truck equipment", [("Thermo King", "Official dealer. Transport refrigeration."), ("Rivacold", ""), ("Dhollandia", ""), ("Comet Officine", "")]),
 ("4x4 and overland", [("Ironman 4x4", "Bull bars, suspension, recovery equipment, lighting and camping gear."), ("Alu-Cab", "Aluminium canopies, roof tents and campers."),
    ("TRE 4x4", "Bumpers, roof tents, recovery gear and winches."), ("MCC 4x4 Accessories", ""), ("KSL 4x4", ""), ("Winbo", ""), ("Alublack Outdoor", ""), ("Maxxis Tires", "")]),
 ("Canopies and load beds", [("Carryboy", "Canopies, lids, roll bars, side steps and pick-up accessories."), ("Smarttop", "Fibreglass canopies, hardtops and deck covers."),
    ("SmartCap", "The modular stainless steel truck cap system."), ("Aeroklas", "Bedliners, canopies, roller lids and utility boxes.")]),
 ("Car care and protection", [("Diamondbrite", "Ceramic paint, fabric and leather protection."), ("LLumar", "Automotive window film.")]),
]
pgroups = "".join(f'<section class="pg" data-reveal><h2 class="pg__t">{g}</h2><ul class="pg__list">' +
    "".join(f'<li><b>{n}</b>{f"<span>{d}</span>" if d else ""}</li>' for n, d in items) + '</ul></section>' for g, items in PARTNERS)
write("partners/index.html", head("Partners — Sai Raj", "The 18 brands Sai Raj represents and builds with, from Thermo King and Rivacold to Ironman 4x4, Alu-Cab and Carryboy.",
  "https://sairaj.global/partners/") + f'''<body>
{nav("light", current="partners")}
<main id="main" class="page">
  <div class="wrap">
    <header class="page__head"><p class="eyebrow">Our partners</p><h1>The brands we build <em class="it">with.</em></h1><p>By collaborating with global brands, we give our customers access to the latest innovations and technologies. All names and marks belong to their owners.</p></header>
    <div class="pgs">{pgroups}</div>
    <p style="margin-top:48px;display:flex;flex-wrap:wrap;gap:12px"><a class="btn" href="/contact/#enquiry">Request a quote {ARR}</a><a class="btn btn--line" href="/shop/">Visit the shop</a></p>
  </div>
</main>
{footer()}
<script src="/assets/js/site.js?v={V}" defer></script>
</body>
</html>
''')

# ═════════════════════════════ contact ═════════════════════════════
LOC = [
 ("Dubai · UAE and the Gulf", "Sai Raj Trading FZCO", "Jebel Ali Freezone (JAFZA), Dubai, UAE", [("tel:+971543256505", "+971 543 256 505"), ("mailto:info@sairaj.global", "info@sairaj.global"), ("https://wa.me/971543256505", "WhatsApp")]),
 ("Nairobi · Head office and production", "Sai Raj Limited", "Sai Raj Building, Baba Dogo Rd, Ruaraka, Nairobi", [("tel:+254708771100", "+254 708 771 100"), ("mailto:info@sairaj.com", "info@sairaj.com")]),
 ("Nairobi · Showroom, Mombasa Road", "Sai Raj Showroom", "Mombasa Road, between Eka Hotel and Belle Vue", [("tel:+254719247640", "+254 719 247 640"), ("mailto:showroom@sairaj.com", "showroom@sairaj.com")]),
 ("Nairobi · Showroom, Village Market", "Sai Raj Showroom", "Village Market, Old Wing, 1st Floor", [("tel:+254717000011", "+254 717 000 011"), ("mailto:villagemarket@sairaj.com", "villagemarket@sairaj.com")]),
 ("Nairobi · After sales centre", "Sai Raj After Sales", "Kenafric Business Centre, Baba Dogo Rd, Ruaraka, Warehouse B-18", [("tel:+254759450450", "+254 759 450 450"), ("mailto:aftersales@sairaj.com", "aftersales@sairaj.com")]),
]
REL = ' rel="noopener"'
locs = "".join(f'<li class="loc" data-reveal><p class="loc__k">{k}</p><h2 class="loc__t">{t}</h2><p class="loc__a">{a}</p><p class="loc__l">' +
    " · ".join(f'<a href="{h}"{REL if h.startswith("http") else ""}>{l}</a>' for h, l in links) + '</p></li>' for k, t, a, links in LOC)
write("contact/index.html", head("Contact — Sai Raj | Dubai and Nairobi", "Contact Sai Raj Trading FZCO in Jebel Ali Freezone, Dubai, or Sai Raj Limited in Nairobi: head office, showrooms and after sales.",
  "https://sairaj.global/contact/", ("home", "brand")) + f'''<body class="brand">
{nav("light", "#enquiry", current="contact")}
<main id="main">
<section class="page page--tight">
  <div class="wrap">
    <header class="page__head"><p class="eyebrow">Contact</p><h1>Two countries, one <em class="it">team.</em></h1><p>Production in Nairobi, and a Gulf home in Jebel Ali, Dubai.</p></header>
    <ul class="locs">{locs}</ul>
  </div>
</section>
{enquiry()}
</main>
{footer()}
<script src="/assets/js/site.js?v={V}" defer></script>
</body>
</html>
''')

# ═════════════════════════════ downloads ═════════════════════════════
PROFILE = "assets/docs/sai-raj-company-profile-2026.pdf"      # built by tools/build_profile.py + tools/render-profile.mjs
_pp = os.path.join(ROOT, PROFILE)
PROFILE_META = "Company profile · 2026 edition · PDF, 20 pages" + (f", {os.path.getsize(_pp) / 1e6:.1f} MB" if os.path.exists(_pp) else "")
write("downloads/index.html", head("Downloads — Sai Raj", "Download the Sai Raj company profile, 2026 edition. New brand catalogues are in production.", "https://sairaj.global/downloads/") + f'''<body>
{nav("light", current="downloads")}
<main id="main" class="page">
  <div class="wrap">
    <header class="page__head"><p class="eyebrow">Downloads</p><h1>Profile and <em class="it">catalogues.</em></h1><p>The 2026 company profile is ready to download. New brand catalogues are in production.</p></header>
    <ul class="dls">
      <li class="dl"><div><p class="dl__k">{PROFILE_META}</p><h2 class="dl__t">Sai Raj company profile</h2></div><a class="btn" href="/{PROFILE}" download>Download {ARR}</a></li>
      <li class="dl dl--soon"><div><p class="dl__k">In production</p><h2 class="dl__t">Cargotuff and cold chain catalogue</h2></div><span class="dl__tag">Coming soon</span></li>
      <li class="dl dl--soon"><div><p class="dl__k">In production</p><h2 class="dl__t">Pulse catalogue</h2></div><span class="dl__tag">Coming soon</span></li>
      <li class="dl dl--soon"><div><p class="dl__k">In production</p><h2 class="dl__t">Safarituff and Cargocool catalogues</h2></div><span class="dl__tag">Coming soon</span></li>
      <li class="dl dl--soon"><div><p class="dl__k">In production</p><h2 class="dl__t">4x4 parts catalogue</h2></div><span class="dl__tag">Coming soon</span></li>
    </ul>
    <p style="margin-top:40px">Need a specific catalogue now? <a class="tlink" href="/contact/#enquiry">Ask us {ARR}</a></p>
  </div>
</main>
{footer()}
<script src="/assets/js/site.js?v={V}" defer></script>
</body>
</html>
''')

# ═════════════════ re-inject nav + footer into the existing pages ═════════════════
def inject(path, nav_html, foot_html):
    p = os.path.join(ROOT, path); s = open(p, encoding="utf-8").read()
    s = re.sub(r"<!-- nav:start -->.*?<!-- nav:end -->", lambda m: nav_html, s, flags=re.S)
    s = re.sub(r"<!-- foot:start -->.*?<!-- foot:end -->", lambda m: foot_html, s, flags=re.S)
    open(p, "w", encoding="utf-8").write(s); print("injected", path)

def remark(path):
    """one-time: wrap the old nav/footer of the simple pages in markers"""
    p = os.path.join(ROOT, path); s = open(p, encoding="utf-8").read()
    if "nav:start" in s: return
    a = s.index('<a class="skip"'); b = s.index("<main")
    s = s[:a] + "<!-- nav:start --><!-- nav:end -->\n\n" + s[b:]
    fa = s.index('<footer class="foot">'); fb = s.index("</a>\n", s.index('<a class="wa')) + 5
    s = s[:fa] + "<!-- foot:start --><!-- foot:end -->\n" + s[fb:]
    open(p, "w", encoding="utf-8").write(s)

for f in ("privacy/index.html", "terms/index.html", "404.html"):
    remark(f); inject(f, nav("light"), footer())
inject("index.html", nav("auto", "#enquiry"), footer(wa_hidden=True))
inject("shop/index.html", nav("light", cart=True, current="shop"), footer())

# ═════════════════ home page blocks (brands, partners strip, enquiry) ═════════════════
HOME_BRANDS = [
 ("cargotuff", "Cargotuff", B["cargotuff"]["logo"], "truck", "Truck and pick-up bodies, conversions, trailers, boats and cold rooms."),
 ("pulse", "Pulse", B["pulse"]["logo"], "ambulance", "Ambulances and mobile clinics."),
 ("safarituff", "Safarituff", B["safarituff"]["logo"], "game", "Open game vehicles, 4x4 conversions and steel accessories."),
 ("cargocool", "Cargocool", B["cargocool"]["logo"], "fridge", "Portable fridge-freezers and cooler boxes."),
 ("deco", "Decoroof", B["deco"]["logo"], "roof", "uPVC roofing sheets, proudly made in Kenya."),
 ("deco", "Decoglaze", B["deco"]["logo2"], "glaze", "Twin-wall polycarbonate glazing, proudly made in Kenya."),
]
cards = "".join(f'''
      <li data-reveal style="--d:{i%3*0.08:.2f}s"><a class="bc" href="/{k}/" style="--acc:{B[k]["acc"]}">
        <span class="bc__logo"><img src="{logo}" alt="{name} by Sai Raj" loading="lazy"></span>
        <span class="bc__art">{ILL[art]}</span>
        <span class="bc__t">{text}</span>
        <span class="bc__go">Explore {name} {ARR}</span>
      </a></li>''' for i, (k, name, logo, art, text) in enumerate(HOME_BRANDS))
brands_block = f'''<!-- brands:start -->
<section class="brands" id="brands" aria-labelledby="brandsTitle">
  <div class="wrap">
    <header class="sec-head sec-head--dark">
      <p class="eyebrow" data-reveal>The group</p>
      <h2 class="h2" id="brandsTitle" data-reveal="clip"><span>One company. Six <em class="it">brands.</em></span></h2>
      <p class="lede" data-reveal style="--d:.1s">Sai Raj is Kenya’s leading fibreglass moulder, commercial vehicle body manufacturer and vehicle conversion specialist. Each brand carries one part of that work.</p>
    </header>
    <ul class="brands__grid">{cards}
    </ul>
  </div>
</section>
<!-- brands:end -->'''
names = [n for _, items in PARTNERS for n, _ in items]
row = lambda xs: "".join(f"<span>{n}</span>" for n in xs)
pstrip_block = f'''<!-- pstrip:start -->
<section class="pstrip" aria-labelledby="pstripTitle">
  <div class="wrap pstrip__head">
    <p class="eyebrow" id="pstripTitle" data-reveal>Our partners</p>
    <a class="tlink" href="/partners/" data-reveal>All 18 partners {ARR}</a>
  </div>
  <div class="pstrip__rows" aria-hidden="true">
    <div class="pstrip__row"><div>{row(names[:9])}{row(names[:9])}</div></div>
    <div class="pstrip__row pstrip__row--b"><div>{row(names[9:])}{row(names[9:])}</div></div>
  </div>
  <p class="sr-only">{", ".join(names)}.</p>
</section>
<!-- pstrip:end -->'''
enq_block = "<!-- enq:start -->\n" + enquiry("", "Cold-chain project", 'Tell us what needs to stay <em class="it">cold.</em>',
    "Truck bodies, cold rooms, refrigeration or fibreglass fabrication. Tell us the load, the route and the volume, and we will reply within one working day.") + "\n<!-- enq:end -->"
p = os.path.join(ROOT, "index.html"); s = open(p, encoding="utf-8").read()
for tag, block in (("brands", brands_block), ("pstrip", pstrip_block), ("enq", enq_block)):
    s = re.sub(rf"<!-- {tag}:start -->.*?<!-- {tag}:end -->", lambda m: block, s, flags=re.S)
open(p, "w", encoding="utf-8").write(s); print("home blocks injected")

# ═════════════════════════════ sitemap ═════════════════════════════
LASTMOD = "2026-11-13"
SITEMAP = [("", "monthly", "1.0"), ("cargotuff/", "monthly", "0.9"), ("cold-chain/", "monthly", "0.9"), ("pulse/", "monthly", "0.8"), ("safarituff/", "monthly", "0.8"),
           ("cargocool/", "monthly", "0.8"), ("deco/", "monthly", "0.8"), ("shop/", "weekly", "0.8"), ("partners/", "monthly", "0.6"), ("contact/", "monthly", "0.7"),
           ("downloads/", "monthly", "0.5"), ("privacy/", "yearly", "0.2"), ("terms/", "yearly", "0.2")]
open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
    f"  <url><loc>https://sairaj.global/{u}</loc><lastmod>{LASTMOD}</lastmod><changefreq>{c}</changefreq><priority>{pr}</priority></url>\n" for u, c, pr in SITEMAP) + "</urlset>\n")
print("sitemap.xml", len(SITEMAP), "urls")
