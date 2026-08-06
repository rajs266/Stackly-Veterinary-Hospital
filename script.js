

(function initPreloader() {
  const el = document.getElementById('site-preloader');
  if (!el) return;

  const MAX_MS = 2000;
  const MIN_MS = 500;
  const started = performance.now();
  let done = false;

  document.documentElement.classList.add('is-preloading');

  function hide() {
    if (done) return;
    done = true;
    el.classList.add('is-done');
    el.setAttribute('aria-busy', 'false');
    document.documentElement.classList.remove('is-preloading');
    window.setTimeout(() => el.remove(), 420);
  }

  function finishSoon() {
    const elapsed = performance.now() - started;
    const wait = Math.max(0, MIN_MS - elapsed);
    window.setTimeout(hide, wait);
  }

  window.setTimeout(hide, MAX_MS);

  if (document.readyState === 'complete') finishSoon();
  else window.addEventListener('load', finishSoon, { once: true });
})();


(function initCursor() {
  if (window.matchMedia('(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });

  let dpr = window.devicePixelRatio || 1;
  let width, height;
  let rect = { left: 0, top: 0 };

  function updateCanvasSize() {
    dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rect = canvas.getBoundingClientRect();
  }

  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize, { passive: true });
  window.addEventListener('scroll', updateCanvasSize, { passive: true });

  const mouse = { x: width / 2, y: height / 2, px: width / 2, py: height / 2 };
  const particles = [];
  const colors = ['#e06d53', '#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#ffffff'];

  class Particle {
    constructor(x, y, vx, vy, color, size, life) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.size = size;
      this.life = life;
      this.maxLife = life;
      this.alpha = 1;
      this.rotation = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.size *= 0.95;
      this.alpha = this.life / this.maxLife;
      this.life--;
    }

    draw(c) {
      c.save();
      c.globalAlpha = Math.max(0, this.alpha);
      c.fillStyle = this.color;
      c.translate(this.x, this.y);
      c.rotate(this.rotation);
      c.beginPath();
      c.arc(0, 0, Math.max(0.4, this.size), 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    const dx = mouse.x - mouse.px;
    const dy = mouse.y - mouse.py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 3 && particles.length < 48) {
      const count = Math.min(3, Math.ceil(dist / 7));
      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(
          mouse.x, mouse.y,
          (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * 1.2,
          color, Math.random() * 3.5 + 1.5, Math.random() * 22 + 12
        ));
      }
    }
  }, { passive: true });

  window.addEventListener('click', (e) => {
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = Math.random() * 3.5 + 1.5;
      particles.push(new Particle(
        e.clientX, e.clientY,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        Math.random() * 4 + 2, 30
      ));
    }
  }, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0 || p.size <= 0.2) particles.splice(i, 1);
    }

    // Precise Cursor Tip Radial Glow locked directly onto pointer tip
    ctx.save();
    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 11);
    grad.addColorStop(0, 'rgba(244, 162, 97, 0.95)');
    grad.addColorStop(0.5, 'rgba(224, 109, 83, 0.45)');
    grad.addColorStop(1, 'rgba(224, 109, 83, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(animate);
  }

  animate();
})();


