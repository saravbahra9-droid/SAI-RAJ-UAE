#!/usr/bin/env python3
"""Takes the original Sai Raj product catalogue PDF apart so it can be rebuilt in the new style.

    PARTS_SRC=/path/to/original-catalogue.pdf python3 tools/parts_extract.py

Writes tools/data/parts.json (every table row, by page and by vehicle) and tools/out/parts/*.jpg
(product photos cropped from the original pages). The original PDF is not kept in this repo.

How the original is built, and what this relies on:
  - every page is one flattened background image (photos, red side tab, vehicle header) ...
  - ... with the part-number tables as live text on top. The tables are read from that text, never by OCR.
  - the section name is only in the red side tab, so that one line is read by OCR (tesseract).
  - vehicle names are baked into the header image; they are listed by hand below, checked against the pages.
"""
import os, re, json, subprocess, collections, sys
import numpy as np
import pdfplumber
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get("PARTS_SRC") or sys.exit("set PARTS_SRC to the original catalogue PDF")
WORK = os.path.join(ROOT, "tools", "out", "parts"); RAW = os.path.join(WORK, "raw")
os.makedirs(RAW, exist_ok=True); os.makedirs(os.path.join(ROOT, "tools", "data"), exist_ok=True)
W, H = 1190, 1683          # background images are 144 dpi A4
Q = 80                     # JPEG quality of the crops

# (first page, last page, make, model, variant lines) read from the page headers of the original
VEHICLES = [
 (84, 89, "Toyota", "Hilux", ["Revo/Rocco/GR", "2015+ onwards", "Double cab"]), (90, 93, "Toyota", "Hilux", ["Revo/Rocco/GR", "2015+ onwards", "Single cab"]),
 (94, 99, "Toyota", "Hilux", ["Vigo/Invincible", "2005+ onwards", "Double cab"]), (100, 103, "Toyota", "Hilux", ["Vigo/Invincible", "2005+ onwards", "Single cab"]),
 (104, 107, "Toyota", "Landcruiser", ["79 Series", "2011+ onwards", "Double cab"]), (108, 111, "Toyota", "Landcruiser", ["79 Series", "1999+ onwards", "Single cab"]),
 (112, 114, "Toyota", "Landcruiser", ["76 Series", "2007+ onwards"]), (115, 117, "Toyota", "Landcruiser", ["78 Series", "2007+ onwards"]),
 (118, 119, "Toyota", "Landcruiser", ["300 Series", "2022+ onwards"]), (120, 121, "Toyota", "Landcruiser", ["200 Series", "2015+ onwards"]),
 (122, 123, "Toyota", "Landcruiser", ["200 Series", "2007+ onwards"]), (124, 125, "Toyota", "Landcruiser", ["100 Series", "1998 - 2007"]),
 (126, 127, "Toyota", "Landcruiser", ["105 Series", "1998+"]), (128, 129, "Toyota", "Landcruiser", ["80 Series", "1990+"]),
 (130, 131, "Toyota", "Prado", ["Prado 150", "2017+ onwards"]), (132, 133, "Toyota", "Prado", ["Prado 150", "2009 - 2017"]),
 (134, 135, "Toyota", "Prado", ["Prado 120", "2003 - 2009"]), (136, 137, "Toyota", "Prado", ["Prado 95", "1996 - 2002"]),
 (138, 139, "Toyota", "FJ Cruiser", ["2006+ onwards"]), (140, 141, "Toyota", "Fortuner", ["2015+ onwards"]),
 (142, 145, "Ford", "Raptor", ["Raptor Next Gen", "2022+ onwards"]), (146, 149, "Ford", "Raptor", ["2018 - 2022"]),
 (150, 153, "Ford", "Ranger", ["Ranger Next Gen", "2022+ onwards", "DCAB model"]), (154, 159, "Ford", "Ranger", ["2015+ onwards", "DCAB model"]),
 (160, 163, "Ford", "Ranger", ["2015+ onwards", "SCAB model"]), (164, 165, "Ford", "Everest", ["Everest Next Gen", "2022+"]),
 (166, 171, "Isuzu", "DMAX", ["2019+ onwards", "DCAB model"]), (172, 177, "Isuzu", "DMAX", ["2012+ onwards", "DCAB model"]),
 (178, 181, "Isuzu", "DMAX", ["2012+ onwards", "SCAB model"]), (182, 183, "Isuzu", "MUX", ["2017+ onwards"]),
 (184, 189, "Mitsubishi", "Triton", ["Triton L200", "2011+ onwards", "DCAB model"]), (190, 193, "Mitsubishi", "Triton", ["Triton L200", "2011+ onwards", "SCAB model"]),
 (194, 195, "Mitsubishi", "Pajero", ["Pajero Shogun", "2011+ onward"]),
 (196, 201, "Nissan", "Navara", ["NP300 Series 5", "2021+ onwards", "Double cab"]), (202, 205, "Nissan", "Navara", ["NP300 Series 5", "2021+ onwards", "Single cab"]),
 (206, 209, "Mahindra", "Scorpio", ["2016+ onwards", "Double cab"]), (210, 211, "Mahindra", "Bolero", ["2000+ onwards", "Single cab"]),
 (212, 217, "Changan", "Hunter", ["2021+ onwards", "Double cab"]), (218, 219, "Toyota / Nissan", "Hiace / Urvan", ["All van models"]),
]
FIX_SECTION = {"IRONMANGX4 COIL & LEAFSPRINGS": "IRONMAN4X4 COIL & LEAFSPRINGS", "IRONMAN4SX4 SUSPENSION PRODUCTS": "IRONMAN4X4 SUSPENSION PRODUCTS",
               "ROOFRAILS ,DOOR VISORS &TINTING": "ROOFRAILS, DOOR VISORS & TINTING"}
