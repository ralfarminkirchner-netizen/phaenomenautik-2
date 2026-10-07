// PHÄNOMENAUTIK 2 — Bordjournal: Phänomene, Übungen, Aufgaben

import { useState } from "react";
import { EXERCISES, PHENOMENA, AROUSAL_LABEL, type Arousal } from "../game/data";
import { hsl } from "../game/color";
import type { SaveGame } from "../game/state";
import { QUESTS, questState } from "../game/quests";

const EFFECT_LABEL: Record<Arousal, string> = {
  hyper: "beruhigt Übererregung",
  hypo: "aktiviert bei Untererregung",
  both: "gleicht aus",
};

type Tab = "phaenomene" | "uebungen" | "auftraege";

export function JournalOverlay({ save, onClose }: { save: SaveGame; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("phaenomene");
  const archipelagos = [...new Set(PHENOMENA.map((p) => p.archipelago))];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="eb-panel flex max-h-[86vh] w-[min(680px,94vw)] flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b-2 border-sky-200/20 px-5 py-3">
          <div className="flex gap-2">
            {(["phaenomene", "uebungen", "auftraege"] as Tab[]).map((tb) => (
              <button key={tb} className={`eb-btn px-3 py-1 text-sm ${tab === tb ? "eb-btn-active" : ""}`} onClick={() => setTab(tb)}>
                {tb === "phaenomene" ? "🗺 Phänomene" : tb === "uebungen" ? "🫁 Übungen" : "⚑ Aufträge"}
              </button>
            ))}
          </div>
          <button className="eb-btn px-3 py-1 text-sm" onClick={onClose}>
            ✕ Schließen
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === "phaenomene" && (
            <div className="space-y-5">
              {archipelagos.map((arch) => (
                <div key={arch}>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-amber-200/80">{arch}</h3>
                  <div className="space-y-2">
                    {PHENOMENA.filter((p) => p.archipelago === arch).map((p) => {
                      const st = save.islands.find((i) => i.id === p.id)!;
                      const locked = p.final && !save.finalUnlocked;
                      return (
                        <div
                          key={p.id}
                          className="rounded-md border-2 px-3 py-2"
                          style={{
                            borderColor: st.overcome ? "#5b8a4a" : hsl(p.hue, 45, 35, 0.8),
                            background: st.overcome ? "rgba(70, 110, 55, 0.15)" : "rgba(12, 20, 34, 0.6)",
                          }}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-bold text-sky-50">
                              {locked ? "???" : p.name}
                              {st.overcome && (st.understood ? " 💬✓" : " ✓")}
                            </span>
                            <span className="text-[10px] text-sky-200/60">
                              {locked ? "verschlossen" : st.overcome ? (st.understood ? "verstanden & integriert" : "überwunden") : AROUSAL_LABEL[p.arousal]}
                            </span>
                          </div>
                          {!locked && (
                            <div className="mt-1 text-xs leading-relaxed text-sky-100/70">
                              {st.overcome ? p.insight : <span className="italic">Noch nicht bezwungen. Kategorie: {p.category}.</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="pt-2 text-[10px] leading-relaxed text-sky-200/40">
                Das Journal ersetzt keine Therapie. Bei akuten Krisen: Telefonseelsorge 0800 111 0 111 / 0800 111 0 222 oder 112.
              </p>
            </div>
          )}

          {tab === "uebungen" && (
            <div className="space-y-2">
              <p className="mb-3 text-xs leading-relaxed text-sky-100/70">
                Wirksamkeit richtet sich nach der Erregungslage des Phänomens: ★ = sehr wirksam, ▽ = kaum wirksam.
              </p>
              {EXERCISES.map((ex) => (
                <div key={ex.id} className="rounded-md border-2 border-sky-200/20 bg-[#0c1422]/60 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-bold text-sky-50">{ex.name}</span>
                    <span className="text-[10px] text-sky-200/60">
                      {ex.cost} PRÄS · {EFFECT_LABEL[ex.effect]}
                    </span>
                  </div>
                  <div className="mt-1 text-xs leading-relaxed text-sky-100/70">{ex.desc}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "auftraege" && (
            <div className="space-y-2">
              {QUESTS.filter((q) => questState(save, q.id) !== "unknown").length === 0 && (
                <p className="text-sm italic text-sky-200/60">
                  Noch keine Aufträge. Sprich mit den Bewohner*innen des Ankerplatzes — Mara, Tove, Kaj, Dr. Wiegand und Ben haben immer etwas zu tun.
                </p>
              )}
              {QUESTS.filter((q) => questState(save, q.id) !== "unknown").map((q) => {
                const st = questState(save, q.id);
                return (
                  <div
                    key={q.id}
                    className={`rounded-md border-2 px-3 py-2 ${st === "done" ? "border-emerald-600/50 bg-emerald-900/15" : "border-amber-300/30 bg-[#0c1422]/60"}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-sky-50">
                        {q.title} {st === "done" && "✓"}
                      </span>
                      <span className="text-[10px] text-sky-200/60">{st === "done" ? "erledigt" : "aktiv"}</span>
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-sky-100/70">{q.desc}</div>
                    {st === "active" && <div className="mt-1 text-xs font-bold text-amber-200/80">→ {q.goalDesc(save)}</div>}
                    {st === "done" && <div className="mt-1 text-xs text-emerald-200/70">Lohn: {q.reward}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
