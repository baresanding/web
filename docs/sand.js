/* ==========================================================================
   Baresand · motor de arena
   ~26k partículas en WebGL2. Cada figura es una nube de puntos guardada en
   una textura; la GPU interpola entre dos figuras con un retardo distinto por
   grano y un soplido de viento en el trayecto. La figura gira en 3D con el
   mouse y el cursor aparta la arena a su paso.
   Uso:
     const sand = Sand.create(canvas, {shapes: ['cloud','logo','globe', ...]});
     sand.intro('logo');            // la arena se junta y forma el logo
     sand.morphTo('chip', 1800);    // de la figura actual a otra
     sand.layout({x: .45, y: 0, s: .5});   // posición/escala (x,y en NDC; s = alto/2)
   ========================================================================== */
(function () {
  'use strict';
  const TEXW = 256;
  const C_GOLD = '#ff0000', C_MARFIL = '#00ff00', C_DIM = '#0000ff';
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  /* ------------------------------------------------------------------ figures from drawings */
  // draw with pure red (arena), green (marfil) or blue (tenue); every lit pixel becomes a possible grain
  function raster(N, W, H, draw, o) {
    o = o || {};
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const x = cv.getContext('2d', {willReadFrequently: true});
    draw(x, W, H);
    const d = x.getImageData(0, 0, W, H).data;
    const idx = [], wts = [];
    for (let i = 0; i < W * H; i++) {
      const a = d[i * 4 + 3]; if (a < 80) continue;
      idx.push(i);
      wts.push(d[i * 4 + 2] > 160 && d[i * 4] < 90 && d[i * 4 + 1] < 90 ? (o.dimWeight ?? 0.35) : 1);
    }
    // weighted pick (tenue pixels receive fewer grains)
    const cum = new Float32Array(wts.length); let s = 0;
    for (let i = 0; i < wts.length; i++) { s += wts[i]; cum[i] = s; }
    const pick = () => { const r = rnd() * s; let lo = 0, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; } return idx[lo]; };
    const p = new Float32Array(N * 3), c = new Float32Array(N);
    const k = (o.scale || 1) * 2 / H, depth = o.depth ?? 0.12;
    for (let n = 0; n < N; n++) {
      const i = pick(), px = i % W, py = (i / W) | 0;
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      p[n * 3] = (px + rnd() - W / 2) * k;
      p[n * 3 + 1] = -(py + rnd() - H / 2) * k;
      p[n * 3 + 2] = (rnd() - 0.5) * depth * (o.depthFn ? o.depthFn(px / W, py / H) : 1);
      c[n] = r >= g && r >= b ? 0 : g >= b ? 1 : 2;
    }
    return {p, c};
  }

  function logoDraw(parts) {
    return (x, W, H) => {
      const L = window.BARESAND_LOGO, B = L.box;
      const h = parts.includes('wordBaresand') ? B.h : 90;
      const sc = Math.min(W / B.w, H / h) * 0.98;
      x.setTransform(sc, 0, 0, sc, W / 2 - (B.x + B.w / 2) * sc, H / 2 - (B.y + h / 2) * sc);
      for (const k of parts) { x.fillStyle = k === 'arcGold' ? C_GOLD : C_MARFIL; x.fill(new Path2D(L[k]), k === 'wordBaresand' ? 'evenodd' : 'nonzero'); }
    };
  }

  const DRAW = {
    compass(x, W) {
      const c = W / 2, R = W * 0.4;
      x.lineCap = 'round';
      x.strokeStyle = C_MARFIL; x.lineWidth = W * 0.012; x.beginPath(); x.arc(c, c, R, 0, 7); x.stroke();
      x.strokeStyle = C_DIM; x.lineWidth = W * 0.005; x.beginPath(); x.arc(c, c, R * 0.8, 0, 7); x.stroke();
      for (let i = 0; i < 72; i++) {
        const a = i / 72 * Math.PI * 2, big = i % 9 === 0, r0 = R * (big ? 0.84 : 0.88);
        x.strokeStyle = big ? C_MARFIL : C_DIM; x.lineWidth = W * (big ? 0.008 : 0.004);
        x.beginPath(); x.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); x.lineTo(c + Math.cos(a) * R * 0.95, c + Math.sin(a) * R * 0.95); x.stroke();
      }
      const star = (ang, len, col) => {
        const w = R * 0.11, a = ang;
        x.fillStyle = col; x.beginPath();
        x.moveTo(c + Math.cos(a) * len, c + Math.sin(a) * len);
        x.lineTo(c + Math.cos(a + Math.PI / 2) * w, c + Math.sin(a + Math.PI / 2) * w);
        x.lineTo(c, c);
        x.lineTo(c + Math.cos(a - Math.PI / 2) * w, c + Math.sin(a - Math.PI / 2) * w);
        x.closePath(); x.fill();
      };
      for (let i = 0; i < 4; i++) star(Math.PI / 4 + i * Math.PI / 2, R * 0.42, C_DIM);
      star(-Math.PI / 2, R * 0.74, C_GOLD); star(Math.PI / 2, R * 0.74, C_MARFIL);
      star(0, R * 0.74, C_MARFIL); star(Math.PI, R * 0.74, C_MARFIL);
      x.fillStyle = C_GOLD; x.beginPath(); x.arc(c, c, W * 0.018, 0, 7); x.fill();
    },
    chip(x, W) {
      const c = W / 2, B = W * 0.5, r = B / 2;
      // pins
      x.fillStyle = C_MARFIL;
      const n = 9, pw = W * 0.02, pl = W * 0.085;
      for (let i = 0; i < n; i++) {
        const t = c - r + B * (i + 1) / (n + 1) - pw / 2;
        x.fillRect(t, c - r - pl, pw, pl - W * 0.01); x.fillRect(t, c + r + W * 0.01, pw, pl - W * 0.01);
        x.fillRect(c - r - pl, t, pl - W * 0.01, pw); x.fillRect(c + r + W * 0.01, t, pl - W * 0.01, pw);
      }
      // body: hatched, with a crisp edge
      x.save(); x.beginPath(); x.roundRect(c - r, c - r, B, B, W * 0.02); x.clip();
      x.strokeStyle = C_DIM; x.lineWidth = W * 0.004;
      for (let i = -B; i < B * 2; i += W * 0.022) { x.beginPath(); x.moveTo(c - r + i, c - r); x.lineTo(c - r + i - B, c + r); x.stroke(); }
      x.restore();
      x.strokeStyle = C_MARFIL; x.lineWidth = W * 0.012; x.beginPath(); x.roundRect(c - r, c - r, B, B, W * 0.02); x.stroke();
      // die with the isotipo engraved
      const dS = B * 0.52;
      x.strokeStyle = C_GOLD; x.lineWidth = W * 0.008; x.strokeRect(c - dS / 2, c - dS / 2, dS, dS);
      x.fillStyle = C_MARFIL; x.beginPath(); x.arc(c - r + W * 0.05, c - r + W * 0.05, W * 0.012, 0, 7); x.fill();
      const L = window.BARESAND_LOGO, sc = dS * 0.8 / L.box.w;
      x.save(); x.setTransform(sc, 0, 0, sc, c - (L.box.x + L.box.w / 2) * sc, c - (L.box.y + 45) * sc);
      x.fillStyle = C_GOLD; for (const k of ['arcGold', 'arcMid', 'arcLow']) x.fill(new Path2D(L[k])); x.restore();
    },
    code(x, W) {
      x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = W * 0.04;
      x.strokeStyle = C_MARFIL;
      x.beginPath(); x.moveTo(W * 0.33, W * 0.28); x.lineTo(W * 0.13, W * 0.5); x.lineTo(W * 0.33, W * 0.72); x.stroke();
      x.beginPath(); x.moveTo(W * 0.67, W * 0.28); x.lineTo(W * 0.87, W * 0.5); x.lineTo(W * 0.67, W * 0.72); x.stroke();
      x.strokeStyle = C_GOLD; x.beginPath(); x.moveTo(W * 0.575, W * 0.2); x.lineTo(W * 0.425, W * 0.8); x.stroke();
    },
    sprout(x, W) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = C_DIM; x.lineWidth = W * 0.008;
      for (let i = 0; i < 5; i++) { const y = W * (0.8 + i * 0.03); x.beginPath(); x.moveTo(W * (0.2 + i * 0.03), y); x.lineTo(W * (0.8 - i * 0.03), y); x.stroke(); }
      x.strokeStyle = C_MARFIL; x.lineWidth = W * 0.022;
      x.beginPath(); x.moveTo(W * 0.5, W * 0.8); x.bezierCurveTo(W * 0.5, W * 0.62, W * 0.47, W * 0.5, W * 0.5, W * 0.36); x.stroke();
      const leaf = (sx, sy, ex, ey, bend, col) => {
        const mx = (sx + ex) / 2, my = (sy + ey) / 2, nx = -(ey - sy), ny = ex - sx, nl = Math.hypot(nx, ny), w = W * 0.075 + bend;
        x.fillStyle = col; x.beginPath(); x.moveTo(sx, sy);
        x.quadraticCurveTo(mx + nx / nl * w, my + ny / nl * w, ex, ey);
        x.quadraticCurveTo(mx - nx / nl * w * 0.8, my - ny / nl * w * 0.8, sx, sy); x.fill();
        x.strokeStyle = C_DIM; x.lineWidth = W * 0.005; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
      };
      leaf(W * 0.5, W * 0.56, W * 0.2, W * 0.4, W * 0.02, C_MARFIL);
      leaf(W * 0.5, W * 0.46, W * 0.82, W * 0.26, -W * 0.03, C_GOLD);
      leaf(W * 0.5, W * 0.36, W * 0.56, W * 0.14, W * 0.07, C_MARFIL);
      x.fillStyle = C_DIM; for (const [a, b] of [[0.28, 0.66], [0.72, 0.6], [0.66, 0.72]]) { x.beginPath(); x.arc(W * a, W * b, W * 0.012, 0, 7); x.fill(); }
    },
    car(x, W) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      x.strokeStyle = C_DIM; x.lineWidth = W * 0.008;
      x.beginPath(); x.moveTo(W * 0.04, W * 0.74); x.lineTo(W * 0.96, W * 0.74); x.stroke();
      x.setLineDash([W * 0.05, W * 0.035]); x.beginPath(); x.moveTo(W * 0.04, W * 0.82); x.lineTo(W * 0.96, W * 0.82); x.stroke(); x.setLineDash([]);
      x.strokeStyle = C_MARFIL; x.lineWidth = W * 0.018;
      x.beginPath();
      x.moveTo(W * 0.1, W * 0.64); x.lineTo(W * 0.1, W * 0.56); x.quadraticCurveTo(W * 0.11, W * 0.5, W * 0.2, W * 0.49);
      x.lineTo(W * 0.3, W * 0.48); x.lineTo(W * 0.38, W * 0.38); x.quadraticCurveTo(W * 0.41, W * 0.35, W * 0.46, W * 0.35);
      x.lineTo(W * 0.62, W * 0.35); x.quadraticCurveTo(W * 0.67, W * 0.35, W * 0.71, W * 0.4); x.lineTo(W * 0.77, W * 0.48);
      x.lineTo(W * 0.84, W * 0.5); x.quadraticCurveTo(W * 0.9, W * 0.52, W * 0.9, W * 0.58); x.lineTo(W * 0.9, W * 0.64);
      x.stroke();
      x.lineWidth = W * 0.01; x.beginPath(); x.moveTo(W * 0.4, W * 0.4); x.lineTo(W * 0.53, W * 0.4); x.lineTo(W * 0.53, W * 0.47); x.lineTo(W * 0.34, W * 0.47); x.closePath(); x.stroke();
      x.beginPath(); x.moveTo(W * 0.57, W * 0.4); x.lineTo(W * 0.66, W * 0.4); x.lineTo(W * 0.71, W * 0.47); x.lineTo(W * 0.57, W * 0.47); x.closePath(); x.stroke();
      for (const cx of [0.27, 0.73]) { x.lineWidth = W * 0.018; x.beginPath(); x.arc(W * cx, W * 0.65, W * 0.07, 0, 7); x.stroke(); x.fillStyle = C_GOLD; x.beginPath(); x.arc(W * cx, W * 0.65, W * 0.022, 0, 7); x.fill(); }
      // the counter: a sensor and its beam across the lane
      x.strokeStyle = C_GOLD; x.lineWidth = W * 0.012;
      x.beginPath(); x.moveTo(W * 0.93, W * 0.74); x.lineTo(W * 0.93, W * 0.2); x.lineTo(W * 0.85, W * 0.2); x.stroke();
      x.setLineDash([W * 0.012, W * 0.02]); x.lineWidth = W * 0.006; x.beginPath(); x.moveTo(W * 0.85, W * 0.22); x.lineTo(W * 0.6, W * 0.74); x.stroke(); x.beginPath(); x.moveTo(W * 0.85, W * 0.22); x.lineTo(W * 0.95, W * 0.74); x.stroke(); x.setLineDash([]);
    },
    tower(x, W) {
      x.lineCap = 'round'; x.lineJoin = 'round';
      // wires
      x.strokeStyle = C_DIM; x.lineWidth = W * 0.005;
      for (const [ax, ay] of [[0.2, 0.34], [0.8, 0.34], [0.26, 0.48], [0.74, 0.48]]) {
        const ex = ax < 0.5 ? -0.02 : 1.02;
        x.beginPath(); x.moveTo(W * ax, W * (ay + 0.03)); x.quadraticCurveTo(W * (ax + ex) / 2, W * (ay + 0.12), W * ex, W * (ay + 0.02)); x.stroke();
      }
      x.strokeStyle = C_MARFIL; x.lineWidth = W * 0.012;
      x.beginPath(); x.moveTo(W * 0.34, W * 0.92); x.lineTo(W * 0.46, W * 0.16); x.lineTo(W * 0.54, W * 0.16); x.lineTo(W * 0.66, W * 0.92); x.stroke();
      x.lineWidth = W * 0.006;
      const legX = (y, s) => s < 0 ? W * (0.34 + (0.46 - 0.34) * (0.92 - y) / 0.76) : W * (0.66 - (0.66 - 0.54) * (0.92 - y) / 0.76);
      let y = 0.92, flip = 0; x.beginPath();
      while (y > 0.2) { const y2 = y - 0.08; x.moveTo(legX(y, flip ? 1 : -1), W * y); x.lineTo(legX(y2, flip ? -1 : 1), W * y2); flip ^= 1; y = y2; }
      x.stroke();
      x.lineWidth = W * 0.012; x.beginPath(); x.moveTo(W * 0.2, W * 0.34); x.lineTo(W * 0.8, W * 0.34); x.moveTo(W * 0.26, W * 0.48); x.lineTo(W * 0.74, W * 0.48); x.stroke();
      x.lineWidth = W * 0.008; for (const [ax, ay] of [[0.2, 0.34], [0.8, 0.34], [0.26, 0.48], [0.74, 0.48]]) { x.beginPath(); x.moveTo(W * ax, W * ay); x.lineTo(W * ax, W * (ay + 0.035)); x.stroke(); }
      // the fault, found from the air
      const fx = W * 0.9, fy = W * 0.395;
      x.fillStyle = C_GOLD; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = i % 2 ? W * 0.012 : W * 0.035; x.lineTo(fx + Math.cos(a) * r, fy + Math.sin(a) * r); } x.closePath(); x.fill();
      const dx = W * 0.84, dy = W * 0.1;
      x.strokeStyle = C_GOLD; x.lineWidth = W * 0.008;
      x.beginPath(); x.moveTo(dx - W * 0.05, dy - W * 0.025); x.lineTo(dx + W * 0.05, dy + W * 0.025); x.moveTo(dx + W * 0.05, dy - W * 0.025); x.lineTo(dx - W * 0.05, dy + W * 0.025); x.stroke();
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { x.beginPath(); x.arc(dx + a * W * 0.05, dy + b * W * 0.025, W * 0.018, 0, 7); x.stroke(); }
      x.strokeStyle = C_DIM; x.setLineDash([W * 0.01, W * 0.014]); x.lineWidth = W * 0.004;
      x.beginPath(); x.moveTo(dx, dy + W * 0.03); x.lineTo(fx - W * 0.03, fy - W * 0.02); x.moveTo(dx, dy + W * 0.03); x.lineTo(fx + W * 0.04, fy - W * 0.01); x.stroke(); x.setLineDash([]);
    },
  };

  DRAW.team = function (x, W) {
    // three people, side by side: the one in front a little ahead
    x.lineCap = 'round';
    const fig = (cx, cy, r, col, lw) => {
      x.strokeStyle = col; x.lineWidth = lw;
      x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
      x.beginPath(); x.arc(cx, cy + r * 3.1, r * 1.9, Math.PI * 1.08, Math.PI * 1.92); x.stroke();
    };
    fig(W * 0.27, W * 0.38, W * 0.075, C_MARFIL, W * 0.016);
    fig(W * 0.73, W * 0.38, W * 0.075, C_MARFIL, W * 0.016);
    x.fillStyle = 'rgba(0,0,0,1)'; x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(W * 0.5, W * 0.34, W * 0.13, 0, 7); x.fill();
    x.beginPath(); x.ellipse(W * 0.5, W * 0.69, W * 0.24, W * 0.2, 0, Math.PI, 2 * Math.PI); x.fill();
    x.globalCompositeOperation = 'source-over';
    fig(W * 0.5, W * 0.33, W * 0.095, C_GOLD, W * 0.02);
    x.strokeStyle = C_DIM; x.lineWidth = W * 0.006;
    x.beginPath(); x.moveTo(W * 0.12, W * 0.8); x.lineTo(W * 0.88, W * 0.8); x.stroke();
  };
  DRAW.question = function (x, W) {
    x.lineCap = 'round';
    x.strokeStyle = C_DIM; x.lineWidth = W * 0.006; x.beginPath(); x.arc(W / 2, W / 2, W * 0.4, 0, 7); x.stroke();
    x.strokeStyle = C_MARFIL; x.lineWidth = W * 0.05;
    x.beginPath(); x.arc(W / 2, W * 0.4, W * 0.13, Math.PI * 1.08, Math.PI * 2.32); x.stroke();
    x.beginPath(); x.moveTo(W * 0.5 + Math.cos(Math.PI * 2.32) * W * 0.13, W * 0.4 + Math.sin(Math.PI * 2.32) * W * 0.13);
    x.quadraticCurveTo(W * 0.5, W * 0.53, W * 0.5, W * 0.6); x.stroke();
    x.fillStyle = C_GOLD; x.beginPath(); x.arc(W / 2, W * 0.73, W * 0.035, 0, 7); x.fill();
  };

  /* ------------------------------------------------------------------ procedural 3D figures */
  function landMask() {
    const b = atob(window.BARESAND_LAND || ''), W = 360, H = 180, rowB = 45;
    return (lat, lon) => {
      if (!b.length) return false;
      const x = Math.min(W - 1, Math.max(0, Math.floor((lon + 180) * W / 360))), y = Math.min(H - 1, Math.max(0, Math.floor((90 - lat) * H / 180)));
      return (b.charCodeAt(y * rowB + (x >> 3)) >> (7 - (x & 7))) & 1;
    };
  }
  function globe(N) {
    const land = landMask(), here = (window.BARESAND_CONTENT && window.BARESAND_CONTENT.contact.coords) || {lat: -27.46, lon: -58.98};
    const p = new Float32Array(N * 3), c = new Float32Array(N);
    const lon0 = here.lon, tilt = (here.lat + 8) * Math.PI / 180, R = 0.95;
    const put = (n, lat, lon, r, col) => {
      const la = lat * Math.PI / 180, lo = (lon - lon0) * Math.PI / 180;
      let x = Math.cos(la) * Math.sin(lo) * r, y = Math.sin(la) * r, z = Math.cos(la) * Math.cos(lo) * r;
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);   // bring home to the front
      p[n * 3] = x; p[n * 3 + 1] = y2; p[n * 3 + 2] = z2; c[n] = col;
    };
    for (let n = 0; n < N; n++) {
      const u = rnd();
      if (u < 0.66) { let lat, lon, k = 0; do { lat = Math.asin(rnd() * 2 - 1) * 180 / Math.PI; lon = rnd() * 360 - 180; } while (!land(lat, lon) && ++k < 200); put(n, lat, lon, R, 1); }
      else if (u < 0.8) { const lat = Math.asin(rnd() * 2 - 1) * 180 / Math.PI, lon = rnd() * 360 - 180; put(n, lat, lon, R * 0.995, 2); }
      else if (u < 0.9) { const k = Math.floor(rnd() * 12); if (k < 6) put(n, -60 + k * 24, rnd() * 360 - 180, R * 1.002, 2); else put(n, rnd() * 180 - 90, (k - 6) * 30 - 180 + lon0, R * 1.002, 2); }
      else if (u < 0.955) { const a = rnd() * Math.PI * 2, r = rnd() < 0.55 ? 4.5 : rnd() * 1.6; put(n, here.lat + Math.sin(a) * r, here.lon + Math.cos(a) * r / Math.cos(here.lat * Math.PI / 180), R * 1.005, 0); }
      else { put(n, here.lat, here.lon, R * (1.01 + rnd() * 0.28), 0); }
    }
    return {p, c};
  }
  function neural(N) {
    const layers = [4, 6, 6, 3], X = [-1.25, -0.42, 0.42, 1.25], nodes = [];
    layers.forEach((k, li) => { for (let i = 0; i < k; i++) { const y = (i - (k - 1) / 2) * 0.34; nodes.push({li, x: X[li], y, z: Math.sin(i * 1.7 + li) * 0.28}); } });
    const edges = []; for (const a of nodes) for (const b of nodes) if (b.li === a.li + 1) edges.push([a, b]);
    const p = new Float32Array(N * 3), c = new Float32Array(N);
    for (let n = 0; n < N; n++) {
      if (rnd() < 0.42) {
        const q = nodes[Math.floor(rnd() * nodes.length)], th = rnd() * 6.283, ph = Math.acos(rnd() * 2 - 1), r = 0.065 * Math.cbrt(rnd());
        p[n * 3] = q.x + r * Math.sin(ph) * Math.cos(th); p[n * 3 + 1] = q.y + r * Math.cos(ph); p[n * 3 + 2] = q.z + r * Math.sin(ph) * Math.sin(th);
        c[n] = q.li === 3 ? 0 : 1;
      } else {
        const [a, b] = edges[Math.floor(rnd() * edges.length)], t = rnd();
        p[n * 3] = a.x + (b.x - a.x) * t; p[n * 3 + 1] = a.y + (b.y - a.y) * t; p[n * 3 + 2] = a.z + (b.z - a.z) * t; c[n] = 2;
      }
    }
    return {p, c};
  }
  function cloud(N) {
    const p = new Float32Array(N * 3), c = new Float32Array(N);
    for (let n = 0; n < N; n++) {
      const th = rnd() * 6.283, ph = Math.acos(rnd() * 2 - 1), r = 1.6 + rnd() * 1.4;
      p[n * 3] = r * Math.sin(ph) * Math.cos(th) * 1.5; p[n * 3 + 1] = r * Math.cos(ph) * 0.8; p[n * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      c[n] = rnd() < 0.2 ? 0 : rnd() < 0.5 ? 1 : 2;
    }
    return {p, c};
  }
  // the brand's contour texture, as a volume
  function field(N) {
    const p = new Float32Array(N * 3), c = new Float32Array(N), L = 30;
    for (let n = 0; n < N; n++) {
      const j = Math.floor(rnd() * L), z = -1.3 + 2.6 * j / (L - 1), x = -2.6 + rnd() * 5.2;
      const hgt = 0.95 * Math.exp(-((x - 0.3) ** 2) / (0.9 + 0.35 * (z + 1.3))) * (0.45 + 0.55 * (1.3 - z) / 2.6);
      p[n * 3] = x; p[n * 3 + 1] = hgt - 0.45; p[n * 3 + 2] = z; c[n] = j % 6 === 0 ? 1 : 0;
    }
    return {p, c};
  }
  // silicon: a crystal lattice
  function lattice(N) {
    const p = new Float32Array(N * 3), c = new Float32Array(N), nx = 9, ny = 6, nz = 5, s = 0.3;
    const at = (i, j, k) => [(i - (nx - 1) / 2) * s, (j - (ny - 1) / 2) * s, (k - (nz - 1) / 2) * s];
    for (let n = 0; n < N; n++) {
      const i = Math.floor(rnd() * nx), j = Math.floor(rnd() * ny), k = Math.floor(rnd() * nz), a = at(i, j, k);
      if (rnd() < 0.45) { const r = 0.028 * Math.cbrt(rnd()), th = rnd() * 6.283, ph = Math.acos(rnd() * 2 - 1); p[n * 3] = a[0] + r * Math.sin(ph) * Math.cos(th); p[n * 3 + 1] = a[1] + r * Math.cos(ph); p[n * 3 + 2] = a[2] + r * Math.sin(ph) * Math.sin(th); c[n] = 1; }
      else { const ax = Math.floor(rnd() * 3), t = rnd() * s; p[n * 3] = a[0] + (ax === 0 ? t : 0); p[n * 3 + 1] = a[1] + (ax === 1 ? t : 0); p[n * 3 + 2] = a[2] + (ax === 2 ? t : 0); c[n] = (ax === 0 && i === nx - 1) || (ax === 1 && j === ny - 1) || (ax === 2 && k === nz - 1) ? 2 : 0; }
    }
    return {p, c};
  }
  // an enclosure, drawn as its edges
  function cube(N) {
    const p = new Float32Array(N * 3), c = new Float32Array(N), a = 0.75, b = 0.45, h = 0.5;
    const V = [[-a, -h, -b], [a, -h, -b], [a, h, -b], [-a, h, -b], [-a, -h, b], [a, -h, b], [a, h, b], [-a, h, b]];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (let n = 0; n < N; n++) {
      if (rnd() < 0.7) { const [i, j] = E[Math.floor(rnd() * 12)], t = rnd(); for (let q = 0; q < 3; q++) p[n * 3 + q] = V[i][q] + (V[j][q] - V[i][q]) * t + (rnd() - 0.5) * 0.012; c[n] = 1; }
      else { p[n * 3] = (rnd() * 2 - 1) * a * 0.85; p[n * 3 + 1] = -h * 0.2; p[n * 3 + 2] = (rnd() * 2 - 1) * b * 0.85; c[n] = rnd() < 0.3 ? 0 : 2; }
    }
    return {p, c};
  }

  const BUILD = {
    cloud, globe, neural, field, lattice, cube,
    logo: N => raster(N, 1500, 604, logoDraw(['arcGold', 'arcMid', 'arcLow', 'wordBaresand', 'wordElectronics']), {scale: 604 / 604 * 0.62, depth: 0.1}),
    isotipo: N => raster(N, 1500, 362, logoDraw(['arcGold', 'arcMid', 'arcLow']), {scale: 0.36, depth: 0.14}),
    compass: N => raster(N, 700, 700, DRAW.compass, {scale: 0.95, depth: 0.1}),
    chip: N => { const r = raster(N, 700, 700, DRAW.chip, {scale: 1.0, depth: 0.16}); return r; },
    code: N => raster(N, 700, 700, DRAW.code, {scale: 0.9, depth: 0.14}),
    sprout: N => raster(N, 700, 700, DRAW.sprout, {scale: 0.95, depth: 0.12}),
    car: N => raster(N, 700, 700, DRAW.car, {scale: 1.05, depth: 0.14}),
    tower: N => raster(N, 700, 700, DRAW.tower, {scale: 1.0, depth: 0.12}),
    team: N => raster(N, 700, 700, DRAW.team, {scale: 1.0, depth: 0.14}),
    question: N => raster(N, 700, 700, DRAW.question, {scale: 0.95, depth: 0.14}),
  };

  /* ------------------------------------------------------------------ WebGL */
  const VS = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D uT;
uniform int uRows, uFrom, uTo;
uniform float uMix, uTime, uScale, uPx, uAspect, uFocal, uDim, uWind, uMouseR;
uniform vec2 uOffset, uRot, uMouse;
out vec4 vCol;
float hash(float n){ return fract(sin(n)*43758.5453123); }
vec4 fetchP(int s, int id){ return texelFetch(uT, ivec2(id%${TEXW}, id/${TEXW}+s*uRows), 0); }
void main(){
  int id=gl_VertexID; float f=float(id);
  float h1=hash(f*1.37+.1), h2=hash(f*2.11+.3), h3=hash(f*3.7+.7), h4=hash(f*.73+.9);
  vec4 A=fetchP(uFrom,id), B=fetchP(uTo,id);
  float S=.7;
  float m=clamp(uMix*(1.+S)-h1*S,0.,1.); m=m*m*m*(m*(m*6.-15.)+10.);
  vec3 p=mix(A.xyz,B.xyz,m);
  float tr=sin(3.14159*m)*uWind;
  p+=tr*(vec3(sin(h2*31.+uTime*.9+p.y*3.),cos(h3*27.+uTime*.8+p.x*2.),sin(h4*19.+uTime*.7))*.42+vec3(.55,.14,.1)*(h2-.25));
  p+=.007*vec3(sin(uTime*1.1+h1*60.),cos(uTime*1.3+h2*60.),sin(uTime*.9+h3*60.));
  float cy=cos(uRot.x), sy=sin(uRot.x), cx=cos(uRot.y), sx=sin(uRot.y);
  p=vec3(p.x*cy+p.z*sy, p.y, -p.x*sy+p.z*cy);
  p=vec3(p.x, p.y*cx-p.z*sx, p.y*sx+p.z*cx);
  float persp=uFocal/(uFocal-p.z);
  vec2 s=p.xy*persp*uScale+uOffset;
  vec2 sp=vec2(s.x*uAspect, s.y);
  vec2 d=vec2((sp.x-uMouse.x)/uAspect, sp.y-uMouse.y); float dl=length(d);
  float push=uMouseR*exp(-dl*dl/(uMouseR*uMouseR))*.55;
  if(dl>1e-4) sp+=vec2(d.x*uAspect,d.y)/dl*push;
  gl_Position=vec4(sp,0.,1.);
  gl_PointSize=max(1.,uPx*(.5+1.*h3*h3)*persp);
  float c=mix(A.w,B.w,step(.5,m));
  vec3 col=c<.5?vec3(.776,.608,.329):c<1.5?vec3(.969,.961,.941):vec3(.52,.49,.45);
  float a=c>1.5?.42:.92;
  a*=.55+.45*clamp(p.z*.7+.6,0.,1.);
  a*=.78+.22*sin(uTime*2.3+h4*80.);
  a*=uDim;
  vCol=vec4(col*a,a);
}`;
  const FS = `#version 300 es
precision mediump float;
in vec4 vCol; out vec4 o;
void main(){ vec2 q=gl_PointCoord*2.-1.; float r=dot(q,q); if(r>1.) discard; o=vCol*smoothstep(1.,.3,r); }`;

  function create(canvas, opts) {
    opts = opts || {};
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = Math.min(innerWidth, innerHeight) < 600 || (navigator.hardwareConcurrency || 8) <= 4;
    const N = opts.count || (small ? 12000 : 26000);
    const gl = canvas.getContext('webgl2', {alpha: true, premultipliedAlpha: true, antialias: false});
    if (!gl) { canvas.dataset.fallback = '1'; return null; }
    const names = opts.shapes || Object.keys(BUILD);
    const rows = Math.ceil(N / TEXW);
    const data = new Float32Array(TEXW * rows * names.length * 4);
    const index = {};
    names.forEach((name, s) => {
      seed = 11 + s * 97;
      const {p, c} = BUILD[name](N);
      for (let n = 0; n < N; n++) { const o = (s * rows * TEXW + n) * 4; data[o] = p[n * 3]; data[o + 1] = p[n * 3 + 1]; data[o + 2] = p[n * 3 + 2]; data[o + 3] = c[n]; }
      index[name] = s;
    });
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, TEXW, rows * names.length, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    const U = {}; ['uT', 'uRows', 'uFrom', 'uTo', 'uMix', 'uTime', 'uScale', 'uPx', 'uAspect', 'uFocal', 'uDim', 'uWind', 'uMouseR', 'uOffset', 'uRot', 'uMouse'].forEach(k => U[k] = gl.getUniformLocation(prog, k));
    gl.bindVertexArray(gl.createVertexArray());

    const st = {
      from: index[names[0]], to: index[names[0]], t0: 0, dur: 1, pending: null,
      lay: {x: 0, y: 0, s: 0.5}, layT: {x: 0, y: 0, s: 0.5},
      yaw: 0, pitch: 0, px: 0, py: 0, mx: 9, my: 9, mr: 0, mrT: 0, dim: 1, dimT: 1, wind: 1,
      spin: opts.spin || 0, running: true, last: performance.now(), time: 0, onframe: null,
    };
    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = Math.round(canvas.clientWidth * dpr); H = Math.round(canvas.clientHeight * dpr);
      canvas.width = W; canvas.height = H;
    }
    new ResizeObserver(resize).observe(canvas); resize();
    addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      st.px = ((e.clientX - r.left) / r.width - 0.5) * 2; st.py = ((e.clientY - r.top) / r.height - 0.5) * 2;
      st.mx = st.px; st.my = -st.py; st.mrT = e.pointerType === 'mouse' ? 0.09 : 0;
    }, {passive: true});
    document.addEventListener('pointerleave', () => { st.px = st.py = 0; st.mrT = 0; });
    document.addEventListener('visibilitychange', () => { st.last = performance.now(); });

    const now = () => performance.now();
    const mixNow = () => clamp01((now() - st.t0) / st.dur);
    function start(name, dur) { st.from = st.to; st.to = index[name]; st.t0 = now(); st.dur = reduced ? 1 : dur; }
    function morphTo(name, dur) {
      if (!(name in index)) return;
      dur = dur || 1800;
      if (index[name] === st.to && !st.pending) return;
      if (mixNow() < 1) { st.pending = {name, dur}; st.dur = Math.min(st.dur, (now() - st.t0) + 500); return; }
      start(name, dur);
    }
    function intro(name, dur) { st.from = index.cloud ?? st.from; st.to = index[name]; st.t0 = now() + (reduced ? 0 : 250); st.dur = reduced ? 1 : dur || 3600; st.pending = null; }

    function frame() {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      const t = now(), dt = Math.min(0.05, (t - st.last) / 1000); st.last = t; st.time += dt;
      let m = clamp01((t - st.t0) / st.dur);
      if (m >= 1 && st.pending) { const p = st.pending; st.pending = null; st.from = st.to; st.to = index[p.name]; st.t0 = t; st.dur = reduced ? 1 : p.dur; m = 0; }
      if (m >= 1 && st.from !== st.to) st.from = st.to;
      const k = 1 - Math.pow(0.001, dt);                  // frame-rate independent smoothing
      for (const q of ['x', 'y', 's']) st.lay[q] += (st.layT[q] - st.lay[q]) * k * 0.9;
      const sway = reduced ? 0 : Math.sin(st.time * 0.35) * 0.12;
      st.yaw += ((reduced ? 0 : st.px * 0.55) + sway + st.spin * st.time - st.yaw) * k * 0.6;
      st.pitch += ((reduced ? 0 : st.py * 0.3) + Math.cos(st.time * 0.27) * 0.05 - st.pitch) * k * 0.6;
      st.mr += (st.mrT - st.mr) * k; st.dim += (st.dimT - st.dim) * k;
      if (st.onframe) st.onframe(st, dt);
      gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(prog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.uT, 0);
      gl.uniform1i(U.uRows, rows); gl.uniform1i(U.uFrom, st.from); gl.uniform1i(U.uTo, st.to);
      gl.uniform1f(U.uMix, m); gl.uniform1f(U.uTime, st.time);
      // wide figures never spill off a narrow screen
      const hw = HALFW[names[st.to]] || 1.05, room = Math.max(.2, .94 - Math.abs(st.lay.x) * H / W);
      const sEff = names[st.to] === 'field' || names[st.to] === 'cloud' ? st.lay.s : Math.min(st.lay.s, room * W / H / hw);
      gl.uniform1f(U.uScale, sEff); gl.uniform2f(U.uOffset, st.lay.x, st.lay.y);
      gl.uniform1f(U.uPx, 1.7 * dpr * Math.max(0.75, Math.min(1.35, H / dpr / 900)));
      gl.uniform1f(U.uAspect, H / W); gl.uniform1f(U.uFocal, 4.0);
      gl.uniform1f(U.uDim, st.dim); gl.uniform1f(U.uWind, reduced ? 0 : st.wind);
      gl.uniform2f(U.uRot, st.yaw, st.pitch);
      gl.uniform2f(U.uMouse, st.mx, st.my); gl.uniform1f(U.uMouseR, reduced ? 0 : st.mr);
      gl.drawArrays(gl.POINTS, 0, N);
    }
    requestAnimationFrame(frame);

    return {
      morphTo, intro,
      layout(l, instant) { Object.assign(st.layT, l); if (instant) Object.assign(st.lay, st.layT); },
      dim(v) { st.dimT = v; },
      get current() { return names[st.to]; },
      state: st, count: N,
    };
  }
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const HALFW = {logo: 1.56, isotipo: 1.5, globe: 1.0, neural: 1.35, lattice: 1.25, chip: .95, compass: .95, code: .8, sprout: .8, car: 1.0, tower: 1.0, cube: .8, team: .95, question: .85};

  window.Sand = {create, shapes: Object.keys(BUILD)};
})();
