// PHÄNOMENAUTIK 2 — NPCs auf dem Ankerplatz

export type NpcDomain =
  | "meer" | "schiff" | "uebungen" | "symptome" | "wissenschaft" | "gefuehle" | "lore";

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  color: number;       // Low-Poly-Figur
  x: number;           // Position auf dem Ankerplatz (lokal)
  z: number;
  domains: NpcDomain[];
  refersTo: Partial<Record<NpcDomain, string>>; // „Das fragst du besser …“
  greeting: string;
  greetingAgain: string;
  chips: string[];     // Schnellthemen
}

export const NPCS: NpcDef[] = [
  {
    id: "mara",
    name: "Mara",
    role: "die Lotsin",
    color: 0xc97b3d,
    x: -18,
    z: -10,
    domains: ["meer", "schiff", "lore"],
    refersTo: { uebungen: "Tove", symptome: "Tove", wissenschaft: "Dr. Wiegand", gefuehle: "Ben" },
    greeting:
      "He da drüben! Neue Segel in meinem Hafen — das kommt selten genug vor. Ich bin Mara, Lotsin des Ankerplatzes. Ich kenne jede Strömung zwischen hier und dem Sturmherd.",
    greetingAgain: "Wieder da, {name}? Die See hat dich also noch nicht satt. Gut so.",
    chips: ["Wie ist das Wetter?", "Was sind das für Inseln?", "Hast du eine Aufgabe für mich?", "Erzähl mir von diesem Meer"],
  },
  {
    id: "tove",
    name: "Tove",
    role: "die Heilerin",
    color: 0x7fbf6a,
    x: 14,
    z: -22,
    domains: ["uebungen", "symptome", "gefuehle"],
    refersTo: { meer: "Mara", schiff: "Kaj", wissenschaft: "Dr. Wiegand" },
    greeting:
      "Komm näher, setz dich einen Moment. Ich bin Tove. Ich sammle Übungen, die älter sind als jede Karte — Atem, Erde, Klang. Wenn dir die See mal in die Knochen fährt, komm zu mir.",
    greetingAgain: "Schön, dass du wieder an Land gehst, {name}. Wie fühlt sich dein Körper heute an?",
    chips: ["Was mache ich bei Panik?", "Erklär mir eine Übung", "Was ist ein Flashback?", "Hast du eine Aufgabe für mich?"],
  },
  {
    id: "kaj",
    name: "Kaj",
    role: "der Schiffbauer",
    color: 0x8a6f4d,
    x: 30,
    z: 8,
    domains: ["schiff", "meer"],
    refersTo: { uebungen: "Tove", symptome: "Tove", wissenschaft: "Dr. Wiegand", lore: "Mara" },
    greeting:
      "Steht du da rum oder holst du Holz? Haha — Scherz, willkommen. Kaj, Schiffbauer. Dein Kahn ist gut, aber er könnte SCHNELLER sein. Treibholz schwimmt überall da draußen, du musst es nur einsammeln.",
    greetingAgain: "{name}! Schon wieder Holz im Sinn? Ich mag das an dir.",
    chips: ["Kannst du mein Schiff ausbauen?", "Wo finde ich Treibholz?", "Hast du eine Aufgabe für mich?"],
  },
  {
    id: "ilse",
    name: "Dr. Ilse Wiegand",
    role: "die Forscherin",
    color: 0x9a7fd4,
    x: -4,
    z: 26,
    domains: ["wissenschaft", "symptome", "lore"],
    refersTo: { uebungen: "Tove", meer: "Mara", schiff: "Kaj", gefuehle: "Ben" },
    greeting:
      "Ah — eine Phänomenautin, ein Phänomenaut! Verzeihen Sie, ich werde selten unterbrochen. Dr. Ilse Wiegand. Ich kartografiere, was dieses Meer wirklich ist: das Nervensystem, ausgebreitet als Archipel.",
    greetingAgain: "Zurück von der Forschungsreise, {name}? Berichten Sie — jede Beobachtung zählt.",
    chips: ["Was ist das Nervensystem?", "Was bedeutet Polyvagal?", "Was ist das Toleranzfenster?", "Hast du eine Aufgabe für mich?"],
  },
  {
    id: "ben",
    name: "Ben",
    role: "der Überlebende",
    color: 0x6a8fc9,
    x: -30,
    z: 14,
    domains: ["gefuehle", "symptome"],
    refersTo: { uebungen: "Tove", wissenschaft: "Dr. Wiegand", meer: "Mara", schiff: "Kaj" },
    greeting:
      "Oh — hallo. Ich bin Ben. Ich war mal da draußen, auf See. Dann hat mich … etwas eingeholt. Seitdem sitze ich hier am Feuer und schaue aufs Wasser. Es ist schön hier. Meistens.",
    greetingAgain: "{name} … schön, dass du wieder da bist. Ehrlich. Es wird leiser hier, wenn jemand da ist.",
    chips: ["Wie geht es dir?", "Was ist dir passiert?", "Ich bringe dir etwas von Tove", "Hast du eine Aufgabe für mich?"],
  },
];
