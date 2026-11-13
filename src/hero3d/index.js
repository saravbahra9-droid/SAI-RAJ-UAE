/* ════════════════════════════════════════════════════════════
   SAI RAJ — hero 3D scene (source)
   Bundled to /assets/js/hero3d.js by tools/build-hero.mjs and
   lazy-loaded by home.js. Everything is procedural: no model
   files, no texture downloads except the Sai Raj logo.

   variant "body"  — a refrigerated fibreglass truck body whose
                     doors open and whose wall separates into layers
   variant "panel" — a single insulated panel that separates
   ════════════════════════════════════════════════════════════ */
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh, InstancedMesh, Object3D,
  BoxGeometry, CylinderGeometry, PlaneGeometry,
  MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial,
  Color, Vector3, DirectionalLight, HemisphereLight, PointLight,
  PMREMGenerator, CanvasTexture, TextureLoader, SRGBColorSpace, ACESFilmicToneMapping,
  RepeatWrapping, MathUtils
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const { clamp, lerp, degToRad } = MathUtils;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ── procedural textures ─────────────────────────────────── */
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(size, draw, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}
const texGRP = () => canvasTex(512, (g, s) => {           // chopped-strand glass in resin
  const r = rng(7);
  g.fillStyle = '#93a07a'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 2600; i++) {
    const x = r() * s, y = r() * s, a = r() * Math.PI, l = 14 + r() * 46;
    g.strokeStyle = r() > .3 ? `rgba(246,250,232,${.16 + r() * .42})` : `rgba(58,72,44,${.10 + r() * .2})`;
    g.lineWidth = .6 + r() * 1.5;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}, [2, 2.6]);
const texFoam = () => canvasTex(256, (g, s) => {          // closed-cell insulation core
  const r = rng(21);
  g.fillStyle = '#e3c877'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 5200; i++) {
    const x = r() * s, y = r() * s, q = .6 + r() * 1.7;
    g.fillStyle = r() > .5 ? `rgba(255,246,208,${.25 + r() * .35})` : `rgba(150,120,52,${.1 + r() * .2})`;
    g.beginPath(); g.arc(x, y, q, 0, 6.3); g.fill();
  }
}, [3, 4]);
const texFloor = () => canvasTex(128, (g, s) => {         // ribbed aluminium floor
  g.fillStyle = '#aeb3b6'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#7f868a' : '#d5d9db'; g.fillRect(0, i * 16 + 5, s, 3); }
}, [1, 9]);
const texLouvre = () => canvasTex(128, (g, s) => {
  g.fillStyle = '#1c1b1a'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 16; i++) { g.fillStyle = '#34322f'; g.fillRect(0, i * 8, s, 3); }
}, [1, 1]);
const texGlow = (inner, outer) => canvasTex(256, (g, s) => {
  const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, s, s);
});

