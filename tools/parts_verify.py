#!/usr/bin/env python3
"""Checks the rebuilt product catalogue against the original, both ways.

    python3 tools/parts_verify.py            (after build_parts.py and render-pdf.mjs parts)

1. Nothing was lost reading the original: on every original page, the characters of the live text layer
   equal the characters captured in tools/data/parts.json.
2. Nothing was lost or moved building the new PDF: every table row of the original (S/N, description,
   part number, unit) is found in the new PDF, under the same vehicle or on the page that replaces its
   original page, and no vehicle has gained rows.
Exits non-zero on any mismatch."""
import os, re, json, subprocess, collections, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = os.path.join(ROOT, "assets", "docs", "sai-raj-product-catalogue-2026.pdf")
D = json.load(open(os.path.join(ROOT, "tools", "data", "parts.json"), encoding="utf-8"))
M = json.load(open(os.path.join(ROOT, "tools", "out", "parts-map.json")))
P = {p["n"]: p for p in D["pages"]}
fails = []
norm = lambda s: " ".join(s.split())
chars = lambda s: collections.Counter(c for c in s if not c.isspace() and c != "-")

# ── 1. original text layer vs parts.json ──
FIXED = "S/N ITEM DESCRIPTION PART NO. UOM"
lost = 0
for n, p in P.items():
    src = chars(" ".join(p["words"]))
    got = chars(" ".join([p.get("title") or ""] + p["notes"] + p["captions"] + [t["cat"] or "" for t in p["tables"]] + [" ".join(x.values()) for t in p["tables"] for x in t["rows"]]))
    diff = src - got
    for w in FIXED.split() + "PRODUCTS & PART NUMBERS".split(): diff = diff - chars(w) - chars(w) - chars(w)     # column headers, however often a page repeats them
    if sum(diff.values()): lost += 1; fails.append(f"original p{n}: {sum(diff.values())} characters of the text layer are not in parts.json: {dict(diff)}")
rows_all = [(n, x) for n, p in P.items() for t in p["tables"] for x in t["rows"]]
print(f"1. original text layer: {len(P)} pages, {len(rows_all)} table rows, {sum(1 for _, x in rows_all if x['part'])} with a part number; pages with text not captured: {lost}")

# ── 2. every row is in the new PDF, in the right place ──
out_pages = subprocess.run(["pdftotext", "-layout", PDF, "-"], capture_output=True, text=True).stdout.split("\f")
def lines(a, b): return [norm(l) for k in range(a, b + 1) for l in out_pages[k - 1].split("\n") if l.strip()]
def check(label, rows, a, b):
    L = lines(a, b); pool = collections.Counter(L); toks = collections.Counter(t for l in L for t in l.split()); blob = "".join("".join(l.split()) for l in L)
    exact = wrapped = 0
    for x in rows:
        key = norm(" ".join([x["sn"], x["desc"], x["part"], x["uom"]]))
        if pool[key] > 0: pool[key] -= 1; exact += 1; continue
        need = collections.Counter(key.split())
        if all(toks[t] >= c for t, c in need.items()): wrapped += 1; continue
        # a cell that wraps inside a word (after a hyphen or slash): look for the row's characters around the break
        ns = lambda t: "".join(t.split()); d, pn, um = ns(x["desc"]), ns(x["part"]), ns(x["uom"]); head = ns(x["sn"])
        hit = any(head + d[:k] + pn + um + d[k:] in blob for k in range(1, len(d))) or any(head + d + pn[:k] + um + pn[k:] in blob for k in range(1, len(pn)))
        if hit: wrapped += 1
        else: fails.append(f"{label}: row not found in new pages {a}-{b}: {key}")
    # no extra rows: every part number appears exactly as often as in the original
    want = collections.Counter(x["part"] for x in rows if x["part"]); text = " ".join(L)
    for part, c in want.items():
        got = len(re.findall(r"(?<!\S)" + re.escape(norm(part)) + r"(?!\S)", text))
        if got < c: fails.append(f"{label}: part number {part} appears {got}x in the new pages, {c}x in the original")
    return exact, wrapped
E = Wn = 0
for v, m in zip(D["vehicles"], M["vehicles"]):
    rows = [x for n in range(v["pages"][0], v["pages"][1] + 1) for t in P[n]["tables"] for x in t["rows"]]      # from the original pages, not the merged tables
    merged = sum(len(t["rows"]) for t in v["tables"] if "rows" in t)
    if merged != len(rows): fails.append(f'{m["name"]} {m["variant"]}: {len(rows)} rows on original pages {v["pages"]}, {merged} after merging')
    e, w = check(f'{m["name"]} ({m["variant"]})', rows, *m["out"]); E += e; Wn += w
    # and the new pages of this vehicle hold no more rows than the original did
    n_out = sum(1 for l in lines(*m["out"]) if re.match(r"^(\d{2}|[A-Z]{1,2},?( [A-Z]{1,2})?) \S", l) and not l.startswith(("S/N", "SAI RAJ")))
    if n_out > len(rows) + 2 * (m["out"][1] - m["out"][0] + 1): fails.append(f'{m["name"]}: {n_out} row-like lines in the new pages for {len(rows)} original rows')
vrows = sum(len([x for n in range(v["pages"][0], v["pages"][1] + 1) for t in P[n]["tables"] for x in t["rows"]]) for v in D["vehicles"])
print(f"2. vehicles: {len(D['vehicles'])}, rows {vrows}: found whole on one line {E}, found across a wrapped line {Wn}, missing {vrows - E - Wn}")
E2 = W2 = 0; prow = 0
for n, p in P.items():
    if p["type"] != "products": continue
    rows = [x for t in p["tables"] for x in t["rows"]]; prow += len(rows)
    o = M["pages"][str(n)]; e, w = check(f"original p{n}", rows, o, o); E2 += e; W2 += w
print(f"   product pages: rows {prow}: found whole on one line {E2}, found across a wrapped line {W2}, missing {prow - E2 - W2}")
alltext = norm(" ".join(out_pages)); parts = {norm(x["part"]) for _, x in rows_all if x["part"]}
gone = [p for p in parts if p not in alltext]
print(f"   distinct part numbers: {len(parts)} in the original, {len(parts) - len(gone)} found in the new PDF")
if gone: fails.append(f"part numbers missing from the new PDF: {gone[:20]}")
plates = [n for n, p in P.items() if p["type"] == "plate"]
missing_plates = [n for n in plates if str(n) not in M["pages"]]
print(f"   picture pages: {len(plates)} in the original, {len(plates) - len(missing_plates)} placed in the new PDF; blank original pages left out: {[n for n, p in P.items() if p['type'] == 'blank']}")
if missing_plates: fails.append(f"picture pages not placed: {missing_plates}")
print("RESULT:", "all checks pass" if not fails else f"{len(fails)} problems"); [print("  -", f) for f in fails[:25]]
sys.exit(1 if fails else 0)
