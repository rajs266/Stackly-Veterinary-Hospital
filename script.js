/* Stackly Veterinary Hospital ? single site script */

/* ??? Cursor trail ??????????????????????????????????????????????????????????? */
(function initCursor() {
  const canvas = document.createElement('canvas');
  canvas.id = 'cursor-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

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
      this.vy += 0.05;
      this.size *= 0.96;
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
      c.arc(0, 0, Math.max(0.5, this.size), 0, Math.PI * 2);
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

    if (dist > 2) {
      for (let i = 0; i < Math.min(6, Math.ceil(dist / 4)); i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push(new Particle(
          mouse.x, mouse.y,
          (Math.random() - 0.5) * 2 - dx * 0.1,
          (Math.random() - 0.5) * 2 - dy * 0.1,
          color, Math.random() * 4 + 2, Math.random() * 25 + 15
        ));
      }
    }
  });

  window.addEventListener('click', (e) => {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = Math.random() * 4 + 2;
      particles.push(new Particle(
        e.clientX, e.clientY,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        Math.random() * 5 + 3, 35
      ));
    }
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0 || p.size <= 0.2) particles.splice(i, 1);
    }

    ctx.save();
    const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 14);
    grad.addColorStop(0, 'rgba(244, 162, 97, 0.9)');
    grad.addColorStop(0.5, 'rgba(224, 109, 83, 0.4)');
    grad.addColorStop(1, 'rgba(224, 109, 83, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(animate);
  }

  animate();
})();

