// PHÄNOMENAUTIK 2 — CPU-Partikelsystem (Points + Shader)
// Spray, Kielwasser, Gischt an Inseln, Ambient-Moten, Regen, Funken

import * as THREE from "three";

const VERT = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
varying float vAlpha;
varying vec3 vColor;
void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (280.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.05, d);
  if (soft < 0.01) discard;
  gl_FragColor = vec4(vColor, vAlpha * soft);
}
`;

interface Particle {
  alive: boolean;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  size: number;
  r: number; g: number; b: number;
  gravity: number;
  drag: number;
  fadeIn: number;
}

export class ParticleSystem {
  points: THREE.Points;
  private particles: Particle[] = [];
  private pos: Float32Array;
  private size: Float32Array;
  private alpha: Float32Array;
  private color: Float32Array;
  private cap: number;

  constructor(cap = 3000) {
    this.cap = cap;
    this.pos = new Float32Array(cap * 3);
    this.size = new Float32Array(cap);
    this.alpha = new Float32Array(cap);
    this.color = new Float32Array(cap * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aSize", new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("aColor", new THREE.BufferAttribute(this.color, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    for (let i = 0; i < cap; i++) {
      this.particles.push({ alive: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1, size: 1, r: 1, g: 1, b: 1, gravity: 0, drag: 1, fadeIn: 0 });
    }
  }

  spawn(opts: {
    x: number; y: number; z: number;
    vx?: number; vy?: number; vz?: number;
    spread?: number;
    life?: number;
    size?: number;
    color?: [number, number, number];
    gravity?: number;
    drag?: number;
    fadeIn?: number;
  }) {
    const p = this.particles.find((q) => !q.alive);
    if (!p) return;
    const sp = opts.spread ?? 0;
    p.alive = true;
    p.x = opts.x + (Math.random() - 0.5) * sp;
    p.y = opts.y + (Math.random() - 0.5) * sp * 0.4;
    p.z = opts.z + (Math.random() - 0.5) * sp;
    p.vx = (opts.vx ?? 0) + (Math.random() - 0.5) * sp;
    p.vy = (opts.vy ?? 0) + Math.random() * sp * 0.5;
    p.vz = (opts.vz ?? 0) + (Math.random() - 0.5) * sp;
    p.maxLife = opts.life ?? 1;
    p.life = p.maxLife;
    p.size = (opts.size ?? 2) * (0.7 + Math.random() * 0.6);
    const c = opts.color ?? [1, 1, 1];
    p.r = c[0]; p.g = c[1]; p.b = c[2];
    p.gravity = opts.gravity ?? 0;
    p.drag = opts.drag ?? 1;
    p.fadeIn = opts.fadeIn ?? 0.08;
  }

  burst(n: number, opts: Parameters<ParticleSystem["spawn"]>[0]) {
    for (let i = 0; i < n; i++) this.spawn(opts);
  }

  update(dt: number) {
    const P = this.particles;
    for (let i = 0; i < this.cap; i++) {
      const p = P[i];
      if (!p.alive) {
        this.alpha[i] = 0;
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        p.alive = false;
        this.alpha[i] = 0;
        continue;
      }
      p.vy -= p.gravity * dt;
      const dr = Math.pow(p.drag, dt * 60);
      p.vx *= dr; p.vy *= dr; p.vz *= dr;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const t = 1 - p.life / p.maxLife;
      const fadeIn = Math.min(1, t / p.fadeIn);
      const fadeOut = Math.min(1, (p.life / p.maxLife) / 0.35);
      this.pos[i * 3] = p.x;
      this.pos[i * 3 + 1] = p.y;
      this.pos[i * 3 + 2] = p.z;
      this.size[i] = p.size;
      this.alpha[i] = fadeIn * fadeOut;
      this.color[i * 3] = p.r;
      this.color[i * 3 + 1] = p.g;
      this.color[i * 3 + 2] = p.b;
    }
    const geo = this.points.geometry;
    (geo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aSize") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aAlpha") as THREE.BufferAttribute).needsUpdate = true;
    (geo.getAttribute("aColor") as THREE.BufferAttribute).needsUpdate = true;
  }
}

// ─── Regen ( separates, ringförmig um die Kamera laufendes System ) ──

export class RainSystem {
  points: THREE.Points;
  private vel: Float32Array;
  private count: number;
  private area = 260;

  constructor(count = 1200) {
    this.count = count;
    const pos = new Float32Array(count * 3);
    this.vel = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * this.area;
      pos[i * 3 + 1] = Math.random() * 120;
      pos[i * 3 + 2] = (Math.random() - 0.5) * this.area;
      this.vel[i] = 55 + Math.random() * 35;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.PointsMaterial({
      color: 0xaebfd4,
      size: 0.9,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  set intensity(v: number) {
    (this.points.material as THREE.PointsMaterial).opacity = v * 0.55;
    this.points.visible = v > 0.15;
  }

  update(dt: number, cx: number, cz: number, windX: number) {
    if (!this.points.visible) return;
    const pos = this.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < this.count; i++) {
      arr[i * 3 + 1] -= this.vel[i] * dt;
      arr[i * 3] += windX * dt;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3 + 1] = 100 + Math.random() * 30;
        arr[i * 3] = cx + (Math.random() - 0.5) * this.area;
        arr[i * 3 + 2] = cz + (Math.random() - 0.5) * this.area;
      }
    }
    pos.needsUpdate = true;
  }
}
