#!/usr/bin/env python3
"""Builds the Cargotuff and cold chain catalogue (A4): tools/out/cargotuff.html.
Then `node tools/render-pdf.mjs cargotuff` prints assets/docs/cargotuff-cold-chain-catalogue-2026.pdf.
Content: the Cargotuff and cold chain sections of the 2024-25 company profile and of the website.
Shared pieces (styles, drawings, addresses) live in tools/srpdf.py."""
from srpdf import *
RED, BLUE = "#E0262E", "#3FA9E6"
doc = Doc("Cargotuff · Catalogue 2026", "Cargotuff by Sai Raj — Truck Bodies, Conversions and Cold Chain · Catalogue 2026"); pg = doc.pg

# drawings that only the catalogue needs (same 320 x 200 grid and stroke as the site's)
CAB = '<path d="M210 80h40l22 28v48h-62"/><path d="M222 90h24l14 18h-38z"/><circle cx="238" cy="160" r="13"/><path d="M20 174h284"/>'
ILL.update(
 steel=ill(f'{CAB}<path d="M34 144V92M210 144V92M34 144h176"/><path d="M34 144v12h176v-12"/><circle cx="78" cy="160" r="13"/><path {A} d="M30 92h184"/>'
           '<path d="M56 92v52M78 92v52M100 92v52M122 92v52M144 92v52M166 92v52M188 92v52" stroke-dasharray="3 6"/>'),
 taillift=ill(f'{CAB}<rect x="62" y="52" width="148" height="92" rx="2"/><path d="M62 144v12h148v-12"/><circle cx="104" cy="160" r="13"/>'
              f'<path d="M92 52v92M122 52v92M152 52v92M182 52v92" stroke-dasharray="3 6"/><path {A} d="M22 170h36M58 170l4-18M22 170v-7"/><path {A} d="M40 158v-44M33 123l7-9 7 9"/>'),
 artic=ill(f'<path d="M10 174h300"/><rect x="16" y="56" width="216" height="86" rx="2"/><path d="M16 142v9h216v-9"/><path {A} d="M28 122h192"/>'
           '<path d="M70 56v86M124 56v86M178 56v86" stroke-dasharray="3 6"/><circle cx="42" cy="161" r="11"/><circle cx="68" cy="161" r="11"/><circle cx="94" cy="161" r="11"/><path d="M150 151v20"/>'
           '<path d="M238 151V98h30l26 28v25"/><path d="M246 106h20l15 18h-35z"/><circle cx="212" cy="161" r="11"/><circle cx="270" cy="161" r="11"/>'),
 van=ill(f'<path d="M22 158h276"/><path d="M38 144h232v-40l-26-10-22-36H38z"/><path d="M168 66h44l18 30h-62z"/><path d="M52 68h46v28H52zM108 68h46v28h-46z"/><circle cx="88" cy="148" r="14"/><circle cx="226" cy="148" r="14"/><path {A} d="M50 116h106"/>'),
 chick=ill(f'{CAB}<rect x="34" y="52" width="176" height="92" rx="2"/><path d="M34 144v12h176v-12"/><circle cx="78" cy="160" r="13"/>'
           f'<circle {A} cx="82" cy="98" r="22"/><path {A} d="M82 76v44M60 98h44M66 82l32 32M98 82l-32 32"/><path d="M130 76h62M130 88h62M130 100h62M130 112h62M130 124h62"/>'),
)
def card(n, t, a): return f'<div class="lcard"><div class="lcard__a">{ILL[a]}</div><h3>{n}</h3><p>{t}</p></div>'
def tcards(items): return '<div class="tgrid">' + "".join(f'<div class="tcard"><h3>{t}</h3><p>{p}</p></div>' for t, p in items) + "</div>"

