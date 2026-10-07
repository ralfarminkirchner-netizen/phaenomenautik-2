// PHÄNOMENAUTIK 2 — NPC-Dialog: Chat-Oberfläche mit der Bord-KI,
// Schnellthemen-Chips, Quest-Annahme/-Abgabe, NPC-Gedächtnis.

import { useEffect, useRef, useState } from "react";
import { NPCS, type NpcDef } from "../game/npc";
import { npcReply } from "../game/dialogAI";
import { audio } from "../game/audio";
import type { SaveGame } from "../game/state";
import { questById } from "../game/dialogAI";
import { questState } from "../game/quests";

interface NpcDialogProps {
  npcId: string;
  save: SaveGame;
  onSaveChange: (s: SaveGame) => void;
  onClose: () => void;
}

interface Msg {
  from: "npc" | "player";
  text: string;
}

export function NpcDialog({ npcId, save, onSaveChange, onClose }: NpcDialogProps) {
  const npc: NpcDef = NPCS.find((n) => n.id === npcId)!;
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [turn, setTurn] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  // Begrüßung + NPC als „getroffen“ markieren
  useEffect(() => {
    const s = saveRef.current;
    const mem = s.npcMemory[npc.id];
    const first: Msg = {
      from: "npc",
      text: (mem?.met ? npc.greetingAgain.replace("{name}", s.playerName || "Seefahrer") : npc.greeting),
    };
    setMsgs([first]);
    if (!mem?.met) {
      const next: SaveGame = { ...s, npcMemory: { ...s.npcMemory, [npc.id]: { met: true, topics: [], favors: 0 } } };
      onSaveChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npc.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    audio.select();
    const s = saveRef.current;
    const reply = npcReply(npc, text, s, turn);

    // Thema merken
    let next: SaveGame = { ...s, npcMemory: { ...s.npcMemory } };
    const mem = next.npcMemory[npc.id] ?? { met: true, topics: [], favors: 0 };
    next.npcMemory[npc.id] = { ...mem, topics: [...new Set([...mem.topics, text.slice(0, 24)])].slice(-12) };

    // Aktionen anwenden
    if (reply.action?.type === "setName") {
      next = { ...next, playerName: reply.action.name };
    } else if (reply.action?.type === "acceptQuest") {
      const qid = reply.action.questId;
      if (questState(next, qid) === "unknown") {
        next = { ...next, quests: { ...next.quests, [qid]: "active" } };
      }
    } else if (reply.action?.type === "turnInQuest") {
      const q = questById(reply.action.questId);
      if (q && questState(next, q.id) === "active") {
        q.applyReward(next);
        next = { ...next, quests: { ...next.quests, [q.id]: "done" } };
      }
    }
    onSaveChange(next);

    setMsgs((m) => [...m, { from: "player", text }, { from: "npc", text: reply.text }]);
    setInput("");
    setTurn((t) => t + 1);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center" onClick={onClose}>
      <div className="eb-panel flex h-[min(560px,86vh)] w-[min(620px,94vw)] flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Kopf */}
        <div className="flex items-center justify-between border-b-2 border-sky-200/20 px-5 py-3">
          <div>
            <div className="text-base font-bold text-amber-100">{npc.name}</div>
            <div className="text-xs italic text-sky-200/70">{npc.role} · Ankerplatz</div>
          </div>
          <button className="eb-btn px-3 py-1 text-sm" onClick={onClose}>
            ⛵ Zurück zum Schiff
          </button>
        </div>

        {/* Verlauf */}
        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {msgs.map((m, i) =>
            m.from === "npc" ? (
              <div key={i} className="flex justify-start">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-tl-sm border-2 border-sky-200/25 bg-[#16233a] px-4 py-2.5 text-sm leading-relaxed text-sky-50">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-xl rounded-tr-sm border-2 border-amber-200/30 bg-[#3a2f1a] px-4 py-2.5 text-sm leading-relaxed text-amber-50">
                  {m.text}
                </div>
              </div>
            ),
          )}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {npc.chips.map((c) => (
            <button key={c} className="eb-btn px-2.5 py-1 text-[11px]" onClick={() => send(c)}>
              {c}
            </button>
          ))}
          <button className="eb-btn px-2.5 py-1 text-[11px]" onClick={() => send("Hast du eine Aufgabe für mich?")}>
            ⚑ Aufgabe?
          </button>
        </div>

        {/* Eingabe */}
        <form
          className="flex gap-2 border-t-2 border-sky-200/20 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Sprich mit ${npc.name} … (z. B. „Was mache ich bei Panik?“, „Ich heiße …“)`}
            className="min-w-0 flex-1 rounded-md border-2 border-sky-200/30 bg-[#0c1422] px-3 py-2 text-sm text-sky-50 outline-none placeholder:text-sky-200/40 focus:border-amber-200/60"
          />
          <button type="submit" className="eb-btn px-4 py-2 text-sm">
            Sagen
          </button>
        </form>
      </div>
    </div>
  );
}
