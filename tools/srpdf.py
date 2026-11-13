#!/usr/bin/env python3
"""Shared kit for the Sai Raj PDFs (company profile and brand catalogues).

Each document is a list of A4 pages written as HTML to tools/out/<name>.html, then printed by
`node tools/render-pdf.mjs <name>`. Drawings, partners and addresses come from tools/build_pages.py,
so the PDFs and the website never drift apart. Restyle every document at once by editing CSS here."""
import os, json, runpy, io, contextlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with contextlib.redirect_stdout(io.StringIO()):
    ns = runpy.run_path(os.path.join(ROOT, "tools", "build_pages.py"))
ILL, PARTNERS, LOC, ill, A = ns["ILL"], ns["PARTNERS"], ns["LOC"], ns["ill"], ns["A"]
# the three 3D renders, flattened onto the page colour so the PDFs carry small JPEGs instead of large transparent images
OUT = os.path.join(ROOT, "tools", "out"); os.makedirs(OUT, exist_ok=True)
for i in (1, 2, 3):
    if not os.path.exists(os.path.join(OUT, f"hero-{i}.jpg")):
        from PIL import Image
        im = Image.open(os.path.join(ROOT, "assets", "img", f"hero-{i}.webp")).convert("RGBA"); bg = Image.new("RGBA", im.size, (15, 12, 10, 255)); bg.alpha_composite(im)
        bg.convert("RGB").save(os.path.join(OUT, f"hero-{i}.jpg"), quality=88)

class Doc:
    """One PDF. label is the running footer text, title is the PDF title."""
    def __init__(self, label, title): self.label, self.title, self.pages, self.toc = label, title, [], []
    def pg(self, kind, tag, inner, acc="#ED1C24"):
        n = len(self.pages) + 1
        foot = "" if ("cover" in kind or "back" in kind) else f'<footer class="pf"><span>{self.label}</span><span>{tag}</span><b>{n:02d}</b></footer>'
        self.pages.append(f'<section class="pg pg--{kind}" style="--acc:{acc}">{inner}{foot}</section>'); return n
    def section(self, title, note=""): self.toc.append((title, note, len(self.pages) + 1))      # call just before the section's first page
    def write(self, name, css=""):
        body = "\n".join(self.pages).replace("<!--toc-->", "".join(f'<li><b>{t}</b><span>{d}</span><i>{n:02d}</i></li>' for t, d, n in self.toc))
        html = (f'<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>{self.title}</title><style>' + FONTS + CSS + css + "</style></head><body>" + body + "</body></html>")
        open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8").write(html); print(name + ".html", len(html), "bytes,", len(self.pages), "pages")

def rows(items, cols=2, cls=""):
    return f'<ul class="rows rows--{cols} {cls}">' + "".join(f"<li><b>{a}</b>{f'<span>{b}</span>' if b else ''}</li>" for a, b in items) + "</ul>"
def art(k, cls=""): return f'<div class="art {cls}">{ILL[k]}</div>'
def head(eyebrow, h, lede=""):
    return f'<p class="eb">{eyebrow}</p><h2 class="h">{h}</h2>' + (f'<p class="lede">{lede}</p>' if lede else "")
def band(k, title, body): return f'<div class="band">{art(k)}<div class="band__t"><h3 class="sub">{title}</h3>{body}</div></div>'
def locs(): return '<div class="locs">' + "".join(
    f'<div><p class="eb">{k}</p><h3>{t}</h3><p>{a}</p><p class="ln">' + "<br>".join(l for _, l in links if l != "WhatsApp") + "</p></div>" for k, t, a, links in LOC) + "</div>"

