#!/usr/bin/env python3
"""Builds the Sai Raj product and parts catalogue (A4): tools/out/parts.html.
Then `node tools/render-pdf.mjs parts` prints assets/docs/sai-raj-product-catalogue-2026.pdf.

Input is tools/data/parts.json and the photo crops in tools/out/parts/, both made from the original
catalogue by tools/parts_extract.py. Table rows are carried over verbatim: descriptions, part numbers
and units are never edited here. Only page headings are tidied (see HEAD_FIX)."""
import json, math, html, re
from srpdf import *

D = json.load(open(os.path.join(ROOT, "tools", "data", "parts.json"), encoding="utf-8"))
P = {p["n"]: p for p in D["pages"]}
V = D["vehicles"]
IMG = "/tools/out/parts/"
esc = html.escape
doc = Doc("Sai Raj · Product Catalogue 2026", "Sai Raj — Product and Parts Catalogue 2026"); pg = doc.pg
HPATH = os.path.join(OUT, "parts-heights.json")       # real row heights from tools/measure-parts.mjs (second pass); estimates are used without it
HEIGHTS = json.load(open(HPATH)) if os.path.exists(HPATH) else {}
out_map = dict(vehicles=[], pages={})         # where each original page / vehicle lands, for tools/parts_verify.py

# headings only: three slips in the original's headings, and one page whose heading was left over from another page
HEAD_FIX = {"BULLBAR LGHTS & LED WORK LIGHTS": "BULLBAR LIGHTS & LED WORK LIGHTS", "LIGHT ACCESSOIRES": "LIGHT ACCESSORIES", "CARGGOTUFF CONVERSIONS": "CARGOTUFF CONVERSIONS"}
TITLE_FROM_SECTION = {81}
KEEP = {"led": "LED", "sr": "SR", "upvc": "uPVC", "riv": "RIV", "atms": "ATMs", "cargotuff": "Cargotuff", "decoroof": "Decoroof", "atlas": "Atlas", "diamondbrite": "Diamondbrite",
        "ironman4x4": "Ironman 4x4", "pulse": "Pulse", "nitrogas": "Nitro Gas", "foamcell": "Foam Cell", "pro": "Pro", "roofracks": "roof racks", "roofrack": "roof rack",
        "rollbars": "roll bars", "roofrails,": "Roof rails,", "leafsprings": "leaf springs", "coldrooms": "cold rooms", "firetruck": "fire truck", "pickup": "pick-up"}
def nice(s):
    s = HEAD_FIX.get(s, s); words = [KEEP.get(w.lower(), w.lower()) for w in s.split()]
    t = " ".join(words); return t[:1].upper() + t[1:]

def hdr(eyebrow, title, right=""):
    return f'<header class="ph"><div><p class="eb">{esc(eyebrow)}</p><h2>{esc(title)}</h2></div>{right}</header>'
def row(x, k=""):
    return f'<div class="r"{k and f" data-k={k}"}><span class="sn">{esc(x["sn"])}</span><span class="d">{esc(x["desc"])}</span><span class="pn">{esc(x["part"])}</span><span class="um">{esc(x["uom"])}</span></div>'
COLHEAD = '<div class="ch"><span>S/N</span><span>Item description</span><span>Part no.</span><span>UOM</span></div>'
def catbar(name, cont=False): return f'<h3 class="cat">{esc(HEAD_FIX.get(name, name))}{"<i>continued</i>" if cont else ""}</h3>'
def lines_of(x): return max(1, math.ceil(len(x["desc"]) / 52), math.ceil(len(x["part"]) / 19))      # deliberately cautious: over-counting only leaves a little space

# ── front matter ──
pg("dark cover", "", '''<header class="cv__top"><img src="/assets/img/logo.webp" alt="Sai Raj"><span>Catalogue<br><b>2026</b></span></header>
<div class="cv__t"><p class="eb">4x4 accessories · Part numbers · Vehicle bodies</p><h1>Product and parts <em>catalogue.</em></h1>
<p class="lede">4x4 accessories, part numbers by vehicle, and the Cargotuff range of bodies, trailers and conversions.</p></div>
<div class="mosaic">''' + "".join(f'<img src="{IMG}veh-{n:03d}.jpg" alt="">' for n in (84, 118, 142, 166, 196)) + '''</div>
<p class="cv__foot"><span>sairaj.global</span><span>sairaj.com</span></p>''')
pg("light", "Contents", head("Contents", "What is <em>inside.</em>") + '<ol class="toc"><!--toc--></ol>'
   '<div class="push about"><p class="eb">How to use this catalogue</p><p>Part 03 lists the accessories for each vehicle, with the part number to quote when you order. '
   'Parts 01 and 02 show the products themselves. Where a part number is blank, ask us for the current reference.</p></div>')