# 1 cover
pg("dark cover", "", '''<header class="cv__top"><img src="/assets/img/logo.webp" alt="Sai Raj"><span>Catalogue<br><b>2026</b></span></header>
<div class="cv__t"><p class="eb">Cargotuff · by Sai Raj</p><h1>Built to <em>last.</em></h1>
<p class="lede">Truck bodies, pick-up bodies, conversions, trailers and the cold chain, designed and manufactured by Sai Raj.</p></div>
<img class="cv__img" src="/tools/out/hero-1.jpg" alt=""><p class="cv__foot"><span>sairaj.global</span><span>sairaj.com</span></p>''', RED)
# 2 contents
pg("light", "Contents", head("Contents", "What is <em>inside.</em>") + '<ol class="toc"><!--toc--></ol>'
   '<div class="push about"><p class="eb">About this catalogue</p><p>Sai Raj, under the Cargotuff brand name, designs and manufactures insulated and dry freight fibreglass composite, steel and aluminium truck bodies, '
   'and builds custom bodies and bespoke conversions to suit each client. This catalogue covers the Cargotuff range and the complete cold chain.</p></div>', RED)
# 3 about
pg("dark", "Cargotuff", head("Cargotuff by Sai Raj", "Dry freight, specialised freight and the <em>cold chain.</em>",
   "Cargotuff bodies are relied upon by East Africa’s leading businesses, transporters and long-distance hauliers to carry everything from dry freight and stationery to frozen and perishable goods, from day-old chicks to beef and bread, safely and hygienically.") +
   '<div class="nums nums--s"><div><b>1975</b><span>Sai Raj founded in Kenya</span></div><div><b>65–165 mm</b><span>Insulated panel thicknesses</span></div>'
   '<div><b>In-house</b><span>Design and manufacture</span></div><div><b>10+</b><span>Countries exported to, across Africa</span></div></div>'
   '<div class="push"><p class="eb">What Cargotuff builds</p>' + rows([("Truck bodies", ""), ("Pick-up bodies", ""), ("Cold rooms and refrigerated vehicles", ""), ("Speciality conversions", ""),
   ("Fire trucks and rapid intervention vehicles", ""), ("Trailers", ""), ("TukTuk conversions and bike boxes", ""), ("Fibreglass boats", ""), ("Fibreglass mouldings", ""), ("Custom bodies and bespoke conversions", "")]) + "</div>", RED)

# ── 01 truck bodies ──
doc.section("Truck bodies", "Fibreglass, insulated, steel and 40 ft bodies")
T = "Truck bodies"; E1 = "01 · Truck bodies"
pg("light", T, head(E1, "Durable, efficient bodies for <em>every job.</em>", "Customisable options ensure a fit for your specific cargo needs, across dry freight, specialised freight and the cold chain.") + art("truck") +
   rows([("Rigicore fibreglass", "Robust double-skin panel construction"), ("Single skin fibreglass", "General cargo, single or double doors, floor finish options"),
   ("Insulated bodies", "65, 90, 115 or 165 mm PU, XPS or EPS pressed fibreglass panels for chilled, frozen and deep-frozen loads"), ("Ferrotuff", "Polyurethane core with vapour-tight metal cover layers"),
   ("Open steel bodies", "Corrugated steel for construction, agriculture and logistics"), ("Closed steel bodies and tail lifts", "A tail lift can be fitted to any type of truck"),
   ("40 ft bodies", "Insulated or dry cargo, for greater payload per trip"), ("Day-old chick bodies", "Insulated and ventilated for live transport")]), RED)
pg("light", T, head(E1, "Fibreglass <em>bodies.</em>") + '<div class="bands">' +
   band("panel", "Rigicore fibreglass", "<p>A robust, superior fibreglass construction with a durable double-skin panel.</p>") +
   band("truck", "Single skin fibreglass", "<p>The Cargotuff general cargo body, in superior fibreglass.</p>" + rows([("Single or double door options", ""), ("Floor finish options", "")], 1)) +
   band("chick", "Day-old chick bodies", "<p>Insulated and ventilated for live transport.</p>") + "</div>", RED)
