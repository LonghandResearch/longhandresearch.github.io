/* Longhand Research: the terrestrial globe on the front page.
   A walnut-and-brass globe drawn with three.js, with Natural Earth coastlines
   painted onto the sphere. It turns slowly on its tilted axis. Drag the ball
   in any direction to turn it any way you like, while the stand stays still;
   click it, or press Space, to stop it turning. Let go, and after a while it
   settles back onto its axis. */
(function () {
  'use strict';

  const plate = document.querySelector('[data-globe]');
  if (!plate) return;
  const stage = plate.querySelector('[data-globe-stage]');
  const hero = plate.closest('.hero');

  const CDN = 'https://cdn.jsdelivr.net/npm/';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const START_LON = 20;            // meridian facing the reader when the page opens
  const HIGHLIGHT = null;          // ISO numeric code of a country to pick out in gold, for example '360' for Indonesia
  const TURN_SECONDS = 120;        // one full turn of the globe on its axis
  const RETURN_AFTER_MS = 5000;    // idle time before a hand-turned ball settles back onto its axis

  function unavailable(err) {
    if (err) console.warn('The globe could not be shown:', err);
    plate.classList.add('is-unavailable');
    if (hero) hero.classList.add('no-globe');
  }

  const saveData = navigator.connection && navigator.connection.saveData;
  const webgl = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  if (!webgl || saveData) { unavailable(); return; }

  Promise.all([
    import(`${CDN}three@0.184.0/build/three.module.min.js`),
    import(`${CDN}d3-geo@3.1.1/+esm`),
    import(`${CDN}topojson-client@3.1.0/+esm`),
    fetch(`${CDN}world-atlas@2.0.2/countries-110m.json`).then((r) => {
      if (!r.ok) throw new Error(`Map data returned ${r.status}`);
      return r.json();
    }),
    document.fonts ? document.fonts.load('italic 400 40px "Newsreader"').catch(() => null) : null,
  ])
    .then(([THREE, geo, topojson, topo]) => build(THREE, geo, topojson, topo))
    .catch(unavailable);

  function build(THREE, geo, topojson, topo) {
    const small = Math.min(window.innerWidth, window.innerHeight) < 720 || (navigator.hardwareConcurrency || 8) <= 4;

    /* The globe's face, painted onto an equirectangular canvas */
    const TEX_W = small ? 2048 : 4096;
    const TEX_H = TEX_W / 2;
    const K = TEX_W / 4096;
    const INK = '#1e1c19';
    const PAPER = '#f5ecdc';
    const GOLD = '#b68235';
    const GOLD_LT = '#e1ad66';
    const LEAF = '#dcae5c';
    const LINE = '#201f1d';

    const face = document.createElement('canvas');
    face.width = TEX_W;
    face.height = TEX_H;
    const ctx = face.getContext('2d');
    const proj = geo.geoEquirectangular().scale(TEX_W / (2 * Math.PI)).translate([TEX_W / 2, TEX_H / 2]).precision(0.1);
    const path = geo.geoPath(proj, ctx);
    const draw = (g) => { ctx.beginPath(); path(g); };

    const land = topojson.feature(topo, topo.objects.land);
    const borders = topojson.mesh(topo, topo.objects.countries, (a, b) => a !== b);
    const picked = HIGHLIGHT ? topojson.feature(topo, topo.objects.countries).features.find((f) => String(f.id) === String(HIGHLIGHT)) : null;
    const parallel = (lat) => ({ type: 'LineString', coordinates: Array.from({ length: 361 }, (_, i) => [i - 180, lat]) });

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // graticule under the land
    ctx.strokeStyle = GOLD;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 1.4 * K;
    draw(geo.geoGraticule().step([15, 15])());
    ctx.stroke();
    ctx.globalAlpha = 1;

    // water-lining: concentric gold rules echoing each coast outward
    [46, 34, 24, 15, 7].forEach((w, i, all) => {
      ctx.globalAlpha = 0.3 + 0.6 * (i / (all.length - 1));
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = w * K;
      draw(land);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = INK;
      ctx.lineWidth = (w - 3.4) * K;
      draw(land);
      ctx.stroke();
    });
    ctx.fillStyle = PAPER;
    draw(land);
    ctx.fill();
    if (picked) {
      ctx.fillStyle = LEAF;
      draw(picked);
      ctx.fill();
    }
    ctx.strokeStyle = LINE;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1.2 * K;
    draw(borders);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.8 * K;
    draw(land);
    ctx.stroke();

    // equator, tropics and polar circles
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2.6 * K;
    ctx.globalAlpha = 0.9;
    draw(parallel(0));
    ctx.stroke();
    ctx.setLineDash([14 * K, 10 * K]);
    ctx.lineWidth = 1.8 * K;
    ctx.globalAlpha = 0.75;
    [23.44, -23.44, 66.56, -66.56].forEach((l) => { draw(parallel(l)); ctx.stroke(); });
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // ocean names, pre-stretched so they read true on the sphere
    const label = (text, lon, lat, size) => {
      const [x, y] = proj([lon, lat]);
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1 / Math.cos((lat * Math.PI) / 180), 1);
      ctx.font = `italic 400 ${size * K}px Newsreader, Georgia, serif`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = `${size * K * 0.32}px`;
      ctx.fillStyle = GOLD_LT;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.toUpperCase(), 0, 0);
      ctx.restore();
    };
    label('Oceanus Atlanticus', -40, 27, 40);
    label('Mare Aethiopicum', -12, -24, 34);
    label('Mare Pacificum', -135, 6, 48);
    label('Mare del Zur', 172, -28, 34);
    label('Oceanus Indicus', 80, -18, 42);
    label('Oceanus Australis', 30, -58, 30);
    label('Mare Boreale', -20, 72, 26);

    /* Renderer, scene and light */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);

    const tex = new THREE.CanvasTexture(face);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 50);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xd8d2c4, 1.0);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.002;
    Object.assign(key.shadow.camera, { left: -0.6, right: 0.6, top: 0.6, bottom: -0.6, near: 4, far: 14 });
    key.shadow.camera.updateProjectionMatrix();
    const fill = new THREE.DirectionalLight(0xfff4e6, 0.5);
    fill.position.set(-5, 3, -4);
    const rim = new THREE.DirectionalLight(0xffdca8, 0);   // separates the globe from a dark page
    rim.position.set(-4, 3.5, -5);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.ShadowMaterial({ opacity: 0.14 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(hemi, key, fill, rim, ground);

    /* The globe and its stand, in metres */
    const walnut = new THREE.MeshStandardMaterial({ color: 0x4a2e1e, roughness: 0.42, metalness: 0 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xd7a452, roughness: 0.32, metalness: 0.38 });
    const engraving = new THREE.MeshStandardMaterial({ color: 0x3a270d, roughness: 0.6, metalness: 0.1 });
    const varnish = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0, map: tex });

    const H = 0.33, R = 0.15, RI = 0.161, RO = 0.172, TILT = (23.44 * Math.PI) / 180;
    const seg = small ? 64 : 96;
    const model = new THREE.Group();
    const mesh = (geom, mat) => { const m = new THREE.Mesh(geom, mat); m.castShadow = true; m.receiveShadow = true; return m; };
    const lathe = (pts, n = seg) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);

    // turned walnut pedestal with a brass foot band
    model.add(mesh(lathe([
      [0, 0], [0.100, 0], [0.103, 0.003], [0.103, 0.010], [0.099, 0.015], [0.090, 0.018],
      [0.074, 0.021], [0.058, 0.025], [0.044, 0.031], [0.034, 0.039], [0.029, 0.048],
      [0.031, 0.054], [0.030, 0.060], [0.023, 0.065], [0.017, 0.076], [0.014, 0.092],
      [0.0135, 0.106], [0.015, 0.116], [0.021, 0.121], [0.021, 0.128], [0.013, 0.132], [0, 0.132],
    ]), walnut));
    model.add(mesh(lathe([[0.1034, 0.0045], [0.1044, 0.0055], [0.1044, 0.0085], [0.1034, 0.0095]]), brass));

    // brass stem and the collar that grips the meridian
    const collarH = 0.024;
    const collarBottom = H - RO - 0.006;
    model.add(mesh(lathe([
      [0, 0.128], [0.011, 0.128], [0.011, 0.134], [0.008, 0.137], [0.0058, 0.141],
      [0.0058, collarBottom - 0.004], [0.0085, collarBottom - 0.002], [0.0085, collarBottom], [0, collarBottom],
    ], 48), brass));
    const collar = mesh(new THREE.BoxGeometry(0.014, collarH, 0.013), brass);
    collar.position.y = collarBottom + collarH / 2;
    model.add(collar);

    // meridian ring
    const band = new THREE.Shape();
    band.absarc(0, 0, RO, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, RI, 0, Math.PI * 2, true);
    band.holes.push(hole);
    const ringDepth = 0.006;
    const ringGeo = new THREE.ExtrudeGeometry(band, { depth: ringDepth, bevelEnabled: true, bevelThickness: 0.0007, bevelSize: 0.0007, bevelSegments: 2, curveSegments: 160 });
    ringGeo.translate(0, 0, -ringDepth / 2);
    const meridian = mesh(ringGeo, brass);
    meridian.position.y = H;
    model.add(meridian);

    // engraved degree scale on both faces of the meridian, as one mesh
    {
      const pos = [];
      const nor = [];
      const faceZ = ringDepth / 2 + 0.0007;
      for (const side of [1, -1]) {
        for (let d = 0; d < 360; d += 2) {
          const len = d % 10 === 0 ? 0.0052 : 0.0024;
          const w = d % 10 === 0 ? 0.0007 : 0.0004;
          const g = new THREE.BoxGeometry(len, w, 0.0003).toNonIndexed();
          const m = new THREE.Matrix4().makeRotationZ((d * Math.PI) / 180)
            .multiply(new THREE.Matrix4().makeTranslation(RO - 0.0006 - len / 2, 0, side * (faceZ + 0.00005)));
          g.applyMatrix4(m);
          pos.push(...g.attributes.position.array);
          nor.push(...g.attributes.normal.array);
          g.dispose();
        }
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      const scale = mesh(geom, engraving);
      scale.position.y = H;
      model.add(scale);
    }

    // The tilted polar axis stays where it is, with the brass meridian and its
    // pins. Inside it the ball can be turned any way by hand (ball), and it
    // also turns slowly on its own axis (spin).
    const axis = new THREE.Group();
    axis.position.y = H;
    axis.rotation.z = TILT;
    model.add(axis);
    const ball = new THREE.Group();
    axis.add(ball);
    const spin = new THREE.Group();
    ball.add(spin);
    const globe = mesh(new THREE.SphereGeometry(R, small ? 112 : 160, small ? 72 : 96), varnish);
    spin.add(globe);
    for (const s of [1, -1]) {
      const pinLen = RO - R + 0.012;
      const pin = mesh(new THREE.CylinderGeometry(0.0022, 0.0022, pinLen, 24), brass);
      pin.position.y = s * (R + pinLen / 2 - 0.004);
      axis.add(pin);
      const cap = mesh(lathe([[0, 0], [0.0055, 0], [0.0055, 0.0025], [0.0035, 0.0045], [0, 0.0052]], 32), brass);
      cap.position.y = s * (RO + 0.0006);
      cap.scale.y = s;
      axis.add(cap);
    }
    scene.add(model);

    /* State. The camera and the stand never move: only the ball turns. */
    const AUTO = (Math.PI * 2) / TURN_SECONDS;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const viewDir = new THREE.Vector3(0.62, 0.3, 1).normalize();
    const UPRIGHT = new THREE.Quaternion();

    let dist = 1;
    let playing = !reduceMotion.matches;
    let spinVel = 0;                       // the globe's own turn, easing towards AUTO
    const omega = new THREE.Vector3();     // a hand-given turn still running: axis times radians per second
    let dragging = false, moved = false;
    let downX = 0, downY = 0, downT = 0, lastX = 0, lastY = 0, lastT = 0;
    let lastTouch = 0;                     // last time the reader turned the ball
    let returning = false;
    let visible = true, raf = 0, last = 0, shown = false;

    const camRight = new THREE.Vector3(1, 0, 0);
    const camUp = new THREE.Vector3(0, 1, 0);

    /* Framing: the whole object fits the stage, seen from a little above */
    function frame() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const vfov = (camera.fov * Math.PI) / 180;
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      const halfH = (size.y / 2) * 1.06;
      const halfW = (Math.max(size.x, size.z) / 2) * 1.12;
      dist = Math.max(halfH / Math.tan(vfov / 2), halfW / Math.tan(hfov / 2)) + Math.max(size.x, size.z) / 2;
      camera.position.copy(center).addScaledVector(viewDir, dist);
      camera.lookAt(center);
      camera.near = dist / 20;
      camera.far = dist * 6;
      camera.updateProjectionMatrix();
      // the screen's right and up, as directions in the scene, for turning by hand
      camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      requestFrame();
    }

    // Turn the globe so the chosen meridian faces the reader when the page
    // opens. The slope between spin and facing longitude is measured, not assumed.
    frame();
    const v = new THREE.Vector3();
    const facingLon = () => {
      v.copy(camera.position);
      globe.updateWorldMatrix(true, false);
      globe.worldToLocal(v);
      return (Math.atan2(-v.z, v.x) * 180) / Math.PI;
    };
    const wrap180 = (d) => ((((d + 180) % 360) + 360) % 360) - 180;
    spin.rotation.y = 0;
    const lon0 = facingLon();
    spin.rotation.y = 0.1;
    const slope = wrap180(facingLon() - lon0) / 0.1;
    spin.rotation.y = slope ? wrap180(START_LON - lon0) / slope : 0;

    /* Turning the ball by hand, about an axis given in scene space. The tilt
       of the polar axis is taken out first, so the ball turns exactly the way
       the hand moved. */
    model.updateMatrixWorld(true);
    const QP = axis.getWorldQuaternion(new THREE.Quaternion());
    const QPi = QP.clone().invert();
    const tq = new THREE.Quaternion();
    const tm = new THREE.Quaternion();
    const tv = new THREE.Vector3();
    function turnBall(sceneAxis, angle) {
      tq.setFromAxisAngle(sceneAxis, angle);
      tm.copy(QPi).multiply(tq).multiply(QP);
      ball.quaternion.premultiply(tm).normalize();
    }
    const tilted = () => ball.quaternion.angleTo(UPRIGHT) > 1e-3;

    /* Setting the ball back on its axis. The part of the hand's turn that went
       round the polar axis is kept (it moves into the spin), so the side the
       reader turned to stays in front; only the tilt eases away. */
    function settle() {
      const q = ball.quaternion;
      const twist = new THREE.Quaternion(0, q.y, 0, q.w);
      if (twist.lengthSq() < 1e-10) twist.identity(); else twist.normalize();
      ball.quaternion.multiply(tm.copy(twist).invert());
      spin.quaternion.premultiply(twist);
      omega.set(0, 0, 0);
      returning = true;
      requestFrame();
    }

    function loop(now) {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;

      // the globe's own slow turn, eased in and out
      const target = playing ? AUTO : 0;
      spinVel += (target - spinVel) * (1 - Math.exp(-dt * 1.2));
      if (!playing && Math.abs(spinVel) < 1e-4) spinVel = 0;
      if (spinVel) spin.rotateY(spinVel * dt);

      if (!dragging) {
        // a flick carries on for a moment, then fades
        const w = omega.length();
        if (w > 1e-3) {
          turnBall(tv.copy(omega).divideScalar(w), w * dt);
          omega.multiplyScalar(Math.exp(-dt * 3.2));
        } else if (w) {
          omega.set(0, 0, 0);
        }
        // left alone for a while, the ball settles back onto its axis
        if (!returning && !omega.lengthSq() && now - lastTouch > RETURN_AFTER_MS && tilted()) settle();
        if (returning) {
          ball.quaternion.slerp(UPRIGHT, reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 1.8));
          if (!tilted()) { ball.quaternion.identity(); returning = false; }
        }
      }

      renderer.render(scene, camera);
      if (!shown) { shown = true; plate.classList.add('is-ready'); }
      const busy = dragging || playing || spinVel !== 0 || omega.lengthSq() > 0 || returning || tilted();
      if (busy && visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    function requestFrame() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    /* Hand: drag in any direction to turn the ball, click to stop or start it */
    const perPixel = () => (Math.PI * 1.25) / Math.max(260, stage.clientHeight);
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      moved = false;
      returning = false;
      omega.set(0, 0, 0);
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      downT = lastT = e.timeStamp;
      lastTouch = performance.now();
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* capture unsupported */ }
      requestFrame();
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 5) { moved = true; stage.classList.add('is-dragging'); }
      if (!moved) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const len = Math.hypot(dx, dy);
      if (len) {
        const angle = len * perPixel();
        const dt = Math.max(8, e.timeStamp - lastT) / 1000;
        // the ball turns about the axis at right angles to the hand's movement
        tv.copy(camUp).multiplyScalar(dx).addScaledVector(camRight, dy).normalize();
        turnBall(tv, angle);
        omega.multiplyScalar(0.5).addScaledVector(tv, (angle / dt) * 0.5);
      }
      lastX = e.clientX;
      lastY = e.clientY;
      lastT = e.timeStamp;
      lastTouch = performance.now();
      requestFrame();
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove('is-dragging');
      lastTouch = performance.now();
      if (!moved) {
        omega.set(0, 0, 0);
        if (e.type === 'pointerup' && e.timeStamp - downT < 450) setPlaying(!playing);
      } else if (e.timeStamp - lastT > 90 || reduceMotion.matches) {
        omega.set(0, 0, 0);          // the hand stopped before letting go, or motion is turned down
      } else if (omega.length() > 7) {
        omega.setLength(7);
      }
      requestFrame();
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release);
    stage.addEventListener('dblclick', () => { if (tilted()) settle(); });

    /* Keyboard: arrows turn the ball, Space or Enter stops and starts it,
       Home sets it back on its axis */
    stage.addEventListener('keydown', (e) => {
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (dir) {
        e.preventDefault();
        returning = false;
        tv.copy(camUp).multiplyScalar(dir[0]).addScaledVector(camRight, dir[1]).normalize();
        if (reduceMotion.matches) turnBall(tv, 0.3);      // a plain step instead of a glide
        else omega.addScaledVector(tv, 2.4);
        lastTouch = performance.now();
        requestFrame();
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setPlaying(!playing);
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (tilted()) settle();
      }
    });

    // A toggle button: "Stop the globe turning", pressed while it is stopped
    function setPlaying(on) {
      playing = on;
      stage.setAttribute('aria-pressed', String(!on));
      stage.title = on ? 'Drag to turn the globe any way. Click to stop it.' : 'Drag to turn the globe any way. Click to set it turning again.';
      requestFrame();
    }
    setPlaying(playing);
    const onMotionPref = (e) => setPlaying(!e.matches);
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPref);

    /* Only draw while the globe is on screen and the tab is open */
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestFrame();
    }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) requestFrame(); });
    new ResizeObserver(frame).observe(stage);

    /* Lighting follows the page theme */
    function applyTheme() {
      const dark = document.documentElement.dataset.theme === 'dark';
      rim.intensity = dark ? 2.6 : 0;
      hemi.intensity = dark ? 0.8 : 1.0;
      hemi.groundColor.set(dark ? 0x3b3226 : 0xd8d2c4);
      ground.material.opacity = dark ? 0.42 : 0.14;
      requestFrame();
    }
    document.addEventListener('longhand:theme', applyTheme);
    applyTheme();
  }
})();
