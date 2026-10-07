// PHÄNOMENAUTIK 2 — Bord-KI: lokale Dialog-Engine für NPCs
// Intent-Erkennung + Wissensbasis (TRAUMAATLAS) + Persönlichkeiten + Gedächtnis.
// Läuft vollständig offline im Browser. Erkennt Krisenäußerungen und antwortet
// mit fürsorglichem Text + Notfallnummern.

import { PHENOMENA, AROUSAL_LABEL } from "./data";
import type { NpcDef, NpcDomain } from "./npc";
import type { SaveGame } from "./state";
import { activeQuests, completableQuests, offerableQuests, QUESTS } from "./quests";

export interface DialogReply {
  text: string;
  action?: { type: "setName"; name: string } | { type: "acceptQuest"; questId: string } | { type: "turnInQuest"; questId: string };
}

// ─── Normalisierung ────────────────────────────────────────────────

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Wissensbasis ──────────────────────────────────────────────────

interface KnowledgeEntry {
  id: string;
  domain: NpcDomain;
  pattern: RegExp;
  answer: (npc: NpcDef, save: SaveGame) => string;
}

const K = (id: string, domain: NpcDomain, pattern: RegExp, text: string): KnowledgeEntry => ({
  id,
  domain,
  pattern,
  answer: () => text,
});

