// PHÄNOMENAUTIK 2 — Begegnung: v1-Kampflogik (Erregungsmatrix, Verstehen,
// rollende Zähler, Typewriter) auf der 3D-Kampfbühne.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EXERCISES,
  ITEMS,
  effectiveness,
  effectivenessLabel,
  AROUSAL_LABEL,
  type ExerciseDef,
  type PhenomenonDef,
} from "../game/data";
import { audio } from "../game/audio";
import { hsl } from "../game/color";
import type { PlayerState } from "../game/state";
import { BattleStage } from "../three/battleStage";

function RollingNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const target = useRef(value);
  target.current = value;
  useEffect(() => {
    let raf = 0;
    const step = () => {
      setDisplay((d) => {
        const diff = target.current - d;
        if (diff === 0) return d;
        const move = Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) * 0.18));
        const next = d + move;
        if ((move > 0 && next > target.current) || (move < 0 && next < target.current)) return target.current;
        return next;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);
  const digits = String(Math.max(0, display)).padStart(3, " ").split("");
  return (
    <span className={`rolling ${className ?? ""}`}>
      {digits.map((ch, i) =>
        ch === " " ? (
          <span key={i} className="rolling-digit" />
        ) : (
          <span key={i} className="rolling-digit">
            <span className="rolling-strip" style={{ transform: `translateY(-${Number(ch)}em)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        ),
      )}
    </span>
  );
}

function Typewriter({ text, onDone, speed = 18 }: { text: string; onDone?: () => void; speed?: number }) {
  const [shown, setShown] = useState("");
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    doneRef.current = false;
    setShown("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(iv);
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current?.();
        }
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return (
    <span
      onClick={() => {
        if (!doneRef.current) {
          doneRef.current = true;
          setShown(text);
          onDoneRef.current?.();
        }
      }}
    >
      {shown}
      {shown.length < text.length && <span className="animate-pulse">▊</span>}
    </span>
  );
}

type Phase =
  | { kind: "intro"; line: number }
  | { kind: "menu" }
  | { kind: "submenu"; menu: "exercise" | "item" }
  | { kind: "message"; text: string; then: () => void }
  | { kind: "enemyTurn"; text: string }
  | { kind: "won"; peace: boolean }
  | { kind: "lost" };

interface BattleScreen3DProps {
  phenomenon: PhenomenonDef;
  player: PlayerState;
  onResolve: (result: { outcome: "win" | "peace" | "flee" | "defeat"; player: PlayerState }) => void;
}

export function BattleScreen3D({ phenomenon: phen, player: initialPlayer, onResolve }: BattleScreen3DProps) {
  const [player, setPlayer] = useState<PlayerState>(() => ({ ...initialPlayer, items: { ...initialPlayer.items } }));
  const [enemyHp, setEnemyHp] = useState(phen.intensity);
  const [understanding, setUnderstanding] = useState(0);
  const [understandIdx, setUnderstandIdx] = useState(0);
  const [guard, setGuard] = useState(false);
  const [enemyWeakened, setEnemyWeakened] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "intro", line: 0 });
  const [playerShake, setPlayerShake] = useState(0);
  const stageRef = useRef<BattleStage | null>(null);
  const stageHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = new BattleStage(stageHostRef.current!, phen);
    stageRef.current = stage;
    stage.start();
    return () => {
      stage.dispose();
      stageRef.current = null;
    };
  }, [phen]);

  useEffect(() => {
    if (playerShake > 0) {
      const to = setTimeout(() => setPlayerShake(0), 400);
      return () => clearTimeout(to);
    }
  }, [playerShake]);

  const advanceIntro = useCallback(() => {
    setPhase((ph) => {
      if (ph.kind !== "intro") return ph;
      if (ph.line + 1 < phen.intro.length) return { kind: "intro", line: ph.line + 1 };
      return { kind: "menu" };
    });
  }, [phen]);

  const enemyAttack = useCallback(() => {
    const atk = phen.attacks[Math.floor(Math.random() * phen.attacks.length)];
    let dmg = atk.min + Math.floor(Math.random() * (atk.max - atk.min + 1));
    dmg = Math.round(dmg * (1 - enemyWeakened * 0.5));
    if (guard) dmg = Math.ceil(dmg / 2);
    setGuard(false);
    setPlayerShake(1);
    stageRef.current?.enemyAttack();
    audio.playerHit();
    setPlayer((pl) => {
      const next = { ...pl, stability: Math.max(0, pl.stability - dmg), presence: Math.min(pl.maxPresence, pl.presence + 2) };
      const text = `${atk.line}${guard ? " (Dein Körperscan federt ab!)" : ""} ${dmg} Schaden.`;
      setTimeout(() => {
        if (next.stability <= 0) {
          audio.defeat();
          setPhase({ kind: "lost" });
        } else {
          setPhase({ kind: "enemyTurn", text });
        }
      }, 500);
      return next;
    });
  }, [phen, enemyWeakened, guard]);

  const checkVictory = useCallback((hp: number): boolean => {
    if (hp <= 0) {
      audio.victory();
      stageRef.current?.win(false);
      setTimeout(() => setPhase({ kind: "won", peace: false }), 800);
      return true;
    }
    return false;
  }, []);

  const useExercise = useCallback(
    (ex: ExerciseDef) => {
      if (player.presence < ex.cost) {
        audio.cancel();
        setPhase({ kind: "message", text: "Nicht genug Präsenz … erst durchatmen.", then: () => setPhase({ kind: "submenu", menu: "exercise" }) });
        return;
      }
      audio.confirm();
      const mult = effectiveness(ex.effect, phen.arousal);
      let dmg = Math.round(ex.power * (1 + player.level * 0.07) * mult - phen.armor * (1 - understanding / 260));
      dmg = Math.max(1, dmg);
      const heal = ex.heal;
      const label = effectivenessLabel(mult);
      const newHp = Math.max(0, enemyHp - dmg);
      setEnemyHp(newHp);
      stageRef.current?.hit();
      audio.hit();
      if (ex.guard) setGuard(true);
      setPlayer((pl) => ({
        ...pl,
        presence: pl.presence - ex.cost,
        stability: Math.min(pl.maxStability, pl.stability + heal),
      }));
      if (heal > 0) {
        audio.heal();
        stageRef.current?.heal();
      }
      const parts = [`Du wendest „${ex.name}“ an. ${dmg} Wirkung gegen ${phen.name}!`];
      if (label) parts.push(label);
      if (heal > 0) parts.push(`+${heal} Stabilität.`);
      setTimeout(() => {
        if (!checkVictory(newHp)) {
          setPhase({ kind: "message", text: parts.join(" "), then: enemyAttack });
        }
      }, 480);
    },
    [player.presence, player.level, phen, enemyHp, understanding, checkVictory, enemyAttack],
  );

  const useItem = useCallback(
    (itemId: string) => {
      const item = ITEMS.find((i) => i.id === itemId)!;
      if ((player.items[itemId] ?? 0) <= 0) return;
      audio.heal();
      stageRef.current?.heal();
      setPlayer((pl) => {
        const next = { ...pl, items: { ...pl.items, [itemId]: pl.items[itemId] - 1 } };
        if (item.heal > 0) next.stability = Math.min(next.maxStability, next.stability + item.heal);
        else next.presence = Math.min(next.maxPresence, next.presence + 14);
        return next;
      });
      const text =
        item.heal > 0
          ? `${item.name}: ${item.desc} +${item.heal} Stabilität.`
          : `${item.name}: ${item.desc} +14 Präsenz.`;
      setPhase({ kind: "message", text, then: enemyAttack });
    },
    [player.items, enemyAttack],
  );

  const tryUnderstand = useCallback(() => {
    audio.understand();
    stageRef.current?.understand();
    const gain = 16 + Math.floor(Math.random() * 18);
    const nu = Math.min(100, understanding + gain);
    setUnderstanding(nu);
    const line = phen.understand[Math.min(understandIdx, phen.understand.length - 1)];
    setUnderstandIdx((i) => Math.min(i + 1, phen.understand.length - 1));
    setEnemyWeakened(nu / 140);
    if (nu >= 100) {
      setTimeout(() => {
        audio.victory();
        stageRef.current?.win(true);
        setPhase({ kind: "won", peace: true });
      }, 1700);
      setPhase({ kind: "message", text: `${line} — Verständnis: 100 %. Etwas löst sich …`, then: () => {} });
    } else {
      setPhase({ kind: "message", text: `${line} (Verständnis: ${nu} %)`, then: enemyAttack });
    }
  }, [understanding, understandIdx, phen, enemyAttack]);

  const flee = useCallback(() => {
    audio.cancel();
    setPhase({ kind: "message", text: "Du setzt die Segel. Das Phänomen bleibt — Inseln laufen nicht weg.", then: () => onResolve({ outcome: "flee", player }) });
  }, [onResolve, player]);

  const inMenu = phase.kind === "menu" || phase.kind === "submenu";

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        <div ref={stageHostRef} className="absolute inset-0" />
        <div className="absolute left-1/2 top-3 w-[min(560px,92%)] -translate-x-1/2">
          <div className="eb-panel px-4 py-2">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <span className="text-sm font-bold tracking-wide text-amber-100">{phen.name}</span>
                <span className="ml-2 text-[11px] italic text-sky-200/70">{phen.epithet}</span>
              </div>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: hsl(phen.hue, 50, 30), color: "#fff" }}>
                {AROUSAL_LABEL[phen.arousal]}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-rose-100/80">
              <span className="w-16">Intensität</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-black/60">
                <div className="h-full transition-all duration-500" style={{ width: `${(enemyHp / phen.intensity) * 100}%`, background: hsl(phen.hue, 70, 55) }} />
              </div>
              <RollingNumber value={enemyHp} className="text-rose-100" />
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-violet-100/80">
              <span className="w-16">Verständnis</span>
              <div className="h-2 flex-1 overflow-hidden rounded bg-black/60">
                <div className="h-full bg-violet-400 transition-all duration-500" style={{ width: `${understanding}%` }} />
              </div>
              <span className="w-9 text-right">{understanding}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t-4 border-sky-200/40 bg-[#101826]">
        <div
          className="mx-auto flex max-w-4xl flex-col gap-2 p-3"
          style={{ transform: playerShake ? `translateX(${(Math.random() - 0.5) * 8 * playerShake}px)` : undefined }}
        >
          <div className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-4">
              <span className="font-bold tracking-widest text-amber-200">DU</span>
              <span className="text-[11px] text-sky-200/70">Stufe {player.level}</span>
            </div>
            <div className="flex items-center gap-5 font-mono">
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-emerald-200/80">STAB</span>
                <RollingNumber value={player.stability} className="text-xl text-emerald-200" />
                <span className="text-[11px] text-emerald-200/50">/ {player.maxStability}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[11px] text-sky-200/80">PRÄS</span>
                <RollingNumber value={player.presence} className="text-xl text-sky-200" />
                <span className="text-[11px] text-sky-200/50">/ {player.maxPresence}</span>
              </span>
            </div>
          </div>

          <div className="eb-panel min-h-[64px] px-4 py-3 text-sm leading-relaxed text-sky-50">
            {phase.kind === "intro" && (
              <button className="block w-full text-left" onClick={advanceIntro}>
                <Typewriter text={phen.intro[phase.line]} onDone={() => {}} />
                <span className="float-right text-xs text-sky-300/60">▼</span>
              </button>
            )}
            {phase.kind === "menu" && <Typewriter text={`Was tust du? (${phen.name} wirkt ${AROUSAL_LABEL[phen.arousal].toLowerCase()}.)`} />}
            {phase.kind === "submenu" && <Typewriter text={phase.menu === "exercise" ? "Welche Übung?" : "Welche Ressource?"} />}
            {phase.kind === "message" && <Typewriter text={phase.text} onDone={phase.then} />}
            {phase.kind === "enemyTurn" && <Typewriter text={phase.text} onDone={() => setPhase({ kind: "menu" })} />}
            {phase.kind === "won" && (
              <Typewriter text={phase.peace ? phen.peaceLine : phen.winLine} onDone={() => setTimeout(() => onResolve({ outcome: phase.peace ? "peace" : "win", player }), 1300)} />
            )}
            {phase.kind === "lost" && (
              <Typewriter
                text="Deine Stabilität sinkt gegen null … Eine Strömung ergreift dein Boot und trägt dich zurück aufs offene Meer. Das Phänomen bleibt. Aber du auch."
                onDone={() =>
                  setTimeout(
                    () =>
                      onResolve({
                        outcome: "defeat",
                        player: { ...player, stability: Math.ceil(player.maxStability * 0.6), presence: Math.ceil(player.maxPresence * 0.6) },
                      }),
                    1700,
                  )
                }
              />
            )}
          </div>

          {phase.kind === "menu" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button className="eb-btn px-3 py-2 text-sm" onClick={() => { audio.select(); setPhase({ kind: "submenu", menu: "exercise" }); }}>
                🫁 Übung
              </button>
              <button className="eb-btn px-3 py-2 text-sm" onClick={() => { audio.select(); tryUnderstand(); }}>
                💬 Verstehen
              </button>
              <button className="eb-btn px-3 py-2 text-sm" onClick={() => { audio.select(); setPhase({ kind: "submenu", menu: "item" }); }}>
                🎒 Ressource
              </button>
              <button className="eb-btn px-3 py-2 text-sm" onClick={flee}>
                ⛵ Zurück aufs Meer
              </button>
            </div>
          )}

          {phase.kind === "submenu" && phase.menu === "exercise" && (
            <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {EXERCISES.map((ex) => {
                const mult = effectiveness(ex.effect, phen.arousal);
                const afford = player.presence >= ex.cost;
                return (
                  <button
                    key={ex.id}
                    disabled={!afford}
                    className={`eb-btn flex items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] ${!afford ? "opacity-40" : ""}`}
                    title={ex.desc}
                    onClick={() => useExercise(ex)}
                  >
                    <span>
                      {ex.name}
                      {mult >= 1.5 && <span className="ml-1 text-amber-300">★</span>}
                      {mult <= 0.6 && <span className="ml-1 text-slate-400">▽</span>}
                    </span>
                    <span className="text-[11px] text-sky-300/80">{ex.cost} PRÄS</span>
                  </button>
                );
              })}
              <button className="eb-btn col-span-full px-3 py-1.5 text-sm" onClick={() => { audio.cancel(); setPhase({ kind: "menu" }); }}>
                ← Zurück
              </button>
            </div>
          )}

          {phase.kind === "submenu" && phase.menu === "item" && (
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
              {ITEMS.map((it) => (
                <button
                  key={it.id}
                  disabled={(player.items[it.id] ?? 0) <= 0}
                  className={`eb-btn flex items-center justify-between gap-2 px-3 py-1.5 text-left text-[13px] ${(player.items[it.id] ?? 0) <= 0 ? "opacity-40" : ""}`}
                  title={it.desc}
                  onClick={() => useItem(it.id)}
                >
                  <span>{it.name}</span>
                  <span className="text-[11px] text-amber-200/80">× {player.items[it.id] ?? 0}</span>
                </button>
              ))}
              <button className="eb-btn col-span-full px-3 py-1.5 text-sm" onClick={() => { audio.cancel(); setPhase({ kind: "menu" }); }}>
                ← Zurück
              </button>
            </div>
          )}
        </div>
      </div>

      {!inMenu && phase.kind === "intro" && (
        <div className="absolute bottom-40 right-4 text-xs text-sky-200/50">Klick auf den Text zum Weiterblättern</div>
      )}
    </div>
  );
}