/* ── scene ───────────────────────────────────────────────── */
export function init(opts) {
  const { canvas, focus, pins = [], variant = 'body', logoUrl = '/assets/img/logo.webp', still = false,
          onReady = () => {}, onFail = () => {} } = opts;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: still });
  } catch (e) { onFail(e); return null; }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  const camera = new PerspectiveCamera(26, 1, 0.1, 120);

  /* lights */
  scene.add(new HemisphereLight(0xfff4e2, 0x1c1612, 0.22));
  const key = new DirectionalLight(0xfff0dc, 1.55); key.position.set(-3.5, 8, 6.5); scene.add(key);
  const fillF = new DirectionalLight(0xd4e6f2, 0.42); fillF.position.set(8, 2.5, 2); scene.add(fillF);
  const fillR = new DirectionalLight(0xffe2c0, 0.5); fillR.position.set(-8, 3, 1.5); scene.add(fillR);

  /* materials */
  const M = {
    gel: new MeshPhysicalMaterial({ color: 0xf5f1e8, roughness: 0.3, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.22 }),
    white: new MeshStandardMaterial({ color: 0xf2eee5, roughness: 0.42, metalness: 0 }),
    inner: new MeshStandardMaterial({ color: 0xe3e8e8, roughness: 0.5, metalness: 0 }),
    red: new MeshBasicMaterial({ color: 0xed1c24, toneMapped: false }),
    grp: new MeshStandardMaterial({ map: texGRP(), roughness: 0.62, metalness: 0 }),
    foam: new MeshStandardMaterial({ map: texFoam(), roughness: 0.96, metalness: 0 }),
    alu: new MeshStandardMaterial({ color: 0xdfe1e3, roughness: 0.42, metalness: 0.62 }),
    steel: new MeshStandardMaterial({ color: 0x26201b, roughness: 0.55, metalness: 0.55 }),
    rubber: new MeshStandardMaterial({ color: 0x151413, roughness: 0.9, metalness: 0 }),
    floor: new MeshStandardMaterial({ map: texFloor(), roughness: 0.4, metalness: 0.75 }),
    kraft: new MeshStandardMaterial({ color: 0xc39a63, roughness: 0.86, metalness: 0 }),
    unit: new MeshStandardMaterial({ color: 0xe9ebec, roughness: 0.38, metalness: 0.1 }),
    louvre: new MeshStandardMaterial({ map: texLouvre(), roughness: 0.6, metalness: 0.3 }),
    strip: new MeshBasicMaterial({ color: 0xdff3f8 }),
    led: new MeshBasicMaterial({ color: 0x9fe3f2 })
  };

  const root = new Group(); scene.add(root);
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };
  const box = (parent, w, h, d, mat, x, y, z) => add(parent, new BoxGeometry(w, h, d), mat, x, y, z);

  /* the four-layer panel, used by both variants */
  const LAYERS = [
    { key: 'gel',   th: 0.008, mat: M.gel,   sep:  0.90, k: 0 },
    { key: 'skinO', th: 0.016, mat: M.grp,   sep:  0.36, k: 1 },
    { key: 'core',  th: 0.082, mat: M.foam,  sep: -0.20, k: 2 },
    { key: 'skinI', th: 0.014, mat: M.inner, sep: -0.80, k: 3 }
  ];
  function buildSample(w, h) {
    const g = new Group(); const slabs = [];
    const total = LAYERS.reduce((s, l) => s + l.th, 0);
    let z = total / 2;
    LAYERS.forEach((l, i) => {
      const m = box(g, w, h, l.th, l.mat, 0, 0, z - l.th / 2);
      m.userData = { z0: z - l.th / 2, sep: l.sep, k: l.k, i };
      slabs.push(m); z -= l.th;
    });
    return { g, slabs, total };
  }

  /* ground: a pool of light and a contact shadow, so the object sits on something */
  function ground(y, sw, sd) {
    const pool = add(root, new PlaneGeometry(15, 15), new MeshBasicMaterial({ map: texGlow('rgba(228,213,168,.30)', 'rgba(228,213,168,0)'), transparent: true, depthWrite: false }), 0, y - 0.002, 0);
    pool.rotation.x = -Math.PI / 2;
    const shadow = add(root, new PlaneGeometry(sw, sd), new MeshBasicMaterial({ map: texGlow('rgba(0,0,0,.72)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }), 0, y, 0);
    shadow.rotation.x = -Math.PI / 2;
  }

  const anchors = [];           // world-space points the HTML pins follow
  let frames, framesP;          // camera keyframes (landscape, portrait)
  let update;                   // (p, time) → pose the model
  let doorL, doorR, coldLight, stripMat, sample;

  if (variant === 'panel') {
    /* ── single panel ── */
    const PW = 1.35, PH = 2.3;
    sample = buildSample(PW, PH);
    sample.g.position.set(0, PH / 2 + 0.1, 0);
    root.add(sample.g);
    box(root, PW + 0.5, 0.1, 0.7, M.steel, 0, 0.05, 0);
    box(root, PW + 0.56, 0.012, 0.76, M.alu, 0, 0.106, 0);
    sample.slabs.forEach((s, i) => anchors.push({ obj: s, local: new Vector3(-PW / 2 + 0.16, PH / 2 - 0.3 - i * 0.34, 0) }));
    ground(0.0, 4.2, 3.4);
    frames = [
      { az: 30, el: 9,  t: [0, 1.2, 0],    fw: 2.3, fh: 2.9 },
      { az: 66, el: 10, t: [0, 1.2, 0],    fw: 2.3, fh: 2.9 },
      { az: 50, el: 13, t: [0.1, 1.2, 0.05], fw: 3.3, fh: 3.0 }
    ];
    update = (p) => {
      const e2 = easeIO(smooth(0.50, 0.80, p));
      sample.slabs.forEach(s => { s.position.z = s.userData.z0 + s.userData.sep * e2 * 0.9; s.position.x = -s.userData.k * e2 * 0.3 + e2 * 0.45; });
      return { pin: smooth(0.72, 0.84, p) };
    };
  } else {
    /* ── refrigerated body ── */
    const L = 5.0, H = 2.3, W = 2.3, T = 0.12;
    const hx = L / 2, hz = W / 2, wallH = H - 2 * T;
    const body = new Group(); root.add(body);

    box(body, L, T, W, M.white, 0, T / 2, 0);                               // floor
    box(body, L, T, W, M.gel, 0, H - T / 2, 0);                             // roof
    box(body, T, wallH, W, M.gel, hx - T / 2, H / 2, 0);                    // front wall
    box(body, L - T, wallH, T, M.gel, -T / 2, H / 2, -hz + T / 2);          // far side
    const xs0 = -1.15, xs1 = 0.35, sw = xs1 - xs0;                          // the section that slides out
    box(body, xs0 + hx, wallH, T, M.gel, (-hx + xs0) / 2, H / 2, hz - T / 2);
    box(body, hx - T - xs1, wallH, T, M.gel, (xs1 + hx - T) / 2, H / 2, hz - T / 2);
    box(body, 0.006, wallH, T * 0.72, M.foam, xs0 - 0.001, H / 2, hz - T / 2);      // exposed core at the cut
    box(body, 0.006, wallH, T * 0.72, M.foam, xs1 + 0.001, H / 2, hz - T / 2);

    sample = buildSample(sw - 0.008, wallH - 0.004);
    sample.g.position.set((xs0 + xs1) / 2, H / 2, hz - T / 2);
    body.add(sample.g);
    sample.slabs.forEach((s, i) => anchors.push({ obj: s, local: new Vector3(-sw / 2 + 0.2, wallH / 2 - 0.28 - i * 0.36, 0) }));

    /* a thin brand-red line along the near side (it travels with the sliding section too) */
    const lineY = 0.34 - H / 2;
    box(body, xs0 + hx - 0.09, 0.03, 0.004, M.red, (-hx + 0.09 + xs0) / 2, H / 2 + lineY, hz + 0.001);
    box(body, hx - T - xs1, 0.03, 0.004, M.red, (xs1 + hx - T) / 2, H / 2 + lineY, hz + 0.001);
    box(sample.slabs[0], sw - 0.008, 0.03, 0.004, M.red, 0, lineY, LAYERS[0].th / 2 + 0.001);

    /* aluminium edge trims */
    const e = 0.055, o = 0.01;
    [[e / 2 - o, hz - e / 2 + o], [e / 2 - o, -hz + e / 2 - o], [H - e / 2 + o, hz - e / 2 + o], [H - e / 2 + o, -hz + e / 2 - o]]
      .forEach(([y, z]) => box(body, L + 2 * o, e, e, M.alu, 0, y, z));
    [hz - e / 2 + o, -hz + e / 2 - o].forEach(z => box(body, e, H, e, M.alu, hx - e / 2 + o, H / 2, z));
    [e / 2 - o, H - e / 2 + o].forEach(y => box(body, e, e, W, M.alu, hx - e / 2 + o, y, 0));
    /* rear door frame */
    [hz - 0.045, -hz + 0.045].forEach(z => box(body, 0.09, H, 0.09, M.alu, -hx + 0.035, H / 2, z));
    [0.045, H - 0.045].forEach(y => box(body, 0.09, 0.09, W, M.alu, -hx + 0.035, y, 0));
    box(body, 0.05, 0.16, W + 0.1, M.steel, -hx - 0.05, -0.02, 0);            // rear bumper bar

    /* interior */
    box(body, L - 2 * T, 0.012, W - 2 * T, M.floor, -T / 2 + T / 2, T + 0.006, 0);
    stripMat = M.strip;
    box(body, L * 0.78, 0.012, 0.09, stripMat, -0.1, H - T - 0.008, 0);
    coldLight = new PointLight(0x8fd2ea, 0, 7, 1.7); coldLight.position.set(-0.9, H - 0.5, 0); body.add(coldLight);
    /* cartons, stacked against the front wall */
    const cw = 0.6, ch = 0.4, cd = 0.5, gap = 0.016;
    const cartons = new InstancedMesh(new BoxGeometry(cw, ch, cd), M.kraft, 6 * 4 * 4);
    const dummy = new Object3D(); const r = rng(5); let n = 0; const col = new Color();
    for (let ix = 0; ix < 6; ix++) for (let iz = 0; iz < 4; iz++) {
      const tall = ix === 5 ? (iz % 2 ? 1 : 2) : ix === 4 ? (iz % 2 ? 3 : 4) : 4;
      for (let iy = 0; iy < tall; iy++) {
        dummy.position.set(hx - T - 0.06 - cw / 2 - ix * (cw + gap), T + 0.012 + ch / 2 + iy * (ch + gap), -hz + T + 0.07 + cd / 2 + iz * (cd + gap));
        dummy.updateMatrix(); cartons.setMatrixAt(n, dummy.matrix);
        cartons.setColorAt(n, col.setHSL(0.085, 0.42, 0.56 + (r() - 0.5) * 0.07)); n++;
      }
    }
    cartons.count = n; cartons.instanceMatrix.needsUpdate = true; if (cartons.instanceColor) cartons.instanceColor.needsUpdate = true;
    body.add(cartons);

    /* cold air rolling over the sill once the doors are open */
    const mistMat = new MeshBasicMaterial({ map: texGlow('rgba(214,238,246,.9)', 'rgba(214,238,246,0)'), transparent: true, opacity: 0, depthWrite: false });
    const mist = [];
    for (let i = 0; i < 5; i++) {
      const m = add(body, new PlaneGeometry(2.6 - i * 0.2, 1.1), mistMat, -hx - 0.25 - i * 0.22, 0.18 - i * 0.05, (i % 2 ? 0.25 : -0.2));
      m.rotation.y = -Math.PI / 2; m.userData.ph = i * 1.7; mist.push(m);
    }

    /* refrigeration unit on the front wall (generic, unbranded) */
    const unit = new Group(); unit.position.set(hx + 0.17, H - 0.56, 0); body.add(unit);
    add(unit, new RoundedBoxGeometry(0.36, 0.7, 1.72, 3, 0.05), M.unit);
    box(unit, 0.02, 0.3, 1.36, M.louvre, 0.181, -0.12, 0);
    box(unit, 0.02, 0.05, 1.36, M.alu, 0.182, 0.2, 0);
    box(unit, 0.022, 0.028, 0.06, M.led, 0.183, 0.2, 0.6);

    /* rear doors */
    const dw = hz - 0.055, dh = H - 0.2, dt = 0.075;
    function door(sign) {
      const pivot = new Group(); pivot.position.set(-hx - 0.014 - dt, 0.1, sign * (hz + 0.006)); body.add(pivot);
      box(pivot, dt, dh, dw, M.gel, dt / 2, dh / 2, -sign * dw / 2);
      box(pivot, 0.012, dh - 0.07, dw - 0.07, M.inner, dt + 0.003, dh / 2, -sign * dw / 2);   // inner liner
      box(pivot, 0.02, dh - 0.02, 0.03, M.rubber, dt + 0.004, dh / 2, -sign * (dw - 0.015));    // centre seal
      [0.3, 0.74].forEach(f => {
        add(pivot, new CylinderGeometry(0.013, 0.013, dh + 0.12, 10), M.alu, -0.022, dh / 2, -sign * dw * f);
        box(pivot, 0.03, 0.05, 0.2, M.alu, -0.036, dh * 0.46, -sign * (dw * f + 0.07 * (f < .5 ? 1 : -1)));
        [0.03, dh - 0.03].forEach(y => box(pivot, 0.035, 0.05, 0.06, M.steel, -0.014, y, -sign * dw * f));
      });
      [0.22, dh / 2, dh - 0.22].forEach(y => box(pivot, 0.03, 0.13, 0.05, M.alu, 0.0, y, -sign * 0.02));
      return pivot;
    }
    doorL = door(1); doorR = door(-1);

    /* subframe */
    [0.45, -0.45].forEach(z => box(body, L * 0.97, 0.15, 0.09, M.steel, 0, -0.075, z));
    for (let i = 0; i < 8; i++) box(body, 0.06, 0.08, W * 0.92, M.steel, -hx + 0.3 + i * ((L - 0.6) / 7), -0.04, 0);

    /* logo on the fixed forward section of the near wall */
    new TextureLoader().load(logoUrl, t => {
      t.colorSpace = SRGBColorSpace; t.anisotropy = 8;
      const lw = 1.06, lh = lw * 120 / 330;
      const logo = add(body, new PlaneGeometry(lw, lh), new MeshBasicMaterial({ map: t, transparent: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4 }),
        (xs1 + hx - T) / 2 + 0.05, H - 0.62, hz + 0.0025);
      logo.renderOrder = 2; dirty = true;
    }, undefined, () => {});

    ground(-0.150, L * 1.45, W * 1.9);

    frames = [
      { az: 40,  el: 12, t: [0.12, 1.0, 0],          fw: 6.9, fh: 3.7 },
      { az: -54, el: 11, t: [-0.95, 1.02, 0.2],      fw: 7.7, fh: 3.9 },
      { az: -40, el: 16, t: [-1.85, 1.12, hz + 0.6], fw: 6.6, fh: 3.8 }
    ];
    framesP = [                                   // phones and portrait tablets: turn the body end-on so it can sit larger
      { az: 57,  el: 12, t: [0.25, 1.0, 0],          fw: 5.5, fh: 3.7 },
      { az: -68, el: 11, t: [-1.05, 1.02, 0.15],     fw: 5.5, fh: 3.9 },
      { az: -46, el: 16, t: [-1.75, 1.12, hz + 0.6], fw: 5.5, fh: 3.8 }
    ];
    update = (p, time) => {
      const open = easeIO(smooth(0.13, 0.42, p));
      doorL.rotation.y = degToRad(258) * open;          // near door folds back along the side
      doorR.rotation.y = -degToRad(112) * open;
      coldLight.intensity = 6.2 * open;
      stripMat.color.setRGB(lerp(.30, .80, open), lerp(.34, .93, open), lerp(.36, .98, open));
      mistMat.opacity = 0.2 * open;
      mist.forEach(m => { m.position.y = 0.18 - m.userData.ph * 0.03 + Math.sin(time * 0.0006 + m.userData.ph) * 0.05; });
      const e1 = easeIO(smooth(0.50, 0.66, p)), e2 = easeIO(smooth(0.58, 0.82, p));
      sample.g.position.z = hz - T / 2 + e1 * 1.2;
      sample.slabs.forEach(s => { s.position.z = s.userData.z0 + s.userData.sep * e2 * 0.8; s.position.x = -s.userData.k * e2 * 0.42; });
      return { pin: smooth(0.76, 0.86, p) };
    };
  }

  /* ── camera rig ── */
  const tgt = new Vector3(), v = new Vector3();
  let W0 = 1, H0 = 1, fx = 0.5, fy = 0.5, fwPx = 1, fhPx = 1;
  function measure() {
    const cr = canvas.getBoundingClientRect();
    const fr = (focus || canvas).getBoundingClientRect();
    W0 = Math.max(1, cr.width); H0 = Math.max(1, cr.height);
    fx = (fr.left - cr.left + fr.width / 2); fy = (fr.top - cr.top + fr.height / 2);
    fwPx = Math.max(1, fr.width); fhPx = Math.max(1, fr.height);
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (W0 * H0 * dpr * dpr > 4.6e6) dpr = Math.sqrt(4.6e6 / (W0 * H0));
    renderer.setPixelRatio(dpr);
    renderer.setSize(W0, H0, false);
    camera.aspect = W0 / H0;
    camera.setViewOffset(W0, H0, W0 / 2 - fx, H0 / 2 - fy, W0, H0);
    camera.updateProjectionMatrix();
    dirty = true;
  }
  function pose(p, time) {
    const a = p < 0.5 ? easeIO(smooth(0.08, 0.44, p)) : 1;
    const b = easeIO(smooth(0.48, 0.74, p));
    const F = (framesP && fwPx < 600) ? framesP : frames;      // phone-width stage → end-on framing
    const A = F[0], B = F[1], C = F[2];
    const mix = (k) => lerp(lerp(A[k], B[k], a), C[k], b);
    const sway = still ? 0 : Math.sin(time * 0.00042) * (3.2 - 1.6 * b) + Math.sin(time * 0.00017) * 1.1;
    const az = degToRad(mix('az') + sway), el = degToRad(mix('el'));
    tgt.set(lerp(lerp(A.t[0], B.t[0], a), C.t[0], b), lerp(lerp(A.t[1], B.t[1], a), C.t[1], b), lerp(lerp(A.t[2], B.t[2], a), C.t[2], b));
    const tanH = Math.tan(degToRad(camera.fov / 2));
    const d = Math.max(mix('fw') * H0 / (2 * tanH * fwPx), mix('fh') * H0 / (2 * tanH * fhPx));
    camera.position.set(tgt.x + d * Math.sin(az) * Math.cos(el), tgt.y + d * Math.sin(el), tgt.z + d * Math.cos(az) * Math.cos(el));
    camera.lookAt(tgt);
  }
  function placePins(alpha) {
    if (!pins.length) return;
    anchors.forEach((a, i) => {
      const el = pins[i]; if (!el) return;
      v.copy(a.local); a.obj.localToWorld(v); v.project(camera);
      const x = (v.x * 0.5 + 0.5) * W0, y = (-v.y * 0.5 + 0.5) * H0;
      el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      el.style.opacity = alpha.toFixed(3);
    });
  }

  /* ── loop: smoothed progress, render only while on screen ── */
  let target = 0, cur = 0, dirty = true, running = false, visible = true, raf = 0, first = true, dead = false;
  let last = 0;
  function frame(time) {
    raf = 0; if (dead) return;
    const dt = last ? Math.min(100, time - last) : 16.7; last = time;
    const d = target - cur;                                  // frame-rate independent easing toward the scroll position
    cur = Math.abs(d) < 0.0004 ? target : cur + d * (1 - Math.exp(-dt / 130));
    const st = update(cur, time);
    pose(cur, time);
    root.updateMatrixWorld(true);
    renderer.render(scene, camera);
    placePins(st.pin);
    dirty = false;
    if (first) { first = false; onReady(); }
    if (running && visible && !still) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && !dead && running && visible) { last = 0; raf = requestAnimationFrame(frame); } };

  let io;
  if ('IntersectionObserver' in window && !still) {
    io = new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }, { rootMargin: '10% 0px' });
    io.observe(canvas);
  }
  const onVis = () => { visible = !document.hidden; kick(); };
  document.addEventListener('visibilitychange', onVis);
  const onLost = (e) => { e.preventDefault(); dead = true; onFail(new Error('context lost')); };
  canvas.addEventListener('webglcontextlost', onLost);

  measure();

  return {
    setProgress(p) { target = clamp(p, 0, 1); kick(); },
    resize() { measure(); kick(); },
    start() { running = true; kick(); },
    stop() { running = false; },
    /* synchronous single frame at an exact progress — used to render the poster images */
    renderAt(p) { target = cur = clamp(p, 0, 1); measure(); const st = update(cur, 0); pose(cur, 0); root.updateMatrixWorld(true); renderer.render(scene, camera); placePins(st.pin); },
    dispose() {
      dead = true; cancelAnimationFrame(raf); if (io) io.disconnect();
      document.removeEventListener('visibilitychange', onVis); canvas.removeEventListener('webglcontextlost', onLost);
      scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
      Object.values(M).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      env.dispose(); renderer.dispose();
    }
  };
}
