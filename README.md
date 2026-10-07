# PHÄNOMENAUTIK 2

**Die Phänomene sind Inseln. Du hast ein Schiff. Und diesmal schaukelt es.**

Ein Browser-RPG auf Basis des [TRAUMAATLAS](https://github.com/ralfarminkirchner-netizen) —
im Stil von Earthbound/Mother und Persona, als Echtzeit-3D-Welt in Low-Poly-Optik.
Nachfolger von [Phänomenautik v1](https://github.com/ralfarminkirchner-netizen/phaenomenautik) (2D Canvas, eingefroren).

## Spiel

Du steuerst die **MS Toleranz** über ein dynamisches Echtzeit-Meer zu zwölf
Phänomen-Inseln (Flashback-Falter, Hypervigilanz-Wächter, Dissozia, Scham-Golem …),
begegnest ihnen in rundenbasierten Konfrontationen und überwindest sie — oder
**verstehst** sie, was mehr ist. Sind alle zwölf befriedet, öffnet sich das Auge
des Atlanten: der **Sturmherd**, das Unerzählte in der Mitte aller Karten.

Auf dem **Ankerplatz** (Hafeninsel) leben fünf NPCs mit eigener Bord-KI:
Mara (Lotsin), Tove (Heilerin), Kaj (Schiffbauer), Dr. Ilse Wiegand (Forscherin)
und Ben (Überlebender). Mit ihnen kann man sich frei über Symptome, Phänomene,
Übungen und das Nervensystem unterhalten, Aufgaben annehmen (Botengänge,
Treibholz-Sammeln, Feldforschung, Bens Mutprobe), Nachrichten überbringen und
das Schiff ausbauen.

### Features

- **Echtzeitwasser**: Gerstner-Wellen im Vertex-Shader, Transparenz, Fresnel,
  Sonnenglanz, Kammschaum — CPU-gespiegelt für Physik und Brandung
- **Dynamische Szene**: Das Schiff schaukelt (Nick/Roll aus der Wellennormale),
  hüpft über Kämme, zieht Kielwasser und Bug-Gischt; die Kamera schwimmt mit
- **Brandung**: Atmende Schaumringe und Gischt-Bursts, wo Wellen gegen Inseln schlagen
- **Wetter**: Wettermaschine + drei driftende Sturmzellen, Regen, prozedurale Blitze,
  Nebel, Sturmvignette, generatives Audio (Meer, Wind, Donner)
- **Spektrale 3D-Phänomene**: durchscheinende „weiße Schatten" mit Fresnel-Glühen,
  Vertex-Flimmern, Idle-Animation, Orbit-Partikeln, Auflösungs-Choreografie
- **NPC-Dialog-KI** (lokal, offline): Intent-Erkennung, TRAUMAATLAS-Wissensbasis
  (Symptome, Übungen, Polyvagal, Toleranzfenster, PTBS/KPTBS), Persönlichkeiten,
  Gedächtnis, Empathie- und Krisenerkennung mit Notfallnummern
- **Kampfsystem**: Erregungs-Wirkungsmatrix (hyper/hypo/both × 11 Atlas-Übungen),
  Verstehen-Mechanik mit friedlicher Integration, rollende Kilometerzähler,
  Typewriter-Textboxen, Level-/Item-System
- **Quests**, Schiffsausbau, Treibholz, Bordjournal mit Atlas-Wissen, Spielstand im localStorage

## Technik

React 19 + TypeScript + Vite 7 + Tailwind · **three.js** (eigene GLSL-Shader für
Wasser, Himmel und Geister) · CPU-Partikelsysteme · WebAudio (generativ, keine Assets)

```bash
npm install
npm run dev    # Entwicklungsserver
npm run build  # Produktionsbuild → dist/
```

## Steuerung

`WASD` / Pfeile — steuern · Maus ziehen — Kamera · Rad — Zoom ·
`E` — anlanden / sprechen · `J` — Journal

## Hinweis

Phänomenautik 2 ist ein Spiel auf Basis des TRAUMAATLAS und **ersetzt keine
Psychotherapie**. Bei akuten Krisen: Telefonseelsorge 0800 111 0 111 /
0800 111 0 222 (kostenfrei, rund um die Uhr) oder 112.
