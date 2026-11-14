#!/usr/bin/env python3
"""Cuts the shop's category and vehicle photos out of the catalogue crops in tools/out/parts/ (made by tools/parts_extract.py).
Writes assets/img/shop/cat-<slug>.webp and assets/img/shop/veh/<vehicle id>.webp. Run once after parts_extract.py; the outputs are committed."""
import os, re, json
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "out", "parts"); OUT = os.path.join(ROOT, "assets", "img", "shop")
os.makedirs(os.path.join(OUT, "veh"), exist_ok=True)
# category slug -> (catalogue crop, box as fractions of its width and height: left, top, right, bottom)
CATS = {
    "bull-bars":  ("plate-002", (0.03, 0.17, 0.99, 0.52)),
    "steps-bars": ("plate-006", (0.05, 0.60, 0.99, 0.90)),
    "racks":      ("plate-011", (0.08, 0.62, 0.98, 0.92)),
    "canopies":   ("plate-030", (0.05, 0.13, 0.98, 0.385)),
    "suspension": ("plate-073", (0.57, 0.14, 0.98, 0.40)),
    "wheels":     ("photo-071", (0.02, 0.03, 0.98, 0.52)),
    "recovery":   ("photo-042", (0.06, 0.09, 0.50, 0.40)),
    "lighting":   ("photo-061", (0.02, 0.04, 0.98, 0.60)),
    "camping":    ("plate-056", (0.03, 0.06, 0.97, 0.47)),
    "care":       ("photo-082", (0.02, 0.04, 0.98, 0.96)),
}
for slug, (name, (a, b, c, d)) in CATS.items():
    im = Image.open(os.path.join(SRC, name + ".jpg")).convert("RGB"); w, h = im.size
    cr = im.crop((int(a * w), int(b * h), int(c * w), int(d * h)))
    if cr.width > 900: cr = cr.resize((900, round(cr.height * 900 / cr.width)), Image.LANCZOS)
    cr.save(os.path.join(OUT, f"cat-{slug}.webp"), quality=82, method=6)
slug = lambda t: re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
D = json.load(open(os.path.join(ROOT, "tools", "data", "parts.json"), encoding="utf-8"))
for v in D["vehicles"]:
    vid = slug(f'{v["make"]} {v["model"]} {" ".join(v["variant"])}')
    Image.open(os.path.join(SRC, v["photo"])).convert("RGB").save(os.path.join(OUT, "veh", vid + ".webp"), quality=84, method=6)
n = [f for _, _, fs in os.walk(OUT) for f in fs]
print(len(n), "shop images,", round(sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(OUT) for f in fs) / 1024), "KB")