pg("light", "Find your vehicle", head("Find your vehicle", "Accessories by <em>vehicle.</em>") + '<div class="vidx"><!--vidx--></div>')

def divider(num, title_html, lede, plain, note):
    doc.section(plain, note)
    pg("dark", plain, f'<p class="eb">Part {num}</p><h2 class="h">{title_html}</h2><p class="lede">{lede}</p><b class="big">{num}</b>')

def plate_page(n, part):
    p = P[n]; w, h = p["plate_size"]; sc = min(178 / w, 231 / h)
    out_map["pages"][n] = pg("light parts", nice(p["section"]), hdr(part, nice(p["section"])) +
        f'<div class="plate"><img src="{IMG}{p["plate"]}" style="width:{w*sc:.1f}mm;height:{h*sc:.1f}mm" alt=""></div>')
def products_page(n, part):
    p = P[n]; title = p["section"] if (n in TITLE_FROM_SECTION or not p["title"]) else p["title"]
    body = COLHEAD + "".join((catbar(t["cat"]) if t["cat"] else "") + "".join(row(x) for x in t["rows"]) for t in p["tables"])
    shot = f'<div class="shot" style="flex:0 1 {178 * p["photo_size"][1] / p["photo_size"][0]:.1f}mm"><img src="{IMG}{p["photo"]}" alt=""></div>' if p.get("photo") else ""
    out_map["pages"][n] = pg("light parts", nice(p["section"]), hdr(f'{part} · {nice(p["section"])}', nice(title)) + f'<div class="tb">{body}</div>' + shot)
def run(pages, part):
    for n in pages:
        t = P[n]["type"]
        if t == "plate": plate_page(n, part)
        elif t == "products": products_page(n, part)

# ── 01 the range, 02 products ──
divider("01", "The <em>range.</em>", "Bull bars, side steps, rear bars, roof racks, roll bars, underbody protection, tonneau covers, roller lids and canopies.", "The range", "Bull bars, side steps, roof racks, canopies")
run(range(2, 41), "The range")
divider("02", "Products and <em>part numbers.</em>", "Recovery gear, camping, lighting, electrical, storage, rims, suspension, brakes and car care, with the part number for each item.", "Products and part numbers", "Recovery, camping, lighting, storage, suspension")
run(range(42, 84), "Products")

