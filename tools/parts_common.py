"""Heading tidy-ups shared by the product catalogue PDF (build_parts.py) and the website's parts finder (build_pages.py).
Table rows are never edited: descriptions, part numbers and units stay exactly as in the original catalogue."""
# three slips in the original's headings
HEAD_FIX = {"BULLBAR LGHTS & LED WORK LIGHTS": "BULLBAR LIGHTS & LED WORK LIGHTS", "LIGHT ACCESSOIRES": "LIGHT ACCESSORIES", "CARGGOTUFF CONVERSIONS": "CARGOTUFF CONVERSIONS"}
# original pages whose heading was left over from another page: use the red tab's section name instead
TITLE_FROM_SECTION = {81}
KEEP = {"led": "LED", "sr": "SR", "upvc": "uPVC", "riv": "RIV", "atms": "ATMs", "cargotuff": "Cargotuff", "decoroof": "Decoroof", "atlas": "Atlas", "diamondbrite": "Diamondbrite",
        "ironman4x4": "Ironman 4x4", "pulse": "Pulse", "nitrogas": "Nitro Gas", "foamcell": "Foam Cell", "pro": "Pro", "roofracks": "roof racks", "roofrack": "roof rack",
        "rollbars": "roll bars", "roofrails,": "Roof rails,", "leafsprings": "leaf springs", "coldrooms": "cold rooms", "firetruck": "fire truck", "pickup": "pick-up"}
def nice(s):
    """'STEEL & ALLOY ROOFRACKS' -> 'Steel & alloy roof racks'"""
    s = HEAD_FIX.get(s, s); t = " ".join(KEEP.get(w.lower(), w.lower()) for w in s.split())
    return t[:1].upper() + t[1:]
