/* Longhand Research: the Earth on the front page.
   A photographic globe drawn with three.js from NASA imagery: Blue Marble for
   the day side, Black Marble for the lights of the night side, and a cloud
   layer that drifts a little faster than the ground. It turns slowly on its
   tilted axis. Drag it to turn it any way; click it, or press Space, to stop
   it; double-click or press Home to set it straight. As the page scrolls, the
   sun moves on and the cities come up out of the dark. */
(function () {
  'use strict';

  const plate = document.querySelector('[data-globe]');
  if (!plate) return;
  const stage = plate.querySelector('[data-globe-stage]');
  const hero = plate.closest('[data-hero]');

  const CDN = 'https://cdn.jsdelivr.net/npm/';
  const IMG = 'assets/img/earth/';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const START_LON = 112;           // meridian facing the reader when the page opens
  const TURN_SECONDS = 150;        // one full turn of the Earth on its axis
  const CLOUD_DRIFT = 0.012;       // how far the clouds run ahead of the ground, turns per turn
  const RETURN_AFTER_MS = 5000;    // idle time before a hand-turned Earth settles back onto its axis
  const SUN_SWEEP = 75;            // degrees the sun moves on as the front page scrolls away
  const RADIUS_SHARE = hero ? 0.46 : 0.40;       // the Earth's radius as a share of the stage's shorter side

  function unavailable(err) {
    if (err) console.warn('The Earth could not be shown:', err);
    plate.classList.add('is-unavailable');
    if (hero) hero.classList.add('no-globe');
  }

  const saveData = navigator.connection && navigator.connection.saveData;
  const webgl = (() => {
    try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  })();
  if (!webgl || saveData) { unavailable(); return; }

  const small = Math.min(window.innerWidth, window.innerHeight) < 720 || (navigator.hardwareConcurrency || 8) <= 4;

  import(`${CDN}three@0.184.0/build/three.module.min.js`)
    .then((THREE) => new THREE.TextureLoader().loadAsync(`${IMG}earth-day-1024.jpg`).then((day) => build(THREE, day)))
    .catch(unavailable);

  function build(THREE, dayLow) {
    /* Renderer and camera. The canvas is transparent: the sky behind it is the page's. */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const prep = (t, srgb) => {
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      t.anisotropy = Math.min(8, maxAniso);
      t.wrapS = THREE.RepeatWrapping;
      return t;
    };
    const blank = (v) => {
      const t = new THREE.DataTexture(new Uint8Array([v, v, v, 255]), 1, 1);
      t.needsUpdate = true;
      return t;
    };
    prep(dayLow, true);

    /* Shaders. Normals and positions are in world space, so the sun can be a
       plain direction that the page moves as it scrolls. */
    const VERT = `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;

    const uniforms = {
      dayMap: { value: dayLow },
      nightMap: { value: blank(0) },
      waterMap: { value: blank(0) },
      cloudMap: { value: blank(0) },
      sunDir: { value: new THREE.Vector3() },
      cloudShift: { value: 0 },
      cloudMix: { value: 0 },
      nightMix: { value: 0 },
      glow: { value: 0 },
      paper: { value: document.documentElement.dataset.theme === 'light' ? 1 : 0 },
    };

    const surface = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: `
        uniform sampler2D dayMap, nightMap, waterMap, cloudMap;
        uniform vec3 sunDir;
        uniform float cloudShift, cloudMix, nightMix, paper;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          vec3 L = normalize(sunDir);
          float NdL = dot(N, L);
          float day = smoothstep(-0.12, 0.22, NdL);
          float cloud = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r * cloudMix;
          vec3 albedo = texture2D(dayMap, vUv).rgb;
          albedo = mix(vec3(dot(albedo, vec3(0.2126, 0.7152, 0.0722))), albedo, 0.18) * vec3(0.80, 0.82, 0.81);
          vec3 col = albedo * (0.012 + 0.12 * max(NdL, 0.0)) * (1.0 - 0.18 * cloud);
          // the sun's glint on open water
          float water = texture2D(waterMap, vUv).r;
          vec3 H = normalize(L + V);
          float glint = pow(max(dot(N, H), 0.0), 140.0) * water * day * (1.0 - cloud);
          col += vec3(1.0, 0.9, 0.74) * glint * 0.025;
          // city lights on the night side, warmed towards the page's gold
          vec3 lights = texture2D(nightMap, vUv).rgb;
          float night = 1.0 - smoothstep(-0.26, 0.04, NdL);
          col += lights * vec3(1.0, 0.94, 0.82) * 1.40 * nightMix;
          // blue haze towards the rim on the lit side
          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          col += vec3(0.24, 0.38, 0.49) * fres * 0.080;
          if (paper > 0.5) {
            // An atlas treatment of the same NASA land/water geography.
            col = mix(vec3(0.30, 0.37, 0.30), vec3(0.66, 0.63, 0.54), water);
            col *= 0.76 + 0.24 * max(dot(N, V), 0.0);
            col += vec3(0.025) * cloud;
          }
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });

    const clouds = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      transparent: true,
      depthWrite: false,
      fragmentShader: `
        uniform sampler2D cloudMap;
        uniform vec3 sunDir;
        uniform float cloudShift, cloudMix, paper;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          float NdL = dot(N, normalize(sunDir));
          float a = smoothstep(0.1, 0.92, texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r) * cloudMix;
          // warmer and dimmer where the sun is low, as at dusk
          float low = 1.0 - smoothstep(0.0, 0.35, NdL);
          vec3 col = vec3(0.65, 0.72, 0.76) * (0.009 + 0.05 * max(NdL, 0.0));
          // thin out at the very rim so the edge of the layer does not show
          a *= smoothstep(0.0, 0.28, dot(N, V));
          gl_FragColor = vec4(col, a * 0.32 * (1.0 - paper));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });

    // A halo outside the rim: brighter on the sunlit side, fading into space
    const halo = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        varying vec3 vNormalV;
        varying vec3 vNormalW;
        void main() {
          vNormalV = normalize(normalMatrix * normal);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 sunDir;
        uniform float glow, paper;
        varying vec3 vNormalV;
        varying vec3 vNormalW;
        void main() {
          // the far wall of the shell, seen just outside the rim: brightest by the
          // Earth's edge (where the view grazes most air), nothing at the shell's edge
          float t = -normalize(vNormalV).z;
          float i = pow(smoothstep(0.0, 0.56, t), 1.35);
          float lit = 0.16 + 0.84 * smoothstep(-0.45, 0.6, dot(normalize(vNormalW), normalize(sunDir)));
          // coloured light with its own alpha, so the stars behind still show through
          gl_FragColor = vec4(vec3(0.20, 0.29, 0.34), clamp(i * lit * 0.13 * glow * (1.0 - paper), 0.0, 1.0));
          #include <colorspace_fragment>
        }`,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });

    /* The model. The tilted axis stays put; inside it the Earth can be turned
       any way by hand (ball), and it also turns slowly on its own axis (spin). */
    const TILT = (23.44 * Math.PI) / 180;
    const seg = small ? 96 : 144;
    const world = new THREE.Group();        // leans a little towards the pointer, and lingers as the page scrolls
    scene.add(world);
    const axis = new THREE.Group();
    axis.rotation.z = TILT;
    world.add(axis);
    const ball = new THREE.Group();
    axis.add(ball);
    const spin = new THREE.Group();
    ball.add(spin);
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, seg, seg / 2), surface);
    spin.add(earth);
    const cloudShell = new THREE.Mesh(new THREE.SphereGeometry(1.012, seg, seg / 2), clouds);
    cloudShell.renderOrder = 2;
    spin.add(cloudShell);
    /* Quiet research connections, not transport routes or traffic volumes.
       Their endpoints come only from countries linked by published research.
       Depth testing lets the opaque Earth hide the far side of each arc. */
    const connections = new THREE.Group();
    spin.add(connections);
    const arcMaterial = new THREE.LineBasicMaterial({ transparent: true, depthTest: true, depthWrite: false, toneMapped: false });
    const pointMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthTest: true, depthWrite: false, toneMapped: false });
    const pointGeometry = new THREE.SphereGeometry(0.0035, 8, 6);
    function themeConnections() {
      const paper = uniforms.paper.value > 0.5;
      arcMaterial.color.set(paper ? '#536a57' : '#c6b38e');
      arcMaterial.opacity = paper ? 0.24 : 0.34;
      pointMaterial.color.copy(arcMaterial.color);
      pointMaterial.opacity = paper ? 0.46 : 0.68;
    }
    const geographicPoint = (c) => {
      const lat = c.lat * Math.PI / 180, lon = c.lon * Math.PI / 180;
      return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
    };
    const graph = window.LonghandGraph;
    const published = (window.Longhand?.publishedSorted() || []).filter((report) => !report.isLocal);
    const pairs = new Map();
    if (graph) published.forEach((report) => {
      const countries = graph.contextFor(report).countries;
      const primary = countries.filter((c) => c.role === 'primary');
      primary.forEach((from) => countries.forEach((to) => {
        if (from.id === to.id || ![from.lat, from.lon, to.lat, to.lon].every(Number.isFinite)) return;
        const key = [from.id, to.id].sort().join(':');
        if (pairs.has(key)) return;
        const start = geographicPoint(from), end = geographicPoint(to);
        const angle = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1));
        if (angle < 0.001 || angle > Math.PI - 0.001) return;
        pairs.set(key, { start, end, angle, key });
      }));
    });
    const endpoints = new Map();
    [...pairs.values()].sort((a, b) => b.angle - a.angle).slice(0, 7).forEach(({ start, end, angle, key }) => {
      const points = [], height = 0.12 + 0.22 * angle / Math.PI;
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const point = start.clone().multiplyScalar(Math.sin((1 - t) * angle)).addScaledVector(end, Math.sin(t * angle)).divideScalar(Math.sin(angle));
        points.push(point.normalize().multiplyScalar(1.015 + height * Math.sin(Math.PI * t)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), arcMaterial);
      line.renderOrder = 1; connections.add(line);
      key.split(':').forEach((id) => { if (!endpoints.has(id)) endpoints.set(id, geographicPoint(graph.country(id))); });
    });
    endpoints.forEach((point) => { const dot = new THREE.Mesh(pointGeometry, pointMaterial); dot.position.copy(point).multiplyScalar(1.015); dot.renderOrder = 1; connections.add(dot); });
    themeConnections();
    plate.dataset.researchArcs = String(connections.children.filter((child) => child.isLine).length);
    const haloShell = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 48), halo);
    haloShell.renderOrder = 3;
    world.add(haloShell);

    /* State. The camera never moves: only the Earth turns. */
    const AUTO = (Math.PI * 2) / TURN_SECONDS;
    const UPRIGHT = new THREE.Quaternion();
    const sunBase = new THREE.Vector3(-0.45, 0.3, -1).normalize();
    const lean = { x: 0, y: 0, tx: 0, ty: 0 };      // pointer lean, eased
    let scrollP = 0;                                 // 0 at the top of the page, 1 once the front page has scrolled away
    let playing = !reduceMotion.matches;
    let spinVel = 0;
    const omega = new THREE.Vector3();
    let dragging = false, moved = false, touch = false;
    let downX = 0, downY = 0, downT = 0, lastX = 0, lastY = 0, lastT = 0;
    let lastTouch = 0;
    let returning = false;
    let visible = true, raf = 0, last = 0, shown = false, dirty = true;
    let intro = reduceMotion.matches ? 1 : 0;       // the opening turn and bloom, 0 to 1
    let cloudTarget = 0, nightTarget = 0;
    document.addEventListener('longhand:theme', (e) => {
      uniforms.paper.value = e.detail.theme === 'light' ? 1 : 0;
      themeConnections();
      requestFrame();
    });
    let radiusPx = 100;
    let focused = false, focusTarget = null, focusId = '';
    let markers = [];
    const markerLayer = document.createElement('div');
    markerLayer.className = 'globe-markers';
    markerLayer.setAttribute('aria-label', 'Research locations');
    stage.after(markerLayer);
    const surfacePoint = (lat, lon) => {
      const p = lat * Math.PI / 180, l = lon * Math.PI / 180;
      return new THREE.Vector3(Math.cos(p) * Math.cos(l), Math.sin(p), -Math.cos(p) * Math.sin(l));
    };
    function setMarkers(items) {
      markerLayer.replaceChildren();
      markers = items.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon)).map((m) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'globe-marker';
        button.textContent = m.name; button.title = m.name + ' research';
        button.setAttribute('aria-label', 'Explore ' + m.name + ' research');
        button.addEventListener('click', () => document.dispatchEvent(new CustomEvent('longhand:globe-select', { detail: { id: m.id } })));
        markerLayer.append(button);
        return { ...m, button, point: surfacePoint(m.lat, m.lon) };
      });
      requestFrame();
    }
    function projectMarkers() {
      const bounds = stage.getBoundingClientRect(), parent = plate.getBoundingClientRect();
      markerLayer.style.left = (bounds.left - parent.left) + 'px';
      markerLayer.style.top = (bounds.top - parent.top) + 'px';
      markerLayer.style.width = bounds.width + 'px';
      markerLayer.style.height = bounds.height + 'px';
      const q = spin.getWorldQuaternion(new THREE.Quaternion());
      markers.forEach((m) => {
        const point = spin.localToWorld(m.point.clone().multiplyScalar(1.03));
        const normal = m.point.clone().applyQuaternion(q).normalize();
        m.button.hidden = normal.dot(camera.position.clone().sub(point).normalize()) < .1;
        const projected = point.project(camera);
        m.button.style.left = ((projected.x + 1) * bounds.width / 2) + 'px';
        m.button.style.top = ((1 - projected.y) * bounds.height / 2) + 'px';
        m.button.classList.toggle('is-selected', m.id === focusId);
        m.button.classList.toggle('is-muted', !!focusId && m.id !== focusId);
        m.button.setAttribute('aria-pressed', String(m.id === focusId));
      });
    }

    const camRight = new THREE.Vector3(1, 0, 0);
    const camUp = new THREE.Vector3(0, 1, 0);

    /* Framing: the Earth, with room for its halo, centred in the stage */
    function frame() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      radiusPx = Math.min(w, h) * RADIUS_SHARE;
      // distance at which a unit sphere spans radiusPx: sin(angular radius) = 1 / d
      const halfV = (camera.fov * Math.PI) / 360;
      const ang = Math.atan((radiusPx / (h / 2)) * Math.tan(halfV));
      const dist = 1 / Math.sin(ang);
      camera.position.set(0, 0, dist);
      camera.lookAt(0, 0, 0);
      camera.near = Math.max(0.05, dist - 2);
      camera.far = dist + 2;
      camera.updateProjectionMatrix();
      camRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
      camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      stage.style.setProperty('--earth-r', `${radiusPx}px`);
      dirty = true;
      requestFrame();
    }
    frame();

    // Open on the chosen meridian: turning the spin by a puts longitude L facing the reader
    const facing = (lon) => -Math.PI / 2 - (lon * Math.PI) / 180;
    spin.rotation.y = facing(START_LON);

    /* Turning by hand, about an axis in scene space, with the tilt taken out first */
    world.updateMatrixWorld(true);
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

    /* Back onto its axis: the part of the hand's turn that went round the axis
       is kept, so the side the reader turned to stays in front */
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

    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    const sun = new THREE.Vector3();
    const yAxis = new THREE.Vector3(0, 1, 0);

    function loop(now) {
      raf = 0;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      let busy = false;

      // opening: a short turn into place while the halo blooms
      if (intro < 1) {
        intro = Math.min(1, intro + dt / 1.6);
        busy = true;
      }
      const e = easeOut(intro);
      uniforms.glow.value = e;

      // the Earth's own slow turn, eased in and out
      const target = playing ? AUTO : 0;
      spinVel += (target - spinVel) * (1 - Math.exp(-dt * 1.2));
      if (!playing && Math.abs(spinVel) < 1e-4) spinVel = 0;
      if (spinVel) { spin.rotateY(spinVel * dt); busy = true; }
      const introTurn = (1 - e) * -0.7;

      // the clouds run a little ahead of the ground
      uniforms.cloudShift.value = (uniforms.cloudShift.value + (spinVel * dt / (Math.PI * 2)) * CLOUD_DRIFT) % 1;

      // textures that arrive late fade in rather than pop
      const fade = 1 - Math.exp(-dt * 2.5);
      if (uniforms.cloudMix.value < cloudTarget - 0.002) { uniforms.cloudMix.value += (cloudTarget - uniforms.cloudMix.value) * fade; busy = true; } else uniforms.cloudMix.value = cloudTarget;
      if (uniforms.nightMix.value < nightTarget - 0.002) { uniforms.nightMix.value += (nightTarget - uniforms.nightMix.value) * fade; busy = true; } else uniforms.nightMix.value = nightTarget;

      if (!dragging) {
        const w = omega.length();
        if (w > 1e-3) {
          turnBall(tv.copy(omega).divideScalar(w), w * dt);
          omega.multiplyScalar(Math.exp(-dt * 3.2));
          busy = true;
        } else if (w) {
          omega.set(0, 0, 0);
        }
        if (!focused && !returning && !omega.lengthSq() && now - lastTouch > RETURN_AFTER_MS && tilted()) settle();
        if (returning) {
          ball.quaternion.slerp(UPRIGHT, reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 1.8));
          if (!tilted()) { ball.quaternion.identity(); returning = false; }
          busy = true;
        }
      } else busy = true;

      if (focusTarget) {
        ball.quaternion.slerp(focusTarget, reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 7));
        if (ball.quaternion.angleTo(focusTarget) < .001) { ball.quaternion.copy(focusTarget); focusTarget = null; }
        busy = true;
      }
      // the pointer's lean, and the page's scroll
      lean.x += (lean.tx - lean.x) * (1 - Math.exp(-dt * 4));
      lean.y += (lean.ty - lean.y) * (1 - Math.exp(-dt * 4));
      if (Math.abs(lean.tx - lean.x) + Math.abs(lean.ty - lean.y) > 1e-4) busy = true;
      world.rotation.set(lean.y * 0.06, lean.x * 0.08 + introTurn, 0);
      world.position.y = -scrollP * 0.55;
      sun.copy(sunBase).applyAxisAngle(yAxis, (-scrollP * SUN_SWEEP * Math.PI) / 180);
      uniforms.sunDir.value.copy(sun);

      renderer.render(scene, camera);
      if (markers.length) projectMarkers();
      dirty = false;
      if (!shown) { shown = true; plate.classList.add('is-ready'); }
      if ((busy || playing || dirty) && visible && !document.hidden) raf = requestAnimationFrame(loop);
    }
    function requestFrame() {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    }

    /* Hand: drag to turn, click to stop or start. On touch screens a drag turns
       the Earth side to side only, so an upward swipe still scrolls the page. */
    const perPixel = () => (Math.PI * 1.1) / Math.max(260, radiusPx * 2.4);
    stage.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      focused = false; focusTarget = null;
      dragging = true;
      moved = false;
      touch = e.pointerType !== 'mouse';
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
      if (!dragging) {
        if (e.pointerType === 'mouse' && !reduceMotion.matches) {
          const r = stage.getBoundingClientRect();
          lean.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          lean.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
          requestFrame();
        }
        return;
      }
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
        moved = true;
        stage.classList.add('is-dragging');
      }
      if (!moved) return;
      const dx = e.clientX - lastX;
      const dy = touch ? 0 : e.clientY - lastY;
      const len = Math.hypot(dx, dy);
      if (len) {
        const angle = len * perPixel();
        const dt = Math.max(8, e.timeStamp - lastT) / 1000;
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
    stage.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') { lean.tx = 0; lean.ty = 0; requestFrame(); }
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
        omega.set(0, 0, 0);
      } else if (omega.length() > 7) {
        omega.setLength(7);
      }
      requestFrame();
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release);
    stage.addEventListener('dblclick', () => { if (tilted()) settle(); });

    /* Keyboard: arrows turn the Earth, Space or Enter stops and starts it, Home sets it straight */
    stage.addEventListener('keydown', (e) => {
      const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (dir) {
        focused = false; focusTarget = null;
        e.preventDefault();
        returning = false;
        tv.copy(camUp).multiplyScalar(dir[0]).addScaledVector(camRight, dir[1]).normalize();
        if (reduceMotion.matches) turnBall(tv, 0.3);
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

    // The button names the action available in its current state.
    function setPlaying(on) {
      playing = on;
      if (on) { focused = false; focusTarget = null; }
      document.dispatchEvent(new CustomEvent('longhand:globe-playing', { detail: { playing: on } }));
      stage.setAttribute('aria-label', on ? 'Pause the Earth turning' : 'Resume the Earth turning');
      stage.title = on ? 'Drag to turn the Earth any way. Click to stop it.' : 'Drag to turn the Earth any way. Click to set it turning again.';
      requestFrame();
    }
    window.LonghandEarth = {
      setMarkers,
      pause() { setPlaying(false); },
      toggle() { setPlaying(!playing); },
      reset() {
        focused = false; focusTarget = null; focusId = '';
        omega.set(0, 0, 0); ball.quaternion.identity(); spin.rotation.y = facing(START_LON);
        lean.x = lean.y = lean.tx = lean.ty = 0; returning = false;
        setPlaying(!reduceMotion.matches); requestFrame();
      },
      focus(location) {
        if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return;
        setPlaying(false); spinVel = 0; omega.set(0, 0, 0); returning = false;
        focused = true; focusId = location.id || ''; intro = 1;
        lean.x = lean.y = lean.tx = lean.ty = 0; world.rotation.set(0, 0, 0);
        world.updateMatrixWorld(true);
        const from = surfacePoint(location.lat, location.lon).applyQuaternion(spin.quaternion).normalize();
        const to = new THREE.Vector3(0, 0, 1).applyQuaternion(axis.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
        focusTarget = new THREE.Quaternion().setFromUnitVectors(from, to);
        if (reduceMotion.matches) { ball.quaternion.copy(focusTarget); focusTarget = null; }
        requestFrame();
      }
    };
    document.dispatchEvent(new CustomEvent('longhand:globe-ready'));
    setPlaying(playing);
    const onMotionPref = (ev) => {
      setPlaying(!ev.matches);
      if (ev.matches) { intro = 1; lean.tx = lean.ty = 0; scrollP = 0; }
      onScroll();
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPref);

    /* The page's scroll moves the sun on and lets the Earth linger */
    function onScroll() {
      if (!hero || reduceMotion.matches) { scrollP = 0; return; }
      const h = hero.offsetHeight || 1;
      const p = Math.max(0, Math.min(1, window.scrollY / (h * 0.9)));
      if (Math.abs(p - scrollP) > 1e-4) { scrollP = p; dirty = true; requestFrame(); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Only draw while the Earth is on screen and the tab is open */
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestFrame();
    }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) requestFrame(); });
    new ResizeObserver(frame).observe(stage);

    /* The rest of the imagery arrives after the first frame: the lights, the
       water mask for the sun's glint, the clouds, and a sharper day map */
    const loader = new THREE.TextureLoader();
    const later = (file, srgb) => loader.loadAsync(IMG + file).then((t) => prep(t, srgb));
    // The sharper day map comes in later on its own.
    requestAnimationFrame(() => {
      later('earth-night-2048.jpg', true).then((t) => { uniforms.nightMap.value = t; nightTarget = 1; }).catch(() => {}).then(requestFrame);
      later('earth-water-2048.png', false).then((t) => { uniforms.waterMap.value = t; }).catch(() => {}).then(requestFrame);
      later('earth-clouds-2048.jpg', false).then((t) => { uniforms.cloudMap.value = t; cloudTarget = 1; }).catch(() => {}).then(requestFrame);
      later(small ? 'earth-day-2048.jpg' : 'earth-day-4096.jpg', true).then((t) => {
        const old = uniforms.dayMap.value;
        uniforms.dayMap.value = t;
        old.dispose();
        requestFrame();
      }).catch(() => {});
    });
  }
})();
