# PHÄNOMENAUTIK 3 — Übergabe & Spezifikation für den Neubau

**Stand:** 2026-10-07 · Autor: Vorgänger-Chat · Empfänger: neuer Chat
**Auftrag:** Phänomenautik komplett neu aufsetzen („zurück ans Zeichenbrett").
V2 bleibt als Referenz bestehen, die Grafik wurde als unzureichend bewertet.

---

## 1. Bestehende Assets (Repos, Deployments, Inhalte)

| Was | Wo |
|---|---|
| V1 (2D Canvas, eingefroren) | github.com/ralfarminkirchner-netizen/phaenomenautik · https://phaenomenautik-production.up.railway.app |
| V2 (3D three.js, Referenz) | github.com/ralfarminkirchner-netizen/phaenomenautik-2 · https://phaenomenautik-2-production.up.railway.app |
| Lokale Projekte | `/Users/raki/Documents/Kimi/Workspaces/TRAUMAATLAS/phaenomenautik` und `…/phaenomenautik-2` |
| Inhaltsquelle | TRAUMAATLAS: `/Users/raki/Documents/Kimi/Workspaces/TRAUMAATLAS/traumaatlas-3/src/data/` (32 Symptome, 12 Übungen, Erklärtexte) |

**Aus V2 wiederverwendbar (inhaltlich stark, technisch portierbar):**
- `src/game/data.ts` — 13 Phänomene mit Namen, Beinamen, Angriffen, Intro-/Verstehen-/Sieges-Texten, Atlas-Insights, 11 Übungen mit Erregungs-Wirkungsmatrix (hyper/hypo/both), Items, Levelkurve. **Vollständig übernehmen.**
- `src/game/dialogAI.ts` + `npc.ts` + `quests.ts` — lokale Dialog-KI (Intent-Engine, Wissensbasis, Krisenerkennung mit Notfallnummern), 5 NPC-Persönlichkeiten, 6 Quests. **Vollständig übernehmen.**
- `src/game/audio.ts` — generatives WebAudio (Meer, Sturm, Donner, SFX). Übernehmen.
- Kampflogik (rundenbasiert, „Verstehen"-Mechanik, rollende Zähler) aus `BattleScreen3D.tsx` — Logik übernehmen, Präsentation neu.

## 2. Kritik an V2 (Nutzerfeedback, wörtlich zu beachten)

- „Die Grafik ist unter aller Sau" / „völlig unterirdisch" — Wellen, Transparenzen, Wasserberechnungen waren sichtbar nicht überzeugend.
- Konsequenz: **Grafik ist die oberste Priorität.** Kein Feature-Ausbau, bevor Wasser/Beleuchtung/Animation nicht sichtbar hochwertig sind.
- Man kann nicht aussteigen — reine Schiffsperspektive fühlt sich wie eine Demo an, nicht wie ein Spiel.

### Technische Lehren aus V2 (nicht wiederholen)
1. **Wellen-Amplituden waren zu klein** — Gerstner-Amplituden wurden durch zu viele Summanden verwässert. Wenige, große, gut lesbare Wellen schlagen viele kleine.
2. **Wasser wirkte flach**, weil Fresnel/Transparenz ohne Normal-Detail-Texturen und ohne Schaum-Sprites klinisch wirken. Empfehlung: bewährte three.js-`Water`-Basis (examples/jsm) oder eigenes Shader-Setup mit Noise-Normalmaps, Scroll-Texturen für Schaum, Sky-Reflection via CubeMap.
3. **Performance-Budget beachten**: im eingebetteten Browser/SwiftShader war die 230×230-Segment-Wasserebene zu schwer (Typewriter liefen in Zeitlupe). Auflösung adaptiv wählen, `renderer.setPixelRatio` deckeln, FPS-Messung einbauen.
4. **Visuelle Verifikation ist Pflicht**: nach jedem Meilenstein Playwright-Screenshots (Chromium aus `traumaatlas-3/node_modules`) UND auf echter GPU prüfen, nicht nur „keine Konsolenfehler".
5. TypeScript-Config der Scaffold-Vorlage erzwingt `erasableSyntaxOnly` → keine Parameter-Properties (`constructor(private x)`) verwenden.
6. NPC-Sprechradien müssen zur Kollisionsgeometrie passen (V2-Bug: Schiff kam nie nah genug heran).

## 3. Anforderungen V3 (vom Nutzer, alle verbindlich)

### 3.1 Aussteigen & Zu-Fuß-Modus
- Vom Schiff aussteigen (Anlegen an Ufern/Pier), zu Fuß auf Inseln laufen (Third-Person-Charakter-Controller mit Kapsel-Kollision, Laufen/Sprinten).
- Wieder einsteigen, Schiff bleibt vertäut.

### 3.2 Welt
- **Deutlich größere, begehbare Inseln** mit Terrain-Relief, Stränden, Höhlen/Hainen, Points of Interest.
- Dynamisches, sichtbar hochwertiges Wasser (Wellen, Transparenz, Schaum, Brandung gegen Küsten), Wetter/Stürme bleiben, Tag/Nacht empfohlen.
- **Kompass-UI**: HUD-Kompassrose + 3D-Pfeil/Beacon, der zum nächsten sinnvollen Ziel zeigt (nächstes unbesiegtes Phänomen, aktiver Quest-Ort, Hafen).

### 3.3 Interaktion & Systeme (zu Fuß)
- **Springen** und allgemeine Aktionstaste (E): Objekte aufheben, verschieben, aktivieren — Umgebung manipulierbar (Hebel, Steine, Lagerfeuer anzünden, Brücken).
- **Holz hacken**: Bäume fällbar mit Axt → Holz-Ressource (baut auf Treibholz-System auf).
- **„Kraft in Feuer machen"**: gesammelte Energie/Ressourcen am Feuer in Buffs/Heilung/Schiffsupgrades umwandeln (Lagerfeuer als Crafting-/Rastpunkt; Kochstelle).
- **Kampf zu Fuß gegen Monster**: Action-Kampf (Schlag/Ausweichen) gegen kleinere „Schatten"-Gegner auf den Inseln; die großen Phänomen-Bosse behalten optional das rundenbasierte System mit „Verstehen" — oder werden hybride Arena-Kämpfe. Entscheidung im neuen Chat treffen und begründen.
- **Waffen aufwerten**: Werkbank am Ankerplatz (Kaj) — Materialien (Holz, Kristalle von Phänomenen) → Schadens-/Effektstufen.

### 3.4 Bestand (weiterführen)
- 12 Phänomen-Inseln + Sturmherd-Finale, Übungs-/Erregungssystem, Verstehen-Mechanik, Journal mit Atlas-Texten, NPC-Dialog-KI + Quests, Spielstand (localStorage), Disclaimer/Telefonseelsorge an Titel/Journal/Abspann.

## 4. Empfohlene technische Richtung

- **Stack beibehalten**: React + TS + Vite + Tailwind (Scaffold via webapp-building-Skill), three.js.
- **Charakter-Controller**: eigenes Kapsel-Rig (raycast Boden, Sprung mit Coyote-Time) oder `three-stdlib`-Ansatz; Kamera: Third-Person-Follow mit Schulteroffset, Maus-Orbit.
- **Terrain**: Heightmap-basierte Inseln (PlaneGeometry + Noise, Vertexfarben nach Höhe/Steigung), Küsten-SDF für Schaum & Brandung.
- **Wasser**: zuerst three.js `Water`/`Water2` als Qualitätsbaseline evaluieren, dann customisieren; Transparenz + Reflexion sichtbar machen.
- **Gegner zu Fuß**: Creature-Shader aus V2 (`creature.ts`) als Basis ist gut — Körper/Angriffsanimationen und Partikel können übernommen werden.
- **Struktur-Vorschlag**: `three/world` (Meer+Schiff), `three/island` (Zu-Fuß-Szenen), `game/systems` (Inventory, Combat, Crafting, Quests), klare State-Maschine `sailing ↔ onfoot ↔ battle ↔ dialog`.
- **QA-Ritual**: nach jedem Meilenstein Screenshot-Vergleich + 60-FPS-Check; Grafik früh dem Nutzer zeigen (Preview-Link), bevor Systeme ausgebaut werden.

## 5. Definition of Done (erster Meilenstein V3)

1. Zu Fuß über eine große Insel laufen, springen, Baum fällen, Feuer anzünden — alles sichtbar flüssig.
2. Wasser überzeugt auf echter GPU im Vollbild (Wellenhöhe, Transparenz, Brandung).
3. Kompass mit Zielpfeil funktioniert See- und Landmodus-übergreifend.
4. Ein Schatten-Gegner zu Fuß bekämpfbar, Waffe einmal aufwertbar.
5. Playwright-Run ohne Konsolenfehler + Screenshots, die der Nutzer absegnet.

*Dann erst: alle Inseln, Bosse, Quests, Dialog-KI, Feinschliff.*
