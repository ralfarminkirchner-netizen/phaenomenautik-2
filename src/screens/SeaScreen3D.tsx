// PHÄNOMENAUTIK 2 — 3D-Seekarte: bindet SeaWorld ein, HUD, Anlanden, NPC-Gespräche

import { useEffect, useRef, useState, useCallback } from "react";
import type { PhenomenonDef } from "../game/data";
import type { SaveGame } from "../game/state";
import { WORLD, HARBOR } from "../game/state";
import { audio } from "../game/audio";
import { SeaWorld } from "../three/world";
import type { NpcActor } from "../three/harbor";
import { hsl } from "../game/color";
import { PHENOMENA } from "../game/data";

interface SeaScreen3DProps {
  save: SaveGame;
  onDock: (islandId: string) => void;
  onTalk: (npcId: string) => void;
  onOpenJournal: () => void;
  onBackToTitle: () => void;
  worldRef: React.MutableRefObject<SeaWorld | null>;
}

export function SeaScreen3D({ save, onDock, onTalk, onOpenJournal, onBackToTitle, worldRef }: SeaScreen3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  const [nearIsland, setNearIsland] = useState<PhenomenonDef | null>(null);
  const [nearNpc, setNearNpc] = useState<NpcActor | null>(null);
  const [hud, setHud] = useState({ weather: "Ruhige See", x: save.ship.x, z: save.ship.z, heading: 0, storm: 0 });
  const [muted, setMuted] = useState(audio.isMuted);
  const [driftwood, setDriftwood] = useState(save.driftwood);

  const nearRef = useRef<{ island: PhenomenonDef | null; npc: NpcActor | null }>({ island: null, npc: null });
  const onDockRef = useRef(onDock);
  onDockRef.current = onDock;
  const onTalkRef = useRef(onTalk);
  onTalkRef.current = onTalk;

  const tryInteract = useCallback(() => {
    const { island, npc } = nearRef.current;
    if (npc) {
      audio.confirm();
      onTalkRef.current(npc.def.id);
      return;
    }
    if (island) {
      const st = saveRef.current.islands.find((i) => i.id === island.id)!;
      if (!st.overcome && (!island.final || saveRef.current.finalUnlocked)) {
        audio.dock();
        onDockRef.current(island.id);
      }
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E" || e.key === "Enter") tryInteract();
      if (e.key.toLowerCase() === "j") onOpenJournalRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tryInteract]);

  const onOpenJournalRef = useRef(onOpenJournal);
  onOpenJournalRef.current = onOpenJournal;

  useEffect(() => {
    const world = new SeaWorld(hostRef.current!, saveRef.current, {
      onNearIsland: (def) => {
        nearRef.current.island = def;
        setNearIsland(def);
      },
      onNearNpc: (npc) => {
        nearRef.current.npc = npc;
        setNearNpc(npc);
      },
      onDriftwood: (total) => setDriftwood(total),
      onHud: (h) => {
        setHud(h);
        // Minimap
        const mm = minimapRef.current;
        if (mm) {
          const ctx = mm.getContext("2d")!;
          const mw = mm.width, mh = mm.height;
          const sx = mw / WORLD.size, sz = mh / WORLD.size;
          ctx.fillStyle = "rgba(10, 18, 32, 0.85)";
          ctx.fillRect(0, 0, mw, mh);
          // Hafen
          ctx.fillStyle = "#d6c49a";
          ctx.beginPath();
          ctx.arc(HARBOR.x * sx, HARBOR.z * sz, 4, 0, Math.PI * 2);
          ctx.fill();
          for (const isl of saveRef.current.islands) {
            const def = PHENOMENA.find((p) => p.id === isl.id)!;
            ctx.fillStyle = isl.overcome ? "#7fbf6a" : def.final && !saveRef.current.finalUnlocked ? "#403050" : hsl(def.hue, 65, 55);
            ctx.beginPath();
            ctx.arc(isl.x * sx, isl.z * sz, def.final ? 4 : 2.6, 0, Math.PI * 2);
            ctx.fill();
          }
          // Schiff mit Richtung
          ctx.save();
          ctx.translate(h.x * sx, h.z * sz);
          ctx.rotate(-h.heading);
          ctx.fillStyle = "#f6e9c8";
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(3.4, 4);
          ctx.lineTo(-3.4, 4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      },
    });
    worldRef.current = world;
    world.start();
    return () => {
      world.dispose();
      worldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const p = save.player;
  const nearState = nearIsland ? save.islands.find((i) => i.id === nearIsland.id) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0a1522]">
      <div ref={hostRef} className="absolute inset-0" />

      {/* HUD oben */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between p-3">
        <div className="eb-panel px-3 py-2 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-bold tracking-widest text-amber-200">MS TOLERANZ</span>
            <span className="text-sky-200/80">Stufe {p.level}</span>
            {save.shipSpeedLevel > 0 && <span className="text-amber-300/80">⚙ Ausbau {save.shipSpeedLevel === 2 ? "II" : "I"}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 text-emerald-200/90">Stabilität</span>
            <div className="h-2 w-24 overflow-hidden rounded bg-black/50">
              <div className="h-full bg-emerald-400 transition-all" style={{ width: `${(p.stability / p.maxStability) * 100}%` }} />
            </div>
            <span className="w-12 text-right">{p.stability}/{p.maxStability}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-14 text-sky-200/90">Präsenz</span>
            <div className="h-2 w-24 overflow-hidden rounded bg-black/50">
              <div className="h-full bg-sky-400 transition-all" style={{ width: `${(p.presence / p.maxPresence) * 100}%` }} />
            </div>
            <span className="w-12 text-right">{p.presence}/{p.maxPresence}</span>
          </div>
          <div className="mt-1 text-amber-200/80">🪵 Treibholz: {driftwood}</div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="eb-panel px-3 py-2 text-xs text-sky-100">{hud.weather}</div>
          <button
            className="eb-btn px-3 py-2 text-xs"
            onClick={() => {
              const m = !muted;
              setMuted(m);
              audio.setMuted(m);
            }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button className="eb-btn px-3 py-2 text-xs" onClick={onOpenJournal}>
            Journal [J]
          </button>
          <button className="eb-btn px-3 py-2 text-xs" onClick={onBackToTitle}>
            Titel
          </button>
        </div>
      </div>

      {/* Minimap */}
      <canvas ref={minimapRef} width={150} height={150} className="absolute bottom-3 right-3 rounded-md border-2 border-sky-200/30 opacity-90" />

      {/* Steuerungshinweis */}
      <div className="pointer-events-none absolute bottom-3 left-3 eb-panel px-3 py-2 text-[11px] leading-relaxed text-sky-100/80">
        <span className="text-amber-200/90">WASD / Pfeile</span> steuern · <span className="text-amber-200/90">Ziehen</span> Kamera ·{" "}
        <span className="text-amber-200/90">Rad</span> Zoom · <span className="text-amber-200/90">E</span> anlanden / sprechen
      </div>

      {/* NPC-Prompt */}
      {nearNpc && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div className="eb-panel px-5 py-3 text-center">
            <div className="text-sm font-bold tracking-wide text-amber-100">
              {nearNpc.def.name}, {nearNpc.def.role}
            </div>
            <button className="eb-btn mt-2 px-4 py-1.5 text-sm" onClick={() => onTalk(nearNpc.def.id)}>
              Sprechen [E]
            </button>
          </div>
        </div>
      )}

      {/* Anlande-Prompt */}
      {!nearNpc && nearIsland && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div className="eb-panel px-5 py-3 text-center">
            {nearState?.overcome ? (
              <div className="text-sm text-emerald-200">{nearIsland.name} ist befriedet. Die Insel ruht. ✓</div>
            ) : nearIsland.final && !save.finalUnlocked ? (
              <div className="text-sm text-purple-200">
                Ein wirbelnder Abgrund. Erst wenn alle 12 Phänomene überwunden sind, öffnet sich das Auge …
                <div className="mt-1 text-xs text-purple-200/60">
                  {save.islands.filter((i) => i.id !== "sturmherd" && i.overcome).length} / 12
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-bold tracking-wide text-amber-100">{nearIsland.name}</div>
                <div className="text-xs italic text-sky-200/80">{nearIsland.epithet}</div>
                <button className="eb-btn mt-2 px-4 py-1.5 text-sm" onClick={tryInteract}>
                  Anlanden [E]
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
