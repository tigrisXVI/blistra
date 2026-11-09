// The 3D blister pack on the project page.
//
// A sheet of foil with eight plastic domes, each holding a pill. Tap a dome and
// the pill pops out, leaving a torn hole, exactly like the real thing. When all
// eight are gone the pack refills. The scene sleeps when it is off screen, and
// with "reduce motion" turned on it stays still and pops without animation.
//
// three.js is loaded only when this module is used (vendor/three.js is a trimmed
// build containing just the classes imported here).

import * as THREE from "../vendor/three.js";

const COLS = 4, ROWS = 2, GAP_X = 1.06, GAP_Y = 1.08, DOME_R = 0.4;
const CARD_W = COLS * GAP_X + 0.5, CARD_H = ROWS * GAP_Y + 0.5;
const easeOut = t => 1 - Math.pow(1 - t, 3);

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Round tablet: a lathe profile with softly rounded edges, lying flat. */
function tabletGeometry(radius, thick) {
  const pts = [], steps = 10;
  pts.push(new THREE.Vector2(0, -thick / 2));
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * Math.PI;
    pts.push(new THREE.Vector2(radius - thick / 2 + Math.cos(a) * thick / 2, Math.sin(a) * thick / 2));
  }
  pts.push(new THREE.Vector2(0, thick / 2));
  const g = new THREE.LatheGeometry(pts, 48);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Two-tone capsule: vertex colours split at the middle. */
function capsuleGeometry(colorA, colorB) {
  const g = new THREE.CapsuleGeometry(0.15, 0.38, 10, 28);
  g.rotateZ(Math.PI / 2);
  const pos = g.attributes.position, cols = new Float32Array(pos.count * 3);
  const a = new THREE.Color(colorA), b = new THREE.Color(colorB);
  for (let i = 0; i < pos.count; i++) { const c = pos.getX(i) < 0 ? a : b; cols.set([c.r, c.g, c.b], i * 3); }
  g.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  return g;
}

/** Dark torn hole left in the foil after a pill is pushed out. */
function holeGeometry() {
  const g = new THREE.CircleGeometry(DOME_R * 0.9, 40), p = g.attributes.position;
  for (let i = 1; i < p.count; i++) {
    const k = 1 - (i % 2) * 0.07 - ((i * 7) % 5) * 0.012;
    p.setXY(i, p.getX(i) * k, p.getY(i) * k);
  }
  return g;
}

/**
 * Mounts the scene inside `host`. Returns { update(opts), destroy() }, or null
 * when the device has no WebGL (the caller then shows a flat drawing).
 * opts: { pills: [4 hex colours], spin: 0..3, motion: boolean }
 */
