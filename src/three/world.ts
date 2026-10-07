// PHÄNOMENAUTIK 2 — SeaWorld: Orchestriert Renderer, Wasser, Himmel, Schiff,
// Inseln, Kreaturen, Hafen, Treibholz, Wetter, Kamera und Eingabe.

import * as THREE from "three";
import { PHENOMENA, type PhenomenonDef } from "../game/data";
import type { SaveGame } from "../game/state";
import { WORLD, HARBOR } from "../game/state";
import { Water, sampleWaveHeight } from "./water";
import { Sky } from "./sky";
import { buildShipMesh, ShipPhysics } from "./shipMesh";
import { buildIsland, updateIslandSurf, makeDriftwoodField, updateDriftwood, type Island3D, type Driftwood } from "./islandMesh";
import { Creature } from "./creature";
import { Harbor, type NpcActor } from "./harbor";
import { ParticleSystem, RainSystem } from "./particles";
import { audio } from "../game/audio";

export interface WorldEvents {
  onNearIsland: (def: PhenomenonDef | null) => void;
  onNearNpc: (npc: NpcActor | null) => void;
  onDriftwood: (total: number) => void;
  onHud: (hud: { weather: string; x: number; z: number; heading: number; storm: number }) => void;
}

interface StormCell {
  x: number; z: number; vx: number; vz: number; r: number; strength: number;
}

export class SeaWorld {
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private water!: Water;
  private sky!: Sky;
  private ship!: ShipPhysics;
  private islands: Island3D[] = [];
  private creatures = new Map<string, Creature>();
  private harbor!: Harbor;
  private driftwood: Driftwood[] = [];
  private particles = new ParticleSystem(3500);
  private rain = new RainSystem(1400);
  private keys: Record<string, boolean> = {};
  private cells: StormCell[] = [];
  private globalWeather = 0;
  private weatherTimer = 8;
  private storm = 0;
  private raf = 0;
  private running = false;
  private last = 0;
  private t = 0;
  private camAngleOffset = 0;
  private camDist = 60;
  private nextBolt = 6;
  private hudTimer = 0;
  private nearIsland: PhenomenonDef | null = null;
  private nearNpc: NpcActor | null = null;
  private disposed = false;
  private container: HTMLElement;
  private save: SaveGame;
  private events: WorldEvents;

  constructor(container: HTMLElement, save: SaveGame, events: WorldEvents) {
    this.container = container;
    this.save = save;
    this.events = events;
  }