SECTION_BY_HAND = {3: "STEEL BULLBARS"}      # page 3 is a low-resolution page in the original; its tab cannot be read
LIG = {"昀椀": "fi", "昀氀": "fl", "昀昀": "ff", "ﬁ": "fi", "ﬂ": "fl"}
SN = re.compile(r"^(\d{1,2}|[A-Z]{1,2}),?$")

# ── 1. background images ──
if not os.path.exists(os.path.join(RAW, "done")):
    subprocess.run(["pdfimages", "-j", SRC, os.path.join(RAW, "i")], check=True); open(os.path.join(RAW, "done"), "w").write("1")
page_img = {}
for l in subprocess.run(["pdfimages", "-list", SRC], capture_output=True, text=True).stdout.split("\n")[2:]:
    f = l.split()
    if len(f) > 5 and f[2] == "image" and int(f[3]) > 400 and int(f[4]) > 600 and int(f[0]) not in page_img:
        page_img[int(f[0])] = os.path.join(RAW, f"i-{int(f[1]):03d}.jpg")
def load(n):
    f = page_img.get(n)
    if not f or not os.path.exists(f): return None
    im = Image.open(f).convert("RGB")
    return im if im.size == (W, H) else im.resize((W, H), Image.LANCZOS)
def ocr_line(im):
    p = os.path.join(WORK, "_ocr.png"); im.save(p)
    r = subprocess.run(["tesseract", p, "-", "--psm", "7", "-c", "tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&/,.+-() "], capture_output=True, text=True)
    return " ".join(r.stdout.split())
def save(im, name):
    p = os.path.join(WORK, name); im.save(p, quality=Q, optimize=True); return name

