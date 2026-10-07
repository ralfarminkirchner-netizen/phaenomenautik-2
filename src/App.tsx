// PHÄNOMENAUTIK 2 — App-Shell: Bildschirme, Spielstand, Quests, NPCs

import { useCallback, useMemo, useRef, useState } from "react";
import { PHENOMENA } from "./game/data";
import { audio } from "./game/audio";
import {
  checkFinalUnlock,
  clearSave,
  grantXp,
  loadSave,
  newGame,
  persistSave,
  type PlayerState,
  type SaveGame,
} from "./game/state";
import type { SeaWorld } from "./three/world";
import { TitleScreen } from "./screens/TitleScreen";
import { SeaScreen3D } from "./screens/SeaScreen3D";
import { BattleScreen3D } from "./screens/BattleScreen3D";
import { JournalOverlay } from "./screens/JournalOverlay";
import { NpcDialog } from "./screens/NpcDialog";

type Screen =
  | { kind: "title" }
  | { kind: "sea" }
  | { kind: "battle"; islandId: string }
  | { kind: "ending" };

function App() {
  const [save, setSave] = useState<SaveGame | null>(() => loadSave());
  const [screen, setScreen] = useState<Screen>({ kind: "title" });
  const [journalOpen, setJournalOpen] = useState(false);
  const [talkNpc, setTalkNpc] = useState<string | null>(null);
  const [levelUpFlash, setLevelUpFlash] = useState<number | null>(null);
  const worldRef = useRef<SeaWorld | null>(null);

  const battlePhen = useMemo(
    () => (screen.kind === "battle" ? PHENOMENA.find((p) => p.id === screen.islandId) ?? null : null),
    [screen],
  );

  const updateSave = useCallback((updater: (s: SaveGame) => SaveGame) => {
    setSave((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      persistSave(next);
      return next;
    });
  }, []);

  const startNew = useCallback(() => {
    clearSave();
    const s = newGame();
    setSave(s);
    persistSave(s);
    setScreen({ kind: "sea" });
  }, []);

  const dock = useCallback(
    (islandId: string) => {
      // Archipel-Besuch registrieren (für Maras Quest)
      const def = PHENOMENA.find((p) => p.id === islandId);
      if (def) {
        updateSave((s) =>
          s.visitedArchipelagos.includes(def.archipelago)
            ? s
            : { ...s, visitedArchipelagos: [...s.visitedArchipelagos, def.archipelago] },
        );
      }
      setScreen({ kind: "battle", islandId });
    },
    [updateSave],
  );

  const resolveBattle = useCallback(
    (result: { outcome: "win" | "peace" | "flee" | "defeat"; player: PlayerState }) => {
      if ((result.outcome === "win" || result.outcome === "peace") && battlePhen) {
        worldRef.current?.markOvercome(battlePhen.id, result.outcome === "peace");
      }
      updateSave((prev) => {
        const next: SaveGame = { ...prev, player: result.player, islands: prev.islands.map((i) => ({ ...i })) };
        if ((result.outcome === "win" || result.outcome === "peace") && battlePhen) {
          const isl = next.islands.find((i) => i.id === battlePhen.id)!;
          isl.overcome = true;
          isl.understood = result.outcome === "peace";
          const xpGain = battlePhen.xp + (result.outcome === "peace" ? Math.ceil(battlePhen.xp * 0.5) : 0);
          const { leveledUp, newLevel } = grantXp(next.player, xpGain);
          if (leveledUp) {
            setLevelUpFlash(newLevel);
            setTimeout(() => setLevelUpFlash(null), 3500);
          }
          const wasLocked = !next.finalUnlocked;
          checkFinalUnlock(next);
          if (wasLocked && next.finalUnlocked) {
            worldRef.current?.unlockFinal();
          }
          if (battlePhen.final) {
            next.won = true;
            persistSave(next);
            setScreen({ kind: "ending" });
            return next;
          }
        }
        return next;
      });
      setScreen({ kind: "sea" });
    },
    [battlePhen, updateSave],
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a1522] font-mono text-sky-50">
      {screen.kind === "title" && <TitleScreen hasSave={!!save} onContinue={() => setScreen({ kind: "sea" })} onNewGame={startNew} />}

      {screen.kind === "sea" && save && (
        <>
          <SeaScreen3D
            save={save}
            worldRef={worldRef}
            onDock={dock}
            onTalk={(npcId) => setTalkNpc(npcId)}
            onOpenJournal={() => setJournalOpen(true)}
            onBackToTitle={() => {
              persistSave(save);
              setScreen({ kind: "title" });
            }}
          />
          {save.finalUnlocked && !save.won && (
            <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2">
              <div className="eb-panel animate-pulse px-5 py-2 text-center text-sm text-purple-200">
                ⚡ Das Auge des Atlanten hat sich geöffnet — in der Mitte der Karte dreht sich der Sturmherd. ⚡
              </div>
            </div>
          )}
        </>
      )}

      {screen.kind === "battle" && save && battlePhen && (
        <BattleScreen3D key={battlePhen.id} phenomenon={battlePhen} player={save.player} onResolve={resolveBattle} />
      )}

      {screen.kind === "ending" && save && (
        <EndingScreen save={save} onSail={() => setScreen({ kind: "sea" })} onTitle={() => setScreen({ kind: "title" })} />
      )}

      {journalOpen && save && <JournalOverlay save={save} onClose={() => setJournalOpen(false)} />}

      {talkNpc && save && (
        <NpcDialog npcId={talkNpc} save={save} onSaveChange={(s) => { setSave(s); persistSave(s); }} onClose={() => setTalkNpc(null)} />
      )}

      {levelUpFlash !== null && (
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex justify-center">
          <div className="eb-panel levelup px-8 py-4 text-center">
            <div className="text-2xl font-bold tracking-widest text-amber-200">EINSICHT STUFENANSTIEG!</div>
            <div className="mt-1 text-sm text-sky-100">Stufe {levelUpFlash} — Stabilität und Präsenz vollständig erneuert.</div>
          </div>
        </div>
      )}
    </div>
  );
}