# dot map: 0 other land, 1 Africa, 2 the Gulf
src = open(os.path.join(ROOT, "assets/js/mapdata.js")).read(); M = json.loads(src[src.index("window.SR_MAP=") + 14: src.rindex(";")])
col = {0: "#DDD4BF", 1: "#B3A27C", 2: "#C9A227"}
dots = "".join(f'<circle cx="{x}" cy="{y}" r="4.3" fill="{col[f]}"/>' for x, y, f in M["dots"])
nx, ny = M["nairobi"]; dx, dy = M["dubai"]; mx, my = (nx + dx) / 2 + (dy - ny) * -0.28, (ny + dy) / 2 + (dx - nx) * 0.28
MAP = (f'<svg class="map" viewBox="0 10 1000 940">{dots}<path d="M{nx} {ny}Q{mx:.0f} {my:.0f} {dx} {dy}" fill="none" stroke="#ED1C24" stroke-width="3.5"/>'
       f'<circle cx="{nx}" cy="{ny}" r="12" fill="#ED1C24"/><circle cx="{dx}" cy="{dy}" r="12" fill="#ED1C24"/>'
       f'<text x="{nx-24}" y="{ny+9}" text-anchor="end" class="mt">NAIROBI · 1975</text><text x="{dx-24}" y="{dy-14}" text-anchor="end" class="mt">DUBAI</text></svg>')

# fonts only: the site stylesheet is not linked because its class names (.pg, .locs, .eb) mean other things there
FONTS = "".join(f'@font-face{{font-family:"{fam}";font-style:{st};font-weight:{w};src:url("/assets/fonts/{f}-latin-{w}-{st}.woff2") format("woff2")}}'
                for fam, f, w, st in [("Playfair Display", "playfair-display", 500, "normal"), ("Playfair Display", "playfair-display", 600, "normal"), ("Playfair Display", "playfair-display", 500, "italic"),
                                      ("Poppins", "poppins", 400, "normal"), ("Poppins", "poppins", 500, "normal"), ("Poppins", "poppins", 600, "normal"), ("Poppins", "poppins", 700, "normal")])