(function initAquarium() {
  const container = document.querySelector('.hero-section');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  const rippleCanvas = document.createElement('canvas');
  rippleCanvas.id = 'hero-ripple-canvas';
  Object.assign(rippleCanvas.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%', zIndex: '0', pointerEvents: 'none'
  });

  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.id = 'hero-aquarium-canvas';
  Object.assign(overlayCanvas.style, {
    position: 'absolute', top: '0', left: '0',
    width: '100%', height: '100%', zIndex: '1', pointerEvents: 'none'
  });

  container.insertBefore(rippleCanvas, container.firstChild);
  container.insertBefore(overlayCanvas, rippleCanvas.nextSibling);

  const ctx = overlayCanvas.getContext('2d', { alpha: true });
  let width = container.offsetWidth;
  let height = container.offsetHeight;

  const bgImg = new Image();
  bgImg.decoding = 'async';
  bgImg.src = 'assets/hero-aquarium11.webp';
  let bgLoaded = false;
  bgImg.onload = () => { bgLoaded = true; };
  if (bgImg.complete && bgImg.naturalWidth > 0) bgLoaded = true;

  // Facing based on sprite art: true = image faces left
  const fishDefs = [
    { src: 'assets/fish_4.webp', facesLeft: true },
    { src: 'assets/fish_5.webp', facesLeft: true },
    { src: 'assets/fish_6.webp', facesLeft: true },
    { src: 'assets/fish_blue_tang.webp', facesLeft: true },
    { src: 'assets/fish_clownfish.webp', facesLeft: true },
    { src: 'assets/fish_discus_red.webp', facesLeft: true },
    { src: 'assets/fish_green_tang.webp', facesLeft: true },
    { src: 'assets/fish_purple_tang.webp', facesLeft: true },
    { src: 'assets/fish_yellow_tang.webp', facesLeft: true }
  ];

  const colorfulSpawnOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const loadedFishData = new Array(fishDefs.length);

  fishDefs.forEach((def, index) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = def.src;
    const finish = () => {
      if (img.naturalWidth > 0) {
        loadedFishData[index] = {
          img,
          facesLeft: def.facesLeft,
          src: def.src
        };
      }
    };
    if (img.complete && img.naturalWidth > 0) finish();
    else {
      img.onload = finish;
    }
  });

  const mouse = {
    x: -1000, y: -1000, lastX: -1000, lastY: -1000, active: false, speed: 0
  };


  let gl = null;
  let isWebGLFallback = false;
  let shaderProgram = null;
  let bgTexture = null;
  let heightmapTexture = null;
  let uImageLocation = null;
  let uHeightmapLocation = null;

  const GRID = 96;
  const bufferSize = GRID * GRID;
  let buffer1 = new Float32Array(bufferSize);
  let buffer2 = new Float32Array(bufferSize);
  const heightmapData = new Uint8Array(bufferSize);
  const damping = 0.965;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initWebGL() {
    gl = rippleCanvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' })
      || rippleCanvas.getContext('experimental-webgl', { alpha: false, antialias: false });

    if (!gl) {
      isWebGLFallback = true;
      rippleCanvas.style.display = 'none';
      return;
    }

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        v_texCoord.y = 1.0 - v_texCoord.y;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform sampler2D u_heightmap;

      void main() {
        float texel = 1.0 / 96.0;
        float hL = texture2D(u_heightmap, v_texCoord + vec2(-texel, 0.0)).r;
        float hR = texture2D(u_heightmap, v_texCoord + vec2( texel, 0.0)).r;
        float hU = texture2D(u_heightmap, v_texCoord + vec2(0.0, -texel)).r;
        float hD = texture2D(u_heightmap, v_texCoord + vec2(0.0,  texel)).r;
        float hC = texture2D(u_heightmap, v_texCoord).r;

        vec2 offset = vec2(hL - hR, hU - hD) * 0.055;
        vec4 color = texture2D(u_image, v_texCoord + offset);

        float specular = pow(max(0.0, 1.0 - length(vec2(hL - hR, hU - hD)) * 8.0), 4.0);
        float crest = abs(hC - 0.5) * 0.18;
        color.rgb += vec3(0.55, 0.82, 1.0) * specular * 0.22;
        color.rgb += vec3(0.7, 0.9, 1.0) * crest;
        color.rgb = mix(color.rgb, color.rgb * vec3(0.78, 0.92, 1.05), 0.18);
        gl_FragColor = color;
      }
    `;

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      isWebGLFallback = true;
      rippleCanvas.style.display = 'none';
      return;
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vs);
    gl.attachShader(shaderProgram, fs);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      isWebGLFallback = true;
      rippleCanvas.style.display = 'none';
      return;
    }

    gl.useProgram(shaderProgram);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    uImageLocation = gl.getUniformLocation(shaderProgram, 'u_image');
    uHeightmapLocation = gl.getUniformLocation(shaderProgram, 'u_heightmap');

    bgTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, bgTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // 1x1 transparent placeholder — CSS background shows aquarium until real texture is ready
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([2, 62, 138, 255]));

    heightmapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GRID, GRID, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, heightmapData);
  }

  function addRipple(x, y, radius, strength) {
    if (!buffer1) return;
    const gx = Math.floor((x / Math.max(1, width)) * GRID);
    const gy = Math.floor((y / Math.max(1, height)) * GRID);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist >= radius) continue;
        buffer1[ny * GRID + nx] += (1.0 - dist / radius) * strength;
      }
    }
  }

  function stepWaves() {
    for (let y = 1; y < GRID - 1; y++) {
      for (let x = 1; x < GRID - 1; x++) {
        const idx = y * GRID + x;
        buffer2[idx] =
          (buffer1[idx - 1] + buffer1[idx + 1] + buffer1[idx - GRID] + buffer1[idx + GRID]) / 2
          - buffer2[idx];
        buffer2[idx] *= damping;
      }
    }
    for (let i = 0; i < bufferSize; i++) {
      heightmapData[i] = Math.max(0, Math.min(255, (buffer2[i] + 1.0) * 127.5));
    }
    const temp = buffer1;
    buffer1 = buffer2;
    buffer2 = temp;
  }

  let bgTextureUploaded = false;

  function drawWebGL() {
    if (!gl || isWebGLFallback) return;
    if (!bgTextureUploaded && !(bgLoaded && bgImg.complete && bgImg.naturalWidth > 0)) return;

    stepWaves();
    try {
      gl.viewport(0, 0, rippleCanvas.width, rippleCanvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTexture);
      if (!bgTextureUploaded && bgLoaded && bgImg.complete && bgImg.naturalWidth > 0) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImg);
        bgTextureUploaded = true;
        container.classList.add('is-aquarium-ready');
      }
      gl.uniform1i(uImageLocation, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GRID, GRID, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, heightmapData);
      gl.uniform1i(uHeightmapLocation, 1);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } catch (err) {
      isWebGLFallback = true;
      rippleCanvas.style.display = 'none';
    }
  }

  function drawFallbackBG() {
    if (!bgLoaded) return;
    ctx.drawImage(bgImg, 0, 0, width, height);
  }


  class Bubble {
    constructor() { this.reset(true); }

    reset(randomY) {
      this.x = Math.random() * width;
      this.y = randomY ? Math.random() * height : height + Math.random() * 40;
      this.size = Math.random() * 5 + 1.5;
      this.speed = Math.random() * 1.2 + 0.5;
      this.wobble = Math.random() * Math.PI * 2;
      this.alpha = Math.random() * 0.35 + 0.15;
      this.targetAlpha = this.alpha;
    }

    update() {
      this.y -= this.speed;
      this.wobble += 0.04;
      this.x += Math.sin(this.wobble) * 0.55;

      if (mouse.active) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          const angle = Math.atan2(dy, dx);
          this.x += Math.cos(angle) * force * 3.5;
          this.y += Math.sin(angle) * force * 2.5 - force * 4;
          this.alpha = Math.min(0.75, this.alpha + 0.04);
        } else {
          this.alpha += (this.targetAlpha - this.alpha) * 0.05;
        }
      } else {
        this.alpha += (this.targetAlpha - this.alpha) * 0.05;
      }

      if (this.y < -12 || this.x < -30 || this.x > width + 30) this.reset(false);
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 1.4})`;
      ctx.fill();
    }
  }


  class Fish {
    constructor(laneIndex, total) {
      const marginX = 40;
      const marginY = 20;

      // Even 2D grid: cover left/right and top/mid/bottom equally
      const cols = Math.max(6, Math.ceil(Math.sqrt(total * (width / Math.max(height, 1)))));
      const rows = Math.max(5, Math.ceil(total / cols));
      const col = laneIndex % cols;
      const row = Math.floor(laneIndex / cols) % rows;

      const cellW = (width - marginX * 2) / cols;
      const cellH = (height - marginY * 2) / rows;

      this.x = marginX + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.7;
      this.y = marginY + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.6;
      this.x = Math.max(20, Math.min(width - 20, this.x));
      this.y = Math.max(20, Math.min(height - 20, this.y));

      // Alternate direction by half: left fish often go right, right fish often go left
      const goingRight = col < cols / 2 ? (Math.random() > 0.3) : (Math.random() > 0.7);
      const speed = 0.75 + Math.random() * 1.15;

      this.dir = goingRight ? 1 : -1;
      this.speed = speed;
      this.vx = this.dir * speed;
      this.vy = 0;
      this.baseY = this.y;
      this.homeBand = row % 3; // 0 top, 1 mid, 2 bottom — keep wander spread
      this.targetX = this.pickTargetX();
      this.wanderTimer = 50 + Math.floor(Math.random() * 100);

      // Varied fish sizes: Small (24-36px), Medium (42-58px), Large (64-85px), Extra Large Majestic (92-115px)
      const sizeRoll = Math.random();
      if (sizeRoll < 0.28) {
        this.size = 24 + Math.random() * 12;
      } else if (sizeRoll < 0.62) {
        this.size = 42 + Math.random() * 16;
      } else if (sizeRoll < 0.88) {
        this.size = 64 + Math.random() * 21;
      } else {
        this.size = 92 + Math.random() * 23;
      }

      this.targetY = this.pickTargetY();
      this.bobAmp = 4 + Math.random() * 9;
      this.bobSpeed = 0.018 + Math.random() * 0.032;
      this.bobPhase = Math.random() * Math.PI * 2;
      this.wiggle = Math.random() * Math.PI * 2;
      this.wiggleSpeed = 0.11 + Math.random() * 0.12;
      this.scaredTimer = 0;
      this.defIndex = colorfulSpawnOrder[laneIndex % colorfulSpawnOrder.length];
      this.turnCooldown = 35 + Math.floor(Math.random() * 85);
      this.depthChangeTimer = 20 + Math.floor(Math.random() * 100);
    }

    pickTargetY() {
      // Even thirds: top / mid / bottom — prefer home band, still visit other bands
      const r = Math.random();
      let band = this.homeBand;
      if (r < 0.22) band = 0;
      else if (r < 0.44) band = 1;
      else if (r < 0.66) band = 2;
      // else keep homeBand (~34%)

      if (band === 0) return height * (0.05 + Math.random() * 0.25);
      if (band === 1) return height * (0.35 + Math.random() * 0.30);
      return height * (0.68 + Math.random() * 0.26);
    }

    pickTargetX() {
      // Even left / mid / right coverage — no center clustering
      const zone = Math.floor(Math.random() * 3);
      if (zone === 0) return width * (0.06 + Math.random() * 0.26);
      if (zone === 1) return width * (0.36 + Math.random() * 0.28);
      return width * (0.66 + Math.random() * 0.28);
    }

    update() {
      this.wiggle += this.wiggleSpeed;
      this.bobPhase += this.bobSpeed;
      if (this.turnCooldown > 0) this.turnCooldown--;
      if (this.depthChangeTimer > 0) this.depthChangeTimer--;

      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (mouse.active && dist < 170 && dist > 0.1) {
        this.scaredTimer = 45;
        const angle = Math.atan2(dy, dx);
        const panic = 5.5 + (1 - dist / 170) * 4;
        this.vx = Math.cos(angle) * panic;
        this.vy = Math.sin(angle) * panic * 0.9;
        this.dir = this.vx >= 0 ? 1 : -1;
        this.wiggleSpeed = 0.42;
        this.baseY = this.y;
      } else if (this.scaredTimer > 0) {
        this.scaredTimer--;
        this.vx *= 0.93;
        this.vy *= 0.93;
        if (this.scaredTimer === 0) {
          this.vx = this.dir * this.speed;
          this.vy = 0;
          this.wiggleSpeed = 0.12 + Math.random() * 0.1;
          this.baseY = this.y;
          this.targetY = this.pickTargetY();
          this.targetX = this.pickTargetX();
        }
      } else {
        this.vx += (this.dir * this.speed - this.vx) * 0.09;

        if (this.depthChangeTimer === 0) {
          this.targetY = this.pickTargetY();
          this.depthChangeTimer = 90 + Math.floor(Math.random() * 190);
        }

        // Wander evenly across left/mid/right — not stuck in one zone
        if (this.wanderTimer > 0) this.wanderTimer--;
        if (this.wanderTimer === 0) {
          this.targetX = this.pickTargetX();
          this.wanderTimer = 80 + Math.floor(Math.random() * 140);
          if (this.targetX > this.x + 12) this.dir = 1;
          else if (this.targetX < this.x - 12) this.dir = -1;
        }

        const dxTarget = this.targetX - this.x;
        if (Math.abs(dxTarget) > 24) {
          this.vx += Math.sign(dxTarget) * 0.04;
          const maxSpeed = this.speed * 1.3;
          if (this.vx > maxSpeed) this.vx = maxSpeed;
          if (this.vx < -maxSpeed) this.vx = -maxSpeed;
        }

        const dyTarget = this.targetY - this.baseY;
        this.baseY += dyTarget * 0.009;
        this.vy = dyTarget * 0.014 + Math.sin(this.bobPhase) * 0.45;

        if (this.turnCooldown === 0 && Math.random() < 0.003) {
          this.dir *= -1;
          this.turnCooldown = 80 + Math.floor(Math.random() * 120);
        }
      }

      this.x += this.vx;
      this.y = this.scaredTimer > 0
        ? this.y + this.vy
        : this.baseY + Math.sin(this.bobPhase) * this.bobAmp;

      // Re-enter from opposite side at a random depth band (keeps spread even)
      if (this.x < -90) {
        this.x = -60;
        this.dir = 1;
        this.vx = this.dir * this.speed;
        this.targetY = this.pickTargetY();
        this.targetX = this.pickTargetX();
        this.baseY = this.targetY;
        this.y = this.baseY;
        this.wanderTimer = 40;
      } else if (this.x > width + 90) {
        this.x = width + 60;
        this.dir = -1;
        this.vx = this.dir * this.speed;
        this.targetY = this.pickTargetY();
        this.targetX = this.pickTargetX();
        this.baseY = this.targetY;
        this.y = this.baseY;
        this.wanderTimer = 40;
      }

      // Keep within canvas vertical padding
      if (this.y < 16) {
        this.y = 16;
        this.baseY = 22;
        this.targetY = Math.max(30, this.targetY);
      }
      if (this.y > height - 16) {
        this.y = height - 16;
        this.baseY = height - 22;
        this.targetY = Math.min(height - 30, this.targetY);
      }
    }

    draw() {
      const data = loadedFishData[this.defIndex];
      if (!data || !data.img.complete || data.img.naturalWidth === 0) return;

      const movingRight = this.vx >= 0;
      const flip = data.facesLeft ? movingRight : !movingRight;
      const tilt = Math.max(-0.2, Math.min(0.2, this.vy * 0.07));
      const tailWiggle = Math.sin(this.wiggle) * (this.scaredTimer > 0 ? 0.1 : 0.05);

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(tilt + tailWiggle);
      if (flip) ctx.scale(-1, 1);

      const aspect = data.img.height / Math.max(1, data.img.width);
      const fw = this.size;
      const fh = this.size * aspect;

      // No colored shadowBlur — that made fish look like solid color blobs while loading
      ctx.drawImage(data.img, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();
    }
  }

  const FISH_COUNT = 28;
  const bubbles = Array.from({ length: 16 }, () => new Bubble());
  const fishes = Array.from({ length: FISH_COUNT }, (_, i) => new Fish(i, FISH_COUNT));
  const caustics = [];
  function spawnCaustic(x, y, intensity) {
    if (caustics.length > 8) return;
    caustics.push({
      x, y, radius: 4,
      maxRadius: 28 + intensity * 18,
      alpha: Math.min(0.28, 0.08 + intensity * 0.04),
      speed: 1.1 + intensity * 0.15
    });
  }

  function resize() {
    width = container.offsetWidth;
    height = container.offsetHeight;
    // Cap at 1x — aquarium is decorative; 2x DPR was crushing Edge GPU
    const dpr = 1;

    rippleCanvas.width = Math.floor(width * dpr);
    rippleCanvas.height = Math.floor(height * dpr);
    overlayCanvas.width = Math.floor(width * dpr);
    overlayCanvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (gl) gl.viewport(0, 0, rippleCanvas.width, rippleCanvas.height);

    // Keep fish evenly covering top-center, mid, and bottom after window resize
    if (typeof fishes !== 'undefined' && fishes.length) {
      const cols = Math.max(4, Math.ceil(Math.sqrt(fishes.length * (width / Math.max(height, 1)))));
      const rows = Math.max(3, Math.ceil(fishes.length / cols));
      const marginX = 20;
      const marginY = 16;
      const cellW = (width - marginX * 2) / cols;
      const cellH = (height - marginY * 2) / rows;
      fishes.forEach((f, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols) % rows;
        f.x = marginX + cellW * (col + 0.5);
        f.baseY = marginY + cellH * (row + 0.5);
        f.y = f.baseY;
        f.targetY = f.pickTargetY();
      });
    }
  }

  window.addEventListener('resize', resize);

  const pointer = { clientX: 0, clientY: 0, hasPos: false };
  let lastRelX = null;
  let lastRelY = null;
  let lastScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
  let scrollSplashPending = false;

  function splashAt(x, y, speed) {
    if (speed > 3.5) {
      const strength = Math.min(0.42, speed * 0.016);
      addRipple(x, y, 4 + Math.min(5, Math.floor(speed * 0.15)), strength);
      if (speed > 8 && Math.random() < 0.28) {
        spawnCaustic(x, y, speed * 0.03);
      }
    } else if (speed > 1.1) {
      addRipple(x, y, 3, Math.min(0.24, speed * 0.035));
    }
  }

  function readScrollY() {
    return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function syncHeroPointer(opts) {
    if (!pointer.hasPos) return;
    const fromScroll = !!(opts && opts.fromScroll);
    const scrollDy = opts && typeof opts.scrollDy === 'number' ? opts.scrollDy : 0;
    const rect = container.getBoundingClientRect();
    const x = pointer.clientX - rect.left;
    const y = pointer.clientY - rect.top;
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;

    if (!inside) {
      mouse.active = false;
      mouse.speed = 0;
      mouse.x = -1000;
      mouse.y = -1000;
      lastRelX = null;
      lastRelY = null;
      return;
    }

    const prevX = lastRelX;
    const prevY = lastRelY;
    mouse.x = x;
    mouse.y = y;
    mouse.active = true;
    lastRelX = x;
    lastRelY = y;

    if (prevX == null || prevY == null) {
      mouse.lastX = x;
      mouse.lastY = y;
      mouse.speed = 0;
      if (fromScroll && Math.abs(scrollDy) > 1) {
        splashAt(x, y, Math.min(28, Math.abs(scrollDy) * 0.9));
      }
      return;
    }

    mouse.lastX = prevX;
    mouse.lastY = prevY;
    const dx = x - prevX;
    const dy = y - prevY;
    let speed = Math.sqrt(dx * dx + dy * dy);

    // Edge often updates scroll after wheel; use scroll delta so splash still fires
    if (fromScroll) {
      speed = Math.max(speed, Math.abs(scrollDy), Math.abs(dy));
      if (speed < 2 && Math.abs(scrollDy) > 0.5) speed = Math.abs(scrollDy) * 1.2;
      if (speed < 3.5 && Math.abs(scrollDy) > 0) speed = Math.max(speed, 5);
    }

    mouse.speed = speed;
    splashAt(x, y, speed);
  }

  function markPointer(e) {
    pointer.clientX = e.clientX;
    pointer.clientY = e.clientY;
    pointer.hasPos = true;
  }

  // Edge + Chrome: keep last known cursor even when not moving
  window.addEventListener('pointermove', markPointer, { passive: true });
  window.addEventListener('mousemove', markPointer, { passive: true });

  container.addEventListener('pointermove', (e) => {
    markPointer(e);
    syncHeroPointer({ fromScroll: false });
  }, { passive: true });

  container.addEventListener('mousemove', (e) => {
    markPointer(e);
    // Older Edge path without PointerEvent
    if (window.PointerEvent) return;
    syncHeroPointer({ fromScroll: false });
  }, { passive: true });

  container.addEventListener('click', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addRipple(x, y, 12, 0.75);
    addRipple(x, y, 7, 0.4);
    spawnCaustic(x, y, 1.1);
  });

  container.addEventListener('mouseleave', () => {
    const rect = container.getBoundingClientRect();
    if (pointer.hasPos) {
      const x = pointer.clientX - rect.left;
      const y = pointer.clientY - rect.top;
      if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) return;
    }
    mouse.active = false;
    mouse.speed = 0;
    mouse.x = -1000;
    mouse.y = -1000;
    lastRelX = null;
    lastRelY = null;
  });

  function queueScrollSplash() {
    scrollSplashPending = true;
  }

  function flushScrollSplash() {
    if (!scrollSplashPending && !pointer.hasPos) return;
    const sy = readScrollY();
    const scrollDy = sy - lastScrollY;
    lastScrollY = sy;
    if (!pointer.hasPos) {
      scrollSplashPending = false;
      return;
    }
    if (scrollSplashPending || Math.abs(scrollDy) > 0.1) {
      scrollSplashPending = false;
      syncHeroPointer({ fromScroll: true, scrollDy });
    }
  }

  window.addEventListener('scroll', queueScrollSplash, { passive: true, capture: true });
  document.addEventListener('scroll', queueScrollSplash, { passive: true, capture: true });
  window.addEventListener('wheel', queueScrollSplash, { passive: true, capture: true });
  document.addEventListener('wheel', queueScrollSplash, { passive: true, capture: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('scroll', queueScrollSplash, { passive: true });
    window.visualViewport.addEventListener('resize', queueScrollSplash, { passive: true });
  }

  let frame = 0;
  function render() {
    frame += 1;
    // Edge: apply after layout so hero rect matches current scroll (incl. smooth scroll)
    flushScrollSplash();
    if (isWebGLFallback) {
      ctx.clearRect(0, 0, width, height);
      drawFallbackBG();
    } else {
      drawWebGL();
      ctx.clearRect(0, 0, width, height);
    }

    const lightGrad = ctx.createLinearGradient(width / 2, 0, width / 2, height);
    lightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    lightGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.02)');
    lightGrad.addColorStop(1, 'rgba(0, 20, 40, 0.18)');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(0, 0, width, height);

    bubbles.forEach((b) => { b.update(); b.draw(); });

    // Separation every other frame — O(n^2) was expensive with many fish
    if (frame % 2 === 0) {
      for (let i = 0; i < fishes.length; i++) {
        for (let j = i + 1; j < fishes.length; j++) {
          const f1 = fishes[i];
          const f2 = fishes[j];
          const dx = f2.x - f1.x;
          const dy = f2.y - f1.y;
          const minDist = (f1.size + f2.size) * 0.85;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDist * minDist && distSq > 1) {
            const dist = Math.sqrt(distSq);
            const push = (minDist - dist) * 0.05;
            const nx = dx / dist;
            const ny = dy / dist;
            f1.x -= nx * push;
            f1.y -= ny * push * 0.5;
            f2.x += nx * push;
            f2.y += ny * push * 0.5;
          }
        }
      }
    }

    fishes.forEach((f) => { f.update(); f.draw(); });

    for (let i = caustics.length - 1; i >= 0; i--) {
      const c = caustics[i];
      c.radius += c.speed;
      c.alpha *= 0.94;
      if (c.alpha < 0.01 || c.radius > c.maxRadius) {
        caustics.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.radius * 1.15, c.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(200, 240, 255, ${c.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    requestAnimationFrame(render);
  }

  // Start after first paint so CSS aquarium + hero doctor show instantly
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    initWebGL();
    resize();
    render();
  };
  requestAnimationFrame(() => requestAnimationFrame(start));
})();