function EndingScreen({ save, onSail, onTitle }: { save: SaveGame; onSail: () => void; onTitle: () => void }) {
  const understood = save.islands.filter((i) => i.understood).length;
  const overcome = save.islands.filter((i) => i.overcome).length;
  const questsDone = Object.values(save.quests).filter((q) => q === "done").length;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0c1a2e] via-[#13233c] to-[#1d3050] p-6 text-center">
      <div className="text-xs tracking-[0.5em] text-sky-200/60">DAS MEER GEHÖRT WIEDER DIR</div>
      <h1 className="title-logo text-4xl sm:text-6xl">STILLE NACH DEM STURM</h1>
      <div className="eb-panel max-w-xl px-6 py-4 text-sm leading-relaxed text-sky-100">
        <p>
          Der Sturmherd ist gelegt. Zwölf Inseln liegen ruhig in deiner See — keine davon ist verschwunden, aber keine
          bedroht dich mehr. Du hast {overcome} Phänomene begegnet, {understood} davon <em>verstanden</em>, und auf dem
          Ankerplatz {questsDone} Aufgaben für Menschen erledigt, die dich inzwischen beim Namen kennen
          {save.playerName ? ` — ${save.playerName}` : ""}.
        </p>
        <p className="mt-3 text-sky-200/80">
          Das ist der Unterschied zwischen Besiegen und Integrieren. Dein Schiff bleibt segelbereit: Das Meer ist groß,
          und Wetter wird es immer geben. Aber nun hast du eine Karte, Übungen — und einen Hafen.
        </p>
        <p className="mt-3 text-[11px] text-sky-200/50">
          Dieses Spiel ersetzt keine Therapie. Telefonseelsorge: 0800 111 0 111 / 0800 111 0 222 · Notruf 112.
        </p>
      </div>
      <div className="flex gap-3">
        <button className="eb-btn px-6 py-3" onClick={() => { audio.confirm(); onSail(); }}>
          ⛵ Weitersegeln (Freies Meer)
        </button>
        <button className="eb-btn px-6 py-3" onClick={onTitle}>
          Zum Titel
        </button>
      </div>
    </div>
  );
}

export default App;