/* ??? Hero aquarium: real WebGL water + natural fish swim ??????????????????? */
(function initAquarium() {
  const container = document.querySelector('.hero-section');
  if (!container) return;

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

  const ctx = overlayCanvas.getContext('2d');
  let width = container.offsetWidth;
  let height = container.offsetHeight;

  const bgImg = new Image();
  bgImg.crossOrigin = 'anonymous';
  bgImg.src = 'assets/hero-aquarium11.webp';
  let bgLoaded = false;
  bgImg.onload = () => { bgLoaded = true; };

  // Facing based on sprite art: true = image faces left
  // glow = underwater color bloom so the tank reads colorful
  const fishDefs = [
    { src: 'assets/fish_4.webp', facesLeft: true, glow: '#ef4444' },
    { src: 'assets/fish_5.webp', facesLeft: true, glow: '#22d3ee' },
    { src: 'assets/fish_6.webp', facesLeft: true, glow: '#d946ef' },
    { src: 'assets/fish_blue_tang.webp', facesLeft: true, glow: '#3b82f6' },
    { src: 'assets/fish_clownfish.webp', facesLeft: true, glow: '#f97316' },
    { src: 'assets/fish_discus_red.webp', facesLeft: true, glow: '#ef4444' },
    { src: 'assets/fish_green_tang.webp', facesLeft: true, glow: '#22d3ee' },
    { src: 'assets/fish_purple_tang.webp', facesLeft: true, glow: '#d946ef' },
    { src: 'assets/fish_yellow_tang.webp', facesLeft: true, glow: '#eab308' }
  ];

  // Bias toward brighter species so the aquarium looks more colorful
  const colorfulSpawnOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  const loadedFishData = [];
  fishDefs.forEach((def) => {
    const img = new Image();
    img.src = def.src;
    img.onload = () => loadedFishData.push({
      img,
      facesLeft: def.facesLeft,
      glow: def.glow,
      src: def.src
    });
  });

  const mouse = {
    x: -1000, y: -1000, lastX: -1000, lastY: -1000, active: false, speed: 0
  };

  /* WebGL water */
  let gl = null;
  let isWebGLFallback = false;
  let shaderProgram = null;
  let bgTexture = null;
  let heightmapTexture = null;
  let uImageLocation = null;
  let uHeightmapLocation = null;

  const GRID = 128;
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
    gl = rippleCanvas.getContext('webgl', { alpha: false, antialias: false })
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
        float texel = 1.0 / 128.0;
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([2, 62, 138, 255]));

    heightmapTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GRID, GRID, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, heightmapData);
    // No ambient seed ripples ? water stays calm until cursor / click
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
    stepWaves();
    try {
      gl.viewport(0, 0, rippleCanvas.width, rippleCanvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, bgTexture);
      if (!bgTextureUploaded && bgLoaded && bgImg.complete && bgImg.naturalWidth > 0) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bgImg);
        bgTextureUploaded = true;
      }
      gl.uniform1i(uImageLocation, 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, heightmapTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GRID, GRID, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, heightmapData);
      gl.uniform1i(uHeightmapLocation, 1);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    } catch (e) {
      isWebGLFallback = true;
      rippleCanvas.style.display = 'none';
    }
  }

  function drawFallbackBG() {
    if (bgLoaded) {
      ctx.drawImage(bgImg, 0, 0, width, height);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#023e8a');
      grad.addColorStop(1, '#0077b6');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  /* Bubbles */
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

  /* Natural aquarium fish – full 2D depth wandering (top-center, mid, bottom) with diverse sizes */
  class Fish {
    constructor(laneIndex, total) {
      const marginX = 20;
      const marginY = 16;
      
      // Grid allocation ensuring active fish across all 2D sectors (top-left, top-center, top-right, mid, bottom)
      const cols = Math.max(7, Math.ceil(Math.sqrt(total * (width / Math.max(height, 1)))));
      const rows = Math.max(6, Math.ceil(total / cols));
      const col = laneIndex % cols;
      const row = Math.floor(laneIndex / cols) % rows;
      
      const cellW = (width - marginX * 2) / cols;
      const cellH = (height - marginY * 2) / rows;
      
      this.x = marginX + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.8;
      this.y = marginY + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.7;
      this.x = Math.max(marginX, Math.min(width - marginX, this.x));
      this.y = Math.max(marginY, Math.min(height - marginY, this.y));

      const goingRight = Math.random() > 0.5;
      const speed = 0.75 + Math.random() * 1.15;

      this.dir = goingRight ? 1 : -1;
      this.speed = speed;
      this.vx = this.dir * speed;
      this.vy = 0;
      this.baseY = this.y;

      // Varied fish sizes: Small (24-36px), Medium (42-58px), Large (64-85px), Extra Large Majestic (92-115px)
      const sizeRoll = Math.random();
      if (sizeRoll < 0.28) {
        this.size = 24 + Math.random() * 12; // Small
      } else if (sizeRoll < 0.62) {
        this.size = 42 + Math.random() * 16; // Medium
      } else if (sizeRoll < 0.88) {
        this.size = 64 + Math.random() * 21; // Large
      } else {
        this.size = 92 + Math.random() * 23; // Extra Large Majestic
      }

      this.targetY = this.pickTargetY();
      this.bobAmp = 4 + Math.random() * 9;
      this.bobSpeed = 0.018 + Math.random() * 0.032;
      this.bobPhase = Math.random() * Math.PI * 2;
      this.wiggle = Math.random() * Math.PI * 2;
      this.wiggleSpeed = 0.11 + Math.random() * 0.12;
      this.scaredTimer = 0;
      this.defIndex = colorfulSpawnOrder[laneIndex % colorfulSpawnOrder.length];
      this.glow = fishDefs[this.defIndex].glow;
      this.turnCooldown = 35 + Math.floor(Math.random() * 85);
      this.depthChangeTimer = 20 + Math.floor(Math.random() * 100);
      this.pulse = Math.random() * Math.PI * 2;
    }

    pickTargetY() {
      // 35% Top & Top-Center (5%-32%), 35% Middle & Center (33%-67%), 30% Lower & Bottom (68%-94%)
      const r = Math.random();
      if (r < 0.35) {
        return height * (0.05 + Math.random() * 0.27);
      } else if (r < 0.70) {
        return height * (0.33 + Math.random() * 0.34);
      } else {
        return height * (0.68 + Math.random() * 0.26);
      }
    }

    update() {
      this.wiggle += this.wiggleSpeed;
      this.bobPhase += this.bobSpeed;
      this.pulse += 0.05;
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
        }
      } else {
        this.vx += (this.dir * this.speed - this.vx) * 0.09;

        // Periodically pick a new depth target across top-center, mid, or bottom
        if (this.depthChangeTimer === 0) {
          this.targetY = this.pickTargetY();
          this.depthChangeTimer = 90 + Math.floor(Math.random() * 200);
        }

        // Smoothly float towards target depth (allows fish to swim up, down, and across center-top)
        const dyTarget = this.targetY - this.baseY;
        this.baseY += dyTarget * 0.009;
        this.vy = dyTarget * 0.014 + Math.sin(this.bobPhase) * 0.45;

        if (this.turnCooldown === 0 && Math.random() < 0.0055) {
          this.dir *= -1;
          this.turnCooldown = 65 + Math.floor(Math.random() * 105);
        }
      }

      this.x += this.vx;
      this.y = this.scaredTimer > 0
        ? this.y + this.vy
        : this.baseY + Math.sin(this.bobPhase) * this.bobAmp;

      // Re-entry off edges with fresh target depth covering top-center, middle, bottom
      if (this.x < -100) {
        this.x = width + 70;
        this.targetY = this.pickTargetY();
        this.baseY = this.targetY;
        this.y = this.baseY;
      } else if (this.x > width + 100) {
        this.x = -70;
        this.targetY = this.pickTargetY();
        this.baseY = this.targetY;
        this.y = this.baseY;
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
      if (loadedFishData.length === 0) return;
      const def = fishDefs[this.defIndex];
      const data = loadedFishData.find((d) => d.src === def.src) || loadedFishData[this.defIndex % loadedFishData.length];
      if (!data || !data.img.complete) return;

      const movingRight = this.vx >= 0;
      const flip = data.facesLeft ? movingRight : !movingRight;
      const tilt = Math.max(-0.2, Math.min(0.2, this.vy * 0.07));
      const tailWiggle = Math.sin(this.wiggle) * (this.scaredTimer > 0 ? 0.1 : 0.05);
      const glowPulse = 0.65 + Math.sin(this.pulse) * 0.25;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(tilt + tailWiggle);
      if (flip) ctx.scale(-1, 1);

      const aspect = data.img.height / Math.max(1, data.img.width);
      const fw = this.size;
      const fh = this.size * aspect;

      ctx.shadowColor = this.glow;
      ctx.shadowBlur = (this.size > 70 ? 14 : 10) * glowPulse;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(data.img, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();
    }
  }

  const FISH_COUNT = 44;
  const bubbles = Array.from({ length: 38 }, () => new Bubble());
  const fishes = Array.from({ length: FISH_COUNT }, (_, i) => new Fish(i, FISH_COUNT));
  const caustics = [];
  function spawnCaustic(x, y, intensity) {
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    rippleCanvas.width = Math.floor(width * dpr);
    rippleCanvas.height = Math.floor(height * dpr);
    overlayCanvas.width = Math.floor(width * dpr);
    overlayCanvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (gl) gl.viewport(0, 0, rippleCanvas.width, rippleCanvas.height);

    // Keep fish evenly covering top-center, mid, and bottom after window resize
    if (typeof fishes !== 'undefined' && fishes.length) {
      const cols = Math.max(7, Math.ceil(Math.sqrt(fishes.length * (width / Math.max(height, 1)))));
      const rows = Math.max(6, Math.ceil(fishes.length / cols));
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

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;

    const dx = mouse.x - mouse.lastX;
    const dy = mouse.y - mouse.lastY;
    mouse.speed = Math.sqrt(dx * dx + dy * dy);

    // Ripple only on real movement ? no idle corner shaking
    if (mouse.speed > 3.5) {
      const strength = Math.min(0.42, mouse.speed * 0.016);
      addRipple(mouse.x, mouse.y, 4 + Math.min(5, Math.floor(mouse.speed * 0.15)), strength);
      if (mouse.speed > 8 && Math.random() < 0.25) {
        spawnCaustic(mouse.x, mouse.y, mouse.speed * 0.03);
      }
    }
  });

  container.addEventListener('click', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    addRipple(x, y, 12, 0.75);
    addRipple(x, y, 7, 0.4);
    spawnCaustic(x, y, 1.1);
  });

  container.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.speed = 0;
    mouse.x = -1000;
    mouse.y = -1000;
  });

  function render() {
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

  initWebGL();
  resize();
  render();
})();

