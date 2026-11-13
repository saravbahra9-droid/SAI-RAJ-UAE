# sairaj.global

Static site for Sai Raj (Sai Raj Trading FZCO, Dubai · Sai Raj Ltd, Nairobi). No framework and no build step on Vercel: what is in this repo is what is served.

## Pages

| Path | What it is |
|---|---|
| `/` | The story: preloader, 3D hero, 1975 Kenya → the Gulf, sectors, capabilities, what's next, shop band, enquiry |
| `/shop/` | The shop app carried over from the previous site: 12 products, cart, Shopify checkout, brands, range, Sai Raj Club, Desert Dash |
| `/privacy/`, `/terms/` | **Drafts for a lawyer.** Yellow highlights mark what still needs confirming |
| `404.html` | Not-found page |

Links from the old single-page site (`/#/shop`, `/#/product/…`, `/#/contact`) redirect to their new homes.

## Editing

- **Products, prices, Shopify variant IDs, photo crops, brands:** `assets/js/catalog.js`. One file feeds both the home page and the shop.
- **Enquiry form:** posts to Formspree form `meebvwwy` (the `action` on the form in `index.html`; the club form in `assets/js/shop.js` uses the same ID from `catalog.js`).
- **Copy:** straight in the HTML files.
- **Colours and fonts:** tokens at the top of `assets/css/base.css`. Fonts are self-hosted in `assets/fonts/` (Playfair Display, Poppins — SIL Open Font License).
- After changing a CSS or JS file, bump the `?v=1` on its `<link>`/`<script>` tag so browsers pick it up straight away.

## Hero

The 3D hero is `assets/js/hero3d.js`, loaded only after the page is up, only where WebGL works, and never for visitors who ask for reduced motion or data saving. Everyone else gets three still frames (`assets/img/hero-1..3.webp`) that step with the scroll.

Two hero options exist while one is being chosen:

- default — the refrigerated body
- `/?hero=panel` — a single insulated panel

Other switches for checking: `/?flat=1` forces the still frames.

## Tools (not deployed)

`tools/` and `src/` are ignored by Vercel. They only regenerate committed assets.

```
cd tools && npm install
npm run build:hero      # src/hero3d → assets/js/hero3d.js (bundles three.js)
npm run build:posters   # still frames from the 3D scene
npm run build:og        # 1200×630 share image
npm run build:map       # dot map data for the story
npm test                # full check: links, form (mocked), cart links, phone menu, three screen sizes
npm run serve           # local preview on http://127.0.0.1:4173
```

The tests need Google Chrome (`CHROME=/path/to/chrome` if it is not at `/usr/bin/google-chrome`). They never send a real enquiry: Formspree is mocked.

## Branches

- `main` — live
- `redesign` — this rebuild, deployed by Vercel as a preview
