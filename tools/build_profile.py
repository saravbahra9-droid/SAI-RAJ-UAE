#!/usr/bin/env python3
"""Builds the Sai Raj company profile (A4): tools/out/profile.html.
Then `node tools/render-pdf.mjs profile` prints assets/docs/sai-raj-company-profile-2026.pdf.
Content: the 2024-25 company profile, restyled to match the website. Shared pieces live in tools/srpdf.py."""
from srpdf import *
doc = Doc("Sai Raj · Company Profile 2026", "Sai Raj — Company Profile 2026"); pg = doc.pg

# 1 cover
pg("dark cover", "", '''<header class="cv__top"><img src="/assets/img/logo.webp" alt="Sai Raj"><span>Company Profile<br><b>2026</b></span></header>
<div class="cv__t"><p class="eb">Since 1975 · Nairobi — Dubai</p><h1>Innovation is in our <em>DNA.</em></h1>
<p class="lede">Kenya’s leading fibreglass moulders, commercial vehicle body manufacturers and vehicle conversion specialists.</p></div>
<img class="cv__img" src="/tools/out/hero-1.jpg" alt=""><p class="cv__foot"><span>sairaj.global</span><span>sairaj.com</span></p>''')
# 2 welcome
pg("light", "About the company", head("Welcome to Sai Raj", "A pioneering fibreglass manufacturer, <em>since 1975.</em>") + '''
<div class="cols"><div class="cols__t"><p>Sai Raj serves the region as a pioneering fibreglass and PVC products manufacturer and fabricator, with a team of highly trained professionals committed to quality products and the services that go with them.</p>
<p>For fifty years we have provided clients with bespoke innovations, by maintaining a system that can integrate developments as they occur. The cost and quality advantages are passed on to our customers.</p>
<p>We offer the largest, most diverse range of products available in the market today. Our designers work with you during the development of each product to discuss the range of features available to you.</p></div>
<div class="vm"><div><p class="eb">Our vision</p><p>To make Sai Raj the first-choice manufacturer and reliable vendor of high quality products, vehicle body work, accessories and preferred allied products.</p></div>
<div><p class="eb">Our mission</p><p>To be trusted to deliver excellence with quality, service, flexibility and innovation at affordable prices.</p></div></div></div>
<div class="strip">''' + "".join(f'<div>{ILL[k]}<span>{t}</span></div>' for k, t in [("truck", "Truck bodies"), ("pickup", "Pick-up bodies"), ("cold", "Cold rooms"), ("ambulance", "Ambulances"), ("game", "Game vehicles"), ("boat", "Boats")]) + "</div>")
# 3 at a glance
pg("dark", "At a glance", head("At a glance", "Fifty years, in <em>four numbers.</em>") + '''
<div class="nums"><div><b>1975</b><span>Founded in Kenya</span></div><div><b>10,000+</b><span>Clients served</span></div><div><b>50+</b><span>Awards</span></div><div><b>10+</b><span>Countries exported to, across Africa</span></div></div>
<div class="push"><p class="eb">What we make</p>''' + rows([("Fibreglass and steel truck bodies", ""), ("Pick-up bodies", ""), ("Vehicle conversions and speciality fabrications", ""), ("Fleet conversions", ""),
 ("Cold rooms and refrigerated vehicles", ""), ("Trailers and boats", ""), ("4x4 accessories and camping gear", ""), ("Ceramic coating and paint protection", ""),
 ("uPVC roofing sheets and polycarbonate sheets", ""), ("PVC ceiling panels", ""), ("Fibreglass tanks and furniture", ""), ("Fibreglass mouldings to client needs", "")]) + "</div>")
