// ═══════════════════════════════════════════════════════════════════
// PHÄNOMENAUTIK — Spieldaten
// Inhaltlich aufgebaut auf dem TRAUMAATLAS (Symptomatlas + Übungsbibliothek)
// Phänomene = Inseln · Übungen = Fähigkeiten · Erregungslage = Elementarsystem
// ═══════════════════════════════════════════════════════════════════

export type Arousal = "hyper" | "hypo" | "both";

export interface ExerciseDef {
  id: string;
  name: string;
  effect: Arousal;          // hyper = beruhigt · hypo = aktiviert · both = gleicht aus
  cost: number;             // Präsenz-Kosten
  power: number;            // Basiswirkung gegen Intensität
  heal: number;             // Stabilitäts-Heilung
  guard?: boolean;          // halbiert nächsten gegnerischen Treffer
  desc: string;
}

export interface PhenomenonAttack {
  name: string;
  min: number;
  max: number;
  line: string;             // Kampftext
}

export interface PhenomenonDef {
  id: string;
  name: string;
  epithet: string;          // Earthbound-mäßiger Beiname
  archipelago: string;
  category: string;         // Atlas-Kategorie
  arousal: Arousal;
  intensity: number;        // HP des Phänomens
  armor: number;            // Schadensreduktion
  xp: number;               // Einsicht
  hue: number;              // Farbwelt (0–360)
  shape: "eye" | "bird" | "golem" | "ghost" | "void" | "fish" | "crystal" | "storm";
  spriteScale: number;
  attacks: PhenomenonAttack[];
  intro: string[];          // Text beim Anlanden
  understand: string[];     // Zeilen beim „Verstehen“ (rotierend)
  winLine: string;          // wenn überwunden
  peaceLine: string;        // wenn verstanden & integriert
  insight: string;          // Journaleintrag (Atlas-Wissen)
  final?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  heal: number;
  desc: string;
}

// ─── Übungen (aus der Atlas-Übungsbibliothek) ─────────────────────

export const EXERCISES: ExerciseDef[] = [
  {
    id: "erdung",
    name: "5-4-3-2-1-Erdung",
    effect: "hyper",
    cost: 6,
    power: 14,
    heal: 2,
    desc: "Fünf Dinge sehen, vier hören … zurück ins Hier und Jetzt.",
  },
  {
    id: "seufzer",
    name: "Physiologischer Seufzer",
    effect: "hyper",
    cost: 5,
    power: 11,
    heal: 4,
    desc: "Doppel-einatmen, lang ausatmen. Der Vagusnerv antwortet sofort.",
  },
  {
    id: "voo",
    name: "Der Voo-Klang",
    effect: "hyper",
    cost: 9,
    power: 17,
    heal: 6,
    desc: "Ein tiefer Ton, der Brust und Bauch zum Schwingen bringt.",
  },
  {
    id: "schuetteln",
    name: "Abschütteln (Tremor)",
    effect: "hyper",
    cost: 12,
    power: 24,
    heal: 0,
    desc: "Wie das Reh nach der Flucht: die Stressenergie verlässt den Körper.",
  },
  {
    id: "aktivierung",
    name: "Aktivierungs-SOS",
    effect: "hypo",
    cost: 6,
    power: 14,
    heal: 2,
    desc: "Aufstampfen, Hände reiben, den eigenen Namen rufen.",
  },
  {
    id: "orientierung",
    name: "Orientierungsreflex wecken",
    effect: "both",
    cost: 5,
    power: 10,
    heal: 0,
    desc: "Augen wandern lassen, den Raum benennen: Tür. Fenster. Lampe.",
  },
  {
    id: "pendeln",
    name: "Pendeln",
    effect: "both",
    cost: 9,
    power: 16,
    heal: 3,
    desc: "Zwischen Enge und Wärme hin- und herschwingen, Sekunde für Sekunde.",
  },
  {
    id: "koerperscan",
    name: "Kurzer Körperscan",
    effect: "both",
    cost: 8,
    power: 12,
    heal: 5,
    guard: true,
    desc: "Die innere Landkarte abfahren — was wahrgenommen wird, verliert Schrecken.",
  },
  {
    id: "ort",
    name: "Innerer sicherer Ort",
    effect: "both",
    cost: 14,
    power: 8,
    heal: 18,
    desc: "Ein Ort vollkommener Sicherheit, jederzeit abrufbar.",
  },
  {
    id: "beruehrung",
    name: "Selbstberuhigende Berührung",
    effect: "hyper",
    cost: 7,
    power: 9,
    heal: 10,
    desc: "Eine Hand auf dem Brustkorb. Wärme. Gewicht. Atem.",
  },
  {
    id: "coregulation",
    name: "Co-Regulation",
    effect: "both",
    cost: 13,
    power: 20,
    heal: 8,
    desc: "Eine vertraute Stimme holt dich zurück. Das stärkste Regulationssystem.",
  },
];