# ── 2. the live text layer → tables ──
def parse_text(pg):
    ws = pg.extract_words(extra_attrs=["size", "fontname"], x_tolerance=1.5, y_tolerance=2)
    for w in ws:
        for a, b in LIG.items(): w["text"] = w["text"].replace(a, b)
    groups = collections.defaultdict(list)
    for w in ws: groups[round(w["top"] / 3.0)].append(w)
    lines = []
    for k in sorted(groups):
        L = sorted(groups[k], key=lambda w: w["x0"])
        if lines and abs(L[0]["top"] - lines[-1][0]["top"]) < 2.2: lines[-1] = sorted(lines[-1] + L, key=lambda w: w["x0"])
        else: lines.append(L)
    cols = None
    for L in lines:
        t = [w["text"] for w in L]
        if "S/N" in t and "ITEM" in t:
            d = {w["text"]: w["x0"] for w in L}; cols = (d["S/N"], d["ITEM"], d["PART"], d["UOM"]); break
    if cols is None:        # continuation pages have no column header: place the columns from the S/N tokens
        first = [L[0] for L in lines if SN.match(L[0]["text"]) and 6.5 <= L[0]["size"] <= 9.5 and len(L) > 1]
        if first:
            sx = min(w["x0"] for w in first); cols = (sx, sx + 27.5, sx + 294, sx + 456)
    res = dict(title=None, tables=[], captions=[], notes=[], words=[w["text"] for w in ws], bottom=0.0)
    cur = last = None; last_top = note_top = 0
    j = lambda ws: " ".join(w["text"] for w in ws)
    for L in lines:
        txt = j(L); size = max(w["size"] for w in L); font = L[0]["fontname"]; top = L[0]["top"]; toks = [w["text"] for w in L]
        if "S/N" in toks and "ITEM" in toks:
            d = {w["text"]: w["x0"] for w in L}; cols = (d["S/N"], d["ITEM"], d["PART"], d["UOM"]); res["bottom"] = max(res["bottom"], L[0]["bottom"]); continue
        if size >= 15: res["title"] = txt; continue
        if "SemiBold" in font and size >= 11:
            res["bottom"] = max(res["bottom"], L[0]["bottom"])
            if txt.replace(" ", "") != "PRODUCTS&PARTNUMBERS": cur = dict(cat=txt, rows=[]); res["tables"].append(cur); last = None
            continue
        if 9.6 <= size <= 10.5 and (txt.startswith("Note") or (res["notes"] and top - note_top < 15)):
            if txt.startswith("Note"): res["notes"].append(txt)
            else: res["notes"][-1] += " " + txt
            note_top = top; continue
        if cols is None or not (("Regular" in font or "Medium" in font) and 6.5 <= size <= 9.5):
            res["captions"].append(txt); continue
        sn = [w for w in L if w["x0"] < cols[1] - 4]; de = [w for w in L if cols[1] - 4 <= w["x0"] < cols[2] - 4]
        pa = [w for w in L if cols[2] - 4 <= w["x0"] < cols[3] - 4]; uo = [w for w in L if w["x0"] >= cols[3] - 4]
        if not sn and last is not None and top - last_top < 14:            # a wrapped line of the row above
            for key, part in (("desc", de), ("part", pa), ("uom", uo)):
                if part:
                    add = j(part); prev = last[key]
                    last[key] = prev[:-1] + add if (key == "desc" and prev.endswith("-") and add[:1].islower()) else (prev + " " + add).strip()
        else:
            if cur is None: cur = dict(cat=None, rows=[]); res["tables"].append(cur)
            last = dict(sn=j(sn), desc=j(de), part=j(pa), uom=j(uo)); cur["rows"].append(last)
        last_top = top; res["bottom"] = max(res["bottom"], L[0]["bottom"])
    return res

