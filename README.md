# sairaj.global

Static site for Sai Raj (Sai Raj Trading FZCO, Dubai · Sai Raj Ltd, Nairobi). No framework and no build step on Vercel: what is in this repo is what is served.

## Pages

| Path | What it is |
|---|---|
| `/` | Group home: preloader, 3D hero, 1975 Kenya → the Gulf, sectors, the six brands, what's next, shop band, partners, enquiry |
| `/cargotuff/` `/pulse/` `/safarituff/` `/cargocool/` `/deco/` | Brand pages, one shared layout, each with its own accent colour and a quote form tagged with the brand |
| `/cold-chain/` | The cold chain across the brands |
| `/partners/` `/contact/` `/downloads/` | Partner brands, the Dubai and Nairobi locations, profile and catalogues |
| `/shop/` | The shop app carried over from the previous site: 12 products, cart, Shopify checkout, range, Sai Raj Club, Desert Dash |
| `/privacy/`, `/terms/` | **Drafts for a lawyer.** Yellow highlights mark what still needs confirming |

Main pages carry no photographs. Drawings are inline SVG line art; product photos live only in the shop.

Links from the old single-page site (`/#/shop`, `/#/product/…`, `/#/contact`) redirect to their new homes.

## Editing

- **Products, prices, Shopify variant IDs, photo crops, brands:** `assets/js/catalog.js`. One file feeds both the home page and the shop.
- **Enquiry form:** posts to Formspree form `meebvwwy` (the `action` on the form in `index.html`; the club form in `assets/js/shop.js` uses the same ID from `catalog.js`).
- **Nav, footer, brand pages, cold chain, partners, contact, downloads:** all come from `tools/build_pages.py`. Edit the data there and run `python3 tools/build_pages.py`; it rewrites those pages and re-injects the shared nav and footer into every other page.
- **Home page copy:** straight in `index.html` (the brands, partners and enquiry blocks are injected by the generator).
- **Colours and fonts:** tokens at the top of `assets/css/base.css`. Fonts are self-hosted in `assets/fonts/` (Playfair Display, Poppins — SIL Open Font License).
- After changing a CSS or JS file, bump the `?v=1` on its `<link>`/`<script>` tag so browsers pick it up straight away.

## Hero

The 3D hero is `assets/js/hero3d.js`, loaded only after the page is up, only where WebGL works, and never for visitors who ask for reduced motion or data saving. Everyone else gets three still frames (`assets/img/hero-1..3.webp`) that step with the scroll.

Switch for checking: `/?flat=1` forces the still frames.

## Tools (not deployed)

`tools/` and `src/` are ignored by Vercel. They only regenerate committed assets.

```
cd tools && npm install
npm run build:hero      # src/hero3d → assets/js/hero3d.js (bundles three.js)
npm run build:posters   # still frames from the 3D scene
npm run build:og        # 1200×630 share image
npm run build:map       # dot map data for the story
npm run build:pdfs      # company profile and catalogue PDFs (see below)
npm test                # full check: links, form (mocked), cart links, phone menu, three screen sizes
npm run serve           # local preview on http://127.0.0.1:4173
```

The tests need Google Chrome (`CHROME=/path/to/chrome` if it is not at `/usr/bin/google-chrome`). They never send a real enquiry: Formspree is mocked.

## PDFs: company profile and catalogues

The downloads on `/downloads/` are built from the same drawings, partner list and addresses as the site, so they stay in step with it:

| PDF in `assets/docs/` | Wording lives in | Print with |
| --- | --- | --- |
| `sai-raj-company-profile-2026.pdf` | `tools/build_profile.py` | `node render-pdf.mjs profile` |
| `cargotuff-cold-chain-catalogue-2026.pdf` | `tools/build_catalogue.py` | `node render-pdf.mjs cargotuff` |
| `sai-raj-product-catalogue-2026.pdf` | `tools/build_parts.py` | `npm run build:parts` (see below) |

```
cd tools && npm run build:pdfs     # rebuilds the profile and the Cargotuff catalogue, then refreshes /downloads/ (file sizes) and the sitemap
```

### Product and parts catalogue

`sai-raj-product-catalogue-2026.pdf` (275 pages) is the original 279-page catalogue rebuilt in the new style: tables are re-typeset from the original's live text, product photos are cropped from its pages.

```
PARTS_SRC=/path/to/original.pdf python3 tools/parts_extract.py   # original PDF -> tools/data/parts.json + photo crops in tools/out/parts/
cd tools && npm run build:parts                                  # two-pass build, print, then check against the original
```

- The original PDF and the photo crops are not in the repo (`tools/out/` is ignored), so the first command is needed once on a new machine. It needs `pdfimages`, `pdftoppm` and `tesseract`.
- `tools/data/parts.json` holds every table row by page and by vehicle. Descriptions, part numbers and units are never edited; only page headings are tidied (`HEAD_FIX` in `tools/build_parts.py`). Vehicle names are listed by hand in `VEHICLES` in `tools/parts_extract.py`.
- `tools/parts_verify.py` fails if any row or part number of the original is missing from the new PDF, or sits under the wrong vehicle.

### Parts finder (`/parts/`)

The same data drives the website's parts finder. `python3 tools/build_pages.py` writes `assets/js/parts-data.js` (39 vehicles plus general accessories) from `tools/data/parts.json`, and `parts/index.html`; the page logic is `assets/js/parts.js`, its styles `assets/css/parts.css`.

- Rows are word for word from the catalogue. Empty template rows (a number but no description) are left out; rows with no part number show "Part no. on request".
- The list a visitor builds is kept in their browser only, and is sent through the same Formspree form as every other enquiry, or as a WhatsApp message.
- To correct a part number, fix it in `tools/data/parts.json` and rebuild: the site and the PDF both pick it up.

Shared page styles and helpers are in `tools/srpdf.py`; change the look of every PDF there. The print step fails if any page overflows. `sitemap.xml` is generated by `tools/build_pages.py`; add new pages to `SITEMAP` there.

## Branches

- `main` — live
- `redesign` — this rebuild, deployed by Vercel as a preview