pg("dark", T, head(E1, "Insulated <em>bodies.</em>", "Pressed fibreglass insulated body construction, for chilled, frozen and deep-frozen applications.") +
   '<img class="wide wide--crop" src="/tools/out/hero-3.jpg" alt=""><div class="push"><p class="eb">The insulated wall, separated</p><ol class="layers"><li><b>Gelcoat finish</b></li><li><b>Fibreglass skin</b></li><li><b>PU, XPS or EPS core</b></li><li><b>Fibreglass inner skin</b></li></ol>'
   '<div class="facts"><div><b>65, 90, 115 or 165 mm</b><span>Panel thickness</span></div><div><b>PU, XPS or EPS</b><span>Core</span></div><div><b>Chilled to deep-frozen</b><span>Applications</span></div></div>'
   '<p class="cap">Also in the range: Ferrotuff, a polyurethane core with vapour-tight metal cover layers.</p></div>', BLUE)
pg("light", T, head(E1, "Steel bodies, tail lifts and <em>40 ft.</em>") + '<div class="bands">' +
   band("steel", "Open steel bodies", "<p>An open corrugated steel body, built to handle large loads and navigate challenging routes. Suited to businesses in construction, agriculture and logistics.</p>") +
   band("taillift", "Closed steel bodies and tail lifts", "<p>An enclosed corrugated steel body with a tail lift for effortless loading and unloading. The lift reduces manual labour and speeds up operations, and can be fitted to any other type of truck.</p>") +
   band("artic", "40 ft bodies", "<p>A fibreglass insulated or dry cargo body on a 40 ft truck. The large storage area moves more goods in a single trip, and the greater payload capacity reduces transport costs.</p>") + "</div>", RED)

# ── 02 pick-up bodies ──
doc.section("Pick-up bodies", "Canopies in fibreglass and steel")
T = "Pick-up bodies"; E2 = "02 · Pick-up bodies"
pg("light", T, head(E2, "Maximise the potential of your <em>pick-up.</em>", "Strong and secure without adding excessive weight, in a variety of styles with integrated storage. We serve government fleets, the army, commercial and leisure customers, and Sai Raj is the choice of most OEMs and fleet operators in the country.") +
   art("pickup") + rows([("Precise canopy", "Fits without compromising the look of the pick-up"), ("Glide canopy", "Multi-purpose, for passengers or goods"), ("Rave canopy", "Streamlined airflow to reduce fuel consumption"),
   ("Insulated fibreglass canopy", "For perishables and temperature-sensitive medical products"), ("Steel canopy", "Higher load-bearing capacity; sliding windows for passengers"), ("Also in the range", "Rhinotop, Inline, Tufftop, V90, Volume Maker")]), RED)
pg("light", T, head(E2, "The <em>canopies.</em>") + tcards([
   ("Precise canopy", "A fibreglass pick-up body made to fit without compromising the look of your truck. It adds security, versatility and extra protection from bad weather."),
   ("Glide canopy", "Designed for multi-purpose use, carrying passengers or goods. Available as a fully enclosed unit with no windows, or made to any specification."),
   ("Rave canopy", "A fibreglass hardtop that streamlines the flow of air to reduce fuel consumption, with weather protection and more flexibility for the pick-up."),
   ("Insulated fibreglass canopy", "For horticulture, the food industry, exporters of perishables and transporters of temperature-sensitive medical products: your pick-up, insulated to protect its load."),
   ("Steel canopy", "Highly durable, with superior protection against impact, weather and theft, and less likely to crack, warp or break. A higher load-bearing capacity carries heavy items; sliding side windows suit passengers."),
   ("Optional extras", "Every canopy can be finished with optional extras to suit your requirements. Also in the range: Rhinotop, Inline, Tufftop, V90 and Volume Maker.")]), RED)

# ── 03 cold chain ──
doc.section("Cold chain", "Insulated bodies, refrigerated vehicles and cold rooms")
T = "Cold chain"; E3 = "03 · Cold chain"
pg("dark", T, head(E3, "Cold, <em>unbroken.</em>", "From the farm to the buyer, one group builds every link: the insulated body, the refrigeration, the cold room and the last-mile box.") +
   '<img class="wide wide--crop2" src="/tools/out/hero-2.jpg" alt=""><div class="push facts"><div><b>65–165 mm</b><span>Insulated panel thicknesses</span></div><div><b>Chilled to deep-frozen</b><span>Body applications</span></div><div><b>Thermo King</b><span>Official dealer</span></div></div>', BLUE)