export const ITEMS: ItemDef[] = [
  { id: "wasser", name: "Warmes Wasser", heal: 16, desc: "Ein bewusster Schluck. Spüre den Weg im Hals." },
  { id: "karte", name: "Notfallkarte", heal: 32, desc: "Darauf steht dein Name, der Ort, das Datum. Es hilft." },
  { id: "anker", name: "Ankerstein", heal: 0, desc: "Stellt 14 Präsenz wieder her." },
];

// ─── Phänomene = Inseln ────────────────────────────────────────────

export const PHENOMENA: PhenomenonDef[] = [
  {
    id: "flashback",
    name: "Der Flashback-Falter",
    epithet: "Hüter des gestrigen Jetzt",
    archipelago: "Das Wiederkehr-Riff",
    category: "Wiedererleben (Intrusionen)",
    arousal: "hyper",
    intensity: 46,
    armor: 0,
    xp: 22,
    hue: 300,
    shape: "eye",
    spriteScale: 1.0,
    attacks: [
      { name: "Zeitsprung", min: 5, max: 9, line: "Der Falter schlägt mit den Flügeln — und es ist wieder damals!" },
      { name: "Blitzlicht", min: 4, max: 8, line: "Ein grelles Bild brennt sich in den Moment!" },
      { name: "Rückfallwind", min: 3, max: 7, line: "Die Luft riecht plötzlich nach damals!" },
    ],
    intro: [
      "Die Insel flimmert. Die Luft hier ist dicker, als wäre sie zweimal bewohnt.",
      "Aus dem Gestrüpp hebt sich ein riesiger Falter, dessen Flügel wie alte Fotos aussehen.",
      "DER FLASHBACK-FALTER will dich in ein Gestern ziehen, das nie vergehen wollte!",
    ],
    understand: [
      "Du bleibst stehen. „Das war damals“, sagst du. „Das ist jetzt.“ Der Falter zögert.",
      "Du nennst laut den Ort, das Datum, dein Alter. Die Flügelbilder verblassen ein wenig.",
      "Der Falter zeigt dir sein Bild nicht mehr — er zeigt dir, dass er Angst hat, es zu verlieren.",
      "Du erkennst: Er will nicht quälen. Er will nur endlich gehört werden.",
    ],
    winLine: "Der Flashback-Falter sinkt zu Boden und wird zu einem stillen Foto in deiner Hand.",
    peaceLine: "Der Falter landet auf deiner Schulter. Er wird leicht — ein Erinnern ohne Ertrinken.",
    insight: "Flashbacks sind das Wiedererleben des Vergangenen in der Gegenwart — die typische Intrusion der PTBS. Orientierung im Hier und Jetzt (Ort, Datum, Sinne) signalisiert dem Nervensystem: Die Gefahr ist vorbei.",
  },
  {
    id: "albtraum",
    name: "Mura, die Albdrossel",
    epithet: "Sängerin der schlaflosen Stunden",
    archipelago: "Das Wiederkehr-Riff",
    category: "Wiedererleben (Intrusionen)",
    arousal: "hyper",
    intensity: 52,
    armor: 1,
    xp: 26,
    hue: 265,
    shape: "bird",
    spriteScale: 1.05,
    attacks: [
      { name: "Federsturm", min: 5, max: 9, line: "Schwarze Federn peitschen durch die Luft!" },
      { name: "Schlafentzug", min: 4, max: 10, line: "Mura singt ein Lied, das keinen Schlaf kennt!" },
      { name: "Nachtschrei", min: 6, max: 8, line: "Ein Schrei wie aus einem Traum, der keiner sein darf!" },
    ],
    intro: [
      "Über dieser Insel ist es immer dämmrig, egal wie hell das Meer ringsum leuchtet.",
      "Ein Vogel mit viel zu vielen Augen im Gefieder kreist über dem Strand.",
      "MURA, DIE ALBDROSSEL, stürzt herab — sie will, dass du endlich ihre Melodie lernst!",
    ],
    understand: [
      "Du hörst dem Lied zu, statt es zu übertönen. Es hat eine sehr traurige zweite Stimme.",
      "Muras Augen blinzeln nacheinander. Keines davon hat je richtig geschlafen.",
      "Du summst eine Gegenmelodie — leiser, wärmer. Der Federrhythmus gerät ins Stocken.",
      "Mura wird still. Vielleicht wollte sie nie wecken — nur nicht allein wach sein.",
    ],
    winLine: "Muras Gefieder verliert seine Augen, eines nach dem anderen, wie Lichter beim Einschlafen.",
    peaceLine: "Mura setzt sich auf einen Mast und singt fortan nur noch Schlaflieder — für sich selbst.",
    insight: "Wiederkehrende Albträume gehören zum Wiedererleben. Imagination Rehearsal (das bewusste Umschreiben des Traumendes) und feste Abendrituale sind erforschte, wirksame Gegenweisen.",
  },
  {
    id: "hypervigilanz",
    name: "Der Hypervigilanz-Wächter",
    epithet: "Der niemals blinkt",
    archipelago: "Der Alarm-Atoll",
    category: "Anhaltende Erregung",
    arousal: "hyper",
    intensity: 58,
    armor: 1,
    xp: 30,
    hue: 15,
    shape: "crystal",
    spriteScale: 1.1,
    attacks: [
      { name: "Argwohn-Blitz", min: 6, max: 10, line: "Der Wächter scannt dich — und findet überall Gefahr!" },
      { name: "Schrecksalve", min: 5, max: 9, line: "Erschrecken als Dauerzustand, komprimiert in einen Schlag!" },
      { name: "Daueralarm", min: 4, max: 8, line: "Sirenen, die nur du hören kannst, werden lauter!" },
    ],
    intro: [
      "Jeder Stein auf dieser Insel ist nach außen gedreht, als würde die Insel selbst lauschen.",
      "Ein kristallener Wächter dreht sich blitzschnell zu dir um. Zu schnell. Immer zu schnell.",
      "DER HYPERVIGILANZ-WÄCHTER hält dich für die Gefahr, auf die er seit Jahren wartet!",
    ],
    understand: [
      "Du machst keine plötzlichen Bewegungen. Der Wächter bemerkt das sofort — natürlich.",
      "Du zeigst ihm den ruhigen Horizont: „Da ist nichts. Schau selbst.“ Er schaut. Zum ersten Mal.",
      "Seine Facetten werden weicher. Wachsamkeit war einmal sein Auftrag, nicht seine Natur.",
      "Der Wächter senkt den Blick. Er ist so müde. Er durfte nur nie müde sein.",
    ],
    winLine: "Der Wächter erstarrt zu einer ruhigen Säule — endlich nur noch Stein, nicht mehr Alarm.",
    peaceLine: "Der Wächter wird zum Leuchtturm: Er wacht weiter, aber nun übers Meer — nicht mehr über dich.",
    insight: "Hypervigilanz ist ein Dauerzustand des sympathischen Nervensystems: Der Körper lebt im Kampf-oder-Flucht-Modus, obwohl die Gefahr vorbei ist. Keine Schwäche — eine überlebensnotwendige Reaktion, die nicht abgeschaltet wurde.",
  },
  {
    id: "herzrasen",
    name: "Das Herzrasen",
    epithet: "Galopp ohne Pferd",
    archipelago: "Der Alarm-Atoll",
    category: "Anhaltende Erregung",
    arousal: "hyper",
    intensity: 50,
    armor: 0,
    xp: 26,
    hue: 350,
    shape: "eye",
    spriteScale: 0.9,
    attacks: [
      { name: "Galopp", min: 5, max: 9, line: "Trommeln in der Brust, immer schneller!" },
      { name: "Engegriff", min: 6, max: 10, line: "Eine unsichtbare Hand drückt auf die Brust!" },
      { name: "Flatterpuls", min: 4, max: 8, line: "Der Rhythmus verliert den Takt!" },
    ],
    intro: [
      "Der Boden dieser Insel vibriert in einem Takt, der kein guter Takt ist.",
      "Etwas Rotes, Flatterndes schießt zwischen den Felsen hindurch — viel zu schnell fürs Auge.",
      "DAS HERZRASEN stellt sich dir in den Weg und pocht dich an wie eine fremde Tür!",
    ],
    understand: [
      "Du legst die Hand auf die eigene Brust und zählst mit. Es wird langsamer, weil du mitzählst.",
      "Du atmest lang aus — und das Herzrasen atmet zum ersten Mal in seinem Leben mit.",
      "Es ist gar nicht böse. Es ist ein Botenjunge, der nie gelernt hat, langsam zu gehen.",
      "Das Pochen wird zu einem gleichmäßigen Schritt. Es geht dir jetzt einfach hinterher.",
    ],
    winLine: "Das Herzrasen verliert den Takt, findet deinen — und marschiert friedlich aus der Brust.",
    peaceLine: "Es wird dein treues Trommelchen: Es schlägt nur noch Alarm, wenn wirklich einer nötig ist.",
    insight: "Herzrasen, Atemnot und Enge ohne organischen Befund sind vegetative Alarmzeichen. Verlängertes Ausatmen aktiviert den Vagusnerv und drosselt den Sympathikus binnen Sekunden bis Minuten.",
  },
  {
    id: "vermeidung",
    name: "Vermeidia, die Ausweicherin",
    epithet: "Herrin der Umwege",
    archipelago: "Die Nebelbank",
    category: "Vermeidung & Rückzug",
    arousal: "hypo",
    intensity: 55,
    armor: 2,
    xp: 30,
    hue: 190,
    shape: "ghost",
    spriteScale: 1.0,
    attacks: [
      { name: "Nebelwand", min: 4, max: 8, line: "Eine Wand aus „lieber nicht“ zieht hoch!" },
      { name: "Ablenkung", min: 5, max: 9, line: "Plötzlich ist alles andere schrecklich wichtig!" },
      { name: "Ausweichschritt", min: 3, max: 7, line: "Vermeidia ist nie dort, wo du gerade hinschaust!" },
    ],
    intro: [
      "Die Insel liegt im Nebel — obwohl rundherum keine Wolke am Himmel hängt.",
      "Jeder Weg hier biegt kurz vor dem Ziel ab. Alle Wegweiser zeigen auf „später“.",
      "VERMEIDIA gleitet aus dem Nebel: „Müssen wir das JETZT besprechen?“, fragt sie eisig!",
    ],
    understand: [
      "Du gehst einen Schritt auf den Nebel zu, nur einen. Er weicht zurück, aber höflich.",
      "Du sagst: „Du hast mich lange beschützt.“ Vermeidia hält inne. Das sagt ihr nie jemand.",
      "Ihre Umwege waren früher Abkürzungen zum Überleben. Das würdigst du laut.",
      "Vermeidia öffnet einen schmalen, geraden Pfad. „Nur ein Stück“, sagt sie. „Aber ehrlich.“",
    ],
    winLine: "Der Nebel lichtet sich zu einem klaren, geraden Weg mitten durch die Insel.",
    peaceLine: "Vermeidia wird deine Wegweiserin: Sie zeigt dir nun die dosierten Schritte statt der Umwege.",
    insight: "Vermeidung ist der Versuch, das Unverarbeitete fernzuhalten — kurzfristig wirksam, langfristig hält sie das Alarmgeschehen am Leben. Dosierter, begleiteter Kontakt statt Konfrontation ist der therapeutische Mittelweg.",
  },
  {
    id: "verdraengung",
    name: "Der Verdränger",
    epithet: "Kehrt alles unter den Teppich",
    archipelago: "Die Nebelbank",
    category: "Vermeidung & Rückzug",
    arousal: "hypo",
    intensity: 60,
    armor: 2,
    xp: 32,
    hue: 210,
    shape: "golem",
    spriteScale: 1.05,
    attacks: [
      { name: "Teppichkehrer", min: 5, max: 10, line: "Ein riesiger Besen fegt deine Gedanken vom Tisch!" },
      { name: "Schubladenknall", min: 6, max: 9, line: "Etwas Wichtiges wird laut zugeschoben!" },
      { name: "Bergungsstau", min: 4, max: 8, line: "Alles Untergeschobene wackelt bedenklich!" },
    ],
    intro: [
      "Diese Insel ist übersät mit Hügeln, die keine Hügel sind. Sie atmen.",
      "Ein massiger Geselle mit Besen und Schlüsselbund stapft über die Buckel.",
      "DER VERDRÄNGER brummt: „Hier ist NICHTS. War noch nie was. Geh weiter!“",
    ],
    understand: [
      "Du setzt dich auf einen der Hügel und sagst: „Ich weiß, was darunter liegt. Es ist okay.“",
      "Der Verdränger sinkt neben dir auf die Knie. Der Besen ist so schwer nach all den Jahren.",
      "Du hilfst ihm, eine einzige Schublade zu öffnen — nur eine. Drinnen: ein Kinderfoto.",
      "Er weint Staub. Unter dem Teppich war nie Müll. Es waren Schätze, die Angst hatten.",
    ],
    winLine: "Die Hügel der Insel flachen ab und werden zu offenen, lesbaren Feldern.",
    peaceLine: "Der Verdränger hängt den Besen an den Nagel und wird Archivar deiner eigenen Geschichte.",
    insight: "Verdrängung schafft kurzfristig Erleichterung, bindet aber dauerhaft Kraft. Erinnerungslücken und Gefühlsabstumpfung sind die Kehrseite. Traumatherapie öffnet die „Schubladen“ dosiert und in sicherem Rahmen.",
  },
  {
    id: "dissoziation",
    name: "Dissozia, die Glasgeistin",
    epithet: "Sie ist hier und nicht hier",
    archipelago: "Die Glaswelt",
    category: "Dissoziation & Erstarrung",
    arousal: "hypo",
    intensity: 62,
    armor: 1,
    xp: 34,
    hue: 170,
    shape: "ghost",
    spriteScale: 1.1,
    attacks: [
      { name: "Entrückung", min: 5, max: 9, line: "Die Welt rückt einen Schritt nach links — ohne dich!" },
      { name: "Glasscheibe", min: 6, max: 10, line: "Zwischen dir und allem zieht sich eine Scheibe hoch!" },
      { name: "Neben-sich-Stehen", min: 4, max: 8, line: "Du siehst dich selbst von außen — ein unguter Blickwinkel!" },
    ],
    intro: [
      "Die Insel sieht aus wie durch eine Fensterscheibe: nah und trotzdem unerreichbar.",
      "Eine Gestalt schwebt über dem Boden, halb hier, halb im eigenen Schatten.",
      "DISSOZIA flüstert: „Wer nicht ganz da ist, kann nicht ganz getroffen werden …“",
    ],
    understand: [
      "Du stampfst mit den Füßen auf. Der Boden ist echt. Dissozia zuckt zusammen — erstaunt.",
      "Du reibst die Hände warm und sagst deinen Namen laut. Ihr Glas bekommt einen Kratzer.",
      "„Du hast mich durch Unsagbares getragen“, sagst du zu ihr. „Danke. Du darfst ruhen.“",
      "Die Scheibe wird zu einem Fenster, das man öffnen kann. Frische Luft strömt herein.",
    ],
    winLine: "Das Glas der Insel zerfließt zu klarem Wasser und versickert im Sand.",
    peaceLine: "Dissozia wird deine Luftschleuse: Sie öffnet sich nur noch, wenn DU es brauchst — nie mehr gegen dich.",
    insight: "Dissoziation ist die Notbremse des dorsalen Vagus: Wenn Widerstand zwecklos war, schaltet das Nervensystem ab — Erstarrung, Unwirklichkeit, „weg sein“. Aktivierung (Bewegung, Wärme, Stimme, Co-Regulation) führt sanft zurück.",
  },
  {
    id: "erstarrung",
    name: "Erstarrion",
    epithet: "Der eingefrorene Schrei",
    archipelago: "Die Glaswelt",
    category: "Dissoziation & Erstarrung",
    arousal: "hypo",
    intensity: 66,
    armor: 3,
    xp: 38,
    hue: 200,
    shape: "crystal",
    spriteScale: 1.15,
    attacks: [
      { name: "Eishauch", min: 6, max: 10, line: "Kälte kriecht in die Glieder — Bewegung wird zur Theorie!" },
      { name: "Lähmung", min: 5, max: 9, line: "Die Beine vergessen kurz, wie Beine gehen!" },
      { name: "Stillekrampf", min: 7, max: 11, line: "Eine Stille, die festhält wie Beton!" },
    ],
    intro: [
      "Auf dieser Insel bewegt sich nichts — selbst das Gras steht still wie gemalt.",
      "In der Mitte: eine eisige Figur, angespannt wie ein gespannter Bogen ohne Pfeil.",
      "ERSTARRION löst ein Auge aus dem Frost und starrt dich an: „Lauf. Solange du noch … oh.“",
    ],
    understand: [
      "Du bleibst in seiner Nähe, ohne etwas zu fordern. Erstarrung hasst Forderungen.",
      "Du wackelst mit den Zehen, dann den Fingern. Erstarrion beobachtet es wie ein Wunder.",
      "„Erstarren war deine letzte Verteidigung“, sagst du. „Es hat funktioniert. Du hast überlebt.“",
      "Tautropfen fallen. Der Bogen ohne Pfeil entspannt sich zum ersten Mal seit Jahrzehnten.",
    ],
    winLine: "Das Eis der Insel bricht nicht — es taut von innen, leise, wie ein langer Atemzug.",
    peaceLine: "Erstarrion wird ein warmer Stein in deiner Tasche: Er mahnt Pausen an, statt sie zu erzwingen.",
    insight: "Erstarrung (Freeze) ist eine Schutzreaktion des Nervensystems, keine Entscheidung und kein Versagen. Sanfte Aktivierung — Zehen wackeln, Wärme, Orientierung — durchbewegt den Shutdown in kleinen, sicheren Dosen.",
  },
  {
    id: "scham",
    name: "Der Scham-Golem",
    epithet: "Gemauert aus fremden Urteilen",
    archipelago: "Das Trauer-Atoll",
    category: "Gefühle & Selbstbild",
    arousal: "both",
    intensity: 72,
    armor: 2,
    xp: 42,
    hue: 0,
    shape: "golem",
    spriteScale: 1.2,
    attacks: [
      { name: "Wertlos-Fluch", min: 7, max: 11, line: "„Du bist kaputt“, hallt es — in DEINER eigenen Stimme!" },
      { name: "Schuldstein", min: 6, max: 10, line: "Ein Stein mit deinem Namen drauf trifft dich!" },
      { name: "Blickdruck", min: 5, max: 9, line: "Du fühlst dich plötzlich überall zu viel und zu wenig!" },
    ],
    intro: [
      "Die Mauern dieser Insel bestehen aus Sätzen. Alle sind falsch. Alle klingen vertraut.",
      "Ein Golem aus grauen Ziegeln wuchtet sich auf, jeder Stein ein Urteil über dich.",
      "DER SCHAM-GOLEM donnert: „WER HAT DIR ERLAUBT, HIER ZU SEIN?!“",
    ],
    understand: [
      "Du liest einen der Steine laut vor. Es ist die Stimme von jemand anderem. Nie deine gewesen.",
      "„Das ist nicht meine Schuld“, sagst du. Ein Stein fällt aus der Mauer. Der Golem taumelt.",
      "Du nimmst einen Stein in die Hand und schreibst ihn um: „Es geschah mir. Es bin nicht ich.“",
      "Der Golem steht still. Unter den Ziegeln schlägt etwas Warmes, das nie aufgehört hat zu hoffen.",
    ],
    winLine: "Die Mauer bröckelt zu einer offenen Arena — mit Platz für dich, genau wie du bist.",
    peaceLine: "Der Golem baut sich zu einer Bank um. Auf ihr sitzt du fortan, wenn alte Stimmen lügen.",
    insight: "Chronische Scham und das Gefühl, „kaputt“ zu sein, sind Kernsymptome komplexer Traumatisierung — keine Tatsachen. Sie sind die innere Übernahme dessen, was einem angetan wurde, und sie sind veränderbar.",
  },
  {
    id: "leere",
    name: "Die große Leere",
    epithet: "Ein Loch, das vorher ein Gefühl war",
    archipelago: "Das Trauer-Atoll",
    category: "Gefühle & Selbstbild",
    arousal: "hypo",
    intensity: 68,
    armor: 1,
    xp: 40,
    hue: 230,
    shape: "void",
    spriteScale: 1.25,
    attacks: [
      { name: "Hoffnungs-Sog", min: 6, max: 10, line: "Der Sog flüstert: „Es wird nicht besser. Nie.“" },
      { name: "Taubheit", min: 5, max: 9, line: "Farben verlieren kurz ihre Namen!" },
      { name: "Sinnfrage", min: 7, max: 11, line: "„Wofür?“, fragt die Leere — sehr überzeugend!" },
    ],
    intro: [
      "Diese Insel hat eine Mitte, aber die Mitte fehlt. Man spürt es sofort.",
      "Dort, wo etwas sein müsste, ist ein sanfter, endloser Nichts-Wirbel.",
      "DIE GROSSE LEERE sagt nichts. Das ist das Schlimmste an ihr. Noch.",
    ],
    understand: [
      "Du setzt dich an den Rand der Leere und sagst: „Ich weiß, was du warst. Du warst Gefühl.“",
      "Die Leere flackert. Ganz klein: ein Funke Müdigkeit. Müdigkeit ist auch ein Gefühl. Ein Anfang.",
      "Du erzählst ihr von einem Moment, der einmal gut war. Sie hört zu. Löcher können zuhören.",
      "Die Leere wird zu einer Schale. Leer, ja — aber bereit, wieder gefüllt zu werden.",
    ],
    winLine: "Die Leere kollabiert zu einem Samenkorn. Du pflanzt sie ein, wo die Mitte fehlte.",
    peaceLine: "Aus der Schale wird ein Brunnen. Tief, dunkel — aber mit Wasser ganz unten.",
    insight: "Anhaltende innere Leere und Hoffnungslosigkeit gehören zum negativen Selbst- und Weltbild komplexer Traumafolgen. Gefühle kehren selten auf Befehl zurück — aber über kleine Körper- und Sinneserfahrungen, dosiert und begleitet.",
  },
  {
    id: "misstrauen",
    name: "Misstrania",
    epithet: "Prüft jeden Anker doppelt",
    archipelago: "Das Misstrauens-Riff",
    category: "Beziehungen",
    arousal: "both",
    intensity: 70,
    armor: 2,
    xp: 42,
    hue: 120,
    shape: "fish",
    spriteScale: 1.1,
    attacks: [
      { name: "Distanzschild", min: 6, max: 10, line: "Eine unsichtbare Mauer aus „Komm mir nicht zu nah“!" },
      { name: "Argwohnbiss", min: 7, max: 11, line: "Misstrania beißt zu — bevor du es tun kannst!" },
      { name: "Hintergedanken", min: 5, max: 9, line: "„Was willst du WIRKLICH?“, zischt es aus allen Richtungen!" },
    ],
    intro: [
      "Das Riff ist voller Fallen, Netze und zweiter Böden. Sehr gute Handwerksarbeit, leider.",
      "Etwas schießt unter der Wasseroberfläche hin und her — es hält dich für einen Köder.",
      "MISTRANIA springt aus dem Wasser: „Nettes Schiff. WARUM sollte ich dir glauben?!“",
    ],
    understand: [
      "Du wirfst den Anker sichtbar und machst zwei Schritte zurück. Misstrania prüft den Anker. Zweimal.",
      "„Vertrauen war einmal gefährlich für dich“, sagst du. „Das war klug von dir.“ Sie wird still.",
      "Du versprichst nichts Großes. Nur: „Ich komme morgen wieder.“ Klein genug, um wahr zu sein.",
      "Misstrania nickt einmal, knapp. Das ist bei ihr ein Freundschaftsvertrag mit Siegel.",
    ],
    winLine: "Die Fallen des Riffs klappen zu und werden zu Brücken über das flache Wasser.",
    peaceLine: "Misstrania schwimmt fortan als Lotsenfisch neben deinem Schiff — wachsam, aber auf DEINER Seite.",
    insight: "Trauma ist ein Beziehungserlebnis — Heilung auch. Wer in Beziehungen verletzt wurde, braucht Erfahrungen von Sicherheit in Beziehung (Co-Regulation), um zu heilen. Bindungsorientierte Verfahren setzen genau hier an.",
  },
  {
    id: "naehe",
    name: "Das Nähe-Phantom",
    epithet: "Kommt her! Geh weg! Komm her!",
    archipelago: "Das Misstrauens-Riff",
    category: "Beziehungen",
    arousal: "both",
    intensity: 74,
    armor: 1,
    xp: 46,
    hue: 45,
    shape: "ghost",
    spriteScale: 1.05,
    attacks: [
      { name: "Klammergriff", min: 6, max: 10, line: "Das Phantom hält dich fest — viel, viel zu fest!" },
      { name: "Rückzugswelle", min: 7, max: 11, line: "Es stößt dich weg — und weint dabei!" },
      { name: "Wechselbad", min: 5, max: 10, line: "Erst zu nah, dann zu fern — dein Kompass dreht durch!" },
    ],
    intro: [
      "Auf dieser Insel wechseln Ebbe und Flut im Sekundentakt. Niemand weiß, wo man stehen soll.",
      "Ein durchscheinendes Wesen winkt dich heran — und verscheucht dich im selben Atemzug.",
      "DAS NÄHE-PHANTOM schluchzt: „Bleib!“ und „Verschwinde!“ — gleichzeitig, aus tiefstem Herzen!",
    ],
    understand: [
      "Du bleibst auf gleichem Abstand stehen. Nicht näher. Nicht weiter. Das Phantom staunt.",
      "„Nähe hat dich einmal verletzt — und Ferne auch“, sagst du. Beide Gesichter nicken.",
      "Du zeigst ihm, dass ein Abstand bleiben darf, ohne dass jemand geht. Eine neue Erfahrung.",
      "Das Phantom atmet aus. Zum ersten Mal hält es einen Mittelweg aus — eine ganze Minute.",
    ],
    winLine: "Ebbe und Flut der Insel finden in einen ruhigen, menschlichen Rhythmus.",
    peaceLine: "Das Phantom wird zu einer Laterne am Hafen: nah genug zum Wärmen, fern genug zum Atmen.",
    insight: "Der Wechsel aus Klammern und Rückzug ist ein klassisches Muster nach Bindungstraumata: Nähe ist Sehnsucht und Bedrohung zugleich. Sichere Bindung entsteht durch verlässliche, dosierte Nähe-Erfahrungen — nicht durch Entscheidung.",
  },
  // ── Finale ──
  {
    id: "sturmherd",
    name: "Der Sturmherd",
    epithet: "Das Unerzählte in der Mitte aller Karten",
    archipelago: "Das Auge des Atlanten",
    category: "Das Ganze",
    arousal: "both",
    intensity: 130,
    armor: 2,
    xp: 150,
    hue: 280,
    shape: "storm",
    spriteScale: 1.4,
    attacks: [
      { name: "Alles auf einmal", min: 9, max: 14, line: "Alle Wetter gleichzeitig stürzen auf dich ein!" },
      { name: "Das ungesagte Wort", min: 8, max: 13, line: "Ein Satz ohne Anfang trifft dich mitten ins Jetzt!" },
      { name: "Sturmtriade", min: 7, max: 12, line: "Blitz, Stille und Erinnerung — in genau dieser Reihenfolge!" },
      { name: "Kartenriss", min: 8, max: 12, line: "Der Sturm zerreißt deine Karte! Zum Glück kennst du den Weg längst!" },
    ],
    intro: [
      "Das Auge des Sturms. Alle zwölf Inseln sind von hier aus zu sehen — ruhig, bewohnbar, deine.",
      "In der Mitte dreht sich ein Wirbel aus allem, was nie gesagt, nie geweint, nie erzählt wurde.",
      "DER STURMHERD spricht mit allen Stimmen zugleich: „DU HAST SIE ALLE ÜBERWUNDEN. ABER MICH HAST DU NUR UMSCHIFFT.“",
    ],
    understand: [
      "Du erzählst dem Sturm eine einzige wahre Geschichte — deine. Er wird langsamer, um zuzuhören.",
      "„Du bist kein Unwetter“, sagst du. „Du bist ein Brief, der nie geöffnet wurde.“ Der Wind stockt.",
      "Du nennst die Dinge beim Namen. Jedes benannte Ding verliert ein Stück Wirbel.",
      "Der Sturm wird kleiner und kleiner, bis er in deine beiden Hände passt. Er ist warm.",
    ],
    winLine: "Der Sturmherd löst sich auf — nicht in Nichts, sondern in Wetter. Normales, ehrliches Wetter.",
    peaceLine: "Der Sturm legt sich als ruhiger Kreis um deine Inseln: ein Horizont, der nun dir gehört.",
    insight: "Hinter allen einzelnen Phänomenen liegt oft das Unerzählte: die Geschichte selbst, die nie Zeugen, Worte oder Trauer fand. Sie zu erzählen — in sicherem Rahmen, mit Begleitung — ist der Kern jeder Traumatherapie.",
    final: true,
  },
];

