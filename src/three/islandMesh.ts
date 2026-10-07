// PHÄNOMENAUTIK 2 — Prozedurale Low-Poly-Inseln mit natürlicher Polygonoptik,
// Brandungs-Splash an der Wasserlinie und Treibholz-Feldern.

import * as THREE from "three";
import type { PhenomenonDef } from "../game/data";
import { sampleWaveHeight } from "./water";
import type { ParticleSystem } from "./particles";

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface Island3D {
  group: THREE.Group;
  x: number;
  z: number;
  radius: number;      // Strandradius (Kollision + Schaum)
  def: PhenomenonDef;
  shorePoints: { x: number; z: number }[];
  setOvercome: (v: boolean) => void;
}

export function buildIsland(def: PhenomenonDef, x: number, z: number, seed: number, overcome: boolean): Island3D {
  const rand = seeded(seed);
  const g = new THREE.Group();
  const R = def.final ? 95 : 55 + rand() * 18;

  const hueColor = new THREE.Color().setHSL(((def.hue % 360) + 360) % 360 / 360, 0.5, 0.42);
  const sandMat = new THREE.MeshLambertMaterial({ color: 0xcbb98f, flatShading: true });
  const rockCalm = new THREE.MeshLambertMaterial({ color: 0x6f9a58, flatShading: true });
  const rockStorm = new THREE.MeshLambertMaterial({ color: hueColor.clone().multiplyScalar(0.8), flatShading: true });
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x1c1226, flatShading: true });

  // ── Bergkörper: radial verformter Kegel, Flat-Shading ──
  const segs = 9 + Math.floor(rand() * 4);
  const bodyGeo = new THREE.CylinderGeometry(R * 0.16, R, R * (def.final ? 1.5 : 0.75), segs, 3);
  const bp = bodyGeo.getAttribute("position");
  for (let i = 0; i < bp.count; i++) {
    const px = bp.getX(i);
    const pz = bp.getZ(i);
    const py = bp.getY(i);
    const ang = Math.atan2(pz, px);
    const wobble = 1 + (rand() - 0.5) * 0.34 + Math.sin(ang * 3 + seed) * 0.09;
    bp.setX(i, px * wobble);
    bp.setZ(i, pz * wobble);
    // zufällige Terrassen
    bp.setY(i, py + (rand() - 0.5) * R * 0.06 * (1 - Math.abs(py) / R));
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, overcome ? rockCalm : def.final ? darkMat : rockStorm);
  body.position.y = R * (def.final ? 0.55 : 0.22);
  g.add(body);

  // ── Strandring ──
  const beachGeo = new THREE.CylinderGeometry(R * 1.02, R * 1.28, R * 0.16, segs, 1);
  const beach = new THREE.Mesh(beachGeo, sandMat);
  beach.position.y = R * 0.02;
  g.add(beach);

  // ── Felsen ──
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rocks: THREE.Mesh[] = [];
  const nRocks = def.final ? 8 : 4 + Math.floor(rand() * 4);
  for (let i = 0; i < nRocks; i++) {
    const r = new THREE.Mesh(rockGeo, overcome ? rockCalm : rockStorm);
    const a = rand() * Math.PI * 2;
    const d = R * (0.45 + rand() * 0.5);
    r.position.set(Math.cos(a) * d, R * 0.1 + rand() * R * 0.25, Math.sin(a) * d);
    const s = R * (0.07 + rand() * 0.12);
    r.scale.set(s, s * (0.7 + rand() * 0.7), s);
    r.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    rocks.push(r);
    g.add(r);
  }

  // ── Vegetation: Low-Poly-Bäume (erscheinen nach Befriedung üppiger) ──
  const trees: THREE.Group[] = [];
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a, flatShading: true });
  const leafStorm = new THREE.MeshLambertMaterial({ color: hueColor.clone().offsetHSL(0, -0.1, -0.08), flatShading: true });
  const leafCalm = new THREE.MeshLambertMaterial({ color: 0x5d9448, flatShading: true });
  const nTrees = def.final ? 0 : 5 + Math.floor(rand() * 4);
  for (let i = 0; i < nTrees; i++) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 5, 5), trunkMat);
    trunk.position.y = 2.5;
    tree.add(trunk);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(3.4, 7, 6), overcome ? leafCalm : leafStorm);
    crown.position.y = 7.5;
    crown.rotation.y = rand() * 3;
    tree.add(crown);
    const a = rand() * Math.PI * 2;
    const d = R * (0.3 + rand() * 0.4);
    tree.position.set(Math.cos(a) * d, R * 0.18 + rand() * R * 0.2, Math.sin(a) * d);
    const ts = 0.8 + rand() * 0.9;
    tree.scale.setScalar(ts);
    trees.push(tree);
    g.add(tree);
  }

  // ── Finales Zentrum: dunkler Turm ──
  if (def.final) {
    const spire = new THREE.Mesh(new THREE.ConeGeometry(R * 0.2, R * 1.6, 7), darkMat);
    spire.position.y = R * 1.2;
    g.add(spire);
  }

  g.position.set(x, 0, z);

  // Brandungspunkte am Strandradius
  const shorePoints: { x: number; z: number }[] = [];
  const nShore = 14;
  for (let i = 0; i < nShore; i++) {
    const a = (i / nShore) * Math.PI * 2;
    shorePoints.push({ x: x + Math.cos(a) * R * 1.12, z: z + Math.sin(a) * R * 1.12 });
  }

  const mats = { bodyMesh: body, rocks, trees, leafCalm, leafStorm, rockCalm, rockStorm };

  return {
    group: g,
    x,
    z,
    radius: R * 1.28,
    def,
    shorePoints,
    setOvercome(v: boolean) {
      mats.bodyMesh.material = v ? mats.rockCalm : def.final ? darkMat : mats.rockStorm;
      for (const r of mats.rocks) r.material = v ? mats.rockCalm : mats.rockStorm;
      for (const tr of mats.trees) {
        const crown = tr.children[1] as THREE.Mesh;
        crown.material = v ? mats.leafCalm : mats.leafStorm;
      }
    },
  };
}

