// PHÄNOMENAUTIK 2 — Weltlayout, Spielstand, Persistenz (v2, mit NPCs & Quests)

import { PHENOMENA, levelForXp, maxPresence, maxStability } from "./data";

export interface IslandState {
  id: string;
  x: number;
  z: number;
  overcome: boolean;
  understood: boolean;
  seed: number;
}

export interface PlayerState {
  xp: number;
  level: number;
  stability: number;
  maxStability: number;
  presence: number;
  maxPresence: number;
  items: Record<string, number>;
}

export type QuestState = "unknown" | "active" | "done";

export interface SaveGame {
  version: 2;
  player: PlayerState;
  islands: IslandState[];
  ship: { x: number; z: number; heading: number };
  finalUnlocked: boolean;
  won: boolean;
  // ── v2 ──
  playerName: string;
  driftwood: number;
  shipSpeedLevel: number; // 0–2 Schiffsausbau
  quests: Record<string, QuestState>;
  questProgress: Record<string, number>;
  npcMemory: Record<string, { met: boolean; topics: string[]; favors: number }>;
  visitedArchipelagos: string[];
}

const SAVE_KEY = "phaenomenautik2-save-v1";

export const WORLD = { size: 4200, startX: 2100, startZ: 3560 };
export const HARBOR = { x: 2100, z: 3300, r: 150 }; // Der Ankerplatz (NPC-Insel)

const ISLAND_POS: Record<string, [number, number]> = {
  flashback: [760, 1020],
  albtraum: [1150, 640],
  hypervigilanz: [2050, 520],
  herzrasen: [2520, 830],
  vermeidung: [3330, 900],
  verdraengung: [3560, 1330],
  dissoziation: [3450, 2520],
  erstarrung: [3120, 3030],
  scham: [2140, 2560],
  leere: [1620, 2940],
  misstrauen: [820, 2500],
  naehe: [1040, 3050],
  sturmherd: [2100, 1760],
};

export function newGame(): SaveGame {
  const islands: IslandState[] = PHENOMENA.map((p, i) => ({
    id: p.id,
    x: ISLAND_POS[p.id][0],
    z: ISLAND_POS[p.id][1],
    overcome: false,
    understood: false,
    seed: 1000 + i * 137,
  }));
  const player = freshPlayer(0);
  return {
    version: 2,
    player,
    islands,
    ship: { x: WORLD.startX, z: WORLD.startZ, heading: Math.PI },
    finalUnlocked: false,
    won: false,
    playerName: "",
    driftwood: 0,
    shipSpeedLevel: 0,
    quests: {},
    questProgress: {},
    npcMemory: {},
    visitedArchipelagos: [],
  };
}

export function freshPlayer(xp: number): PlayerState {
  const level = levelForXp(xp);
  const maxS = maxStability(level);
  const maxP = maxPresence(level);
  return {
    xp,
    level,
    stability: maxS,
    maxStability: maxS,
    presence: maxP,
    maxPresence: maxP,
    items: { wasser: 3, karte: 1, anker: 2 },
  };
}

export function grantXp(player: PlayerState, xp: number): { leveledUp: boolean; newLevel: number } {
  const before = player.level;
  player.xp += xp;
  player.level = levelForXp(player.xp);
  if (player.level > before) {
    player.maxStability = maxStability(player.level);
    player.maxPresence = maxPresence(player.level);
    player.stability = player.maxStability;
    player.presence = player.maxPresence;
    return { leveledUp: true, newLevel: player.level };
  }
  return { leveledUp: false, newLevel: player.level };
}

export function regularOvercome(islands: IslandState[]): number {
  return islands.filter((i) => i.id !== "sturmherd" && i.overcome).length;
}

export function checkFinalUnlock(s: SaveGame): boolean {
  if (!s.finalUnlocked && regularOvercome(s.islands) >= 12) s.finalUnlocked = true;
  return s.finalUnlocked;
}

export function loadSave(): SaveGame | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as SaveGame;
    if (s.version !== 2 || !Array.isArray(s.islands) || s.islands.length !== PHENOMENA.length) return null;
    return s;
  } catch {
    return null;
  }
}

export function persistSave(s: SaveGame) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { /* ignorieren */ }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* ignorieren */ }
}