pg("light", T, head(E3, "Every link, from <em>one group.</em>") + '<div class="grid3 grid3--long">' +
   card("Insulated truck bodies", "Pressed fibreglass panels with a PU, XPS or EPS core, in 65, 90, 115 or 165 mm, for chilled, frozen and deep-frozen loads.", "panel") +
   card("Refrigerated vehicles", "Bodies matched to their refrigeration. Sai Raj is a Thermo King official dealer and a Rivacold partner.", "truck") +
   card("Cold rooms and pack houses", "Lockable insulated doors, stainless steel or fibreglass floors, racking to suit, digital temperature control and a monitoring recorder.", "cold") +
   card("Solar powered cold rooms", "Cold storage powered by the sun.", "solar") +
   card("Reefer containers", "Intermodal solutions for temperature-controlled cargo.", "reefer") +
   card("Last mile and electrification", "Delivery cool boxes for the final leg, and electrification of refrigerated vehicles.", "bikebox") + "</div>" +
   '<p class="note">Medical cold room solutions are available too, with an optional standby refrigeration system.</p>', BLUE)
pg("light", T, head(E3, "Cold rooms and <em>pack houses.</em>", "Sai Raj is not just a provider of cold room technology but a pioneer, with tailored solutions for perishable goods and for medical storage.") + art("cold") +
   '<p class="eb">Cold room features</p>' + rows([("Lockable insulated doors", "Can be opened from the inside"), ("Stainless steel or fibreglass floors", ""), ("Stainless steel or aluminium racks", "To customer requirements"),
   ("Digital electronic temperature controller", ""), ("Temperature monitoring recorder", ""), ("Optional standby refrigeration system", "")]), BLUE)
pg("light", T, head(E3, "Refrigerated <em>vehicles.</em>", "Bodies matched to their refrigeration, for every leg of the journey.") + art("truck") +
   rows([("Thermo King", "Official dealer"), ("Rivacold", "Partner"), ("Electrification", "Of refrigerated vehicles"), ("Last mile", "Delivery cool boxes")]) +
   '<p class="eb" style="margin-top:9mm">Who it is for</p><ol class="sect"><li><b>Horticulture</b><span>Fresh produce kept cold from harvest to handover.</span></li><li><b>Floriculture</b><span>Cut flowers, cold from farm to buyer.</span></li>'
   '<li><b>Dairy</b><span>Milk and dairy held cold through collection, processing and distribution.</span></li><li><b>Meat processing</b><span>Insulated bodies and cold rooms for chilled and frozen product.</span></li></ol>', BLUE)

# ── 04 speciality conversions ──
doc.section("Speciality conversions", "Security, cash-in-transit, mobile units, fire and rescue")
T = "Speciality conversions"; E4 = "04 · Speciality conversions"
pg("light", T, head(E4, "Built around the <em>job.</em>", "Custom-designed fibreglass truck and pick-up bodies and bespoke conversions, for the specific needs of each industry.") + art("special") +
   rows([("Police, security and defence vehicles", "For law enforcement and military use"), ("Cash-in-transit vehicles", "Secure vehicles for transporting valuables"), ("Mobile catering units", "For food and beverage services"),
   ("Roadshow vehicles", "Mobile platforms for events and promotions"), ("Land Cruiser conversions", "Overland expedition vehicles"), ("Van conversions", "For delivery or transportation"),
   ("Mobile workshops and offices", "Mobile workspaces for various industries"), ("Mobile banking units", ""), ("Dog section bodies", "For transporting and handling dogs"), ("Garbage compactors", ""),
   ("Gas cylinder transport bodies", ""), ("Rapid delivery trucks", "")]), RED)
