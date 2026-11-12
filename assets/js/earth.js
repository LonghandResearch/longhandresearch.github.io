/* Longhand Research: the Earth on the front page and Coverage.
   A globe drawn with three.js in the manner of the front page's tree: flat
   colour, ink lines and lanterns, from NASA imagery (Blue Marble for the
   land, Black Marble for the towns at night, a water mask for the coasts and
   a cloud layer that drifts a little faster than the ground). It turns slowly on its
   tilted axis. The homepage uses a simple ambient turn. Coverage supports
   dragging, keyboard rotation and country selection. */
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

  async function loadEarth() {
    // Keep module evaluation, image decoding and GPU setup out of the flight.
    // Its painted frame remains visible until the arriving scene can take over.
    if (window.LONGHAND_GLOBE_FLIGHT) await window.LONGHAND_GLOBE_FLIGHT;
    const THREE = await import(`${CDN}three@0.184.0/build/three.module.min.js`);
    const loader = new THREE.TextureLoader();
    // The first visible frame already has city lights. Sharper imagery and
    // clouds can wait until navigation finishes without rebuilding the scene.
    const [day, night] = await Promise.all([
      loader.loadAsync(`${IMG}earth-day-1024.jpg`),
      loader.loadAsync(`${IMG}earth-night-2048.jpg`).catch(() => null)
    ]);
    build(THREE, day, night);
  }
  loadEarth().catch(unavailable);

  function build(THREE, dayLow, night) {
    /* Renderer and camera. The canvas is transparent: the sky behind it is the page's. */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.localClippingEnabled = true;
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
    if (night) prep(night, true);

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
      nightMap: { value: night || blank(0) },
      waterMap: { value: blank(0) },
      cloudMap: { value: blank(0) },
      sunDir: { value: new THREE.Vector3() },
      cloudShift: { value: 0 },
      cloudMix: { value: 0 },
      nightMix: { value: night ? 1 : 0 },
      glow: { value: 0 },
      ambience: { value: hero ? 1 : 0 },
      paper: { value: document.documentElement.dataset.theme === 'light' ? 1 : 0 },
      waterReady: { value: 0 },
      // The drawing's palette, set per theme by themeToon()
      landShade: { value: new THREE.Color() }, landMid: { value: new THREE.Color() }, landLight: { value: new THREE.Color() },
      seaShade: { value: new THREE.Color() }, seaMid: { value: new THREE.Color() }, seaLight: { value: new THREE.Color() },
      ink: { value: new THREE.Color() }, lamp: { value: new THREE.Color() }, lampMix: { value: 1 },
      cloudCol: { value: new THREE.Color() }, cloudAlpha: { value: 0.2 },
    };
    /* The Earth is drawn like the tree on the front page: flat colour in three
       bands of light, an ink line round the coasts and the rim, the night
       side's towns as small lanterns. Night for the dark theme, the
       afternoon hill's greens and paper for Warm paper. */
    const TOON = {
      dark: { landShade: '#0e2723', landMid: '#1d4237', landLight: '#2f6049', seaShade: '#061317', seaMid: '#0b2329', seaLight: '#143843', ink: '#010506', lamp: '#e2b764', lampMix: 0.95, cloudCol: '#c8cfbf', cloudAlpha: 0.1 },
      light: { landShade: '#5a7343', landMid: '#7f9a57', landLight: '#adc078', seaShade: '#93a998', seaMid: '#b3c4b3', seaLight: '#cfdac8', ink: '#1b201d', lamp: '#5b4a2c', lampMix: 0.55, cloudCol: '#fbf6e9', cloudAlpha: 0.5 },
    };
    function themeToon() {
      const p = TOON[uniforms.paper.value > 0.5 ? 'light' : 'dark'];
      for (const k of Object.keys(p)) {
        if (typeof p[k] === 'string') uniforms[k].value.set(p[k]); else uniforms[k].value = p[k];
      }
    }
    themeToon();

    const surface = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: `
        uniform sampler2D dayMap, nightMap, waterMap;
        uniform float nightMix, waterReady, lampMix;
        uniform vec3 landShade, landMid, landLight, seaShade, seaMid, seaLight, ink, lamp;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          // the light comes from the upper left of the reader, like the moon
          // and the sun in the drawing, so the disc always reads as a ball
          float NdL = dot(N, normalize(vec3(-0.55, 0.6, 0.85)));
          vec3 albedo = texture2D(dayMap, vUv).rgb;
          float lum = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
          // until the water mask arrives, the imagery's dark blue is the sea
          float guess = smoothstep(0.015, 0.08, albedo.b - albedo.r) * (1.0 - smoothstep(0.22, 0.4, lum));
          float water = mix(guess, texture2D(waterMap, vUv).r, waterReady);
          float sea = smoothstep(0.4, 0.6, water);
          // three flat bands of light, as in the tree's toon ramp
          float aa = fwidth(NdL) * 1.2;
          float b1 = smoothstep(-0.05 - aa, -0.05 + aa, NdL);
          float b2 = smoothstep(0.5 - aa, 0.5 + aa, NdL);
          vec3 land = mix(mix(landShade, landMid, b1), landLight, b2);
          // the imagery's relief, posterised to two steps, so the land is not empty
          land *= 0.93 + 0.12 * step(0.33, lum);
          vec3 water3 = mix(mix(seaShade, seaMid, b1), seaLight, b2);
          vec3 col = mix(land, water3, sea);
          // an ink line along every coast, the width of a pen stroke
          float coast = 1.0 - smoothstep(0.9, 2.0, abs(water - 0.5) / max(fwidth(water), 1e-4));
          col = mix(col, ink, coast * 0.95);
          // towns on the dark side as small lanterns
          float town = dot(texture2D(nightMap, vUv).rgb, vec3(0.2126, 0.7152, 0.0722));
          float lit = smoothstep(0.2, 0.5, town) * (1.0 - b1) * nightMix * (1.0 - sea);
          col = mix(col, lamp, lit * lampMix);
          // and the ink line round the ball
          float rim = 1.0 - smoothstep(0.13, 0.17, dot(N, V));
          col = mix(col, ink, rim);
          gl_FragColor = vec4(col, 1.0);
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
        uniform float cloudShift, cloudMix, cloudAlpha;
        uniform vec3 cloudCol;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          // clouds as flat cut-out shapes with a clean edge, drifting
          float c = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;
          float w = fwidth(c) * 1.5;
          float a = smoothstep(0.68 - w, 0.68 + w, c) * cloudMix;
          // kept inside the ink line round the ball
          a *= smoothstep(0.17, 0.24, dot(N, V));
          gl_FragColor = vec4(cloudCol, a * cloudAlpha);
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
        uniform float glow, paper, ambience;
        varying vec3 vNormalV;
        varying vec3 vNormalW;
        void main() {
          // the far wall of the shell, seen just outside the rim: brightest by the
          // Earth's edge (where the view grazes most air), nothing at the shell's edge
          float t = -normalize(vNormalV).z;
          float i = pow(smoothstep(0.0, 0.56, t), 1.35);
          float lit = 0.16 + 0.84 * smoothstep(-0.45, 0.6, dot(normalize(vNormalW), normalize(sunDir)));
          // coloured light with its own alpha, so the stars behind still show through
          vec3 rim = mix(vec3(0.20, 0.29, 0.34), vec3(0.50, 0.43, 0.26), paper);
          float strength = mix(0.13 + 0.10 * ambience, 0.035 * ambience + 0.065, paper);
          gl_FragColor = vec4(rim, clamp(i * lit * strength * glow, 0.0, 1.0));
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
    /* Selected substantive research connections, never a network of mentions.
       Co-primary geographies qualify directly. Material connections require
       an explicit, reviewed editorial selection as well as a graph relationship.
       The coal study identifies China and India as substantial export markets
       (assets/js/coal/data.js, BPS destination register). Context-only markets
       remain in the country list. These arcs do not encode trade volumes.
       Depth testing lets the opaque Earth hide the far side of each arc. */
    const connections = new THREE.Group();
    spin.add(connections);
    // Hide grazing fragments before they become isolated loops at the horizon.
    const clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.12)];
    const connectionStyle = { transparent: true, depthTest: true, depthWrite: false, toneMapped: false, clippingPlanes };
    const arcMaterial = new THREE.LineBasicMaterial(connectionStyle);
    const pointMaterial = new THREE.MeshBasicMaterial(connectionStyle);
    const travelMaterial = new THREE.MeshBasicMaterial(connectionStyle);
    const trailMaterial = new THREE.LineBasicMaterial(connectionStyle);
    const pointGeometry = new THREE.SphereGeometry(0.0035, 8, 6);
    const travellers = [];
    let connectionTime = 0;
    function themeConnections() {
      const paper = uniforms.paper.value > 0.5;
      // the research paths are drawn in the lantern's gold at night, in ink by day
      arcMaterial.color.set(paper ? '#1b201d' : '#e2b764');
      arcMaterial.opacity = paper ? 0.55 : 0.6;
      pointMaterial.color.copy(arcMaterial.color);
      pointMaterial.opacity = paper ? 0.85 : 0.9;
      travelMaterial.color.copy(arcMaterial.color); travelMaterial.opacity = paper ? 0.58 : 0.64;
      trailMaterial.color.copy(arcMaterial.color); trailMaterial.opacity = paper ? 0.3 : 0.36;
    }
    const geographicPoint = (c) => {
      const lat = c.lat * Math.PI / 180, lon = c.lon * Math.PI / 180;
      return new THREE.Vector3(Math.cos(lat) * Math.cos(lon), Math.sin(lat), -Math.cos(lat) * Math.sin(lon));
    };
    const graph = window.LonghandGraph;
    const published = (window.Longhand?.publishedSorted() || []).filter((report) => !report.isLocal);
    const materialSelections = new Map([
      ['coal-in-transition-2026-10-08', new Set(['CN:ID', 'ID:IN'])],
    ]);
    const pairs = new Map();
    if (graph) published.forEach((report) => {
      const countries = graph.contextFor(report).countries;
      const primary = countries.filter((c) => c.role === 'primary');
      primary.forEach((from) => countries.forEach((to) => {
        if (from.id === to.id || ![from.lat, from.lon, to.lat, to.lon].every(Number.isFinite)) return;
        const key = [from.id, to.id].sort().join(':');
        if (to.role !== 'primary' && !materialSelections.get(report.id)?.has(key)) return;
        if (pairs.has(key)) return;
        const start = geographicPoint(from), end = geographicPoint(to);
        const angle = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1));
        if (angle < 0.001 || angle > Math.PI - 0.001) return;
        pairs.set(key, { start, end, angle, key });
      }));
    });
    const endpoints = new Map();
    const visiblePairs = [...pairs.values()];
    visiblePairs.forEach(({ start, end, angle, key }) => {
      // Keep long connections close to the surface, so edge-on paths read as
      // geography rather than tall antennae. Endpoints remain above the clouds.
      const points = [], height = 0.022 + 0.055 * (1 - angle / Math.PI);
      for (let i = 0; i <= 64; i++) {
        const t = i / 64;
        const point = start.clone().multiplyScalar(Math.sin((1 - t) * angle)).addScaledVector(end, Math.sin(t * angle)).divideScalar(Math.sin(angle));
        points.push(point.normalize().multiplyScalar(1.015 + height * Math.sin(Math.PI * t)));
      }
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), arcMaterial);
      line.renderOrder = 1; connections.add(line);
      // A small moving accent carries no quantitative flow meaning. Reuse the
      // same geometry and the Earth's RAF; pause and reduced motion stop it.
      const head = new THREE.Mesh(pointGeometry, travelMaterial); head.scale.setScalar(1.35); head.renderOrder = 1;
      const trailGeometry = new THREE.BufferGeometry(); trailGeometry.setAttribute('position', line.geometry.attributes.position);
      trailGeometry.setDrawRange(0, 0);
      const trail = new THREE.Line(trailGeometry, trailMaterial); trail.renderOrder = 1;
      connections.add(head, trail);
      travellers.push({ points, head, trail, line, start, end, ids: key.split(':') });
      key.split(':').forEach((id) => { if (!endpoints.has(id)) endpoints.set(id, geographicPoint(graph.country(id))); });
    });
    const endpointDots = new Map();
    endpoints.forEach((point, id) => { const dot = new THREE.Mesh(pointGeometry, pointMaterial); dot.position.copy(point).multiplyScalar(1.015); dot.renderOrder = 1; connections.add(dot); endpointDots.set(id, dot); });
    themeConnections();
    plate.dataset.researchArcs = String(travellers.length);
    plate.dataset.researchLinks = visiblePairs.map((p) => p.key).join(',');
    let connectionCountry = '';
    function selectConnections(id) {
      connectionCountry = id;
      const activeEndpoints = new Set();
      travellers.forEach((t) => {
        t.line.visible = !id || t.ids.includes(id);
        if (t.line.visible) t.ids.forEach((endpoint) => activeEndpoints.add(endpoint));
      });
      endpointDots.forEach((dot, endpoint) => { dot.visible = activeEndpoints.has(endpoint); });
      plate.dataset.activeResearchArcs = String(travellers.filter((t) => t.line.visible).length);
      moveConnections(0, false);
    }
    function moveConnections(dt, moving) {
      if (moving) connectionTime += dt;
      travellers.forEach(({ points, head, trail, ids }, i) => {
        head.visible = trail.visible = !reduceMotion.matches && (!connectionCountry || ids.includes(connectionCountry));
        const progress = (connectionTime / (13 + i * 0.9) + i / travellers.length) % 1;
        const position = progress * (points.length - 1), start = Math.floor(position);
        head.position.copy(points[start]).lerp(points[Math.min(start + 1, points.length - 1)], position - start);
        trail.geometry.setDrawRange(Math.max(0, start - 3), Math.min(4, start + 1));
      });
    }
    selectConnections('');
    const haloShell = new THREE.Mesh(new THREE.SphereGeometry(1.2, 96, 48), halo);
    haloShell.renderOrder = 3;
    // a drawing has no atmosphere: the ink line round the ball is its edge
    haloShell.visible = false;
    world.add(haloShell);

    /* State. The camera never moves: only the Earth turns. */
    const AUTO = (Math.PI * 2) / TURN_SECONDS;
    const UPRIGHT = new THREE.Quaternion();
    const sunBase = new THREE.Vector3(-0.45, 0.3, -1).normalize();
    const lean = { x: 0, y: 0, tx: 0, ty: 0 };      // pointer lean, eased
    let playing = !reduceMotion.matches;
    let lastReduced = reduceMotion.matches;
    let spinVel = 0;
    const omega = new THREE.Vector3();
    let dragging = false, moved = false, touch = false;
    let downX = 0, downY = 0, downT = 0, lastX = 0, lastY = 0, lastT = 0;
    let lastTouch = 0;
    let returning = false;
    let visible = true, raf = 0, last = 0, shown = false, dirty = true;
    let navigationHeld = false;
    let intro = hero || document.body.classList.contains('v2-page') || reduceMotion.matches ? 1 : 0;
    let cloudTarget = 0, nightTarget = night ? 1 : 0;
    document.addEventListener('longhand:theme', (e) => {
      uniforms.paper.value = e.detail.theme === 'light' ? 1 : 0;
      themeToon();
      themeConnections();
      requestFrame();
    });
    let radiusPx = 100;
    let focused = false, focusTarget = null, focusId = '';
    let markers = [];
    const markerLayer = document.createElement('div');
    markerLayer.className = 'globe-markers';
    if (hero) markerLayer.setAttribute('aria-hidden', 'true');
    else {
      markerLayer.setAttribute('role', 'group');
      markerLayer.setAttribute('aria-label', 'Research locations');
    }
    stage.after(markerLayer);
    const surfacePoint = (lat, lon) => {
      const p = lat * Math.PI / 180, l = lon * Math.PI / 180;
      return new THREE.Vector3(Math.cos(p) * Math.cos(l), Math.sin(p), -Math.cos(p) * Math.sin(l));
    };
    function setMarkers(items) {
      const previous = new Map(markers.map((m) => [m.id, m.button]));
      markers = items.filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon)).map((m) => {
        const button = previous.get(m.id) || document.createElement('button');
        button.type = 'button'; button.className = 'globe-marker';
        button.dataset.countryId = m.id;
        const count = graph?.countryCoverage(m.id).primary.length || 0;
        button.replaceChildren();
        const name = document.createElement('span'); name.className = 'globe-marker-name'; name.textContent = m.name;
        const total = document.createElement('span'); total.className = 'globe-marker-count'; total.textContent = count ? `${count} ${count === 1 ? 'report' : 'reports'}` : 'Trade context';
        button.append(name, total); button.title = count ? m.name + ' research' : m.name + ' in coal trade research';
        button.dataset.geographyRole = count ? 'primary' : 'context';
        button.setAttribute('aria-label', count ? `Explore ${m.name}, ${count} ${count === 1 ? 'report' : 'reports'} on this market` : `Explore ${m.name} as trade context, no report focuses on this market`);
        if (!previous.has(m.id)) {
          button.addEventListener('click', () => document.dispatchEvent(new CustomEvent('longhand:globe-select', { detail: { id: m.id } })));
          // Reveal a secondary label on demand without keeping an idle RAF alive.
          ['pointerenter', 'pointerleave', 'focus', 'blur'].forEach((event) => button.addEventListener(event, requestFrame));
          markerLayer.append(button);
        }
        return { ...m, button, point: surfacePoint(m.lat, m.lon) };
      });
      const retained = new Set(markers.map((m) => m.id));
      previous.forEach((button, id) => { if (!retained.has(id)) button.remove(); });
      requestFrame();
    }
    function projectMarkers() {
      const bounds = stage.getBoundingClientRect(), parent = plate.getBoundingClientRect();
      markerLayer.style.left = (bounds.left - parent.left) + 'px';
      markerLayer.style.top = (bounds.top - parent.top) + 'px';
      markerLayer.style.width = bounds.width + 'px';
      markerLayer.style.height = bounds.height + 'px';
      const q = spin.getWorldQuaternion(new THREE.Quaternion());
      const occupied = [];
      const overlaps = (box) => occupied.some((other) => box.left < other.right + 4 && box.right > other.left - 4 && box.top < other.bottom + 4 && box.bottom > other.top - 4);
      /* Keep the selected location readable first. Additional endpoints can
         use the other side of their point or collapse when space is scarce. */
      [...markers].sort((a, b) => Number(b.id === focusId) - Number(a.id === focusId)).forEach((m) => {
        m.button.classList.toggle('is-selected', m.id === focusId);
        m.button.classList.toggle('is-muted', !!focusId && m.id !== focusId);
        m.button.setAttribute('aria-pressed', String(m.id === focusId));
        const point = spin.localToWorld(m.point.clone().multiplyScalar(1.03));
        const normal = m.point.clone().applyQuaternion(q).normalize();
        m.button.hidden = normal.dot(camera.position.clone().sub(point).normalize()) < .1;
        if (m.button.hidden) return;
        const projected = point.project(camera);
        const x = (projected.x + 1) * bounds.width / 2, y = (1 - projected.y) * bounds.height / 2;
        m.button.classList.remove('is-crowded');
        const boxFor = (align) => {
          const w = m.button.offsetWidth, h = m.button.offsetHeight;
          const left = align === 'left' ? x - w + 6 : x - 6;
          return { left, right: left + w, top: y - h / 2, bottom: y + h / 2 };
        };
        const fits = (box) => box.left >= 0 && box.right <= bounds.width && !overlaps(box);
        let align = x + m.button.offsetWidth > bounds.width - 8 ? 'left' : 'right';
        let box = boxFor(align);
        if (!fits(box)) {
          const opposite = align === 'left' ? 'right' : 'left';
          if (fits(boxFor(opposite))) { align = opposite; box = boxFor(align); }
          else if (m.id !== focusId && !m.button.matches(':hover, :focus-visible')) {
            m.button.classList.add('is-crowded');
            box = boxFor(align);
            if (!fits(box) && fits(boxFor(opposite))) { align = opposite; box = boxFor(align); }
            // The country selector and connection shortcuts remain available.
            if (!fits(box)) { m.button.hidden = true; return; }
          }
        }
        occupied.push(box);
        m.button.dataset.align = align;
        m.button.style.left = x + 'px';
        m.button.style.top = y + 'px';
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

    function loop(now) {
      raf = 0;
      // Reconcile while drawing as well: media changes can be deferred while
      // the page is busy or hidden. No extra timer is needed.
      if (lastReduced !== reduceMotion.matches) onMotionPref(reduceMotion);
      const dt = navigationHeld ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      let busy = false;

      // opening: a short turn into place while the halo blooms
      if (intro < 1) {
        intro = Math.min(1, intro + dt / 1.6);
        busy = true;
      }
      const e = easeOut(intro);
      uniforms.glow.value = e;
      moveConnections(dt, playing && !reduceMotion.matches);

      // the Earth's own slow turn, eased in and out
      const target = playing ? AUTO : 0;
      spinVel += (target - spinVel) * (1 - Math.exp(-dt * 1.2));
      if (!playing && Math.abs(spinVel) < 1e-4) spinVel = 0;
      if (spinVel) { spin.rotateY(spinVel * dt); busy = true; }
      const introTurn = (1 - e) * -0.7;

      // the clouds run a little ahead of the ground
      uniforms.cloudShift.value = (uniforms.cloudShift.value + (spinVel * dt / (Math.PI * 2)) * CLOUD_DRIFT) % 1;

      // textures that arrive late fade in rather than pop
      const fade = reduceMotion.matches ? 1 : 1 - Math.exp(-dt * 2.5);
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
      // A small pointer response is confined to the interactive Coverage globe.
      lean.x += (lean.tx - lean.x) * (1 - Math.exp(-dt * 4));
      lean.y += (lean.ty - lean.y) * (1 - Math.exp(-dt * 4));
      if (Math.abs(lean.tx - lean.x) + Math.abs(lean.ty - lean.y) > 1e-4) busy = true;
      world.rotation.set(hero ? 0 : lean.y * 0.06, hero ? 0 : lean.x * 0.08 + introTurn, 0);
      world.position.y = 0;
      sun.copy(sunBase);
      uniforms.sunDir.value.copy(sun);

      // A connection enters the view only when both geographic ends are on
      // the readable hemisphere. This avoids stray lines to hidden countries.
      world.updateMatrixWorld(true);
      let visibleArcs = 0;
      travellers.forEach((t) => {
        const onFront = [t.start, t.end].every((endpoint) => {
          const point = spin.localToWorld(endpoint.clone());
          return point.clone().normalize().dot(camera.position.clone().sub(point).normalize()) > 0.15;
        });
        t.line.visible = onFront && (!connectionCountry || t.ids.includes(connectionCountry));
        t.head.visible = t.trail.visible = t.line.visible && !reduceMotion.matches;
        if (t.line.visible) visibleArcs++;
      });
      plate.dataset.visibleResearchArcs = String(visibleArcs);
      renderer.render(scene, camera);
      if (markers.length) projectMarkers();
      dirty = false;
      if (!shown) {
        shown = true; plate.classList.add('is-ready');
        document.dispatchEvent(new CustomEvent('longhand:globe-rendered'));
      }
      if (!raf && !navigationHeld && (busy || playing || dirty) && visible && !document.hidden) raf = requestAnimationFrame(loop);
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
      if (hero) return;
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
      if (hero) return;
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
    stage.addEventListener('dblclick', () => { if (!hero && tilted()) settle(); });

    /* Keyboard: arrows turn the Earth, Space or Enter stops and starts it, Home sets it straight */
    stage.addEventListener('keydown', (e) => {
      if (hero) return;
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
      if (!hero) {
        stage.setAttribute('aria-label', on ? 'Pause the Earth turning' : 'Resume the Earth turning');
        stage.title = on ? 'Drag to turn the Earth any way. Click to stop it.' : 'Drag to turn the Earth any way. Click to set it turning again.';
      }
      requestFrame();
    }
    function holdNavigation(pose) {
      navigationHeld = true;
      cancelAnimationFrame(raf); raf = 0;
      if (pose) {
        omega.set(0, 0, 0); returning = false; focusTarget = null; intro = 1;
        lean.x = lean.y = lean.tx = lean.ty = 0; world.rotation.set(0, 0, 0);
        spin.quaternion.fromArray(pose.spin);
        world.updateMatrixWorld(true);
        // Reconstruct the same world-space surface pose, including any hand turn.
        ball.quaternion.copy(axis.getWorldQuaternion(new THREE.Quaternion()).invert())
          .multiply(new THREE.Quaternion().fromArray(pose.world))
          .multiply(spin.quaternion.clone().invert()).normalize();
        uniforms.cloudShift.value = pose.cloudShift;
        connectionTime = pose.connectionTime;
        focused = true; // Do not settle the carried pose during the handoff.
      }
      loop(performance.now());
    }
    function captureNavigationFrame() {
      if (!shown) return null;
      renderer.render(scene, camera);
      const picture = document.createElement('canvas');
      picture.width = picture.height = small ? 512 : 768;
      const crop = radiusPx * 2.34 * renderer.getPixelRatio();
      picture.getContext('2d').drawImage(canvas,
        (canvas.width - crop) / 2, (canvas.height - crop) / 2, crop, crop,
        0, 0, picture.width, picture.height);
      return { picture, pose: {
        world: spin.getWorldQuaternion(new THREE.Quaternion()).toArray(),
        spin: spin.quaternion.toArray(), cloudShift: uniforms.cloudShift.value,
        connectionTime
      } };
    }
    window.LonghandEarth = {
      setMarkers,
      holdNavigation,
      captureNavigationFrame,
      releaseNavigation() {
        navigationHeld = false; last = performance.now();
        if (hero) setPlaying(!reduceMotion.matches); else requestFrame();
        document.dispatchEvent(new CustomEvent('longhand:globe-navigation-end'));
      },
      pause() { setPlaying(false); },
      toggle() { setPlaying(!playing); },
      reset() {
        focused = false; focusTarget = null; focusId = '';
        selectConnections('');
        omega.set(0, 0, 0); ball.quaternion.identity(); spin.rotation.y = facing(START_LON);
        lean.x = lean.y = lean.tx = lean.ty = 0; returning = false;
        setPlaying(!reduceMotion.matches); requestFrame();
      },
      focus(location) {
        if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return;
        setPlaying(false); spinVel = 0; omega.set(0, 0, 0); returning = false;
        focused = true; focusId = location.id || ''; intro = 1;
        selectConnections(focusId);
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
      lastReduced = ev.matches;
      setPlaying(!ev.matches);
      if (ev.matches) {
        intro = 1; spinVel = 0; omega.set(0, 0, 0);
        lean.x = lean.y = lean.tx = lean.ty = 0;
      }
    };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionPref);
    if (window.LONGHAND_GLOBE_HANDOFF) holdNavigation(window.LONGHAND_GLOBE_HANDOFF);

    /* Only draw while the Earth is on screen and the tab is open */
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) requestFrame();
    }).observe(stage);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) requestFrame(); });
    new ResizeObserver(frame).observe(stage);

    /* Defer optional texture uploads until the page entrance is finished.
       Navigation does not wait for a large day map or the cloud layer. */
    const loader = new THREE.TextureLoader();
    const later = (file, srgb) => loader.loadAsync(IMG + file).then((t) => prep(t, srgb));
    // The sharper day map comes in later on its own.
    const refine = () => {
      later('earth-water-2048.png', false).then((t) => { uniforms.waterMap.value = t; uniforms.waterReady.value = 1; }).catch(() => {}).then(requestFrame);
      later('earth-clouds-2048.jpg', false).then((t) => { uniforms.cloudMap.value = t; cloudTarget = 1; }).catch(() => {}).then(requestFrame);
      later(small ? 'earth-day-2048.jpg' : 'earth-day-4096.jpg', true).then((t) => {
        const old = uniforms.dayMap.value;
        uniforms.dayMap.value = t;
        old.dispose();
        requestFrame();
      }).catch(() => {});
    };
    requestAnimationFrame(() => {
      const vt = window.LONGHAND_VT;
      if (vt) vt.finished.then(refine, refine); else refine();
    });
  }
})();