const KNOWLEDGE: KnowledgeEntry[] = [
  // ── Symptome & Phänomene ──
  K("flashback", "symptome", /flashback|wiedererleb|intrusion|mitten im geschehen/,
    "Flashbacks sind Erinnerungen, die nicht wie Erinnerungen kommen — sondern wie Nachschub. Der Körper glaubt, es sei JETZT. Was hilft: laut benennen, was heute ist. Ort, Datum, dein Alter. Die 5-4-3-2-1-Erdung im Kampf wirkt deshalb so stark gegen den Falter."),
  K("albtraum", "symptome", /albt|traum|nachts wach|schlecht schlaf/,
    "Albträume sind Wiedererleben im Schlaf. Es gibt eine erforschte Gegenwehr: Imagination Rehearsal — du schreibst das Traumende tagsüber bewusst um und übst das neue Ende. Das Nervensystem ist lernfähig, auch nachts."),
  K("hypervigilanz", "symptome", /wachsam|hypervigilanz|standig auf der hut|gefahr uberall|schreckhaft/,
    "Ständige Wachsamkeit ist ein Dauerzustand des Sympathikus — der Körper hält Wache, obwohl der Krieg vorbei ist. Das ist keine Schwäche, es ist ein überlebensnotwendiger Dienst, der nicht abgelöst wurde. Was hilft: dem System tausendmal beweisen, dass jetzt sicher ist. Lang ausatmen. Blick schweifen lassen."),
  K("panik", "symptome", /panik|herzrasen|atemnot|enge in der brust|herz rast/,
    "Herzrasen und Enge ohne Befund sind vegetative Alarmzeichen — dein innerer Botenjunge, der nie gelernt hat, langsam zu gehen. Schnellste Gegenwehr: der physiologische Seufzer. Doppelt einatmen, laaang ausatmen. Das aktiviert den Vagusnerv binnen Sekunden."),
  K("vermeidung", "symptome", /vermeid|ausweich|drucken|schieb.*auf|prokrastin/,
    "Vermeidung funktioniert — kurzfristig. Deshalb ist sie so zäh. Langfristig hält sie das Alarmsystem am Laufen: Was nie berührt wird, bleibt gefährlich. Der Mittelweg ist dosierter Kontakt, keine Heldentaten. Ein Schritt, dann Luft holen, dann der nächste."),
  K("dissoziation", "symptome", /dissozi|nebenselbst|unwirklich|wie durch glas|weg sein|abwesend/,
    "Dissoziation ist die Notbremse des dorsalen Vagus: Wenn Kämpfen und Fliehen zwecklos waren, schaltet das System ab — wie durch Glas schauen. Das hat dich beschützt, als nichts anderes ging. Zurück kommst du über Aktivierung: Füße aufstampfen, Hände warm reiben, deinen Namen laut sagen."),
  K("erstarrung", "symptome", /erstarr|einfrier|freeze|gelahmt|kann mich nicht bewegen/,
    "Erstarren ist keine Entscheidung und kein Versagen — es ist die älteste Verteidigung überhaupt. Der Bogen spannt sich ohne Pfeil. Sanftes Durchbewegen hilft: Zehen wackeln, Finger, dann größer. Niemals forcieren. Erstarrung hasst Forderungen, aber sie mag Einladungen."),
  K("scham", "symptome", /scham|schuld|wertlos|kaputt|nicht gut genug|hass.*selbst/,
    "Hör gut zu, das ist wichtig: Tiefe Scham ist ein Kernsymptom komplexer Traumatisierung — keine Tatsache über dich. Das Gefühl 'kaputt zu sein' ist die innere Übernahme dessen, was dir angetan wurde. Es ist veränderbar. Du hast es nicht verdient, und du hast es nie verdient."),
  K("leere", "symptome", /leere|hoffnungslos|nichts fuhl|taub|freudlos|sinnlos/,
    "Innere Leere ist selten das Fehlen von Gefühl — sie ist Gefühl, das Sicherheiten gezogen hat. Gefühle kommen nicht auf Befehl zurück, aber über kleine, dosierte Sinneserfahrungen: Wärme der Tasse in der Hand, ein Lied, ein Atemzug, der bewusst ausklingt."),
  K("misstrauen", "symptome", /vertrau|misstrau|nahe|klammer|distanz|allein bleib/,
    "Wenn Nähe verletzt hat, wird sie zur Sehnsucht UND zur Bedrohung zugleich — Klammern und Wegstoßen sind zwei Seiten derselben Münze. Heilung passiert nicht per Beschluss, sondern durch kleine, verlässliche Nähe-Erfahrungen. Ein Mensch, der bleibt. Wieder und wieder."),
  K("koerper", "symptome", /magen|schmerz|haut|kopfweh|verspann|korperlich/,
    "Der Körper trägt die Geschichte mit — Magen, Haut, Kiefer, Schultern. Er reagiert oft früher als der Kopf; das vegetative Nervensystem 'merkt' sich Belastung. Körperorientierte Übungen sprechen genau diese Ebene an. Frag mich ruhig nach konkreten Übungen."),

  // ── Übungen ──
  K("erdung", "uebungen", /erdung|5 4 3 2 1|grounding/,
    "Die 5-4-3-2-1-Erdung: Nenne 5 Dinge, die du siehst. 4, die du hörst. 3, die du spürst. 2, die du riechst. 1, das du schmeckst. Danach drei lange Ausatmungen. Das zieht die Aufmerksamkeit aus dem Damals ins Jetzt — wirkt im Kampf stark gegen übererregte Phänomene."),
  K("seufzer", "uebungen", /seufzer|atmen|atemubung|doppel einatmen/,
    "Der physiologische Seufzer: Tief durch die Nase einatmen, dann noch einen kleinen Schluck Luft oben drauf — und laaang durch den Mund ausseufzen. Drei bis fünf Mal. Das ist die schnellste bekannte Bremse für den Sympathikus. Mitten im Gespräch machbar, keiner merkt es."),
  K("voo", "uebungen", /voo|summen|vagus.*stimul|klang|tonen/,
    "Der Voo-Klang: Tief einatmen, dann auf dem Ausatem ein tiefes, sonores 'Vooo' tönen lassen — wie ein Nebelhorn in deinem Bauch. Die Vibration massiert den Vagusnerv. Summen, Singen und bewusstes Gähnen wirken genauso. Vier bis sechs Wiederholungen."),
  K("schuetteln", "uebungen", /abschuttel|tremor|zittern/,
    "Abschütteln ist uralte Säugetier-Weisheit: Nach überlebener Gefahr schüttelt der Körper die Stresschemie ab. Steh mit weichen Knien, lass das Zittern aus den Beinen aufsteigen, 5–10 Minuten. Nicht steigern — zulassen. Bei komplexem Trauma zuerst mit Begleitung üben."),
  K("pendeln", "uebungen", /pendel/,
    "Pendeln kommt aus Somatic Experiencing: Spür kurz die belastende Empfindung — nur Sekunden — dann wechsle bewusst zu etwas Angenehmem. Enge, Wärme, Enge, Wärme. So lernt dein Nervensystem: Ich kann mich nähern UND zurückziehen. Das weitet das Toleranzfenster."),
  K("koerperscan", "uebungen", /korper.*scan|bodyscan|innere landkarte/,
    "Der Körperscan baut deine innere Landkarte: Wander mit der Aufmerksamkeit von den Füßen hoch zum Gesicht und frag an jeder Station nur 'Was ist hier?' — Druck, Wärme, Kribbeln, Nichts. Alles ist erlaubt, nichts muss bewertet werden."),
  K("sichererort", "uebungen", /sicherer ort|imagination|innerer ort/,
    "Der innere sichere Ort: Stell dir einen Ort vor — real oder erfunden — an dem du völlig sicher bist. Mach ihn greifbar: Was siehst, hörst, riechst du? Verankere ihn mit einer Geste, zwei Finger etwa. Dann ist er jederzeit abrufbar. Wichtig: Er muss sich WIRKLICH sicher anfühlen."),
  K("coreg", "uebungen", /co regulation|zusammen sein|andere menschen helfen|jemand anrufen/,
    "Co-Regulation ist das stärkste Regulationssystem überhaupt: Ein ruhiges, warmes Gegenüber reguliert dein Nervensystem über Stimme, Mimik und Rhythmus mit — automatisch, stärker als jede Solotechnik. Deshalb heilt, was in Beziehung verletzt wurde, auch vor allem IN Beziehung."),

  // ── Wissenschaft ──
  K("nervensystem", "wissenschaft", /nervensystem|vegetativ|autonom/,
    "Das autonome Nervensystem steuert, was du nicht befehlen kannst: Herzschlag, Atmung, Verdauung, Alarmbereitschaft. Es hat zwei große Regler — den Sympathikus (Gas: Kampf/Flucht) und den Parasympathikus (Bremse: Ruhe/Verdauung). Trauma klemmt das Gaspedal fest oder zieht die Notbremse."),
  K("polyvagal", "wissenschaft", /polyvagal|vagus|porges/,
    "Die Polyvagal-Theorie von Stephen Porges beschreibt drei Stufen: ventraler Vagus (sichere Verbundenheit), Sympathikus (Kampf/Flucht), dorsaler Vagus (Erstarrung/Shutdown). Traumafolgen sind Zustände dieses Systems — keine Charakterfehler. Und Zustände sind veränderbar."),
  K("toleranzfenster", "wissenschaft", /toleranzfenster|fenster der toleranz/,
    "Das Toleranzfenster ist der Erregungsbereich, in dem du denken UND fühlen kannst. Darüber: Übererregung — Herzrasen, Wut, Panik. Darunter: Untererregung — Taubheit, Leere, Erstarrung. Jede Übung auf diesem Meer tut im Kern dasselbe: Sie weitet dein Fenster."),
  K("ptbs", "wissenschaft", /ptbs|ptsd|posttraumatisch/,
    "PTBS — die posttraumatische Belastungsstörung — folgt meist einem einmaligen Ereignis: Intrusionen, Vermeidung, anhaltende Bedrohungswahrnehmung. Sie ist gut behandelbar, vor allem mit traumafokussierter KVT und EMDR. Das sind die Leitlinien-Verfahren."),
  K("kptbs", "wissenschaft", /komplex|kptbs|kindheitstrauma|entwicklungstrauma/,
    "Komplexe PTBS entsteht durch wiederholte oder langanhaltende Traumatisierung, oft in der Kindheit und in Abhängigkeitsbeziehungen. Seit 2022 ist sie in der ICD-11 eigenständig anerkannt. Zusätzlich zur PTBS-Trias kommen Affektdysregulation, negatives Selbstbild und Beziehungsstörungen. Hilfe: phasenorientierte Traumatherapie."),
  K("amygdala", "wissenschaft", /amygdala|mandelkern|alarmzentrale/,
    "Die Amygdala ist der Rauchmelder des Gehirns: schnell, grob, lieber einmal zu oft Alarm als einmal zu wenig. Nach Trauma ist sie feuere empfindlich eingestellt. Atmung, Erden und sichere Beziehungen justieren den Melder über Zeit neu — Bottom-up, nicht per Argument."),

  // ── Welt & Praktisches ──
  K("inseln", "lore", /insel|phanomen|archipel|was ist das fur/,
    "Jede Insel da draußen ist ein Phänomen — etwas, das Menschen nach schweren Zeiten erleben: Wiedererleben, Wachsamkeit, Vermeidung, Erstarrung, Scham. Solange du sie umschiffst, bleiben sie Stürme. Wenn du anlandest und ihnen begegnest, werden sie Landschaft."),
  K("sturmherd", "lore", /sturmherd|mitte|auge des/,
    "In der Mitte der Karte dreht sich der Sturmherd — das, was nie erzählt, nie geweint, nie gehört wurde. Er öffnet sich erst, wenn alle zwölf Phänomene überwunden sind. Man sagt: Wer ihm begegnet, kommt mit normalem Wetter zurück. Ehrlichem, menschlichem Wetter."),
  K("meer", "meer", /meer|see|ozean|wasser|wo sind wir/,
    "Dieses Meer steht auf keiner Karte der Welt, aber auf jeder Karte der Seele. Es besteht aus allem, was Menschen erlebt und überlebt haben. Deshalb segelt hier jeder irgendwann — die einen freiwillig, die anderen werden geworfen. Du hast ein Schiff. Das ist mehr, als viele haben."),
  K("wetter", "meer", /wetter|sturm|wellen|wind/,
    "Das Wetter hier folgt keinem Kalender — es folgt Erregung. Sturmzellen treiben über die See; drinnen ist es rau, aber es gibt nichts, was du nicht durchqueren oder umfahren könntest. Merks dir: Auch das schwerste Wetter ist WETTER. Es geht vorbei. Wetter geht immer vorbei."),
  K("treibholz", "schiff", /treibholz|holz|material|sammel/,
    "Treibholz schwimmt als goldene Planken auf dem Wasser — einfach mit dem Schiff drüberfahren. In Sturmzellen treibt mehr davon, aber Achtung: Dort schaukelt es übel. Bring es zu Kaj, er baut dir was Feines draus."),
  K("ausbau", "schiff", /ausbau|schneller|upgrade|tunen|verbesser/,
    "Kaj kann dein Schiff zweimal ausbauen — erst der Rumpf, dann die Segel. Danach frisst dein Kahn jede Welle von vorne. Bring ihm Treibholz, dann redet er von allein über Preise. Sprich: Er baut, du lieferst."),
  K("ankerplatz", "lore", /ankerplatz|hafen|dieser ort|wer lebt hier/,
    "Der Ankerplatz ist der einzige Fleck auf diesem Meer, der nie Phänomen war — oder schon so lange befriedet, dass es keiner mehr weiß. Hier landen die an, die zwischen zwei Stürmen Luft holen. Mara lotst, Tove heilt, Kaj baut, die Doktorin forscht. Und Ben … Ben wartet noch auf sein Wetter."),
];