pg("light", T, head(E4, "Security, Land Cruiser and <em>van conversions.</em>") + '<div class="bands">' +
   band("special", "Security and defence", "<p>From bespoke security features to secure transportation and support vehicles, we have been partnering with police forces, defence forces and security companies across the country to provide robust and versatile vehicle modification solutions.</p>") +
   band("bullbar", "Land Cruiser conversions", "<p>Overland expedition vehicles for long-distance and off-road journeys.</p>" + rows([("Roll cage, hi-lift jack, luggage rack and lights", ""), ("Rear wrap-around and front nudge bars", "")], 1)) +
   band("van", "Van conversions", "<p>Customised vans for delivery or transportation, fitted with KEBS approved seats.</p>") + "</div>", RED)
pg("light", T, head(E4, "Fire trucks and rapid intervention <em>vehicles.</em>", "Rescue and Rapid Intervention Vehicles designed to be functional, practical, tough and agile.") + art("fire") +
   '<p class="txt">When emergency services respond to an incident there may be fire to suppress, people to rescue, immediate life support to give and spills to control. The RIV can be equipped to respond to all of these and more.</p>' +
   rows([("Fire suppression, rescue and spill control", ""), ("A crew of three to four", ""), ("Remote area command post", "With real-time communications"), ("Completely customised", "To your specification")]), RED)

# ── 05 trailers ──
doc.section("Trailers", "Farm, catering, tanker, office and camping trailers")
pg("light", "Trailers", head("05 · Trailers", "The right trailer for the <em>route.</em>", "High quality trailers, built with a passion for engineering excellence and continuous product development.") + art("trailer") +
   rows([("Farm trailers", ""), ("Sugarcane trailers", ""), ("Food and catering trailers", ""), ("Parcel vending trailers", ""), ("Dog and animal trailers", ""), ("40 ft trailers", ""),
   ("Water bowsers and water tanks", ""), ("Fuel tank trailers", ""), ("Camping trailers", ""), ("Office trailers", ""), ("Workshop trailers", ""), ("Sherp carriers", "")], 3) +
   '<p class="note">As a strategic partner, we combine your route details with our fleet knowledge to produce the most suitable trailer for you.</p>', RED)

# ── 06 fibreglass ──
doc.section("Fibreglass", "TukTuks, bike boxes, boats and mouldings")
T = "Fibreglass"; E6 = "06 · Fibreglass"
pg("light", T, head(E6, "TukTuks, bike boxes and <em>boats.</em>") + '<div class="bands">' +
   band("bikebox", "TukTuk conversions and bike boxes", "<p>Fibreglass bike boxes give durable, lightweight, weather-resistant storage that protects valuable cargo. Fibreglass TukTuk conversions add durability and efficiency for urban transport and freight.</p>") +
   band("boat", "Fibreglass boats", "<p>All fibreglass is hand-laid for hull strength, and every hull is sub-floor filled with high-density foam.</p>" +
        rows([("Speed, patrol and passenger boats", ""), ("Fishing and work boats", ""), ("Canoes and dinghies", ""), ("Outboard engines", "")], 1)) + "</div>", RED)
pg("light", T, head(E6, "Every design is a <em>masterpiece.</em>", "Sai Raj has been a pioneer in fibreglass mouldings. We can mould any design to your specification.") + art("mould") +
   rows([("Furniture", ""), ("Flower pots", ""), ("Water tanks", ""), ("Tanks and water filters", ""), ("Play stations and slides", ""), ("Queue stands", ""),
   ("Kiosks", ""), ("Guard houses", ""), ("ATMs", ""), ("Laundry trolleys", ""), ("Animal kennels", ""), ("3D and special mouldings", "")], 3), RED)