// ─── Hilfslogik ────────────────────────────────────────────────────

// Wirkungsmatrix: Übungseffekt vs. Erregungslage des Phänomens
export function effectiveness(effect: Arousal, target: Arousal): number {
  if (effect === "both") return 1.15;
  if (target === "both") return 1.0;
  if (effect === target) return 1.6;
  return 0.5;
}

export function effectivenessLabel(mult: number): string | null {
  if (mult >= 1.5) return "Sehr wirksam!";
  if (mult <= 0.6) return "Kaum wirksam …";
  return null;
}

export const AROUSAL_LABEL: Record<Arousal, string> = {
  hyper: "Übererregt",
  hypo: "Untererregt",
  both: "Pendelnd",
};

// Levelkurve: Einsicht → Level
export function levelForXp(xp: number): number {
  // Level n braucht kumulativ n*(n+1)*25 Einsicht
  let lvl = 1;
  while ((lvl + 1) * (lvl + 2) * 25 <= xp) lvl++;
  return Math.min(lvl, 12);
}

export function maxStability(level: number): number {
  return 42 + (level - 1) * 9;
}
export function maxPresence(level: number): number {
  return 24 + (level - 1) * 6;
}

export const INTRO_TEXT = [
  "Es gibt ein Meer, das auf keiner Seekarte steht.",
  "Es besteht aus allem, was Menschen erlebt und überlebt haben.",
  "Auf diesem Meer liegen Inseln — Phänomene, die einen nachts wachhalten,",
  "die den Atem stehlen, die einen zu Glas machen.",
  "",
  "Du bist Phänomenaut*in. Dein Schiff heißt TOLERANZ.",
  "Dein Kompass ist dein Nervensystem. Deine Waffen sind Übungen,",
  "die älter sind als jede Karte: Atmen. Erden. Zuhören.",
  "",
  "Steuere die Inseln an. Begegne den Phänomenen.",
  "Überwinde sie — oder verstehe sie, was mehr ist.",
  "",
  "Das Meer wartet. Es war schließlich die ganze Zeit deins.",
];

export const DISCLAIMER =
  "Phänomenautik ist ein Spiel auf Basis des TRAUMAATLAS und ersetzt keine Psychotherapie. Bei akuten Krisen: Telefonseelsorge 0800 111 0 111 / 0800 111 0 222 (kostenfrei, rund um die Uhr) oder 112.";
