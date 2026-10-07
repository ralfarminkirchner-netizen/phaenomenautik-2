// PHÄNOMENAUTIK 2 — Low-Poly-Schiff „MS Toleranz“ mit Wellenphysik:
// Schaukeln (Nick/Roll aus Wellennormale), Hüpfen über Kämme, Bug-Gischt,
// Kielwasser-Schaumspur.

import * as THREE from "three";
import { sampleWaveHeight } from "./water";
import type { ParticleSystem } from "./particles";

export function buildShipMesh(): THREE.Group {
  const g = new THREE.Group();
  const wood = new THREE.MeshLambertMaterial({ color: 0x8a5a32, flatShading: true });
  const woodDark = new THREE.MeshLambertMaterial({ color: 0x5a3a22, flatShading: true });
  const sailMat = new THREE.MeshLambertMaterial({ color: 0xf3e9d2, side: THREE.DoubleSide, flatShading: true });
  const goldMat = new THREE.MeshLambertMaterial({ color: 0xc9a24b, flatShading: true });

  // Rumpf: länglicher, spitz zulaufender Körper (6-seitiger Kegel, skaliert)
  const hullGeo = new THREE.CylinderGeometry(0.02, 1.6, 9, 6, 3);
  hullGeo.rotateX(Math.PI / 2); // Spitze nach vorne (-z)
  const pos = hullGeo.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    // zum Heck (hinten, +z) breiter, nach oben wölben
    pos.setX(i, pos.getX(i) * (1.0 + Math.max(0, z) * 0.06));
    pos.setY(i, pos.getY(i) + Math.abs(z) * 0.05);
  }
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, wood);
  hull.scale.set(1.1, 0.9, 1);
  hull.position.y = 0.4;
  g.add(hull);

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 6.5), woodDark);
  deck.position.set(0, 1.05, 0.6);
  g.add(deck);

  // Reling-Blöcke
  for (const s of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 5.6), woodDark);
    rail.position.set(s * 1.25, 1.4, 0.6);
    g.add(rail);
  }

  // Mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 8.5, 6), woodDark);
  mast.position.set(0, 5.2, 0.4);
  g.add(mast);

  // Großsegel (leicht gebogene Fläche)
  const sailGeo = new THREE.PlaneGeometry(4.2, 5.4, 6, 6);
  const sp = sailGeo.getAttribute("position");
  for (let i = 0; i < sp.count; i++) {
    const x = sp.getX(i);
    sp.setZ(i, Math.pow(Math.abs(x) / 2.1, 2) * 0.9);
  }
  sailGeo.computeVertexNormals();
  const sail = new THREE.Mesh(sailGeo, sailMat);
  sail.position.set(0, 5.6, 0.75);
  g.add(sail);

  // Rah
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.8, 5), woodDark);
  boom.rotation.z = Math.PI / 2;
  boom.position.set(0, 2.9, 0.75);
  g.add(boom);

  // Flagge (Toleranzfenster-Symbol)
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.75), goldMat);
  flag.position.set(0.62, 9.1, 0.4);
  g.add(flag);
  g.userData.flag = flag;

  // Hecklaterne (warmes Licht)
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.28, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffd890 }));
  lantern.position.set(0, 2.1, 4.2);
  g.add(lantern);
  const lamp = new THREE.PointLight(0xffc86e, 12, 26, 1.8);
  lamp.position.copy(lantern.position);
  g.add(lamp);

  return g;
}

export class ShipPhysics {
  group: THREE.Group;
  x: number;
  z: number;
  heading: number;
  vx = 0;
  vz = 0;
  private ySmooth = 0;
  private pitchSmooth = 0;
  private rollSmooth = 0;
  private prevWaveY = 0;
  speedLevel = 0;

  constructor(mesh: THREE.Group, x: number, z: number, heading: number) {
    this.group = mesh;
    this.x = x;
    this.z = z;
    this.heading = heading;
  }

  get speed() {
    return Math.hypot(this.vx, this.vz);
  }

