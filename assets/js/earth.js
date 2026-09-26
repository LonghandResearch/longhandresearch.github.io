/* Longhand Research: the Earth on the front page.
   A photographic globe drawn with three.js from NASA imagery: Blue Marble for
   the day side, Black Marble for the lights of the night side, and a cloud
   layer that drifts a little faster than the ground. It turns slowly on its
   tilted axis. Drag it to turn it any way; click it, or press Space, to stop
   it; double-click or press Home to set it straight. As the page scrolls, the
   sun moves on and the cities come up out of the dark. The markets the
   catalogue covers are marked in gold. */
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
  const RADIUS_SHARE = 0.36;       // the Earth's radius as a share of the stage's shorter side

  // Where each exchange in the catalogue sits on the map: [city, latitude, longitude]
  const MARKETS = {
    IDX: ['Jakarta', -6.18, 106.83], NYSE: ['New York', 40.71, -74.01], NASDAQ: ['New York', 40.76, -73.98],
    LSE: ['London', 51.51, -0.09], HKEX: ['Hong Kong', 22.28, 114.16], SGX: ['Singapore', 1.28, 103.85],
    TSE: ['Tokyo', 35.68, 139.77], SSE: ['Shanghai', 31.23, 121.47], SZSE: ['Shenzhen', 22.54, 114.06],
    KRX: ['Seoul', 37.52, 126.93], TWSE: ['Taipei', 25.03, 121.56], ASX: ['Sydney', -33.87, 151.21],
    NSE: ['Mumbai', 19.06, 72.86], BSE: ['Mumbai', 18.93, 72.83], Bursa: ['Kuala Lumpur', 3.15, 101.69],
    SET: ['Bangkok', 13.76, 100.56], PSE: ['Manila', 14.55, 121.05], Euronext: ['Amsterdam', 52.37, 4.9],
    XETRA: ['Frankfurt', 50.11, 8.68], SIX: ['Zurich', 47.37, 8.54], TSX: ['Toronto', 43.65, -79.38],
  };

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

  /* The markets that published reports are listed on, with how many reports each */
  function marketsInCatalogue() {
    const LH = window.Longhand;
    const list = LH && LH.publishedSorted ? LH.publishedSorted() : (window.LONGHAND_REPORTS || []);
    const out = new Map();
    list.forEach((r) => {
      const m = MARKETS[r.exchange];
      if (!m) return;
      const key = m[0];
      const cur = out.get(key) || { city: m[0], lat: m[1], lon: m[2], codes: new Set(), n: 0 };
      cur.codes.add(r.exchange);
      cur.n += 1;
      out.set(key, cur);
    });
    return [...out.values()];
  }

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
    };

    const surface = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: `
        uniform sampler2D dayMap, nightMap, waterMap, cloudMap;
        uniform vec3 sunDir;
        uniform float cloudShift, cloudMix, nightMix;
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
          vec3 col = albedo * (0.028 + 1.06 * max(NdL, 0.0)) * (1.0 - 0.38 * cloud);
          // the sun's glint on open water
          float water = texture2D(waterMap, vUv).r;
          vec3 H = normalize(L + V);
          float glint = pow(max(dot(N, H), 0.0), 140.0) * water * day * (1.0 - cloud);
          col += vec3(1.0, 0.9, 0.74) * glint * 0.22;
          // city lights on the night side, warmed towards the page's gold
          vec3 lights = texture2D(nightMap, vUv).rgb;
          float night = 1.0 - smoothstep(-0.26, 0.04, NdL);
          col += lights * vec3(1.0, 0.76, 0.42) * 1.9 * night * nightMix * (1.0 - 0.65 * cloud);
          // blue haze towards the rim on the lit side
          float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
          col += vec3(0.28, 0.52, 1.0) * fres * 0.6 * smoothstep(-0.25, 0.5, NdL);
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
        uniform float cloudShift, cloudMix;
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
          vec3 col = mix(vec3(1.0), vec3(1.0, 0.78, 0.6), low) * (0.02 + 0.94 * max(NdL, 0.0));
          // thin out at the very rim so the edge of the layer does not show
          a *= smoothstep(0.0, 0.28, dot(N, V));
          gl_FragColor = vec4(col, a * 0.9);
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
        uniform float glow;
        varying vec3 vNormalV;
        varying vec3 vNormalW;
        void main() {
          // the far wall of the shell, seen just outside the rim: brightest by the
          // Earth's edge (where the view grazes most air), nothing at the shell's edge
          float t = -normalize(vNormalV).z;
          float i = pow(smoothstep(0.0, 0.56, t), 1.35);
          float lit = 0.16 + 0.84 * smoothstep(-0.45, 0.6, dot(normalize(vNormalW), normalize(sunDir)));
          // coloured light with its own alpha, so the stars behind still show through
          gl_FragColor = vec4(vec3(0.36, 0.62, 1.0), clamp(i * lit * 1.05 * glow, 0.0, 1.0));
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
    const haloShell = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 48), halo);
    haloShell.renderOrder = 3;
    world.add(haloShell);

    /* A point on the sphere for a latitude and longitude, matching the map's layout */
    const onSphere = (lat, lon, r) => {
      const phi = ((lon + 180) / 360) * Math.PI * 2;
      const theta = ((90 - lat) / 180) * Math.PI;
      return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(r);
    };

    /* Markets in the catalogue: a gold point with a fine ring, and a label that follows it */
    const GOLD = new THREE.Color(0xdbb574);
    const pins = marketsInCatalogue().map((m) => {
      const g = new THREE.Group();
      const dir = onSphere(m.lat, m.lon, 1);
      g.position.copy(dir).multiplyScalar(1.003);
      g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
      const dot = new THREE.Mesh(new THREE.CircleGeometry(0.011, 24), new THREE.MeshBasicMaterial({ color: GOLD, toneMapped: false }));
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.024, 48), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.75, toneMapped: false }));
      dot.renderOrder = ring.renderOrder = 4;   // drawn over the clouds, which do not write depth
      g.add(dot, ring);
      spin.add(g);
      const label = document.createElement('p');
      label.className = 'earth-pin';
      label.setAttribute('aria-hidden', 'true');
      label.innerHTML = `<span class="earth-pin-city"></span><span class="earth-pin-meta"></span>`;
      label.firstChild.textContent = m.city;
      label.lastChild.textContent = `${[...m.codes].join(', ')} · ${m.n} ${m.n === 1 ? 'report' : 'reports'}`;
      stage.appendChild(label);
      return { m, g, dir, label, seen: -1 };
    });

    /* State. The camera never moves: only the Earth turns. */
    const AUTO = (Math.PI * 2) / TURN_SECONDS;
    const UPRIGHT = new THREE.Quaternion();
    const sunBase = new THREE.Vector3(-0.78, 0.34, 0.62).normalize();
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
    let radiusPx = 100;

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

    /* Labels follow their pins and fade as they turn away */
    const pv = new THREE.Vector3();
    const nv = new THREE.Vector3();
    const toCam = new THREE.Vector3();
    function placePins() {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      pins.forEach((p) => {
        p.g.getWorldPosition(pv);
        nv.copy(pv).sub(world.position).normalize();
        toCam.copy(camera.position).sub(pv).normalize();
        const facingAmt = nv.dot(toCam);
        const a = Math.max(0, Math.min(1, (facingAmt - 0.18) / 0.22)) * intro;
        const q = Math.round(a * 20) / 20;
        if (q !== p.seen) { p.label.style.opacity = String(q); p.seen = q; }
        if (q > 0) {
          pv.project(camera);
          p.label.style.transform = `translate3d(${((pv.x + 1) / 2) * w}px, ${((1 - pv.y) / 2) * h}px, 0)`;
        }
      });
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
        if (!returning && !omega.lengthSq() && now - lastTouch > RETURN_AFTER_MS && tilted()) settle();
        if (returning) {
          ball.quaternion.slerp(UPRIGHT, reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 1.8));
          if (!tilted()) { ball.quaternion.identity(); returning = false; }
          busy = true;
        }
      } else busy = true;

      // the pointer's lean, and the page's scroll
      lean.x += (lean.tx - lean.x) * (1 - Math.exp(-dt * 4));
      lean.y += (lean.ty - lean.y) * (1 - Math.exp(-dt * 4));
      if (Math.abs(lean.tx - lean.x) + Math.abs(lean.ty - lean.y) > 1e-4) busy = true;
      world.rotation.set(lean.y * 0.06, lean.x * 0.08 + introTurn, 0);
      world.position.y = -scrollP * 0.55;
      sun.copy(sunBase).applyAxisAngle(yAxis, (-scrollP * SUN_SWEEP * Math.PI) / 180);
      uniforms.sunDir.value.copy(sun);

      renderer.render(scene, camera);
      placePins();
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
        hero && hero.classList.add('has-turned');
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
        e.preventDefault();
        returning = false;
        hero && hero.classList.add('has-turned');
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

    // A toggle button: "Stop the Earth turning", pressed while it is stopped
    function setPlaying(on) {
      playing = on;
      stage.setAttribute('aria-pressed', String(!on));
      stage.title = on ? 'Drag to turn the Earth any way. Click to stop it.' : 'Drag to turn the Earth any way. Click to set it turning again.';
      requestFrame();
    }
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
    requestAnimationFrame(() => {
      later('earth-night-2048.jpg', true).then((t) => { uniforms.nightMap.value = t; nightTarget = 1; requestFrame(); }).catch(() => {});
      later('earth-water-2048.png', false).then((t) => { uniforms.waterMap.value = t; requestFrame(); }).catch(() => {});
      later('earth-clouds-2048.jpg', false).then((t) => { uniforms.cloudMap.value = t; cloudTarget = 1; requestFrame(); }).catch(() => {});
      later(small ? 'earth-day-2048.jpg' : 'earth-day-4096.jpg', true).then((t) => {
        const old = uniforms.dayMap.value;
        uniforms.dayMap.value = t;
        old.dispose();
        requestFrame();
      }).catch(() => {});
    });
  }
})();