# 4 story
pg("light", "Our story", '<div class="st"><div class="st__l">' + head("Our story", "From a Nairobi workshop to <em>the Gulf.</em>") +
   '<ul class="keys"><li><b>Nairobi, Kenya</b><span>Head office and production, since 1975</span></li><li><b>Dubai, UAE</b><span>Sai Raj Trading FZCO, Jebel Ali Freezone (JAFZA)</span></li></ul></div>' + MAP + """</div><ol class="tl">
<li><b>1975 · Nairobi, Kenya</b><span>Sai Raj is founded in Kenya, hand-laying fibreglass.</span></li>
<li><b>Manufacturing</b><span>The workshop becomes a manufacturer and a pioneer of fibreglass in Kenya. Under the Cargotuff name come truck bodies, pick-up bodies and conversions.</span></li>
<li><b>Cold chain</b><span>Insulated bodies, cold rooms and Thermo King refrigeration: complete cold chain solutions.</span></li>
<li><b>Across Africa</b><span>Exports reach more than ten countries on the continent.</span></li>
<li><b>Dubai and the Gulf</b><span>Sai Raj Trading FZCO opens in Jebel Ali Freezone, Dubai.</span></li></ol>""")
# 5 the group
G = [("Cargotuff", "#E0262E", "truck", "Truck and pick-up bodies, conversions, trailers, boats and cold rooms."), ("Pulse", "#E0262E", "ambulance", "Ambulances and mobile clinics."),
     ("Safarituff", "#D4A017", "game", "Open game vehicles, 4x4 conversions and steel accessories."), ("Cargocool", "#3FA9E6", "fridge", "Portable fridge-freezers and cooler boxes."),
     ("Decoroof", "#3FAE5A", "roof", "uPVC roofing sheets, proudly made in Kenya."), ("Decoglaze", "#3FAE5A", "glaze", "Twin-wall polycarbonate glazing, proudly made in Kenya.")]
pg("dark", "The group", head("The group", "One company. Six <em>brands.</em>", "Each brand carries one part of the work.") + '<div class="grid6">' +
   "".join(f'<div class="bcard" style="--acc:{c}"><div class="bcard__a">{ILL[a]}</div><h3>{n}<i>by Sai Raj</i></h3><p>{t}</p></div>' for n, c, a, t in G) + "</div>")
# 6 truck bodies
pg("light", "Cargotuff", head("Cargotuff · Truck bodies", "Built to <em>last.</em>", "Insulated and dry freight fibreglass composite, steel and aluminium truck bodies, relied upon by East Africa’s leading businesses, transporters and long-distance hauliers to carry everything from frozen ice-cream to day-old chicks, from beef to bread.") +
   art("truck") + rows([("Rigicore fibreglass", "Robust double-skin panel construction"), ("Single skin fibreglass", "General cargo, single or double doors, floor finish options"),
   ("Insulated bodies", "65, 90, 115 or 165 mm PU, XPS or EPS pressed fibreglass panels for chilled, frozen and deep-frozen loads"), ("Open steel bodies", "Corrugated steel for construction, agriculture and logistics"),
   ("Closed steel bodies and tail lifts", "A tail lift can be fitted to any type of truck"), ("40 ft bodies", "Insulated or dry cargo, for greater payload per trip")]))
# 7 pick-up bodies
pg("light", "Cargotuff", head("Cargotuff · Pick-up bodies", "Maximise the potential of your <em>pick-up.</em>", "Strong and secure without adding excessive weight. We serve government fleets, the army, commercial and leisure customers, and Sai Raj is the choice of most OEMs and fleet operators in the country.") +
   art("pickup") + rows([("Precise canopy", "Fits without compromising the look of the pick-up"), ("Glide canopy", "Multi-purpose, for passengers or goods; enclosed or to any specification"),
   ("Rave canopy", "Streamlined airflow to reduce fuel consumption"), ("Insulated fibreglass canopy", "For horticulture, food, perishables and temperature-sensitive medical products"),
   ("Steel canopy", "Higher load-bearing capacity; sliding windows for carrying passengers"), ("Optional extras", "To suit your requirements")]))
# 8 cold chain
pg("dark", "Cold chain", head("Cargotuff · Cold chain", "Cold, <em>unbroken.</em>", "Sai Raj is not just a provider of cold room technology but a pioneer. Beyond refrigerated space for perishable goods, we also offer medical cold room solutions.") +
   '<img class="wide" src="/tools/out/hero-3.jpg" alt=""><div class="push"><p class="eb">The insulated wall, separated</p><ol class="layers"><li><b>Gelcoat finish</b></li><li><b>Fibreglass skin</b></li><li><b>PU, XPS or EPS core</b></li><li><b>Fibreglass inner skin</b></li></ol>'
   '<p class="cap">Pressed panels in 65, 90, 115 or 165 mm, for chilled, frozen and deep-frozen loads.</p></div>', "#3FA9E6")
