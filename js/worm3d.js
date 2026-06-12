/* ═══ REALISTIC 3D EARTHWORM SCROLLYTELLING ═══
   Segmented skin texture · tapered body · wet clearcoat sheen
   Peristalsis motion · soil environment · scroll-driven camera */
(function () {
  var sec = document.getElementById('w3');
  if (!sec) return;
  var canvas = document.getElementById('w3c');
  var stages = [].slice.call(sec.querySelectorAll('.w3-stage'));
  var dots = [].slice.call(sec.querySelectorAll('.w3-dot'));

  var ok = !!window.THREE;
  if (ok) {
    try {
      var tc = document.createElement('canvas');
      ok = !!(window.WebGLRenderingContext && (tc.getContext('webgl') || tc.getContext('experimental-webgl')));
    } catch (e) { ok = false; }
  }
  if (!ok) { sec.classList.add('no3d'); return; }

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(38, 1, 0.1, 60);

  // ── Lighting: warm key + cool fill + rim for wet highlight ──
  scene.add(new THREE.HemisphereLight(0xfff3e4, 0x4a3826, 0.85));
  var key = new THREE.DirectionalLight(0xfff1de, 1.0); key.position.set(2.2, 3.2, 2.6); scene.add(key);
  var fill = new THREE.DirectionalLight(0xd8e8d0, 0.35); fill.position.set(-2.5, 1.2, -1.5); scene.add(fill);
  var rim = new THREE.DirectionalLight(0xffffff, 0.5); rim.position.set(0, 2.5, -3.5); scene.add(rim);

  // ── Procedural earthworm skin texture (segments + dorsal shading) ──
  function skinTexture() {
    var c = document.createElement('canvas'); c.width = 1024; c.height = 128;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 1024, 0);          // along body
    g.addColorStop(0.00, '#6e3d2e');                         // tail darker
    g.addColorStop(0.45, '#9c5743');
    g.addColorStop(0.60, '#a05c46');
    g.addColorStop(1.00, '#7d4534');                         // head
    x.fillStyle = g; x.fillRect(0, 0, 1024, 128);
    var d = x.createLinearGradient(0, 0, 0, 128);            // dorsal dark / belly pale
    d.addColorStop(0.00, 'rgba(48,22,16,.42)');
    d.addColorStop(0.45, 'rgba(0,0,0,0)');
    d.addColorStop(1.00, 'rgba(255,224,200,.22)');
    x.fillStyle = d; x.fillRect(0, 0, 1024, 128);
    for (var i = 0; i < 150; i++) {                          // ~150 annular segments
      var px = i * 1024 / 150;
      x.fillStyle = 'rgba(42,18,12,.34)'; x.fillRect(px, 0, 2.0, 128);
      x.fillStyle = 'rgba(255,206,182,.12)'; x.fillRect(px + 2.4, 0, 1.2, 128);
    }
    for (var s = 0; s < 700; s++) {                          // organic speckle
      x.fillStyle = 'rgba(' + (Math.random() > .5 ? '255,210,190' : '40,18,12') + ',' + (Math.random() * .06) + ')';
      x.fillRect(Math.random() * 1024, Math.random() * 128, 2, 2);
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  var skin = skinTexture();

  var matBody = new THREE.MeshPhysicalMaterial({
    map: skin, bumpMap: skin, bumpScale: 0.012,
    roughness: 0.42, clearcoat: 0.75, clearcoatRoughness: 0.28,
    color: 0xffffff
  });
  var matBand = new THREE.MeshPhysicalMaterial({
    color: 0xd9a288, roughness: 0.5, clearcoat: 0.55, clearcoatRoughness: 0.3
  });
  var matCap = new THREE.MeshPhysicalMaterial({
    color: 0x86492f, roughness: 0.45, clearcoat: 0.7, clearcoatRoughness: 0.3
  });

  // ── Body taper: thin tail → full mid → blunt head ──
  function taper(t) {
    var u = Math.min(1, Math.max(0, (t + 0.06) / 1.12));
    return 0.42 + 0.58 * Math.sin(Math.PI * u);
  }

  var SEGS = 72, RAD = 14, BASE_R = 0.15;

  function makeWorm(scale, phase, x0, y0, z0, speed) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.BufferGeometry(), matBody);
    var band = new THREE.Mesh(new THREE.BufferGeometry(), matBand);
    var head = new THREE.Mesh(new THREE.SphereGeometry(BASE_R * 0.52, 16, 14), matCap);
    var tail = new THREE.Mesh(new THREE.SphereGeometry(BASE_R * 0.45, 16, 14), matCap);
    g.add(body, band, head, tail);
    g.position.set(x0, y0, z0);
    g.userData = { body: body, band: band, head: head, tail: tail, phase: phase, baseScale: scale, speed: speed };
    g.scale.setScalar(scale);
    scene.add(g);
    return g;
  }
  var worms = [
    makeWorm(1.00, 0.0,  0.00, -0.16,  0.00, 1.00),
    makeWorm(0.60, 2.3, -1.10, -0.30, -0.95, 1.12),
    makeWorm(0.52, 4.1,  1.15, -0.32,  0.90, 1.22)
  ];
  worms[1].visible = false; worms[2].visible = false;

  // ── Soil crumbs scattered on the ground ──
  (function soil() {
    var geo = new THREE.DodecahedronGeometry(1, 0);
    var cols = [0x3a2a1e, 0x4d3a28, 0x2e2015, 0x57422c];
    for (var i = 0; i < 16; i++) {
      var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[i % 4], roughness: 0.95 }));
      var s = 0.03 + Math.random() * 0.055;
      m.scale.set(s, s * (0.5 + Math.random() * 0.4), s);
      m.position.set((Math.random() - 0.5) * 4.6, -0.40 + Math.random() * 0.03, (Math.random() - 0.5) * 2.8);
      m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      scene.add(m);
    }
  })();

  // ── Peristalsis spine: undulation + traveling compression wave ──
  var N = 11, pts = [];
  function spine(t, ph) {
    pts.length = 0;
    for (var i = 0; i < N; i++) {
      var f = i / (N - 1);
      var x = -1.95 + 3.9 * (f + 0.020 * Math.sin(t * 2.0 - f * 7.0 + ph));   // compress/stretch
      var env = Math.sin(Math.PI * f) * 0.8 + 0.2;
      pts.push(new THREE.Vector3(
        x,
        Math.sin(x * 1.45 + t * 1.15 + ph) * 0.125 * env,
        Math.cos(x * 1.10 + t * 0.85 + ph) * 0.085 * env
      ));
    }
    return new THREE.CatmullRomCurve3(pts);
  }

  function taperGeometry(geo, curve) {
    var pos = geo.attributes.position;
    for (var i = 0; i <= SEGS; i++) {
      var t = i / SEGS, c = curve.getPoint(t), s = taper(t);
      for (var j = 0; j <= RAD; j++) {
        var idx = i * (RAD + 1) + j;
        pos.setXYZ(idx,
          c.x + (pos.getX(idx) - c.x) * s,
          c.y + (pos.getY(idx) - c.y) * s,
          c.z + (pos.getZ(idx) - c.z) * s);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }

  function updateWorm(w, t) {
    var u = w.userData;
    var curve = spine(t * u.speed, u.phase);
    if (u.body.geometry) u.body.geometry.dispose();
    var geo = new THREE.TubeGeometry(curve, SEGS, BASE_R, RAD, false);
    taperGeometry(geo, curve);
    u.body.geometry = geo;
    // clitellum band over t = 0.56–0.68 (slightly raised, pale)
    var bp = [];
    for (var j = 0; j <= 6; j++) bp.push(curve.getPoint(0.56 + 0.12 * j / 6));
    if (u.band.geometry) u.band.geometry.dispose();
    u.band.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(bp), 12, BASE_R * taper(0.62) * 1.10, RAD, false);
    u.head.position.copy(curve.getPoint(1));
    u.tail.position.copy(curve.getPoint(0));
  }

  // ── Scroll progress ──
  var p = 0, vis = false, t0 = performance.now();
  function prog() {
    var r = sec.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    p = Math.min(1, Math.max(0, -r.top / total));
  }
  window.addEventListener('scroll', prog, { passive: true });
  prog();

  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h && canvas.width !== Math.floor(w * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);

  var look = new THREE.Vector3();
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frameSkip = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!vis) return;
    resize();
    var t = reduce ? 0.6 : (now - t0) / 1000;
    var s = p * 5;

    var multi = Math.min(1, Math.max(0, (s - 3) / 0.5));
    worms[1].visible = multi > 0.01; worms[2].visible = multi > 0.01;
    worms[1].scale.setScalar(worms[1].userData.baseScale * (0.3 + 0.7 * multi));
    worms[2].scale.setScalar(worms[2].userData.baseScale * (0.3 + 0.7 * multi));

    // geometry rebuild is the heavy part — alternate side worms across frames
    updateWorm(worms[0], t);
    frameSkip ^= 1;
    if (worms[1].visible && frameSkip) updateWorm(worms[1], t);
    if (worms[2].visible && !frameSkip) updateWorm(worms[2], t);

    // Cinematic camera path
    var a = -0.50 + p * 2.7;
    var rad2 = 3.6 - 1.25 * Math.sin(p * Math.PI);
    var hgt = 0.78 - 0.46 * Math.sin(p * Math.PI * 1.25);
    cam.position.set(Math.sin(a) * rad2, hgt, Math.cos(a) * rad2);
    var toHead = Math.min(1, Math.max(0, s - 1));
    var back = Math.min(1, Math.max(0, s - 2.5));
    look.set(toHead * 0.85 - back * 0.85, -0.12, 0);
    cam.lookAt(look);
    renderer.render(scene, cam);

    for (var k = 0; k < stages.length; k++) {
      var c = (k + 0.5) / stages.length;
      var o = Math.max(0, 1 - Math.abs(p - c) * stages.length * 2.0);
      stages[k].style.opacity = o;
      stages[k].style.transform = 'translateY(' + ((1 - o) * 14) + 'px)';
      stages[k].style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      if (dots[k]) dots[k].classList.toggle('on', Math.abs(p - c) < 0.5 / stages.length);
    }
  }

  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { rootMargin: '60px' }).observe(sec);
  requestAnimationFrame(frame);
})();
