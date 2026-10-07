// PHÄNOMENAUTIK 2 — Der Ankerplatz: Hafeninsel mit Pier, Hütten, Lagerfeuer
// und begehbaren Low-Poly-NPCs (Idle-Animation, Namensschilder, Sprechradius).

import * as THREE from "three";
import type { NpcDef } from "../game/npc";
import { NPCS } from "../game/npc";
import { sampleWaveHeight } from "./water";
import type { ParticleSystem } from "./particles";

function makeLabel(text: string): THREE.Sprite {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 80;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgba(10, 16, 28, 0.75)";
  ctx.beginPath();
  ctx.roundRect(14, 10, 228, 52, 14);
  ctx.fill();
  ctx.strokeStyle = "rgba(216, 230, 242, 0.9)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = "#f0e9d2";
  ctx.font = "bold 30px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.fillText(text, 128, 46);
  const tex = new THREE.CanvasTexture(c);
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  spr.scale.set(16, 5, 1);
  return spr;
}

export interface NpcActor {
  def: NpcDef;
  group: THREE.Group;
  worldX: number;
  worldZ: number;
  speakRadius: number;
}

export class Harbor {
  group = new THREE.Group();
  npcs: NpcActor[] = [];
  dockPoint: THREE.Vector3; // hier kann das Schiff anlegen
  radius = 120;
  private fireLight: THREE.PointLight;
  private firePos: THREE.Vector3;
  private boats: THREE.Group[] = [];

  constructor(cx: number, cz: number) {
    const g = this.group;
    g.position.set(cx, 0, cz);

    const sand = new THREE.MeshLambertMaterial({ color: 0xd6c49a, flatShading: true });
    const grass = new THREE.MeshLambertMaterial({ color: 0x77a85c, flatShading: true });
    const wood = new THREE.MeshLambertMaterial({ color: 0x7a5230, flatShading: true });
    const woodDark = new THREE.MeshLambertMaterial({ color: 0x53371f, flatShading: true });
    const stone = new THREE.MeshLambertMaterial({ color: 0x8a8f96, flatShading: true });

    // Inselkörper (breit, sanft)
    const baseGeo = new THREE.CylinderGeometry(70, 115, 26, 11, 2);
    const bp = baseGeo.getAttribute("position");
    for (let i = 0; i < bp.count; i++) {
      const a = Math.atan2(bp.getZ(i), bp.getX(i));
      const w = 1 + Math.sin(a * 4) * 0.06 + (Math.random() - 0.5) * 0.08;
      bp.setX(i, bp.getX(i) * w);
      bp.setZ(i, bp.getZ(i) * w);
    }
    baseGeo.computeVertexNormals();
    const base = new THREE.Mesh(baseGeo, grass);
    base.position.y = 8;
    g.add(base);
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(115, 135, 10, 11), sand);
    beach.position.y = 0;
    g.add(beach);