# 9 cold chain links
L = [("Insulated truck bodies", "For chilled, frozen and deep-frozen loads.", "panel"), ("Refrigerated vehicles", "Thermo King official dealer; Rivacold partner.", "truck"), ("Cold rooms and pack houses", "Tailored to your needs.", "cold"),
     ("Solar powered cold rooms", "Cold storage powered by the sun.", "solar"), ("Reefer containers", "Intermodal solutions.", "reefer"), ("Last mile and electrification", "Delivery cool boxes; electrification of refrigerated vehicles.", "bikebox")]
pg("light", "Cold chain", head("Our cold chain solutions", "Every link, from <em>one group.</em>") + '<div class="grid3">' + "".join(f'<div class="lcard"><div class="lcard__a">{ILL[a]}</div><h3>{n}</h3><p>{t}</p></div>' for n, t, a in L) + "</div>" +
   '<div class="feat"><p class="eb">Cold room features</p>' + rows([("Lockable insulated doors", "Can be opened from the inside"), ("Stainless steel or fibreglass floors", ""), ("Stainless steel or aluminium racks", "To customer requirements"),
   ("Digital electronic temperature controller", ""), ("Temperature monitoring recorder", ""), ("Optional standby refrigeration system", "")], 3) + "</div>", "#3FA9E6")
# 10 speciality conversions
pg("light", "Cargotuff", head("Cargotuff · Speciality conversions", "Built around the <em>job.</em>", "Custom-designed fibreglass truck and pick-up bodies and bespoke conversions, for the specific needs of each industry.") + art("special") +
   rows([("Police, security and defence vehicles", "For law enforcement and military use"), ("Cash-in-transit vehicles", "Secure vehicles for transporting valuables"), ("Mobile catering and vending units", ""),
   ("Roadshow vehicles", "Mobile platforms for events and promotions"), ("Land Cruiser conversions", "Overland expedition vehicles"), ("Van conversions", "With KEBS approved seats"),
   ("Mobile workshops, offices and call centres", ""), ("Mobile banking units", ""), ("Dog section bodies", ""), ("Garbage compactors, troop carriers, water bowsers", ""),
   ("Gas cylinder transport bodies", ""), ("Rapid delivery trucks", "")]) +
   '<p class="note">We have been partnering with police forces, defence forces and security companies across the country, using our expertise to provide robust and versatile vehicle modification solutions.</p>')
# 11 fire + trailers
pg("light", "Cargotuff", head("Cargotuff · Fire trucks and trailers", "Ready for the <em>call.</em>", "Rescue and Rapid Intervention Vehicles designed to be functional, practical, tough and agile, and trailers for every kind of load.") + '<div class="bands">' +
   band("fire", "Fire trucks and RIVs", '<p>Each RIV is completely customised to your specification.</p>' + rows([("Fire suppression, rescue and spill control", ""), ("A crew of three to four", ""), ("Remote area command post", "With real-time communications")], 1)) +
   band("trailer", "Trailers", rows([("Farm, tipping and sugarcane trailers", ""), ("Food, catering and parcel vending trailers", ""), ("40 ft, fuel tank and water bowser trailers", ""), ("Office, workshop and camping trailers", ""), ("Dog and animal trailers, Sherp carriers", "")], 1)) + "</div>")
# 12 tuktuk, boats, mouldings
pg("light", "Cargotuff", head("Cargotuff · Fibreglass", "Every design is a <em>masterpiece.</em>", "Sai Raj has been a pioneer in fibreglass mouldings. We can mould any design to your specification.") + '<div class="bands">' +
   band("bikebox", "TukTuk conversions and bike boxes", "<p>Durable, lightweight, weather-resistant storage, and fibreglass conversions for urban transport and freight.</p>") +
   band("boat", "Fibreglass boats", "<p>All fibreglass is hand-laid for hull strength, and every hull is sub-floor filled with high-density foam. Speed boats, patrol boats, canoes, dinghies, work boats and outboard engines.</p>") +
   band("mould", "Mouldings", "<p>Furniture, flower pots, water tanks and filters, kiosks, guard houses, ATMs, play stations and slides, queue stands, 3D and special mouldings.</p>") + "</div>")
# 13 pulse
pg("light", "Pulse", head("Pulse · Mobile clinics and ambulances", "Built to save <em>lives.</em>", "East Africa’s trusted expert in mobile clinic conversions and ambulances. Vans, trucks and 4x4s, equipped with medical equipment from trusted suppliers to ensure optimal patient care.") +
   art("ambulance") + '<blockquote>We build secure, dependable and high-performance ambulances to empower heroes in saving lives.</blockquote>' +
   rows([("Ambulances", "Conversions and custom builds for ambulance and patient transport services"), ("Mobile clinics", "A variety of configurations for different medical requirements"), ("X-ray vans", ""), ("Optional features", "A wide range, to a higher standard")]))