# ── 03 accessories by vehicle ──
divider("03", "Accessories by <em>vehicle.</em>", f"Part numbers for {len(V)} vehicles from Toyota, Ford, Isuzu, Mitsubishi, Nissan, Mahindra and Changan, and for vans.", "Accessories by vehicle", "Toyota, Ford, Isuzu, Mitsubishi, Nissan, Mahindra, Changan, vans")
ROW, WRAP, CAT, CAT1 = 6.18, 4.07, 9.0, 6.4      # mm, measured in the browser at this type size (CAT1: a heading at the top of a page)
FIRST, NEXT = 216.0, 246.0                       # mm of table on a vehicle's first and following pages; the print step fails if a page runs over
for vi, v in enumerate(V):
    name = f'{v["make"]} {v["model"]}'; var = " · ".join(v["variant"])
    items = []
    for t in v["tables"]:
        k = f"v{vi}-{len(items)}"
        if "note" in t: items.append(("note", t["note"], HEIGHTS.get(k) or 10.0 + 3.7 * (len(t["note"]) // 105), k))
        else:
            items.append(("cat", t["cat"], CAT, k))
            for x in t["rows"]:
                k = f"v{vi}-{len(items)}"; items.append(("row", x, HEIGHTS.get(k) or ROW + WRAP * (lines_of(x) - 1), k))
    pages_html, cur, used, cap, cat, ncat = [], [], 0.0, FIRST, None, 0
    i = 0
    while i < len(items):
        kind, val, hgt, k = items[i]
        if kind == "cat" and ncat == 0: hgt = CAT1
        need = hgt + (sum(x[2] for x in items[i + 1:i + 3] if x[0] == "row") if kind == "cat" else 0)     # a heading keeps two rows with it
        if used + need > cap and cur:
            pages_html.append("".join(cur)); cur, used, cap, ncat = [], 0.0, NEXT, 0
            if kind == "row" and cat: cur.append(catbar(cat, True)); used += CAT1; ncat = 1
            if kind == "cat": hgt = CAT1
        if kind == "cat": cat = val; cur.append(catbar(val)); ncat += 1
        elif kind == "row": cur.append(row(val, k))
        else: cur.append(f'<p class="fn" data-k={k}>{esc(val)}</p>'); cat = None
        used += hgt; i += 1
    if cur: pages_html.append("".join(cur))
    first = None
    for k, body in enumerate(pages_html):
        if k == 0:
            top = (f'<header class="vh"><div><p class="eb">Accessories to suit · {esc(v["make"])}</p><h2>{esc(name)}</h2><p class="var">' + "".join(f"<span>{esc(x)}</span>" for x in v["variant"]) +
                   f'</p></div><img src="{IMG}{v["photo"]}" alt=""></header>')
        else:
            top = f'<header class="vh vh--c"><p class="eb">{esc(name)} · {esc(var)}</p><span>Continued · {k+1} of {len(pages_html)}</span></header>'
        n = pg("light parts", name, top + f'<div class="tb">{COLHEAD}{body}</div>'); first = first or n
    out_map["vehicles"].append(dict(name=name, variant=var, src=v["pages"], out=[first, first + len(pages_html) - 1]))

# ── 04 cargotuff, 05 mouldings and deco, 06 new arrivals ──
divider("04", "Cargotuff bodies, trailers and <em>conversions.</em>", "Pick-up and truck bodies, trailers, cold rooms, boats, kiosks, motorbike boxes and vehicle conversions.", "Cargotuff bodies, trailers and conversions", "Bodies, trailers, boats, ambulances, fire trucks")
run(range(220, 262), "Cargotuff")
divider("05", "Mouldings and <em>Deco.</em>", "Furniture and special mouldings, Decoroof roofing sheets, ceilings and polycarbonate.", "Mouldings and Deco", "Special mouldings, Decoroof, polycarbonate")
run(range(264, 267), "Mouldings and Deco")
divider("06", "New <em>arrivals.</em>", "The latest additions to the range.", "New arrivals", "The latest additions")
run(range(268, 278), "New arrivals")

pg("dark back", "", '<div class="bk"><img src="/assets/img/logo.webp" alt="Sai Raj"><h2>Innovation is in our <em>DNA.</em></h2><p>sairaj.global · sairaj.com</p><p class="sm">Proudly made in Kenya.</p></div>')

# vehicle index on page 3
makes = []
for v, m in zip(V, out_map["vehicles"]):
    new = not makes or makes[-1][0] != v["make"]
    if new: makes.append((v["make"], []))
    makes[-1][1].append(f'<li>{f"""<p class="eb">{esc(v["make"])}</p>""" if new else ""}<b>{esc(v["model"])}</b><span>{esc(" · ".join(v["variant"]))}</span><i>{m["out"][0]:03d}</i></li>')
doc.pages[2] = doc.pages[2].replace("<!--vidx-->", "".join(f'<ul class="vmake">{"".join(li)}</ul>' for mk, li in makes))
json.dump(out_map, open(os.path.join(OUT, "parts-map.json"), "w"))

doc.write("parts", '''
.toc{margin-top:11mm;counter-reset:c}
.toc li{counter-increment:c;display:grid;grid-template-columns:13mm 1fr auto;align-items:baseline;padding:3.7mm 0;border-top:.25mm solid #E8DFC9}
.toc li::before{content:"0" counter(c);font-size:7.8pt;letter-spacing:.18em;color:#9A7B14;font-weight:500}
.toc b{font-family:"Playfair Display",serif;font-weight:500;font-size:19pt;line-height:1.2}
.toc span{grid-column:2;font-size:9.4pt;color:#6B6455;margin-top:1mm}
.toc i{grid-row:1;grid-column:3;font-style:normal;font-family:"Playfair Display",serif;font-size:19pt;color:#A30F16}
.about{border-top:.5mm solid #171310;padding-top:5mm}.about .eb{color:#A30F16;margin-bottom:3mm}.about p:last-child{font-size:11pt;line-height:1.65;color:#3A332A;max-width:150mm}
.mosaic{position:absolute !important;left:18mm;right:18mm;bottom:26mm;display:grid;grid-template-columns:repeat(5,1fr);gap:3mm}
.mosaic img{display:block;width:100%;height:auto;border-radius:2mm}
.big{position:absolute !important;right:16mm;bottom:20mm;font-family:"Playfair Display",serif;font-weight:500;font-size:170pt;line-height:.8;color:rgba(228,213,168,.13)}
/* vehicle index */
.vidx{flex:1 1 0;min-height:0;margin-top:7mm;column-count:3;column-gap:7mm;column-fill:auto}
.vmake{margin-bottom:3.4mm}.vmake .eb{grid-column:1/-1;color:#A30F16;margin-bottom:1.6mm;border-bottom:.5mm solid #171310;padding-bottom:1.4mm}
.vmake li{break-inside:avoid;display:grid;grid-template-columns:1fr auto;column-gap:3mm;align-items:baseline;padding:.75mm 0;border-bottom:.25mm solid #E8DFC9}
.vmake b{grid-column:1;font-family:"Playfair Display",serif;font-weight:500;font-size:10pt;line-height:1.15}.vmake span{grid-column:1;font-size:7pt;color:#6B6455;line-height:1.3}
.vmake i{grid-column:2;grid-row:span 2;align-self:center;font-style:normal;font-family:"Playfair Display",serif;font-size:11pt;color:#A30F16}
/* working pages */
.pg.parts{padding:14mm 16mm 23mm}
.ph{display:flex;align-items:flex-end;justify-content:space-between;gap:8mm;border-bottom:.5mm solid #171310;padding-bottom:3.5mm;margin-bottom:5mm}
.ph .eb{margin-bottom:2mm}.ph h2{font-family:"Playfair Display",serif;font-weight:500;font-size:21pt;line-height:1.1}
.plate{flex:1 1 0;min-height:0;display:flex;justify-content:center;align-items:flex-start}
.plate img{display:block;border-radius:2.5mm;border:.25mm solid #E8DFC9;background:#fff}
.shot{min-height:0;position:relative;margin-top:5mm;background:#fff;border:.25mm solid #E8DFC9;border-radius:2.5mm;overflow:hidden}
.shot img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain}
.tb{font-size:8.5pt;line-height:1.36}
.ch,.r{display:grid;grid-template-columns:9mm 1fr 47mm 14mm;column-gap:3mm}
.ch{font-size:6.6pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#77705F;padding:0 2mm 1.6mm}
.r{padding:.92mm 2mm;border-bottom:.2mm solid #E8DFC9;align-items:baseline}
.r .sn{color:#9A7B14;font-weight:500}.r .d{color:#171310}.r .pn{font-weight:500;color:#171310;overflow-wrap:anywhere}.r .um{font-size:7.2pt;color:#6B6455}
.cat{margin:2.6mm 0 .4mm;padding:1.3mm 2mm;background:#171310;color:#FCFAF4;font-size:7.4pt;font-weight:600;letter-spacing:.14em;line-height:1.3;border-radius:.8mm;display:flex;justify-content:space-between}
.cat:first-of-type{margin-top:0}.cat i{font-style:normal;font-weight:400;letter-spacing:.1em;color:#C9A227;text-transform:uppercase;font-size:6.2pt}
.fn{margin:2mm 0 1mm;padding:1.6mm 2.5mm;border-left:.6mm solid #C9A227;background:#F3E9D3;font-size:7.4pt;line-height:1.4;border-radius:0 1mm 1mm 0}
.vh{display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;border-bottom:.5mm solid #171310;padding-bottom:4mm;margin-bottom:4.5mm}
.vh .eb{margin-bottom:2.5mm}.vh h2{font-family:"Playfair Display",serif;font-weight:500;font-size:27pt;line-height:1.05}
.vh img{display:block;width:44mm;height:auto;border-radius:2mm}
.var{display:flex;flex-wrap:wrap;gap:1.6mm;margin-top:3mm}.var span{font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;border:.25mm solid #C9A227;color:#6B5A12;border-radius:99px;padding:.7mm 2.6mm}
.vh--c{align-items:baseline;padding-bottom:2.5mm;margin-bottom:4mm}.vh--c .eb{margin:0}.vh--c span{font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:#77705F}
''')
print("vehicle pages:", sum(m["out"][1] - m["out"][0] + 1 for m in out_map["vehicles"]), "| total pages:", len(doc.pages))