export function mountHero3D(host, opts) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) { return null; }
  const o = Object.assign({ pills: ["#FFC93C", "#F59AB8", "#FFFFFF", "#5ED3A6"], spin: 1, motion: true, sun: "#FFC93C" }, opts);
  const still = () => !o.motion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 0.6));
  const key = new THREE.DirectionalLight(0xfff3dd, 1.6); key.position.set(3, 4, 6); scene.add(key);


  const pack = new THREE.Group(); scene.add(pack);

  // Foil card.
  const foilMat = new THREE.MeshStandardMaterial({ color: 0xdfe4ea, metalness: 1, roughness: 0.3 });
  const card = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(CARD_W, CARD_H, 0.22), { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3, curveSegments: 12 }), foilMat);
  card.position.z = -0.05; pack.add(card);

  // Perforation line between the two rows, like a real pack you can split.
  const perfMat = new THREE.MeshStandardMaterial({ color: 0x9aa4b2, metalness: 0.6, roughness: 0.5 });
  for (let i = 0; i < 34; i++) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), perfMat);
    d.position.set(-CARD_W / 2 + 0.2 + i * (CARD_W - 0.4) / 33, 0, 0.022); pack.add(d);
  }

  const domeGeo = new THREE.SphereGeometry(DOME_R, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.rotateX(Math.PI / 2);
  const holeGeo = holeGeometry();
  const holeMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.5, roughness: 0.75 });
  const tablet = tabletGeometry(0.27, 0.14);

  const pockets = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c;
    const x = (c - (COLS - 1) / 2) * GAP_X, y = ((ROWS - 1) / 2 - r) * GAP_Y;
    const domeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false });
    const dome = new THREE.Mesh(domeGeo, domeMat); dome.position.set(x, y, 0.03); dome.scale.z = 0.62;
    const kind = i % 3; // 0 round, 1 capsule, 2 oval
    const col = o.pills[i % o.pills.length];
    const pillMat = new THREE.MeshPhysicalMaterial({ color: kind === 1 ? 0xffffff : col, vertexColors: kind === 1, roughness: 0.45, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.45, transparent: true, opacity: 1 });
    const pill = new THREE.Mesh(kind === 1 ? capsuleGeometry(col, o.pills[(i + 1) % o.pills.length]) : tablet, pillMat);
    if (kind === 2) pill.scale.set(1.3, 0.85, 1);
    pill.rotation.z = (i * 0.7) % 1.2 - 0.6;
    pill.position.set(x, y, 0.12);
    const hole = new THREE.Mesh(holeGeo, holeMat); hole.position.set(x, y, 0.026); hole.visible = false;
    pack.add(hole, pill, dome);
    pockets.push({ i, x, y, kind, dome, pill, hole, popped: false, t: -1 });
  }

  // ---- layout ---------------------------------------------------------------
  function resize() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const needW = CARD_W + 1.2, needH = CARD_H + 1.6, t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, 0, Math.max(needH / (2 * t), needW / (2 * t * camera.aspect)));
    camera.updateProjectionMatrix();
    draw();
  }

  // ---- interaction ----------------------------------------------------------
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  function pocketAt(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pockets.flatMap(p => [p.dome, p.pill]), false)[0];
    return hit ? pockets.find(p => p.dome === hit.object || p.pill === hit.object) : null;
  }
  function pop(p) {
    if (!p || p.popped) return;
    p.popped = true; p.t = still() ? 1 : 0; p.hole.visible = true;
    if (still()) finishPop(p);
    wake();
    if (pockets.every(q => q.popped)) setTimeout(refill, still() ? 1200 : 1800);
  }
  function finishPop(p) { p.pill.visible = false; p.dome.scale.z = 0.18; p.dome.material.opacity = 0.18; }
  function refill() {
    pockets.forEach(p => {
      p.popped = false; p.t = -1; p.hole.visible = false; p.pill.visible = true;
      p.pill.position.set(p.x, p.y, 0.12); p.pill.material.opacity = 1; p.pill.rotation.x = p.pill.rotation.y = 0;
      p.dome.scale.z = 0.62; p.dome.material.opacity = 0.3;
    });
    wake();
  }
  const onClick = ev => pop(pocketAt(ev));
  const onMove = ev => {
    const r = host.getBoundingClientRect();
    tilt.tx = ((ev.clientY - r.top) / r.height - 0.5) * 0.3;
    tilt.ty = ((ev.clientX - r.left) / r.width - 0.5) * 0.4;
    renderer.domElement.style.cursor = pocketAt(ev) && !pocketAt(ev).popped ? "pointer" : "default";
    wake();
  };
  const onLeave = () => { tilt.tx = tilt.ty = 0; };
  renderer.domElement.addEventListener("click", onClick);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);

  // ---- animation loop -----------------------------------------------------------
  const REST = { x: -0.42, y: -0.32, z: 0.1 };
  let start = performance.now(), last = start, raf = 0, visible = true, alive = true;
  function draw() { renderer.render(scene, camera); }
  function frame(now) {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const s = still(), el = (now - start) / 1000;
    const enter = s ? 1 : easeOut(Math.min(1, el / 1.6));
    tilt.x += (tilt.tx - tilt.x) * 0.08; tilt.y += (tilt.ty - tilt.y) * 0.08;
    const sway = s ? 0 : Math.sin(el * 0.5 * o.spin) * 0.12 * Math.min(1, o.spin);
    pack.rotation.set(REST.x - 0.9 * (1 - enter) + tilt.x, REST.y + 0.8 * (1 - enter) + sway + tilt.y, REST.z + 0.35 * (1 - enter));
    pack.position.y = -1.2 * (1 - enter) + (s ? 0 : Math.sin(el * 0.9) * 0.05 * Math.min(1, o.spin));
    let busy = !s && (enter < 1 || o.spin > 0 || Math.abs(tilt.tx - tilt.x) + Math.abs(tilt.ty - tilt.y) > 0.001);
    for (const p of pockets) {
      if (!p.popped || p.t >= 1 || p.t < 0) continue;
      p.t = Math.min(1, p.t + dt / 1.1); busy = true;
      const k = p.t;
      p.dome.scale.z = 0.62 - 0.44 * Math.min(1, k * 3);
      p.dome.material.opacity = 0.3 - 0.12 * Math.min(1, k * 3);
      p.pill.position.set(p.x + k * 0.6, p.y + Math.sin(k * Math.PI) * 0.9 - k * k * 1.6, 0.12 + k * 1.4);
      p.pill.rotation.x = k * 5; p.pill.rotation.y = k * 3;
      p.pill.material.opacity = 1 - Math.max(0, (k - 0.6) / 0.4);
      if (p.t >= 1) finishPop(p);
    }
    draw();
    if (busy && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function wake() { if (!raf && alive && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  const ro = new ResizeObserver(resize); ro.observe(host);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) wake(); }); io.observe(host);
  const onVis = () => wake();
  document.addEventListener("visibilitychange", onVis);
  resize(); start = performance.now(); wake();

  return {
    update(next) {
      Object.assign(o, next);
      pockets.forEach(p => {
        const col = o.pills[p.i % o.pills.length];
        if (p.kind === 1) { p.pill.geometry.dispose(); p.pill.geometry = capsuleGeometry(col, o.pills[(p.i + 1) % o.pills.length]); }
        else p.pill.material.color.set(col);
      });
      wake(); draw();
    },
    popOne() { pop(pockets.find(p => !p.popped)); },
    destroy() {
      alive = false; if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave);
      scene.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } });
      pmrem.dispose(); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