# ── 3. page by page ──
pages = {}
veh_of = {n: i for i, v in enumerate(VEHICLES) for n in range(v[0], v[1] + 1)}
with pdfplumber.open(SRC) as pdf:
    for n in range(1, len(pdf.pages) + 1):
        r = parse_text(pdf.pages[n - 1]); im = load(n); r["n"] = n
        if im is None: r["type"] = "blank"; pages[n] = r; continue
        a = np.asarray(im).astype(int)
        red = (a[:, :, 0] > 170) & (a[:, :, 1] < 70) & (a[:, :, 2] < 70)
        xs = np.where(red[500:1400].mean(axis=0) > 0.45)[0]
        if len(xs) < 40: r["type"] = "blank"; pages[n] = r; continue
        sx0, sx1 = int(xs.min()), int(xs.max()); side = "L" if sx0 < W / 2 else "R"
        tab = a[430:1570, sx0 + 6:sx1 - 6]; white = ((tab.min(axis=2) > 200) * 255).astype("uint8")
        sec = SECTION_BY_HAND.get(n) or ocr_line(Image.fromarray(255 - white).rotate(-90, expand=True))
        r["section"] = FIX_SECTION.get(sec, sec)
        cx0, cx1 = (sx1 + 3, W) if side == "L" else (0, sx0 - 2)        # the page without its red tab
        if r["captions"]:      # a few pages carry live captions over the photos: use a full render so they stay in the picture
            subprocess.run(["pdftoppm", "-r", "144", "-f", str(n), "-l", str(n), "-png", SRC, os.path.join(WORK, "_r")], check=True)
            rp = [f for f in os.listdir(WORK) if f.startswith("_r-")][0]; im = Image.open(os.path.join(WORK, rp)).convert("RGB").resize((W, H)); os.remove(os.path.join(WORK, rp)); a = np.asarray(im).astype(int)
        has_rows = any(t["rows"] for t in r["tables"])
        if n in veh_of:
            r["type"] = "vehicle"
            if n == VEHICLES[veh_of[n]][0]:         # vehicle photo: the outer 29% of the header band, away from the red tab
                cw = cx1 - cx0; fx = int(cw * 0.7085)
                box = (cx0 + fx, 6, cx1, 236) if side == "L" else (cx0, 6, cx0 + cw - fx, 236)
                r["vphoto"] = save(im.crop(box), f"veh-{n:03d}.jpg")
        elif has_rows:
            r["type"] = "products"
            y0 = int(r["bottom"] * 2) + 12; reg = a[y0:H, cx0:cx1]
            if reg.shape[0] > 120:
                content = ((reg.max(axis=2) - reg.min(axis=2)) > 45) | (reg.min(axis=2) < 140)
                ys = np.where(content.mean(axis=1) > 0.006)[0]
                if len(ys) > 60:
                    t0 = max(y0, y0 + int(ys.min()) - 26); t1 = min(H, y0 + int(ys.max()) + 26)
                    r["photo"] = save(im.crop((cx0, t0, cx1, t1)), f"photo-{n:03d}.jpg"); r["photo_size"] = [cx1 - cx0, t1 - t0]
        else:
            r["type"] = "plate"; r["plate"] = save(im.crop((cx0, 0, cx1, H)), f"plate-{n:03d}.jpg"); r["plate_size"] = [cx1 - cx0, H]
        pages[n] = r

# ── 4. vehicles: join each vehicle's pages into one run of tables ──
vehicles = []
for a0, a1, make, model, variant in VEHICLES:
    tables = []
    for n in range(a0, a1 + 1):
        for t in pages[n]["tables"]:
            if not t["rows"]: continue
            prev = next((x for x in reversed(tables) if "rows" in x), None)
            cont = prev and (t["cat"] is None or (t["cat"] == prev["cat"] and t["rows"][0]["sn"].isdigit() and prev["rows"][-1]["sn"].isdigit() and int(t["rows"][0]["sn"]) > int(prev["rows"][-1]["sn"])))
            if cont: prev["rows"] += [dict(x, p=n) for x in t["rows"]]
            else: tables.append(dict(cat=t["cat"], rows=[dict(x, p=n) for x in t["rows"]]))
        for note in pages[n]["notes"]: tables.append(dict(note=note, p=n))
    vehicles.append(dict(make=make, model=model, variant=variant, pages=[a0, a1], photo=pages[a0].get("vphoto"), tables=tables))

out = dict(source_pages=len(pages), pages=[{k: v for k, v in pages[n].items() if k != "bottom"} for n in sorted(pages)], vehicles=vehicles)
json.dump(out, open(os.path.join(ROOT, "tools", "data", "parts.json"), "w"), ensure_ascii=False, separators=(",", ":"))
rows = [x for p in pages.values() for t in p["tables"] for x in t["rows"]]
vrows = [x for v in vehicles for t in v["tables"] if "rows" in t for x in t["rows"]]
T = collections.Counter(p["type"] for p in pages.values())
print("pages:", dict(T)); print("table rows:", len(rows), "| with a part number:", sum(1 for x in rows if x["part"]), "| vehicle rows:", len(vrows), "in", len(vehicles), "vehicles")
print("crops:", len([f for f in os.listdir(WORK) if f.endswith(".jpg")]), "files,", round(sum(os.path.getsize(os.path.join(WORK, f)) for f in os.listdir(WORK) if f.endswith(".jpg")) / 1e6, 1), "MB")
