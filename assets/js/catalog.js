/* ════════════════════════════════════════════════════════════
   SAI RAJ — catalog.js
   Shop data, shared by the home page and /shop.
   Everything below is carried over unchanged from the previous
   single-file site: Shopify domain, variant IDs, AED prices,
   photo crops, categories, range and brands.

   To edit a product: change it here once; both pages update.
   ════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════
   SHOPIFY CONFIG — the only block you need to edit.
   domain    → your Shopify store domain.
   handle    → product URL slug (links to product page).
   variantId → OPTIONAL numeric variant ID; if set, Add to Cart
               becomes an instant cart permalink with quantity.
   ════════════════════════════════════════════════════════════ */
const SHOPIFY = { domain: "sai-raj-uae.myshopify.com" };

/* Formspree — create a free form at formspree.io, copy its 8-character
   ID (the last part of the endpoint URL) and paste it below to activate
   the enquiry form. Until then, submissions open an email draft instead. */
const FORMSPREE = { id: "meebvwwy" };
const WA = "https://wa.me/971543256505";
const IMG = "";  // images now served from Shopify CDN

/* ════════════════════════════════════════════════════════════
   PHOTO CROPS — each entry shows ONE photo from a collage.
   size: how far to zoom in ("212%" ≈ one quadrant of a 2x2,
         "cover" = whole image for single-photo shots)
   pos:  which photo — "0% 0%" top-left · "100% 0%" top-right
         "0% 100%" bottom-left · "100% 100%" bottom-right
   If a tile shows the wrong photo, just change pos.
   ════════════════════════════════════════════════════════════ */
