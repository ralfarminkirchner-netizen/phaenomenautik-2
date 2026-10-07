// PHÄNOMENAUTIK 2 — Kampfbühne: eigene kleine 3D-Szene (Wasser, Insel-Silhouette,
// spektrales Phänomen, Partikel) mit Treffer-/Angriffs-/Auflösungs-Choreografie.

import * as THREE from "three";
import type { PhenomenonDef } from "../game/data";
import { Water } from "./water";
import { Creature } from "./creature";
import { ParticleSystem } from "./particles";
import { buildIsland, type Island3D } from "./islandMesh";

export class BattleStage {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private water!: Water;
  private creature!: Creature;
  private particles = new ParticleSystem(1500);
  private island!: Island3D;
  private raf = 0;
  private t = 0;
  private last = 0;
  private shake = 0;
  private disposed = false;
  private stormBase: number;
  private container: HTMLElement;
  private def: PhenomenonDef;

  constructor(container: HTMLElement, def: PhenomenonDef) {
    this.container = container;
    this.def = def;
    this.stormBase = def.final ? 0.7 : 0.35;
  }

  start() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const fogColor = new THREE.Color().setHSL((((this.def.hue % 360) + 360) % 360) / 360, 0.35, 0.12);
    this.scene.background = fogColor;
    this.scene.fog = new THREE.Fog(fogColor, 60, 400);

    this.camera = new THREE.PerspectiveCamera(55, w / h, 0.5, 1000);
    this.camera.position.set(0, 10, 42);

    // Licht: kühles Ambient + farbiges Phänomen-Licht
    this.scene.add(new THREE.HemisphereLight(0x8fa8c8, 0x101828, 0.8));
    const key = new THREE.PointLight(0xffffff, 60, 200);
    key.color.setHSL((((this.def.hue % 360) + 360) % 360) / 360, 0.6, 0.6);
    key.position.set(0, 22, -18);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xbfd4ff, 1.2);
    rim.position.set(-30, 40, 30);
    this.scene.add(rim);

    // Wasser (kleine Bühne → geringere Auflösung genügt)
    this.water = new Water({ x: 0, z: 0 }, 700, 80);
    this.water.setIslands([{ x: 0, z: -95, r: 70 }]);
    this.scene.add(this.water.mesh);

    // Insel-Silhouette
    this.island = buildIsland(this.def, 0, -95, this.def.hue * 7 + 13, false);
    this.scene.add(this.island.group);

    // Das Phänomen
    this.creature = new Creature(this.def, this.def.final ? 2.0 : 1.35);
    this.creature.group.position.set(0, 12, -14);
    this.scene.add(this.creature.group);

    this.scene.add(this.particles.points);

    window.addEventListener("resize", this.onResize);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  hit() {
    this.creature.hit();
    this.particles.burst(22, {
      x: this.creature.group.position.x,
      y: this.creature.group.position.y,
      z: this.creature.group.position.z + 4,
      vy: 5, spread: 10, life: 0.9, size: 2.4,
      color: [1.0, 0.95, 0.75], gravity: 8, drag: 0.95,
    });
  }

  enemyAttack() {
    this.creature.attack();
    this.shake = 1;
  }

  heal() {
    this.particles.burst(16, {
      x: 0, y: 4, z: 16, vy: 4, spread: 6, life: 1.2, size: 2,
      color: [0.6, 1.0, 0.7], gravity: -2, drag: 0.97,
    });
  }

  understand() {
    this.creature.setPeace(0.4);
    this.particles.burst(18, {
      x: this.creature.group.position.x,
      y: this.creature.group.position.y + 4,
      z: this.creature.group.position.z,
      vy: 2.5, spread: 9, life: 1.6, size: 2,
      color: [0.8, 0.75, 1.0], gravity: -1, drag: 0.97,
    });
  }

  win(peaceful: boolean) {
    if (peaceful) this.creature.setPeace(1);
    setTimeout(() => this.creature.dissolve(this.particles), peaceful ? 900 : 350);
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    const t = this.t;

    this.shake = Math.max(0, this.shake - dt * 1.8);
    this.water.setMood(this.stormBase);
    this.water.update(t, this.camera.position);
    this.creature.update(t, dt, this.particles);
    this.particles.update(dt);

    const cx = Math.sin(t * 0.23) * 4;
    this.camera.position.x = cx + (Math.random() - 0.5) * this.shake * 3;
    this.camera.position.y = 10 + Math.sin(t * 0.4) * 1.2 + (Math.random() - 0.5) * this.shake * 2;
    this.camera.lookAt(0, 10, -12);

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