  update(
    dt: number,
    t: number,
    storm: number,
    input: { thrust: number; turn: number },
    particles: ParticleSystem,
  ) {
    // Steuerung
    this.heading -= input.turn * dt * 1.9;
    const maxPower = 46 + this.speedLevel * 14;
    const power = maxPower * (1 - storm * 0.18);
    const fx = Math.sin(this.heading);
    const fz = Math.cos(this.heading);
    this.vx += fx * input.thrust * power * dt;
    this.vz += fz * input.thrust * power * dt;
    // Winddrift im Sturm
    this.vx += Math.sin(t * 0.6) * storm * 5.5 * dt;
    this.vz += Math.cos(t * 0.45) * storm * 5.5 * dt;
    const drag = Math.pow(0.32, dt);
    this.vx *= drag;
    this.vz *= drag;
    this.x += this.vx * dt;
    this.z += this.vz * dt;

    // ── Wellenfolge: Höhe an Bug und Heck → Nick; Backbord/Steuerbord → Roll ──
    const bowX = this.x + fx * 3.2, bowZ = this.z + fz * 3.2;
    const sternX = this.x - fx * 3.2, sternZ = this.z - fz * 3.2;
    const sideX = -fz, sideZ = fx;
    const portX = this.x + sideX * 1.6, portZ = this.z + sideZ * 1.6;
    const starX = this.x - sideX * 1.6, starZ = this.z - sideZ * 1.6;

    const hBow = sampleWaveHeight(bowX, bowZ, t, storm);
    const hStern = sampleWaveHeight(sternX, sternZ, t, storm);
    const hPort = sampleWaveHeight(portX, portZ, t, storm);
    const hStar = sampleWaveHeight(starX, starZ, t, storm);
    const hMid = sampleWaveHeight(this.x, this.z, t, storm);

    // Hüpfen: das Schiff folgt der Welle träge → bei schnellem Kammdurchlauf „airtime“
    const followLag = 1 - Math.min(0.55, this.speed * 0.012);
    const yTarget = hMid + 0.55;
    this.ySmooth += (yTarget - this.ySmooth) * Math.min(1, dt * 9 * followLag + dt * 2);
    const waveVy = (hMid - this.prevWaveY) / Math.max(dt, 0.001);
    this.prevWaveY = hMid;

    const pitchTarget = Math.atan2(hStern - hBow, 6.4);
    const rollTarget = Math.atan2(hStar - hPort, 3.2);
    this.pitchSmooth += (pitchTarget - this.pitchSmooth) * Math.min(1, dt * 6);
    this.rollSmooth += (rollTarget - this.rollSmooth) * Math.min(1, dt * 6);

    this.group.position.set(this.x, this.ySmooth, this.z);
    this.group.rotation.set(0, 0, 0);
    this.group.rotateY(this.heading + Math.PI);
    this.group.rotateX(this.pitchSmooth);
    this.group.rotateZ(this.rollSmooth + Math.sin(t * 1.4) * 0.012);

    // Flagge flattern
    const flag = this.group.userData.flag as THREE.Mesh | undefined;
    if (flag) flag.rotation.y = Math.sin(t * 9) * 0.35 * (0.5 + storm);

    // ── Bug-Gischt bei harten Wellenschlägen ──
    if (waveVy < -6 && this.speed > 12 && Math.random() < 0.55) {
      particles.burst(10, {
        x: bowX, y: hBow + 0.6, z: bowZ,
        vx: fx * 6, vy: 7 + Math.random() * 4, vz: fz * 6,
        spread: 3.5, life: 0.8, size: 2.4,
        color: [0.92, 0.97, 1.0], gravity: 16, drag: 0.97,
      });
    }
    // Hüpf-Spritzer bei Landung
    if (waveVy > 7 && this.speed > 16 && Math.random() < 0.4) {
      particles.burst(14, {
        x: this.x, y: hMid + 0.4, z: this.z,
        vy: 8, spread: 6, life: 0.7, size: 2.6,
        color: [0.9, 0.96, 1.0], gravity: 18, drag: 0.96,
      });
    }
    // Kielwasser
    if (this.speed > 6 && Math.random() < 0.6) {
      particles.spawn({
        x: this.x - fx * 4, y: hStern + 0.35, z: this.z - fz * 4,
        vx: -fx * 2 + (Math.random() - 0.5) * 2, vy: 0.4, vz: -fz * 2 + (Math.random() - 0.5) * 2,
        life: 1.6, size: 3.2, color: [0.88, 0.95, 0.99], drag: 0.95, fadeIn: 0.04,
      });
    }
    // Sturm-Sprühregen am Bug
    if (storm > 0.5 && this.speed > 10 && Math.random() < storm * 0.5) {
      particles.spawn({
        x: bowX, y: hBow + 1.2, z: bowZ,
        vx: fx * 10, vy: 5, vz: fz * 10,
        life: 0.5, size: 1.8, color: [0.85, 0.9, 0.96], gravity: 14, drag: 0.96,
      });
    }
  }
}