/* ??? Main UI + dashboard logic ????????????????????????????????????????????? */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) navbar?.classList.add('scrolled');
    else navbar?.classList.remove('scrolled');
  });

  /* Full-page mobile navigation */
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

  // Auto stagger children in common grids
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

  // Dashboard tabs
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

  /* ?? Helpers ?? */
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

  // Password eye toggles
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-target'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.innerHTML = show ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  });

  // Role card selection UI
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

  // Slideshow
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

  // Login form validation + popup redirect
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
        window.location.href = role === 'admin' ? 'admin-dashboard.html' : 'customer-dashboard.html';
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

  // Contact form validation (if present)
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

      if (service && !service.value) { showErr(service, serviceErr, 'Please select a service'); ok = false; }

      if (!message?.value.trim()) { showErr(message, messageErr, 'Please enter your message details'); ok = false; }

      if (!ok) return;
      document.getElementById('contactSuccessOverlay')?.classList.add('show');
      contactForm.reset();
    });
  }

  // Register / Sign Up
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

  // Booking form on get-started
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
        }
      });
      if (!ok) return;
      const modal = document.getElementById('booking-modal');
      if (modal) modal.classList.add('show');
      else alert('Appointment request submitted successfully!');
      bookingForm.reset();
    });
  }

  // Overlay close buttons
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

  // Admin appointment confirm
  document.querySelectorAll('.action-confirm-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const badge = row?.querySelector('.badge-status');
      if (badge) {
        badge.className = 'badge-status badge-confirmed';
        badge.textContent = 'Confirmed';
        btn.disabled = true;
        btn.textContent = 'Done';
      }
    });
  });
});