CSS = '''
@page{size:210mm 297mm;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:"Poppins",sans-serif;font-size:10.2pt;line-height:1.6;color:#171310}
ul,ol{list-style:none}
.pg{position:relative;width:210mm;height:297mm;padding:19mm 18mm 25mm;overflow:hidden;page-break-after:always;break-after:page;background:#FCFAF4;--gold:#C9A227;display:flex;flex-direction:column}
.pg--dark{background:#0F0C0A;color:#F3EEE2}
.pg--dark::before{content:"";position:absolute;inset:0;z-index:2;background:radial-gradient(60% 40% at 80% 30%,rgba(228,213,168,.10),transparent 70%),radial-gradient(90% 40% at 10% 108%,rgba(163,15,22,.30),transparent 62%)}
.pg > *{position:relative;z-index:3;flex:none}
.push{margin-top:auto}
.eb{font-size:7.6pt;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:3mm;margin-bottom:5mm}
.eb::before{content:"";flex:none;width:9mm;height:.25mm;background:currentColor}
.pg--light .eb{color:#9A7B14}
.h,h1{font-family:"Playfair Display",serif;font-weight:500;letter-spacing:-.01em;line-height:1.06;font-size:37pt;max-width:160mm}
h1{font-size:52pt}
.h em,h1 em,h2 em{font-style:italic;color:#A30F16}
.pg--dark .h em,.pg--dark h1 em,.pg--dark h2 em{color:#E4D5A8}
.lede{font-size:11.6pt;line-height:1.62;max-width:150mm;margin-top:6mm;color:#4B4439}
.pg--dark .lede{color:#D8D0BF}
.pf{position:absolute;left:18mm;right:18mm;bottom:11mm;display:flex;gap:6mm;align-items:baseline;font-size:6.8pt;letter-spacing:.2em;text-transform:uppercase;color:#77705F;border-top:.25mm solid rgba(119,112,95,.35);padding-top:3mm}
.pf span:nth-child(2){margin-left:auto}.pf b{font-weight:600;color:#9A7B14}
.pg--dark .pf{color:#A99F8B;border-top-color:rgba(228,213,168,.2)}.pg--dark .pf b{color:var(--gold)}
.ill{display:block;width:100%;height:auto}
.art{position:relative;flex:1 1 0;min-height:56mm;margin:8mm 0 7mm;border:.25mm solid #E8DFC9;border-radius:3mm;background-color:#F7F2E7;color:#171310;
  background-image:linear-gradient(rgba(23,19,16,.045) .25mm,transparent .25mm),linear-gradient(90deg,rgba(23,19,16,.045) .25mm,transparent .25mm);background-size:5mm 5mm}
.art .ill{position:absolute;left:12mm;top:7mm;width:calc(100% - 24mm);height:calc(100% - 14mm)}
.rows{display:grid;grid-template-columns:1fr 1fr;column-gap:9mm}
.rows--1{grid-template-columns:1fr}.rows--3{grid-template-columns:1fr 1fr 1fr}
.rows li{padding:3mm 0;border-top:.25mm solid #E8DFC9;display:grid;gap:.5mm;align-content:start}
.rows b{font-weight:500;font-size:10.4pt;line-height:1.4}.rows span{font-size:8.8pt;color:#6B6455;line-height:1.45}
.pg--dark .rows li{border-top-color:rgba(228,213,168,.18)}.pg--dark .rows span{color:#A99F8B}
.pg--dark .rows li{padding:3.6mm 0}.pg--dark .rows b{font-size:11pt;font-weight:400}
/* 2 welcome */
.cols{display:grid;grid-template-columns:1.2fr .8fr;gap:13mm;margin-top:12mm}
.cols__t p{margin-bottom:5.5mm;font-size:12.4pt;line-height:1.7;color:#3A332A}
.vm{display:grid;gap:9mm;align-content:start}.vm div{border-top:.5mm solid #171310;padding-top:4mm}.vm .eb{color:#A30F16;margin-bottom:3mm}
.vm p:last-child{font-family:"Playfair Display",serif;font-size:16pt;line-height:1.36;color:#171310}
.strip{margin-top:auto;display:grid;grid-template-columns:repeat(6,1fr);gap:4mm;border-top:.25mm solid #E8DFC9;padding-top:6mm}
.strip div{display:grid;gap:2mm}.strip .ill{stroke-width:1.6}
.strip span{font-size:7.2pt;letter-spacing:.16em;text-transform:uppercase;color:#6B6455;text-align:center;line-height:1.4}
/* 3 numbers */
.nums{display:grid;grid-template-columns:1fr 1fr;gap:13mm 12mm;margin-top:15mm}
.nums div{border-top:.25mm solid rgba(228,213,168,.25);padding-top:6mm}
.nums b{display:block;font-family:"Playfair Display",serif;font-weight:500;font-size:64pt;line-height:1;color:#E4D5A8}
.nums span{display:block;margin-top:3mm;font-size:7.8pt;letter-spacing:.18em;text-transform:uppercase;color:#A99F8B}
/* 4 story */
.st{display:grid;grid-template-columns:1fr 80mm;gap:8mm}.st .h{font-size:33pt}
.st__l{display:flex;flex-direction:column}
.map{display:block;width:100%;height:auto}.mt{font:600 29px "Poppins",sans-serif;letter-spacing:5px;fill:#171310;paint-order:stroke;stroke:#FCFAF4;stroke-width:9px;stroke-linejoin:round}
.keys{margin-top:auto;padding-top:9mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.keys li{border-top:.5mm solid #171310;padding-top:3.5mm;display:grid;gap:1mm;align-content:start}
.keys b{font-family:"Playfair Display",serif;font-weight:500;font-size:13.5pt;line-height:1.2}.keys span{font-size:8.6pt;color:#6B6455;line-height:1.45}
.tl{flex:1 1 0;min-height:0;margin-top:10mm;counter-reset:t;display:flex;flex-direction:column}
.tl li{flex:1 1 0;counter-increment:t;display:grid;grid-template-columns:13mm 64mm 1fr;align-items:start;padding:5.5mm 0 4mm;border-top:.25mm solid #E8DFC9}
.tl li::before{content:"0" counter(t);font-size:7.8pt;letter-spacing:.18em;color:#9A7B14;font-weight:500;padding-top:2.2mm}
.tl b{font-family:"Playfair Display",serif;font-weight:500;font-size:18pt;line-height:1.2;padding-right:5mm}.tl span{font-size:10.8pt;color:#4B4439;line-height:1.6;padding-top:1mm}
/* 5 group */
.grid6{flex:1 1 0;min-height:0;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:5mm;margin-top:10mm}
.bcard{display:flex;flex-direction:column;border:.25mm solid rgba(228,213,168,.2);border-radius:3mm;padding:6mm;background:#1B1512;color:rgba(228,213,168,.8);border-top:.8mm solid var(--acc);min-height:0}
.bcard__a{position:relative;flex:1 1 0;min-height:22mm}.bcard__a .ill{position:absolute;inset:0;width:100%;height:100%}
.bcard h3{font-family:"Playfair Display",serif;font-weight:500;font-size:20pt;color:#F3EEE2;margin-top:4mm;line-height:1.1}
.bcard h3 i{display:block;font-family:"Poppins",sans-serif;font-style:normal;font-size:6.8pt;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-top:1.8mm}
.bcard p{font-size:9.2pt;color:#B5AB96;margin-top:3mm;line-height:1.5;min-height:14mm}
/* 8 cold chain */
.wide{display:block;width:calc(100% + 36mm);margin:5mm -18mm 0;height:auto;z-index:1 !important}
.layers{counter-reset:l;display:grid;grid-template-columns:repeat(4,1fr);gap:6mm}
.layers li{counter-increment:l;border-top:.25mm solid rgba(228,213,168,.28);padding-top:3.5mm;display:grid;gap:1.5mm}
.layers li::before{content:"0" counter(l);font-size:7.6pt;letter-spacing:.18em;color:var(--gold);font-weight:500}
.layers b{font-family:"Playfair Display",serif;font-weight:500;font-size:13.5pt;line-height:1.2;color:#F3EEE2}
.cap{font-size:10pt;color:#D8D0BF;margin-top:6mm}
/* 9 links */
.grid3{flex:1 1 0;min-height:0;display:grid;grid-template-columns:1fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:5mm;margin-top:10mm}
.lcard{display:flex;flex-direction:column;border:.25mm solid #E8DFC9;border-radius:3mm;padding:4.5mm;background:#fff;min-height:0}
.lcard__a{position:relative;flex:1 1 0;min-height:20mm;background:#F7F2E7;border-radius:2mm;margin-bottom:4mm}.lcard__a .ill{position:absolute;left:6mm;top:3mm;width:calc(100% - 12mm);height:calc(100% - 6mm)}
.lcard h3{font-family:"Playfair Display",serif;font-weight:500;font-size:13.5pt;line-height:1.2;min-height:2.4em}.lcard p{font-size:8.8pt;color:#6B6455;margin-top:1.6mm;min-height:4.4em;line-height:1.45}
.feat{margin-top:9mm}
.note{margin-top:6mm;padding:4.5mm 5.5mm;border-left:.7mm solid var(--gold);background:#F3E9D3;font-size:10pt;border-radius:0 2mm 2mm 0}
/* bands */
.bands{flex:1 1 0;min-height:0;display:grid;grid-auto-rows:1fr;gap:7mm;margin-top:9mm}
.band{display:grid;grid-template-columns:1fr 1fr;gap:10mm;min-height:0;border-top:.25mm solid #E8DFC9;padding-top:7mm}
.band .art{margin:0;min-height:0;height:100%}.band .art .ill{left:8mm;width:calc(100% - 16mm)}
.band__t{align-self:center}.band__t p{font-size:10.4pt;color:#4B4439;margin-bottom:4mm;line-height:1.62}
.sub{font-family:"Playfair Display",serif;font-weight:500;font-size:19pt;line-height:1.2;margin-bottom:3.5mm}
blockquote{font-family:"Playfair Display",serif;font-style:italic;font-size:18pt;line-height:1.3;color:#A30F16;margin:0 0 7mm;max-width:160mm}
.lists{display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:6mm;padding:5mm 5.5mm;background:#F3E9D3;border-radius:2mm}
.lists .eb{margin-bottom:2.5mm;color:#A30F16}.lists p:last-child{font-size:9.6pt;color:#3A332A;line-height:1.55}
.models{display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-bottom:6mm}
.models div{border-top:.5mm solid #171310;padding-top:4mm;display:grid;gap:1.5mm}
.models b{font-family:"Playfair Display",serif;font-weight:500;font-size:22pt;line-height:1.1}.models span{font-size:8.8pt;color:#6B6455}
/* 17 partners */
.pgroups{flex:1 1 0;min-height:0;display:flex;flex-direction:column;justify-content:space-between;margin-top:10mm}
.pgroup .eb{margin-bottom:0;color:#A30F16;border-bottom:.5mm solid #171310;padding-bottom:3mm}
.pgroup ul{display:grid;grid-template-columns:1fr 1fr;column-gap:9mm}
.pgroup li{padding:3mm 0;border-bottom:.25mm solid #E8DFC9;display:grid;gap:.6mm;align-content:start}
.pgroup b{font-family:"Playfair Display",serif;font-weight:500;font-size:14.5pt;line-height:1.25}.pgroup span{font-size:8.6pt;color:#6B6455;line-height:1.45}
.pgroup i{font-family:"Poppins",sans-serif;font-style:normal;font-size:6.4pt;letter-spacing:.18em;text-transform:uppercase;color:#9A7B14;vertical-align:middle;border:.25mm solid #C9A227;border-radius:99px;padding:.6mm 2.4mm;margin-left:1.5mm}
/* 18 why */
.why{flex:1 1 0;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:0 12mm;margin-top:14mm}
.why div{border-top:.25mm solid rgba(228,213,168,.25);padding-top:7mm}
.why b{font-size:7.8pt;letter-spacing:.2em;color:var(--gold);font-weight:500}.why h3{font-family:"Playfair Display",serif;font-weight:500;font-size:28pt;line-height:1.15;margin:5mm 0 5mm}.why p{color:#D8D0BF;font-size:12pt;line-height:1.65;max-width:72mm}
/* 19 contact */
.locs{flex:1 1 0;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:0 12mm;margin-top:12mm}
.locs div{border-top:.25mm solid #E8DFC9;padding:7mm 0 7mm}.locs div:first-child{grid-column:1/-1;border-top:.5mm solid #171310;padding-bottom:12mm}
.locs .eb{margin-bottom:3mm;color:#A30F16}.locs h3{font-family:"Playfair Display",serif;font-weight:500;font-size:19pt;line-height:1.2}.locs div:first-child h3{font-size:34pt}
.locs p{font-size:10.2pt;color:#4B4439;margin-top:2mm}.locs div:first-child p{font-size:12pt}.locs .ln{color:#171310;font-weight:500;margin-top:3mm}
/* covers */
.cover{padding:18mm}.cv__top{display:flex;justify-content:space-between;align-items:flex-start}.cv__top img{width:46mm;height:auto}
.cv__top span{font-size:7.6pt;letter-spacing:.22em;text-transform:uppercase;text-align:right;color:#A99F8B;line-height:1.7}.cv__top b{font-family:"Playfair Display",serif;font-weight:500;font-size:22pt;letter-spacing:0;color:#E4D5A8}
.cv__t{margin-top:30mm}.cv__img{position:absolute !important;z-index:1 !important;left:1mm;bottom:20mm;width:208mm;height:auto}
.cv__foot{position:absolute !important;left:18mm;right:18mm;bottom:12mm;display:flex;justify-content:space-between;font-size:7.4pt;letter-spacing:.22em;text-transform:uppercase;color:#A99F8B}
.back .bk{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;text-align:center;gap:9mm;padding:20mm}
.bk img{width:50mm}.bk h2{font-family:"Playfair Display",serif;font-weight:500;font-size:38pt;line-height:1.08;max-width:150mm}.bk p{font-size:8pt;letter-spacing:.22em;text-transform:uppercase;color:#E4D5A8}.bk .sm{color:#A99F8B;letter-spacing:.06em;text-transform:none;font-size:9pt}
'''
