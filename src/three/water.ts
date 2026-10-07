// PHÄNOMENAUTIK 2 — Echtzeitwasser: Gerstner-Wellen im Vertex-Shader,
// Transparenz, Fresnel, Kamm- und Ufer-Schaum (dynamisch um jede Insel),
// CPU-Sampler für Schiffsphysik, Brandung und Treibholz-Bewegung.

import * as THREE from "three";

export interface GerstnerWave {
  dirX: number;
  dirZ: number;
  steepness: number;
  wavelength: number;
  speed: number;
}

// 5 Hauptwellen + 2 Chop-Wellen
export const WAVES: GerstnerWave[] = [
  { dirX: 1.0, dirZ: 0.2, steepness: 0.16, wavelength: 60, speed: 9 },
  { dirX: -0.7, dirZ: 0.7, steepness: 0.14, wavelength: 38, speed: 7 },
  { dirX: 0.3, dirZ: -1.0, steepness: 0.12, wavelength: 24, speed: 6 },
  { dirX: -0.9, dirZ: -0.4, steepness: 0.10, wavelength: 15, speed: 5 },
  { dirX: 0.6, dirZ: 0.8, steepness: 0.08, wavelength: 9, speed: 4 },
  { dirX: 0.2, dirZ: -0.5, steepness: 0.06, wavelength: 4.5, speed: 3.2 },
  { dirX: -0.4, dirZ: 0.1, steepness: 0.05, wavelength: 2.6, speed: 2.6 },
];

const amp = (w: GerstnerWave) => (w.steepness * w.wavelength) / (2 * Math.PI) / WAVES.length;

/** CPU-Wellenhöhe (spiegelt den Shader) — für Physik und Brandung */
export function sampleWaveHeight(x: number, z: number, t: number, storm: number): number {
  let y = 0;
  const mult = 1 + storm * 1.6;
  for (const w of WAVES) {
    const k = (2 * Math.PI) / w.wavelength;
    const f = k * (w.dirX * x + w.dirZ * z - w.speed * t);
    y += amp(w) * mult * Math.sin(f);
  }
  return y;
}

/** Wellennormale per finitem Differenz — für Schiffs-Nick/Roll */
export function sampleWaveNormal(x: number, z: number, t: number, storm: number, out: THREE.Vector3): THREE.Vector3 {
  const e = 0.6;
  const hL = sampleWaveHeight(x - e, z, t, storm);
  const hR = sampleWaveHeight(x + e, z, t, storm);
  const hD = sampleWaveHeight(x, z - e, t, storm);
  const hU = sampleWaveHeight(x, z + e, t, storm);
  out.set(hL - hR, 2 * e, hD - hU).normalize();
  return out;
}

const MAX_ISLANDS = 16;

const VERT = /* glsl */ `
uniform float uTime;
uniform float uStorm;
uniform vec4 uWaves[${WAVES.length}]; // dirX, dirZ, steepness, wavelength
uniform float uSpeed[${WAVES.length}];
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vCrest;

void main() {
  vec3 pos = position;
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vec2 xz = world.xz;
  float mult = 1.0 + uStorm * 1.6;

  vec3 disp = vec3(0.0);
  vec3 tang = vec3(1.0, 0.0, 0.0);
  vec3 binm = vec3(0.0, 0.0, 1.0);
  float crest = 0.0;

  for (int i = 0; i < ${WAVES.length}; i++) {
    vec2 dir = normalize(uWaves[i].xy);
    float steep = uWaves[i].z;
    float len = uWaves[i].w;
    float k = 6.28318 / len;
    float a = (steep * len / 6.28318) / float(${WAVES.length}) * mult;
    float f = k * (dot(dir, xz) - uSpeed[i] * uTime);
    float sf = sin(f);
    float cf = cos(f);

    disp.x += dir.x * a * cf * 0.8;
    disp.z += dir.y * a * cf * 0.8;
    disp.y += a * sf;

    float wa = k * a;
    tang += vec3(-dir.x * dir.x * wa * sf, dir.x * wa * cf, -dir.x * dir.y * wa * sf);
    binm += vec3(-dir.x * dir.y * wa * sf, dir.y * wa * cf, -dir.y * dir.y * wa * sf);
    crest += sf * steep;
  }

  world.xyz += disp;
  vWorldPos = world.xyz;
  vNormal = normalize(cross(binm, tang));
  vCrest = crest;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const FRAG = /* glsl */ `
uniform vec3 uSunDir;
uniform vec3 uCamPos;
uniform float uTime;
uniform float uStorm;
uniform vec3 uIslands[${MAX_ISLANDS}]; // x, z, radius
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec3 uSky;
varying vec3 vWorldPos;
varying vec3 vNormal;
varying float vCrest;

