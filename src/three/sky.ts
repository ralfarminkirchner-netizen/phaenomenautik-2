// PHÄNOMENAUTIK 2 — Himmel: Gradient-Kuppel mit Sonne, driftende Low-Poly-Wolken,
// Sturm-Verdunkelung und prozedurale Blitze (Bolt-Linien + Blitzlicht)

import * as THREE from "three";

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_Position.z = gl_Position.w; // immer am fernsten Punkt
}
`;

const SKY_FRAG = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform float uFlash;
varying vec3 vDir;
void main() {
  float h = clamp(vDir.y, 0.0, 1.0);
  vec3 col = mix(uHorizon, uZenith, pow(h, 0.7));
  float sun = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
  col += vec3(1.0, 0.9, 0.7) * pow(sun, 350.0) * 2.0;  // Scheibe
  col += vec3(1.0, 0.85, 0.6) * pow(sun, 8.0) * 0.18;  // Gloriole
  col = mix(col, vec3(0.9, 0.93, 1.0), uFlash * 0.85); // Blitz
  gl_FragColor = vec4(col, 1.0);
}
`;

export class Sky {
  group = new THREE.Group();
  sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
  ambient = new THREE.HemisphereLight(0xbfd8e8, 0x1a2a3a, 0.9);
  flash = 0;
  private mat: THREE.ShaderMaterial;
  private clouds: THREE.Mesh[] = [];
  private bolt: THREE.LineSegments;
  private boltLife = 0;
  private storm = 0;

  constructor(worldSize: number) {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: SKY_VERT,
      fragmentShader: SKY_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uZenith: { value: new THREE.Color(0x3d7cb8) },
        uHorizon: { value: new THREE.Color(0xcfe8f2) },
        uSunDir: { value: new THREE.Vector3(0.5, 0.55, 0.3).normalize() },
        uFlash: { value: 0 },
      },
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(worldSize * 0.9, 24, 16), this.mat);
    dome.frustumCulled = false;
    this.group.add(dome);

    const sunDir = this.mat.uniforms.uSunDir.value as THREE.Vector3;
    this.sun.position.copy(sunDir).multiplyScalar(500);
    this.group.add(this.sun);
    this.group.add(this.ambient);

    // Low-Poly-Wolken: abgeflachte Icosaeder-Cluster
    const cloudGeo = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 22; i++) {
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true, transparent: true, opacity: 0.9 });
      const cluster = new THREE.Group();
      const blobs = 3 + Math.floor(Math.random() * 3);
      for (let b = 0; b < blobs; b++) {
        const m = new THREE.Mesh(cloudGeo, mat);
        m.position.set((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 26);
        m.scale.set(14 + Math.random() * 20, 5 + Math.random() * 6, 10 + Math.random() * 12);
        cluster.add(m);
      }
      const holder = cluster as unknown as THREE.Mesh;
      holder.position.set((Math.random() - 0.5) * worldSize, 150 + Math.random() * 90, (Math.random() - 0.5) * worldSize);
      holder.userData.vx = 2 + Math.random() * 3;
      this.clouds.push(holder);
      this.group.add(holder);
    }

    // Blitz (unsichtbar bis Zündung)
    const boltGeo = new THREE.BufferGeometry();
    boltGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(60 * 3), 3).setUsage(THREE.DynamicDrawUsage));
    this.bolt = new THREE.LineSegments(
      boltGeo,
      new THREE.LineBasicMaterial({ color: 0xeef2ff, transparent: true, opacity: 0 }),
    );
    this.bolt.frustumCulled = false;
    this.group.add(this.bolt);
  }

  /** Sturmstärke 0..1 steuert Farben, Wolken, Licht */
  setStorm(v: number) {
    this.storm = v;
    const z = this.mat.uniforms.uZenith.value as THREE.Color;
    const h = this.mat.uniforms.uHorizon.value as THREE.Color;
    z.setHex(0x3d7cb8).lerp(new THREE.Color(0x141c2e), v);
    h.setHex(0xcfe8f2).lerp(new THREE.Color(0x3a4358), v);
    this.sun.intensity = 1.6 * (1 - v * 0.75);
    this.ambient.intensity = 0.9 * (1 - v * 0.45);
    for (const c of this.clouds) {
      const mat = (c.children[0] as THREE.Mesh).material as THREE.MeshLambertMaterial;
      mat.color.setHex(0xffffff).lerp(new THREE.Color(0x3c4356), v);
      mat.opacity = 0.9 - v * 0.1;
    }
  }

  /** Blitz zünden: gezackte Hauptlinie + Verzweigungen, Lichthöhepunkt */
  strike(x: number, z: number) {
    const pos = this.bolt.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    let px = x, py = 170, pz = z;
    let vi = 0;
    const segments = 14;
    for (let i = 0; i < segments; i++) {
      const nx = px + (Math.random() - 0.5) * 22;
      const ny = py - 170 / segments;
      const nz = pz + (Math.random() - 0.5) * 22;
      arr[vi++] = px; arr[vi++] = py; arr[vi++] = pz;
      arr[vi++] = nx; arr[vi++] = ny; arr[vi++] = nz;
      // gelegentliche Seitenverzweigung
      if (Math.random() < 0.35 && vi < arr.length - 12) {
        arr[vi++] = nx; arr[vi++] = ny; arr[vi++] = nz;
        arr[vi++] = nx + (Math.random() - 0.5) * 30; arr[vi++] = ny - 14; arr[vi++] = nz + (Math.random() - 0.5) * 30;
      }
      px = nx; py = ny; pz = nz;
    }
    pos.needsUpdate = true;
    this.boltLife = 1;
    this.flash = 1;
  }

  update(dt: number, t: number, worldSize: number, camX: number, camZ: number) {
    // Wolken driften + um Kamera wrappen
    for (const c of this.clouds) {
      c.position.x += (c.userData.vx as number) * (1 + this.storm * 2.2) * dt;
      if (c.position.x - camX > worldSize * 0.55) c.position.x -= worldSize * 1.1;
      if (camX - c.position.x > worldSize * 0.55) c.position.x += worldSize * 1.1;
      c.position.y += Math.sin(t * 0.2 + c.position.z * 0.01) * dt * 2;
    }
    // Blitz ausblenden
    if (this.boltLife > 0) {
      this.boltLife = Math.max(0, this.boltLife - dt * 3.2);
      (this.bolt.material as THREE.LineBasicMaterial).opacity = this.boltLife * (0.5 + Math.random() * 0.5);
    }
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.mat.uniforms.uFlash.value = this.flash;
    this.group.position.set(camX, 0, camZ);
  }
}