// Phänomen-Fragen dynamisch ergänzen
for (const p of PHENOMENA) {
  const pName = p.name.toLowerCase().replace(/^(der|die|das)\s+/, "");
  KNOWLEDGE.push({
    id: `phen_${p.id}`,
    domain: "symptome",
    pattern: new RegExp(pName.split(/[ ,]/)[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "|" + p.id, "i"),
    answer: () =>
      `${p.name} — ${p.epithet}. Es haust im Archipel „${p.archipelago}" und ist ${AROUSAL_LABEL[p.arousal].toLowerCase()}. Im Kampf gilt: ${
        p.arousal === "hyper"
          ? "beruhigende Übungen wie Erdung, Seufzer oder Voo-Klang wirken am stärksten (★)."
          : p.arousal === "hypo"
            ? "aktivierende Übungen wie das Aktivierungs-SOS wirken am stärksten (★)."
            : "ausgleichende Übungen wie Pendeln oder Co-Regulation tragen am sichersten."
      } Oder du versuchst, es zu VERSTEHEN — manche Phänomene lassen sich eher umarmen als bezwingen.`,
  });
}

// ─── Persönlichkeits-Wrapper ───────────────────────────────────────

const OPENERS: Record<string, string[]> = {
  mara: ["Hör zu, Kind der See:", "Ahoi. Das sag ich dir so, wie ich's jeder Crew sage:", "Na gut, Seemanns-Weisheit gefällig?"],
  tove: ["Komm, atme einmal durch, während ich dir das sage:", "Mit warmen Händen gesprochen:", "Ich sag dir, was ich allen hier sage:"],
  kaj: ["Pass auf, so einfach ist das:", "Hört sich kompliziert an, ist es nicht:", "Ich erklär's dir wie an ner Werkbank:"],
  ilse: ["Wissenschaftlich gesprochen — aber ich übersetze:", "Eine gute Frage. Die Datenlage dazu:", "Lassen Sie mich das präzisieren:"],
  ben: ["Ich … ich weiß da was aus eigener Erfahrung:", "Das hat mir Tove mal erklärt, und es stimmt:", "Ich sag dir, was mir geholfen hat:"],
};

const pick = <T,>(arr: T[], seed: number): T => arr[Math.abs(seed) % arr.length];

// ─── Hauptfunktion ─────────────────────────────────────────────────

export function npcReply(npc: NpcDef, rawInput: string, save: SaveGame, turnCount: number): DialogReply {
  const input = norm(rawInput);
  const name = save.playerName || "Seefahrer";
  const mem = save.npcMemory[npc.id];

  // 0) Name vergeben
  const nameMatch = rawInput.match(/ich hei(?:ß|ss)e\s+([A-ZÄÖÜ][\p{L}]+)/u);
  if (nameMatch) {
    return {
      text: `${nameMatch[1]}. Ein guter Name für diese See. Ich werde ihn mir merken, ${nameMatch[1]} — versprochen.`,
      action: { type: "setName", name: nameMatch[1] },
    };
  }

  // 1) KRISENERKENNUNG — höchste Priorität
  if (/(umbringen|suizid|selbstmord|nicht mehr leben|will sterben|sterben will|mich toten|selbstverletz|ritzen|kein ausweg mehr)/.test(input)) {
    return {
      text: `Halt kurz inne — ich bin froh, dass du das aussprichst, und ich nehme es ernst. Was du gerade trägst, klingt zu schwer für ein Schiff allein. Bitte sprich noch heute mit Menschen, die genau dafür da sind: Telefonseelsorge 0800 111 0 111 oder 0800 111 0 222 (kostenfrei, rund um die Uhr), im akuten Notfall die 112. Du musst das nicht allein tragen. Wirklich nicht.`,
    };
  }

  // 2) Aufgaben
  if (/aufgabe|quest|was soll ich|kann ich helfen|arbeit fur mich|brauchst du was/.test(input)) {
    const completable = completableQuests(save, npc.id);
    if (completable.length > 0) {
      const q = completable[0];
      return {
        text: `Du hast es geschafft! „${q.title}" ist erledigt. Hier — ${q.reward}. Redlich verdient, ${name}.`,
        action: { type: "turnInQuest", questId: q.id },
      };
    }
    const offer = offerableQuests(save, npc.id);
    if (offer.length > 0) {
      const q = offer[0];
      return {
        text: `Tatsächlich, ja. Hört zu: ${q.desc} (Lohn: ${q.reward}) — Ich trage es dir ins Journal ein. Sag Bescheid, wenn es erledigt ist!`,
        action: { type: "acceptQuest", questId: q.id },
      };
    }
    const active = activeQuests(save);
    if (active.length > 0) {
      const lines = active.map((q) => `• ${q.title}: ${q.goalDesc(save)}`).join("\n");
      return { text: `Du hast schon genug auf dem Zettel, ${name}:\n${lines}\nKomm wieder, wenn davon etwas erledigt ist.` };
    }
    return { text: `Im Moment ist alles vergeben, ${name}. Die See wird schon für Nachschub sorgen — das tut sie immer.` };
  }

  if (/^(ja|gern|ich mache es|mach ich|bin dabei|okay|abgemacht|einverstanden)/.test(input)) {
    const offer = offerableQuests(save, npc.id)[0];
    if (offer) {
      return {
        text: `Abgemacht! „${offer.title}" steht jetzt in deinem Journal. ${offer.goalDesc(save)} — und komm heil zurück, ${name}.`,
        action: { type: "acceptQuest", questId: offer.id },
      };
    }
    const own = activeQuests(save).find((q) => q.giver === npc.id || q.turnIn === npc.id);
    if (own) {
      return { text: `Du hast den Auftrag ja schon an der Angel: „${own.title}" — ${own.goalDesc(save)}. Ich warte hier, keine Eile.` };
    }
    return { text: pick(["Das freut mich, " + name + ".", "Abgemacht — worauf auch immer du dich gerade freust, ich freue mich mit.", "Gut so. Sag Bescheid, wenn du was brauchst."], turnCount) };
  }

  // 3) Smalltalk
  if (/^(hi|hallo|hey|servus|moin|na |guten tag|guten morgen|guten abend)/.test(input)) {
    return { text: mem?.met ? npc.greetingAgain.replace("{name}", name) : npc.greeting };
  }
  if (/wie geht|wie fuhlst|alles gut|was machst du/.test(input)) {
    const moods: Record<string, string> = {
      mara: "Mir? Der Rücken meckert, der Horizont nicht — also alles im Lot. Wichtiger: Wie geht's DIR, nach all der Seefahrt?",
      tove: "Danke der Nachfrage — die wenigsten fragen die Heilerin. Mir geht es gut, wenn es euch gut geht. Und dir selbst? Spür mal kurz in dich hinein, ich warte.",
      kaj: "Gut! Die Werkbank steht, das Holz trocknet, was will man mehr. Dir fehlt noch ein ordentlicher Ausbau, aber das kriegen wir hin.",
      ilse: "Fasziniert, wie immer — jede Rückkehr von Ihnen bringt neue Datenpunkte. Aber ich glaube, Sie fragen höflich. Also: gut, danke.",
      ben: "Besser, seit du manchmal vorbeischaust. Manche Tage sind lauter als andere, wenn du verstehst. Heute ist … ein leiserer Tag.",
    };
    return { text: moods[npc.id] ?? "Es geht. Und dir?" };
  }
  if (/danke/.test(input)) {
    return { text: pick(["Nichts zu danken. Dafür ist ein Hafen da.", "Gern geschehen — und pass auf dich auf da draußen.", "Immer wieder gern, " + name + "."], turnCount) };
  }
  if (/tschuss|auf wiedersehen|bye|leb wohl|machs gut|ich muss weiter/.test(input)) {
    return { text: pick(["Ruhige See dir, " + name + ". Und denk dran: Wetter geht vorbei.", "Leb wohl — der Ankerplatz bleibt, wo er ist. Komm wieder.", "Segel gut. Und falls es stürmt: Du weißt, wo du uns findest."], turnCount) };
  }
  if (/wer bist du|was machst du hier|dein name/.test(input)) {
    return { text: mem?.met ? npc.greeting : npc.greeting };
  }

  // 4) Gefühle des Spielers (Empathie, vor Wissensbasis)
  if (/ich habe angst|mir ist angst|ich bin traurig|ich fuhle mich allein|ich bin mude|ich kann nicht mehr|es ist zu viel|ich bin verzweifelt/.test(input)) {
    const comfort: Record<string, string> = {
      tove: `Das darf sein, ${name}. Alles davon. Leg für einen Moment eine Hand auf deinen Brustkorb — spür die Wärme. Atme in die Hand hinein. Du musst jetzt nichts lösen, nur diesen einen Atemzug. Und wenn es zu schwer wird: Telefonseelsorge, 0800 111 0 111, rund um die Uhr. Auch ich bleibe hier.`,
      ben: `Ich … kenne das. Wirklich. An solchen Tagen hilft es mir, einfach neben jemandem zu sitzen, ohne dass einer reden muss. Setz dich zu mir ans Feuer, solange du willst. Und Tove hat mir mal gesagt: Gefühle sind Wetter, keine Klimazone. Es stimmt.`,
      mara: `Dann hast du gute Menschen an Bord, ${name} — uns. Jede Crew der Welt hatte solche Tage. An Land gehen, Tee trinken, schlafen. Morgen sieht dieselbe See schon anders aus. Versprochen.`,
      ilse: `Das ist eine nachvollziehbare Reaktion auf eine anstrengende Reise — kein Defekt. Die Forschung ist da eindeutig: Erst regulieren, dann reflektieren. Tove ist die Expertin dafür. Aber bleiben Sie gern erst mal hier sitzen.`,
      kaj: `Hey. Runter vom Schiff, Hände an die Werkbank, was Anfassen hilft. Du musst nicht stark sein, nur da. Und wenn's dunkler wird, als Werkbänke reichen — Tove ist die Richtige, ehrlich.`,
    };
    return { text: comfort[npc.id] ?? comfort.tove };
  }

  // 5) Wissensbasis
  for (const entry of KNOWLEDGE) {
    if (entry.pattern.test(input)) {
      const known = mem?.topics.includes(entry.id);
      const opener = pick(OPENERS[npc.id] ?? OPENERS.mara, turnCount + entry.id.length);
      const text = (known ? "Das hatten wir schon — aber es verträgt Wiederholung: " : opener + " ") + entry.answer(npc, save);
      if (!npc.domains.includes(entry.domain)) {
        const ref = npc.refersTo[entry.domain];
        return {
          text: `${entry.answer(npc, save)}${ref ? `\n\nAber ehrlich gesagt: Dafür ist ${ref} die bessere Anlaufstelle — steht auch hier auf dem Ankerplatz.` : ""}`,
        };
      }
      return { text };
    }
  }

  // 6) Fallback
  const fallbacks: Record<string, string[]> = {
    mara: ["Hmm, das übersteigt meine Seekarten. Frag mich gern nach dem Meer, den Inseln, dem Wetter — oder 'Aufgabe' für Arbeit.", "Darauf hab ich keine Antwort im Logbuch. Aber wenn du was über Stürme, Strömungen oder die Archipele wissen willst: her damit."],
    tove: ["Das muss ich mir in Ruhe durch den Kopf gehen lassen. Frag mich gern nach Übungen, nach dem Körper, nach allem, was unter die Haut geht.", "Da bin ich überfragt — aber wenn dir etwas in Glieder oder Herz fährt, dafür bin ich da."],
    kaj: ["Keine Ahnung, ehrlich. Holz, Wellen, Wind — das sind meine Sprachen. Oder sag 'Aufgabe', dann machen wir was Handfestes.", "Versteh ich nicht ganz. Reden wir über dein Schiff? Darüber kann ich STUNDEN reden."],
    ilse: ["Interessante Frage — außerhalb meines derzeitigen Korpus. Fragen Sie mich zum Nervensystem, zur Polyvagal-Theorie oder zu den Phänomenen.", "Dazu habe ich keine belastbaren Daten. Aber über Trauma-Forschung weiß ich Einiges."],
    ben: ["Sorry, ich … da weiß ich nichts zu. Aber wenn du wissen willst, wie sich das alles ANFÜHLT, oder einfach jemanden am Feuer brauchst — dafür bin ich gut.", "Hm, das kann ich nicht beantworten. Aber zuhören kann ich. Immer."],
  };
  return { text: pick(fallbacks[npc.id] ?? fallbacks.mara, turnCount + input.length) };
}

export function questById(id: string) {
  return QUESTS.find((q) => q.id === id);
}