/** Brandung: dort, wo eine Welle über den Strandradius läuft → Gischt-Burst */
export function updateIslandSurf(
  islands: Island3D[],
  t: number,
  storm: number,
  particles: ParticleSystem,
  camX: number,
  camZ: number,
) {
  for (const isl of islands) {
    const dCam = Math.hypot(isl.x - camX, isl.z - camZ);
    if (dCam > 700) continue; // nur in Sichtweite simulieren
    for (const p of isl.shorePoints) {
      const h = sampleWaveHeight(p.x, p.z, t, storm);
      const threshold = 1.4 - storm * 0.8;
      if (h > threshold && Math.random() < 0.10 + storm * 0.12) {
        particles.burst(6, {
          x: p.x, y: h + 0.5, z: p.z,
          vx: (isl.x - p.x) * 0.05, vy: 5 + Math.random() * 4 + storm * 4, vz: (isl.z - p.z) * 0.05,
          spread: 4, life: 0.9, size: 2.2,
          color: [0.92, 0.97, 1.0], gravity: 13, drag: 0.97,
        });
      }
    }
  }
}

// ─── Treibholz ────────────────────────────────────────────────────

export interface Driftwood {
  mesh: THREE.Mesh;
  x: number;
  z: number;
  taken: boolean;
  respawn: number;
}

export function makeDriftwoodField(count: number, worldSize: number, avoid: { x: number; z: number; r: number }[]): Driftwood[] {
  const geo = new THREE.BoxGeometry(4.5, 0.6, 1.1);
  const mat = new THREE.MeshLambertMaterial({ color: 0xd8b34a, flatShading: true, emissive: 0x3a2c08 });
  const list: Driftwood[] = [];
  let guard = 0;
  while (list.length < count && guard++ < count * 60) {
    const x = 150 + Math.random() * (worldSize - 300);
    const z = 150 + Math.random() * (worldSize - 300);
    if (avoid.some((a) => Math.hypot(x - a.x, z - a.z) < a.r + 90)) continue;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.5, z);
    mesh.rotation.y = Math.random() * Math.PI;
    list.push({ mesh, x, z, taken: false, respawn: 0 });
  }
  return list;
}

export function updateDriftwood(list: Driftwood[], t: number, storm: number, dt: number) {
  for (const d of list) {
    if (d.taken) {
      d.respawn -= dt;
      d.mesh.visible = false;
      if (d.respawn <= 0) {
        d.taken = false;
        d.mesh.visible = true;
      }
      continue;
    }
    d.mesh.position.y = sampleWaveHeight(d.x, d.z, t, storm) + 0.35;
    d.mesh.rotation.x = Math.sin(t * 1.3 + d.x) * 0.15;
    d.mesh.rotation.z = Math.cos(t * 1.1 + d.z) * 0.15;
  }
}