// einfaches Value-Noise für Schaum-Textur
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vWorldPos);

  // Tiefen-/Kammfarbe
  float heightMix = clamp(vCrest * 1.4 + 0.5, 0.0, 1.0);
  vec3 col = mix(uDeep, uShallow, heightMix * 0.6);

  // Fresnel → Himmelsreflexion
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  col = mix(col, uSky, fres * 0.55);

  // Sonnenglanz
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(N, H), 0.0), 220.0) * 1.4;
  col += vec3(1.0, 0.95, 0.8) * spec;

  // ── Schaum ──
  float foamTex = noise(vWorldPos.xz * 0.35 + uTime * 0.25) * 0.6
                + noise(vWorldPos.xz * 0.9 - uTime * 0.4) * 0.4;

  // Kamm-Schaum (Wellenspitzen)
  float crestFoam = smoothstep(0.55, 0.95, vCrest * (1.0 + uStorm * 0.7)) * foamTex;

  // Ufer-Schaum: ringförmig um jede Insel, atmend mit den Wellen
  float shoreFoam = 0.0;
  for (int i = 0; i < ${MAX_ISLANDS}; i++) {
    vec3 isl = uIslands[i];
    if (isl.z <= 0.0) continue;
    float d = distance(vWorldPos.xz, isl.xy);
    float band = exp(-pow((d - isl.z) / 14.0, 2.0));           // enger Ring
    float band2 = exp(-pow((d - isl.z - 18.0) / 22.0, 2.0));   // zweite Brecherlinie
    float wavePulse = 0.55 + 0.45 * sin(uTime * 1.6 - d * 0.12);
    shoreFoam += band * wavePulse + band2 * 0.5 * (0.5 + 0.5 * sin(uTime * 1.1 - d * 0.07 + 2.0));
  }
  shoreFoam = clamp(shoreFoam, 0.0, 1.0) * foamTex * 1.6;

  // Sturm-Gischtflächen
  float stormFoam = uStorm * smoothstep(0.45, 0.9, foamTex) * 0.35;

  float foam = clamp(crestFoam + shoreFoam + stormFoam, 0.0, 1.0);
  col = mix(col, vec3(0.93, 0.97, 1.0), foam);

  float alpha = 0.86 + fres * 0.1;
  alpha = max(alpha, foam);
  gl_FragColor = vec4(col, alpha);
}
`;

export class Water {
  mesh: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  storm = 0;

  constructor(worldCenter: { x: number; z: number }, worldSize: number, segments = 230) {
    const size = worldSize + 1600;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const waves4: THREE.Vector4[] = WAVES.map((w) => new THREE.Vector4(w.dirX, w.dirZ, w.steepness, w.wavelength));
    const speeds = WAVES.map((w) => w.speed);

    this.mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
      uniforms: {
        uTime: { value: 0 },
        uStorm: { value: 0 },
        uWaves: { value: waves4 },
        uSpeed: { value: speeds },
        uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3).normalize() },
        uCamPos: { value: new THREE.Vector3() },
        uIslands: { value: Array.from({ length: MAX_ISLANDS }, () => new THREE.Vector3(0, 0, 0)) },
        uDeep: { value: new THREE.Color(0x0b3a54) },
        uShallow: { value: new THREE.Color(0x2e8aa8) },
        uSky: { value: new THREE.Color(0xbfe0ef) },
      },
    });

    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.position.set(worldCenter.x, 0, worldCenter.z);
    this.mesh.frustumCulled = false;
  }

  /** Inseln für den Ufer-Schaum registrieren: (x, z, radius) */
  setIslands(list: { x: number; z: number; r: number }[]) {
    const arr = this.mat.uniforms.uIslands.value as THREE.Vector3[];
    for (let i = 0; i < MAX_ISLANDS; i++) {
      if (i < list.length) arr[i].set(list[i].x, list[i].z, list[i].r);
      else arr[i].set(0, 0, 0);
    }
  }

  setMood(storm: number) {
    this.storm = storm;
    this.mat.uniforms.uStorm.value = storm;
    const deep = this.mat.uniforms.uDeep.value as THREE.Color;
    const shallow = this.mat.uniforms.uShallow.value as THREE.Color;
    const sky = this.mat.uniforms.uSky.value as THREE.Color;
    deep.setHex(0x0b3a54).lerp(new THREE.Color(0x101c2c), storm);
    shallow.setHex(0x2e8aa8).lerp(new THREE.Color(0x2a3c50), storm);
    sky.setHex(0xbfe0ef).lerp(new THREE.Color(0x5a6a80), storm);
  }

  update(t: number, camPos: THREE.Vector3) {
    this.mat.uniforms.uTime.value = t;
    this.mat.uniforms.uCamPos.value.copy(camPos);
  }
}