    // ── Pier Richtung Süden (dorthin kommt das Schiff) ──
    const pier = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 4), wood);
      plank.position.set(0, 2.2, i * 4.1);
      plank.rotation.y = (Math.random() - 0.5) * 0.05;
      pier.add(plank);
    }
    for (let i = 0; i < 5; i++) {
      for (const s of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 5), woodDark);
        post.position.set(s * 4.6, -0.5, i * 8);
        pier.add(post);
      }
    }
    pier.position.set(0, 0, 108);
    g.add(pier);
    this.dockPoint = new THREE.Vector3(cx + 10, 0, cz + 150);

    // ── Hütten ──
    const hutPositions: [number, number, number][] = [
      [-42, 17, -30],
      [38, 17, -38],
      [48, 17, 25],
    ];
    for (const [hx, hy, hz] of hutPositions) {
      const hut = new THREE.Group();
      const walls = new THREE.Mesh(new THREE.BoxGeometry(16, 10, 13), new THREE.MeshLambertMaterial({ color: 0xc9b088, flatShading: true }));
      walls.position.y = 5;
      hut.add(walls);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(13, 8, 4), new THREE.MeshLambertMaterial({ color: 0x9a5f3a, flatShading: true }));
      roof.position.y = 14;
      roof.rotation.y = Math.PI / 4;
      hut.add(roof);
      const door = new THREE.Mesh(new THREE.BoxGeometry(4, 6.5, 0.6), woodDark);
      door.position.set(0, 3.2, 6.6);
      hut.add(door);
      const win = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 0.5), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
      win.position.set(5, 5.5, 6.6);
      hut.add(win);
      hut.position.set(hx, hy, hz);
      hut.rotation.y = Math.random() * Math.PI * 2;
      g.add(hut);
    }

    // ── Lagerfeuer ──
    this.firePos = new THREE.Vector3(cx, 20, cz + 2);
    const fireG = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      const st = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), stone);
      st.position.set(Math.cos(a) * 4, 0.8, Math.sin(a) * 4);
      fireG.add(st);
    }
    const logs = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 6, 5), woodDark);
    logs.rotation.z = Math.PI / 2;
    logs.rotation.y = 0.5;
    logs.position.y = 1;
    fireG.add(logs);
    const logs2 = logs.clone();
    logs2.rotation.y = -0.6;
    fireG.add(logs2);
    this.fireLight = new THREE.PointLight(0xff9040, 30, 60, 1.7);
    this.fireLight.position.y = 3;
    fireG.add(this.fireLight);
    fireG.position.set(0, 19.5, 2);
    g.add(fireG);

    // Sitzstämme ums Feuer
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 2.4, 6), wood);
      stump.position.set(Math.cos(a) * 8.5, 20.2, Math.sin(a) * 8.5 + 2);
      g.add(stump);
    }

    // ── Bäume ──
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 40 + Math.random() * 45;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 8, 5), wood);
      trunk.position.y = 4;
      tree.add(trunk);
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(5.5, 0), new THREE.MeshLambertMaterial({ color: 0x5d9448, flatShading: true }));
      crown.position.y = 11;
      crown.scale.y = 1.3;
      tree.add(crown);
      tree.position.set(Math.cos(a) * d, 18 + Math.random() * 3, Math.sin(a) * d);
      g.add(tree);
    }

    // ── NPCs ──
    for (const def of NPCS) {
      const actor = this.buildNpc(def);
      g.add(actor.group);
      actor.worldX = cx + def.x;
      actor.worldZ = cz + def.z;
      this.npcs.push(actor);
    }

    // vertäutes Ruderboot als Deko
    const dinghy = new THREE.Group();
    const dhull = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 1.2, 5, 6), wood);
    dhull.geometry.rotateX(Math.PI / 2);
    dinghy.add(dhull);
    dinghy.position.set(-30, 0.4, 128);
    g.add(dinghy);
    this.boats.push(dinghy);
  }

  private buildNpc(def: NpcDef): NpcActor {
    const g = new THREE.Group();
    const robeMat = new THREE.MeshLambertMaterial({ color: def.color, flatShading: true });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xe8c39a, flatShading: true });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 5.5, 6), robeMat);
    body.position.y = 2.75;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.35, 8, 7), skinMat);
    head.position.y = 6.6;
    g.add(head);
    // einfache Kopfbedeckung
    const hat = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.8, 6), robeMat);
    hat.position.y = 7.9;
    g.add(hat);
    // Arme
    for (const s of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 3.4, 5), robeMat);
      arm.position.set(s * 1.9, 4, 0);
      arm.rotation.z = s * 0.25;
      g.add(arm);
    }
    const label = makeLabel(def.name);
    label.position.y = 11.5;
    g.add(label);

    g.position.set(def.x, 19.5 + 1, def.z);
    g.userData.phase = Math.random() * Math.PI * 2;
    // großzügiger Sprechradius: das Schiff bleibt auf Kollisionsdistanz (~120) zur Inselmitte
    return { def, group: g, worldX: 0, worldZ: 0, speakRadius: 175 };
  }

  /** Nächster NPC in Sprechweite */
  nearestNpc(x: number, z: number): NpcActor | null {
    let best: NpcActor | null = null;
    let bd = Infinity;
    for (const n of this.npcs) {
      const d = Math.hypot(x - n.worldX, z - n.worldZ);
      if (d < n.speakRadius && d < bd) {
        best = n;
        bd = d;
      }
    }
    return best;
  }

  update(t: number, storm: number, particles: ParticleSystem) {
    // NPC-Idle: Wiegen + gelegentliches Zudrehen
    for (const n of this.npcs) {
      const ph = n.group.userData.phase as number;
      n.group.position.y = 20.5 + Math.sin(t * 1.6 + ph) * 0.25;
      n.group.rotation.y = Math.sin(t * 0.5 + ph) * 0.6;
    }
    // Feuer: Flackern + Funken
    this.fireLight.intensity = 26 + Math.sin(t * 11) * 4 + Math.random() * 4;
    if (Math.random() < 0.25) {
      particles.spawn({
        x: this.firePos.x + (Math.random() - 0.5) * 3,
        y: this.firePos.y + 1,
        z: this.firePos.z + (Math.random() - 0.5) * 3,
        vy: 5 + Math.random() * 3,
        life: 1.1, size: 1.6,
        color: [1.0, 0.6 + Math.random() * 0.3, 0.2],
        drag: 0.97, gravity: -3,
      });
    }
    // Rauch
    if (Math.random() < 0.12) {
      particles.spawn({
        x: this.firePos.x, y: this.firePos.y + 4, z: this.firePos.z,
        vy: 3, vx: 1, life: 3, size: 4,
        color: [0.5, 0.5, 0.55], drag: 0.98, fadeIn: 0.2,
      });
    }
    // Deko-Boot schaukelt
    for (const b of this.boats) {
      const wp = new THREE.Vector3();
      b.getWorldPosition(wp);
      b.position.y = sampleWaveHeight(wp.x, wp.z, t, storm) + 0.4;
      b.rotation.z = Math.sin(t * 1.4) * 0.06;
    }
  }
}