  start() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xbfd8e6, 250, 1400);

    this.camera = new THREE.PerspectiveCamera(58, w / h, 0.5, 4000);
    this.camera.position.set(this.save.ship.x, 30, this.save.ship.z + 60);

    // Wasser + Insel-Schaumzonen
    this.water = new Water({ x: WORLD.size / 2, z: WORLD.size / 2 }, WORLD.size);
    this.scene.add(this.water.mesh);

    this.sky = new Sky(WORLD.size);
    this.scene.add(this.sky.group);

    // Schiff
    const shipMesh = buildShipMesh();
    this.scene.add(shipMesh);
    this.ship = new ShipPhysics(shipMesh, this.save.ship.x, this.save.ship.z, this.save.ship.heading);
    this.ship.speedLevel = this.save.shipSpeedLevel;

    // Inseln + Kreaturen
    const foamList: { x: number; z: number; r: number }[] = [];
    for (const isl of this.save.islands) {
      const def = PHENOMENA.find((p) => p.id === isl.id)!;
      const locked = !!def.final && !this.save.finalUnlocked;
      const island = buildIsland(def, isl.x, isl.z, isl.seed, isl.overcome);
      this.scene.add(island.group);
      this.islands.push(island);
      foamList.push({ x: isl.x, z: isl.z, r: island.radius });
      if (!isl.overcome && !locked) {
        const c = new Creature(def, 0.85);
        c.group.position.set(isl.x, 14, isl.z);
        this.scene.add(c.group);
        this.creatures.set(isl.id, c);
      }
    }
    // Hafen
    this.harbor = new Harbor(HARBOR.x, HARBOR.z);
    this.scene.add(this.harbor.group);
    foamList.push({ x: HARBOR.x, z: HARBOR.z, r: this.harbor.radius + 15 });
    this.water.setIslands(foamList);

    // Treibholz
    const avoid = [...this.islands.map((i) => ({ x: i.x, z: i.z, r: i.radius })), { x: HARBOR.x, z: HARBOR.z, r: this.harbor.radius }];
    this.driftwood = makeDriftwoodField(26, WORLD.size, avoid);
    for (const d of this.driftwood) this.scene.add(d.mesh);

    this.scene.add(this.particles.points);
    this.scene.add(this.rain.points);

    // Sturmzellen
    this.cells = [
      { x: 900, z: 1800, vx: 14, vz: 6, r: 430, strength: 0.9 },
      { x: 3100, z: 1900, vx: -10, vz: 11, r: 370, strength: 0.75 },
      { x: 2100, z: 700, vx: 7, vz: 13, r: 310, strength: 0.65 },
    ];

    // Eingabe
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("wheel", this.onWheel, { passive: true });
    window.addEventListener("resize", this.onResize);

    audio.startSea();
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    this.keys[e.key.toLowerCase()] = true;
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };
  private dragX: number | null = null;
  private onPointerDown = (e: PointerEvent) => {
    this.dragX = e.clientX;
  };
  private onPointerMove = (e: PointerEvent) => {
    if (this.dragX !== null) {
      this.camAngleOffset += (e.clientX - this.dragX) * 0.006;
      this.dragX = e.clientX;
    }
  };
  private onPointerUp = () => {
    this.dragX = null;
  };
  private onWheel = (e: WheelEvent) => {
    this.camDist = Math.max(34, Math.min(120, this.camDist + e.deltaY * 0.05));
  };
  private onResize = () => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  /** Insel als befriedet markieren (Kreatur löst sich auf, Insel wird grün) */
  markOvercome(islandId: string, peaceful: boolean) {
    const isl = this.islands.find((i) => i.def.id === islandId);
    if (isl) isl.setOvercome(true);
    const c = this.creatures.get(islandId);
    if (c) {
      if (peaceful) {
        // friedlich: Kreatur steigt golden auf und verblasst
        c.setPeace(1);
        const target = c.group.position.y + 60;
        const anim = () => {
          c.group.position.y += 1.2;
          c.group.scale.multiplyScalar(0.97);
          if (c.group.position.y < target) requestAnimationFrame(anim);
          else {
            c.dissolve(this.particles);
            this.scene.remove(c.group);
          }
        };
        anim();
      } else {
        c.dissolve(this.particles);
        this.scene.remove(c.group);
      }
      this.creatures.delete(islandId);
    }
  }

  /** Sturmherd freischalten: dunkle Kreatur erscheint */
  unlockFinal() {
    const isl = this.save.islands.find((i) => i.id === "sturmherd")!;
    const def = PHENOMENA.find((p) => p.id === "sturmherd")!;
    const c = new Creature(def, 1.6);
    c.group.position.set(isl.x, 26, isl.z);
    this.scene.add(c.group);
    this.creatures.set("sturmherd", c);
  }

  private loop = (now: number) => {
    if (!this.running || this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    const t = this.t;

    // ── Wetter ──
    this.weatherTimer -= dt;
    if (this.weatherTimer <= 0) {
      const roll = Math.random();
      this.globalWeather = roll < 0.45 ? 0 : roll < 0.8 ? 0.25 : 0.55;
      this.weatherTimer = 20 + Math.random() * 24;
    }
    for (const c of this.cells) {
      c.x += c.vx * dt;
      c.z += c.vz * dt;
      if (c.x < -c.r) c.x = WORLD.size + c.r;
      if (c.x > WORLD.size + c.r) c.x = -c.r;
      if (c.z < -c.r) c.z = WORLD.size + c.r;
      if (c.z > WORLD.size + c.r) c.z = -c.r;
    }
    let localStorm = this.globalWeather;
    for (const c of this.cells) {
      const d = Math.hypot(this.ship.x - c.x, this.ship.z - c.z);
      if (d < c.r) localStorm = Math.max(localStorm, c.strength * (1 - d / c.r) * 1.3);
    }
    localStorm = Math.min(1, localStorm);
    this.storm += (localStorm - this.storm) * dt * 0.7;
    audio.setStormIntensity(this.storm);

    if (this.storm > 0.45) {
      this.nextBolt -= dt;
      if (this.nextBolt <= 0) {
        this.nextBolt = 3 + Math.random() * 7;
        const a = Math.random() * Math.PI * 2;
        this.sky.strike(this.ship.x + Math.cos(a) * (150 + Math.random() * 250), this.ship.z + Math.sin(a) * (150 + Math.random() * 250));
        audio.thunder();
      }
    }

    // ── Schiff ──
    const input = {
      thrust: (this.keys["arrowup"] || this.keys["w"] ? 1 : 0) - (this.keys["arrowdown"] || this.keys["s"] ? 0.55 : 0),
      turn: (this.keys["arrowright"] || this.keys["d"] ? 1 : 0) - (this.keys["arrowleft"] || this.keys["a"] ? 1 : 0),
    };
    this.ship.update(dt, t, this.storm, input, this.particles);
    // Weltgrenzen
    this.ship.x = Math.max(60, Math.min(WORLD.size - 60, this.ship.x));
    this.ship.z = Math.max(60, Math.min(WORLD.size - 60, this.ship.z));

    // Kollision mit Inseln + Hafen
    for (const isl of this.islands) {
      const d = Math.hypot(this.ship.x - isl.x, this.ship.z - isl.z);
      if (d < isl.radius && d > 0.01) {
        const nx = (this.ship.x - isl.x) / d;
        const nz = (this.ship.z - isl.z) / d;
        this.ship.x = isl.x + nx * isl.radius;
        this.ship.z = isl.z + nz * isl.radius;
        this.ship.vx *= -0.25;
        this.ship.vz *= -0.25;
      }
    }
    {
      const d = Math.hypot(this.ship.x - HARBOR.x, this.ship.z - HARBOR.z);
      if (d < this.harbor.radius && d > 0.01) {
        const nx = (this.ship.x - HARBOR.x) / d;
        const nz = (this.ship.z - HARBOR.z) / d;
        this.ship.x = HARBOR.x + nx * this.harbor.radius;
        this.ship.z = HARBOR.z + nz * this.harbor.radius;
        this.ship.vx *= -0.25;
        this.ship.vz *= -0.25;
      }
    }

    // ── Nähe: Insel (Anlanden) ──
    let near: PhenomenonDef | null = null;
    let nearD = Infinity;
    for (const isl of this.islands) {
      const d = Math.hypot(this.ship.x - isl.x, this.ship.z - isl.z) - isl.radius;
      if (d < 80 && d < nearD) {
        near = isl.def;
        nearD = d;
      }
    }
    if (near?.id !== this.nearIsland?.id) {
      this.nearIsland = near;
      this.events.onNearIsland(near);
    }

    // ── Nähe: NPC (nur im Hafenbereich) ──
    const npc = this.harbor.nearestNpc(this.ship.x, this.ship.z);
    if (npc?.def.id !== this.nearNpc?.def.id) {
      this.nearNpc = npc;
      this.events.onNearNpc(npc);
    }

    // ── Treibholz aufsammeln ──
    for (const d of this.driftwood) {
      if (!d.taken && Math.hypot(this.ship.x - d.x, this.ship.z - d.z) < 10) {
        d.taken = true;
        d.respawn = 60 + Math.random() * 60;
        this.save.driftwood += 1;
        audio.heal();
        this.particles.burst(16, {
          x: d.x, y: 2, z: d.z, vy: 6, spread: 5, life: 1, size: 2.4,
          color: [1.0, 0.85, 0.4], gravity: 6, drag: 0.96,
        });
        this.events.onDriftwood(this.save.driftwood);
      }
    }
    updateDriftwood(this.driftwood, t, this.storm, dt);

    // ── Welt leben lassen ──
    this.water.setMood(this.storm);
    this.water.update(t, this.camera.position);
    this.sky.setStorm(this.storm);
    this.sky.update(dt, t, WORLD.size, this.ship.x, this.ship.z);
    this.rain.intensity = this.storm;
    this.rain.update(dt, this.ship.x, this.ship.z, 14 * this.storm);
    updateIslandSurf(this.islands, t, this.storm, this.particles, this.ship.x, this.ship.z);
    updateIslandSurf(
      [{ group: this.harbor.group, x: HARBOR.x, z: HARBOR.z, radius: this.harbor.radius + 15, def: PHENOMENA[0], shorePoints: shoreRing(HARBOR.x, HARBOR.z, this.harbor.radius + 15), setOvercome: () => {} }],
      t, this.storm, this.particles, this.ship.x, this.ship.z,
    );
    this.harbor.update(t, this.storm, this.particles);
    for (const c of this.creatures.values()) c.update(t, dt, this.particles);
    this.particles.update(dt);

    // ── Nebel ans Wetter anpassen ──
    const fog = this.scene.fog as THREE.Fog;
    fog.color.setHex(0xbfd8e6).lerp(new THREE.Color(0x2c3444), this.storm);
    fog.near = 250 - this.storm * 120;
    fog.far = 1400 - this.storm * 500;

    // ── Kamera: hinter dem Schiff, Maus-Orbit, Zoom ──
    const camAngle = this.ship.heading + Math.PI + this.camAngleOffset;
    const camY = 22 + this.camDist * 0.22 + this.storm * 4;
    const tx = this.ship.x + Math.sin(camAngle) * this.camDist;
    const tz = this.ship.z + Math.cos(camAngle) * this.camDist;
    this.camera.position.x += (tx - this.camera.position.x) * Math.min(1, dt * 3.2);
    this.camera.position.z += (tz - this.camera.position.z) * Math.min(1, dt * 3.2);
    this.camera.position.y += (camY - this.camera.position.y) * Math.min(1, dt * 2.5);
    // Kamera schwimmt minimal auf den Wellen
    const camWave = sampleWaveHeight(this.camera.position.x, this.camera.position.z, t, this.storm);
    this.camera.position.y += camWave * 0.06;
    const lookY = 6 + Math.sin(t * 0.8) * 0.5;
    this.camera.lookAt(this.ship.x, lookY, this.ship.z);
    // leichte Roll-Neigung im Sturm
    this.camera.rotation.z += Math.sin(t * 1.1) * 0.01 * (1 + this.storm * 2);

    // ── HUD-Events (gedrosselt) ──
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.5;
      this.save.ship.x = Math.round(this.ship.x);
      this.save.ship.z = Math.round(this.ship.z);
      this.save.ship.heading = this.ship.heading;
      this.events.onHud({
        weather: this.storm > 0.65 ? "Sturm!" : this.storm > 0.35 ? "Schwere See" : this.storm > 0.12 ? "Frischer Wind" : "Ruhige See",
        x: this.ship.x,
        z: this.ship.z,
        heading: this.ship.heading,
        storm: this.storm,
      });
    }

    this.renderer.render(this.scene, this.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("wheel", this.onWheel);
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}

function shoreRing(x: number, z: number, r: number) {
  const pts: { x: number; z: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    pts.push({ x: x + Math.cos(a) * r, z: z + Math.sin(a) * r });
  }
  return pts;
}