document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar?.classList.add('scrolled');
    else navbar?.classList.remove('scrolled');
  });


  const navToggle = document.querySelector('.nav-toggle');
  const navClose = document.querySelector('.nav-close');
  const navPanel = document.querySelector('.nav-panel');
  let savedScrollY = 0;

  function openMenu() {
    if (!navPanel) return;
    savedScrollY = window.scrollY || window.pageYOffset;
    navPanel.classList.add('is-open');
    document.documentElement.classList.add('menu-open');
    document.body.classList.add('menu-open');
    document.body.style.top = `-${savedScrollY}px`;
    navToggle?.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!navPanel) return;
    navPanel.classList.remove('is-open');
    document.documentElement.classList.remove('menu-open');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
    navToggle?.setAttribute('aria-expanded', 'false');
  }

  navToggle?.addEventListener('click', () => {
    if (navPanel?.classList.contains('is-open')) closeMenu();
    else openMenu();
  });

  navClose?.addEventListener('click', closeMenu);

  navPanel?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navPanel?.classList.contains('is-open')) closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && navPanel?.classList.contains('is-open')) closeMenu();
  });

  const revealElements = document.querySelectorAll('.reveal-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll(
    '.mosaic-grid, .facilities-track, .stories-grid, .how-care-grid, .arch-grid, .team-grid, .about-feature-list'
  ).forEach((grid) => {
    [...grid.children].forEach((child, i) => {
      if (!child.classList.contains('reveal-item')) child.classList.add('reveal-item');
      child.setAttribute('data-delay', String((i % 4) + 1));
    });
  });

  revealElements.forEach((el) => observer.observe(el));
  document.querySelectorAll('.reveal-item').forEach((el) => observer.observe(el));

  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      if (window.matchMedia('(hover: none)').matches) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -10;
      const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02, 1.02, 1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1, 1, 1)';
    });
  });

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach((i) => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      if (bar.dataset.counted === '1') return;
      bar.dataset.counted = '1';
      bar.querySelectorAll('.counter-val').forEach((counter) => {
        const target = +counter.getAttribute('data-target');
        let count = 0;
        const speed = Math.max(target / 50, 0.5);
        const updateCount = () => {
          count += speed;
          if (count < target) {
            counter.innerText = Math.ceil(count);
            setTimeout(updateCount, 30);
          } else {
            counter.innerText = target + '+';
          }
        };
        updateCount();
      });
      countObserver.unobserve(bar);
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.stats-bar').forEach((bar) => countObserver.observe(bar));

  document.querySelectorAll('a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#' || href === 'javascript:void(0)') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '404.html';
      });
    }
  });

  // Legacy dashboard tabs (old markup fallback)
  const tabLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabContents = document.querySelectorAll('.tab-pane');
  tabLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      tabLinks.forEach((l) => l.classList.remove('active'));
      tabContents.forEach((c) => { c.style.display = 'none'; });
      link.classList.add('active');
      const activeContent = document.getElementById(targetTab);
      if (activeContent) activeContent.style.display = 'block';
    });
  });


  if (document.querySelector('.dash-layout')) {
    initVetDashboard();
  }

  if (typeof window.StacklySelect?.init === 'function') {
    window.StacklySelect.init(document);
  }
  if (typeof window.StacklyDate?.init === 'function') {
    window.StacklyDate.init(document);
  }


  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const nameOk = (v) => /^[A-Za-z\s]+$/.test(v);
  function showErr(input, errEl, msg) {
    if (input) input.classList.add('is-invalid');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
  }
  function clearErr(input, errEl) {
    if (input) input.classList.remove('is-invalid');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('show'); }
  }

  // Password eye toggle — single handler only (no inline onclick; that double-fired)
  window.togglePasswordVisibility = function (btn) {
    if (!btn) return;
    const targetId = btn.getAttribute('data-target');
    const wrap = btn.closest('.password-wrap');
    const input = (targetId && document.getElementById(targetId))
      || wrap?.querySelector('input')
      || null;
    if (!input) return;

    const showing = input.getAttribute('type') === 'password';
    input.setAttribute('type', showing ? 'text' : 'password');

    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-eye', !showing);
      icon.classList.toggle('fa-eye-slash', showing);
    } else {
      btn.innerHTML = showing
        ? '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-eye" aria-hidden="true"></i>';
    }

    btn.classList.toggle('is-visible', showing);
    btn.setAttribute('aria-label', showing ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', showing ? 'true' : 'false');
  };

  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.togglePasswordVisibility(btn);
    });
  });
  document.querySelectorAll('.role-cards').forEach((wrap) => {
    wrap.querySelectorAll('.role-card').forEach((card) => {
      card.addEventListener('click', () => {
        wrap.querySelectorAll('.role-card').forEach((c) => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
      });
    });
  });
  document.querySelectorAll('[data-slideshow]').forEach((root) => {
    const slides = [...root.querySelectorAll('.slideshow-slide')];
    const dotsWrap = root.querySelector('[data-slideshow-dots]');
    if (slides.length < 2) return;
    let idx = 0;
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Slide ${i + 1}`);
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => go(i));
      dotsWrap?.appendChild(b);
    });
    function go(n) {
      idx = n;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      dotsWrap?.querySelectorAll('button').forEach((d, i) => d.classList.toggle('is-active', i === idx));
    }
    setInterval(() => go((idx + 1) % slides.length), 4200);
  });

  const loginForm = document.getElementById('loginForm') || document.getElementById('login-form');
  if (loginForm && document.getElementById('signInEmail')) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('signInName');
      const email = document.getElementById('signInEmail');
      const pass = document.getElementById('signInPassword');
      const nameErr = document.getElementById('signInNameError');
      const emailErr = document.getElementById('signInEmailError');
      const passErr = document.getElementById('signInPasswordError');
      let ok = true;

      clearErr(name, nameErr);
      clearErr(email, emailErr);
      clearErr(pass, passErr);

      if (!name.value.trim()) { showErr(name, nameErr, 'Full name is required'); ok = false; }
      else if (!nameOk(name.value.trim())) { showErr(name, nameErr, 'Name contains only alphabets'); ok = false; }

      if (!email.value.trim()) { showErr(email, emailErr, 'Email address is required'); ok = false; }
      else if (!emailOk(email.value.trim())) { showErr(email, emailErr, 'Please enter a valid email address'); ok = false; }

      if (!pass.value) { showErr(pass, passErr, 'Password is required'); ok = false; }
      else if (pass.value.length < 8) { showErr(pass, passErr, 'Password must be at least 8 characters'); ok = false; }

      if (!ok) return;

      const role = document.querySelector('input[name="role"]:checked')?.value || 'customer';
      try {
        localStorage.setItem('stackly_role', role);
        localStorage.setItem('stackly_user_name', name.value.trim());
        localStorage.setItem('stackly_user_email', email.value.trim());
        localStorage.setItem('stackly_login_confirmed', 'true');
      } catch (_) {}

      const overlay = document.getElementById('loginConfirmOverlay');
      overlay?.classList.add('show');
      setTimeout(() => {
        const dest = role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
        overlay?.classList.remove('show');
        window.location.href = dest;
      }, 1200);
    });
  } else if (loginForm) {
    // legacy fallback
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const roleSelect = document.getElementById('user-role');
      const selectedRole = roleSelect ? roleSelect.value : 'customer';
      window.location.href = selectedRole === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
    });
  }

  document.querySelectorAll('input[type="tel"], input[name="phone"]').forEach((input) => {
    input.setAttribute('maxlength', '10');
    input.setAttribute('inputmode', 'numeric');
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);
    });
  });

  const contactForm = document.getElementById('contactForm') || document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contactName') || contactForm.querySelector('[name="name"]');
      const email = document.getElementById('contactEmail') || contactForm.querySelector('[name="email"]');
      const phone = document.getElementById('contactPhone') || contactForm.querySelector('[name="phone"]');
      const service = document.getElementById('contactService');
      const message = document.getElementById('contactMessage') || contactForm.querySelector('[name="message"]');
      const nameErr = document.getElementById('nameError');
      const emailErr = document.getElementById('emailError');
      const phoneErr = document.getElementById('phoneError');
      const serviceErr = document.getElementById('serviceError');
      const messageErr = document.getElementById('messageError');
      let ok = true;

      clearErr(name, nameErr);
      clearErr(email, emailErr);
      clearErr(phone, phoneErr);
      clearErr(service, serviceErr);
      clearErr(message, messageErr);

      if (!name?.value.trim()) { showErr(name, nameErr, 'Please enter your name'); ok = false; }
      else if (!nameOk(name.value.trim())) { showErr(name, nameErr, 'Name contains only alphabets'); ok = false; }

      if (!email?.value.trim() || !emailOk(email.value.trim())) {
        showErr(email, emailErr, 'Please enter a valid email address');
        ok = false;
      }

      if (!phone?.value.trim()) { showErr(phone, phoneErr, 'Please enter your phone number'); ok = false; }
      else if (!/^\d{10}$/.test(phone.value.trim())) { showErr(phone, phoneErr, 'Phone number must be exactly 10 digits'); ok = false; }

      if (service && !service.value) { showErr(service, serviceErr, 'Please select a service'); ok = false; }

      if (!message?.value.trim()) { showErr(message, messageErr, 'Please enter your message details'); ok = false; }

      if (!ok) return;
      window.location.href = '404.html';
    });
  }
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const first = document.getElementById('regFirstName');
      const last = document.getElementById('regLastName');
      const company = document.getElementById('regPetName');
      const email = document.getElementById('regEmail');
      const pass = document.getElementById('regPassword');
      const confirm = document.getElementById('regConfirmPassword');
      const firstErr = document.getElementById('regFirstNameError');
      const lastErr = document.getElementById('regLastNameError');
      const companyErr = document.getElementById('regCompanyError');
      const emailErr = document.getElementById('regEmailError');
      const passErr = document.getElementById('regPasswordError');
      const confirmErr = document.getElementById('regConfirmPasswordError');
      let ok = true;

      clearErr(first, firstErr);
      clearErr(last, lastErr);
      clearErr(company, companyErr);
      clearErr(email, emailErr);
      clearErr(pass, passErr);
      clearErr(confirm, confirmErr);

      if (!first?.value.trim()) { showErr(first, firstErr, 'First name is required'); ok = false; }
      else if (!nameOk(first.value.trim())) { showErr(first, firstErr, 'Name contains only alphabets'); ok = false; }

      if (!last?.value.trim()) { showErr(last, lastErr, 'Last name is required'); ok = false; }
      else if (!nameOk(last.value.trim())) { showErr(last, lastErr, 'Name contains only alphabets'); ok = false; }

      if (!company?.value.trim()) { showErr(company, companyErr, 'Pet / clinic name is required'); ok = false; }

      if (!email?.value.trim()) { showErr(email, emailErr, 'Email address is required'); ok = false; }
      else if (!emailOk(email.value.trim())) { showErr(email, emailErr, 'Please enter a valid email address'); ok = false; }

      if (!pass?.value) { showErr(pass, passErr, 'Password is required'); ok = false; }
      else if (pass.value.length < 8) { showErr(pass, passErr, 'Password must be at least 8 characters'); ok = false; }

      if (!confirm?.value) { showErr(confirm, confirmErr, 'Confirm password is required'); ok = false; }
      else if (confirm.value !== pass.value) { showErr(confirm, confirmErr, 'Passwords do not match'); ok = false; }

      if (!ok) return;

      const role = registerForm.querySelector('input[name="role"]:checked')?.value || 'customer';
      const fullname = `${first.value.trim()} ${last.value.trim()}`.trim();
      try {
        localStorage.setItem('stackly_role', role);
        localStorage.setItem('stackly_user_name', fullname);
        localStorage.setItem('stackly_user_email', email.value.trim());
      } catch (_) {}

      document.getElementById('regSuccessModal')?.classList.add('show');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
  }

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      bookingForm.querySelectorAll('[required]').forEach((input) => {
        const err = input.parentElement?.querySelector('.field-error');
        clearErr(input, err);
        if (!input.value.trim()) {
          showErr(input, err, 'This field is required');
          ok = false;
        } else if (input.name === 'owner' && !nameOk(input.value.trim())) {
          showErr(input, err, 'Name contains only alphabets');
          ok = false;
        } else if (input.name === 'phone' && !/^\d{10}$/.test(input.value.trim())) {
          showErr(input, err, 'Phone number must be exactly 10 digits');
          ok = false;
        }
      });
      if (!ok) return;
      window.location.href = '404.html';
    });
  }
  document.querySelectorAll('[data-close-overlay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById(btn.getAttribute('data-close-overlay'))?.classList.remove('show');
    });
  });
  document.querySelectorAll('.stackly-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && !['loginConfirmOverlay', 'regSuccessModal'].includes(overlay.id)) {
        overlay.classList.remove('show');
      }
    });
  });

  // Admin appointment confirm (legacy badge + new pill rows)
  document.querySelectorAll('.action-confirm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const badge = row?.querySelector('.badge-status');
      const pill = row?.querySelector('.pill');
      if (badge) {
        badge.className = 'badge-status badge-confirmed';
        badge.textContent = 'Confirmed';
      }
      if (pill) {
        pill.className = 'pill';
        pill.textContent = 'Confirmed';
      }
      btn.disabled = true;
      btn.textContent = 'Done';
      if (typeof window.dashToast === 'function') {
        window.dashToast('Appointment confirmed.', 'success');
      }
    });
  });

  const filterBars = document.querySelectorAll('.filter-bar');
  filterBars.forEach((bar) => {
    const btns = bar.querySelectorAll('.filter-btn');
    const section = bar.closest('.section') || bar.parentElement;
    const cards = section ? section.querySelectorAll('[data-category]') : [];

    if (btns.length && cards.length) {
      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          btns.forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const filterValue = btn.getAttribute('data-filter') || 'all';

          cards.forEach((card) => {
            const category = card.getAttribute('data-category');
            if (filterValue === 'all' || category === filterValue) {
              card.style.display = '';
              card.style.animation = 'fadeIn 0.4s ease forwards';
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    }
  });

  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.stackly-overlay').forEach((overlay) => {
      overlay.classList.remove('show');
    });
  });

  document.addEventListener('click', (e) => {
    const socialBtn = e.target.closest('.top-bar-links a, .social-auth a, .team-socials a, .footer-links a:has(.fa-facebook-f), a:has(.fa-facebook), a:has(.fa-facebook-f), a:has(.fa-x-twitter), a:has(.fa-twitter), a:has(.fa-instagram), a:has(.fa-google), a:has(.fa-linkedin), a:has(.fa-linkedin-in)');
    if (socialBtn) {
      e.preventDefault();
      window.location.href = '404.html';
    }
  });
});


window.StacklySelect = {
  closeAll(except) {
    document.querySelectorAll('.sa-select.is-open').forEach((wrap) => {
      if (except && wrap === except) return;
      wrap.classList.remove('is-open');
      const menu = wrap._saMenu;
      if (menu) {
        menu.style.display = 'none';
        menu.hidden = true;
      }
      const btn = wrap.querySelector('.sa-select__btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  },

  positionMenu(btn, menu) {
    const vv = window.visualViewport;
    const pad = 10;
    const vw = Math.max(0, Math.floor(vv?.width || document.documentElement.clientWidth || window.innerWidth || 0));
    const vh = Math.max(0, Math.floor(vv?.height || document.documentElement.clientHeight || window.innerHeight || 0));
    const ox = vv?.offsetLeft || 0;
    const oy = vv?.offsetTop || 0;
    const rect = btn.getBoundingClientRect();
    const isNarrow = vw <= 900;

    const maxW = Math.max(160, vw - pad * 2);
    const width = isNarrow ? maxW : Math.min(Math.max(rect.width, 160), maxW);
    let left = isNarrow ? (ox + pad) : (rect.left);
    if (left + width > ox + vw - pad) left = ox + vw - pad - width;
    if (left < ox + pad) left = ox + pad;

    menu.hidden = false;
    menu.style.cssText = [
      'display:block',
      'position:fixed',
      'z-index:100050',
      'box-sizing:border-box',
      `width:${width}px`,
      `max-width:${maxW}px`,
      'min-width:0',
      `left:${left}px`,
      'right:auto',
      'bottom:auto',
      'overflow-x:hidden',
      'overflow-y:auto'
    ].join(';');

    const maxH = Math.min(260, Math.floor(vh * 0.45));
    menu.style.maxHeight = `${maxH}px`;

    const menuH = Math.min(menu.scrollHeight || maxH, maxH);
    const spaceBelow = (oy + vh) - rect.bottom - pad;
    const spaceAbove = rect.top - oy - pad;

    let top;
    if (spaceBelow < Math.min(160, menuH) && spaceAbove > spaceBelow) {
      top = Math.max(oy + pad, rect.top - menuH - 6);
    } else {
      top = rect.bottom + 6;
      if (top + menuH > oy + vh - pad) {
        top = Math.max(oy + pad, oy + vh - pad - menuH);
      }
    }

    menu.style.top = `${top}px`;
    menu.style.maxHeight = `${Math.min(maxH, Math.max(80, oy + vh - top - pad))}px`;
  },

  enhance(select) {
    if (!select || select.dataset.saSelect === '1') return;
    select.dataset.saSelect = '1';

    const wrap = document.createElement('div');
    wrap.className = 'sa-select';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('sa-select__native');
    select.tabIndex = -1;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-select__btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="sa-select__btn-label"></span><i class="fas fa-chevron-down" aria-hidden="true"></i>';
    wrap.appendChild(btn);

    const menu = document.createElement('div');
    menu.className = 'sa-select__menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    menu.style.display = 'none';
    document.body.appendChild(menu);
    wrap._saMenu = menu;

    const labelEl = btn.querySelector('.sa-select__btn-label');

    const syncLabel = () => {
      const opt = select.options[select.selectedIndex];
      labelEl.textContent = opt ? opt.textContent : 'Select';
    };

    const rebuildOptions = () => {
      menu.innerHTML = '';
      Array.from(select.options).forEach((opt, idx) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'sa-select__option' + (opt.selected ? ' is-selected' : '');
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', opt.selected ? 'true' : 'false');
        item.disabled = !!opt.disabled;
        item.textContent = opt.textContent;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (opt.disabled) return;
          select.selectedIndex = idx;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncLabel();
          window.StacklySelect.closeAll();
        });
        menu.appendChild(item);
      });
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) {
        window.StacklySelect.closeAll();
      } else {
        window.StacklyDate?.closeAll();
        window.StacklySelect.closeAll(wrap);
        rebuildOptions();
        wrap.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        window.StacklySelect.positionMenu(btn, menu);
      }
    });

    select.addEventListener('change', syncLabel);
    syncLabel();
  },

  init(root) {
    const scope = root || document;
    scope.querySelectorAll('select').forEach((sel) => {
      if (sel.closest('.dash-layout') || sel.classList.contains('js-sa-select')) {
        window.StacklySelect.enhance(sel);
      }
    });
  }
};

window.StacklyDate = {
  closeAll(except) {
    document.querySelectorAll('.sa-date.is-open').forEach((wrap) => {
      if (except && wrap === except) return;
      wrap.classList.remove('is-open');
      const panel = wrap._saPanel;
      if (panel) {
        panel.style.display = 'none';
        panel.hidden = true;
      }
      const btn = wrap.querySelector('.sa-date__btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  },

  positionPanel(btn, panel) {
    if (typeof window.StacklySelect?.positionMenu === 'function') {
      window.StacklySelect.positionMenu(btn, panel);
      return;
    }
    const rect = btn.getBoundingClientRect();
    const pad = 10;
    const vw = window.visualViewport?.width || window.innerWidth;
    panel.style.position = 'fixed';
    panel.style.left = `${pad}px`;
    panel.style.width = `${Math.max(160, vw - pad * 2)}px`;
    panel.style.top = `${rect.bottom + 6}px`;
    panel.style.display = 'block';
    panel.hidden = false;
  },

  enhance(input) {
    if (!input || input.dataset.saDate === '1') return;
    input.dataset.saDate = '1';

    const wrap = document.createElement('div');
    wrap.className = 'sa-date';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.classList.add('sa-date__native');
    input.tabIndex = -1;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sa-date__btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="sa-date__btn-label"></span><i class="fas fa-calendar-days" aria-hidden="true"></i>';
    wrap.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'sa-date__panel';
    panel.setAttribute('role', 'dialog');
    panel.hidden = true;
    panel.style.display = 'none';
    document.body.appendChild(panel);
    wrap._saPanel = panel;

    const labelEl = btn.querySelector('.sa-date__btn-label');
    let view = new Date();
    view.setDate(1);

    const parseValue = () => {
      if (!input.value) return null;
      const p = input.value.split('-').map(Number);
      if (p.length !== 3 || p.some((n) => Number.isNaN(n))) return null;
      return new Date(p[0], p[1] - 1, p[2]);
    };

    const fmtLabel = (d) => {
      if (!d) return 'Select date';
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const syncLabel = () => {
      labelEl.textContent = fmtLabel(parseValue());
    };

    const ymd = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const today = () => {
      const t = new Date();
      t.setHours(0, 0, 0, 0);
      return t;
    };

    const render = () => {
      const selected = parseValue();
      const year = view.getFullYear();
      const month = view.getMonth();
      const monthName = view.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const firstDow = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const minStr = input.min || '';
      const maxStr = input.max || '';

      let cells = '';
      for (let i = 0; i < firstDow; i++) cells += '<span class="sa-date__blank"></span>';
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const val = ymd(d);
        const disabled =
          (minStr && val < minStr) ||
          (maxStr && val > maxStr) ||
          d < today();
        const isSel = selected && ymd(selected) === val;
        const isToday = ymd(today()) === val;
        cells += `<button type="button" class="sa-date__day${isSel ? ' is-selected' : ''}${isToday ? ' is-today' : ''}" data-value="${val}" ${disabled ? 'disabled' : ''}>${day}</button>`;
      }

      panel.innerHTML = `
        <div class="sa-date__head">
          <button type="button" class="sa-date__nav" data-nav="-1" aria-label="Previous month"><i class="fas fa-chevron-left"></i></button>
          <div class="sa-date__month">${monthName}</div>
          <button type="button" class="sa-date__nav" data-nav="1" aria-label="Next month"><i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="sa-date__weekdays"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
        <div class="sa-date__grid">${cells}</div>
      `;

      panel.querySelectorAll('[data-nav]').forEach((navBtn) => {
        navBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          view.setMonth(view.getMonth() + Number(navBtn.getAttribute('data-nav')));
          render();
          window.StacklyDate.positionPanel(btn, panel);
        });
      });

      panel.querySelectorAll('.sa-date__day:not(:disabled)').forEach((dayBtn) => {
        dayBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          input.value = dayBtn.getAttribute('data-value') || '';
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
          syncLabel();
          window.StacklyDate.closeAll();
        });
      });
    };

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (wrap.classList.contains('is-open')) {
        window.StacklyDate.closeAll();
        return;
      }
      window.StacklySelect?.closeAll();
      window.StacklyDate.closeAll(wrap);
      const selected = parseValue();
      view = selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date();
      view.setDate(1);
      render();
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      window.StacklyDate.positionPanel(btn, panel);
    });

    input.addEventListener('change', syncLabel);
    syncLabel();
  },

  init(root) {
    const scope = root || document;
    scope.querySelectorAll('input[type="date"].js-sa-date, input.js-sa-date[type="date"]').forEach((el) => {
      window.StacklyDate.enhance(el);
    });
    const bookDate = scope.querySelector('#bookDate');
    if (bookDate) window.StacklyDate.enhance(bookDate);
  }
};

document.addEventListener('click', (e) => {
  if (!e.target.closest('.sa-select') && !e.target.closest('.sa-select__menu')) {
    window.StacklySelect?.closeAll();
  }
  if (!e.target.closest('.sa-date') && !e.target.closest('.sa-date__panel')) {
    window.StacklyDate?.closeAll();
  }
});

window.addEventListener('resize', () => {
  document.querySelectorAll('.sa-select.is-open').forEach((wrap) => {
    const btn = wrap.querySelector('.sa-select__btn');
    const menu = wrap._saMenu;
    if (btn && menu) window.StacklySelect.positionMenu(btn, menu);
  });
  document.querySelectorAll('.sa-date.is-open').forEach((wrap) => {
    const btn = wrap.querySelector('.sa-date__btn');
    const panel = wrap._saPanel;
    if (btn && panel) window.StacklyDate.positionPanel(btn, panel);
  });
});

window.addEventListener('scroll', () => {
  window.StacklySelect?.closeAll();
  window.StacklyDate?.closeAll();
}, true);

(function bootStacklyPickers() {
  const run = () => {
    window.StacklySelect?.init(document);
    window.StacklyDate?.init(document);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();


window.dashToast = function (message, type) {
  let host = document.querySelector('.dash-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'dash-toast-host';
    document.body.appendChild(host);
  }
  const el = document.createElement('div');
  el.className = 'dash-toast ' + (type || 'info');
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 320);
  }, 2400);
};

window.initMobileSidebar = function () {
  const dashSidebar = document.getElementById('dashSidebar');
  const menuToggle = document.getElementById('dashMenuToggle');
  const closeBtn = document.getElementById('closeSidebarBtn');
  const dashOverlay = document.getElementById('dashOverlay');
  if (!dashSidebar || !menuToggle) return;

  let lastToggleAt = 0;
  const mq = window.matchMedia('(max-width: 900px)');
  const layoutRoot = document.querySelector('.dash-layout');
  const sidebarHome = layoutRoot || dashSidebar.parentElement;
  const overlayHome = layoutRoot || (dashOverlay && dashOverlay.parentElement);

  if (!window.__dashSidebarHomeMarker) {
    window.__dashSidebarHomeMarker = document.createComment('dash-sidebar-home');
    if (dashSidebar.parentElement) {
      dashSidebar.parentElement.insertBefore(window.__dashSidebarHomeMarker, dashSidebar);
    }
  }
  if (dashOverlay && !window.__dashOverlayHomeMarker) {
    window.__dashOverlayHomeMarker = document.createComment('dash-overlay-home');
    if (dashOverlay.parentElement) {
      dashOverlay.parentElement.insertBefore(window.__dashOverlayHomeMarker, dashOverlay);
    }
  }

  function isMobileDash() {
    return mq.matches;
  }

  function clearForcedStyles(el) {
    if (!el) return;
    [
      'left', 'top', 'right', 'bottom', 'height', 'width', 'max-width',
      'transform', 'visibility', 'opacity', 'pointer-events', 'z-index',
      'display', 'transition', 'box-shadow', 'padding-top'
    ].forEach((prop) => el.style.removeProperty(prop));
  }

  function moveToBody() {
    if (dashSidebar.parentElement !== document.body) document.body.appendChild(dashSidebar);
    if (dashOverlay && dashOverlay.parentElement !== document.body) document.body.appendChild(dashOverlay);
  }

  function restoreHome() {
    const sm = window.__dashSidebarHomeMarker;
    const om = window.__dashOverlayHomeMarker;
    if (sm && sm.parentNode) sm.parentNode.insertBefore(dashSidebar, sm.nextSibling);
    else if (sidebarHome && dashSidebar.parentElement !== sidebarHome) {
      sidebarHome.insertBefore(dashSidebar, sidebarHome.firstChild);
    }
    if (dashOverlay) {
      if (om && om.parentNode) om.parentNode.insertBefore(dashOverlay, om.nextSibling);
      else if (overlayHome && dashOverlay.parentElement !== overlayHome) overlayHome.appendChild(dashOverlay);
    }
  }

  function resetDesktopSidebar() {
    dashSidebar.classList.remove('open');
    if (dashOverlay) dashOverlay.classList.remove('show');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('dash-sidebar-open');
    document.documentElement.classList.remove('dash-sidebar-open');
    clearForcedStyles(dashSidebar);
    clearForcedStyles(dashOverlay);
    restoreHome();
  }

  function applyMobileClosedStyles() {
    moveToBody();
    dashSidebar.classList.remove('open');
    if (dashOverlay) dashOverlay.classList.remove('show');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('dash-sidebar-open');
    document.documentElement.classList.remove('dash-sidebar-open');
    dashSidebar.style.setProperty('left', '-105%', 'important');
    dashSidebar.style.setProperty('top', '60px', 'important');
    dashSidebar.style.setProperty('height', 'calc(100dvh - 60px)', 'important');
    dashSidebar.style.setProperty('transform', 'none', 'important');
    if (dashOverlay) {
      dashOverlay.style.removeProperty('display');
      dashOverlay.style.removeProperty('top');
    }
  }

  function openSidebar() {
    if (!isMobileDash()) return;
    moveToBody();
    dashSidebar.classList.add('open');
    if (dashOverlay) dashOverlay.classList.add('show');
    menuToggle.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('dash-sidebar-open');
    document.documentElement.classList.add('dash-sidebar-open');
    dashSidebar.style.setProperty('left', '0', 'important');
    dashSidebar.style.setProperty('top', '60px', 'important');
    dashSidebar.style.setProperty('height', 'calc(100dvh - 60px)', 'important');
    dashSidebar.style.setProperty('transform', 'none', 'important');
    dashSidebar.style.setProperty('visibility', 'visible', 'important');
    dashSidebar.style.setProperty('opacity', '1', 'important');
    dashSidebar.style.setProperty('pointer-events', 'auto', 'important');
    dashSidebar.style.setProperty('z-index', '1050', 'important');
    if (dashOverlay) {
      dashOverlay.style.setProperty('display', 'block', 'important');
      dashOverlay.style.setProperty('top', '60px', 'important');
    }
  }

  function closeSidebar() {
    if (isMobileDash()) applyMobileClosedStyles();
    else resetDesktopSidebar();
  }

  function toggleSidebar(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isMobileDash()) return;
    const now = Date.now();
    if (now - lastToggleAt < 350) return;
    lastToggleAt = now;
    if (dashSidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  }

  let lastMobileMode = null;

  function syncSidebarMode(force) {
    const mobile = isMobileDash();
    if (!force && mobile === lastMobileMode) {
      if (!mobile) resetDesktopSidebar();
      return;
    }
    lastMobileMode = mobile;
    if (mobile) applyMobileClosedStyles();
    else resetDesktopSidebar();
  }

  menuToggle.onclick = toggleSidebar;
  menuToggle.type = 'button';
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      closeSidebar();
    };
    closeBtn.type = 'button';
  }
  if (dashOverlay) {
    dashOverlay.onclick = (e) => {
      if (e) e.preventDefault();
      closeSidebar();
    };
  }
  if (dashSidebar.dataset.navCloseBound !== '1') {
    dashSidebar.dataset.navCloseBound = '1';
    dashSidebar.addEventListener('click', (e) => {
      if (e.target.closest('.dash-nav-btn[data-target]') && isMobileDash()) closeSidebar();
    });
  }

  if (!window.__dashSidebarResizeBound) {
    window.__dashSidebarResizeBound = true;
    const onModeChange = () => syncSidebarMode();
    if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onModeChange);
    else if (typeof mq.addListener === 'function') mq.addListener(onModeChange);
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncSidebarMode, 80);
    });
  }

  syncSidebarMode(true);
  window.openDashSidebar = openSidebar;
  window.closeDashSidebar = closeSidebar;
  window.toggleDashSidebar = toggleSidebar;
  window.resetDashSidebarDesktop = resetDesktopSidebar;
};

function initVetDashboard() {
  const isAdmin = document.body.classList.contains('dash-page-admin');
  const defaultName = isAdmin ? 'Dr. Rajesh Kumar' : 'Anbarasan K';
  const defaultEmail = isAdmin ? 'admin@stackly.com' : 'anbarasan@stackly.com';
  let displayName = defaultName;
  let displayEmail = defaultEmail;

  try {
    displayName = localStorage.getItem('stackly_user_name') || defaultName;
    displayEmail = localStorage.getItem('stackly_user_email') || defaultEmail;
  } catch (_) { /* ignore */ }

  const initials = displayName.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    || (isAdmin ? 'DR' : 'AK');

  document.querySelectorAll('.js-user-name').forEach((el) => { el.textContent = displayName; });
  document.querySelectorAll('.js-user-email').forEach((el) => { el.textContent = displayEmail; });
  document.querySelectorAll('.js-user-initials').forEach((el) => { el.textContent = initials; });

  const settingsName = document.getElementById('settingsName');
  const settingsEmail = document.getElementById('settingsEmail');
  if (settingsName) settingsName.value = displayName;
  if (settingsEmail) settingsEmail.value = displayEmail;

  const panels = document.querySelectorAll('.dash-panel');
  const sidebar = document.getElementById('dashSidebar');
  const overlay = document.getElementById('dashOverlay');
  const defaultSection = isAdmin ? 'overview' : 'dashboardHome';

  function animateBars(scope) {
    if (!scope) return;
    scope.querySelectorAll('.bar-fill').forEach((el) => {
      const target = el.getAttribute('data-value') || '0';
      el.style.width = '0%';
      setTimeout(() => { el.style.width = target + '%'; }, 80);
    });
  }

  window.showSection = function (id) {
    if (!document.getElementById('section-' + id)) return;
    if (typeof window.StacklySelect?.closeAll === 'function') window.StacklySelect.closeAll();
    panels.forEach((p) => p.classList.toggle('active', p.id === 'section-' + id));
    document.querySelectorAll('.dash-nav-btn[data-target]').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-target') === id);
    });
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('dash-sidebar-open');
    document.documentElement.classList.remove('dash-sidebar-open');
    if (typeof window.closeDashSidebar === 'function') window.closeDashSidebar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const activePanel = document.getElementById('section-' + id);
    if (['dashboardHome', 'overview', 'records', 'reports', 'settings'].includes(id)) {
      animateBars(activePanel);
    }
    history.replaceState(null, '', '#' + id);
  };

  document.querySelectorAll('[data-target]').forEach((b) => {
    if (b.hasAttribute('data-logout')) return;
    b.addEventListener('click', (e) => {
      const id = b.getAttribute('data-target');
      if (!id || !document.getElementById('section-' + id)) return;
      e.preventDefault();
      window.showSection(id);
    });
  });

  const initial = (location.hash || '#' + defaultSection).replace('#', '');
  window.showSection(document.getElementById('section-' + initial) ? initial : defaultSection);

  if (typeof window.initMobileSidebar === 'function') window.initMobileSidebar();

  document.querySelectorAll('[data-logout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.getElementById('logoutModal')?.classList.add('show');
    });
  });
  document.getElementById('cancelLogout')?.addEventListener('click', () => {
    document.getElementById('logoutModal')?.classList.remove('show');
  });
  document.getElementById('confirmLogout')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('stackly_login_confirmed');
    } catch (_) { /* ignore */ }
    window.location.href = 'login.html';
  });
  document.querySelectorAll('.modal-backdrop').forEach((bd) => {
    bd.addEventListener('click', (e) => {
      if (e.target === bd) bd.classList.remove('show');
    });
  });

  document.getElementById('markAllRead')?.addEventListener('click', () => {
    document.querySelectorAll('.notif-item.unread').forEach((n) => n.classList.remove('unread'));
    const bellDot = document.querySelector('.dash-bell .dot');
    if (bellDot) bellDot.style.display = 'none';
    window.dashToast('All notifications marked as read.', 'info');
  });

  document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = '404.html';
  });

  document.getElementById('supportForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    window.location.href = '404.html';
  });

  document.querySelectorAll('[data-booking-action]').forEach((btn) => {
    if (btn.classList.contains('action-confirm-btn')) return;
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const action = btn.getAttribute('data-booking-action');
      const cell = btn.closest('td');
      const pill = row?.querySelector('.pill');
      if (pill) {
        pill.textContent = action === 'approve' ? 'Confirmed' : 'Declined';
        pill.className = 'pill' + (action === 'approve' ? '' : ' bad');
      }
      if (cell) {
        cell.innerHTML = '<button type="button" class="btn btn-outline btn-xs" disabled>'
          + (action === 'approve' ? 'Confirmed' : 'Declined') + '</button>';
      }
      window.dashToast(
        action === 'approve' ? 'Booking confirmed and owner notified.' : 'Booking request declined.',
        action === 'approve' ? 'success' : 'info'
      );
    });
  });

  const patientSearch = document.getElementById('patientSearch');
  if (patientSearch) {
    patientSearch.addEventListener('input', () => {
      const q = patientSearch.value.trim().toLowerCase();
      document.querySelectorAll('#patientTable tbody tr').forEach((row) => {
        const hay = row.getAttribute('data-search') || row.textContent.toLowerCase();
        row.style.display = !q || hay.includes(q) ? '' : 'none';
      });
    });
  }

  if (typeof window.StacklySelect?.init === 'function') {
    window.StacklySelect.init(document);
  }
}