const PIC = {
  trucks:    {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/TRuck_20bodies_20_282_29.webp?v=1783181922",              size:"212%", pos:"100% 0%"},
  pickups:   {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/pick_20up_20bodies.webp?v=1783181922",                    size:"212%", pos:"100% 0%"},
  canopies:  {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/canopies_20_281_29.webp?v=1783181922",                    size:"212%", pos:"0% 0%"},
  bedliners: {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/bedliners_2C_20lids_20covers.webp?v=1783181922",          size:"212%", pos:"0% 0%"},
  convers:   {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/conversions.webp?v=1783181922",                           size:"212%", pos:"0% 0%"},
  riv:       {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/riv.webp?v=1783181922",                                   size:"cover", pos:"50% 45%"},
  bikebox:   {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/bike_20boxes_20_282_29.webp?v=1783181923",                size:"212%", pos:"0% 0%"},
  coldrooms: {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/coldrooms.webp?v=1783181923",                             size:"212%", pos:"0% 0%"},
  trailers:  {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/Bike_20boxes_20_281_29.webp?v=1783181922",                size:"212%", pos:"0% 0%"},
  fourx4:    {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/safarituff_204_204_20accessories_20.webp?v=1783181922",   size:"cover", pos:"50% 45%"},
  camping:   {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/winboCamping.webp?v=1783181922",                         size:"cover", pos:"50% 45%"},
  roofing:   {s:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/Roofing_20sheets_20_26_20polycarboates.webp?v=1783181923",size:"212%", pos:"0% 0%"}
};
const bim = (k, alt) => {
  const m = PIC[k]; if (!m) return "";
  return `<div class="bim" role="img" aria-label="${alt}" style="background-image:url('${IMG+m.s}');background-size:${m.size};background-position:${m.pos}"></div>`;
};

const PRODUCTS = [
  {id:"frp-pickup-canopy", title:"FRP Pick-up Canopy", cat:"Canopies", price:4750, was:0, img:"canopies",
   sub:"Colour-coded · lockable · ready to fit", handle:"frp-pick-up-canopy", variantId:"58396788326787",
   desc:"Hand-laid fibreglass canopy engineered for Gulf heat. Colour-coded to your vehicle with lockable rear access and sliding side windows.",
   specs:[["Vehicle fit","Hilux · Ranger · L200 · Navara"],["Shell","Hand-laid FRP, UV-stable gelcoat"],["Windows","Sliding sides + lockable rear door"],["Finish","Colour-coded to factory paint"],["Supply","Delivered ready to fit"],["Weight","60 kg"]]},
  {id:"bedliner-lid-cover", title:"Bedliner, Lid & Cover", cat:"Canopies", price:2950, was:0, img:"bedliners",
   sub:"Lockable one-piece FRP lid", handle:"bedliner-lid-amp-cover", variantId:"58396788621699",
   desc:"One-piece lockable FRP lid with weatherproof sealing — keeps cargo secure, dust-free and out of sight.",
   specs:[["Type","One-piece lockable FRP lid"],["Finish","Colour-coded"],["Hardware","Gas struts included"],["Sealing","Full weatherproof rubber seal"],["Fit","Most double-cab pick-ups"],["Weight","32 kg"]]},
  {id:"safarituff-drawer-system", title:"Safarituff Drawer System", cat:"4x4", price:3250, was:0, img:"fourx4",
   sub:"Twin lockable drawers · 80 kg each", handle:"safarituff-drawer-system", variantId:"58396788720003",
   desc:"Twin full-extension drawers with a carpeted load deck. Organise recovery gear, tools and camp kit — built by Safarituff.",
   specs:[["Layout","Dual drawers, full extension"],["Deck","Carpeted top load deck"],["Security","Central locking"],["Capacity","80 kg per drawer"],["Extras","Modular tie-down points"],["Weight","55 kg"]]},
  {id:"full-length-roof-rack", title:"Full-Length Steel Roof Rack", cat:"4x4", price:1850, was:0, img:"",
   sub:"Flat platform · powder-coated", handle:"full-length-steel-roof-rack", variantId:"58396789506435",
   desc:"Flat steel platform running cab to bed. Powder-coated, T-slot channels for lights, awnings and recovery boards.",
   specs:[["Coverage","Full cab + bed length"],["Material","Powder-coated steel"],["Load","150 kg dynamic"],["Mounting","Gutter / track mount"],["Channels","T-slot accessory rails"],["Weight","40 kg"]]},
  {id:"recovery-kit-8pc", title:"8-Piece Recovery Kit", cat:"4x4", price:695, was:0, img:"",
   sub:"Snatch strap, shackles, damper + bag", handle:"8-piece-recovery-kit", variantId:"58396789899651",
   desc:"Everything to get unstuck from the sand: snatch strap, rated shackles, damper blanket, gloves and a heavy-duty bag.",
   specs:[["Strap","8-tonne snatch strap"],["Shackles","2 × 4.75 t rated"],["Safety","Damper blanket included"],["Extras","Gloves + hitch receiver"],["Bag","Heavy-duty carry bag"],["Weight","12 kg"]]},
  {id:"led-driving-lights-9in", title:'9" LED Driving Lights (Pair)', cat:"4x4", price:1095, was:0, img:"",
   sub:"1,200 m of light · pair", handle:"9-led-driving-lights-pair", variantId:"58396791964035",
   desc:"Serious distance for desert night runs. Spot + flood combo beam with full wiring harness in the box.",
   specs:[["Beam","Spot + flood combo"],["Distance","1,200 m (pair, 1 lux)"],["Rating","IP68 dust & waterproof"],["Includes","Wiring harness + switch"],["Compliance","E-marked"],["Weight","5 kg (pair)"]]},
  {id:"alloy-wheels-17-set", title:'17" Alloy Wheels — Set of 4', cat:"4x4", price:3795, was:0, img:"",
   sub:"Load-rated · matte black", handle:"17-alloy-wheels-set-of-4", variantId:"58396793307523",
   desc:"Load-rated matte black alloys sized for GCC-spec 4x4s. Sold as a set of four with caps and nuts.",
   specs:[["Size","17 x 9"],["PCD","6 x 139.7"],["Load rating","1,250 kg per wheel"],["Finish","Matte black"],["Includes","Centre caps + wheel nuts"],["Weight","62 kg (set)"]]},
  {id:"hardshell-roof-tent", title:"Hardshell Roof Tent", cat:"Camping", price:5995, was:0, img:"camping",
   sub:"Camp-ready in 60 seconds", handle:"hardshell-roof-tent", variantId:"58396793471363",
   desc:"Sixty seconds from parked to camped. ABS hardshell with a proper mattress — overlanding without the setup fight.",
   specs:[["Sleeps","2 adults"],["Setup","~60 seconds"],["Shell","ABS hardshell"],["Mattress","75 mm high-density foam"],["Mounting","Universal crossbar"],["Weight","58 kg"]]},
  {id:"side-awning-25m", title:"Side Awning 2.5 m", cat:"Camping", price:795, was:0, img:"",
   sub:"Instant shade · UV50+ ripstop", handle:"side-awning-2-5-m", variantId:"58396793766275",
   desc:"2.5 × 2.5 m of shade off the side of your truck in thirty seconds. Ripstop UV50+ fabric with poles and pegs included.",
   specs:[["Coverage","2.5 × 2.5 m"],["Fabric","Ripstop, UV50+"],["Mount","Universal roof rack"],["Includes","Poles, pegs, guy ropes"],["Weight","12 kg"]]},
  {id:"cargocool-cooler-box-45l", title:"Cargocool Cooler Box 45 L", cat:"Cooling", price:595, was:0, img:"",
   sub:"Ice for up to 5 days", handle:"cargocool-cooler-box-45-l", variantId:"58396794225027",
   desc:"Sai Raj's own portable cooler box. Thick PU insulation keeps ice for days — desert weekends, fishing trips, site work.",
   specs:[["Capacity","45 L"],["Insulation","Thick PU core"],["Ice retention","Up to 5 days"],["Liner","Food-grade"],["Made by","Cargocool — a Sai Raj brand"],["Weight","8 kg"]]},
  {id:"cargocool-cooler-box-90l", title:"Cargocool Cooler Box 90 L", cat:"Cooling", price:945, was:0, img:"",
   sub:"Big trips · 6-day ice retention", handle:"cargocool-cooler-box-90-l", variantId:"58396794421635",
   desc:"The big Cargocool for long hauls and large groups. Drain plug, heavy-duty hinges and serious insulation.",
   specs:[["Capacity","90 L"],["Insulation","Thick PU core"],["Ice retention","Up to 6 days"],["Drain","Quick-drain plug"],["Hinges","Heavy-duty stainless"],["Weight","13 kg"]]},
  {id:"portable-fridge-freezer-45l", title:"Portable Fridge/Freezer 45 L", cat:"Cooling", price:1650, was:0, img:"",
   sub:"−20 °C off 12 V · app control", handle:"portable-fridge-freezer-45-l", variantId:"58396794880387",
   desc:"True fridge/freezer performance off 12 V. App control, removable basket and battery protection built in.",
   specs:[["Power","12/24 V DC + 220 V"],["Range","−20 °C to +10 °C"],["Control","Bluetooth app"],["Basket","Removable"],["Protection","Low-voltage cutoff"],["Weight","20 kg"]]}
];

const CATS = [
  ["Canopies","Canopies & lids","canopies"],
  ["4x4","4x4 accessories","fourx4"],
  ["Camping","Camping gear","camping"],
  ["Cooling","Cooling & fridges","coldrooms"]
];

const RANGE = [
  ["Truck Bodies","trucks"],["Pick-up Bodies","pickups"],["Speciality Conversions","convers"],
  ["Fire Rescue & RIV","riv"],["Canopies","canopies"],["Bedliners, Lids & Covers","bedliners"],
  ["Motorbike Boxes","bikebox"],["Coldrooms","coldrooms"],["Trailers & Boats","trailers"],
  ["4x4 Accessories","fourx4"],["Camping Gear","camping"],["Roofing Products","roofing"]
];

const BRANDS = [
  {k:"cargotuff", name:"Cargotuff", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/CARGO_20TUFF.webp?v=1783181922",
   tag:"Heavy-duty cargo protection by Sai Raj",
   desc:"Tough load-bed protection built to take abuse in the tray — bedliners, lids and cargo solutions moulded for hard daily use.",
   ids:["bedliner-lid-cover"], shop:"#/shop/Canopies"},
  {k:"cargocool", name:"Cargocool", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/CargoCool_20Logo_205_20Approved-01.webp?v=1783181922",
   tag:"Portable cooler boxes by Sai Raj",
   desc:"Sai Raj's own cooler box line. Thick PU insulation designed for East African and Gulf heat — days of ice retention on fishing trips, desert weekends and site work.",
   ids:["cargocool-cooler-box-45l","cargocool-cooler-box-90l"], shop:"#/shop/Cooling"},
  {k:"pulse", name:"Pulse", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/Pulse_20Ambulance_20and_20Mobile_20Clinic_20Logo-01.webp?v=1783181922",
   tag:"Ambulance & mobile clinic conversions by Sai Raj",
   desc:"Emergency and healthcare vehicle builds — ambulances and mobile clinics converted to spec for fleets, hospitals and NGOs across the region.",
   ids:[], shop:""},
  {k:"safarituff", name:"Safarituff", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/Safarituff_20Logo_201.webp?v=1783181922",
   tag:"4x4 conversions & steel accessories by Sai Raj",
   desc:"The overlanding workhorse brand — drawer systems, racks, recovery gear and steel 4x4 accessories engineered for safari and desert duty.",
   ids:["safarituff-drawer-system","full-length-roof-rack","recovery-kit-8pc"], shop:"#/shop/4x4"},
  {k:"carryboy", name:"Carryboy", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/carryboy_20Logo.webp?v=1783181922",
   tag:"Authorised dealer — world-class canopies & auto accessories",
   desc:"Sai Raj is an authorised Carryboy dealer, supplying their canopies and vehicle accessories with full colour-coding.",
   ids:["frp-pickup-canopy"], shop:"#/shop/Canopies"},
  {k:"decoroof", name:"Deco Roof", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/DECO_20ROOF.webp?v=1783181922",
   tag:"Roofing products, proudly made in Kenya",
   desc:"Roofing sheets and polycarbonates manufactured by Sai Raj in Nairobi — built for equatorial sun and heavy rains, supplied in volume for projects.",
   ids:[], shop:""},
  {k:"decoglaze", name:"Deco Glaze", img:"https://cdn.shopify.com/s/files/1/1025/4549/0307/files/DECO_20GRAZE.webp?v=1783181923",
   tag:"Glazing solutions, proudly made in Kenya",
   desc:"Decorative and architectural glazing products from the Sai Raj factory in Nairobi, specced per project alongside the Deco Roof range.",
   ids:[], shop:""}
];

/* ── Shared helpers ── */
const money = n => n.toLocaleString("en-US");
function cartHref(p, qty = 1){
  if (p.variantId) return `https://${SHOPIFY.domain}/cart/${p.variantId}:${qty}`;
  if (p.handle)    return `https://${SHOPIFY.domain}/products/${p.handle}`;
  return WA;
}
window.SR = { SHOPIFY, FORMSPREE, WA, PIC, PRODUCTS, CATS, RANGE, BRANDS, bim, money, cartHref };