# ── 07 ordering and contact ──
doc.section("Ordering and contact", "How to brief us, and where to find us")
pg("dark", "Ordering", head("07 · Ordering", "Tell us the vehicle, the load and the <em>route.</em>", "We will reply within one working day.") + '<div class="why">' + "".join(
   f"<div><b>{i+1:02d}</b><h3>{t}</h3><p>{p}</p></div>" for i, (t, p) in enumerate([
   ("Brief", "Tell us the vehicle, the load, the route and the volume."),
   ("Design", "Our designers work with you during the development of each product to discuss the range of features available to you."),
   ("Build", "Designed and manufactured by Sai Raj, in fibreglass composite, steel or aluminium."),
   ("Support", "Comprehensive support from design to after-sales care.")])) + "</div>", RED)
pg("light", "Contact", head("07 · Contact", "Two countries, one <em>team.</em>") + locs(), RED)
pg("dark back", "", '<div class="bk"><img src="/assets/img/logo.webp" alt="Sai Raj"><h2>Built to <em>last.</em></h2><p>Cargotuff · by Sai Raj</p><p>sairaj.global · sairaj.com</p><p class="sm">Proudly made in Kenya.</p></div>', RED)
assert len(doc.pages) == 22, len(doc.pages)

doc.write("cargotuff", '''
.toc{margin-top:11mm;counter-reset:c}
.toc li{counter-increment:c;display:grid;grid-template-columns:13mm 1fr auto;align-items:baseline;padding:3.7mm 0;border-top:.25mm solid #E8DFC9}
.toc li::before{content:"0" counter(c);font-size:7.8pt;letter-spacing:.18em;color:#9A7B14;font-weight:500}
.toc b{font-family:"Playfair Display",serif;font-weight:500;font-size:19pt;line-height:1.2}
.toc span{grid-column:2;font-size:9.4pt;color:#6B6455;margin-top:1mm}
.toc i{grid-row:1;grid-column:3;font-style:normal;font-family:"Playfair Display",serif;font-size:19pt;color:#A30F16}
.about{border-top:.5mm solid #171310;padding-top:5mm}.about .eb{color:#A30F16;margin-bottom:3mm}.about p:last-child{font-size:11.4pt;line-height:1.65;color:#3A332A;max-width:150mm}
.nums--s{margin-top:11mm;gap:9mm 12mm}.nums--s b{font-size:38pt}
.wide--crop{margin-top:-9mm;margin-bottom:-30mm}
.wide--crop2{margin-top:-4mm;margin-bottom:-12mm}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:6mm}.layers + .facts{margin-top:7mm}
.facts div{border-top:.25mm solid rgba(228,213,168,.28);padding-top:3.5mm}
.facts b{display:block;font-family:"Playfair Display",serif;font-weight:500;font-size:15pt;line-height:1.2;color:#E4D5A8}
.facts span{display:block;margin-top:1.6mm;font-size:7.4pt;letter-spacing:.18em;text-transform:uppercase;color:#A99F8B}
.push.facts b{font-size:21pt}
.grid3--long .lcard p{min-height:7.6em}
.tgrid{flex:1 1 0;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:0 12mm;margin-top:11mm;counter-reset:c}
.tcard{counter-increment:c;border-top:.25mm solid #E8DFC9;padding-top:6mm;min-height:0}
.tcard::before{content:"0" counter(c);font-size:7.8pt;letter-spacing:.2em;color:#9A7B14;font-weight:500}
.tcard h3{font-family:"Playfair Display",serif;font-weight:500;font-size:20pt;line-height:1.2;margin:3mm 0 3.5mm}
.tcard p{font-size:10.6pt;color:#4B4439;line-height:1.65}
.txt{font-size:10.6pt;color:#4B4439;line-height:1.65;margin-bottom:6mm;max-width:160mm}
.sect{display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;counter-reset:c}
.sect li{counter-increment:c;border-top:.5mm solid #171310;padding-top:3.5mm;display:grid;gap:1.5mm;align-content:start}
.sect li::before{content:"0" counter(c);font-size:7.6pt;letter-spacing:.18em;color:#9A7B14;font-weight:500}
.sect b{font-family:"Playfair Display",serif;font-weight:500;font-size:14pt;line-height:1.2}.sect span{font-size:8.8pt;color:#6B6455;line-height:1.45}
.bk p + p{margin-top:-5mm}
''')