# 14 safarituff
pg("light", "Safarituff", head("Safarituff · Tour conversions", "Built tough for the <em>terrain.</em>", "Open game vehicles designed to be functional, practical and built tough for the African terrain. We have redesigned the traditional open game vehicle to enhance its usability with innovation and quality.") +
   art("game") + rows([("Open game vehicles", "Designed to suit your spec"), ("4x4 conversions", ""), ("Steel accessories", "Bull bars, roll bars, roof racks and more"), ("Aftermarket 4x4 accessories", "The widest range, to suit your requirements")]) +
   '<div class="lists"><div><p class="eb">4x4 accessories</p><p>Bull bars, LED lights, suspension kits, snorkels, underbody protection, compressors, recovery tracks and winches.</p></div>'
   '<div><p class="eb">Camping gear</p><p>Rooftop tents and awnings, fridges, drawers, camp chairs and tables.</p></div></div>', "#D4A017")
# 15 cargocool
pg("light", "Cargocool", head("Cargocool · Portable cooling", "Make your adventures <em>cooler.</em>", "DC portable fridge-freezers that keep food and drinks cool and fresh on a weekend camping trip or a long road journey.") +
   art("fridge") + '<p class="eb">The range</p><div class="models">' + "".join(f"<div><b>{m}</b><span>Portable fridge-freezer</span></div>" for m in ("DC-15F", "GC40", "GC40e", "GC40p")) + "</div>" +
   rows([("Cooler boxes", "Portable cooler boxes by Sai Raj")], 1), "#3FA9E6")
# 16 deco
pg("light", "Building and construction", head("Decoroof · Decoglaze", "Proudly made in <em>Kenya.</em>", "Roofing and glazing products for domestic, industrial and agricultural buildings.") + '<div class="bands">' +
   band("roof", "Decoroof", rows([("uPVC roofing sheets", ""), ("Fibreglass translucent sheets", ""), ("Ridge caps and barge boards", ""), ("PVC ceiling panels", "")], 1)) +
   band("glaze", "Decoglaze", rows([("Twin-wall polycarbonate sheets", ""), ("Roofing, car ports, canopies and awnings", ""), ("Domes and greenhouses", ""), ("Glazing for partitions and doors", "")], 1)) + "</div>", "#3FAE5A")
# 17 partners
pg("light", "Our partners", head("Our partners", "The brands we build <em>with.</em>", "By collaborating with global brands, we give our customers access to the latest innovations and technologies.") + '<div class="pgroups">' +
   "".join(f'<div class="pgroup"><p class="eb">{g}</p><ul>' + "".join(f"<li><b>{n}{' <i>Official dealer</i>' if n == 'Thermo King' else ''}</b><span>{d.replace('Official dealer. ', '')}</span></li>" for n, d in items) + "</ul></div>" for g, items in PARTNERS) + "</div>")
# 18 why
pg("dark", "Why Sai Raj", head("Why work with us", "Four <em>reasons.</em>") + '<div class="why">' + "".join(f"<div><b>{i+1:02d}</b><h3>{t}</h3><p>{p}</p></div>" for i, (t, p) in enumerate([
   ("Experienced team", "Fifty years of expertise in fibreglass moulding, vehicle body manufacturing and conversions, with bespoke solutions tailored to your needs."),
   ("Excellent support", "Comprehensive support from design to after-sales care, for a seamless customer experience."),
   ("Excellent standard", "High quality standards across a diverse range of products, from vehicle conversions to fibreglass items."),
   ("Always innovating", "We continuously improve our designs and processes to deliver innovative and cost-effective solutions.")])) + "</div>")
# 19 contact
pg("light", "Contact", head("Contact us", "Two countries, one <em>team.</em>") + locs())
# 20 back cover
pg("dark back", "", '<div class="bk"><img src="/assets/img/logo.webp" alt="Sai Raj"><h2>Take your business to the <em>next level.</em></h2><p>sairaj.global · sairaj.com</p><p class="sm">Proudly made in Kenya. Thank you to all our valued customers.</p></div>')
assert len(doc.pages) == 20, len(doc.pages)
doc.write("profile")
