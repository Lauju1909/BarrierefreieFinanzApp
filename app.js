// ============================================================================
// 1. GLOBALE KONSTANTEN, KATEGORIE-DATENBANK & INITIALER STATE
// ============================================================================
const CURRENT_APP_VERSION = 'v6.8.0';
const STORAGE_DATA_KEY = 'barrierefreie_finanzen_enc_v1';
const STORAGE_SALT_KEY = 'barrierefreie_finanzen_salt_v1';
const STORAGE_THEME_KEY = 'barrierefreie_finanzen_theme_v1';
const STORAGE_FONTSIZE_KEY = 'barrierefreie_finanzen_fontsize_v1';
const STORAGE_LOCKOUT_KEY = 'barrierefreie_finanzen_lockout_v1';
const STORAGE_ATTEMPTS_KEY = 'barrierefreie_finanzen_attempts_v1';
const STORAGE_SHOW_SYMBOLS_KEY = 'haushaltsbuch_show_symbols_enabled_v1';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Stunden

function getVaultApiHeaders(customHeaders = {}) {
  const headers = Object.assign({}, customHeaders);
  if (typeof window !== 'undefined' && window.__AUTH_TOKEN__) {
    headers['X-Vault-Token'] = window.__AUTH_TOKEN__;
  }
  return headers;
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

const CATEGORY_ICONS = {
  // Ausgaben
  "Lebensmittel, Supermarkt & Discounter": "🛒",
  "Miete, Wohnen & Nebenkosten": "🏠",
  "Haushalt, Möbel, Garten & Handwerker": "🛋️",
  "Mobilität, Auto & Kraftfahrzeuge": "🚗",
  "ÖPNV, Bahn, Bus, Flug & Reisen": "🚆",
  "Restaurants, Cafés & Gastronomie": "🍽️",
  "Lieferdienste & Essen bestellen": "🛵",
  "Streaming, Musik, TV & Unterhaltung": "📺",
  "Gaming, Computer & Konsolen": "🎮",
  "Elektronik, Internet, Handy & Software": "💻",
  "Shopping, Online-Kauf & Marktplätze": "🛍️",
  "Kleidung, Schuhe & Mode": "👗",
  "Drogerie, Kosmetik & Körperpflege": "🧴",
  "Gesundheit, Apotheke & Arzt": "💊",
  "Barrierefreiheit & Hilfsmittel (Blind / Sehbehindert)": "🦯",
  "Versicherungen & Vorsorge": "🛡️",
  "Bank, Finanzen, Kredite & Gebühren": "🏦",
  "Haustiere & Tierhaltung": "🐾",
  "Familie, Kinder & Babybedarf": "👶",
  "Schule, Ausbildung & Studium": "🎓",
  "Sport, Fitness, Verein & Hobbys": "🏆",
  "Spenden, Gemeinnütziges & Zuwendungen": "❤️",
  "Sonstige Ausgaben & Bargeld": "📦",

  // Einnahmen
  "Gehalt, Lohn & Beruf": "💼",
  "Staatliche Leistungen, Hilfen & Zuschüsse": "🏛️",
  "Taschengeld & Private Unterstützung": "👛",
  "Spenden, Zuwendungen & Förderungen": "❤️",
  "Geschenke, Boni & Gewinne": "🎁",
  "Rente, Pension & Versorgung": "👴",
  "Verkäufe, Gebrauchtwaren & Erstattungen": "🏷️",
  "Zinsen, Dividenden, Miete & Kapital": "📈",
  "Sonstige Einnahmen": "💰"
};

const CATEGORIES_DB = {
  exp: {
    "Lebensmittel, Supermarkt & Discounter": [
      "Gesamt / Allgemein",
      "Aldi Nord",
      "Aldi Süd",
      "Lidl",
      "Rewe",
      "Edeka",
      "Kaufland",
      "Penny",
      "Netto Marken-Discount",
      "Netto mit dem Hund",
      "Norma",
      "Globus",
      "Tegut",
      "HIT",
      "Famila",
      "Alnatura",
      "Denns Biomarkt",
      "Bio Company",
      "Unverpackt-Laden",
      "Asia-Markt / Türkischer Supermarkt",
      "Bäckerei / Dorfbäcker",
      "Konditorei",
      "Fleischerei / Metzger",
      "Fischgeschäft",
      "Wochenmarkt (Obst, Gemüse, Eier)",
      "Hofladen / Bauernhof",
      "Getränkemarkt / Trinkgut",
      "Sonstiger Supermarkt"
    ],
    "Miete, Wohnen & Nebenkosten": [
      "Kaltmiete",
      "Warmmiete",
      "Mietkaution",
      "Nebenkosten Vorauszahlung / Nachzahlung",
      "Hausgeld (Eigentümer)",
      "Rundfunkbeitrag (GEZ / ARD ZDF)",
      "Strom (Stadtwerke / Energie)",
      "Gas & Fernwärme",
      "Heizöl / Pellets / Brennholz",
      "Wasser & Abwasser",
      "Müllgebühren / Entsorgung",
      "Schornsteinfeger & Wartung",
      "Hausratversicherung",
      "Glasversicherung",
      "Wohngebäudeversicherung",
      "Hausmeister & Treppenreinigung"
    ],
    "Haushalt, Möbel, Garten & Handwerker": [
      "Möbel & Deko (IKEA, Poco, XXXLutz, Mömax)",
      "Betten, Matratzen & Bettwäsche",
      "Waschmaschine, Kühlschrank & Großgeräte",
      "Kaffeemaschine, Toaster & Küchengeräte",
      "Staubsauger & Reinigungsgeräte",
      "Putzmittel, Waschmittel & Haushaltsbedarf",
      "Geschirr, Töpfe & Besteck",
      "Baumarkt (Obi, Bauhaus, Hornbach, Toom)",
      "Garten, Balkon, Pflanzen & Blumen",
      "Handwerker & Reparaturen (Sanitär, Maler, Elektrik)",
      "Schlüsseldienst",
      "Umzugskosten & Transporter mieten"
    ],
    "Mobilität, Auto & Kraftfahrzeuge": [
      "Tanken (Benzin / Super E10 E5)",
      "Tanken (Diesel)",
      "Tanken (Autogas / LPG)",
      "E-Auto Ladestation / Ladestrom",
      "KFZ-Haftpflichtversicherung",
      "KFZ-Teilkasko / Vollkasko",
      "KFZ-Steuer (Hauptzollamt)",
      "Hauptuntersuchung (TÜV / DEKRA / GTÜ)",
      "Auto-Werkstatt, Inspektion & Ölwechsel",
      "Autoreparatur & Ersatzteile",
      "Sommerreifen / Winterreifen & Reifenwechsel",
      "Autowäsche & Autopflege",
      "Auto-Kauf, Leasing & Autokredit",
      "Parkgebühren, Parkhaus & Parkschein",
      "Autobahn-Maut, Vignette & Umweltplakette",
      "ADAC / Pannenhilfe Mitgliedschaft",
      "Führerschein & Fahrstunden"
    ],
    "ÖPNV, Bahn, Bus, Flug & Reisen": [
      "Deutschlandticket (49€ / Monatskarte)",
      "Bus, Straßenbahn & U-Bahn (Einzeltickets / Streifen)",
      "Deutsche Bahn (ICE / IC / Regio)",
      "BahnCard (25 / 50 / 100)",
      "Fernbus (Flixbus / Flixtrain)",
      "Taxi, Uber, Bolt & FreeNow",
      "E-Scooter & Leihrad (Tier, Bolt, Lime)",
      "Eigenes Fahrrad / E-Bike Reparatur & Zubehör",
      "Flugtickets & Airline-Gebühren",
      "Hotel, Ferienwohnung & Airbnb",
      "Pauschalreise / Urlaub",
      "Auslands-Krankenversicherung",
      "Kurtaxe & Reisekosten"
    ],
    "Restaurants, Cafés & Gastronomie": [
      "Restaurant (Abendessen / Mittagessen)",
      "Gasthaus / Brauhaus / Biergarten",
      "Pizzeria / Italienisches Restaurant",
      "Asiatisches / Griechisches / Mexikanisches Restaurant",
      "Burger-Restaurant & Steakhouse",
      "Imbiss, Döner, Currywurst & Pommes",
      "Fast Food (McDonald's, Burger King, KFC, Subway)",
      "Café, Bäckerei-Frühstück & Kaffeepause",
      "Eisdiele & Eisbecher",
      "Mensa, Betriebskantine & Schulkantine",
      "Bar, Kneipe, Pub & Bierstube",
      "Club, Diskothek & Party",
      "Snacks, Süßigkeiten & Energy Drinks"
    ],
    "Lieferdienste & Essen bestellen": [
      "Lieferando",
      "Uber Eats",
      "Wolt",
      "Pizza-Lieferdienst vor Ort",
      "Asia-Lieferdienst",
      "Burger & Döner Lieferservice",
      "Getränke-Lieferdienst (Flaschenpost)",
      "Kochboxen (HelloFresh, Marley Spoon)"
    ],
    "Streaming, Musik, TV & Unterhaltung": [
      "Netflix",
      "Amazon Prime Video / Music",
      "Spotify",
      "Apple Music / Apple One",
      "Disney+",
      "YouTube Premium / Music",
      "Paramount+",
      "WOW / Sky Ticket",
      "DAZN",
      "RTL+ / Joyn PLUS+",
      "Crunchyroll",
      "Audible / Hörbücher",
      "Deezer / Tidal",
      "Kino, Tickets & Popcorn",
      "Theater, Oper, Ballett & Musical",
      "Konzerte, Festivals & Live-Events",
      "Comedy & Kabarett",
      "Freizeitpark (Phantasialand, Europa-Park, Heide Park)",
      "Zoo, Tierpark, Aquarium & Botanischer Garten",
      "Museum, Ausstellungen & Sehenswürdigkeiten"
    ],
    "Gaming, Computer & Konsolen": [
      "Steam & PC-Spiele",
      "PlayStation Plus (PSN / PS Store)",
      "Xbox Game Pass & Microsoft Store",
      "Nintendo Switch Online & eShop",
      "In-Game-Käufe, Battle Pass & V-Bucks",
      "Epic Games / GOG / EA App",
      "Computer-Hardware (Grafikkarte, CPU, RAM)",
      "Gaming-Zubehör (Tastatur, Maus, Headset, Controller)",
      "Gaming-Monitor & Gaming-Stuhl",
      "Spielekonsole (PS5, Xbox Series X, Nintendo Switch, Steam Deck)",
      "Mobile Games & App-Käufe (Google Play / App Store)",
      "Discord Nitro & Twitch Subs"
    ],
    "Elektronik, Internet, Handy & Software": [
      "Smartphone / iPhone Kauf",
      "Handyvertrag & Monatstarif",
      "Prepaid-Guthaben (Telekom, Vodafone, o2, Aldi Talk, Congstar, Blau)",
      "Tablet / iPad & Zubehör",
      "Laptop / Notebook & Zubehör",
      "Festnetz, Internet & DSL / Glasfaser (Telekom, Vodafone, 1&1, o2)",
      "WLAN-Router & Netzwerk (FRITZ!Box)",
      "Fernseher, Soundbar & Heimkino",
      "Smart Home (Alexa, Google Nest, Hue)",
      "Cloud-Speicher (iCloud, Google One, OneDrive, Dropbox)",
      "Microsoft 365 / Office Abo",
      "Antivirus & VPN Software",
      "Software-Lizenzen",
      "Druckertinte, Toner & Papier",
      "Elektronik-Reparatur"
    ],
    "Shopping, Online-Kauf & Marktplätze": [
      "Amazon Bestellungen",
      "eBay & Kleinanzeigen Käufe",
      "Otto Versand",
      "Zalando, ASOS & Fashion-Shops",
      "Temu, AliExpress & Shein",
      "Kaufland.de / Galaxus / Alternate",
      "Second-Hand (Vinted, Momox, Rebuy)",
      "DHL, Hermes, DPD & Post-Porto / Paketmarken",
      "Schreibwaren, Bürobedarf & Bastelbedarf",
      "Geschenke für Familie & Freunde",
      "Blumen & Pflanzen"
    ],
    "Kleidung, Schuhe & Mode": [
      "Alltagskleidung (H&M, C&A, Zara, Primark)",
      "Markenkleidung (Nike, Adidas, Levi's)",
      "Schuhe, Sneaker & Stiefel (Deichmann, Snipes)",
      "Sportkleidung & Funktionskleidung",
      "Winterjacke, Mantel & Regenkleidung",
      "Unterwäsche, Socken & Nachtwäsche",
      "Anzug, Kleid & Festkleidung",
      "Taschen, Rucksäcke & Koffer",
      "Schmuck, Uhren & Accessoires",
      "Schneiderei & Textilreinigung"
    ],
    "Drogerie, Kosmetik & Körperpflege": [
      "dm-drogerie markt",
      "Rossmann",
      "Friseur & Haarpflege",
      "Zahnpflege & Aufsteckbürsten",
      "Waschmittel & Haushaltsreiniger",
      "Müller Drogerie",
      "Duschgel, Shampoo & Haarpflege",
      "Zahnpflege (Zahnbürste, Zahnpasta, Mundspülung)",
      "Deo, Parfüm & Düfte (Douglas, Sephora)",
      "Hautcreme, Sonnencreme & Lotion",
      "Rasierer, Klingen & Rasierschaum",
      "Damenhygiene & Pflegeprodukte",
      "Make-Up & Kosmetik",
      "Friseurbesuch (Schneiden, Färben)",
      "Barbershop / Bartpflege",
      "Kosmetikstudio, Fußpflege & Maniküre",
      "Tattoo & Piercing"
    ],
    "Gesundheit, Apotheke & Arzt": [
      "Apotheke & rezeptfreie Medikamente",
      "Zahnarzt & Professionelle Zahnreinigung (PZR)",
      "Brille, Sehhilfen & Kontaktlinsen",
      "Hörgeräte & Zubehör",
      "Physiotherapie & Osteopathie",
      "Rezeptgebühren & Zuzahlungen (Krankenkasse)",
      "Arztbesuch & Praxisgebühren",
      "Zahnarzt & Zahnreinigung (PZR)",
      "Brille, Sehhilfen & Kontaktlinsen (Fielmann, Apollo)",
      "Hörgeräte, Batterien & Zubehör",
      "Physiotherapie, Krankengymnastik & Osteopathie",
      "Massage & Ergotherapie",
      "Psychotherapie & Beratung",
      "Orthopädische Einlagen & Bandagen",
      "Krankenhaus-Zuzahlung & Reha",
      "Nahrungsergänzung, Vitamine & Mineralien",
      "Erste Hilfe, Pflaster & Verband"
    ],
    "Barrierefreiheit & Hilfsmittel (Blind / Sehbehindert)": [
      "Weißer Blindenlangstock, Rollspitzen & Taststöcke",
      "Braille-Zeile & Wartung",
      "Screenreader-Lizenzen & Software",
      "Taktile Markierungen & Hilfsmittel",
      "Sprechende Uhren & Haushaltsgeräte",
      "Blindenführhund (Futter, Tierarzt, Geschirr)",
      "Elektronische Sehhilfen & Kamerasysteme (Orcam)",
      "Braille-Zeile & Punktschrift-Zubehör",
      "Screenreader-Lizenzen (JAWS) & Sprachausgaben",
      "Sprechende Haushaltsgeräte (Waage, Uhr, Farberkenner)",
      "Vergrößerungssoftware (ZoomText)",
      "Daisy-Player & Hörbuchgeräte",
      "Tastbare Markierungen & Signalbänder",
      "Assistenz- & Begleitdienst"
    ],
    "Versicherungen & Vorsorge": [
      "Private Haftpflichtversicherung",
      "Hausratversicherung",
      "Berufsunfähigkeitsversicherung (BU)",
      "Zahnzusatzversicherung",
      "Rechtsschutzversicherung",
      "Gesetzliche Krankenversicherung (Freiwillig versichert)",
      "Private Krankenversicherung (PKV)",
      "Private Pflegezusatzversicherung",
      "Unfallversicherung",
      "Rechtsschutzversicherung (Verkehr, Beruf, Wohnen)",
      "Risikolebensversicherung",
      "Sterbegeldversicherung",
      "Altersvorsorge (Riester, Rürup, Private Rente)"
    ],
    "Bank, Finanzen, Kredite & Gebühren": [
      "Kontoführungsgebühren Girokonto",
      "Kreditkartengebühren (Mastercard, Visa)",
      "Dispozinsen & Überziehungszinsen",
      "Zinsen & Tilgung Ratenkredit",
      "Zinsen & Tilgung Baufinanzierung",
      "Schufa-Auskunft",
      "Depotgebühren & Wertpapierkosten",
      "Fremdautomat-Gebühren",
      "Notar- & Gerichtskosten",
      "Steuerberater & Lohnsteuerhilfe"
    ],
    "Haustiere & Tierhaltung": [
      "Hundefutter / Katzenfutter (Fressnapf, Zooplus, Futterhaus)",
      "Tierarzt & Tierklinik",
      "Tier-Medikamente & Wurmkur",
      "Hundesteuer (Gemeinde)",
      "Katzenstreu & Zubehör",
      "Spezialfutter & Diätnahrung",
      "Kleintierfutter (Vögel, Nager, Fische, Reptilien)",
      "Tierarzt, Impfungen & Behandlungen",
      "Tierklinik & OP-Kosten",
      "Tierkrankenversicherung & OP-Schutz",
      "Hundesteuer (Stadt / Gemeinde)",
      "Hundehalter-Haftpflicht",
      "Katzenstreu & Einstreu",
      "Leinen, Geschirre & Halsbänder",
      "Kratzbäume & Tierbetten",
      "Spielzeug für Tiere",
      "Hundeschule & Tiertraining",
      "Tierpension & Tiersitter",
      "Hundesalon & Fellpflege"
    ],
    "Familie, Kinder & Babybedarf": [
      "Windeln, Feuchttücher & Babypflege",
      "Babynahrung & Gläschen",
      "Babykleidung & Kinderschuhe",
      "Kinderwagen, Buggy & Autokindersitz",
      "Babybett & Kindermöbel",
      "Spielzeug (Lego, Playmobil)",
      "Gesellschaftsspiele & Puzzles",
      "Kinderbücher & Hörspiele (Tonie-Figuren)",
      "Kita, Kindergarten & Hortbeiträge",
      "Babysitter & Tagesmutter",
      "Taschengeld an Kinder ausgezahlt"
    ],
    "Schule, Ausbildung & Studium": [
      "Schulranzen, Rucksack & Mäppchen",
      "Schulbücher, Hefte & Arbeitshefte",
      "Stifte, Zirkel & Taschenrechner",
      "Klassenfahrten & Schulausflüge",
      "Nachhilfe (Studienkreis, Schülerhilfe)",
      "Musikschule & Instrumente",
      "Semesterbeitrag Universität / FH",
      "Fachbücher & Studienmaterial",
      "Prüfungsgebühren & Zertifikate",
      "Weiterbildung & VHS-Kurse"
    ],
    "Sport, Fitness, Verein & Hobbys": [
      "Fitnessstudio (McFit, FitX, Clever Fit, John Reed)",
      "Sportverein (Fußball, Tennis, Turnen)",
      "Schwimmbad & Sauna",
      "Kletterhalle & Yoga-Studio",
      "Sportausrüstung (Bälle, Hanteln, Matte)",
      "Sportschuhe & Laufschuhe",
      "Sportnahrung & Protein",
      "Blinden- und Sehbehindertenverein (DBSV / PRO RETINA)",
      "Schützenverein, Karnevalsverein & Club",
      "Kleingartenverein / Schrebergarten Pacht",
      "Hobbys (Modellbau, Handarbeit, Malen, Foto)",
      "Angelschein & Angelzubehör"
    ],
    "Spenden, Gemeinnütziges & Zuwendungen": [
      "Spende für Blinden- & Sehbehindertenhilfe",
      "Spende für Menschen in Not (Rotes Kreuz, Notfonds)",
      "Spende für Tierschutz / Tierheim",
      "Spende für Kinderhilfswerke (UNICEF, SOS-Kinderdorf)",
      "Spende für Umwelt & Natur (BUND, Greenpeace, NABU)",
      "Spende für Krebs- & Medizinforschung",
      "Spende für Kirche & Religionsgemeinschaften",
      "Wikipedia & Open-Source Spenden",
      "Trinkgeld gegeben"
    ],
    "Sonstige Ausgaben & Bargeld": [
      "Bargeldabhebung am Geldautomaten",
      "Ausweisgebühren & Bürgeramt",
      "Passfotos",
      "Lotto, Rubbellose & Glücksspiel",
      "Strafzettel & Knöllchen",
      "Ersatzbeschaffung (Schlüssel, Karten)",
      "Sonstige ungeplante Ausgabe"
    ]
  },
  inc: {
    "Gehalt, Lohn & Beruf": [
      "Hauptjob Monatsgehalt / Nettolohn",
      "Sonn-, Nacht- & Feiertagszuschläge",
      "Schichtzulage & Gefahrenzulage",
      "Fahrtkostenerstattung & Spesen",
      "Ausbildungsvergütung / Lehrlingsgehalt",
      "Beamtenbesoldung / Grundgehalt",
      "Zweitjob / Teilzeitgehalt",
      "Überstundenvergütung & Zulagen (Nacht, Feiertag)",
      "Urlaubsgeld",
      "Weihnachtsgeld / 13. Gehalt",
      "Jahresbonus / Leistungsprämie / Provision",
      "Trinkgeld (im Beruf erhalten)",
      "Honorar aus Selbstständigkeit / Freiberuflichkeit",
      "Werkstudenten-Gehalt",
      "Praktikumsvergütung",
      "Abfindung bei Kündigung",
      "Kurzarbeitergeld",
      "Insolvenzgeld"
    ],
    "Staatliche Leistungen, Hilfen & Zuschüsse": [
      "Landesblindengeld / Blindengeld / Sehbehindertengeld",
      "Bildungs- und Teilhabepaket (BuT)",
      "Heizkostenzuschuss",
      "Taubblindengeld",
      "Pflegegeld (Pflegegrad 1 bis 5 der Pflegekasse)",
      "Bürgergeld (Regelsatz & Wohnkosten Jobcenter)",
      "Arbeitslosengeld I (ALG 1 Agentur für Arbeit)",
      "Kindergeld (Familienkasse)",
      "Kinderzuschlag (KiZ)",
      "Wohngeld (Mietzuschuss von Wohngeldstelle)",
      "BAföG (Schüler / Studenten)",
      "Berufsausbildungsbeihilfe (BAB)",
      "Meister-BAföG (Aufstiegs-BAföG)",
      "Elterngeld / Elterngeld Plus",
      "Mutterschaftsgeld (Krankenkasse)",
      "Krankengeld (Krankenkasse nach 6 Wochen)",
      "Verletztengeld / Übergangsgeld (BG / DRV)",
      "Unterhaltsvorschuss (Jugendamt)",
      "Grundsicherung im Alter & Erwerbsminderung (Sozialamt)",
      "Hilfe zum Lebensunterhalt (Sozialhilfe)",
      "Heizkostenzuschuss / Einmalige Beihilfe",
      "Eingliederungshilfe / Persönliches Budget"
    ],
    "Taschengeld & Private Unterstützung": [
      "Reguläres Taschengeld (Monatlich / Wöchentlich)",
      "Taschengeld-Erhöhung / Sonderzahlung",
      "Finanzielle Unterstützung von Eltern / Familie",
      "Barzuschuss für Miete / Lebensunterhalt",
      "Unterhalt vom Ex-Partner / Kindesunterhalt",
      "Fahrtkostenzuschuss von Verwandten",
      "Sonstiges Taschengeld"
    ],
    "Spenden, Zuwendungen & Förderungen": [
      "Private Spende erhalten",
      "Spende über Spendenaufruf / Crowdfunding (GoFundMe)",
      "Zuwendung von Stiftungen / Hilfsfonds",
      "Stipendium / Studienförderung",
      "Sponsoring-Gelder",
      "Schenkung von Verwandten",
      "Erbschaft / Nachlass-Auszahlung",
      "Trinkgeld / Dankeschön privat erhalten"
    ],
    "Geschenke, Boni & Gewinne": [
      "Geldgeschenk zum Geburtstag",
      "Geldgeschenk zu Weihnachten",
      "Geldgeschenk zu Ostern / Feiertagen",
      "Geldgeschenk zur Konfirmation / Jugendweihe",
      "Geldgeschenk zur Hochzeit / Jubiläum",
      "Lottogewinn / Spielbank / Tombola",
      "Gewinnspiel / Preisausschreiben Einnahme"
    ],
    "Rente, Pension & Versorgung": [
      "Gesetzliche Altersrente (Deutsche Rentenversicherung)",
      "Erwerbsminderungsrente (Volle / Teilweise Erwerbsminderung)",
      "Witwenrente / Witwerrente (Hinterbliebenenrente)",
      "Waisenrente / Halbwaisenrente",
      "Betriebsrente (VBL, ZVK, Firmenrente)",
      "Private Rentenversicherung Auszahlung",
      "Beamtenpension / Ruhegehalt",
      "Berufsgenossenschafts-Rente (Unfallrente)",
      "Ausländische Rentenzahlung"
    ],
    "Verkäufe, Gebrauchtwaren & Erstattungen": [
      "Vinted Kleiderverkauf",
      "eBay & Kleinanzeigen Verkäufe",
      "Flohmarkt / Trödelmarkt Einnahmen",
      "Momox / Rebuy / Zoxs Buch- & Medienverkauf",
      "Auto / Motorrad / Roller privat verkauft",
      "Möbel & Haushaltsgegenstände privat verkauft",
      "Elektronik & Handys privat verkauft",
      "Sonstige Gebrauchtwaren Verkäufe"
    ],
    "Zinsen, Dividenden, Miete & Kapital": [
      "Zinsen auf Tagesgeldkonto",
      "Zinsen auf Festgeldkonto / Sparbuch",
      "Dividenden aus Aktien / ETFs",
      "Gewinne aus Wertpapierverkäufen",
      "Genossenschaftsanteile Dividende",
      "Zinsen aus P2P-Krediten & Crowdinvesting",
      "Bausparzinsen & Prämien",
      "Sonstige Kapitalerträge"
    ],
    "Sonstige Einnahmen": [
      "Bargeldeinzahlung aufs Konto / Kleingeld eingezahlt",
      "Einmalige Gutschrift",
      "Entschädigung (Bahnverspätung, Flugausfall)",
      "Aufwandsentschädigung (Wahlhelfer, Ehrenamt)",
      "Sonstige unvorhergesehene Einnahme"
    ],
    "Nebenjob, Minijob & Freiberufliche Projekte": [
      "Nachhilfeunterricht (Schüler / Studenten)",
      "Babysitting & Kinderbetreuung",
      "Haustierbetreuung & Gassigehen",
      "Gartenarbeiten & Rasenmähen",
      "Haushaltshilfe & Putzjob",
      "Umzugshilfe & Handlangerdienste",
      "Webdesign, IT-Support & PC-Hilfe",
      "Freie Textarbeiten, Lektorat & Übersetzungen",
      "Grafikdesign & Illustrationen"
    ],
    "Kreatives, Musik, Kunst & Content Creation": [
      "YouTube Werbeeinnahmen (AdSense)",
      "Twitch Stream-Erlöse, Abos & Bits",
      "Patreon / Steady Unterstützer-Beiträge",
      "Etsy & Handgemachtes Verkäufe",
      "Musik-Auftritte & Band-Gigs",
      "Kunsthandwerk, Malerei & Skulpturen",
      "Fotografie & Stockfotos Verkäufe",
      "Podcast-Sponsoring & Audio-Honorare"
    ],
    "Krypto, Staking & Web3-Erträge": [
      "Krypto-Staking Belohnungen (ETH, SOL etc.)",
      "Mining Erträge",
      "Krypto Airdrops",
      "DeFi-Zinsen & Liquidity Providing",
      "NFT-Verkäufe & Tantiemen",
      "Krypto-Cashback"
    ],
    "Cashback, Prämien & Treueprogramme": [
      "Payback Punkte Barauszahlung",
      "Shoop & TopCashback Auszahlungen",
      "Girokonto-Eröffnungsprämie",
      "Kreditkarten-Cashback",
      "Freundschaftswerbung / Empfehlungsprämie",
      "Pfandflaschen & Leergut Auszahlung"
    ],
    "Erstattungen, Steuern & Kautionen": [
      "Einkommensteuer-Erstattung Finanzamt",
      "Rundfunkbeitrag Rückerstattung (Befreiung)",
      "Doppelt gezahlter Betrag Erstattung",
      "Krankenkassen-Wahltarif Bonus & Kostenerstattung",
      "Nebenkosten-Guthaben / Abrechnung Vermieter",
      "Strom- & Gas-Guthaben Jahresabrechnung",
      "Mietkaution Rückzahlung nach Auszug",
      "Bahn- & Flugverspätung Entschädigung",
      "Garantie- & Retouren-Rückzahlung"
    ],
    "Private Rückzahlungen & Kostenbeteiligungen": [
      "Rückzahlung von geliehenem Geld (Freunde / Familie)",
      "WG-Kostenabrechnung Anteil",
      "Gemeinsamer Einkauf Abrechnung (PayPal / Bar)",
      "Urlaubsabrechnung von Mitreisenden"
    ],
    "Vermietung, Verpachtung & Carsharing": [
      "WG-Zimmer / Untermiete Mieteinnahme",
      "Garagen- & Stellplatzvermietung",
      "Privates Carsharing (Getaround etc.)",
      "Verleih von Werkzeug, Geräten & Anhänger"
    ]
  }
,
  trf: {
    "Umbuchung & Sparplan": [
      "Sparplan Notgroschen",
      "Sparplan Urlaub",
      "Sparplan Investieren / Depot",
      "Sparplan Führerschein / Auto",
      "Umbuchung Allgemein"
    ]
  }
};

let appState = {
  accounts: [
    { id: 'bank', name: 'Girokonto (Bank)', type: 'giro', initialBalance: 0, isDefault: true },
    { id: 'cash', name: 'Bargeld (Geldbeutel)', type: 'cash', initialBalance: 0, isDefault: false },
    { id: 'savings', name: 'Tagesgeld / Sparkonto', type: 'savings', initialBalance: 0, isDefault: false },
    { id: 'paypal', name: 'PayPal Guthaben', type: 'paypal', initialBalance: 0, isDefault: false }
  ],
  initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 },
  transactions: [],
  recurring: [],
  budgets: {},
  customCategories: { exp: {}, inc: {}, trf: {} },
  wishlist: [],
  shoppingList: []
};

// ============================================================================
// 1e. FINANZ-INTELLIGENZ SUITE: BUDGETS, RANKINGS, CSV-IMPORT, BERICHTE, RECHNER
// ============================================================================

// ----------------------------------------------------------------------------
// A. MONATS-BUDGETS & WARNSYSTEM
// ----------------------------------------------------------------------------
function ensureBudgetsInitialized() {
  if (!appState.budgets || typeof appState.budgets !== 'object') {
    appState.budgets = {};
  }
}

function populateBudgetCategoryDropdown() {
  const sel = document.getElementById('budget-category-select');
  if (!sel) return;
  const expCats = Object.keys(CATEGORIES_DB.exp);
  sel.innerHTML = expCats.map(cat => `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`).join('');
  applySymbolsToOptions(sel);
}

function handleSaveBudget(e) {
  e.preventDefault();
  ensureBudgetsInitialized();
  const cat = document.getElementById('budget-category-select').value;
  const amount = parseFloat(document.getElementById('budget-amount-input').value);

  if (!cat || isNaN(amount) || amount <= 0) return;

  appState.budgets[cat] = amount;
  saveStateToEncryptedStorage();
  renderBudgetsList();
  document.getElementById('budget-amount-input').value = '';
  announceNVDA(`Budget für ${cat} auf ${formatCurrency(amount)} festgelegt!`);
}

function deleteBudget(cat) {
  ensureBudgetsInitialized();
  if (appState.budgets[cat] !== undefined) {
    delete appState.budgets[cat];
    saveStateToEncryptedStorage();
    renderBudgetsList();
    announceNVDA(`Budget für ${cat} gelöscht.`);
  }
}

function renderBudgetsList() {
  ensureBudgetsInitialized();
  const container = document.getElementById('budgets-overview-container');
  if (!container) return;

  const now = new Date();
  const targetYear = (typeof selectedYear === 'number') ? selectedYear : now.getFullYear();
  const targetMonth = (typeof selectedMonth === 'number') ? selectedMonth : now.getMonth();

  const currentStats = calculateMonthStats(targetYear, targetMonth);
  const expensesByCategory = {};
  currentStats.expenseList.forEach(tx => {
    const cat = tx.category || 'Sonstiges';
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Number(tx.amount || 0);
  });

  const budgetEntries = Object.entries(appState.budgets);
  if (budgetEntries.length === 0) {
    container.innerHTML = '<p class="empty-state">Noch keine Monats-Budgets festgelegt. Wähle oben eine Kategorie und lege dein Wunsch-Limit fest!</p>';
    return;
  }

  const show = isSymbolsEnabled();

  container.innerHTML = `
    <div class="budget-grid">
      ${budgetEntries.map(([cat, limit]) => {
        const spent = expensesByCategory[cat] || 0;
        const percent = Math.min(100, Math.round((spent / limit) * 100));
        const remaining = limit - spent;
        
        let colorClass = 'budget-green';
        let statusBadge = '<span style="color: #4CAF50; font-weight: bold;">🟢 Im Budget</span>';
        if (spent >= limit) {
          colorClass = 'budget-red';
          statusBadge = '<span style="color: #F44336; font-weight: bold;">🔴 Überschritten!</span>';
        } else if (percent >= 80) {
          colorClass = 'budget-yellow';
          statusBadge = '<span style="color: #FF9800; font-weight: bold;">🟡 80% erreicht</span>';
        }

        const icon = CATEGORY_ICONS[cat] || '🎯';
        const iconHtml = show ? `<span class="emoji-icon" aria-hidden="true">${icon} </span>` : '';

        return `
          <div class="budget-card" tabindex="0" aria-label="Budget ${escapeHTML(cat)}: ${formatCurrency(spent)} von ${formatCurrency(limit)} verbraucht (${percent} Prozent)">
            <div class="budget-header">
              <span>${iconHtml}${escapeHTML(cat)}</span>
              ${statusBadge}
            </div>
            <div class="budget-bar-container">
              <div class="budget-bar-fill ${colorClass}" style="width: ${percent}%;"></div>
            </div>
            <div class="budget-stats">
              <span>Ausgegeben: <strong>${formatCurrency(spent)}</strong></span>
              <span>Limit: <strong>${formatCurrency(limit)}</strong></span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 13px;">
              <span>${remaining >= 0 ? `Noch verfügbar: <strong style="color: #4CAF50;">${formatCurrency(remaining)}</strong>` : `Überzug: <strong style="color: #F44336;">${formatCurrency(Math.abs(remaining))}</strong>`}</span>
              <button type="button" class="btn btn-secondary" onclick="deleteBudget('${escapeHTML(cat)}')" style="padding: 4px 8px; font-size: 12px; color: #f44336;">Löschen</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// B. AUSGABEN-RANGLISTE (TOP GELDFRESSER)
// ----------------------------------------------------------------------------
function renderExpenseRankings(expenseList) {
  const container = document.getElementById('overview-expense-rankings');
  if (!container) return;

  if (!expenseList || expenseList.length === 0) {
    container.innerHTML = '<p class="empty-state">Noch keine Ausgaben im gewählten Zeitraum vorhanden.</p>';
    return;
  }

  const totalsByCat = {};
  let totalExpense = 0;
  expenseList.forEach(tx => {
    const cat = tx.category || 'Sonstiges';
    const amt = Number(tx.amount || 0);
    totalsByCat[cat] = (totalsByCat[cat] || 0) + amt;
    totalExpense += amt;
  });

  const sorted = Object.entries(totalsByCat).sort((a, b) => b[1] - a[1]);
  const show = isSymbolsEnabled();
  const badges = ['🥇', '🥈', '🥉'];

  container.innerHTML = `
    <div class="ranking-list">
      ${sorted.slice(0, 5).map(([cat, amt], idx) => {
        const percent = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
        const rankSymbol = idx < 3 ? badges[idx] : `#${idx + 1}`;
        const rankHtml = show ? rankSymbol : `Platz ${idx + 1}:`;
        const icon = CATEGORY_ICONS[cat] || '📦';
        const iconHtml = show ? `<span class="emoji-icon" aria-hidden="true">${icon} </span>` : '';

        return `
          <div class="ranking-item" tabindex="0" aria-label="Platz ${idx + 1}: ${escapeHTML(cat)} mit ${formatCurrency(amt)} (${percent} Prozent der Gesamtausgaben)">
            <div class="rank-badge">${rankHtml}</div>
            <div class="rank-info">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>${iconHtml}${escapeHTML(cat)}</span>
                <span class="expense">- ${formatCurrency(amt)} (${percent}%)</span>
              </div>
              <div class="rank-bar-bg">
                <div class="rank-bar-fill" style="width: ${percent}%;"></div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ----------------------------------------------------------------------------
// C. LIQUIDITÄTS- & KONTODECKUNGS-WARNUNG
// ----------------------------------------------------------------------------
function checkLiquidityWarning(periodEndBalances) {
  const alertBox = document.getElementById('overview-liquidity-alert');
  if (!alertBox) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const year = (typeof selectedYear !== 'undefined' && selectedYear !== null) ? selectedYear : new Date().getFullYear();
  const month = (typeof selectedMonth !== 'undefined' && selectedMonth !== null) ? selectedMonth : new Date().getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mFormatted = String(month + 1).padStart(2, '0');
  const monthStartStr = `${year}-${mFormatted}-01`;
  const monthEndStr = `${year}-${mFormatted}-${String(daysInMonth).padStart(2, '0')}`;

  // Wenn der betrachtete Monat bereits in der Vergangenheit liegt, keine Fälligkeitswarnung
  if (monthEndStr < todayStr) {
    alertBox.style.display = 'none';
    checkContractReminders();
    return;
  }

  // Simulations-Start: Heute (oder Monatsanfang bei Zukunftsmonaten)
  const evalStartStr = (todayStr > monthStartStr) ? todayStr : monthStartStr;
  const startBalances = calculateBalancesUpToDate(evalStartStr);

  // Anstehende Buchungen von morgen (oder nach evalStartStr) bis zum Monatsende
  const upcomingTx = (appState.transactions || []).filter(t => t.date && t.date > evalStartStr && t.date <= monthEndStr);
  const recList = getRecurringTransactionsForMonth(year, month).filter(r => r.date && r.date > evalStartStr && r.date <= monthEndStr);
  const allUpcoming = [...upcomingTx, ...recList];

  // Chronologisch sortieren
  allUpcoming.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  // Verlauf für jedes Konto simulieren
  const accStats = {};
  (appState.accounts || []).forEach(acc => {
    const cur = startBalances[acc.id] !== undefined ? startBalances[acc.id] : 0;
    accStats[acc.id] = {
      acc: acc,
      startBal: cur,
      runningBal: cur,
      lowestBal: cur,
      totalExpenses: 0,
      totalIncome: 0,
      dispo: Number(acc.dispoLimit || 0),
      shortfall: 0,
      coveredAmount: 0,
      coveredBy: '',
      uncoveredShortfall: 0
    };
  });

  allUpcoming.forEach(item => {
    const amt = Number(item.amount || 0);
    if (item.type === 'expense' && item.account && accStats[item.account]) {
      accStats[item.account].runningBal -= amt;
      accStats[item.account].totalExpenses += amt;
      accStats[item.account].lowestBal = Math.min(accStats[item.account].lowestBal, accStats[item.account].runningBal);
    } else if (item.type === 'income' && item.account && accStats[item.account]) {
      accStats[item.account].runningBal += amt;
      accStats[item.account].totalIncome += amt;
      accStats[item.account].lowestBal = Math.min(accStats[item.account].lowestBal, accStats[item.account].runningBal);
    } else if (item.type === 'transfer' && item.fromAccount && item.toAccount) {
      if (accStats[item.fromAccount]) {
        accStats[item.fromAccount].runningBal -= amt;
        accStats[item.fromAccount].totalExpenses += amt;
        accStats[item.fromAccount].lowestBal = Math.min(accStats[item.fromAccount].lowestBal, accStats[item.fromAccount].runningBal);
      }
      if (accStats[item.toAccount]) {
        accStats[item.toAccount].runningBal += amt;
        accStats[item.toAccount].totalIncome += amt;
        accStats[item.toAccount].lowestBal = Math.min(accStats[item.toAccount].lowestBal, accStats[item.toAccount].runningBal);
      }
    }
  });

  // Echten Fehlbetrag ermitteln (nur wenn Guthaben + Dispo unter 0 fällt!)
  (appState.accounts || []).forEach(acc => {
    const st = accStats[acc.id];
    if (!st) return;
    const effectiveLowest = st.lowestBal + st.dispo;
    if (effectiveLowest < 0) {
      st.shortfall = Math.round(Math.abs(effectiveLowest) * 100) / 100;
    } else {
      st.shortfall = 0;
    }
    st.uncoveredShortfall = st.shortfall;
  });

  // Auto-Deckungskonten anrechnen: Nur belasten, wenn das Primärkonto WIRKLICH nicht ausreicht!
  (appState.accounts || []).forEach(acc => {
    const st = accStats[acc.id];
    if (!st || st.shortfall <= 0) return;

    if (acc.hasBackupAccount && acc.backupAccountId && accStats[acc.backupAccountId]) {
      const backupSt = accStats[acc.backupAccountId];
      const backupAvailable = backupSt.lowestBal + backupSt.dispo;

      if (backupAvailable >= st.shortfall) {
        // Vollständig gedeckt
        st.coveredAmount = st.shortfall;
        st.coveredBy = backupSt.acc.name;
        st.uncoveredShortfall = 0;
        backupSt.lowestBal -= st.shortfall;
      } else if (backupAvailable > 0) {
        // Teilweise gedeckt
        st.coveredAmount = Math.round(backupAvailable * 100) / 100;
        st.coveredBy = backupSt.acc.name;
        st.uncoveredShortfall = Math.round((st.shortfall - backupAvailable) * 100) / 100;
        backupSt.lowestBal -= backupAvailable;
      } else {
        // Deckungskonto selbst leer
        st.coveredAmount = 0;
        st.uncoveredShortfall = st.shortfall;
      }
    }
  });

  // Warnungen und Benachrichtigungen zusammenstellen
  const alertItems = [];

  (appState.accounts || []).forEach(acc => {
    const st = accStats[acc.id];
    if (!st) return;

    // Nur bei echter Unterdeckung warnen!
    if (st.uncoveredShortfall > 0) {
      let backupNote = '';
      if (acc.hasBackupAccount && acc.backupAccountId && st.coveredAmount > 0) {
        backupNote = ` (davon ${formatCurrency(st.coveredAmount)} über ${escapeHTML(st.coveredBy)} gedeckt, Rest ungedeckt)`;
      } else if (acc.hasBackupAccount && acc.backupAccountId && accStats[acc.backupAccountId]) {
        backupNote = ` (Deckungskonto ${escapeHTML(accStats[acc.backupAccountId].acc.name)} reicht ebenfalls nicht aus)`;
      }
      alertItems.push(`
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px;">
          <span style="font-size: 24px;" aria-hidden="true">⚠️</span>
          <div>
            <strong style="color: var(--text-primary); font-size: 15px;">Achtung Kontodeckung auf ${escapeHTML(acc.name)}:</strong>
            <div style="font-size: 14px; margin-top: 2px;">
              Bis zum Monatsende stehen noch <strong>${formatCurrency(st.totalExpenses)}</strong> an Ausgaben &amp; Daueraufträgen an.
              Aktuell verfügbar: <strong>${formatCurrency(Math.max(0, st.startBal))}</strong>${st.dispo > 0 ? ` (+ Dispo: ${formatCurrency(st.dispo)})` : ''}.
              Drohender Fehlbetrag: <strong style="color: #D32F2F;">${formatCurrency(st.uncoveredShortfall)}</strong>${backupNote}.
            </div>
          </div>
        </div>
      `);
    } else if (st.coveredAmount > 0) {
      // Ruhige, positive Info, dass die Auto-Deckung greift und abgesichert ist
      alertItems.push(`
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px;">
          <span style="font-size: 22px;" aria-hidden="true">🛡️</span>
          <div>
            <strong style="color: #1B5E20; font-size: 15px;">Automatische Deckung aktiv für ${escapeHTML(acc.name)}:</strong>
            <div style="font-size: 14px; margin-top: 2px; color: var(--text-primary);">
              Für anstehende Zahlungen (${formatCurrency(st.totalExpenses)}) werden voraussichtlich <strong>${formatCurrency(st.coveredAmount)}</strong> automatisch über <strong>${escapeHTML(st.coveredBy)}</strong> ausgeglichen. Dort ist ausreichend Guthaben vorhanden.
            </div>
          </div>
        </div>
      `);
    }
  });

  if (alertItems.length > 0) {
    alertBox.style.display = 'flex';
    alertBox.className = 'liquidity-alert-box';
    alertBox.innerHTML = alertItems.join('<hr style="border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 8px 0;">');
  } else {
    alertBox.style.display = 'none';
  }

  checkContractReminders();
}

function checkContractReminders() {
  const container = document.getElementById('overview-contract-alerts');
  if (!container) return;

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const alerts = [];

  (appState.recurring || []).forEach(rec => {
    if (rec.active === false) return;

    // 1. Gratis-Zeitraum (Probe-Abo)
    if (rec.trialActive && rec.trialEndDate) {
      const endD = new Date(rec.trialEndDate + 'T00:00:00');
      const diffDays = Math.ceil((endD - today) / (1000 * 60 * 60 * 24));
      const warnThreshold = (rec.trialUnit === 'months') ? 7 : 3;
      if (diffDays >= 0 && diffDays <= warnThreshold) {
        alerts.push({
          type: 'trial',
          icon: '🎁',
          bg: 'rgba(156, 39, 176, 0.1)',
          border: '#9C27B0',
          title: `Probe-Abo läuft aus: ${escapeHTML(rec.name || rec.category)}`,
          msg: `Die kostenlose Testphase endet am <strong>${formatDateGerman(rec.trialEndDate)}</strong> (${diffDays === 0 ? 'heute!' : `in ${diffDays} Tag(en)`}). Wenn du nicht kündigst, werden danach regulär <strong>${formatCurrency(rec.amount)}</strong> abgebucht.`
        });
      }
    }

    // 2. Rabatt-Phase läuft aus
    if (rec.discountActive && rec.discountEndYear !== undefined && rec.discountEndMonth !== undefined) {
      const curVal = today.getFullYear() * 12 + today.getMonth();
      const discVal = rec.discountEndYear * 12 + rec.discountEndMonth;
      if (discVal - curVal === 0 || discVal - curVal === 1) {
        alerts.push({
          type: 'discount',
          icon: '🏷️',
          bg: 'rgba(255, 152, 0, 0.1)',
          border: '#FF9800',
          title: `Rabattpreis endet bald: ${escapeHTML(rec.name || rec.category)}`,
          msg: `Der vergünstigte Preis von <strong>${formatCurrency(rec.discountAmount)}</strong> gilt nur noch bis <strong>${MONTH_NAMES[rec.discountEndMonth]} ${rec.discountEndYear}</strong>. Danach steigt der Betrag auf <strong>${formatCurrency(rec.regularAmount || rec.amount)}</strong>.`
        });
      }
    }

    // 3. Kündigungsfrist / Mindestlaufzeit
    if (rec.hasContractDetails && rec.minTermDate) {
      const minD = new Date(rec.minTermDate + 'T00:00:00');
      const diffDays = Math.ceil((minD - today) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) {
        alerts.push({
          type: 'contract',
          icon: '📝',
          bg: 'rgba(33, 150, 243, 0.1)',
          border: '#2196F3',
          title: `Vertragslaufzeit prüfen: ${escapeHTML(rec.name || rec.category)}`,
          msg: `Die Mindestlaufzeit endet am <strong>${formatDateGerman(rec.minTermDate)}</strong> (${diffDays === 0 ? 'heute!' : `in ${diffDays} Tag(en)`}). Kündigungsfrist: <em>${escapeHTML(rec.noticePeriod || 'Standard')}</em>${rec.contractNumber ? ` | Kd-Nr: <strong>${escapeHTML(rec.contractNumber)}</strong>` : ''}.`
        });
      }
    }
  });

  if (alerts.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
  } else {
    container.style.display = 'flex';
    container.innerHTML = alerts.map(a => `
      <div class="liquidity-alert-box" style="background: ${a.bg}; border-left-color: ${a.border};">
        <span style="font-size: 24px;" aria-hidden="true">${a.icon}</span>
        <div>
          <strong style="color: var(--text-primary); display: block; margin-bottom: 2px;">${a.title}</strong>
          <span style="font-size: 14px;">${a.msg}</span>
        </div>
      </div>
    `).join('');
  }
}

// ----------------------------------------------------------------------------
// D. EINKAUFSZETTEL- & KASSENZETTEL-RECHNER
// ----------------------------------------------------------------------------
// EINKAUFSLISTE & CHECKLISTE (v6.8.0)
// ----------------------------------------------------------------------------
let currentShoppingFilter = 'all';

function ensureShoppingListInitialized() {
  if (!appState.shoppingList || !Array.isArray(appState.shoppingList)) {
    appState.shoppingList = [];
  }
}

function renderShoppingList() {
  ensureShoppingListInitialized();
  const listEl = document.getElementById('shopping-items-list');
  if (!listEl) return;

  const allItems = appState.shoppingList;
  const openItems = allItems.filter(i => !i.checked);
  const doneItems = allItems.filter(i => i.checked);

  // Update counter badges
  const cAll = document.getElementById('shopping-count-all');
  const cOpen = document.getElementById('shopping-count-open');
  const cDone = document.getElementById('shopping-count-done');
  if (cAll) cAll.textContent = allItems.length;
  if (cOpen) cOpen.textContent = openItems.length;
  if (cDone) cDone.textContent = doneItems.length;

  // Filter items
  let displayItems = allItems;
  if (currentShoppingFilter === 'open') {
    displayItems = openItems;
  } else if (currentShoppingFilter === 'done') {
    displayItems = doneItems;
  }

  // Calculate totals
  const openTotal = openItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const doneTotal = doneItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const summaryEl = document.getElementById('shopping-summary-text');
  if (summaryEl) {
    if (allItems.length === 0) {
      summaryEl.innerHTML = '<strong>Deine Einkaufsliste ist leer.</strong> Setze oben Artikel drauf oder füge eine WhatsApp-Liste ein!';
    } else {
      summaryEl.innerHTML = `
        <strong>${openItems.length} Artikel noch offen</strong> (Geschätzt: <strong>${formatCurrency(openTotal)}</strong>) &bull; 
        ${doneItems.length} abgehakt (${formatCurrency(doneTotal)})
      `;
    }
  }

  const bookBtn = document.getElementById('btn-open-shopping-book');
  if (bookBtn) {
    bookBtn.disabled = allItems.length === 0;
    if (doneItems.length > 0) {
      bookBtn.innerHTML = `<span>💳 <strong>${doneItems.length} erledigte Artikel buchen (${formatCurrency(doneTotal || openTotal)})</strong></span>`;
    } else {
      bookBtn.innerHTML = `<span>💳 <strong>Einkauf als Ausgabe buchen (${formatCurrency(openTotal)})</strong></span>`;
    }
  }

  if (displayItems.length === 0) {
    if (allItems.length === 0) {
      listEl.innerHTML = `
        <li class="shopping-empty-hint">
          🛒 Noch keine Artikel auf der Einkaufsliste.<br>
          Tippe oben einen Artikel ein, füge Text aus WhatsApp ein oder lade ein Foto / PDF hoch!
        </li>`;
    } else if (currentShoppingFilter === 'open') {
      listEl.innerHTML = `
        <li class="shopping-empty-hint">
          🎉 Alles erledigt! Keine offenen Artikel mehr auf der Liste.
        </li>`;
    } else if (currentShoppingFilter === 'done') {
      listEl.innerHTML = `
        <li class="shopping-empty-hint">
          Noch keine Artikel abgehakt. Hake Artikel an, sobald du sie im Einkaufswagen hast!
        </li>`;
    }
    return;
  }

  listEl.innerHTML = displayItems.map(item => {
    const isDone = Boolean(item.checked);
    const priceText = item.price && Number(item.price) > 0 ? formatCurrency(Number(item.price)) : '';
    const storeText = item.store ? escapeHTML(item.store) : '';

    return `
      <li class="shopping-item-row ${isDone ? 'is-done' : ''}" id="shopping-item-${item.id}">
        <div class="shopping-item-main">
          <label class="shopping-checkbox-label" for="chk-shop-${item.id}">
            <input 
              type="checkbox" 
              id="chk-shop-${item.id}" 
              class="shopping-checkbox-input" 
              ${isDone ? 'checked' : ''} 
              onchange="toggleShoppingItem('${item.id}')"
              aria-label="${escapeHTML(item.name)} als ${isDone ? 'offen' : 'erledigt'} markieren"
            >
            <span class="shopping-item-name">${escapeHTML(item.name)}</span>
          </label>
        </div>
        <div class="shopping-item-meta">
          ${priceText ? `<span class="shopping-badge-price" title="Preis">${priceText}</span>` : ''}
          ${storeText ? `<span class="shopping-badge-store" title="Laden / Geschäft">${storeText}</span>` : ''}
          <button 
            type="button" 
            class="shopping-btn-delete" 
            onclick="deleteShoppingItem('${item.id}')" 
            aria-label="${escapeHTML(item.name)} von der Einkaufsliste löschen"
            title="Artikel löschen"
          >✕</button>
        </div>
      </li>
    `;
  }).join('');
}

async function addShoppingItemFromForm(e) {
  if (e) e.preventDefault();
  ensureShoppingListInitialized();

  const nameInput = document.getElementById('shopping-new-name');
  const priceInput = document.getElementById('shopping-new-price');
  const storeInput = document.getElementById('shopping-new-store');

  if (!nameInput) return;
  const name = nameInput.value.trim();
  if (!name) return;

  const rawPrice = priceInput && priceInput.value ? parseFloat(priceInput.value) : null;
  const price = rawPrice && !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : null;
  const store = storeInput ? storeInput.value.trim() : '';

  const newItem = {
    id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    name: name,
    price: price,
    store: store,
    checked: false,
    createdAt: Date.now()
  };

  appState.shoppingList.push(newItem);
  await saveStateToEncryptedStorage();

  nameInput.value = '';
  if (priceInput) priceInput.value = '';
  nameInput.focus();

  renderShoppingList();
  announceNVDA(`${name} zur Einkaufsliste hinzugefügt.`);
}

async function toggleShoppingItem(id) {
  ensureShoppingListInitialized();
  const item = appState.shoppingList.find(i => i.id === id);
  if (!item) return;

  item.checked = !item.checked;
  await saveStateToEncryptedStorage();
  renderShoppingList();

  const status = item.checked ? 'erledigt abgehakt' : 'wieder als offen markiert';
  announceNVDA(`${item.name} ${status}.`);
}

async function deleteShoppingItem(id) {
  ensureShoppingListInitialized();
  const idx = appState.shoppingList.findIndex(i => i.id === id);
  if (idx === -1) return;

  const removed = appState.shoppingList.splice(idx, 1)[0];
  await saveStateToEncryptedStorage();
  renderShoppingList();
  announceNVDA(`${removed.name} von der Einkaufsliste gelöscht.`);
}

function setShoppingFilter(filter) {
  currentShoppingFilter = filter;
  ['all', 'open', 'done'].forEach(f => {
    const btn = document.getElementById('shopping-filter-' + f);
    if (btn) {
      const isActive = f === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    }
  });
  renderShoppingList();
  const filterNames = { all: 'Alle Artikel', open: 'Nur noch offene Artikel', done: 'Nur erledigte Artikel' };
  announceNVDA(`Filter geändert auf: ${filterNames[filter] || filter}`);
}

async function clearDoneShoppingItems() {
  ensureShoppingListInitialized();
  const countBefore = appState.shoppingList.length;
  appState.shoppingList = appState.shoppingList.filter(i => !i.checked);
  const removedCount = countBefore - appState.shoppingList.length;

  if (removedCount === 0) {
    alert('Es gibt keine abgehakten Artikel zum Aufräumen.');
    return;
  }

  await saveStateToEncryptedStorage();
  renderShoppingList();
  announceNVDA(`${removedCount} erledigte Artikel von der Einkaufsliste aufgeräumt.`);
}

async function clearEntireShoppingList() {
  ensureShoppingListInitialized();
  if (appState.shoppingList.length === 0) {
    alert('Die Einkaufsliste ist bereits leer.');
    return;
  }

  if (!confirm('Möchtest du wirklich alle Artikel von der Einkaufsliste löschen?')) {
    return;
  }

  appState.shoppingList = [];
  await saveStateToEncryptedStorage();
  renderShoppingList();
  announceNVDA('Einkaufsliste komplett geleert.');
}

function copyShoppingListAsText() {
  ensureShoppingListInitialized();
  if (appState.shoppingList.length === 0) {
    alert('Die Einkaufsliste ist leer. Es gibt nichts zu kopieren.');
    return;
  }

  const lines = ['🛒 *Einkaufsliste:*'];
  const openItems = appState.shoppingList.filter(i => !i.checked);
  const doneItems = appState.shoppingList.filter(i => i.checked);

  if (openItems.length > 0) {
    openItems.forEach(item => {
      let meta = [];
      if (item.store) meta.push(item.store);
      if (item.price && Number(item.price) > 0) meta.push(formatCurrency(Number(item.price)));
      const metaStr = meta.length > 0 ? ` (${meta.join(', ')})` : '';
      lines.push(`- [ ] ${item.name}${metaStr}`);
    });
  }

  if (doneItems.length > 0) {
    lines.push('');
    lines.push('✅ *Bereits erledigt:*');
    doneItems.forEach(item => {
      lines.push(`- [x] ~~${item.name}~~`);
    });
  }

  const fullText = lines.join('\n');
  navigator.clipboard.writeText(fullText).then(() => {
    alert('✅ Einkaufsliste wurde in die Zwischenablage kopiert! Du kannst sie jetzt z. B. in WhatsApp mit Strg+V einfügen.');
    announceNVDA('Einkaufsliste in Zwischenablage kopiert.');
  }).catch(err => {
    console.warn('Clipboard write failed:', err);
    prompt('Einkaufsliste kopieren (Strg+C drücken):', fullText);
  });
}

// ----------------------------------------------------------------------------
// MODAL: WHATSAPP- & TEXT-IMPORT
// ----------------------------------------------------------------------------
function openShoppingPasteModal() {
  const modal = document.getElementById('shopping-paste-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  const ta = document.getElementById('shopping-paste-input');
  if (ta) {
    ta.value = '';
    ta.focus();
  }
  const storeInput = document.getElementById('shopping-paste-store');
  if (storeInput) storeInput.value = '';
  announceNVDA('Dialog zum Einfügen von WhatsApp- oder Textlisten geöffnet.');
}

function closeShoppingPasteModal() {
  const modal = document.getElementById('shopping-paste-modal');
  if (modal) modal.style.display = 'none';
  const btn = document.getElementById('shopping-new-name');
  if (btn) btn.focus();
}

async function handleShoppingPasteSubmit(e) {
  if (e) e.preventDefault();
  const ta = document.getElementById('shopping-paste-input');
  const storeInput = document.getElementById('shopping-paste-store');
  if (!ta) return;

  const rawText = ta.value;
  const defaultStore = storeInput ? storeInput.value.trim() : '';

  const addedCount = await parseAndImportShoppingText(rawText, defaultStore);
  closeShoppingPasteModal();

  if (addedCount > 0) {
    alert(`✅ ${addedCount} Artikel wurden erfolgreich auf deine Einkaufsliste gesetzt!`);
  } else {
    alert('Es konnten keine Artikel im eingegebenen Text erkannt werden. Bitte überprüfe den Text.');
  }
}

// Universal parser for WhatsApp text, bullet lists, OCR scans, notes, etc.
async function parseAndImportShoppingText(rawText, defaultStore) {
  ensureShoppingListInitialized();
  if (!rawText || typeof rawText !== 'string') return 0;

  const lines = rawText.split(/\r?\n/);
  const itemsToAdd = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Skip generic header lines
    if (/^(einkauf|einkaufsliste|liste|supermarkt|besorgen|rewe|aldi|lidl|edeka|hallo|moin)[s:!]*$/i.test(line)) {
      continue;
    }

    // Strip bullet points, numbers, checkboxes
    line = line.replace(/^[\s\-\*•–—\+■□\>]+/, '').trim();
    line = line.replace(/^\d+[\.\)\-]\s*/, '').trim();
    line = line.replace(/^\[[ xX✓✔]?\]\s*/, '').trim();
    line = line.replace(/^[\u2610\u2611\u2612\u2705\u2713\u2714•]\s*/, '').trim();

    if (!line) continue;

    // Check for price at end of line (e.g. 2,49 € or 1.99 EUR or 3,50)
    let price = null;
    const priceMatch = line.match(/(?:(?:EUR|€)\s*([0-9]+[.,][0-9]{2})|([0-9]+[.,][0-9]{2})\s*(?:EUR|€|Euro)?)$/i);
    if (priceMatch) {
      const priceStr = priceMatch[1] || priceMatch[2];
      const parsed = parseFloat(priceStr.replace(',', '.'));
      if (!isNaN(parsed) && parsed > 0) {
        price = parsed;
        line = line.substring(0, priceMatch.index).trim();
      }
    }

    // Check for store in parentheses / brackets e.g. (Rewe) or [Aldi] (avoid capturing package sizes like 10er, 500g)
    let store = defaultStore || '';
    const storeMatch = line.match(/[\(\[]([^\)\]]+)[\)\]]\s*$/);
    if (storeMatch) {
      const inside = storeMatch[1].trim();
      const isPackSize = /^(\d+[\.,]?\d*\s*(?:er|g|kg|ml|l|stk|stück|st\.?|pack|pkg|dose|fl|flasche|beutel|bund|x|gl)?|\d+)$/i.test(inside);
      if (!isPackSize) {
        store = inside;
        line = line.substring(0, storeMatch.index).trim();
      }
    }

    // Strip trailing colons or commas
    line = line.replace(/[,;:]+$/, '').trim();

    if (!line) continue;

    itemsToAdd.push({
      id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: line,
      price: price,
      store: store,
      checked: false,
      createdAt: Date.now()
    });
  }

  if (itemsToAdd.length === 0) return 0;

  appState.shoppingList.push(...itemsToAdd);
  await saveStateToEncryptedStorage();
  renderShoppingList();
  announceNVDA(`${itemsToAdd.length} Artikel zur Einkaufsliste hinzugefügt.`);
  return itemsToAdd.length;
}

// ----------------------------------------------------------------------------
// DOKUMENT- & FOTO-UPLOAD FÜR EINKAUFSLISTE
// ----------------------------------------------------------------------------
async function handleShoppingDocumentSelect(files) {
  if (!files || files.length === 0) return;
  const file = files[0];

  announceNVDA(`Dokument ${file.name} wird verarbeitet...`);

  try {
    // 1. Text- oder CSV-Datei
    if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      const text = await file.text();
      const count = await parseAndImportShoppingText(text, '');
      if (count > 0) {
        alert(`✅ ${count} Artikel aus der Datei "${file.name}" wurden zur Einkaufsliste hinzugefügt!`);
      } else {
        alert('In der Textdatei wurden keine lesbaren Artikelzeilen gefunden.');
      }
      return;
    }

    // 2. PDF Datei
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const compressed = await compressReceiptFile(file);
      let pdfText = '';
      if (compressed.data) {
        pdfText = extractTextFromPdfDataUrl(compressed.data);
      }
      if (!pdfText) {
        // Fallback to OCR extractor
        const ext = await extractTextFromReceipt(compressed);
        pdfText = ext.recognizedText;
      }

      if (pdfText && pdfText.trim()) {
        const count = await parseAndImportShoppingText(pdfText, '');
        alert(`✅ ${count} Artikel aus dem PDF-Dokument übernommen!`);
      } else {
        alert('Aus dem PDF konnte kein Text ausgelesen werden. Bitte Text als WhatsApp-Nachricht oder TXT einfügen.');
      }
      return;
    }

    // 3. Bild / Foto / Kamera
    if (file.type.startsWith('image/')) {
      const compressed = await compressReceiptFile(file);
      const ext = await extractTextFromReceipt(compressed);
      const ocrText = ext.recognizedText || '';

      if (ocrText && ocrText.trim()) {
        const count = await parseAndImportShoppingText(ocrText, '');
        if (count > 0) {
          alert(`✅ ${count} Artikel wurden aus dem Foto/Beleg erkannt und zur Einkaufsliste hinzugefügt!`);
          return;
        }
      }

      // Falls OCR offline keinen sauberen Text liefert, Text-Modal anbieten
      const modal = document.getElementById('shopping-paste-modal');
      if (modal) {
        openShoppingPasteModal();
        const ta = document.getElementById('shopping-paste-input');
        if (ta && ocrText) ta.value = ocrText;
        alert('Das Bild wurde geladen. Du kannst den erkannten Text im geöffneten Fenster überprüfen und anpassen.');
      }
    }
  } catch (err) {
    console.error('Fehler beim Dokument-Upload für Einkaufsliste:', err);
    alert('Fehler beim Lesen der Datei: ' + err.message);
  } finally {
    const input = document.getElementById('shopping-file-upload-input');
    if (input) input.value = '';
  }
}

// ----------------------------------------------------------------------------
// EINKAUF ALS AUSGABE BUCHEN
// ----------------------------------------------------------------------------
function populateShoppingDropdowns() {
  ensureAccountsInitialized();
  const accSel = document.getElementById('shopping-book-account');
  const catSel = document.getElementById('shopping-book-category');

  if (accSel) {
    accSel.innerHTML = appState.accounts.map(a => `<option value="${escapeHTML(a.id)}">${escapeHTML(a.name)}</option>`).join('');
    applySymbolsToOptions(accSel);
  }

  if (catSel) {
    const expCategories = Object.keys(CATEGORIES_DB.exp || {});
    catSel.innerHTML = expCategories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
    // Default to Lebensmittel
    if (expCategories.includes('Lebensmittel, Supermarkt & Discounter')) {
      catSel.value = 'Lebensmittel, Supermarkt & Discounter';
    }
    applySymbolsToOptions(catSel);
    onShoppingBookCatChange();
  }
}

function onShoppingBookCatChange() {
  const catSel = document.getElementById('shopping-book-category');
  const subSel = document.getElementById('shopping-book-subcategory');
  if (!catSel || !subSel) return;

  const selCat = catSel.value;
  const subs = (CATEGORIES_DB.exp && CATEGORIES_DB.exp[selCat]) ? CATEGORIES_DB.exp[selCat] : ['Gesamt / Allgemein', 'Supermarkt', 'Sonstiges'];

  subSel.innerHTML = subs.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
  applySymbolsToOptions(subSel);
}

function openShoppingBookModal() {
  ensureShoppingListInitialized();
  const allItems = appState.shoppingList;
  if (allItems.length === 0) {
    alert('Deine Einkaufsliste ist leer. Füge zuerst Artikel hinzu.');
    return;
  }

  populateShoppingDropdowns();

  const doneItems = allItems.filter(i => i.checked);
  const targetItems = doneItems.length > 0 ? doneItems : allItems;
  const totalSum = targetItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const modal = document.getElementById('shopping-book-modal');
  if (!modal) return;

  const amtInput = document.getElementById('shopping-book-amount');
  const dateInput = document.getElementById('shopping-book-date');
  const noteInput = document.getElementById('shopping-book-note');
  const hintEl = document.getElementById('shopping-book-hint');

  if (amtInput) amtInput.value = totalSum > 0 ? totalSum.toFixed(2) : '';
  if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
  if (hintEl) {
    hintEl.textContent = doneItems.length > 0
      ? `Es werden ${doneItems.length} abgehakte Artikel verbucht. Passe den Betrag bei Bedarf an den Kassenzettel an:`
      : `Es werden alle ${allItems.length} Artikel der Liste verbucht:`;
  }

  if (noteInput) {
    const itemNames = targetItems.map(i => i.name + (i.price ? ` (${formatCurrency(i.price)})` : '')).join(', ');
    noteInput.value = 'Einkauf: ' + itemNames;
  }

  modal.style.display = 'flex';
  if (amtInput) amtInput.focus();
  announceNVDA('Dialog zum Abbuchen des Einkaufs geöffnet.');
}

function closeShoppingBookModal() {
  const modal = document.getElementById('shopping-book-modal');
  if (modal) modal.style.display = 'none';
}

async function handleConfirmShoppingBooking(e) {
  if (e) e.preventDefault();
  ensureShoppingListInitialized();

  const amtInput = document.getElementById('shopping-book-amount');
  const accSel = document.getElementById('shopping-book-account');
  const dateInput = document.getElementById('shopping-book-date');
  const catSel = document.getElementById('shopping-book-category');
  const subSel = document.getElementById('shopping-book-subcategory');
  const noteInput = document.getElementById('shopping-book-note');
  const clearDoneChk = document.getElementById('shopping-book-clear-done');

  const amount = parseFloat(amtInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert('Bitte gib einen gültigen Kassenbetrag größer als 0 € ein.');
    return;
  }

  const accountId = accSel ? accSel.value : 'bank';
  const txDate = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
  const category = catSel ? catSel.value : 'Lebensmittel, Supermarkt & Discounter';
  const subcategory = subSel ? subSel.value : 'Supermarkt';
  const note = noteInput ? noteInput.value.trim() : 'Einkauf';

  const newTx = {
    id: 'tx_' + Date.now(),
    type: 'expense',
    account: accountId,
    amount: amount,
    category: category,
    subcategory: subcategory,
    description: note,
    isPlanned: false,
    date: txDate
  };

  appState.transactions.push(newTx);

  // If checkbox is checked, remove booked items
  if (clearDoneChk && clearDoneChk.checked) {
    const doneItems = appState.shoppingList.filter(i => i.checked);
    if (doneItems.length > 0) {
      appState.shoppingList = appState.shoppingList.filter(i => !i.checked);
    } else {
      // If none were checked, all were booked, so clear entire list
      appState.shoppingList = [];
    }
  }

  await saveStateToEncryptedStorage();
  closeShoppingBookModal();
  renderShoppingList();
  updateOverview();

  const accName = getAccountName(accountId);
  announceNVDA(`Einkauf über ${formatCurrency(amount)} auf Konto ${accName} erfolgreich abgebucht!`);
  alert(`✅ Der Einkauf über ${formatCurrency(amount)} (${subcategory}) wurde erfolgreich im Haushaltsbuch abgebucht!`);
}

// Backwards compatibility aliases
function renderShoppingCart() {
  renderShoppingList();
}
function runPurchaseSimulation() {
  // Deprecated simulator no-op
}
function saveSimulatedPurchase() {
  // Deprecated simulator no-op
}
function clearShoppingCart() {
  clearEntireShoppingList();
}
function handleAddShoppingItem(e) {
  addShoppingItemFromForm(e);
}
function bookShoppingCartAsExpense() {
  openShoppingBookModal();
}

// ----------------------------------------------------------------------------
// G. DRUCKBARER MONATSBERICHT & BEHÖRDEN-NACHWEIS (PDF-EXPORT)
// ----------------------------------------------------------------------------
let currentReportMode = 'standard';

function openPrintReportModal(year, month, mode) {
  if (mode) currentReportMode = mode;
  const targetYear = year !== undefined && year !== null ? year : selectedYear;
  const targetMonth = month !== undefined && month !== null ? month : selectedMonth;

  const modal = document.getElementById('print-report-modal');
  if (modal) modal.style.display = 'flex';

  renderPrintReportContent(targetYear, targetMonth);
  announceNVDA('Druckbarer Monatsbericht geöffnet.');
}

function closePrintReportModal() {
  const modal = document.getElementById('print-report-modal');
  if (modal) modal.style.display = 'none';
}

function switchPrintReportMode(mode) {
  currentReportMode = mode;
  const btnStd = document.getElementById('btn-report-mode-standard');
  const btnTax = document.getElementById('btn-report-mode-tax');
  if (btnStd) btnStd.style.fontWeight = mode === 'standard' ? 'bold' : 'normal';
  if (btnTax) btnTax.style.fontWeight = mode === 'tax_official' ? 'bold' : 'normal';
  renderPrintReportContent(selectedYear, selectedMonth);
}

function triggerPrintReport() {
  window.print();
}

function renderPrintReportContent(year, month) {
  const container = document.getElementById('print-report-content');
  if (!container) return;

  const monthName = MONTH_NAMES[month] || "Monat";
  const stats = calculateMonthStats(year, month);
  const balances = stats.balances;
  const todayGerman = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let html = `
    <div style="border-bottom: 3px solid #333; padding-bottom: 12px; margin-bottom: 16px;">
      <h1 style="margin: 0 0 4px 0; font-size: 24px;">HAUSHALTSBUCH - ${currentReportMode === 'tax_official' ? 'BEHÖRDEN- & STEUER-FINANZBERICHT' : 'MONATLICHER FINANZBERICHT'}</h1>
      <div style="display: flex; justify-content: space-between; font-size: 14px; color: #555;">
        <span><strong>Abrechnungszeitraum:</strong> ${monthName} ${year}</span>
        <span><strong>Erstellt am:</strong> ${todayGerman}</span>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
      <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; border: 1px solid #ddd;">
        <div style="font-size: 13px; color: #666;">GESAMTEINNAHMEN</div>
        <div style="font-size: 20px; font-weight: bold; color: #2E7D32;">+ ${formatCurrency(stats.totalIncome)}</div>
      </div>
      <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; border: 1px solid #ddd;">
        <div style="font-size: 13px; color: #666;">GESAMTAUSGABEN</div>
        <div style="font-size: 20px; font-weight: bold; color: #C62828;">- ${formatCurrency(stats.totalExpense)}</div>
      </div>
      <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; border: 1px solid #ddd;">
        <div style="font-size: 13px; color: #666;">MONATS-ERGEBNIS</div>
        <div style="font-size: 20px; font-weight: bold; color: ${stats.leftover >= 0 ? '#2E7D32' : '#C62828'};">
          ${stats.leftover >= 0 ? '+' : ''} ${formatCurrency(stats.leftover)}
        </div>
      </div>
    </div>

    <h2 style="font-size: 17px; border-bottom: 2px solid #ddd; padding-bottom: 4px; margin-top: 20px;">1. Kontostände zum Monatsende</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: #eee;">
          <th style="padding: 6px 10px; text-align: left; border: 1px solid #ddd;">Konto / Vermögenswert</th>
          <th style="padding: 6px 10px; text-align: left; border: 1px solid #ddd;">Art</th>
          <th style="padding: 6px 10px; text-align: right; border: 1px solid #ddd;">Saldo</th>
        </tr>
      </thead>
      <tbody>
        ${appState.accounts.map(acc => `
          <tr>
            <td style="padding: 6px 10px; border: 1px solid #ddd; font-weight: bold;">${escapeHTML(acc.name)}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd;">${escapeHTML(ACCOUNT_TYPE_NAMES[acc.type] || acc.type)}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatCurrency(balances[acc.id] || 0)}</td>
          </tr>
        `).join('')}
        <tr style="background: #fafafa; font-weight: bold;">
          <td colspan="2" style="padding: 8px 10px; border: 1px solid #ddd;">VERFÜGBARES GESAMTVERMÖGEN:</td>
          <td style="padding: 8px 10px; border: 1px solid #ddd; text-align: right; font-size: 16px;">${formatCurrency(balances.total)}</td>
        </tr>
      </tbody>
    </table>

    <h2 style="font-size: 17px; border-bottom: 2px solid #ddd; padding-bottom: 4px; margin-top: 20px;">2. Einzelaufstellung aller Einnahmen &amp; Ausgaben</h2>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: #eee;">
          <th style="padding: 6px 10px; text-align: left; border: 1px solid #ddd;">Datum</th>
          <th style="padding: 6px 10px; text-align: left; border: 1px solid #ddd;">Kategorie &amp; Geschäft</th>
          <th style="padding: 6px 10px; text-align: left; border: 1px solid #ddd;">Verwendungszweck / Notiz</th>
          <th style="padding: 6px 10px; text-align: right; border: 1px solid #ddd;">Betrag</th>
        </tr>
      </thead>
      <tbody>
        ${[...stats.incomeList, ...stats.expenseList].sort((a, b) => a.date.localeCompare(b.date)).map(tx => `
          <tr>
            <td style="padding: 6px 10px; border: 1px solid #ddd;">${formatDateGerman(tx.date)}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd;">${escapeHTML(tx.category)}${tx.subcategory ? ` (${escapeHTML(tx.subcategory)})` : ''}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd;">${escapeHTML(tx.description || '-')}</td>
            <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: ${tx.type === 'income' ? '#2E7D32' : '#C62828'};">
              ${tx.type === 'income' ? '+' : '-'} ${formatCurrency(tx.amount)}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 8px; text-align: center;">
      Dieses Dokument wurde lokal und datenschutzkonform aus dem Barrierefreien Haushaltsbuch generiert.
    </div>
  `;

  container.innerHTML = html;
}


function renderAccountsViewList() {
  ensureAccountsInitialized();
  const container = document.getElementById('tab-accounts-list');
  if (!container) return;

  const show = isSymbolsEnabled();
  const todayStr = new Date().toISOString().split('T')[0];
  const currentBalances = calculateBalancesUpToDate(todayStr);

  container.innerHTML = appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    const typeLabel = ACCOUNT_TYPE_NAMES[acc.type] || acc.type;
    const curBal = currentBalances[acc.id] !== undefined ? currentBalances[acc.id] : (acc.initialBalance || 0);
    const curBalStr = formatCurrency(curBal);
    const initBalStr = formatCurrency(acc.initialBalance || 0);

    const iconHtml = show ? `<span class="emoji-icon" aria-hidden="true" style="font-size: 26px;">${icon}</span>` : '';
    const editBtnText = show ? '✏️ Bearbeiten' : 'Bearbeiten';
    const delBtnText = show ? '🗑️ Löschen' : 'Löschen';
    const isCash = (acc.type === 'cash' || acc.id === 'cash');

    let backupBadge = '';
    if (acc.hasBackupAccount && acc.backupAccountId) {
      const backupAcc = appState.accounts.find(a => a.id === acc.backupAccountId);
      const backupName = backupAcc ? backupAcc.name : acc.backupAccountId;
      backupBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(0, 112, 186, 0.1); color: #0070BA; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px;">🛡️ Auto-Deckung: ${escapeHTML(backupName)}</span>`;
    }

    let dispoBadge = '';
    if (acc.dispoLimit && Number(acc.dispoLimit) > 0) {
      dispoBadge = `<span style="display: inline-flex; align-items: center; gap: 4px; background: rgba(156, 39, 176, 0.1); color: #9C27B0; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 6px;">💳 Dispo: ${formatCurrency(acc.dispoLimit)}</span>`;
    }

    const hasBankDetails = !!(acc.bankName || acc.owner || acc.iban || acc.bic || acc.accountNumber || acc.notes);
    let bankDetailsHtml = '';
    if (hasBankDetails) {
      bankDetailsHtml = `
        <details style="margin-top: 10px; width: 100%; font-size: 13px; color: var(--text-secondary);">
          <summary style="cursor: pointer; font-weight: 600; color: #1976D2; padding: 2px 0;">ℹ️ Bankverbindung &amp; Details anzeigen</summary>
          <div style="background: rgba(0,0,0,0.02); border: 1px solid var(--border-color, #e0e0e0); border-radius: 6px; padding: 10px 14px; margin-top: 6px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
            ${acc.bankName ? `<div><strong>Bank:</strong> ${escapeHTML(acc.bankName)}</div>` : ''}
            ${acc.owner ? `<div><strong>Inhaber:</strong> ${escapeHTML(acc.owner)}</div>` : ''}
            ${acc.iban ? `<div><strong>IBAN:</strong> <span style="font-family: monospace; font-size: 14px;">${escapeHTML(acc.iban)}</span></div>` : ''}
            ${acc.bic ? `<div><strong>BIC:</strong> <span style="font-family: monospace;">${escapeHTML(acc.bic)}</span></div>` : ''}
            ${acc.accountNumber ? `<div><strong>Konto/Kdnr:</strong> ${escapeHTML(acc.accountNumber)}</div>` : ''}
            ${acc.notes ? `<div style="grid-column: 1 / -1;"><strong>Notizen:</strong> ${escapeHTML(acc.notes)}</div>` : ''}
          </div>
        </details>
      `;
    }

    return `
      <div class="settings-account-item" style="display: flex; flex-direction: column; background: var(--card-bg, #ffffff); border: 2px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 14px 18px; gap: 10px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 220px;">
            ${iconHtml}
            <div>
              <div style="font-size: 18px; font-weight: bold; color: var(--text-primary);">${escapeHTML(acc.name)}</div>
              <div style="font-size: 14px; color: var(--text-secondary); margin-top: 2px;">
                ${escapeHTML(typeLabel)} | Kontostand aktuell: <strong style="color: ${curBal >= 0 ? '#2E7D32' : '#C62828'}; font-size: 15px;">${curBalStr}</strong> <span style="font-size: 12px; color: var(--text-muted, #777);">(Start: ${initBalStr})</span>
              </div>
              <div style="margin-top: 4px;">
                ${backupBadge}${dispoBadge}
              </div>
              ${acc.hint ? `<div style="font-size: 13px; color: var(--text-muted, #777); margin-top: 3px;">${escapeHTML(acc.hint)}</div>` : ''}
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="btn btn-secondary" onclick="openAccountModal('${acc.id}')" title="Konto bearbeiten" aria-label="Konto ${escapeHTML(acc.name)} bearbeiten" style="padding: 8px 14px;">
              ${editBtnText}
            </button>
            <button type="button" class="btn btn-secondary" onclick="deleteAccount('${acc.id}')" title="Konto löschen" aria-label="Konto ${escapeHTML(acc.name)} löschen" style="padding: 8px 14px; color: #f44336; border-color: rgba(244, 67, 54, 0.4);">
              ${delBtnText}
            </button>
          </div>
        </div>
        ${bankDetailsHtml}
      </div>
    `;
  }).join('');
}

function onNewAccTypeTabChange() {
  const type = document.getElementById('new-acc-type').value;
  const hintInput = document.getElementById('new-acc-hint');
  if (hintInput && !hintInput.value) {
    hintInput.placeholder = getAccountTypeDefaultHint(type);
  }
}

async function handleAddNewAccountFromTab(e) {
  e.preventDefault();
  ensureAccountsInitialized();

  const nameInput = document.getElementById('new-acc-name');
  const typeInput = document.getElementById('new-acc-type');
  const balInput = document.getElementById('new-acc-balance');
  const hintInput = document.getElementById('new-acc-hint');

  const name = nameInput.value.trim();
  const type = typeInput.value;
  const balance = parseFloat(balInput.value) || 0;
  const hint = hintInput.value.trim();
  const icon = ACCOUNT_TYPE_ICONS[type] || '💳';

  if (!name) {
    alert('Bitte gib einen Namen für das neue Konto ein.');
    return;
  }

  const newId = 'acc_' + Date.now();
  appState.accounts.push({
    id: newId,
    name: name,
    type: type,
    icon: icon,
    hint: hint,
    initialBalance: balance
  });

  if (!appState.initialBalances) appState.initialBalances = {};
  appState.accounts.forEach(a => {
    appState.initialBalances[a.id] = a.initialBalance || 0;
  });

  await saveStateToEncryptedStorage();

  nameInput.value = '';
  balInput.value = '0.00';
  hintInput.value = '';

  populateAllAccountDropdowns();
  populateBudgetCategoryDropdown();
  populateShoppingDropdowns();
  renderShoppingCart();
  renderAccountsViewList();
  updateOverview();
  announceNVDA(`Neues Konto ${name} erfolgreich hinzugefügt!`);
  alert(`✅ Das Konto "${name}" wurde erfolgreich angelegt und steht sofort in der gesamten App bereit!`);
}

// ============================================================================
// 1d. DYNAMISCHES KONTEN-SYSTEM & KONTO-OPTIONEN
// ============================================================================
const ACCOUNT_TYPE_ICONS = {
  bank: '🏦',
  credit: '💳',
  paypal: '🅿',
  savings: '📈',
  cash: '💵',
  depot: '📊',
  crypto: '🪙',
  loan: '🏛️',
  other: '📦'
};

const ACCOUNT_TYPE_NAMES = {
  bank: 'Bankkonto / Girokonto',
  credit: 'Kreditkarte / Debitkarte',
  paypal: 'PayPal & Online-Zahlungsdienst',
  savings: 'Tagesgeld, Festgeld & Sparkonto',
  cash: 'Bargeld & Portemonnaie',
  depot: 'Depot, Wertpapiere & ETFs',
  crypto: 'Krypto & Web3 Wallet',
  loan: 'Bausparvertrag, Kredit & Darlehen',
  other: 'Sonstiges Konto / Guthabenkarte'
};

const DEFAULT_ACCOUNTS = [
  { id: 'bank', name: 'Bankkonto / Girokonto', type: 'bank', icon: '🏦', hint: 'Miete, EC-Karte, Gehalt, Daueraufträge', initialBalance: 0 },
  { id: 'paypal', name: 'PayPal Guthaben', type: 'paypal', icon: '🅿', hint: 'Online-Shopping, Freunde, Abos', initialBalance: 0, hasBackupAccount: true, backupAccountId: 'bank' },
  { id: 'savings', name: 'Tagesgeldkonto', type: 'savings', icon: '📈', hint: 'Notgroschen, Rücklagen, Urlaub', initialBalance: 0 },
  { id: 'cash', name: 'Bargeld', type: 'cash', icon: '💵', hint: 'Bäcker, Barbezahlung, Portemonnaie', initialBalance: 0 }
];

function ensureAccountsInitialized() {
  if (!appState.accounts || !Array.isArray(appState.accounts) || appState.accounts.length === 0) {
    appState.accounts = JSON.parse(JSON.stringify(DEFAULT_ACCOUNTS));
    if (appState.initialBalances) {
      appState.accounts.forEach(acc => {
        if (appState.initialBalances[acc.id] !== undefined) {
          acc.initialBalance = Number(appState.initialBalances[acc.id] || 0);
        }
      });
    }
  }
}

function getAccountTypeDefaultHint(type) {
  const hints = {
    bank: 'Girokonto, Gehaltskonto, Daueraufträge',
    credit: 'Kreditkarte, Online-Käufe, Reisekarte',
    paypal: 'Online-Shopping, PayPal-Zahlungen, Freunde',
    savings: 'Notgroschen, Festgeld, Sparkonto',
    cash: 'Bargeld, Portemonnaie, Haushaltskasse',
    depot: 'Aktien, ETFs, Fonds, Wertpapiere',
    crypto: 'Bitcoin, Ethereum, Hardware Wallet',
    loan: 'Darlehen, Bausparvertrag, Ratenkredit',
    other: 'Gutscheinkarte, Essensmarken, Sonstiges'
  };
  return hints[type] || 'Finanzkonto';
}

function formatAccountName(accKey) {
  if (!accKey) return 'Konto';
  ensureAccountsInitialized();
  const found = appState.accounts.find(a => a.id === accKey);
  if (found) return found.name;
  return ACCOUNT_TYPE_NAMES[accKey] || accKey;
}

function getAccountIcon(accKey) {
  ensureAccountsInitialized();
  const found = appState.accounts.find(a => a.id === accKey);
  if (found && found.icon) return found.icon;
  return ACCOUNT_TYPE_ICONS[accKey] || '💳';
}

function populateAllAccountDropdowns() {
  ensureAccountsInitialized();
  
  const dropdownIds = [
    'exp-account',
    'inc-account',
    'trf-from',
    'trf-to',
    'edit-tx-account',
    'edit-tx-from',
    'edit-tx-to',
    'edit-rec-account',
    'edit-rec-from',
    'edit-rec-to'
  ];

  dropdownIds.forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const currentVal = sel.value;

    sel.innerHTML = appState.accounts.map(acc => {
      const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
      return `<option value="${escapeHTML(acc.id)}" data-emoji="${icon}">${escapeHTML(acc.name)}</option>`;
    }).join('');

    if (currentVal && appState.accounts.some(a => a.id === currentVal)) {
      sel.value = currentVal;
    } else if (id === 'trf-to' && appState.accounts.length > 1) {
      sel.value = appState.accounts[1].id;
    } else if (appState.accounts.length > 0) {
      sel.value = appState.accounts[0].id;
    }

    applySymbolsToOptions(sel);
  });

  const expSplitToggle = document.getElementById('exp-split-toggle');
  if (expSplitToggle && expSplitToggle.checked && typeof renderExpenseSplitRows === 'function') {
    renderExpenseSplitRows();
  }
  const incSplitToggle = document.getElementById('inc-split-toggle');
  if (incSplitToggle && incSplitToggle.checked && typeof renderIncomeSplitRows === 'function') {
    renderIncomeSplitRows();
  }
}

function renderSettingsAccountsList() {
  ensureAccountsInitialized();
  const container = document.getElementById('settings-accounts-list');
  if (!container) return;

  const show = isSymbolsEnabled();

  container.innerHTML = appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    const typeLabel = ACCOUNT_TYPE_NAMES[acc.type] || acc.type;
    const balanceStr = formatCurrency(acc.initialBalance || 0);

    const iconHtml = show ? `<span class="emoji-icon" aria-hidden="true" style="font-size: 24px;">${icon}</span>` : '';
    const editBtnText = show ? '✏️ Bearbeiten' : 'Bearbeiten';
    const delBtnText = show ? '🗑️ Löschen' : 'Löschen';

    return `
      <div class="settings-account-item" style="display: flex; align-items: center; justify-content: space-between; background: var(--card-bg, #ffffff); border: 2px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 12px 16px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px;">
          ${iconHtml}
          <div>
            <div style="font-size: 17px; font-weight: bold; color: var(--text-primary);">${escapeHTML(acc.name)}</div>
            <div style="font-size: 14px; color: var(--text-secondary);">${escapeHTML(typeLabel)} | Startguthaben: <strong>${balanceStr}</strong></div>
            ${acc.hint ? `<div style="font-size: 13px; color: var(--text-muted, #777);">${escapeHTML(acc.hint)}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="openAccountModal('${acc.id}')" title="Konto bearbeiten" aria-label="Konto ${escapeHTML(acc.name)} bearbeiten" style="padding: 6px 12px;">
            ${editBtnText}
          </button>
          <button type="button" class="btn btn-secondary" onclick="deleteAccount('${acc.id}')" title="Konto löschen" aria-label="Konto ${escapeHTML(acc.name)} löschen" style="padding: 6px 12px; color: #f44336;">
            ${delBtnText}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function formatIbanInput(input) {
  if (!input) return;
  let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (val.length > 34) val = val.substring(0, 34);
  const parts = [];
  for (let i = 0; i < val.length; i += 4) {
    parts.push(val.substring(i, i + 4));
  }
  input.value = parts.join(' ');
}

function toggleAccountBackupSection() {
  const toggle = document.getElementById('account-modal-backup-toggle');
  const section = document.getElementById('account-modal-backup-section');
  if (section && toggle) {
    section.style.display = toggle.checked ? 'block' : 'none';
  }
}

function toggleAccountDetailsSection() {
  const toggle = document.getElementById('account-modal-details-toggle');
  const section = document.getElementById('account-modal-details-section');
  if (section && toggle) {
    section.style.display = toggle.checked ? 'block' : 'none';
  }
}

function syncInitialBalanceToCurrent() {
  const idInput = document.getElementById('account-modal-id');
  const balInput = document.getElementById('account-modal-balance');
  if (!idInput || !idInput.value || !balInput) return;
  const accId = idInput.value;
  const todayStr = new Date().toISOString().split('T')[0];
  const balances = calculateBalancesUpToDate(todayStr);
  const curBal = balances[accId] !== undefined ? balances[accId] : 0;
  balInput.value = curBal.toFixed(2);
  announceNVDA(`Startguthaben auf aktuellen Saldo von ${formatCurrency(curBal)} gesetzt.`);
}

function populateAccountBackupDropdown(excludeAccId, selectedVal) {
  const sel = document.getElementById('account-modal-backup-account');
  if (!sel) return;
  sel.innerHTML = '';
  const otherAccs = (appState.accounts || []).filter(a => a.id !== excludeAccId);
  otherAccs.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.id;
    opt.textContent = `${acc.name} (${ACCOUNT_TYPE_NAMES[acc.type] || acc.type})`;
    if (selectedVal && selectedVal === acc.id) {
      opt.selected = true;
    } else if (!selectedVal && acc.type === 'bank') {
      opt.selected = true;
    }
    sel.appendChild(opt);
  });
}

function openAccountModal(accId) {
  ensureAccountsInitialized();
  const modal = document.getElementById('account-modal');
  const heading = document.getElementById('account-modal-heading');
  const idInput = document.getElementById('account-modal-id');
  const nameInput = document.getElementById('account-modal-name');
  const typeInput = document.getElementById('account-modal-type');
  const balInput = document.getElementById('account-modal-balance');
  const hintInput = document.getElementById('account-modal-hint');
  const curBalBox = document.getElementById('account-modal-current-balance-box');
  const curBalVal = document.getElementById('account-modal-current-balance-val');

  const backupToggle = document.getElementById('account-modal-backup-toggle');
  const detailsToggle = document.getElementById('account-modal-details-toggle');
  const bankInput = document.getElementById('account-modal-bank');
  const ownerInput = document.getElementById('account-modal-owner');
  const ibanInput = document.getElementById('account-modal-iban');
  const bicInput = document.getElementById('account-modal-bic');
  const numberInput = document.getElementById('account-modal-number');
  const dispoInput = document.getElementById('account-modal-dispo');
  const notesInput = document.getElementById('account-modal-notes');

  populateAccountBackupDropdown(accId || '', '');

  if (accId) {
    const acc = appState.accounts.find(a => a.id === accId);
    if (!acc) return;
    heading.textContent = 'Konto bearbeiten';
    idInput.value = acc.id;
    nameInput.value = acc.name;
    typeInput.value = acc.type || 'bank';
    balInput.value = (acc.initialBalance !== undefined) ? acc.initialBalance : 0;
    hintInput.value = acc.hint || '';

    // Aktuellen berechneten Saldo anzeigen
    if (curBalBox && curBalVal) {
      curBalBox.style.display = 'block';
      const todayStr = new Date().toISOString().split('T')[0];
      const balances = calculateBalancesUpToDate(todayStr);
      const curBal = balances[acc.id] !== undefined ? balances[acc.id] : (acc.initialBalance || 0);
      curBalVal.textContent = formatCurrency(curBal);
    }

    // Auto-Deckung
    const hasBackup = !!acc.hasBackupAccount;
    if (backupToggle) backupToggle.checked = hasBackup;
    populateAccountBackupDropdown(acc.id, acc.backupAccountId || '');
    toggleAccountBackupSection();

    // Bankdetails
    const hasDetails = !!(acc.bankName || acc.owner || acc.iban || acc.bic || acc.accountNumber || acc.dispoLimit || acc.notes);
    if (detailsToggle) detailsToggle.checked = hasDetails;
    if (bankInput) bankInput.value = acc.bankName || '';
    if (ownerInput) ownerInput.value = acc.owner || '';
    if (ibanInput) ibanInput.value = acc.iban || '';
    if (bicInput) bicInput.value = acc.bic || '';
    if (numberInput) numberInput.value = acc.accountNumber || '';
    if (dispoInput) dispoInput.value = (acc.dispoLimit !== undefined && acc.dispoLimit !== null && acc.dispoLimit !== '') ? acc.dispoLimit : '';
    if (notesInput) notesInput.value = acc.notes || '';
    toggleAccountDetailsSection();
  } else {
    heading.textContent = 'Neues Konto hinzufügen';
    idInput.value = '';
    nameInput.value = '';
    typeInput.value = 'bank';
    balInput.value = '0.00';
    hintInput.value = '';
    if (curBalBox) curBalBox.style.display = 'none';

    if (backupToggle) backupToggle.checked = false;
    toggleAccountBackupSection();

    if (detailsToggle) detailsToggle.checked = false;
    if (bankInput) bankInput.value = '';
    if (ownerInput) ownerInput.value = '';
    if (ibanInput) ibanInput.value = '';
    if (bicInput) bicInput.value = '';
    if (numberInput) numberInput.value = '';
    if (dispoInput) dispoInput.value = '';
    if (notesInput) notesInput.value = '';
    toggleAccountDetailsSection();
  }

  if (modal) modal.style.display = 'flex';
  if (nameInput) nameInput.focus();
  announceNVDA(accId ? 'Konto bearbeiten geöffnet.' : 'Neues Konto hinzufügen geöffnet.');
}

function closeAccountModal() {
  const modal = document.getElementById('account-modal');
  if (modal) modal.style.display = 'none';
}

function onAccountTypeSelectChange() {
  const type = document.getElementById('account-modal-type').value;
  const hintInput = document.getElementById('account-modal-hint');
  if (hintInput && !hintInput.value) {
    hintInput.placeholder = getAccountTypeDefaultHint(type);
  }
}

async function saveAccount(e) {
  e.preventDefault();
  ensureAccountsInitialized();

  const id = document.getElementById('account-modal-id').value;
  const name = document.getElementById('account-modal-name').value.trim();
  const type = document.getElementById('account-modal-type').value;
  const balance = parseFloat(document.getElementById('account-modal-balance').value) || 0;
  const hint = document.getElementById('account-modal-hint').value.trim();
  const icon = ACCOUNT_TYPE_ICONS[type] || '💳';

  const backupToggle = document.getElementById('account-modal-backup-toggle');
  const backupAccountSelect = document.getElementById('account-modal-backup-account');
  const hasBackup = backupToggle ? backupToggle.checked : false;
  const backupAccountId = (hasBackup && backupAccountSelect) ? backupAccountSelect.value : '';

  const detailsToggle = document.getElementById('account-modal-details-toggle');
  const hasDetails = detailsToggle ? detailsToggle.checked : false;
  const bankName = hasDetails ? (document.getElementById('account-modal-bank')?.value.trim() || '') : '';
  const owner = hasDetails ? (document.getElementById('account-modal-owner')?.value.trim() || '') : '';
  const iban = hasDetails ? (document.getElementById('account-modal-iban')?.value.trim() || '') : '';
  const bic = hasDetails ? (document.getElementById('account-modal-bic')?.value.trim() || '') : '';
  const accountNumber = hasDetails ? (document.getElementById('account-modal-number')?.value.trim() || '') : '';
  const dispoLimit = hasDetails ? (parseFloat(document.getElementById('account-modal-dispo')?.value) || 0) : 0;
  const notes = hasDetails ? (document.getElementById('account-modal-notes')?.value.trim() || '') : '';

  if (!name) {
    alert('Bitte gib einen Namen für das Konto ein.');
    return;
  }

  if (id) {
    // Edit existing
    const acc = appState.accounts.find(a => a.id === id);
    if (acc) {
      acc.name = name;
      acc.type = type;
      acc.icon = icon;
      acc.hint = hint;
      acc.initialBalance = balance;
      acc.hasBackupAccount = hasBackup;
      acc.backupAccountId = backupAccountId;
      acc.bankName = bankName;
      acc.owner = owner;
      acc.iban = iban;
      acc.bic = bic;
      acc.accountNumber = accountNumber;
      acc.dispoLimit = dispoLimit;
      acc.notes = notes;
    }
  } else {
    // Add new
    const newId = 'acc_' + Date.now();
    appState.accounts.push({
      id: newId,
      name: name,
      type: type,
      icon: icon,
      hint: hint,
      initialBalance: balance,
      hasBackupAccount: hasBackup,
      backupAccountId: backupAccountId,
      bankName: bankName,
      owner: owner,
      iban: iban,
      bic: bic,
      accountNumber: accountNumber,
      dispoLimit: dispoLimit,
      notes: notes
    });
  }

  // Synchronize initialBalances map
  if (!appState.initialBalances) appState.initialBalances = {};
  appState.accounts.forEach(a => {
    appState.initialBalances[a.id] = a.initialBalance || 0;
  });

  await saveStateToEncryptedStorage();
  closeAccountModal();
  populateAllAccountDropdowns();
  populateBudgetCategoryDropdown();
  populateShoppingDropdowns();
  renderShoppingCart();
  renderAccountsViewList();
  updateOverview();
  announceNVDA(`Konto ${name} erfolgreich gespeichert!`);
}

async function deleteAccount(accId) {
  ensureAccountsInitialized();
  if (appState.accounts.length <= 1) {
    alert('Du benötigst mindestens ein Konto in deiner App.');
    return;
  }

  const acc = appState.accounts.find(a => a.id === accId);
  if (!acc) return;

  const txCount = appState.transactions.filter(t => t.account === accId || t.fromAccount === accId || t.toAccount === accId).length;
  const recCount = appState.recurring.filter(r => r.account === accId || r.fromAccount === accId || r.toAccount === accId).length;

  let confirmMsg = `Möchtest du das Konto "${acc.name}" wirklich löschen?`;
  if (txCount > 0 || recCount > 0) {
    confirmMsg += `\n\nHinweis: Es sind ${txCount} Buchungen und ${recCount} Daueraufträge mit diesem Konto verknüpft.`;
  }

  if (!confirm(confirmMsg)) return;

  const idx = appState.accounts.findIndex(a => a.id === accId);
  if (idx !== -1) {
    appState.accounts.splice(idx, 1);
    // Verknüpfungen bereinigen, falls ein anderes Konto dieses Konto als Deckungskonto hatte
    appState.accounts.forEach(a => {
      if (a.backupAccountId === accId) {
        a.backupAccountId = '';
        a.hasBackupAccount = false;
      }
    });
    if (appState.initialBalances && appState.initialBalances[accId] !== undefined) {
      delete appState.initialBalances[accId];
    }
    await saveStateToEncryptedStorage();
    populateAllAccountDropdowns();
    populateBudgetCategoryDropdown();
    populateShoppingDropdowns();
    renderShoppingCart();
    renderAccountsViewList();
    updateOverview();
    announceNVDA(`Konto ${acc.name} gelöscht.`);
  }
}

// ============================================================================
// BARGELD-ZÄHLHELFER (MÜNZ- & SCHEINEZÄHLER)
// ============================================================================
let currentCashCounterTarget = null;

const CASH_DENOMINATIONS = [
  { id: 'note-200', val: 200.0 },
  { id: 'note-100', val: 100.0 },
  { id: 'note-50',  val: 50.0 },
  { id: 'note-20',  val: 20.0 },
  { id: 'note-10',  val: 10.0 },
  { id: 'note-5',   val: 5.0 },
  { id: 'coin-200', val: 2.0 },
  { id: 'coin-100', val: 1.0 },
  { id: 'coin-50',  val: 0.50 },
  { id: 'coin-20',  val: 0.20 },
  { id: 'coin-10',  val: 0.10 },
  { id: 'coin-5',   val: 0.05 },
  { id: 'coin-2',   val: 0.02 },
  { id: 'coin-1',   val: 0.01 }
];

function openCashCounterModal(target) {
  currentCashCounterTarget = target || 'from-modal';
  const modal = document.getElementById('cash-counter-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  resetCashCounter();
  calculateCashTotalLive();

  const firstInput = document.getElementById('cash-count-note-50');
  if (firstInput) firstInput.focus();
  announceNVDA('Bargeld-Zählhelfer geöffnet. Zähle Münzen und Scheine.');
}

function closeCashCounterModal() {
  const modal = document.getElementById('cash-counter-modal');
  if (modal) modal.style.display = 'none';
  if (currentCashCounterTarget === 'from-modal') {
    const balInput = document.getElementById('account-modal-balance');
    if (balInput) balInput.focus();
  } else if (currentCashCounterTarget === 'income') {
    const incInput = document.getElementById('inc-amount');
    if (incInput) incInput.focus();
  } else if (currentCashCounterTarget === 'expense') {
    const expInput = document.getElementById('exp-amount');
    if (expInput) expInput.focus();
  }
}

function adjustCashCount(denomId, delta) {
  const input = document.getElementById(`cash-count-${denomId}`);
  if (!input) return;
  let cur = parseInt(input.value, 10) || 0;
  cur = Math.max(0, cur + delta);
  input.value = cur;
  calculateCashTotalLive();
}

function calculateCashTotalLive() {
  let total = 0;
  CASH_DENOMINATIONS.forEach(d => {
    const input = document.getElementById(`cash-count-${d.id}`);
    const subEl = document.getElementById(`cash-subtotal-${d.id}`);
    const count = input ? (parseInt(input.value, 10) || 0) : 0;
    const sub = Math.round(count * d.val * 100) / 100;
    total += sub;
    if (subEl) subEl.textContent = formatCurrency(sub);
  });
  total = Math.round(total * 100) / 100;
  const totalEl = document.getElementById('cash-counter-total');
  if (totalEl) totalEl.textContent = formatCurrency(total);
  return total;
}

function resetCashCounter() {
  CASH_DENOMINATIONS.forEach(d => {
    const input = document.getElementById(`cash-count-${d.id}`);
    const subEl = document.getElementById(`cash-subtotal-${d.id}`);
    if (input) input.value = '0';
    if (subEl) subEl.textContent = formatCurrency(0);
  });
  const totalEl = document.getElementById('cash-counter-total');
  if (totalEl) totalEl.textContent = formatCurrency(0);
}

async function applyCashCounterTotal() {
  const total = calculateCashTotalLive();
  if (currentCashCounterTarget === 'from-modal') {
    const balInput = document.getElementById('account-modal-balance');
    if (balInput) {
      balInput.value = total.toFixed(2);
    }
    closeCashCounterModal();
    announceNVDA(`Gezähltes Bargeld von ${formatCurrency(total)} als Startguthaben übernommen.`);
  } else if (currentCashCounterTarget === 'income') {
    const incInput = document.getElementById('inc-amount');
    if (incInput) {
      incInput.value = total.toFixed(2);
      if (typeof handleMainIncomeAmountInput === 'function') handleMainIncomeAmountInput();
    }
    const incAccountSelect = document.getElementById('inc-account');
    if (incAccountSelect) {
      const hasCash = Array.from(incAccountSelect.options).some(o => o.value === 'cash');
      if (hasCash) incAccountSelect.value = 'cash';
    }
    closeCashCounterModal();
    announceNVDA(`Gezähltes Bargeld von ${formatCurrency(total)} als Einnahme-Betrag übernommen.`);
  } else if (currentCashCounterTarget === 'expense') {
    const expInput = document.getElementById('exp-amount');
    if (expInput) {
      expInput.value = total.toFixed(2);
      if (typeof handleMainExpenseAmountInput === 'function') handleMainExpenseAmountInput();
    }
    const expAccountSelect = document.getElementById('exp-account');
    if (expAccountSelect) {
      const hasCash = Array.from(expAccountSelect.options).some(o => o.value === 'cash');
      if (hasCash) expAccountSelect.value = 'cash';
    }
    closeCashCounterModal();
    announceNVDA(`Gezähltes Bargeld von ${formatCurrency(total)} als Ausgabe-Betrag übernommen.`);
  } else {
    // Ziel ist eine Konto-ID (z. B. 'cash')
    const accId = currentCashCounterTarget;
    const acc = appState.accounts.find(a => a.id === accId);
    if (!acc) {
      closeCashCounterModal();
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const curBalances = calculateBalancesUpToDate(todayStr);
    const curBal = curBalances[accId] !== undefined ? curBalances[accId] : 0;
    const oldInit = Number(acc.initialBalance || 0);
    const txDelta = curBal - oldInit;
    const newInit = Math.round((total - txDelta) * 100) / 100;

    acc.initialBalance = newInit;
    if (!appState.initialBalances) appState.initialBalances = {};
    appState.initialBalances[accId] = newInit;

    await saveStateToEncryptedStorage();
    closeCashCounterModal();
    renderAccountsViewList();
    updateOverview();
    announceNVDA(`Bargeldbestand von ${acc.name} erfolgreich auf ${formatCurrency(total)} abgeglichen!`);
  }
}

function autoUpdateFrequencyByDate(type) {
  const dateInput = document.getElementById(type + '-date');
  const freqSelect = document.getElementById(type + '-frequency');
  if (!dateInput || !freqSelect) return;

  const selectedDate = dateInput.value;
  const todayStr = new Date().toISOString().split('T')[0];
  
  if (selectedDate > todayStr) {
    if (freqSelect.value === 'once') {
      freqSelect.value = 'planned';
      if (type === 'exp') toggleExpenseFrequencyFields();
      if (type === 'inc') toggleIncomeFrequencyFields();
      if (type === 'trf') toggleTransferFrequencyFields();
      announceNVDA('Zukünftiges Datum gewählt: Automatisch als Geplant markiert.');
    }
  } else {
    if (freqSelect.value === 'planned') {
      freqSelect.value = 'once';
      if (type === 'exp') toggleExpenseFrequencyFields();
      if (type === 'inc') toggleIncomeFrequencyFields();
      if (type === 'trf') toggleTransferFrequencyFields();
      announceNVDA('Heutiges oder vergangenes Datum gewählt: Automatisch als Gebucht markiert.');
    }
  }
}

function onEditTxDateChange() {
  const dateVal = document.getElementById('edit-tx-date').value;
  const plannedSel = document.getElementById('edit-tx-planned');
  if (!dateVal || !plannedSel) return;

  const todayStr = new Date().toISOString().split('T')[0];
  if (dateVal > todayStr) {
    plannedSel.value = 'true';
    announceNVDA('Zukünftiges Datum: Status auf Geplant gesetzt.');
  } else {
    plannedSel.value = 'false';
    announceNVDA('Heutiges oder vergangenes Datum: Status auf Gebucht gesetzt.');
  }
}

/**
 * ============================================================================
 * BARRIEREFREIE FINANZ-APP & HAUSHALTSBUCH - SELF-HEALING v4.2.0
 * 100% DSGVO-konform, AES-GCM 256-Bit militärisch verschlüsselt
 * Volle Übersicht: Jede Buchung (einmalig & dauerhaft) direkt bearbeitbar/löschbar
 * Multi-Layer Selbst-Reparatur & 5-Fehlversuche 2-Stunden-Sperre
 * ============================================================================
 */

// (Globale Konstanten an den Dateianfang verschoben)

// (appState oben definiert)


// ============================================================================
// 1b. SYMBOLE & EMOJIS CONTROLLER & KATEGORIE-ICONS
// ============================================================================

// (bereits oben definiert)

/* CATEGORY_ICONS moved to top */

function isSymbolsEnabled() {
  const val = localStorage.getItem(STORAGE_SHOW_SYMBOLS_KEY);
  return val !== 'false';
}

function sym(emoji) {
  if (!isSymbolsEnabled()) return '';
  return '<span class="emoji-icon" aria-hidden="true">' + emoji + ' </span>';
}

function applySymbolsToOptions(selectEl) {
  if (!selectEl) return;
  const show = isSymbolsEnabled();
  const options = selectEl.querySelectorAll('option');
  options.forEach(opt => {
    const rawVal = opt.value;
    const cleanText = opt.dataset.cleanText || opt.textContent.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\u2600-\u27BF\u2300-\u23FF\u2B50\u2B55\u203C\u2049\u2139\u2194-\u21AA\u2934\u2935\u3030\u303D\u3297\u3299\uFE0F\uFE0E\s]+/gu, '').trim();
    opt.dataset.cleanText = cleanText;
    const icon = CATEGORY_ICONS[cleanText] || opt.dataset.emoji || '';
    if (show && icon) {
      opt.textContent = icon + ' ' + cleanText;
    } else {
      opt.textContent = cleanText;
    }
  });
}

function applySymbolsDisplay(show) {
  try { localStorage.setItem(STORAGE_SHOW_SYMBOLS_KEY, show ? 'true' : 'false'); } catch(e) {}

  document.body.classList.toggle('hide-symbols', !show);
  document.body.classList.toggle('show-symbols', show);

  const chk = document.getElementById('settings-show-symbols');
  if (chk) chk.checked = show;

  // 1. Elemente mit data-emoji verwalten
  const emojiTargets = document.querySelectorAll('[data-emoji]');
  emojiTargets.forEach(el => {
    const icon = el.getAttribute('data-emoji');
    if (!icon) return;
    
    el.querySelectorAll('.emoji-icon').forEach(s => s.remove());
    
    if (show) {
      const span = document.createElement('span');
      span.className = 'emoji-icon';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = icon + ' ';
      el.insertBefore(span, el.firstChild);
    }
  });

  // 2. Alle .emoji-icon, .tx-icon, .lock-icon, .stat-icon, .symbol-tag Elemente im DOM
  if (!show) {
    document.querySelectorAll('.emoji-icon, .tx-icon, .lock-icon, .stat-icon, .symbol-tag').forEach(el => {
      el.remove();
    });
  }

  renderAccountsViewList();
  // 3. Dropdowns aktualisieren
  const selects = document.querySelectorAll('select');
  selects.forEach(sel => applySymbolsToOptions(sel));
}

function toggleSymbolsDisplay(show) {
  applySymbolsDisplay(show);
  announceNVDA(show ? 'Symbole und Emojis werden angezeigt.' : 'Symbole und Emojis wurden ausgeschaltet. Reiner Textmodus aktiv.');
}

// ============================================================================
// 1c. ZWEISTUFIGE KATEGORIE-DATENBANK (REINE TEXT-SCHLÜSSEL)
// ============================================================================

/* CATEGORIES_DB moved to top */

function mergeCustomCategoriesIntoDB() {
  if (!appState || !appState.customCategories) {
    if (appState) appState.customCategories = { exp: {}, inc: {}, trf: {} };
    return;
  }

  if (!CATEGORIES_DB.trf) {
    CATEGORIES_DB.trf = { "Umbuchung & Sparplan": [
      "Sparplan Notgroschen",
      "Sparplan Urlaub",
      "Sparplan Investieren / Depot",
      "Sparplan Führerschein / Auto",
      "Umbuchung Allgemein"
    ] };
  }

  ['exp', 'inc', 'trf'].forEach(type => {
    if (!CATEGORIES_DB[type]) CATEGORIES_DB[type] = {};
    const customTypeObj = appState.customCategories[type] || {};
    for (const [mainCat, subList] of Object.entries(customTypeObj)) {
      if (!CATEGORIES_DB[type][mainCat]) {
        CATEGORIES_DB[type][mainCat] = [];
      }
      subList.forEach(sub => {
        if (!CATEGORIES_DB[type][mainCat].includes(sub)) {
          CATEGORIES_DB[type][mainCat].push(sub);
        }
      });
    }
  });
}

function initCustomCatSettingsForm() {
  const typeSel = document.getElementById('custom-cat-type');
  const mainSel = document.getElementById('custom-cat-main-select');
  if (!typeSel || !mainSel) return;

  const currentType = typeSel.value === 'trf' ? 'exp' : typeSel.value;
  const db = CATEGORIES_DB[currentType] || CATEGORIES_DB['exp'];
  const mainCats = Object.keys(db);

  mainSel.innerHTML = mainCats.map(cat => '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>').join('');
  applySymbolsToOptions(mainSel);
}

function onCustomCatTypeChange() {
  initCustomCatSettingsForm();
}

function onCustomCatMainModeChange() {
  const mode = document.getElementById('custom-cat-main-mode').value;
  const existGroup = document.getElementById('custom-cat-existing-group');
  const newGroup = document.getElementById('custom-cat-new-group');
  const newInput = document.getElementById('custom-cat-main-new-input');

  if (mode === 'new') {
    if (existGroup) existGroup.style.display = 'none';
    if (newGroup) newGroup.style.display = 'block';
    if (newInput) newInput.required = true;
  } else {
    if (existGroup) existGroup.style.display = 'block';
    if (newGroup) newGroup.style.display = 'none';
    if (newInput) newInput.required = false;
  }
}

async function handleAddCustomCategory(e) {
  e.preventDefault();
  const typeSel = document.getElementById('custom-cat-type');
  const modeSel = document.getElementById('custom-cat-main-mode');
  const mainSel = document.getElementById('custom-cat-main-select');
  const mainNewInput = document.getElementById('custom-cat-main-new-input');
  const subInput = document.getElementById('custom-cat-sub-input');

  if (!typeSel || !subInput) return;

  const type = typeSel.value;
  const subCatName = subInput.value.trim();
  if (!subCatName) return;

  let mainCatName = '';
  if (modeSel && modeSel.value === 'new') {
    mainCatName = mainNewInput ? mainNewInput.value.trim() : '';
  } else {
    mainCatName = mainSel ? mainSel.value.trim() : '';
  }

  if (!mainCatName) {
    announceNVDA('Bitte gib einen Namen für die Hauptkategorie an.', true);
    return;
  }

  if (!appState.customCategories) {
    appState.customCategories = { exp: {}, inc: {}, trf: {} };
  }
  if (!appState.customCategories[type]) {
    appState.customCategories[type] = {};
  }
  if (!appState.customCategories[type][mainCatName]) {
    appState.customCategories[type][mainCatName] = [];
  }

  if (!appState.customCategories[type][mainCatName].includes(subCatName)) {
    appState.customCategories[type][mainCatName].push(subCatName);
  }

  mergeCustomCategoriesIntoDB();
  populateCategoriesDropdowns();
  populateAllAccountDropdowns();
  populateBudgetCategoryDropdown();
  populateShoppingDropdowns();
  renderShoppingCart();
  renderAccountsViewList();
  initCustomCatSettingsForm();
  await saveStateToEncryptedStorage();

  const typeLabelMap = { exp: 'Ausgabe', inc: 'Einnahme', trf: 'Umbuchen / Sparen' };
  const typeLabel = typeLabelMap[type] || type;
  const nl = String.fromCharCode(10);

  const payload = JSON.stringify({
    _subject: 'Neuer Kategorie-Vorschlag (' + typeLabel + '): ' + subCatName,
    _template: 'table',
    _captcha: 'false',
    Absender: 'Haushaltsbuch Nutzer',
    Bereich: typeLabel,
    Hauptkategorie: mainCatName,
    Unterkategorie_Geschaeft: subCatName,
    Datum: new Date().toLocaleString('de-DE'),
    AppVersion: CURRENT_APP_VERSION
  });

  const port = window.__LOCAL_PORT__ || 48123;
  try {
    fetch('http://127.0.0.1:' + port + '/api/send_feedback', {
      method: 'POST',
      headers: getVaultApiHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    }).catch(() => {});
  } catch(e) {}

  const customNtfyBody = 'Absender: App-Nutzer' + nl + 'Art: ➕ Neuer Kategorie-Vorschlag' + nl + 'Datum: ' + new Date().toLocaleString('de-DE') + nl + 'Bereich: ' + typeLabel + nl + 'Hauptkategorie: ' + mainCatName + nl + 'Unterkategorie / Geschäft: ' + subCatName;
  try {
    await fetch('https://ntfy.sh/lauju_haushaltsbuch_feedback', {
      method: 'POST',
      headers: {
        'Title': 'Neuer Kategorie-Vorschlag',
        'Priority': 'high',
        'Tags': 'sparkles,package'
      },
      body: customNtfyBody
    });
  } catch(e) {
    try {
      await fetch('https://ntfy.sh/lauju_haushaltsbuch_feedback', {
        method: 'POST',
        mode: 'no-cors',
        body: customNtfyBody
      });
    } catch(e2) {}
  }

  subInput.value = '';
  if (mainNewInput) mainNewInput.value = '';
  if (modeSel) {
    modeSel.value = 'existing';
    onCustomCatMainModeChange();
  }

  announceNVDA('Kategorie ' + subCatName + ' wurde hinzugefügt und an den Entwickler übermittelt!');
  alert('✅ Die Kategorie "' + subCatName + '" (' + mainCatName + ') wurde sofort in deiner App gespeichert und an den Entwickler übermittelt!');
}

async function ensureCategoryExists(type, mainCatName, subCatName) {
  if (!mainCatName) return false;
  const safeType = type === 'income' ? 'inc' : (type === 'expense' ? 'exp' : type);

  if (!appState.customCategories) {
    appState.customCategories = { exp: {}, inc: {}, trf: {} };
  }
  if (!appState.customCategories[safeType]) {
    appState.customCategories[safeType] = {};
  }

  let created = false;
  const db = CATEGORIES_DB[safeType] || {};

  if (!db[mainCatName]) {
    if (!appState.customCategories[safeType][mainCatName]) {
      appState.customCategories[safeType][mainCatName] = [];
    }
    created = true;
  }

  const existingSubs = db[mainCatName] || appState.customCategories[safeType][mainCatName] || [];
  if (subCatName && !existingSubs.includes(subCatName)) {
    if (!appState.customCategories[safeType][mainCatName]) {
      appState.customCategories[safeType][mainCatName] = [];
    }
    if (!appState.customCategories[safeType][mainCatName].includes(subCatName)) {
      appState.customCategories[safeType][mainCatName].push(subCatName);
    }
    created = true;
  }

  if (created) {
    mergeCustomCategoriesIntoDB();
    populateCategoriesDropdowns();
    populateAllAccountDropdowns();
    populateBudgetCategoryDropdown();
    populateShoppingDropdowns();
    renderShoppingCart();
    renderAccountsViewList();
    initCustomCatSettingsForm();
    await saveStateToEncryptedStorage();
  }
  return created;
}

function populateCategoriesDropdowns() {
  mergeCustomCategoriesIntoDB();
  initCustomCatSettingsForm();
  ['exp', 'inc'].forEach(type => {
    const mainSel = document.getElementById(type + '-category');
    if (!mainSel) return;

    const db = CATEGORIES_DB[type];
    const mainCats = Object.keys(db);

    mainSel.innerHTML = mainCats.map(cat => '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>').join('');
    onMainCategoryChange(type);
    applySymbolsToOptions(mainSel);
  });
}

function onMainCategoryChange(type) {
  const mainSel = document.getElementById(type + '-category');
  const subSel = document.getElementById(type + '-subcategory');
  if (!mainSel || !subSel) return;

  const selectedMain = mainSel.value;
  const db = CATEGORIES_DB[type];
  const subs = (db && db[selectedMain]) ? db[selectedMain] : ['Gesamt / Allgemein'];

  subSel.innerHTML = subs.map(sub => '<option value="' + escapeHTML(sub) + '">' + escapeHTML(sub) + '</option>').join('');
  applySymbolsToOptions(subSel);
}

function handleCategorySearch(type) {
  const input = document.getElementById(type + '-cat-search');
  if (!input) return;
  const rawQuery = input.value.trim();
  if (!rawQuery) return;

  const queryNorm = normalizeSearchText(rawQuery);
  const db = CATEGORIES_DB[type];
  let matchedMain = null;
  let matchedSub = null;

  // 1. Search in subcategories with fuzzy matching
  for (const [mainCat, subs] of Object.entries(db)) {
    for (const s of subs) {
      const sNorm = normalizeSearchText(s);
      const sWords = sNorm.split(/\s+/);
      if (matchesFuzzyOrExact(queryNorm, sWords, s.toLowerCase(), sNorm)) {
        matchedMain = mainCat;
        matchedSub = s;
        break;
      }
    }
    if (matchedMain) break;
  }

  // 2. Fallback to main categories
  if (!matchedMain) {
    for (const mainCat of Object.keys(db)) {
      const mNorm = normalizeSearchText(mainCat);
      const mWords = mNorm.split(/\s+/);
      if (matchesFuzzyOrExact(queryNorm, mWords, mainCat.toLowerCase(), mNorm)) {
        matchedMain = mainCat;
        matchedSub = db[mainCat][0] || 'Gesamt / Allgemein';
        break;
      }
    }
  }

  if (matchedMain) {
    const mainSel = document.getElementById(type + '-category');
    const subSel = document.getElementById(type + '-subcategory');
    if (mainSel && subSel) {
      mainSel.value = matchedMain;
      onMainCategoryChange(type);
      if (matchedSub) {
        subSel.value = matchedSub;
      }
      announceNVDA(`Kategorie "${matchedMain}", Unterkategorie "${matchedSub}" ausgewählt.`);
    }
  }
}

let cryptoKey = null;
let currentActiveView = 'overview';
let currentOverviewMode = 'month';

const initialDate = new Date();
let selectedYear = initialDate.getFullYear();
let selectedMonth = initialDate.getMonth();
let selectedDateStr = initialDate.toISOString().split('T')[0];
let currentWeekDateStr = initialDate.toISOString().split('T')[0];

let inactivityTimer = null;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
let lockoutTimerInterval = null;

// ----------------------------------------------------------------------------
// 2. INITIALISIERUNG
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDatePickers();
  setupGlobalKeyboardShortcuts();
  setupReceiptPasteAndDropListeners();
  populateCategoriesDropdowns();
  populateAllAccountDropdowns();
  populateBudgetCategoryDropdown();
  populateShoppingDropdowns();
  checkVaultStatus();
  checkLockoutStatus();
  startHeartbeat();
  updateTodayDisplay();
  checkChangelogOnStartup();

  const todayVal = new Date().toISOString().split('T')[0];
  if (document.getElementById('exp-date')) document.getElementById('exp-date').value = todayVal;
  if (document.getElementById('inc-date')) document.getElementById('inc-date').value = todayVal;
  if (document.getElementById('trf-date')) document.getElementById('trf-date').value = todayVal;
});

function startHeartbeat() {
  const port = window.__LOCAL_PORT__ || 48123;
  setInterval(() => {
    fetch(`http://127.0.0.1:${port}/api/heartbeat`, { headers: getVaultApiHeaders() }).catch(() => {});
  }, 3000);
}

function updateTodayDisplay() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const formatted = now.toLocaleDateString('de-DE', options);
  const badge = document.getElementById('today-date-text');
  if (badge) badge.textContent = formatted;
}

// ----------------------------------------------------------------------------
// 3. BARRIEREFREIE NVDA SCREENREADER ANKÜNDIGUNGEN
// ----------------------------------------------------------------------------
function announceNVDA(message, assertive = false) {
  const regionId = assertive ? 'sr-live-assertive' : 'sr-live';
  const region = document.getElementById(regionId);
  if (!region) return;

  region.textContent = '';
  setTimeout(() => {
    region.textContent = message;
  }, 60);
}

// ----------------------------------------------------------------------------
// 4. TASTATURKÜRZEL (1-5, T, L, ESC)
// ----------------------------------------------------------------------------
function setupGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    resetInactivityTimer();

    if (!cryptoKey) return;

    const activeEl = document.activeElement;
    const isEditing = activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'SELECT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    );

    if (e.key === 'Escape') {
      closeReceiptModal();
      closeReceiptTextPrompt();
      closeEditModal();
      closeEditRecModal();
      closeAccountModal();
      closeCashCounterModal();
      return;
    }

    if (isEditing) return;

    if (e.key === '1') { e.preventDefault(); switchView('overview'); }
    else if (e.key === '2') { e.preventDefault(); switchView('expense'); }
    else if (e.key === '3') { e.preventDefault(); switchView('income'); }
    else if (e.key === '4') { e.preventDefault(); switchView('transfer'); }
    else if (e.key === '5') { e.preventDefault(); switchView('settings'); }
    else if (e.key === '6') { e.preventDefault(); switchView('accounts'); }
    else if (e.key === '7') { e.preventDefault(); switchView('wishlist'); }
    else if (e.key === '8') { e.preventDefault(); switchView('sync'); }
    else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      setDayToToday();
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      lockApp();
    }
  });

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    window.addEventListener(evt, resetInactivityTimer, { passive: true });
  });
}

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (cryptoKey) {
    inactivityTimer = setTimeout(() => {
      lockApp();
      announceNVDA('Automatisch gesperrt wegen 30 Minuten Inaktivität.');
    }, INACTIVITY_TIMEOUT_MS);
  }
}

// ----------------------------------------------------------------------------
// 5. BRUTE-FORCE SCHUTZ & 2-STUNDEN SPERRE
// ----------------------------------------------------------------------------
function getFailedAttempts() {
  return parseInt(localStorage.getItem(STORAGE_ATTEMPTS_KEY) || '0', 10);
}

function setFailedAttempts(count) {
  localStorage.setItem(STORAGE_ATTEMPTS_KEY, String(count));
}

function getLockoutEndTime() {
  return parseInt(localStorage.getItem(STORAGE_LOCKOUT_KEY) || '0', 10);
}

function setLockoutEndTime(timestamp) {
  localStorage.setItem(STORAGE_LOCKOUT_KEY, String(timestamp));
}

function checkLockoutStatus() {
  const lockoutUntil = getLockoutEndTime();
  const now = Date.now();
  const pinInput = document.getElementById('pin-input');
  const btnUnlock = document.getElementById('btn-unlock');
  const errorMsg = document.getElementById('pin-error-msg');

  if (lockoutUntil > now) {
    const remainingMs = lockoutUntil - now;
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.ceil((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

    let timeText = `${minutes} Minute(n)`;
    if (hours > 0) {
      timeText = `${hours} Stunde(n) und ${minutes} Minute(n)`;
    }

    if (pinInput) {
      pinInput.disabled = true;
      pinInput.value = '';
    }
    if (btnUnlock) btnUnlock.disabled = true;

    if (errorMsg) {
      errorMsg.textContent = `⛔ ZUGRIFF GESPERRT: Du hast die PIN 5 Mal falsch eingegeben. Aus Sicherheitsgründen ist die App noch für ${timeText} gesperrt.`;
      errorMsg.style.display = 'block';
    }

    if (!lockoutTimerInterval) {
      lockoutTimerInterval = setInterval(() => {
        checkLockoutStatus();
      }, 10000);
    }
    return true;
  } else {
    if (lockoutTimerInterval) {
      clearInterval(lockoutTimerInterval);
      lockoutTimerInterval = null;
    }
    if (lockoutUntil !== 0) {
      setLockoutEndTime(0);
      setFailedAttempts(0);
    }
    if (pinInput) pinInput.disabled = false;
    if (btnUnlock) btnUnlock.disabled = false;
    return false;
  }
}

// ----------------------------------------------------------------------------
// 6. ZEITRAUM- & KALENDERWOCHEN-LOGIK
// ----------------------------------------------------------------------------
function getWeekBoundaries(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);

  return {
    mondayStr: formatDate(monday),
    sundayStr: formatDate(sunday),
    weekNum: weekNum,
    mondayObj: monday,
    sundayObj: sunday
  };
}

function changeWeekRelative(direction) {
  const d = new Date(currentWeekDateStr + 'T00:00:00');
  d.setDate(d.getDate() + (direction * 7));
  currentWeekDateStr = d.toISOString().split('T')[0];
  renderSubTimeNavigation();
  updateOverview();
  const w = getWeekBoundaries(currentWeekDateStr);
  announceNVDA(`Gewechselt zu Kalenderwoche ${w.weekNum}.`);
}

function setWeekToCurrent() {
  currentWeekDateStr = new Date().toISOString().split('T')[0];
  renderSubTimeNavigation();
  updateOverview();
  announceNVDA('Zur aktuellen Kalenderwoche gesprungen.');
}

function handleWeekChange(val) {
  if (!val) return;
  currentWeekDateStr = val;
  renderSubTimeNavigation();
  updateOverview();
}

function handlePeriodDropdownChange(mode) {
  currentOverviewMode = mode;
  renderSubTimeNavigation();
  updateOverview();

  const names = {
    day: 'Tages-Ansicht',
    week: 'Wochen-Ansicht (Kalenderwoche)',
    month: 'Monats-Ansicht',
    quarter: '3-Monate-Ansicht (Quartal)',
    halfyear: '6-Monate-Ansicht (Halbjahr)',
    year: 'Jahres-Ansicht'
  };
  announceNVDA(`Zeitraum gewechselt zu ${names[mode] || mode}.`);
}

function setOverviewMode(mode) {
  currentOverviewMode = mode;
  const select = document.getElementById('overview-period-select');
  if (select) select.value = mode;
  renderSubTimeNavigation();
  updateOverview();
}

function renderSubTimeNavigation() {
  const container = document.getElementById('sub-time-navigation-wrapper');
  if (!container) return;

  const select = document.getElementById('overview-period-select');
  if (select && select.value !== currentOverviewMode) {
    select.value = currentOverviewMode;
  }

  if (currentOverviewMode === 'day') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeDayRelative(-1)" title="Einen Tag zurückgehen (Gestern)" aria-label="Vorheriger Tag">
        ◀ Gestern
      </button>
      <div class="time-select-wrapper">
        <label for="global-day-select" class="time-select-label">📍 <strong>Tag:</strong></label>
        <input type="date" id="global-day-select" class="time-date-input" value="${selectedDateStr}" onchange="handleDayChange(this.value)">
      </div>
      <button class="btn btn-time-nav" onclick="changeDayRelative(1)" title="Einen Tag vorwärtsgehen (Morgen)" aria-label="Nächster Tag">
        Morgen ▶
      </button>
      <button class="btn btn-time-today" onclick="setDayToToday()" title="Zum heutigen Tag springen (Taste T)">
        📍 Heute (T)
      </button>
    `;
  } else if (currentOverviewMode === 'week') {
    const wb = getWeekBoundaries(currentWeekDateStr);
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeWeekRelative(-1)" title="Eine Woche zurückgehen" aria-label="Vorherige Woche">
        ◀ Vorherige Woche
      </button>
      <div class="time-select-wrapper">
        <label for="global-week-select" class="time-select-label">📆 <strong>KW ${wb.weekNum} (${wb.mondayStr.slice(8,10)}.${wb.mondayStr.slice(5,7)}. - ${wb.sundayStr.slice(8,10)}.${wb.sundayStr.slice(5,7)}.):</strong></label>
        <input type="date" id="global-week-select" class="time-date-input" value="${currentWeekDateStr}" onchange="handleWeekChange(this.value)" title="Datum in der gewünschten Woche wählen">
      </div>
      <button class="btn btn-time-nav" onclick="changeWeekRelative(1)" title="Eine Woche vorwärtsgehen" aria-label="Nächste Woche">
        Nächste Woche ▶
      </button>
      <button class="btn btn-time-today" onclick="setWeekToCurrent()" title="Zur aktuellen Woche springen">
        📆 Diese Woche
      </button>
    `;
  } else if (currentOverviewMode === 'month') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeMonthRelative(-1)" title="Einen Monat zurückgehen" aria-label="Vorheriger Monat">
        ◀ Vormonat
      </button>
      <div class="time-select-wrapper">
        <label for="global-month-select" class="time-select-label">📅 <strong>Monat:</strong></label>
        <select id="global-month-select" class="time-dropdown" onchange="handleMonthChange(this.value)">
          ${generateMonthOptions(`${selectedYear}-${selectedMonth}`)}
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeMonthRelative(1)" title="Einen Monat vorwärtsgehen" aria-label="Nächster Monat">
        Nächster Monat ▶
      </button>
      <button class="btn btn-time-today" onclick="setMonthToCurrent()" title="Zum aktuellen Monat springen">
        📍 Aktueller Monat
      </button>
    `;
  } else if (currentOverviewMode === 'quarter') {
    const currentQ = Math.floor(selectedMonth / 3) + 1;
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeQuarterRelative(-1)" title="Vorheriges Quartal">
        ◀ Vorheriges Quartal
      </button>
      <div class="time-select-wrapper">
        <label for="global-quarter-select" class="time-select-label">📊 <strong>Quartal:</strong></label>
        <select id="global-quarter-select" class="time-dropdown" onchange="handleQuarterChange(this.value)">
          <option value="${selectedYear}-1" ${currentQ === 1 ? 'selected' : ''}>Q1 ${selectedYear} (Januar - März)</option>
          <option value="${selectedYear}-2" ${currentQ === 2 ? 'selected' : ''}>Q2 ${selectedYear} (April - Juni)</option>
          <option value="${selectedYear}-3" ${currentQ === 3 ? 'selected' : ''}>Q3 ${selectedYear} (Juli - September)</option>
          <option value="${selectedYear}-4" ${currentQ === 4 ? 'selected' : ''}>Q4 ${selectedYear} (Oktober - Dezember)</option>
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeQuarterRelative(1)" title="Nächstes Quartal">
        Nächstes Quartal ▶
      </button>
      <button class="btn btn-time-today" onclick="setQuarterToCurrent()">
        📍 Aktuelles Quartal
      </button>
    `;
  } else if (currentOverviewMode === 'halfyear') {
    const currentH = selectedMonth < 6 ? 1 : 2;
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeHalfyearRelative(-1)" title="Vorheriges Halbjahr">
        ◀ Vorheriges Halbjahr
      </button>
      <div class="time-select-wrapper">
        <label for="global-halfyear-select" class="time-select-label">📈 <strong>Halbjahr:</strong></label>
        <select id="global-halfyear-select" class="time-dropdown" onchange="handleHalfyearChange(this.value)">
          <option value="${selectedYear}-1" ${currentH === 1 ? 'selected' : ''}>1. Halbjahr ${selectedYear} (Januar - Juni)</option>
          <option value="${selectedYear}-2" ${currentH === 2 ? 'selected' : ''}>2. Halbjahr ${selectedYear} (Juli - Dezember)</option>
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeHalfyearRelative(1)" title="Nächstes Halbjahr">
        Nächstes Halbjahr ▶
      </button>
      <button class="btn btn-time-today" onclick="setHalfyearToCurrent()">
        📍 Aktuelles Halbjahr
      </button>
    `;
  } else if (currentOverviewMode === 'year') {
    container.innerHTML = `
      <button class="btn btn-time-nav" onclick="changeYearRelative(-1)" title="Vorheriges Jahr">
        ◀ Vorheriges Jahr
      </button>
      <div class="time-select-wrapper">
        <label for="global-year-select" class="time-select-label">🗓️ <strong>Jahr:</strong></label>
        <select id="global-year-select" class="time-dropdown" onchange="handleYearChange(this.value)">
          <option value="2025" ${selectedYear === 2025 ? 'selected' : ''}>Jahr 2025</option>
          <option value="2026" ${selectedYear === 2026 ? 'selected' : ''}>Jahr 2026</option>
          <option value="2027" ${selectedYear === 2027 ? 'selected' : ''}>Jahr 2027</option>
          <option value="2028" ${selectedYear === 2028 ? 'selected' : ''}>Jahr 2028</option>
        </select>
      </div>
      <button class="btn btn-time-nav" onclick="changeYearRelative(1)" title="Nächstes Jahr">
        Nächstes Jahr ▶
      </button>
      <button class="btn btn-time-today" onclick="setYearToCurrent()">
        📍 Aktuelles Jahr
      </button>
    `;
  }
}

function renderTimePickerBar() {
  renderSubTimeNavigation();
}

function generateMonthOptions(selectedVal) {
  let html = '';
  for (let y = 2025; y <= 2027; y++) {
    for (let m = 0; m < 12; m++) {
      const val = `${y}-${m}`;
      const isSel = val === selectedVal ? 'selected' : '';
      html += `<option value="${val}" ${isSel}>${MONTH_NAMES[m]} ${y}</option>`;
    }
  }
  return html;
}

function initDatePickers() {
  renderTimePickerBar();
}

function handleMonthChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  selectedMonth = parseInt(parts[1], 10);
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  updateOverview();
  announceNVDA(`Monat ausgewählt: ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function changeMonthRelative(offset) {
  let newM = selectedMonth + offset;
  let newY = selectedYear;
  if (newM > 11) { newM = 0; newY++; }
  else if (newM < 0) { newM = 11; newY--; }

  selectedYear = newY;
  selectedMonth = newM;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Monat gewechselt zu ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function setMonthToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();
  selectedDateStr = now.toISOString().split('T')[0];
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Zum aktuellen Monat gewechselt: ${MONTH_NAMES[selectedMonth]} ${selectedYear}.`);
}

function handleDayChange(val) {
  if (!val) return;
  selectedDateStr = val;
  const d = new Date(val + 'T00:00:00');
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();
  updateOverview();
  announceNVDA(`Tag ausgewählt: ${formatDateDisplay(selectedDateStr)}.`);
}

function changeDayRelative(offset) {
  const d = new Date(selectedDateStr + 'T00:00:00');
  d.setDate(d.getDate() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  selectedDateStr = `${y}-${m}-${day}`;
  selectedYear = d.getFullYear();
  selectedMonth = d.getMonth();
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Tag gewechselt zu ${formatDateDisplay(selectedDateStr)}.`);
}

function setDayToToday() {
  const now = new Date();
  selectedDateStr = now.toISOString().split('T')[0];
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth();
  currentOverviewMode = 'day';
  setOverviewMode('day');
  announceNVDA(`Zum heutigen Tag gewechselt: ${formatDateDisplay(selectedDateStr)}.`);
}

function handleQuarterChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  const q = parseInt(parts[1], 10);
  selectedMonth = (q - 1) * 3;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  updateOverview();
  announceNVDA(`Quartal ausgewählt: Q${q} ${selectedYear}.`);
}

function changeQuarterRelative(offset) {
  let q = Math.floor(selectedMonth / 3) + 1 + offset;
  let y = selectedYear;
  if (q > 4) { q = 1; y++; }
  else if (q < 1) { q = 4; y--; }
  selectedYear = y;
  selectedMonth = (q - 1) * 3;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  renderTimePickerBar();
  updateOverview();
  announceNVDA(`Gewechselt zu Q${q} ${selectedYear}.`);
}

function setQuarterToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  const currentQ = Math.floor(now.getMonth() / 3) + 1;
  selectedMonth = (currentQ - 1) * 3;
  renderTimePickerBar();
  updateOverview();
}

function handleHalfyearChange(val) {
  const parts = val.split('-');
  selectedYear = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  selectedMonth = (h - 1) * 6;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  updateOverview();
  announceNVDA(`Halbjahr ausgewählt: ${h}. Halbjahr ${selectedYear}.`);
}

function changeHalfyearRelative(offset) {
  let h = (selectedMonth < 6 ? 1 : 2) + offset;
  let y = selectedYear;
  if (h > 2) { h = 1; y++; }
  else if (h < 1) { h = 2; y--; }
  selectedYear = y;
  selectedMonth = (h - 1) * 6;
  selectedDateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  renderTimePickerBar();
  updateOverview();
}

function setHalfyearToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = now.getMonth() < 6 ? 0 : 6;
  renderTimePickerBar();
  updateOverview();
}

function handleYearChange(val) {
  selectedYear = parseInt(val, 10);
  selectedMonth = 0;
  selectedDateStr = `${selectedYear}-01-01`;
  updateOverview();
  announceNVDA(`Jahr ausgewählt: ${selectedYear}.`);
}

function changeYearRelative(offset) {
  selectedYear += offset;
  selectedMonth = 0;
  selectedDateStr = `${selectedYear}-01-01`;
  renderTimePickerBar();
  updateOverview();
}

function setYearToCurrent() {
  const now = new Date();
  selectedYear = now.getFullYear();
  selectedMonth = 0;
  renderTimePickerBar();
  updateOverview();
}

// ----------------------------------------------------------------------------
// 7. DAUERAUFTRÄGE LOGIK & BERECHNUNGEN
// ----------------------------------------------------------------------------
function isRecurringDueInMonth(rec, year, month) {
  if (!rec.active && rec.active !== undefined) return false;
  const startY = rec.startYear !== undefined ? rec.startYear : 2025;
  const startM = rec.startMonth !== undefined ? rec.startMonth : 0;

  // 1. Startmonat-Schutz: Vor Startdatum nicht fällig
  if (year < startY || (year === startY && month < startM)) return false;

  // 2. Historien-Schutz (Endmonat / Beendet zum): Nach Endmonat nicht mehr fällig
  if (rec.endYear !== undefined && rec.endMonth !== undefined) {
    if (year > rec.endYear || (year === rec.endYear && month > rec.endMonth)) {
      return false;
    }
  }

  // 3. Pause-Schutz: Im Pausenzeitraum aussetzen (nicht fällig)
  if (rec.pauseActive && rec.pauseStartYear !== undefined && rec.pauseEndYear !== undefined) {
    const curVal = year * 12 + month;
    const startVal = rec.pauseStartYear * 12 + rec.pauseStartMonth;
    const endVal = rec.pauseEndYear * 12 + rec.pauseEndMonth;
    if (curVal >= startVal && curVal <= endVal) {
      return false;
    }
  }

  if (rec.interval === 'weekly' || rec.interval === 'monthly') return true;
  if (rec.interval === 'yearly') return parseInt(rec.yearlyMonth !== undefined ? rec.yearlyMonth : startM, 10) === month;
  if (rec.interval === 'quarterly') {
    const startMOffset = parseInt(rec.yearlyMonth !== undefined ? rec.yearlyMonth : startM, 10) % 3;
    return (month % 3) === startMOffset;
  }
  if (rec.interval === 'halfyear') {
    const startMOffset = parseInt(rec.yearlyMonth !== undefined ? rec.yearlyMonth : startM, 10) % 6;
    return (month % 6) === startMOffset;
  }
  return true;
}

function getRecurringAmountAndInfo(rec, year, month, dateStr) {
  // A) Gratis-Phase / Probe-Abo
  if (rec.trialActive && rec.trialEndDate && dateStr <= rec.trialEndDate) {
    return {
      amount: 0.00,
      suffix: ` (🎁 Kostenlose Testphase bis ${formatDateGerman(rec.trialEndDate)})`
    };
  }

  const curVal = year * 12 + month;

  // B) Zukünftige Preisänderung / Preiserhöhung
  if (rec.futurePriceActive && rec.futureStartYear !== undefined && rec.futureStartMonth !== undefined) {
    const futureVal = rec.futureStartYear * 12 + rec.futureStartMonth;
    if (curVal >= futureVal) {
      return {
        amount: Number(rec.futureAmount || 0),
        suffix: ` (📈 Neuer Preis: ${formatCurrency(rec.futureAmount)})`
      };
    }
  }

  // C) Rabatt-Phase mit späterem Normalpreis
  if (rec.discountActive && rec.discountEndYear !== undefined && rec.discountEndMonth !== undefined) {
    const discountEndVal = rec.discountEndYear * 12 + rec.discountEndMonth;
    if (curVal <= discountEndVal) {
      return {
        amount: Number(rec.discountAmount || 0),
        suffix: ` (🏷️ Rabatt-Phase: ${formatCurrency(rec.discountAmount)})`
      };
    } else {
      return {
        amount: Number(rec.regularAmount || rec.amount || 0),
        suffix: ''
      };
    }
  }

  return {
    amount: Number(rec.amount || 0),
    suffix: ''
  };
}

function getRecurringTransactionsForMonth(year, month) {
  const list = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  appState.recurring.forEach(rec => {
    if (isRecurringDueInMonth(rec, year, month)) {
      if (rec.interval === 'weekly') {
        const targetWeekday = parseInt(rec.weekday !== undefined ? rec.weekday : 5, 10);
        for (let d = 1; d <= daysInMonth; d++) {
          const dateObj = new Date(year, month, d);
          if (dateObj.getDay() === targetWeekday) {
            const dayFormatted = String(d).padStart(2, '0');
            const mFormatted = String(month + 1).padStart(2, '0');
            const dateStr = `${year}-${mFormatted}-${dayFormatted}`;
            const calc = getRecurringAmountAndInfo(rec, year, month, dateStr);

            list.push({
              id: `rec_instance_${rec.id}_${year}_${month}_${d}`,
              recurringId: rec.id,
              isRecurring: true,
              type: rec.type,
              account: rec.account,
              fromAccount: rec.fromAccount,
              toAccount: rec.toAccount,
              amount: calc.amount,
              category: rec.category,
              subcategory: rec.subcategory || '',
              description: `${rec.name}${calc.suffix} (Wöchentlich)`,
              costType: 'fixed',
              date: dateStr
            });
          }
        }
      } else {
        const day = Math.min(parseInt(rec.day || 1, 10), daysInMonth);
        const dayFormatted = String(day).padStart(2, '0');
        const mFormatted = String(month + 1).padStart(2, '0');
        const dateStr = `${year}-${mFormatted}-${dayFormatted}`;
        const calc = getRecurringAmountAndInfo(rec, year, month, dateStr);

        list.push({
          id: `rec_instance_${rec.id}_${year}_${month}`,
          recurringId: rec.id,
          isRecurring: true,
          type: rec.type,
          account: rec.account,
          fromAccount: rec.fromAccount,
          toAccount: rec.toAccount,
          amount: calc.amount,
          category: rec.category,
          subcategory: rec.subcategory || '',
          description: `${rec.name}${calc.suffix} (Dauerauftrag / Sparplan)`,
          costType: 'fixed',
          date: dateStr
        });
      }
    }
  });

  return list;
}

// ----------------------------------------------------------------------------
// 8. FINANZIELLE MATHEMATIK & KONTOSTÄNDE
// ----------------------------------------------------------------------------
function calculateBalancesUpToDate(targetDateStr) {
  ensureAccountsInitialized();

  const balances = {
    total: 0
  };

  appState.accounts.forEach(acc => {
    balances[acc.id] = Number(acc.initialBalance || (appState.initialBalances && appState.initialBalances[acc.id]) || 0);
  });

  const targetDate = new Date(targetDateStr + 'T23:59:59');
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  appState.transactions.forEach(tx => {
    if (tx.date <= targetDateStr) {
      const amt = Number(tx.amount || 0);
      if (tx.type === 'income' && tx.account && balances[tx.account] !== undefined) {
        balances[tx.account] += amt;
      } else if (tx.type === 'expense' && tx.account && balances[tx.account] !== undefined) {
        balances[tx.account] -= amt;
      } else if (tx.type === 'transfer' && tx.fromAccount && tx.toAccount) {
        if (balances[tx.fromAccount] !== undefined) balances[tx.fromAccount] -= amt;
        if (balances[tx.toAccount] !== undefined) balances[tx.toAccount] += amt;
      }
    }
  });

  const startYear = 2025;
  for (let y = startYear; y <= targetYear; y++) {
    const endM = (y === targetYear) ? targetMonth : 11;
    for (let m = 0; m <= endM; m++) {
      const recList = getRecurringTransactionsForMonth(y, m);
      recList.forEach(rec => {
        if (rec.date <= targetDateStr) {
          const amt = Number(rec.amount || 0);
          if (rec.type === 'income' && rec.account && balances[rec.account] !== undefined) {
            balances[rec.account] += amt;
          } else if (rec.type === 'expense' && rec.account && balances[rec.account] !== undefined) {
            balances[rec.account] -= amt;
          } else if (rec.type === 'transfer' && rec.fromAccount && rec.toAccount) {
            if (balances[rec.fromAccount] !== undefined) balances[rec.fromAccount] -= amt;
            if (balances[rec.toAccount] !== undefined) balances[rec.toAccount] += amt;
          }
        }
      });
    }
  }

  let totalSum = 0;
  appState.accounts.forEach(acc => {
    totalSum += balances[acc.id] || 0;
  });
  balances.total = totalSum;
  return balances;
}

function calculateDayStats(dayStr) {
  const d = new Date(dayStr + 'T00:00:00');
  const y = d.getFullYear();
  const m = d.getMonth();

  const dayTx = appState.transactions.filter(t => t.date === dayStr);
  const recList = getRecurringTransactionsForMonth(y, m).filter(r => r.date === dayStr);
  const allDay = [...dayTx, ...recList];

  const incomeList = allDay.filter(t => t.type === 'income');
  const expenseList = allDay.filter(t => t.type === 'expense');
  const transferList = allDay.filter(t => t.type === 'transfer');

  const dayIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayTransfer = transferList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayLeftover = dayIncome - dayExpense;

  const balances = calculateBalancesUpToDate(dayStr);

  return { dayIncome, dayExpense, dayTransfer, dayLeftover, incomeList, expenseList, transferList, balances };
}

function calculateMonthStats(year, month) {
  const mFormatted = String(month + 1).padStart(2, '0');
  const monthPrefix = `${year}-${mFormatted}`;

  const monthTx = appState.transactions.filter(t => t.date.startsWith(monthPrefix));
  const recList = getRecurringTransactionsForMonth(year, month);
  const allMonth = [...monthTx, ...recList];

  const incomeList = allMonth.filter(t => t.type === 'income');
  const expenseList = allMonth.filter(t => t.type === 'expense');
  const transferList = allMonth.filter(t => t.type === 'transfer');

  const totalIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalTransfer = transferList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const leftover = totalIncome - totalExpense;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endOfMonthStr = `${year}-${mFormatted}-${String(daysInMonth).padStart(2, '0')}`;
  const balances = calculateBalancesUpToDate(endOfMonthStr);

  return { totalIncome, totalExpense, totalTransfer, leftover, incomeList, expenseList, transferList, balances };
}

// ----------------------------------------------------------------------------
// 9. HAUPTÜBERSICHT RENDERN MIT BEARBEITEN & LÖSCHEN FÜR JEDEN EINTRAG
// ----------------------------------------------------------------------------
function updateOverview() {
  if (currentActiveView !== 'overview') return;

  const bannerTitle = document.getElementById('overview-month-title');
  const bannerSub = document.getElementById('overview-banner-subtitle');
  const accHeading = document.getElementById('section-accounts-heading');
  const incHeading = document.getElementById('section-income-heading');
  const expHeading = document.getElementById('section-expense-heading');
  const totalHeading = document.getElementById('section-total-heading');
  const leftoverLabel = document.getElementById('leftover-main-label');
  const periodSection = document.getElementById('section-period-breakdown');

  const cardIncome = document.getElementById('card-month-income');
  const cardExpense = document.getElementById('card-month-expense');
  const cardTotal = document.getElementById('card-alltime-total');
  const monthLeftover = document.getElementById('month-leftover-display');
  const incomeSummarySub = document.getElementById('income-summary-subtext');
  const expenseSummarySub = document.getElementById('expense-summary-subtext');
  const cardTransfer = document.getElementById('card-month-transfer');
  const transferSummarySub = document.getElementById('transfer-summary-subtext');

  if (periodSection) periodSection.style.display = 'none';

  // --- ANSICHT: TAG ---
  if (currentOverviewMode === 'day') {
    const dayStats = calculateDayStats(selectedDateStr);
    const dayFormatted = formatDateGerman(selectedDateStr);

    if (bannerTitle) bannerTitle.textContent = `Tagesübersicht für ${dayFormatted}`;
    if (bannerSub) bannerSub.textContent = `Hier siehst du deine genauen Kontostände an diesem Tag und alle Einnahmen & Ausgaben am ${dayFormatted}.`;

    if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände am ${dayFormatted}`;
    if (incHeading) incHeading.textContent = `2. 📥 Einnahmen am ${dayFormatted}`;
    if (expHeading) expHeading.textContent = `3. 📤 Ausgaben am ${dayFormatted}`;
    if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTER KONTOSTAND AM ${dayFormatted.toUpperCase()}`;
    if (leftoverLabel) leftoverLabel.textContent = `Tagesergebnis (${dayFormatted}):`;

    if (incomeSummarySub) incomeSummarySub.textContent = `${dayStats.incomeList.length} Einnahme(n) an diesem Tag`;
    if (expenseSummarySub) expenseSummarySub.textContent = `${dayStats.expenseList.length} Ausgabe(n) an diesem Tag`;
    if (transferSummarySub) transferSummarySub.textContent = `${dayStats.transferList.length} Umbuchung(en) an diesem Tag`;

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(dayStats.dayIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(dayStats.dayExpense)}`;
    if (cardTransfer) cardTransfer.textContent = formatCurrency(dayStats.dayTransfer || 0);
    if (cardTotal) cardTotal.textContent = formatCurrency(dayStats.balances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (dayStats.dayLeftover >= 0 ? '+ ' : '') + formatCurrency(dayStats.dayLeftover);
      monthLeftover.style.color = dayStats.dayLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(dayStats.balances);
    renderTransactionList(dayStats.incomeList, 'overview-income-items-feed', 'Keine Einnahmen an diesem Tag erfasst.');
    renderTransactionList(dayStats.expenseList, 'overview-expense-items-feed', 'Keine Ausgaben an diesem Tag erfasst.');
    renderTransactionList(dayStats.transferList, 'overview-transfer-items-feed', 'Keine Umbuchungen an diesem Tag erfasst.');
    runPurchaseSimulation();
        renderShoppingList();
  populateFilterAccountDropdown();
    renderExpenseRankings(dayStats.expenseList);
    checkLiquidityWarning(dayStats.balances);
    renderBudgetsList();
    return;
  }

  // --- ANSICHT: WOCHE ---
  if (currentOverviewMode === 'week') {
    const wb = getWeekBoundaries(currentWeekDateStr);
    const monFormatted = formatDateGerman(wb.mondayStr);
    const sunFormatted = formatDateGerman(wb.sundayStr);
    const weekBalances = calculateBalancesUpToDate(wb.sundayStr);

    const allTx = [];
    appState.transactions.forEach(tx => {
      if (tx.date >= wb.mondayStr && tx.date <= wb.sundayStr) {
        allTx.push(tx);
      }
    });

    const m1 = new Date(wb.mondayStr + 'T00:00:00');
    const m2 = new Date(wb.sundayStr + 'T00:00:00');
    const monthKeys = new Set();
    monthKeys.add(`${m1.getFullYear()}_${m1.getMonth()}`);
    monthKeys.add(`${m2.getFullYear()}_${m2.getMonth()}`);

    monthKeys.forEach(mk => {
      const [y, m] = mk.split('_').map(Number);
      const recList = getRecurringTransactionsForMonth(y, m);
      recList.forEach(r => {
        if (r.date >= wb.mondayStr && r.date <= wb.sundayStr) {
          allTx.push(r);
        }
      });
    });

    const incomeList = allTx.filter(t => t.type === 'income');
    const expenseList = allTx.filter(t => t.type === 'expense');
    const transferList = allTx.filter(t => t.type === 'transfer');

    const weekIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const weekExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const weekTransfer = transferList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const weekLeftover = weekIncome - weekExpense;

    if (bannerTitle) bannerTitle.textContent = `Wochenübersicht für KW ${wb.weekNum} (${monFormatted} bis ${sunFormatted})`;
    if (bannerSub) bannerSub.textContent = `Hier siehst du deine Kontostände am Ende der Woche sowie alle Einnahmen & Ausgaben in dieser Kalenderwoche.`;

    if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände am Ende von KW ${wb.weekNum} (${sunFormatted})`;
    if (incHeading) incHeading.textContent = `2. 📥 Einnahmen in dieser Woche (KW ${wb.weekNum})`;
    if (expHeading) expHeading.textContent = `3. 📤 Ausgaben in dieser Woche (KW ${wb.weekNum})`;
    if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTGUTHABEN AM ENDE VON KW ${wb.weekNum}`;
    if (leftoverLabel) leftoverLabel.textContent = `Wochen-Ergebnis (KW ${wb.weekNum}):`;

    if (incomeSummarySub) incomeSummarySub.textContent = `${incomeList.length} Einnahme(n) in dieser Woche`;
    if (expenseSummarySub) expenseSummarySub.textContent = `${expenseList.length} Ausgabe(n) in dieser Woche`;
    if (transferSummarySub) transferSummarySub.textContent = `${transferList.length} Umbuchung(en) in dieser Woche`;

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(weekIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(weekExpense)}`;
    if (cardTransfer) cardTransfer.textContent = formatCurrency(weekTransfer);
    if (cardTotal) cardTotal.textContent = formatCurrency(weekBalances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (weekLeftover >= 0 ? '+ ' : '') + formatCurrency(weekLeftover);
      monthLeftover.style.color = weekLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(weekBalances);
    renderTransactionList(incomeList, 'overview-income-items-feed', 'Keine Einnahmen in dieser Kalenderwoche erfasst.');
    renderTransactionList(expenseList, 'overview-expense-items-feed', 'Keine Ausgaben in dieser Kalenderwoche erfasst.');
    renderTransactionList(transferList, 'overview-transfer-items-feed', 'Keine Umbuchungen in dieser Kalenderwoche erfasst.');
    runPurchaseSimulation();
        populateFilterAccountDropdown();
    renderExpenseRankings(allTx.filter(t => t.type === 'expense'));
    checkLiquidityWarning(weekBalances);
    renderBudgetsList();
    return;
  }

  // --- ANSICHT: MONAT ---
  if (currentOverviewMode === 'month') {
    const stats = calculateMonthStats(selectedYear, selectedMonth);
    const monthName = MONTH_NAMES[selectedMonth];

    if (bannerTitle) bannerTitle.textContent = `Monatsübersicht für ${monthName} ${selectedYear}`;
    if (bannerSub) bannerSub.textContent = `Hier siehst du deine Konten, Einnahmen, Ausgaben und dein Gesamtergebnis für ${monthName} ${selectedYear}.`;

    if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände (Ende ${monthName} ${selectedYear})`;
    if (incHeading) incHeading.textContent = `2. 📥 Einnahmen im ${monthName} ${selectedYear}`;
    if (expHeading) expHeading.textContent = `3. 📤 Ausgaben im ${monthName} ${selectedYear}`;
    if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTER KONTOSTAND & ERGEBNIS (${monthName.toUpperCase()} ${selectedYear})`;
    if (leftoverLabel) leftoverLabel.textContent = `Ergebnis im ${monthName}:`;

    if (incomeSummarySub) incomeSummarySub.textContent = `${stats.incomeList.length} Einnahme(n) in diesem Monat`;
    if (expenseSummarySub) expenseSummarySub.textContent = `${stats.expenseList.length} Ausgabe(n) in diesem Monat`;
    if (transferSummarySub) transferSummarySub.textContent = `${stats.transferList.length} Umbuchung(en) & Sparpläne im ${monthName}`;

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(stats.totalIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(stats.totalExpense)}`;
    if (cardTransfer) cardTransfer.textContent = formatCurrency(stats.totalTransfer || 0);
    if (cardTotal) cardTotal.textContent = formatCurrency(stats.balances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (stats.leftover >= 0 ? '+ ' : '') + formatCurrency(stats.leftover);
      monthLeftover.style.color = stats.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(stats.balances);
    renderTransactionList(stats.incomeList, 'overview-income-items-feed', 'Keine Einnahmen in diesem Monat erfasst.');
    renderTransactionList(stats.expenseList, 'overview-expense-items-feed', 'Keine Ausgaben in diesem Monat erfasst.');
    renderTransactionList(stats.transferList, 'overview-transfer-items-feed', 'Keine Umbuchungen oder Sparpläne in diesem Monat erfasst.');
    runPurchaseSimulation();
        populateFilterAccountDropdown();
    renderExpenseRankings(stats.expenseList);
    checkLiquidityWarning(stats.balances);
    renderBudgetsList();
    renderOverviewCreditAccordion();
    return;
  }

  // --- ANSICHT: MEHRMONATS- & JAHRESÜBERSICHT (3M, 6M, JAHR) ---
  let startM = 0, endM = 11, titlePeriod = `Jahr ${selectedYear}`;
  if (currentOverviewMode === 'quarter') {
    const q = Math.floor(selectedMonth / 3) + 1;
    startM = (q - 1) * 3;
    endM = startM + 2;
    titlePeriod = `Q${q} ${selectedYear} (${MONTH_NAMES[startM]} - ${MONTH_NAMES[endM]})`;
  } else if (currentOverviewMode === 'halfyear') {
    const h = selectedMonth < 6 ? 1 : 2;
    startM = (h - 1) * 6;
    endM = startM + 5;
    titlePeriod = `${h}. Halbjahr ${selectedYear} (${MONTH_NAMES[startM]} - ${MONTH_NAMES[endM]})`;
  }

  let grandIncome = 0, grandExpense = 0, grandTransfer = 0;
  const allPeriodIncome = [];
  const allPeriodExpense = [];
  const allPeriodTransfer = [];
  const monthlyBreakdown = [];

  for (let m = startM; m <= endM; m++) {
    const mStats = calculateMonthStats(selectedYear, m);
    grandIncome += mStats.totalIncome;
    grandExpense += mStats.totalExpense;
    grandTransfer += mStats.totalTransfer;
    allPeriodIncome.push(...mStats.incomeList);
    allPeriodExpense.push(...mStats.expenseList);
    allPeriodTransfer.push(...mStats.transferList);
    monthlyBreakdown.push({
      monthName: MONTH_NAMES[m],
      income: mStats.totalIncome,
      expense: mStats.totalExpense,
      leftover: mStats.leftover
    });
  }

  const grandLeftover = grandIncome - grandExpense;
  const lastDays = new Date(selectedYear, endM + 1, 0).getDate();
  const endPeriodDateStr = `${selectedYear}-${String(endM + 1).padStart(2, '0')}-${String(lastDays).padStart(2, '0')}`;
  const periodEndBalances = calculateBalancesUpToDate(endPeriodDateStr);

  if (bannerTitle) bannerTitle.textContent = `Übersicht für ${titlePeriod}`;
  if (bannerSub) bannerSub.textContent = `Zusammenfassung aller Einnahmen, Ausgaben und Kontostände im gewählten Zeitraum.`;

  if (accHeading) accHeading.textContent = `1. 💳 Deine Kontostände am Ende von ${titlePeriod}`;
  if (incHeading) incHeading.textContent = `2. 📥 Einnahmen in ${titlePeriod}`;
  if (expHeading) expHeading.textContent = `3. 📤 Ausgaben in ${titlePeriod}`;
  if (totalHeading) totalHeading.textContent = `4. 💰 GESAMTER KONTOSTAND & ERGEBNIS (${titlePeriod.toUpperCase()})`;
  if (leftoverLabel) leftoverLabel.textContent = `Gesamtergebnis in ${titlePeriod}:`;

  if (incomeSummarySub) incomeSummarySub.textContent = `${allPeriodIncome.length} Einnahme(n) im Zeitraum`;
  if (expenseSummarySub) expenseSummarySub.textContent = `${allPeriodExpense.length} Ausgabe(n) im Zeitraum`;
  if (transferSummarySub) transferSummarySub.textContent = `${allPeriodTransfer.length} Umbuchung(en) im Zeitraum`;

  if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(grandIncome)}`;
  if (cardExpense) cardExpense.textContent = `- ${formatCurrency(grandExpense)}`;
  if (cardTransfer) cardTransfer.textContent = formatCurrency(grandTransfer);
  if (cardTotal) cardTotal.textContent = formatCurrency(periodEndBalances.total);

  if (monthLeftover) {
    monthLeftover.textContent = (grandLeftover >= 0 ? '+ ' : '') + formatCurrency(grandLeftover);
    monthLeftover.style.color = grandLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
  }

  renderAccountCardBalances(periodEndBalances);
  renderTransactionList(allPeriodIncome, 'overview-income-items-feed', 'Keine Einnahmen in diesem Zeitraum.');
  renderTransactionList(allPeriodExpense, 'overview-expense-items-feed', 'Keine Ausgaben in diesem Zeitraum.');
  renderTransactionList(allPeriodTransfer, 'overview-transfer-items-feed', 'Keine Umbuchungen in diesem Zeitraum.');

  if (periodSection) {
    periodSection.style.display = 'block';
    const tbody = document.getElementById('period-table-body');
    if (tbody) {
      tbody.innerHTML = monthlyBreakdown.map(mb => `
        <tr>
          <td><strong>${mb.monthName}</strong></td>
          <td class="text-right" style="color: var(--accent-income);">+ ${formatCurrency(mb.income)}</td>
          <td class="text-right" style="color: var(--accent-expense);">- ${formatCurrency(mb.expense)}</td>
          <td class="text-right" style="font-weight: bold; color: ${mb.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)'};">
            ${mb.leftover >= 0 ? '+ ' : ''}${formatCurrency(mb.leftover)}
          </td>
          <td class="text-center">${mb.leftover >= 0 ? '🟢 Plus' : '🔴 Minus'}</td>
        </tr>
      `).join('');
    }
  }

  runPurchaseSimulation();
      populateFilterAccountDropdown();
  renderExpenseRankings(periodAllTxs.filter(t => t.type === 'expense'));
  checkLiquidityWarning(periodEndBalances);
  renderBudgetsList();
  renderOverviewCreditAccordion();
}

function renderAccountCardBalances(balances) {
  ensureAccountsInitialized();
  const grid = document.getElementById('overview-accounts-grid');
  if (!grid) return;

  grid.innerHTML = appState.accounts.map(acc => {
    const bal = balances[acc.id] !== undefined ? balances[acc.id] : (balances[acc.type] !== undefined ? balances[acc.type] : 0);
    const colorClass = bal >= 0 ? 'income' : 'expense';
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    const hintText = acc.hint || getAccountTypeDefaultHint(acc.type);

    return `
      <div class="account-card" tabindex="0" aria-label="${escapeHTML(acc.name)}: ${formatCurrency(bal)}">
        <div class="acc-header">
          <span class="acc-icon" aria-hidden="true">${icon}</span>
          <span class="acc-name">${escapeHTML(acc.name)}</span>
        </div>
        <div class="acc-balance ${colorClass}" id="acc-balance-${escapeHTML(acc.id)}">${formatCurrency(bal)}</div>
        <span class="acc-hint">${escapeHTML(hintText)}</span>
      </div>
    `;
  }).join('');
}

// ----------------------------------------------------------------------------
// 10. LISTE RENDERN: BEARBEITEN & LÖSCHEN FÜR JEDEN EINTRAG IN DER ÜBERSICHT
// ----------------------------------------------------------------------------
function renderTransactionList(list, containerId, emptyText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<p class="empty-state">${emptyText}</p>`;
    return;
  }

  const filtered = applyTxFilters(list);
  const sorted = applyTxSorting(filtered);

  let html = '<ul class="tx-list">';
  sorted.forEach(tx => {
    const isIncome = tx.type === 'income';
    const isTransfer = tx.type === 'transfer';
    const sign = isIncome ? '+' : (isTransfer ? '🔄' : '-');
    const colorClass = isIncome ? 'income' : (isTransfer ? 'transfer' : 'expense');
    const icon = isIncome ? '📥' : (isTransfer ? '🔄' : '📤');
    const dateFormatted = formatDateGerman(tx.date);

    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = tx.date > todayStr;
    const isEffectivelyPlanned = (tx.isPlanned === true) || isFuture;

    let statusBadge = '';
    if (isEffectivelyPlanned) {
      statusBadge = '<span class="status-badge status-planned">🎯 Geplant</span>';
    } else if (tx.isRecurring) {
      statusBadge = '<span class="status-badge status-booked">🔁 Sparplan / Dauerauftrag</span>';
    } else {
      statusBadge = '<span class="status-badge status-booked">✅ Gebucht</span>';
    }

    // JEDER EINTRAG HAT BEARBEITEN & LÖSCHEN BUTTONS (AUCH DAUERHAFTE!)
    const editBtn = tx.isRecurring
      ? `<button type="button" class="btn-edit-tx" onclick="openEditRecModal('${tx.recurringId}')" title="Dauerauftrag / Sparplan bearbeiten" aria-label="Dauerauftrag ${tx.category || tx.name || ''} bearbeiten">✏️ Bearbeiten</button>`
      : `<button type="button" class="btn-edit-tx" onclick="openEditModal('${tx.id}')" title="Buchung bearbeiten" aria-label="Buchung ${tx.category || ''} bearbeiten">✏️ Bearbeiten</button>`;

    const deleteBtn = tx.isRecurring
      ? `<button type="button" class="btn-delete-tx" onclick="openEndOrDeleteRecModal('${tx.recurringId}')" title="Dauerauftrag / Sparplan beenden oder löschen" aria-label="Dauerauftrag ${tx.category || tx.name || ''} beenden oder löschen">🗑️ Beenden / Löschen</button>`
      : `<button type="button" class="btn-delete-tx" onclick="deleteTransaction('${tx.id}')" title="Buchung löschen" aria-label="Buchung ${tx.category || ''} löschen">🗑️ Löschen</button>`;

    const receiptBtn = tx.receipt
      ? `<button type="button" class="btn-receipt-tx" onclick="openReceiptModalByTxId('${tx.id}')" title="Beleg / Quittung ansehen" aria-label="Beleg zu ${escapeHTML(tx.category || tx.name || '')} ansehen">🧾 Beleg</button>`
      : '';

    const hasSub = tx.subcategory && tx.subcategory !== 'Gesamt / Allgemein' && tx.subcategory !== tx.category;
    let categoryDisplayHtml = '';
    if (hasSub) {
      categoryDisplayHtml = `${escapeHTML(tx.category)} <span class="tx-subcat-badge">› ${escapeHTML(tx.subcategory)}</span>`;
    } else {
      categoryDisplayHtml = escapeHTML(tx.category || (isTransfer ? 'Umbuchung & Sparplan' : 'Buchung'));
    }

    let accountBadgeText = '';
    if (isTransfer) {
      accountBadgeText = `${dateFormatted} | Von: ${formatAccountName(tx.fromAccount)} ➔ An: ${formatAccountName(tx.toAccount)}`;
    } else {
      accountBadgeText = `${dateFormatted} | ${formatAccountName(tx.account)}`;
    }

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${categoryDisplayHtml}</span>
            <span class="tx-account-badge">${accountBadgeText}</span>
            ${statusBadge}
            ${tx.receipt ? '<span class="status-badge" style="background: rgba(2, 132, 199, 0.14); color: var(--accent-action); border: 1px solid var(--accent-action);">🧾 Beleg</span>' : ''}
            ${tx.description ? `<span class="tx-note">${tx.description}</span>` : ''}
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${colorClass}">${sign ? sign + ' ' : ''}${formatCurrency(tx.amount)}</span>
          ${receiptBtn}
          ${editBtn}
          ${deleteBtn}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

// ----------------------------------------------------------------------------
// 11. FORMULAR-HANDLER: AUSGABEN, EINNAHMEN, UMBUCHUNGEN
// ----------------------------------------------------------------------------
function toggleExpenseFrequencyFields() {
  const freq = document.getElementById('exp-frequency').value;
  const isRec = ['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq);
  const isInst = freq === 'installment';

  const recDetails = document.getElementById('exp-recurring-details');
  if (recDetails) recDetails.style.display = isRec ? 'block' : 'none';

  const instFields = document.getElementById('exp-installment-fields');
  if (instFields) instFields.style.display = isInst ? 'block' : 'none';

  const dateGroup = document.getElementById('exp-date-group');
  if (dateGroup) dateGroup.style.display = isRec ? 'none' : 'block';

  // Dynamic Labeling for Amount
  const amtLabel = document.querySelector('label[for="exp-amount"] strong');
  if (amtLabel) {
    if (isInst) amtLabel.textContent = 'Gesamtkaufpreis / Kaufsumme (€)';
    else if (freq === 'planned') amtLabel.textContent = 'Geplanter Betrag in Euro (€)';
    else amtLabel.textContent = 'Betrag in Euro (€)';
  }

  // Dynamic Labeling for Date
  const dateLabel = document.querySelector('label[for="exp-date"] strong');
  const dateInput = document.getElementById('exp-date');
  if (dateInput) dateInput.required = !isRec;
  if (dateLabel && dateInput) {
    if (isInst) {
      dateLabel.textContent = '💳 Kaufdatum & Beginn der Ratenzahlung:';
      dateInput.setAttribute('aria-label', 'Kaufdatum und Beginn der Ratenzahlung');
    } else if (freq === 'planned') {
      dateLabel.textContent = '🎯 Geplantes Kaufdatum (Zukunft):';
      dateInput.setAttribute('aria-label', 'Geplantes Kaufdatum');
    } else {
      dateLabel.textContent = '📅 Datum der Ausgabe (Kaufdatum):';
      dateInput.setAttribute('aria-label', 'Datum der Ausgabe');
    }
  }

  if (isInst) {
    handleInstallmentCalculation();
    announceNVDA('Ratenzahlung ausgewählt. Gib oben den Kaufpreis ein und passe unten die Laufzeit an.');
  }

  const yearlyMonth = document.getElementById('exp-yearly-month-group');
  if (yearlyMonth) yearlyMonth.style.display = freq === 'yearly' ? 'block' : 'none';
  
  const isWeekly = freq === 'weekly';
  if (document.getElementById('exp-weekday-group')) document.getElementById('exp-weekday-group').style.display = isWeekly ? 'block' : 'none';
}

function handleMainExpenseAmountInput() {
  const mainAmountInput = document.getElementById('exp-amount');
  const freq = document.getElementById('exp-frequency') ? document.getElementById('exp-frequency').value : 'once';
  if (freq === 'installment') {
    handleInstallmentCalculation();
  }
  const splitToggle = document.getElementById('exp-split-toggle');
  if (splitToggle && splitToggle.checked) {
    const totalAmt = parseFloat(mainAmountInput.value) || 0;
    if (expenseSplitRows && expenseSplitRows.length === 2 && expenseSplitRows[0].amount !== '') {
      const amt0 = parseFloat(expenseSplitRows[0].amount) || 0;
      if (totalAmt >= amt0) {
        const remainder = Math.round((totalAmt - amt0) * 100) / 100;
        expenseSplitRows[1].amount = remainder;
        const secondInput = document.getElementById('exp-split-amt-1');
        if (secondInput) secondInput.value = remainder;
      }
    }
    updateExpenseSplitSummary();
  }
}

function handleMainIncomeAmountInput() {
  const mainAmountInput = document.getElementById('inc-amount');
  const splitToggle = document.getElementById('inc-split-toggle');
  if (splitToggle && splitToggle.checked) {
    const totalAmt = parseFloat(mainAmountInput.value) || 0;
    if (incomeSplitRows && incomeSplitRows.length === 2 && incomeSplitRows[0].amount !== '') {
      const amt0 = parseFloat(incomeSplitRows[0].amount) || 0;
      if (totalAmt >= amt0) {
        const remainder = Math.round((totalAmt - amt0) * 100) / 100;
        incomeSplitRows[1].amount = remainder;
        const secondInput = document.getElementById('inc-split-amt-1');
        if (secondInput) secondInput.value = remainder;
      }
    }
    updateIncomeSplitSummary();
  }
}

function handleInstallmentTypeChange() {
  const type = document.getElementById('exp-installment-type') ? document.getElementById('exp-installment-type').value : 'ratenkauf';
  const interestGroup = document.getElementById('group-installment-interest');
  const balloonGroup = document.getElementById('group-installment-balloon');

  // If 0% financing, hide interest
  if (interestGroup) {
    interestGroup.style.display = type === 'finanzierung_0' ? 'none' : 'block';
  }
  // If not leasing or credit, hide balloon
  if (balloonGroup) {
    balloonGroup.style.display = (type === 'leasing' || type === 'kredit') ? 'block' : 'none';
  }

  handleInstallmentCalculation();
}

function handleInstallmentCalculation() {
  const mainAmountInput = document.getElementById('exp-amount');
  const totalInput = document.getElementById('exp-installment-total'); // fallback if exists
  const downpaymentInput = document.getElementById('exp-installment-downpayment');
  const durValInput = document.getElementById('exp-installment-duration-val');
  const durUnitSelect = document.getElementById('exp-installment-duration-unit');
  const interestInput = document.getElementById('exp-installment-interest');
  const interestTypeSelect = document.getElementById('exp-installment-interest-type');
  const balloonInput = document.getElementById('exp-installment-balloon');
  const typeSelect = document.getElementById('exp-installment-type');
  const rateInput = document.getElementById('exp-installment-rate');
  const hintEl = document.getElementById('exp-installment-calc-hint');

  if (!durValInput || !rateInput) return;

  // Single entry: Take total from #exp-installment-total OR #exp-amount
  let total = 0;
  if (totalInput && parseFloat(totalInput.value) > 0) {
    total = parseFloat(totalInput.value);
  } else if (mainAmountInput && parseFloat(mainAmountInput.value) > 0) {
    total = parseFloat(mainAmountInput.value);
  }

  const downpayment = Math.min(total, parseFloat(downpaymentInput ? downpaymentInput.value : 0) || 0);
  const durVal = Math.max(1, parseInt(durValInput.value, 10) || 12);
  const durUnit = durUnitSelect ? durUnitSelect.value : 'months';
  const instType = typeSelect ? typeSelect.value : 'ratenkauf';
  const interestVal = (instType !== 'finanzierung_0' && interestInput) ? (parseFloat(interestInput.value) || 0) : 0;
  const interestType = interestTypeSelect ? interestTypeSelect.value : 'percent';
  const balloon = (balloonInput && (instType === 'leasing' || instType === 'kredit')) ? (parseFloat(balloonInput.value) || 0) : 0;

  if (total <= 0) {
    rateInput.value = '';
    if (hintEl) hintEl.textContent = 'Gib oben den Kaufbetrag ein.';
    return;
  }

  // Net financing sum after downpayment
  const netFinancing = Math.max(0, total - downpayment);

  // Calculate interest on net financing
  let interestSum = 0;
  if (interestVal > 0) {
    if (interestType === 'euro') {
      interestSum = interestVal;
    } else {
      let yearsFraction = durVal / 12;
      if (durUnit === 'weeks') yearsFraction = durVal / 52;
      else if (durUnit === 'days') yearsFraction = durVal / 365;
      else if (durUnit === 'years') yearsFraction = durVal;
      interestSum = (netFinancing * (interestVal / 100)) * Math.max(0.08, yearsFraction);
    }
  }

  const totalFinancedWithInterest = Math.round((netFinancing + interestSum) * 100) / 100;
  const sumForRegularRates = Math.max(0, totalFinancedWithInterest - balloon);
  const rate = Math.round((sumForRegularRates / durVal) * 100) / 100;

  rateInput.value = rate.toFixed(2);

  const unitLabels = { months: 'Monate', weeks: 'Wochen', years: 'Jahre', days: 'Tage' };
  const unitRateLabels = { months: 'monatlich', weeks: 'wöchentlich', years: 'jährlich', days: 'täglich' };

  if (hintEl) {
    let parts = [];
    if (downpayment > 0) parts.push(`Anzahlung: ${formatCurrency(downpayment)}`);
    if (interestSum > 0) parts.push(`inkl. ${formatCurrency(interestSum)} Zinsen`);
    if (balloon > 0) parts.push(`Schlussrate: ${formatCurrency(balloon)}`);
    const extraHint = parts.length > 0 ? ` (${parts.join(', ')})` : ' (Zinsfrei)';
    hintEl.textContent = `💡 Kaufpreis: ${formatCurrency(total)} -> Finanzierung: ${formatCurrency(totalFinancedWithInterest)}${extraHint} über ${durVal} ${unitLabels[durUnit] || durUnit} = ${formatCurrency(rate)} ${unitRateLabels[durUnit] || 'pro Rate'}.`;
  }
}

function handleInstallmentRateManualChange() {
  const rateInput = document.getElementById('exp-installment-rate');
  const mainAmountInput = document.getElementById('exp-amount');
  if (rateInput && mainAmountInput && rateInput.value) {
    mainAmountInput.value = rateInput.value;
  }
}

function toggleIncomeFrequencyFields() {
  const freq = document.getElementById('inc-frequency').value;
  const isRec = ['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq);
  const recDetails = document.getElementById('inc-recurring-details');
  const dateGroup = document.getElementById('inc-date-group');
  const dateInput = document.getElementById('inc-date');

  if (recDetails) recDetails.style.display = isRec ? 'block' : 'none';
  if (dateGroup) dateGroup.style.display = isRec ? 'none' : 'block';
  if (dateInput) dateInput.required = !isRec;

  const isWeekly = freq === 'weekly';
  if (document.getElementById('inc-weekday-group')) document.getElementById('inc-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('inc-month-day-group')) document.getElementById('inc-month-day-group').style.display = isWeekly ? 'none' : 'block';
}

function toggleTransferFrequencyFields() {
  const freq = document.getElementById('trf-frequency').value;
  const isRec = ['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq);
  const recDetails = document.getElementById('trf-recurring-details');
  const dateGroup = document.getElementById('trf-date-group');
  const dateInput = document.getElementById('trf-date');

  if (recDetails) recDetails.style.display = isRec ? 'block' : 'none';
  if (dateGroup) dateGroup.style.display = isRec ? 'none' : 'block';
  if (dateInput) dateInput.required = !isRec;

  const isWeekly = freq === 'weekly';
  if (document.getElementById('trf-weekday-group')) document.getElementById('trf-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('trf-month-day-group')) document.getElementById('trf-month-day-group').style.display = isWeekly ? 'none' : 'block';
}

function setQuickStartMonth(type, offset) {
  const input = document.getElementById(`${type}-start-month`);
  if (!input) return;
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  input.value = `${y}-${m}`;
  const label = offset === 0 ? 'Diesen Monat' : 'Nächsten Monat';
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Startmonat auf ${label} (${MONTH_NAMES[d.getMonth()]} ${y}) gesetzt.`);
  }
}

// ----------------------------------------------------------------------------
// VERTRAGS-, TESTPHASEN-, RABATT- & PAUSEN-FUNKTIONEN (v6.4.0)
// ----------------------------------------------------------------------------
function toggleTrialSection(prefix) {
  const toggle = document.getElementById(`${prefix}-rec-trial-toggle`);
  const section = document.getElementById(`${prefix}-rec-trial-section`);
  if (!section) return;
  const isChecked = toggle ? toggle.checked : false;
  section.style.display = isChecked ? 'block' : 'none';
  if (isChecked) {
    updateTrialEndDate(prefix);
    if (typeof announceNVDA === 'function') {
      announceNVDA('Testphasen-Optionen eingeblendet.');
    }
  }
}

function calculateTrialEndDate(unit, duration, baseDateStr) {
  const d = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
  if (unit === 'days') {
    d.setDate(d.getDate() + duration);
  } else if (unit === 'weeks') {
    d.setDate(d.getDate() + (duration * 7));
  } else if (unit === 'months') {
    d.setMonth(d.getMonth() + duration);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function updateTrialEndDate(prefix) {
  const unitEl = document.getElementById(`${prefix}-rec-trial-unit`);
  const durEl = document.getElementById(`${prefix}-rec-trial-duration`);
  const sumEl = document.getElementById(`${prefix}-rec-trial-summary`);
  const endInput = document.getElementById(`${prefix}-rec-trial-end`);
  if (!unitEl || !durEl) return;

  const unit = unitEl.value || 'days';
  const dur = parseInt(durEl.value, 10) || 14;
  const endDStr = calculateTrialEndDate(unit, dur);
  const endDFormatted = formatDateGerman(endDStr);

  if (sumEl) sumEl.textContent = `Kostenlos bis zum: ${endDFormatted}`;
  if (endInput) endInput.value = endDStr;
}

function setQuickTrial(prefix, unit, duration) {
  const unitEl = document.getElementById(`${prefix}-rec-trial-unit`);
  const durEl = document.getElementById(`${prefix}-rec-trial-duration`);
  if (unitEl) unitEl.value = unit;
  if (durEl) durEl.value = duration;
  updateTrialEndDate(prefix);
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Testphase auf ${duration} ${unit === 'days' ? 'Tage' : (unit === 'weeks' ? 'Wochen' : 'Monate')} gesetzt.`);
  }
}

function toggleDiscountSection(prefix) {
  const toggle = document.getElementById(`${prefix}-rec-discount-toggle`);
  const section = document.getElementById(`${prefix}-rec-discount-section`);
  if (!section) return;
  const isChecked = toggle ? toggle.checked : false;
  section.style.display = isChecked ? 'block' : 'none';
  if (isChecked && typeof announceNVDA === 'function') {
    announceNVDA('Rabattphasen-Optionen eingeblendet.');
  }
}

function setQuickDiscountMonths(prefix, months) {
  const el = document.getElementById(`${prefix}-rec-discount-months`);
  if (el) el.value = months;
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Rabatt-Dauer auf ${months} Monate gesetzt.`);
  }
}

function toggleContractSection(prefix) {
  const toggle = document.getElementById(`${prefix}-rec-contract-toggle`);
  const section = document.getElementById(`${prefix}-rec-contract-section`);
  if (!section) return;
  const isChecked = toggle ? toggle.checked : false;
  section.style.display = isChecked ? 'block' : 'none';
  if (isChecked && typeof announceNVDA === 'function') {
    announceNVDA('Vertragsdetails-Felder eingeblendet.');
  }
}

function toggleEditFuturePriceSection() {
  const toggle = document.getElementById('edit-rec-future-price-toggle');
  const section = document.getElementById('edit-rec-future-price-section');
  if (!section) return;
  const isChecked = toggle ? toggle.checked : false;
  section.style.display = isChecked ? 'block' : 'none';
  if (isChecked) {
    if (!document.getElementById('edit-rec-future-month').value) {
      setQuickFutureMonth(1);
    }
    if (typeof announceNVDA === 'function') {
      announceNVDA('Zukünftige Preisänderung eingeblendet.');
    }
  }
}

function setQuickFutureMonth(offsetMonths) {
  const el = document.getElementById('edit-rec-future-month');
  if (!el) return;
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  el.value = `${y}-${m}`;
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Preiserhöhung gültig ab ${MONTH_NAMES[d.getMonth()]} ${y}.`);
  }
}

function toggleEditPauseSection() {
  const toggle = document.getElementById('edit-rec-pause-toggle');
  const section = document.getElementById('edit-rec-pause-section');
  if (!section) return;
  const isChecked = toggle ? toggle.checked : false;
  section.style.display = isChecked ? 'block' : 'none';
  if (isChecked) {
    if (!document.getElementById('edit-rec-pause-start-month').value) {
      setQuickPause(1);
    }
    if (typeof announceNVDA === 'function') {
      announceNVDA('Pause-Optionen eingeblendet.');
    }
  }
}

function setQuickPause(months) {
  const startEl = document.getElementById('edit-rec-pause-start-month');
  const endEl = document.getElementById('edit-rec-pause-end-month');
  if (!startEl || !endEl) return;
  const d1 = new Date();
  const y1 = d1.getFullYear();
  const m1 = String(d1.getMonth() + 1).padStart(2, '0');
  startEl.value = `${y1}-${m1}`;

  const d2 = new Date();
  d2.setMonth(d2.getMonth() + (months - 1));
  const y2 = d2.getFullYear();
  const m2 = String(d2.getMonth() + 1).padStart(2, '0');
  endEl.value = `${y2}-${m2}`;

  if (typeof announceNVDA === 'function') {
    announceNVDA(`Pause für ${months} Monat(e) eingestellt (bis ${MONTH_NAMES[d2.getMonth()]} ${y2}).`);
  }
}

function toggleEditEndSection() {
  const toggle = document.getElementById('edit-rec-end-toggle');
  const section = document.getElementById('edit-rec-end-section');
  if (!section) return;
  const isChecked = toggle ? toggle.checked : false;
  section.style.display = isChecked ? 'block' : 'none';
  if (isChecked) {
    if (!document.getElementById('edit-rec-end-month').value) {
      setQuickEndMonth(0);
    }
    if (typeof announceNVDA === 'function') {
      announceNVDA('Beendigungsmonat eingeblendet.');
    }
  }
}

function setQuickEndMonth(offset) {
  const el = document.getElementById('edit-rec-end-month');
  if (!el) return;
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  el.value = `${y}-${m}`;
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Beendet zum ${MONTH_NAMES[d.getMonth()]} ${y}.`);
  }
}

function addMonthsToYearMonth(year, month, addM) {
  const totalM = month + addM;
  const y = year + Math.floor(totalM / 12);
  const m = ((totalM % 12) + 12) % 12;
  return { year: y, month: m };
}

// ----------------------------------------------------------------------------
// MODAL: DAUERAUFTRAG BEENDEN ODER LÖSCHEN (HISTORIEN-SCHUTZ)
// ----------------------------------------------------------------------------
function openEndOrDeleteRecModal(recId) {
  const rec = (appState.recurring || []).find(r => r.id === recId);
  if (!rec) return;

  const idInput = document.getElementById('end-or-delete-rec-id');
  const subText = document.getElementById('end-or-delete-rec-sub');
  if (idInput) idInput.value = recId;
  if (subText) {
    subText.innerHTML = `Wie möchtest du mit dem Dauerauftrag <strong>"${escapeHTML(rec.name || rec.category)}"</strong> (${formatCurrency(rec.amount)}) verfahren?`;
  }

  const modal = document.getElementById('end-or-delete-rec-modal');
  if (modal) {
    modal.style.display = 'flex';
    if (typeof announceNVDA === 'function') {
      announceNVDA(`Dauerauftrag ${rec.name || rec.category} beenden oder löschen geöffnet.`);
    }
  }
}

function closeEndOrDeleteRecModal() {
  const modal = document.getElementById('end-or-delete-rec-modal');
  if (modal) modal.style.display = 'none';
}

async function confirmEndRecurring() {
  const idInput = document.getElementById('end-or-delete-rec-id');
  if (!idInput) return;
  const recId = idInput.value;
  const rec = (appState.recurring || []).find(r => r.id === recId);
  if (!rec) return;

  const today = new Date();
  rec.endYear = today.getFullYear();
  rec.endMonth = today.getMonth();

  await saveStateToEncryptedStorage();
  closeEndOrDeleteRecModal();
  renderSettingsRecurringList();
  updateOverview();

  const msg = `Dauerauftrag "${rec.name || rec.category}" zum Monatsende beendet! Alle vergangenen Monate bleiben unverändert erhalten.`;
  if (typeof announceNVDA === 'function') announceNVDA(msg);
  alert(msg);
}

async function confirmHardDeleteRecurring() {
  const idInput = document.getElementById('end-or-delete-rec-id');
  if (!idInput) return;
  const recId = idInput.value;
  closeEndOrDeleteRecModal();
  await deleteRecurring(recId);
}

// ----------------------------------------------------------------------------
// OPTIONALE SPLIT-ZAHLUNG FÜR AUSGABEN
// ----------------------------------------------------------------------------
let expenseSplitRows = [];

function getExpenseSplitAccountOptionsHtml(selectedAccId) {
  ensureAccountsInitialized();
  return appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    const sel = (acc.id === selectedAccId) ? 'selected' : '';
    return `<option value="${escapeHTML(acc.id)}" ${sel}>${escapeHTML(acc.name)}</option>`;
  }).join('');
}

function toggleExpenseSplitPayment() {
  const toggle = document.getElementById('exp-split-toggle');
  const splitSec = document.getElementById('exp-split-section');
  const accGroup = document.getElementById('exp-account-group');
  const singleAcc = document.getElementById('exp-account');
  const isSplit = toggle && toggle.checked;

  if (splitSec) splitSec.style.display = isSplit ? 'block' : 'none';
  if (accGroup) accGroup.style.display = isSplit ? 'none' : 'block';
  if (singleAcc) singleAcc.required = !isSplit;

  if (isSplit) {
    if (!expenseSplitRows || expenseSplitRows.length === 0) {
      initExpenseSplitRows();
    } else {
      renderExpenseSplitRows();
    }
    if (typeof announceNVDA === 'function') {
      announceNVDA('Split-Zahlung aktiviert. Du kannst den Betrag nun auf mehrere Konten aufteilen.');
    }
  } else {
    if (typeof announceNVDA === 'function') {
      announceNVDA('Split-Zahlung deaktiviert. Einfache Kontoauswahl wieder aktiv.');
    }
  }
}

function initExpenseSplitRows() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('exp-amount').value) || 0;
  const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
  const acc2 = appState.accounts[1] ? appState.accounts[1].id : (appState.accounts[0] ? appState.accounts[0].id : 'cash');

  const half = Math.round((totalAmt / 2) * 100) / 100;
  const rest = Math.round((totalAmt - half) * 100) / 100;

  expenseSplitRows = [
    { account: acc1, amount: half > 0 ? half : '' },
    { account: acc2, amount: rest > 0 ? rest : '' }
  ];
  renderExpenseSplitRows();
}

function renderExpenseSplitRows() {
  const container = document.getElementById('exp-split-rows-container');
  if (!container) return;

  container.innerHTML = expenseSplitRows.map((row, idx) => {
    const canRemove = expenseSplitRows.length > 2;
    return `
      <div class="split-row" data-index="${idx}" style="display: flex; gap: 8px; align-items: flex-end; background: #fff; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color, #ccc); flex-wrap: wrap;">
        <div style="flex: 2; min-width: 160px;">
          <label for="exp-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Konto ${idx + 1}:</strong>
          </label>
          <select id="exp-split-acc-${idx}" class="large-select" onchange="onExpenseSplitAccountChange(${idx}, this.value)">
            ${getExpenseSplitAccountOptionsHtml(row.account)}
          </select>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <label for="exp-split-amt-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teilbetrag (€):</strong>
          </label>
          <input type="number" step="0.01" min="0.01" id="exp-split-amt-${idx}" class="large-input" value="${row.amount !== '' ? row.amount : ''}" placeholder="0,00" oninput="onExpenseSplitAmountInput(${idx}, this.value)">
        </div>
        ${canRemove ? `
          <button type="button" class="btn btn-secondary" onclick="removeExpenseSplitRow(${idx})" style="padding: 10px 12px; margin-bottom: 2px; color: #D32F2F;" aria-label="Konto ${idx + 1} entfernen">
            🗑️
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  updateExpenseSplitSummary();
}

function addExpenseSplitRow() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('exp-amount').value) || 0;
  const currentSum = expenseSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = Math.max(0, Math.round((totalAmt - currentSum) * 100) / 100);

  const usedAccs = expenseSplitRows.map(r => r.account);
  const unusedAcc = appState.accounts.find(a => !usedAccs.includes(a.id));
  const newAccId = unusedAcc ? unusedAcc.id : (appState.accounts[0] ? appState.accounts[0].id : 'bank');

  expenseSplitRows.push({
    account: newAccId,
    amount: diff > 0 ? diff : ''
  });

  renderExpenseSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Konto ${expenseSplitRows.length} hinzugefügt.`);
  }
}

function removeExpenseSplitRow(idx) {
  if (expenseSplitRows.length <= 2) return;
  expenseSplitRows.splice(idx, 1);
  renderExpenseSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Konto entfernt. Verbleibend: ${expenseSplitRows.length} Konten.`);
  }
}

function onExpenseSplitAccountChange(idx, newAcc) {
  if (expenseSplitRows[idx]) {
    expenseSplitRows[idx].account = newAcc;
  }
}

function onExpenseSplitAmountInput(idx, val) {
  const amt = parseFloat(val);
  if (expenseSplitRows[idx]) {
    expenseSplitRows[idx].amount = isNaN(amt) ? '' : amt;
  }

  const totalAmt = parseFloat(document.getElementById('exp-amount').value) || 0;
  if (expenseSplitRows.length === 2 && idx === 0 && !isNaN(amt) && totalAmt > amt) {
    const remainder = Math.round((totalAmt - amt) * 100) / 100;
    expenseSplitRows[1].amount = remainder;
    const secondInput = document.getElementById('exp-split-amt-1');
    if (secondInput) secondInput.value = remainder;
  }

  updateExpenseSplitSummary();
}

function updateExpenseSplitSummary() {
  const summaryEl = document.getElementById('exp-split-summary');
  if (!summaryEl) return;

  const totalAmt = parseFloat(document.getElementById('exp-amount').value) || 0;
  const currentSum = expenseSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = Math.round((totalAmt - currentSum) * 100) / 100;

  if (Math.abs(diff) < 0.005 && totalAmt > 0) {
    summaryEl.style.borderColor = '#2E7D32';
    summaryEl.style.color = '#1B5E20';
    summaryEl.style.background = 'rgba(76, 175, 80, 0.1)';
    summaryEl.innerHTML = `🟢 <strong>Vollständig aufgeteilt:</strong> ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)} (Rest: 0,00 €)`;
  } else if (diff > 0) {
    summaryEl.style.borderColor = '#F57C00';
    summaryEl.style.color = '#E65100';
    summaryEl.style.background = 'rgba(255, 152, 0, 0.1)';
    summaryEl.innerHTML = `🟡 <strong>Aufgeteilt:</strong> ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)} (Noch offen: ${formatCurrency(diff)})`;
  } else {
    summaryEl.style.borderColor = '#D32F2F';
    summaryEl.style.color = '#B71C1C';
    summaryEl.style.background = 'rgba(244, 67, 54, 0.1)';
    summaryEl.innerHTML = `🔴 <strong>Überhang:</strong> ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)} (${formatCurrency(Math.abs(diff))} zu viel)`;
  }
}

async function handleAddExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const freq = document.getElementById('exp-frequency').value;
  const account = document.getElementById('exp-account') ? document.getElementById('exp-account').value : 'bank';
  const category = document.getElementById('exp-category').value;
  const subcategory = document.getElementById('exp-subcategory') ? document.getElementById('exp-subcategory').value : '';
  const date = document.getElementById('exp-date').value;
  const desc = document.getElementById('exp-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;
  const isPlanned = (freq === 'planned') || isFuture;

  // Split-Zahlung prüfen
  const splitToggle = document.getElementById('exp-split-toggle');
  const isSplit = splitToggle && splitToggle.checked;
  let splitRowsValid = [];

  if (isSplit) {
    splitRowsValid = expenseSplitRows.filter(r => r.account && parseFloat(r.amount) > 0);
    if (splitRowsValid.length < 2) {
      if (typeof announceNVDA === 'function') announceNVDA('Fehler: Für eine Split-Zahlung müssen mindestens 2 Konten mit Beträgen angegeben werden.', true);
      alert('⚠️ Bitte gib mindestens 2 Konten mit Beträgen für die Aufteilung an.');
      return;
    }
    const splitSum = Math.round(splitRowsValid.reduce((sum, r) => sum + parseFloat(r.amount), 0) * 100) / 100;
    const expectedTotal = Math.round(amount * 100) / 100;
    if (Math.abs(splitSum - expectedTotal) > 0.01) {
      if (typeof announceNVDA === 'function') announceNVDA(`Fehler: Die Summe der Konten (${formatCurrency(splitSum)}) stimmt nicht mit dem Kaufbetrag (${formatCurrency(expectedTotal)}) überein. Differenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`, true);
      alert(`⚠️ Die Summe der aufgeteilten Konten (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamtkaufpreis (${formatCurrency(expectedTotal)}) überein!\n\nDifferenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`);
      return;
    }
  }

  // Startmonat für Daueraufträge
  let recStartYear = selectedYear;
  let recStartMonth = selectedMonth;
  const expStartMonthEl = document.getElementById('exp-start-month');
  if (expStartMonthEl && expStartMonthEl.value && expStartMonthEl.value.includes('-')) {
    const parts = expStartMonthEl.value.split('-');
    recStartYear = parseInt(parts[0], 10);
    recStartMonth = parseInt(parts[1], 10) - 1;
  }

  if (freq === 'installment') {
    const totalInput = document.getElementById('exp-installment-total');
    const downpaymentInput = document.getElementById('exp-installment-downpayment');
    const durValInput = document.getElementById('exp-installment-duration-val');
    const durUnitSelect = document.getElementById('exp-installment-duration-unit');
    const typeSelect = document.getElementById('exp-installment-type');
    const providerSelect = document.getElementById('exp-installment-provider');
    const rateInput = document.getElementById('exp-installment-rate');
    const interestInput = document.getElementById('exp-installment-interest');
    const interestTypeSelect = document.getElementById('exp-installment-interest-type');
    const balloonInput = document.getElementById('exp-installment-balloon');
    const specialRepayInput = document.getElementById('exp-installment-special-repay');
    const pauseAllowedInput = document.getElementById('exp-installment-pause-allowed');
    const firstDueSelect = document.getElementById('exp-installment-first-due');

    const fullTotal = (totalInput && parseFloat(totalInput.value) > 0) ? parseFloat(totalInput.value) : amount;
    const downpayment = Math.min(fullTotal, parseFloat(downpaymentInput ? downpaymentInput.value : 0) || 0);
    const netFinancing = Math.max(0, fullTotal - downpayment);
    const durVal = Math.max(1, parseInt(durValInput.value, 10) || 12);
    const durUnit = durUnitSelect ? durUnitSelect.value : 'months';
    const instType = typeSelect ? typeSelect.value : 'ratenkauf';
    const provider = providerSelect ? providerSelect.value : 'paypal';
    const rateAmount = parseFloat(rateInput.value) || amount;
    const interestVal = interestInput ? (parseFloat(interestInput.value) || 0) : 0;
    const interestType = interestTypeSelect ? interestTypeSelect.value : 'percent';
    const balloon = parseFloat(balloonInput ? balloonInput.value : 0) || 0;
    const specialRepay = specialRepayInput ? specialRepayInput.checked : true;
    const pauseAllowed = pauseAllowedInput ? pauseAllowedInput.checked : false;
    const firstDue = firstDueSelect ? firstDueSelect.value : 'now';

    let interestSum = 0;
    if (interestVal > 0 && instType !== 'finanzierung_0') {
      if (interestType === 'euro') interestSum = interestVal;
      else {
        let yf = durVal / 12;
        if (durUnit === 'weeks') yf = durVal / 52;
        else if (durUnit === 'days') yf = durVal / 365;
        else if (durUnit === 'years') yf = durVal;
        interestSum = (netFinancing * (interestVal / 100)) * Math.max(0.08, yf);
      }
    }
    const finalFinancedTotal = Math.round((netFinancing + interestSum) * 100) / 100;

    const providerNames = {
      paypal: 'PayPal Ratenzahlung',
      klarna: 'Klarna Ratenkauf',
      amazon: 'Amazon Raten',
      santander: 'Santander BestCredit',
      targobank: 'Targobank Ratenkredit',
      consors: 'Consors Finanz',
      hausbank: 'Bankkredit Hausbank',
      apple_mediamarkt: 'Finanzierung',
      privat: 'Privates Darlehen',
      sonstiger: 'Ratenfinanzierung'
    };
    const provLabel = providerNames[provider] || 'Ratenzahlung';

    // 1. Wenn Anzahlung geleistet wurde: Anzahlung buchen
    if (downpayment > 0) {
      appState.transactions.push({
        id: `tx_down_${Date.now()}`,
        type: 'expense',
        account: account,
        amount: downpayment,
        category: category,
        subcategory: subcategory,
        description: desc ? `${desc} (${provLabel}, Anzahlung)` : `${provLabel} Anzahlung`,
        isPlanned: false,
        date: date
      });
    }

    // 2. Erste Rate sofort buchen (falls nicht Zahlpause gewählt)
    if (firstDue === 'now') {
      const txDesc = desc ? `${desc} (${provLabel}, Rate 1 von ${durVal})` : `${provLabel} (Rate 1 von ${durVal})`;
      appState.transactions.push({
        id: `tx_${Date.now()}`,
        type: 'expense',
        account: account,
        amount: rateAmount,
        category: category,
        subcategory: subcategory,
        description: txDesc,
        isPlanned: isPlanned,
        date: date
      });
    }

    // 3. Ratenplan anlegen
    const day = parseInt(date.split('-')[2], 10) || 1;
    let recInterval = 'monthly';
    if (durUnit === 'weeks') recInterval = 'weekly';
    else if (durUnit === 'years') recInterval = 'yearly';

    const paidCount = firstDue === 'now' ? 1 : 0;
    const remainingSum = Math.max(0, finalFinancedTotal - (paidCount * rateAmount));

    appState.recurring.push({
      id: `rec_inst_${Date.now()}`,
      type: 'expense',
      account: account,
      amount: rateAmount,
      category: category,
      subcategory: subcategory,
      name: desc ? `${desc} (${provLabel})` : `${provLabel} ${category}`,
      interval: recInterval,
      day: day,
      startYear: recStartYear,
      startMonth: recStartMonth,
      isInstallment: true,
      installmentType: instType,
      installmentProvider: provider,
      installmentTotal: finalFinancedTotal,
      installmentDownpayment: downpayment,
      installmentBalloon: balloon,
      installmentSpecialRepay: specialRepay,
      installmentPauseAllowed: pauseAllowed,
      installmentFirstDue: firstDue,
      installmentInterest: interestSum,
      installmentTotalMonths: durVal,
      installmentDurationUnit: durUnit,
      installmentPaidMonths: paidCount,
      installmentRemaining: remainingSum,
      active: true
    });

    announceNVDA(`${provLabel} über ${formatCurrency(finalFinancedTotal)} angelegt!`);
  } else if (['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('exp-rec-day').value, 10) || 1;
    const weekday = document.getElementById('exp-rec-weekday') ? parseInt(document.getElementById('exp-rec-weekday').value, 10) : 5;

    // Vertrags-, Testphasen- & Rabatt-Daten erfassen
    const trialToggle = document.getElementById('exp-rec-trial-toggle');
    const isTrial = trialToggle ? trialToggle.checked : false;
    let trialData = {};
    if (isTrial) {
      const u = document.getElementById('exp-rec-trial-unit').value || 'days';
      const dur = parseInt(document.getElementById('exp-rec-trial-duration').value, 10) || 14;
      const endD = calculateTrialEndDate(u, dur);
      trialData = {
        trialActive: true,
        trialUnit: u,
        trialDuration: dur,
        trialStartDate: new Date().toISOString().split('T')[0],
        trialEndDate: endD
      };
    }

    const discountToggle = document.getElementById('exp-rec-discount-toggle');
    const isDiscount = discountToggle ? discountToggle.checked : false;
    let discountData = {};
    if (isDiscount) {
      const discAmt = parseFloat(document.getElementById('exp-rec-discount-amount').value) || 0;
      const discMonths = parseInt(document.getElementById('exp-rec-discount-months').value, 10) || 12;
      const regAmt = parseFloat(document.getElementById('exp-rec-discount-regular').value) || amount;
      const startY = recStartYear !== undefined ? recStartYear : new Date().getFullYear();
      const startM = recStartMonth !== undefined ? recStartMonth : new Date().getMonth();
      const endObj = addMonthsToYearMonth(startY, startM, discMonths - 1);
      discountData = {
        discountActive: true,
        discountAmount: discAmt,
        discountMonths: discMonths,
        discountEndYear: endObj.year,
        discountEndMonth: endObj.month,
        regularAmount: regAmt
      };
    }

    const contractToggle = document.getElementById('exp-rec-contract-toggle');
    const hasContract = contractToggle ? contractToggle.checked : false;
    let contractData = {};
    if (hasContract) {
      contractData = {
        hasContractDetails: true,
        contractNumber: (document.getElementById('exp-rec-contract-number').value || '').trim(),
        minTermDate: document.getElementById('exp-rec-min-term').value || '',
        noticePeriod: (document.getElementById('exp-rec-notice-period').value || '').trim(),
        hotline: (document.getElementById('exp-rec-hotline').value || '').trim(),
        contractNotes: (document.getElementById('exp-rec-notes').value || '').trim()
      };
    }
    
    if (isSplit) {
      const splitId = `split_rec_${Date.now()}`;
      splitRowsValid.forEach((row, idx) => {
        const rowAmt = parseFloat(row.amount);
        const accName = formatAccountName(row.account);
        const partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} von ${accName})`;
        const recName = desc ? `${desc} ${partText}` : `${category} ${partText}`;

        appState.recurring.push({
          id: `rec_${Date.now()}_${idx}`,
          splitId: splitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          type: 'expense',
          account: row.account,
          amount: rowAmt,
          category: category,
          subcategory: subcategory,
          name: recName,
          interval: freq,
          day: day,
          weekday: weekday,
          startYear: recStartYear,
          startMonth: recStartMonth,
          active: true,
          ...trialData,
          ...discountData,
          ...contractData
        });
      });
      announceNVDA(`Dauerhafte Ausgabe ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Konten gespeichert!`);
    } else {
      appState.recurring.push({
        id: `rec_${Date.now()}`,
        type: 'expense',
        account: account,
        amount: amount,
        category: category,
        subcategory: subcategory,
        name: desc || (subcategory ? `${category} (${subcategory})` : category),
        interval: freq,
        day: day,
        weekday: weekday,
        startYear: recStartYear,
        startMonth: recStartMonth,
        active: true,
        ...trialData,
        ...discountData,
        ...contractData
      });
      announceNVDA(`Dauerhafte Ausgabe ${category} über ${formatCurrency(amount)} gespeichert!`);
    }
  } else {
    if (isSplit) {
      const splitId = `split_${Date.now()}`;
      splitRowsValid.forEach((row, idx) => {
        const rowAmt = parseFloat(row.amount);
        const accName = formatAccountName(row.account);
        const partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} von ${accName})`;
        const finalDesc = desc ? `${desc} ${partText}` : `Split-Zahlung ${partText}`;

        const splitTx = {
          id: `tx_${Date.now()}_${idx}`,
          splitId: splitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          type: 'expense',
          account: row.account,
          amount: rowAmt,
          category: category,
          subcategory: subcategory,
          description: finalDesc,
          isPlanned: isPlanned,
          date: date
        };
        if (currentExpenseReceipt) {
          splitTx.receipt = JSON.parse(JSON.stringify(currentExpenseReceipt));
        }
        appState.transactions.push(splitTx);
      });
      announceNVDA(`Ausgabe ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Konten ${isPlanned ? 'geplant' : 'gebucht'}!`);
    } else {
      // Auto-Deckung (wie bei PayPal):
      // REGEL: Nur belasten, wenn auf dem Primärkonto wirklich nicht genug Geld vorhanden ist!
      const chosenAcc = (appState.accounts || []).find(a => a.id === account);
      let autoCoverMsg = '';
      if (chosenAcc && chosenAcc.hasBackupAccount && chosenAcc.backupAccountId && !isPlanned) {
        const balancesBefore = calculateBalancesUpToDate(date);
        const curAvail = balancesBefore[account] !== undefined ? balancesBefore[account] : 0;
        if (curAvail < amount) {
          const shortfall = Math.round((amount - Math.max(0, curAvail)) * 100) / 100;
          if (shortfall > 0) {
            const backupAcc = (appState.accounts || []).find(a => a.id === chosenAcc.backupAccountId);
            if (backupAcc) {
              appState.transactions.push({
                id: `tx_cov_${Date.now()}`,
                type: 'transfer',
                fromAccount: backupAcc.id,
                toAccount: account,
                amount: shortfall,
                date: date,
                description: `Automatische Deckung für ${category} (${chosenAcc.name} hatte nur ${formatCurrency(Math.max(0, curAvail))})`
              });
              autoCoverMsg = ` (davon ${formatCurrency(shortfall)} automatisch über ${backupAcc.name} gedeckt)`;
            }
          }
        }
      }

      const newTx = {
        id: `tx_${Date.now()}`,
        type: 'expense',
        account: account,
        amount: amount,
        category: category,
        subcategory: subcategory,
        description: desc,
        isPlanned: isPlanned,
        date: date
      };
      if (currentExpenseReceipt) {
        newTx.receipt = JSON.parse(JSON.stringify(currentExpenseReceipt));
      }
      appState.transactions.push(newTx);
      announceNVDA(`Ausgabe ${category} über ${formatCurrency(amount)} ${isPlanned ? 'geplant' : 'gebucht'}${autoCoverMsg}!`);
    }
  }

  await saveStateToEncryptedStorage();
  document.getElementById('form-add-expense').reset();
  document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
  const splitToggleReset = document.getElementById('exp-split-toggle');
  if (splitToggleReset && splitToggleReset.checked) {
    splitToggleReset.checked = false;
    toggleExpenseSplitPayment();
  }
  const trialReset = document.getElementById('exp-rec-trial-toggle');
  if (trialReset && trialReset.checked) {
    trialReset.checked = false;
    toggleTrialSection('exp');
  }
  const discountReset = document.getElementById('exp-rec-discount-toggle');
  if (discountReset && discountReset.checked) {
    discountReset.checked = false;
    toggleDiscountSection('exp');
  }
  const contractReset = document.getElementById('exp-rec-contract-toggle');
  if (contractReset && contractReset.checked) {
    contractReset.checked = false;
    toggleContractSection('exp');
  }
  currentExpenseReceipt = null;
  renderReceiptPreview('exp');
  toggleExpenseFrequencyFields();
  updateOverview();
  switchView('overview');
}

// ----------------------------------------------------------------------------
// OPTIONALE SPLIT-EINZAHLUNG FÜR EINNAHMEN
// ----------------------------------------------------------------------------
let incomeSplitRows = [];

function getIncomeSplitAccountOptionsHtml(selectedAccId) {
  ensureAccountsInitialized();
  return appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    const sel = (acc.id === selectedAccId) ? 'selected' : '';
    return `<option value="${escapeHTML(acc.id)}" ${sel}>${escapeHTML(acc.name)}</option>`;
  }).join('');
}

function toggleIncomeSplitPayment() {
  const toggle = document.getElementById('inc-split-toggle');
  const splitSec = document.getElementById('inc-split-section');
  const accGroup = document.getElementById('inc-account-group');
  const singleAcc = document.getElementById('inc-account');
  const isSplit = toggle && toggle.checked;

  if (splitSec) splitSec.style.display = isSplit ? 'block' : 'none';
  if (accGroup) accGroup.style.display = isSplit ? 'none' : 'block';
  if (singleAcc) singleAcc.required = !isSplit;

  if (isSplit) {
    if (!incomeSplitRows || incomeSplitRows.length === 0) {
      initIncomeSplitRows();
    } else {
      renderIncomeSplitRows();
    }
    if (typeof announceNVDA === 'function') {
      announceNVDA('Split-Einzahlung aktiviert. Du kannst den Betrag nun auf mehrere Konten aufteilen.');
    }
  } else {
    if (typeof announceNVDA === 'function') {
      announceNVDA('Split-Einzahlung deaktiviert. Einfache Kontoauswahl wieder aktiv.');
    }
  }
}

function initIncomeSplitRows() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('inc-amount').value) || 0;
  const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
  const acc2 = appState.accounts[1] ? appState.accounts[1].id : (appState.accounts[0] ? appState.accounts[0].id : 'cash');

  const half = Math.round((totalAmt / 2) * 100) / 100;
  const rest = Math.round((totalAmt - half) * 100) / 100;

  incomeSplitRows = [
    { account: acc1, amount: half > 0 ? half : '' },
    { account: acc2, amount: rest > 0 ? rest : '' }
  ];
  renderIncomeSplitRows();
}

function renderIncomeSplitRows() {
  const container = document.getElementById('inc-split-rows-container');
  if (!container) return;

  container.innerHTML = incomeSplitRows.map((row, idx) => {
    const canRemove = incomeSplitRows.length > 2;
    return `
      <div class="split-row" data-index="${idx}" style="display: flex; gap: 8px; align-items: flex-end; background: #fff; padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color, #ccc); flex-wrap: wrap;">
        <div style="flex: 2; min-width: 160px;">
          <label for="inc-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Ziel-Konto ${idx + 1}:</strong>
          </label>
          <select id="inc-split-acc-${idx}" class="large-select" onchange="onIncomeSplitAccountChange(${idx}, this.value)">
            ${getIncomeSplitAccountOptionsHtml(row.account)}
          </select>
        </div>
        <div style="flex: 1; min-width: 120px;">
          <label for="inc-split-amt-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teilbetrag (€):</strong>
          </label>
          <input type="number" step="0.01" min="0.01" id="inc-split-amt-${idx}" class="large-input" value="${row.amount !== '' ? row.amount : ''}" placeholder="0,00" oninput="onIncomeSplitAmountInput(${idx}, this.value)">
        </div>
        ${canRemove ? `
          <button type="button" class="btn btn-secondary" onclick="removeIncomeSplitRow(${idx})" style="padding: 10px 12px; margin-bottom: 2px; color: #D32F2F;" aria-label="Ziel-Konto ${idx + 1} entfernen">
            🗑️
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  updateIncomeSplitSummary();
}

function addIncomeSplitRow() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('inc-amount').value) || 0;
  const currentSum = incomeSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = Math.max(0, Math.round((totalAmt - currentSum) * 100) / 100);

  const usedAccs = incomeSplitRows.map(r => r.account);
  const unusedAcc = appState.accounts.find(a => !usedAccs.includes(a.id));
  const newAccId = unusedAcc ? unusedAcc.id : (appState.accounts[0] ? appState.accounts[0].id : 'bank');

  incomeSplitRows.push({
    account: newAccId,
    amount: diff > 0 ? diff : ''
  });

  renderIncomeSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Ziel-Konto ${incomeSplitRows.length} hinzugefügt.`);
  }
}

function removeIncomeSplitRow(idx) {
  if (incomeSplitRows.length <= 2) return;
  incomeSplitRows.splice(idx, 1);
  renderIncomeSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Konto entfernt. Verbleibend: ${incomeSplitRows.length} Konten.`);
  }
}

function onIncomeSplitAccountChange(idx, newAcc) {
  if (incomeSplitRows[idx]) {
    incomeSplitRows[idx].account = newAcc;
  }
}

function onIncomeSplitAmountInput(idx, val) {
  const amt = parseFloat(val);
  if (incomeSplitRows[idx]) {
    incomeSplitRows[idx].amount = isNaN(amt) ? '' : amt;
  }

  const totalAmt = parseFloat(document.getElementById('inc-amount').value) || 0;
  if (incomeSplitRows.length === 2 && idx === 0 && !isNaN(amt) && totalAmt > amt) {
    const remainder = Math.round((totalAmt - amt) * 100) / 100;
    incomeSplitRows[1].amount = remainder;
    const secondInput = document.getElementById('inc-split-amt-1');
    if (secondInput) secondInput.value = remainder;
  }

  updateIncomeSplitSummary();
}

function updateIncomeSplitSummary() {
  const summaryEl = document.getElementById('inc-split-summary');
  if (!summaryEl) return;

  const totalAmt = parseFloat(document.getElementById('inc-amount').value) || 0;
  const currentSum = incomeSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = Math.round((totalAmt - currentSum) * 100) / 100;

  if (Math.abs(diff) < 0.005 && totalAmt > 0) {
    summaryEl.style.borderColor = '#2E7D32';
    summaryEl.style.color = '#1B5E20';
    summaryEl.style.background = 'rgba(76, 175, 80, 0.1)';
    summaryEl.innerHTML = `🟢 <strong>Vollständig aufgeteilt:</strong> ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)} (Rest: 0,00 €)`;
  } else if (diff > 0) {
    summaryEl.style.borderColor = '#F57C00';
    summaryEl.style.color = '#E65100';
    summaryEl.style.background = 'rgba(255, 152, 0, 0.1)';
    summaryEl.innerHTML = `🟡 <strong>Aufgeteilt:</strong> ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)} (Noch offen: ${formatCurrency(diff)})`;
  } else {
    summaryEl.style.borderColor = '#D32F2F';
    summaryEl.style.color = '#B71C1C';
    summaryEl.style.background = 'rgba(244, 67, 54, 0.1)';
    summaryEl.innerHTML = `🔴 <strong>Überhang:</strong> ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)} (${formatCurrency(Math.abs(diff))} zu viel)`;
  }
}

async function handleAddIncome(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const freq = document.getElementById('inc-frequency').value;
  const account = document.getElementById('inc-account') ? document.getElementById('inc-account').value : 'bank';
  const category = document.getElementById('inc-category').value;
  const subcategory = document.getElementById('inc-subcategory') ? document.getElementById('inc-subcategory').value : '';
  const date = document.getElementById('inc-date').value;
  const desc = document.getElementById('inc-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;
  const isPlanned = (freq === 'planned') || isFuture;

  // Split-Einzahlung prüfen
  const splitToggle = document.getElementById('inc-split-toggle');
  const isSplit = splitToggle && splitToggle.checked;
  let splitRowsValid = [];

  if (isSplit) {
    splitRowsValid = incomeSplitRows.filter(r => r.account && parseFloat(r.amount) > 0);
    if (splitRowsValid.length < 2) {
      if (typeof announceNVDA === 'function') announceNVDA('Fehler: Für eine Split-Einzahlung müssen mindestens 2 Konten mit Beträgen angegeben werden.', true);
      alert('⚠️ Bitte gib mindestens 2 Konten mit Beträgen für die Aufteilung der Einnahme an.');
      return;
    }
    const splitSum = Math.round(splitRowsValid.reduce((sum, r) => sum + parseFloat(r.amount), 0) * 100) / 100;
    const expectedTotal = Math.round(amount * 100) / 100;
    if (Math.abs(splitSum - expectedTotal) > 0.01) {
      if (typeof announceNVDA === 'function') announceNVDA(`Fehler: Die Summe der Konten (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamteinnahmebetrag (${formatCurrency(expectedTotal)}) überein. Differenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`, true);
      alert(`⚠️ Die Summe der aufgeteilten Konten (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamteinnahmebetrag (${formatCurrency(expectedTotal)}) überein!\n\nDifferenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`);
      return;
    }
  }

  if (['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('inc-rec-day').value, 10) || 1;
    const weekday = document.getElementById('inc-rec-weekday') ? parseInt(document.getElementById('inc-rec-weekday').value, 10) : 5;
    
    let recStartYear = selectedYear;
    let recStartMonth = selectedMonth;
    const incStartMonthEl = document.getElementById('inc-start-month');
    if (incStartMonthEl && incStartMonthEl.value && incStartMonthEl.value.includes('-')) {
      const parts = incStartMonthEl.value.split('-');
      recStartYear = parseInt(parts[0], 10);
      recStartMonth = parseInt(parts[1], 10) - 1;
    }

    if (isSplit) {
      const splitId = `split_rec_inc_${Date.now()}`;
      splitRowsValid.forEach((row, idx) => {
        const rowAmt = parseFloat(row.amount);
        const accName = formatAccountName(row.account);
        const partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} auf ${accName})`;
        const recName = desc ? `${desc} ${partText}` : `${category} ${partText}`;

        appState.recurring.push({
          id: `rec_${Date.now()}_${idx}`,
          splitId: splitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          type: 'income',
          account: row.account,
          amount: rowAmt,
          category: category,
          subcategory: subcategory,
          name: recName,
          interval: freq,
          day: day,
          weekday: weekday,
          startYear: recStartYear,
          startMonth: recStartMonth,
          active: true
        });
      });
      announceNVDA(`Dauerhafte Einnahme ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Konten gespeichert!`);
    } else {
      appState.recurring.push({
        id: `rec_${Date.now()}`,
        type: 'income',
        account: account,
        amount: amount,
        category: category,
        subcategory: subcategory,
        name: desc || (subcategory ? `${category} (${subcategory})` : category),
        interval: freq,
        day: day,
        weekday: weekday,
        startYear: recStartYear,
        startMonth: recStartMonth,
        active: true
      });
      announceNVDA(`Dauerhafte Einnahme ${category} über ${formatCurrency(amount)} gespeichert!`);
    }
  } else {
    if (isSplit) {
      const splitId = `split_inc_${Date.now()}`;
      splitRowsValid.forEach((row, idx) => {
        const rowAmt = parseFloat(row.amount);
        const accName = formatAccountName(row.account);
        const partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} auf ${accName})`;
        const finalDesc = desc ? `${desc} ${partText}` : `Split-Einzahlung ${partText}`;

        const splitTx = {
          id: `tx_${Date.now()}_${idx}`,
          splitId: splitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          type: 'income',
          account: row.account,
          amount: rowAmt,
          category: category,
          subcategory: subcategory,
          description: finalDesc,
          isPlanned: isPlanned,
          date: date
        };
        if (currentIncomeReceipt) {
          splitTx.receipt = JSON.parse(JSON.stringify(currentIncomeReceipt));
        }
        appState.transactions.push(splitTx);
      });
      announceNVDA(`Einnahme ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Konten ${isPlanned ? 'geplant' : 'gebucht'}!`);
    } else {
      const newTx = {
        id: `tx_${Date.now()}`,
        type: 'income',
        account: account,
        amount: amount,
        category: category,
        subcategory: subcategory,
        description: desc,
        isPlanned: isPlanned,
        date: date
      };
      if (currentIncomeReceipt) {
        newTx.receipt = JSON.parse(JSON.stringify(currentIncomeReceipt));
      }
      appState.transactions.push(newTx);
      announceNVDA(`Einnahme ${category} über ${formatCurrency(amount)} ${isPlanned ? 'geplant' : 'gebucht'}!`);
    }
  }

  await saveStateToEncryptedStorage();
  document.getElementById('form-add-income').reset();
  document.getElementById('inc-date').value = new Date().toISOString().split('T')[0];
  const splitToggleReset = document.getElementById('inc-split-toggle');
  if (splitToggleReset && splitToggleReset.checked) {
    splitToggleReset.checked = false;
    toggleIncomeSplitPayment();
  }
  currentIncomeReceipt = null;
  renderReceiptPreview('inc');
  toggleIncomeFrequencyFields();
  updateOverview();
  switchView('overview');
}

async function handleAddTransfer(e) {
  e.preventDefault();
  ensureSavingPotsInitialized();

  const amount = parseFloat(document.getElementById('trf-amount').value);
  const freq = document.getElementById('trf-frequency').value;
  const fromAccount = document.getElementById('trf-from').value;
  const toAccount = document.getElementById('trf-to').value;
  const todayStr = new Date().toISOString().split('T')[0];
  const curDate = new Date();
  const date = document.getElementById('trf-date').value || todayStr;
  const desc = document.getElementById('trf-desc').value.trim();

  const fromPotId = document.getElementById('trf-from-pot') ? document.getElementById('trf-from-pot').value : '';
  const toPotId = document.getElementById('trf-to-pot') ? document.getElementById('trf-to-pot').value : '';

  if (isNaN(amount) || amount <= 0 || (fromAccount === toAccount && !fromPotId && !toPotId)) {
    announceNVDA('Fehler: Quelle und Zielkonto müssen unterschiedlich sein.', true);
    alert('⚠️ Bitte wähle zwei unterschiedliche Konten für die Umbuchung aus (Quelle und Ziel dürfen nicht identisch sein).');
    return;
  }

  let potNoteParts = [];

  // 1. Wenn Geld aus Spartopf entnommen wird
  let fromPotObj = null;
  if (fromPotId) {
    fromPotObj = (appState.savingPots || []).find(p => p.id === fromPotId);
    if (fromPotObj) {
      fromPotObj.currentAmount = Math.max(0, Math.round((Number(fromPotObj.currentAmount || 0) - amount) * 100) / 100);
      potNoteParts.push(`aus Spartopf "${fromPotObj.name}"`);
    }
  }

  // 2. Wenn Geld in Spartopf eingezahlt wird
  let toPotObj = null;
  if (toPotId) {
    toPotObj = (appState.savingPots || []).find(p => p.id === toPotId);
    if (toPotObj) {
      toPotObj.currentAmount = Math.round((Number(toPotObj.currentAmount || 0) + amount) * 100) / 100;
      potNoteParts.push(`in Spartopf "${toPotObj.name}"`);
    }
  }

  const potInfo = potNoteParts.length > 0 ? ` (${potNoteParts.join(', ')})` : '';

  const isFuture = date > todayStr;
  const isPlanned = (freq === 'planned') || isFuture;

  if (['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('trf-rec-day').value, 10) || 1;
    const weekday = document.getElementById('trf-rec-weekday') ? parseInt(document.getElementById('trf-rec-weekday').value, 10) : 5;
    
    let recStartYear = curDate.getFullYear();
    let recStartMonth = curDate.getMonth();
    const trfStartMonthEl = document.getElementById('trf-start-month');
    if (trfStartMonthEl && trfStartMonthEl.value && trfStartMonthEl.value.includes('-')) {
      const parts = trfStartMonthEl.value.split('-');
      recStartYear = parseInt(parts[0], 10);
      recStartMonth = parseInt(parts[1], 10) - 1;
    }

    appState.recurring.push({
      id: `rec_${Date.now()}`,
      type: 'transfer',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      category: 'Umbuchung & Sparplan',
      name: desc ? `${desc}${potInfo}` : `Sparplan ${formatAccountName(fromAccount)} -> ${formatAccountName(toAccount)}${potInfo}`,
      interval: freq,
      day: day,
      weekday: weekday,
      startYear: recStartYear,
      startMonth: recStartMonth,
      targetPotId: toPotId || '',
      sourcePotId: fromPotId || '',
      active: true
    });
    announceNVDA(`Dauerhafter Sparplan über ${formatCurrency(amount)}${potInfo} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'transfer',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      category: 'Umbuchung & Sparplan',
      description: desc ? `${desc}${potInfo}` : `Umbuchung ${formatAccountName(fromAccount)} -> ${formatAccountName(toAccount)}${potInfo}`,
      isPlanned: isPlanned,
      date: date
    });
    announceNVDA(`Umbuchung über ${formatCurrency(amount)}${potInfo} ${isPlanned ? 'geplant' : 'gebucht'}!`);
  }

  await saveStateToEncryptedStorage();
  document.getElementById('form-add-transfer').reset();
  document.getElementById('trf-date').value = new Date().toISOString().split('T')[0];
  toggleTransferFrequencyFields();
  renderSavingPotsList();
  renderWishlist();
  updateOverview();
  switchView('overview');
}

// ----------------------------------------------------------------------------
// 12. MODAL DIALOGE & VOLLSTÄNDIGE BEARBEITUNG
// ----------------------------------------------------------------------------
function populateEditModalCategories(type, selectedMain, selectedSub) {
  const catSection = document.getElementById('edit-tx-category-section');
  const mainSel = document.getElementById('edit-tx-category');
  const subSel = document.getElementById('edit-tx-subcategory');
  if (!mainSel || !subSel) return;

  if (type === 'transfer') {
    if (catSection) catSection.style.display = 'none';
    return;
  }
  if (catSection) catSection.style.display = 'block';

  const db = CATEGORIES_DB[type] || CATEGORIES_DB['exp'];
  const mainCats = Object.keys(db);

  mainSel.innerHTML = mainCats.map(cat => '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>').join('');
  if (selectedMain && db[selectedMain]) {
    mainSel.value = selectedMain;
  }
  applySymbolsToOptions(mainSel);

  onEditMainCategoryChange(selectedSub);
}

function onEditMainCategoryChange(preferredSub) {
  const type = document.getElementById('edit-tx-type').value;
  const mainSel = document.getElementById('edit-tx-category');
  const subSel = document.getElementById('edit-tx-subcategory');
  if (!mainSel || !subSel) return;

  const currentType = (type === 'income') ? 'inc' : 'exp';
  const selectedMain = mainSel.value;
  const db = CATEGORIES_DB[currentType];
  const subs = (db && db[selectedMain]) ? db[selectedMain] : ['Gesamt / Allgemein'];

  subSel.innerHTML = subs.map(sub => '<option value="' + escapeHTML(sub) + '">' + escapeHTML(sub) + '</option>').join('');
  if (preferredSub && subs.includes(preferredSub)) {
    subSel.value = preferredSub;
  }
  applySymbolsToOptions(subSel);
}

function onEditTxTypeChange() {
  const type = document.getElementById('edit-tx-type').value;
  const singleAcc = document.getElementById('edit-tx-single-account-group');
  const trfAcc = document.getElementById('edit-tx-transfer-accounts-group');
  const catSection = document.getElementById('edit-tx-category-section');

  if (type === 'transfer') {
    if (singleAcc) singleAcc.style.display = 'none';
    if (trfAcc) trfAcc.style.display = 'grid';
    if (catSection) catSection.style.display = 'none';
  } else {
    if (singleAcc) singleAcc.style.display = 'block';
    if (trfAcc) trfAcc.style.display = 'none';
    if (catSection) catSection.style.display = 'block';
    const catType = (type === 'income') ? 'inc' : 'exp';
    populateEditModalCategories(catType);
  }
}

function handleEditCategorySearch() {
  const type = document.getElementById('edit-tx-type').value;
  if (type === 'transfer') return;
  const catType = (type === 'income') ? 'inc' : 'exp';
  const input = document.getElementById('edit-tx-cat-search');
  if (!input) return;
  const query = input.value.trim().toLowerCase();
  if (!query) return;

  const db = CATEGORIES_DB[catType];
  let matchedMain = null;
  let matchedSub = null;

  for (const [mainCat, subs] of Object.entries(db)) {
    const subMatch = subs.find(s => s.toLowerCase().includes(query));
    if (subMatch) {
      matchedMain = mainCat;
      matchedSub = subMatch;
      break;
    }
  }

  if (!matchedMain) {
    for (const mainCat of Object.keys(db)) {
      if (mainCat.toLowerCase().includes(query)) {
        matchedMain = mainCat;
        matchedSub = db[mainCat][0] || 'Gesamt / Allgemein';
        break;
      }
    }
  }

  if (matchedMain) {
    const mainSel = document.getElementById('edit-tx-category');
    if (mainSel) {
      mainSel.value = matchedMain;
      onEditMainCategoryChange(matchedSub);
      announceNVDA('Kategorie gewählt: ' + matchedMain + ', Unterkategorie: ' + matchedSub);
    }
  }
}

function openEditModal(txId) {
  const tx = appState.transactions.find(t => t.id === txId);
  if (!tx) return;

  document.getElementById('edit-tx-id').value = tx.id;
  document.getElementById('edit-tx-amount').value = tx.amount;
  document.getElementById('edit-tx-date').value = tx.date;
  document.getElementById('edit-tx-type').value = tx.type || 'expense';
  document.getElementById('edit-tx-planned').value = tx.isPlanned ? 'true' : 'false';

  if (tx.type === 'transfer') {
    document.getElementById('edit-tx-from').value = tx.fromAccount || 'bank';
    document.getElementById('edit-tx-to').value = tx.toAccount || 'savings';
  } else {
    document.getElementById('edit-tx-account').value = tx.account || 'bank';
  }

  onEditTxTypeChange();

  if (tx.type !== 'transfer') {
    const catType = (tx.type === 'income') ? 'inc' : 'exp';
    populateEditModalCategories(catType, tx.category, tx.subcategory);
  }

  document.getElementById('edit-tx-desc').value = tx.description || '';

  currentEditReceipt = tx.receipt ? JSON.parse(JSON.stringify(tx.receipt)) : null;
  renderReceiptPreview('edit');

  const modal = document.getElementById('edit-tx-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-tx-amount').focus();
  announceNVDA('Buchung bearbeiten geöffnet.');
}

function closeEditModal() {
  currentEditReceipt = null;
  renderReceiptPreview('edit');
  const modal = document.getElementById('edit-tx-modal');
  if (modal) modal.style.display = 'none';
}

async function saveEditedTransaction(e) {
  e.preventDefault();
  const id = document.getElementById('edit-tx-id').value;
  const tx = appState.transactions.find(t => t.id === id);
  if (!tx) return;

  const type = document.getElementById('edit-tx-type').value;
  const date = document.getElementById('edit-tx-date').value;
  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;

  tx.type = type;
  tx.amount = parseFloat(document.getElementById('edit-tx-amount').value);
  tx.date = date;
  
  const plannedVal = document.getElementById('edit-tx-planned').value;
  tx.isPlanned = (plannedVal === 'true') || isFuture;

  if (type === 'transfer') {
    tx.fromAccount = document.getElementById('edit-tx-from').value;
    tx.toAccount = document.getElementById('edit-tx-to').value;
    tx.account = undefined;
    tx.category = 'Umbuchung';
    tx.subcategory = '';
  } else {
    tx.account = document.getElementById('edit-tx-account').value;
    tx.fromAccount = undefined;
    tx.toAccount = undefined;
    tx.category = document.getElementById('edit-tx-category').value;
    tx.subcategory = document.getElementById('edit-tx-subcategory').value;
  }

  tx.description = document.getElementById('edit-tx-desc').value.trim();

  if (currentEditReceipt) {
    tx.receipt = currentEditReceipt;
  } else {
    delete tx.receipt;
  }
  currentEditReceipt = null;
  renderReceiptPreview('edit');

  await saveStateToEncryptedStorage();
  closeEditModal();
  updateOverview();
  announceNVDA('Buchung erfolgreich aktualisiert!');
}

async function deleteTransaction(txId) {
  const idx = appState.transactions.findIndex(t => t.id === txId);
  if (idx !== -1) {
    const deleted = appState.transactions.splice(idx, 1)[0];
    await saveStateToEncryptedStorage();
    updateOverview();
    announceNVDA(`Buchung über ${formatCurrency(deleted.amount)} gelöscht.`);
  }
}

function populateEditRecCategories(type, selectedMain, selectedSub) {
  const catSection = document.getElementById('edit-rec-category-section');
  const mainSel = document.getElementById('edit-rec-category');
  const subSel = document.getElementById('edit-rec-subcategory');
  if (!mainSel || !subSel) return;

  if (type === 'transfer') {
    if (catSection) catSection.style.display = 'none';
    return;
  }
  if (catSection) catSection.style.display = 'block';

  const catType = (type === 'income') ? 'inc' : 'exp';
  const db = CATEGORIES_DB[catType] || CATEGORIES_DB['exp'];
  const mainCats = Object.keys(db);

  mainSel.innerHTML = mainCats.map(cat => '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>').join('');
  if (selectedMain && db[selectedMain]) {
    mainSel.value = selectedMain;
  }
  applySymbolsToOptions(mainSel);

  onEditRecMainCategoryChange(selectedSub);
}

function onEditRecMainCategoryChange(preferredSub) {
  const type = document.getElementById('edit-rec-type').value;
  const mainSel = document.getElementById('edit-rec-category');
  const subSel = document.getElementById('edit-rec-subcategory');
  if (!mainSel || !subSel) return;

  const currentType = (type === 'income') ? 'inc' : 'exp';
  const selectedMain = mainSel.value;
  const db = CATEGORIES_DB[currentType];
  const subs = (db && db[selectedMain]) ? db[selectedMain] : ['Gesamt / Allgemein'];

  subSel.innerHTML = subs.map(sub => '<option value="' + escapeHTML(sub) + '">' + escapeHTML(sub) + '</option>').join('');
  if (preferredSub && subs.includes(preferredSub)) {
    subSel.value = preferredSub;
  }
  applySymbolsToOptions(subSel);
}

function onEditRecTypeChange() {
  const type = document.getElementById('edit-rec-type').value;
  const singleAcc = document.getElementById('edit-rec-single-account-group');
  const trfAcc = document.getElementById('edit-rec-transfer-accounts-group');
  const catSection = document.getElementById('edit-rec-category-section');

  if (type === 'transfer') {
    if (singleAcc) singleAcc.style.display = 'none';
    if (trfAcc) trfAcc.style.display = 'grid';
    if (catSection) catSection.style.display = 'none';
  } else {
    if (singleAcc) singleAcc.style.display = 'block';
    if (trfAcc) trfAcc.style.display = 'none';
    if (catSection) catSection.style.display = 'block';
    populateEditRecCategories(type);
  }
}

function onEditRecIntervalChange() {
  const interval = document.getElementById('edit-rec-interval').value;
  const dayGroup = document.getElementById('edit-rec-day-group');
  const weekdayGroup = document.getElementById('edit-rec-weekday-group');
  const yearlyMonthGroup = document.getElementById('edit-rec-yearly-month-group');

  if (dayGroup) dayGroup.style.display = (interval === 'weekly') ? 'none' : 'block';
  if (weekdayGroup) weekdayGroup.style.display = (interval === 'weekly') ? 'block' : 'none';
  if (yearlyMonthGroup) yearlyMonthGroup.style.display = (interval === 'yearly') ? 'block' : 'none';
}

function openEditRecModal(recId) {
  const rec = appState.recurring.find(r => r.id === recId);
  if (!rec) return;

  document.getElementById('edit-rec-id').value = rec.id;
  document.getElementById('edit-rec-type').value = rec.type || 'expense';
  document.getElementById('edit-rec-amount').value = rec.amount;
  document.getElementById('edit-rec-name').value = rec.name || rec.category || '';
  document.getElementById('edit-rec-interval').value = rec.interval || 'monthly';
  document.getElementById('edit-rec-active').value = (rec.active !== false) ? 'true' : 'false';
  document.getElementById('edit-rec-day').value = rec.day || 1;
  if (document.getElementById('edit-rec-weekday')) document.getElementById('edit-rec-weekday').value = rec.weekday !== undefined ? rec.weekday : 5;
  if (document.getElementById('edit-rec-yearly-month')) document.getElementById('edit-rec-yearly-month').value = rec.yearlyMonth !== undefined ? rec.yearlyMonth : 0;

  const sy = rec.startYear !== undefined ? rec.startYear : new Date().getFullYear();
  const sm = rec.startMonth !== undefined ? rec.startMonth : new Date().getMonth();
  const smStr = String(sm + 1).padStart(2, '0');
  const editStartMonth = document.getElementById('edit-rec-start-month');
  if (editStartMonth) editStartMonth.value = `${sy}-${smStr}`;

  if (rec.type === 'transfer') {
    document.getElementById('edit-rec-from').value = rec.fromAccount || 'bank';
    document.getElementById('edit-rec-to').value = rec.toAccount || 'savings';
  } else {
    document.getElementById('edit-rec-account').value = rec.account || 'bank';
  }

  onEditRecTypeChange();
  onEditRecIntervalChange();

  if (rec.type !== 'transfer') {
    populateEditRecCategories(rec.type, rec.category, rec.subcategory);
  }

  // Vertrags-, Testphasen- & Pausenfelder vorbefüllen
  const futureToggle = document.getElementById('edit-rec-future-price-toggle');
  if (futureToggle) {
    futureToggle.checked = !!rec.futurePriceActive;
    toggleEditFuturePriceSection();
    if (rec.futurePriceActive) {
      document.getElementById('edit-rec-future-amount').value = rec.futureAmount || '';
      if (rec.futureStartYear !== undefined && rec.futureStartMonth !== undefined) {
        document.getElementById('edit-rec-future-month').value = `${rec.futureStartYear}-${String(rec.futureStartMonth + 1).padStart(2, '0')}`;
      }
    }
  }

  const pauseToggle = document.getElementById('edit-rec-pause-toggle');
  if (pauseToggle) {
    pauseToggle.checked = !!rec.pauseActive;
    toggleEditPauseSection();
    if (rec.pauseActive) {
      if (rec.pauseStartYear !== undefined && rec.pauseStartMonth !== undefined) {
        document.getElementById('edit-rec-pause-start-month').value = `${rec.pauseStartYear}-${String(rec.pauseStartMonth + 1).padStart(2, '0')}`;
      }
      if (rec.pauseEndYear !== undefined && rec.pauseEndMonth !== undefined) {
        document.getElementById('edit-rec-pause-end-month').value = `${rec.pauseEndYear}-${String(rec.pauseEndMonth + 1).padStart(2, '0')}`;
      }
    }
  }

  const trialToggle = document.getElementById('edit-rec-trial-toggle');
  if (trialToggle) {
    trialToggle.checked = !!rec.trialActive;
    toggleTrialSection('edit-rec');
    if (rec.trialActive) {
      document.getElementById('edit-rec-trial-unit').value = rec.trialUnit || 'days';
      document.getElementById('edit-rec-trial-duration').value = rec.trialDuration || 14;
      document.getElementById('edit-rec-trial-end').value = rec.trialEndDate || '';
    }
  }

  const discToggle = document.getElementById('edit-rec-discount-toggle');
  if (discToggle) {
    discToggle.checked = !!rec.discountActive;
    toggleDiscountSection('edit-rec');
    if (rec.discountActive) {
      document.getElementById('edit-rec-discount-amount').value = rec.discountAmount || '';
      if (rec.discountEndYear !== undefined && rec.discountEndMonth !== undefined) {
        document.getElementById('edit-rec-discount-end-month').value = `${rec.discountEndYear}-${String(rec.discountEndMonth + 1).padStart(2, '0')}`;
      }
      document.getElementById('edit-rec-discount-regular').value = rec.regularAmount || rec.amount || '';
    }
  }

  const contractToggle = document.getElementById('edit-rec-contract-toggle');
  if (contractToggle) {
    contractToggle.checked = !!rec.hasContractDetails;
    toggleContractSection('edit-rec');
    if (rec.hasContractDetails) {
      document.getElementById('edit-rec-contract-number').value = rec.contractNumber || '';
      document.getElementById('edit-rec-min-term').value = rec.minTermDate || '';
      document.getElementById('edit-rec-notice-period').value = rec.noticePeriod || '';
      document.getElementById('edit-rec-hotline').value = rec.hotline || '';
      document.getElementById('edit-rec-notes').value = rec.contractNotes || '';
    }
  }

  const endToggle = document.getElementById('edit-rec-end-toggle');
  if (endToggle) {
    const hasEnd = rec.endYear !== undefined && rec.endMonth !== undefined;
    endToggle.checked = hasEnd;
    toggleEditEndSection();
    if (hasEnd) {
      document.getElementById('edit-rec-end-month').value = `${rec.endYear}-${String(rec.endMonth + 1).padStart(2, '0')}`;
    }
  }

  const modal = document.getElementById('edit-rec-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-rec-amount').focus();
  announceNVDA('Dauerauftrag bearbeiten geöffnet.');
}

function closeEditRecModal() {
  const modal = document.getElementById('edit-rec-modal');
  if (modal) modal.style.display = 'none';
}

async function saveEditedRecurring(e) {
  e.preventDefault();
  const id = document.getElementById('edit-rec-id').value;
  const rec = appState.recurring.find(r => r.id === id);
  if (!rec) return;

  const type = document.getElementById('edit-rec-type').value;
  rec.type = type;
  rec.amount = parseFloat(document.getElementById('edit-rec-amount').value);
  rec.name = document.getElementById('edit-rec-name').value.trim();
  rec.interval = document.getElementById('edit-rec-interval').value;
  rec.active = document.getElementById('edit-rec-active').value === 'true';
  rec.day = parseInt(document.getElementById('edit-rec-day').value, 10) || 1;
  rec.weekday = parseInt(document.getElementById('edit-rec-weekday').value, 10) || 5;
  rec.yearlyMonth = parseInt(document.getElementById('edit-rec-yearly-month').value, 10) || 0;

  const editStartMonth = document.getElementById('edit-rec-start-month');
  if (editStartMonth && editStartMonth.value && editStartMonth.value.includes('-')) {
    const parts = editStartMonth.value.split('-');
    rec.startYear = parseInt(parts[0], 10);
    rec.startMonth = parseInt(parts[1], 10) - 1;
  }

  // Preiserhöhung
  const futureToggle = document.getElementById('edit-rec-future-price-toggle');
  if (futureToggle && futureToggle.checked) {
    rec.futurePriceActive = true;
    rec.futureAmount = parseFloat(document.getElementById('edit-rec-future-amount').value) || rec.amount;
    const fVal = document.getElementById('edit-rec-future-month').value;
    if (fVal && fVal.includes('-')) {
      const parts = fVal.split('-');
      rec.futureStartYear = parseInt(parts[0], 10);
      rec.futureStartMonth = parseInt(parts[1], 10) - 1;
    }
  } else {
    rec.futurePriceActive = false;
  }

  // Pausieren
  const pauseToggle = document.getElementById('edit-rec-pause-toggle');
  if (pauseToggle && pauseToggle.checked) {
    rec.pauseActive = true;
    const psVal = document.getElementById('edit-rec-pause-start-month').value;
    const peVal = document.getElementById('edit-rec-pause-end-month').value;
    if (psVal && psVal.includes('-') && peVal && peVal.includes('-')) {
      const [psy, psm] = psVal.split('-');
      const [pey, pem] = peVal.split('-');
      rec.pauseStartYear = parseInt(psy, 10);
      rec.pauseStartMonth = parseInt(psm, 10) - 1;
      rec.pauseEndYear = parseInt(pey, 10);
      rec.pauseEndMonth = parseInt(pem, 10) - 1;
    }
  } else {
    rec.pauseActive = false;
  }

  // Gratis-Phase
  const trialToggle = document.getElementById('edit-rec-trial-toggle');
  if (trialToggle && trialToggle.checked) {
    rec.trialActive = true;
    rec.trialUnit = document.getElementById('edit-rec-trial-unit').value || 'days';
    rec.trialDuration = parseInt(document.getElementById('edit-rec-trial-duration').value, 10) || 14;
    rec.trialEndDate = document.getElementById('edit-rec-trial-end').value || '';
  } else {
    rec.trialActive = false;
  }

  // Rabatt-Phase
  const discToggle = document.getElementById('edit-rec-discount-toggle');
  if (discToggle && discToggle.checked) {
    rec.discountActive = true;
    rec.discountAmount = parseFloat(document.getElementById('edit-rec-discount-amount').value) || 0;
    const deVal = document.getElementById('edit-rec-discount-end-month').value;
    if (deVal && deVal.includes('-')) {
      const [dey, dem] = deVal.split('-');
      rec.discountEndYear = parseInt(dey, 10);
      rec.discountEndMonth = parseInt(dem, 10) - 1;
    }
    rec.regularAmount = parseFloat(document.getElementById('edit-rec-discount-regular').value) || rec.amount;
  } else {
    rec.discountActive = false;
  }

  // Vertragsdaten
  const contractToggle = document.getElementById('edit-rec-contract-toggle');
  if (contractToggle && contractToggle.checked) {
    rec.hasContractDetails = true;
    rec.contractNumber = (document.getElementById('edit-rec-contract-number').value || '').trim();
    rec.minTermDate = document.getElementById('edit-rec-min-term').value || '';
    rec.noticePeriod = (document.getElementById('edit-rec-notice-period').value || '').trim();
    rec.hotline = (document.getElementById('edit-rec-hotline').value || '').trim();
    rec.contractNotes = (document.getElementById('edit-rec-notes').value || '').trim();
  } else {
    rec.hasContractDetails = false;
  }

  // Beenden / Auslaufen
  const endToggle = document.getElementById('edit-rec-end-toggle');
  if (endToggle && endToggle.checked) {
    const endVal = document.getElementById('edit-rec-end-month').value;
    if (endVal && endVal.includes('-')) {
      const [ey, em] = endVal.split('-');
      rec.endYear = parseInt(ey, 10);
      rec.endMonth = parseInt(em, 10) - 1;
    }
  } else {
    rec.endYear = undefined;
    rec.endMonth = undefined;
  }

  if (type === 'transfer') {
    rec.fromAccount = document.getElementById('edit-rec-from').value;
    rec.toAccount = document.getElementById('edit-rec-to').value;
    rec.account = undefined;
    rec.category = 'Umbuchung & Sparplan';
    rec.subcategory = '';
  } else {
    rec.account = document.getElementById('edit-rec-account').value;
    rec.fromAccount = undefined;
    rec.toAccount = undefined;
    rec.category = document.getElementById('edit-rec-category').value;
    rec.subcategory = document.getElementById('edit-rec-subcategory').value;
  }

  await saveStateToEncryptedStorage();
  closeEditRecModal();
  renderSettingsRecurringList();
  updateOverview();
  announceNVDA('Dauerauftrag erfolgreich aktualisiert!');
}

async function deleteRecurring(recId) {
  const idx = appState.recurring.findIndex(r => r.id === recId);
  if (idx !== -1) {
    const deleted = appState.recurring.splice(idx, 1)[0];
    await saveStateToEncryptedStorage();
    renderSettingsRecurringList();
    updateOverview();
    announceNVDA(`Dauerauftrag ${deleted.name || deleted.category} gelöscht.`);
  }
}

// ----------------------------------------------------------------------------
// 12b. BELEG- & QUITTUNGS-VERWALTUNG, SMART OCR & BETRACHTER (v6.7.0)
// ----------------------------------------------------------------------------
let currentExpenseReceipt = null;
let currentIncomeReceipt = null;
let currentEditReceipt = null;
let viewerActiveTxId = null;
let viewerActiveFormType = null;
let viewerReceipt = null;
let viewerZoom = 1.0;
let viewerRotation = 0;
let tesseractLoadingPromise = null;

async function compressReceiptFile(file) {
  const isPdf = file.type === 'application/pdf' || (file.name && file.name.toLowerCase().endsWith('.pdf'));
  if (isPdf) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('PDF-Datei ist größer als 5 MB. Bitte wähle eine kleinere Datei.');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({
        name: file.name,
        type: 'application/pdf',
        data: reader.result,
        size: file.size,
        createdAt: new Date().toISOString()
      });
      reader.onerror = () => reject(new Error('Fehler beim Lesen der PDF-Datei.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDim = 1400;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const approxSize = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          name: (file.name || 'beleg').replace(/\.[^/.]+$/, "") + ".jpg",
          type: 'image/jpeg',
          data: compressedDataUrl,
          size: approxSize,
          createdAt: new Date().toISOString(),
          originalWidth: img.width,
          originalHeight: img.height
        });
      };
      img.onerror = () => reject(new Error('Das Bild konnte nicht geladen werden.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Fehler beim Lesen der Bilddatei.'));
    reader.readAsDataURL(file);
  });
}

function loadTesseractScript() {
  if (typeof Tesseract !== 'undefined') return Promise.resolve();
  if (tesseractLoadingPromise) return tesseractLoadingPromise;
  tesseractLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Tesseract konnte nicht geladen werden'));
    document.head.appendChild(script);
  });
  return tesseractLoadingPromise;
}

function extractTextFromPdfDataUrl(dataUrl) {
  try {
    const base64 = dataUrl.split(',')[1];
    if (!base64) return '';
    const binary = atob(base64);

    let text = '';
    const tjRegex = /\(([^)]+)\)\s*Tj/g;
    let match;
    while ((match = tjRegex.exec(binary)) !== null) {
      text += ' ' + match[1];
    }
    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
    while ((match = tjArrayRegex.exec(binary)) !== null) {
      const inner = match[1];
      const partRegex = /\(([^)]+)\)/g;
      let pMatch;
      while ((pMatch = partRegex.exec(inner)) !== null) {
        text += pMatch[1];
      }
      text += ' ';
    }
    return text.trim();
  } catch (e) {
    return '';
  }
}

async function extractTextFromReceipt(receiptObj) {
  let recognizedText = '';
  let barcodeData = null;

  // 1. BarcodeDetector für QR Codes / GiroCode / EPC QR
  if ('BarcodeDetector' in window && receiptObj.type.startsWith('image/')) {
    try {
      const detector = new BarcodeDetector({ formats: ['qr_code', 'data_matrix', 'code_128', 'ean_13'] });
      const img = new Image();
      img.src = receiptObj.data;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const barcodes = await detector.detect(img);
      if (barcodes && barcodes.length > 0) {
        barcodeData = barcodes[0].rawValue;
        recognizedText += '\n' + barcodeData;
      }
    } catch (e) {
      console.warn('BarcodeDetector fallback:', e);
    }
  }

  // 2. Chromium / Android ShapeDetection TextDetector
  if ('TextDetector' in window && receiptObj.type.startsWith('image/')) {
    try {
      const detector = new TextDetector();
      const img = new Image();
      img.src = receiptObj.data;
      await new Promise(r => { img.onload = r; img.onerror = r; });
      const detectedTexts = await detector.detect(img);
      if (detectedTexts && detectedTexts.length > 0) {
        const fullOcr = detectedTexts.map(t => t.rawValue).join('\n');
        recognizedText += '\n' + fullOcr;
      }
    } catch (e) {
      console.warn('TextDetector fallback:', e);
    }
  }

  // 3. PDF Textextraktion
  if (receiptObj.type === 'application/pdf' && receiptObj.data) {
    try {
      const pdfText = extractTextFromPdfDataUrl(receiptObj.data);
      if (pdfText) recognizedText += '\n' + pdfText;
    } catch (e) {
      console.warn('PDF text extraction fallback:', e);
    }
  }

  // 4. Fallback zu Tesseract OCR (falls online und Text noch leer)
  if (!recognizedText.trim() && receiptObj.type.startsWith('image/')) {
    if (typeof Tesseract !== 'undefined') {
      try {
        const res = await Tesseract.recognize(receiptObj.data, 'deu+eng');
        if (res && res.data && res.data.text) {
          recognizedText += '\n' + res.data.text;
        }
      } catch (e) {
        console.warn('Tesseract OCR fallback:', e);
      }
    } else if (navigator.onLine) {
      try {
        await loadTesseractScript();
        if (typeof Tesseract !== 'undefined') {
          const res = await Tesseract.recognize(receiptObj.data, 'deu+eng');
          if (res && res.data && res.data.text) {
            recognizedText += '\n' + res.data.text;
          }
        }
      } catch (e) {
        console.warn('Dynamic Tesseract fallback:', e);
      }
    }
  }

  // 5. Dateiname als Signal hinzufügen
  if (receiptObj.name) {
    recognizedText += '\n' + receiptObj.name;
  }

  return { text: recognizedText, barcodeData };
}

const KNOWN_RECEIPT_MERCHANTS = [
  // Supermärkte & Discounter
  { keywords: ['rewe'], merchant: 'Rewe', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Rewe' },
  { keywords: ['edeka'], merchant: 'Edeka', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Edeka' },
  { keywords: ['aldi nord'], merchant: 'Aldi Nord', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Aldi Nord' },
  { keywords: ['aldi süd', 'aldi sued'], merchant: 'Aldi Süd', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Aldi Süd' },
  { keywords: ['aldi'], merchant: 'Aldi', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Aldi Süd' },
  { keywords: ['lidl'], merchant: 'Lidl', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Lidl' },
  { keywords: ['kaufland'], merchant: 'Kaufland', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Kaufland' },
  { keywords: ['penny'], merchant: 'Penny', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Penny' },
  { keywords: ['netto marken', 'netto discount', 'netto'], merchant: 'Netto', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Netto Marken-Discount' },
  { keywords: ['norma'], merchant: 'Norma', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Norma' },
  { keywords: ['globus'], merchant: 'Globus', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Globus' },
  { keywords: ['tegut'], merchant: 'Tegut', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Tegut' },
  { keywords: ['alnatura'], merchant: 'Alnatura', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Alnatura' },
  { keywords: ['denns'], merchant: 'Denns Biomarkt', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Denns Biomarkt' },
  { keywords: ['bio company'], merchant: 'Bio Company', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Bio Company' },
  { keywords: ['trinkgut', 'getränke'], merchant: 'Getränkemarkt', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Getränkemarkt / Trinkgut' },

  // Drogerie & Kosmetik
  { keywords: ['dm-drogerie', 'dm markt', 'dm drogerie', 'dm '], merchant: 'dm-drogerie markt', main: 'Drogerie, Kosmetik & Körperpflege', sub: 'dm-drogerie markt' },
  { keywords: ['rossmann'], merchant: 'Rossmann', main: 'Drogerie, Kosmetik & Körperpflege', sub: 'Rossmann' },
  { keywords: ['müller drogerie', 'mueller drogerie'], merchant: 'Müller', main: 'Drogerie, Kosmetik & Körperpflege', sub: 'Müller Drogerie' },

  // Elektronik & Software
  { keywords: ['mediamarkt', 'media markt'], merchant: 'MediaMarkt', main: 'Elektronik, Internet, Handy & Software', sub: 'MediaMarkt' },
  { keywords: ['saturn'], merchant: 'Saturn', main: 'Elektronik, Internet, Handy & Software', sub: 'Saturn' },
  { keywords: ['apple'], merchant: 'Apple', main: 'Elektronik, Internet, Handy & Software', sub: 'Apple' },
  { keywords: ['amazon'], merchant: 'Amazon', main: 'Elektronik, Internet, Handy & Software', sub: 'Amazon' },
  { keywords: ['cyberport'], merchant: 'Cyberport', main: 'Elektronik, Internet, Handy & Software', sub: 'Cyberport' },
  { keywords: ['conrad'], merchant: 'Conrad Electronic', main: 'Elektronik, Internet, Handy & Software', sub: 'Conrad Electronic' },
  { keywords: ['telekom'], merchant: 'Deutsche Telekom', main: 'Elektronik, Internet, Handy & Software', sub: 'Handyvertrag & Mobilfunk' },
  { keywords: ['vodafone'], merchant: 'Vodafone', main: 'Elektronik, Internet, Handy & Software', sub: 'Handyvertrag & Mobilfunk' },
  { keywords: ['o2 '], merchant: 'o2 Telefonica', main: 'Elektronik, Internet, Handy & Software', sub: 'Handyvertrag & Mobilfunk' },

  // Möbel & Baumarkt
  { keywords: ['ikea'], merchant: 'IKEA', main: 'Möbel, Deko & Inneneinrichtung', sub: 'IKEA' },
  { keywords: ['bauhaus'], merchant: 'Bauhaus', main: 'Wohnen & Haushalt (Heimwerken)', sub: 'Bauhaus' },
  { keywords: ['obi'], merchant: 'OBI', main: 'Wohnen & Haushalt (Heimwerken)', sub: 'OBI' },
  { keywords: ['hornbach'], merchant: 'Hornbach', main: 'Wohnen & Haushalt (Heimwerken)', sub: 'Hornbach' },
  { keywords: ['toom'], merchant: 'Toom Baumarkt', main: 'Wohnen & Haushalt (Heimwerken)', sub: 'Toom Baumarkt' },

  // Mobilität & Tanken
  { keywords: ['shell'], merchant: 'Shell', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Tanken (Benzin, Diesel, Autogas)' },
  { keywords: ['aral'], merchant: 'Aral', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Tanken (Benzin, Diesel, Autogas)' },
  { keywords: ['totalenergies', 'total tankstelle'], merchant: 'Total', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Tanken (Benzin, Diesel, Autogas)' },
  { keywords: ['esso'], merchant: 'Esso', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Tanken (Benzin, Diesel, Autogas)' },
  { keywords: ['jet tankstelle'], merchant: 'JET', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Tanken (Benzin, Diesel, Autogas)' },
  { keywords: ['deutsche bahn', 'bahn'], merchant: 'Deutsche Bahn', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Deutsche Bahn & Fernverkehr' },
  { keywords: ['flixbus'], merchant: 'FlixBus', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'FlixBus & Fernbus' },
  { keywords: ['uber'], merchant: 'Uber', main: 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)', sub: 'Taxi, Uber & Fahrdienste' },

  // Essen & Gastro
  { keywords: ['mcdonald', 'mc donald'], merchant: "McDonald's", main: 'Ausgehen, Essen & Feiern', sub: 'Fast Food, Imbiss & Döner' },
  { keywords: ['burger king'], merchant: 'Burger King', main: 'Ausgehen, Essen & Feiern', sub: 'Fast Food, Imbiss & Döner' },
  { keywords: ['subway'], merchant: 'Subway', main: 'Ausgehen, Essen & Feiern', sub: 'Fast Food, Imbiss & Döner' },
  { keywords: ['domino'], merchant: "Domino's Pizza", main: 'Ausgehen, Essen & Feiern', sub: 'Pizza, Pasta & Italienisch' },
  { keywords: ['bäckerei', 'baeckerei', 'dörnbäcker', 'bäcker', 'baecker'], merchant: 'Bäckerei', main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Bäckerei / Dorfbäcker' },

  // Gesundheit
  { keywords: ['apotheke'], merchant: 'Apotheke', main: 'Gesundheit & Medizin', sub: 'Apotheke & Medikamente' },
  { keywords: ['docmorris'], merchant: 'DocMorris', main: 'Gesundheit & Medizin', sub: 'Online-Apotheke (DocMorris, Shop-Apotheke)' },
  { keywords: ['shop apotheke'], merchant: 'Shop Apotheke', main: 'Gesundheit & Medizin', sub: 'Online-Apotheke (DocMorris, Shop-Apotheke)' }
];

async function parseReceiptData(text, barcodeData, fileName, formType) {
  const result = {
    amount: null,
    date: null,
    merchant: null,
    mainCategory: null,
    subCategory: null,
    description: '',
    isNewCategory: false
  };

  const safeType = formType === 'inc' ? 'inc' : 'exp';

  // 1. Barcode / GiroCode EPC QR
  if (barcodeData && typeof barcodeData === 'string' && barcodeData.startsWith('BCD')) {
    const lines = barcodeData.split(/\r?\n/);
    if (lines.length >= 8) {
      if (lines[5] && lines[5].trim()) result.merchant = lines[5].trim();
      const amtMatch = lines[7] ? lines[7].match(/(?:EUR)?([0-9]+(?:\.[0-9]{1,2})?)/i) : null;
      if (amtMatch) result.amount = parseFloat(amtMatch[1]);
      if (lines[10] && lines[10].trim()) result.description = lines[10].trim();
      else if (lines[9] && lines[9].trim()) result.description = lines[9].trim();
    }
  }

  // 2. Betrag (Summe / Total)
  if (!result.amount && text) {
    const sumRegexes = [
      /(?:summe|gesamtbetrag|gesamt|endbetrag|total|zu zahlen|zahlbetrag|rechnungsbetrag|kartenzahlung|geg\.\s*bar|bar)\s*[:=]?\s*(?:eur|€)?\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,][0-9]{2})/i,
      /(?:eur|€)\s*([0-9]{1,4}(?:[.,][0-9]{3})*[.,][0-9]{2})/i,
      /([0-9]{1,4}(?:[.,][0-9]{3})*[.,][0-9]{2})\s*(?:eur|€)/i
    ];

    for (const rx of sumRegexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        let numStr = match[1].replace(/\./g, '').replace(',', '.');
        const parsedNum = parseFloat(numStr);
        if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 1000000) {
          result.amount = parsedNum;
          break;
        }
      }
    }

    if (!result.amount) {
      const allAmounts = [];
      const generalAmtRegex = /\b([0-9]{1,4}(?:[.,][0-9]{3})*[.,][0-9]{2})\b/g;
      let m;
      while ((m = generalAmtRegex.exec(text)) !== null) {
        let val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
        if (!isNaN(val) && val > 0 && val < 50000) {
          allAmounts.push(val);
        }
      }
      if (allAmounts.length > 0) {
        result.amount = Math.max(...allAmounts);
      }
    }
  }

  // 3. Datum
  if (text) {
    const dateMatchGerman = text.match(/\b([0-3]?[0-9])[./-]([0-1]?[0-9])[./-](20[2-3][0-9]|[2-3][0-9])\b/);
    if (dateMatchGerman) {
      const day = String(parseInt(dateMatchGerman[1], 10)).padStart(2, '0');
      const month = String(parseInt(dateMatchGerman[2], 10)).padStart(2, '0');
      let year = dateMatchGerman[3];
      if (year.length === 2) year = '20' + year;
      if (parseInt(month, 10) >= 1 && parseInt(month, 10) <= 12 && parseInt(day, 10) >= 1 && parseInt(day, 10) <= 31) {
        result.date = `${year}-${month}-${day}`;
      }
    }

    if (!result.date) {
      const isoMatch = text.match(/\b(20[2-3][0-9])-([0-1]?[0-9])-([0-3]?[0-9])\b/);
      if (isoMatch) {
        result.date = `${isoMatch[1]}-${String(parseInt(isoMatch[2], 10)).padStart(2, '0')}-${String(parseInt(isoMatch[3], 10)).padStart(2, '0')}`;
      }
    }
  }

  // 4. Händler / Laden
  const textLower = (text + ' ' + (fileName || '')).toLowerCase();

  for (const item of KNOWN_RECEIPT_MERCHANTS) {
    const matched = item.keywords.some(kw => textLower.includes(kw));
    if (matched) {
      result.merchant = item.merchant;
      result.mainCategory = item.main;
      result.subCategory = item.sub;
      break;
    }
  }

  if (!result.merchant && text) {
    const lines = text.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length >= 3 && l.length <= 45);

    const noiseWords = ['kassenbon', 'kassenzettel', 'quittung', 'rechnung', 'beleg', 'vielen dank', 'kunde', 'datum', 'uhrzeit', 'eur', 'summe', 'steuer', 'ust', 'tse', 'kartenzahlung', 'terminal', 'telefon', 'willkommen'];

    for (const line of lines) {
      const lineLow = line.toLowerCase();
      const isNoise = noiseWords.some(nw => lineLow.includes(nw)) || /^[0-9.,:\-\s]+$/.test(line);
      if (!isNoise) {
        result.merchant = line;
        break;
      }
    }
  }

  if (!result.merchant && fileName) {
    const cleanName = fileName.replace(/\.[^/.]+$/, "").replace(/[_\-+]/g, ' ').trim();
    if (cleanName.length >= 3) {
      result.merchant = cleanName;
    }
  }

  // 5. Kategorie zuordnen oder NEU ERSTELLEN
  if (!result.mainCategory) {
    if (result.merchant) {
      const db = CATEGORIES_DB[safeType] || {};
      let foundInDb = false;

      for (const [mainCat, subs] of Object.entries(db)) {
        const subMatch = subs.find(s => s.toLowerCase() === result.merchant.toLowerCase() || result.merchant.toLowerCase().includes(s.toLowerCase()));
        if (subMatch) {
          result.mainCategory = mainCat;
          result.subCategory = subMatch;
          foundInDb = true;
          break;
        }
      }

      if (!foundInDb) {
        const mLow = result.merchant.toLowerCase();
        let targetMain = safeType === 'inc' ? 'Sonstige Einnahmen' : 'Sonstige Ausgaben';

        if (safeType === 'exp') {
          if (/tier|hund|katz|fressnapf|zoo/i.test(mLow)) targetMain = 'Haustiere, Tierfutter & Tierarzt';
          else if (/bäck|baeck|café|cafe|restaurant|imbiss|döner|pizza|burger|sushi/i.test(mLow)) targetMain = 'Ausgehen, Essen & Feiern';
          else if (/sport|fitness|gym|kletter/i.test(mLow)) targetMain = 'Freizeit, Hobbys & Unterhaltung';
          else if (/buch|buech|thalia/i.test(mLow)) targetMain = 'Bildung, Bücher, Studium & Beruf';
          else if (/kleid|mode|schuh|fashion|snipes|zara|h&m/i.test(mLow)) targetMain = 'Kleidung, Schuhe & Accessoires';
          else if (/arzt|zahnarzt|praxis|klinik|apothek/i.test(mLow)) targetMain = 'Gesundheit & Medizin';
          else if (/kino|theater|konzert|ticket/i.test(mLow)) targetMain = 'Freizeit, Hobbys & Unterhaltung';
          else if (/tank|kfz|auto|werkstatt|reifen/i.test(mLow)) targetMain = 'Mobilität & Unterwegs (Auto, Bahn, ÖPNV)';
          else if (/elektronik|computer|handy|tech|software/i.test(mLow)) targetMain = 'Elektronik, Internet, Handy & Software';
          else if (/bau|garten|blumen|baumarkt/i.test(mLow)) targetMain = 'Wohnen & Haushalt (Heimwerken)';
          else if (/markt|supermarkt|lebensmittel/i.test(mLow)) targetMain = 'Lebensmittel, Supermarkt & Discounter';
        }

        result.mainCategory = targetMain;
        result.subCategory = result.merchant;
        result.isNewCategory = true;
      }
    } else {
      result.mainCategory = safeType === 'inc' ? 'Sonstige Einnahmen' : 'Sonstige Ausgaben';
      result.subCategory = 'Gesamt / Allgemein';
    }
  }

  // 6. Notiz / Beschreibung
  if (!result.description) {
    if (result.merchant) {
      result.description = `${result.merchant}${result.date ? ' (' + formatDateGerman(result.date) + ')' : ''}`;
    } else if (fileName) {
      result.description = fileName.replace(/\.[^/.]+$/, "");
    }
  }

  return result;
}

async function applyParsedReceiptData(formType, parsed) {
  const prefix = formType === 'edit' ? 'edit-tx' : formType;
  let filledCount = 0;
  let detailsText = [];

  // 1. Betrag eintragen
  if (parsed.amount && parsed.amount > 0) {
    const amtEl = document.getElementById(`${prefix}-amount`);
    if (amtEl) {
      amtEl.value = parsed.amount.toFixed(2);
      filledCount++;
      detailsText.push(`${formatCurrency(parsed.amount)}`);
    }
  }

  // 2. Datum eintragen
  if (parsed.date) {
    const dateEl = document.getElementById(`${prefix}-date`);
    if (dateEl) {
      dateEl.value = parsed.date;
      filledCount++;
      detailsText.push(`Datum: ${formatDateGerman(parsed.date)}`);
    }
  }

  // 3. Kategorie & Unterkategorie auswählen (oder NEU erstellen!)
  if (parsed.mainCategory) {
    const catType = formType === 'inc' ? 'inc' : 'exp';
    if (formType === 'edit') {
      const editType = document.getElementById('edit-tx-type').value;
      const actualCatType = editType === 'income' ? 'inc' : 'exp';
      if (parsed.isNewCategory) {
        await ensureCategoryExists(actualCatType, parsed.mainCategory, parsed.subCategory);
      }
      populateEditModalCategories(actualCatType, parsed.mainCategory, parsed.subCategory);
    } else {
      if (parsed.isNewCategory) {
        await ensureCategoryExists(catType, parsed.mainCategory, parsed.subCategory);
      }
      const catEl = document.getElementById(`${prefix}-category`);
      if (catEl) {
        catEl.value = parsed.mainCategory;
        onMainCategoryChange(prefix);
        if (parsed.subCategory) {
          const subEl = document.getElementById(`${prefix}-subcategory`);
          if (subEl) subEl.value = parsed.subCategory;
        }
      }
    }
    filledCount++;
    detailsText.push(`${parsed.subCategory || parsed.mainCategory}`);
  }

  // 4. Beschreibung eintragen
  if (parsed.description) {
    const descEl = document.getElementById(`${prefix}-desc`);
    if (descEl && (!descEl.value || descEl.value.trim() === '')) {
      descEl.value = parsed.description;
    }
  }

  // Statusanzeige & NVDA Ansage
  const statusEl = document.getElementById(`${formType}-receipt-status-banner`);
  if (statusEl) {
    if (filledCount > 0) {
      const isNewCatMsg = parsed.isNewCategory 
        ? ` · ✨ Neue Kategorie "${escapeHTML(parsed.subCategory)}" automatisch erstellt!` 
        : '';
      statusEl.className = 'receipt-status-banner success';
      statusEl.innerHTML = `<span aria-hidden="true">✨</span><span><strong>Automatisch erkannt &amp; eingetragen:</strong> ${escapeHTML(detailsText.join(' · '))}${isNewCatMsg}</span>`;
      statusEl.style.display = 'flex';
      announceNVDA(`Belegdaten erkannt: ${detailsText.join(', ')} automatisch eingetragen.`);
    } else {
      statusEl.className = 'receipt-status-banner success';
      statusEl.innerHTML = '<span aria-hidden="true">📎</span><span>Beleg angehängt. Bitte Betrag und Kategorie überprüfen.</span>';
      statusEl.style.display = 'flex';
      announceNVDA('Beleg angehängt.');
    }
  }
}

async function processReceiptFileAndAutofill(formType, file) {
  const statusEl = document.getElementById(`${formType}-receipt-status-banner`);
  if (statusEl) {
    statusEl.className = 'receipt-status-banner scanning';
    statusEl.innerHTML = '<span aria-hidden="true">⏳</span><span>Beleg wird komprimiert und analysiert...</span>';
    statusEl.style.display = 'flex';
  }

  try {
    const compressed = await compressReceiptFile(file);
    if (formType === 'exp') currentExpenseReceipt = compressed;
    else if (formType === 'inc') currentIncomeReceipt = compressed;
    else if (formType === 'edit') currentEditReceipt = compressed;

    renderReceiptPreview(formType);

    const extracted = await extractTextFromReceipt(compressed);
    const parsed = await parseReceiptData(extracted.text, extracted.barcodeData, file.name, formType);
    await applyParsedReceiptData(formType, parsed);
  } catch (err) {
    console.error('Fehler bei Beleganalyse:', err);
    if (statusEl) {
      statusEl.className = 'receipt-status-banner';
      statusEl.style.display = 'block';
      statusEl.textContent = 'Hinweis: ' + (err.message || 'Beleg angehängt.');
    }
  }
}

function handleReceiptFileSelect(formType, files) {
  if (!files || files.length === 0) return;
  processReceiptFileAndAutofill(formType, files[0]);
}

function renderReceiptPreview(formType) {
  let receipt = null;
  if (formType === 'exp') receipt = currentExpenseReceipt;
  else if (formType === 'inc') receipt = currentIncomeReceipt;
  else if (formType === 'edit') receipt = currentEditReceipt;

  const container = document.getElementById(`${formType}-receipt-preview-container`);
  if (!container) return;

  if (!receipt) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  const isPdf = receipt.type === 'application/pdf';
  const kbSize = receipt.size ? Math.round(receipt.size / 1024) + ' KB' : '';

  let thumbHtml = '';
  if (isPdf) {
    thumbHtml = '<div class="receipt-thumb-icon" aria-hidden="true">📄</div>';
  } else {
    thumbHtml = `<img src="${receipt.data}" alt="Vorschau Beleg" class="receipt-thumb">`;
  }

  container.innerHTML = `
    <div class="receipt-preview-card">
      ${thumbHtml}
      <div class="receipt-info-col">
        <div class="receipt-name" title="${escapeHTML(receipt.name)}">${escapeHTML(receipt.name)}</div>
        <div class="receipt-meta">${isPdf ? 'PDF Dokument' : 'Bild'} · ${kbSize} · Bereit zum Speichern</div>
      </div>
      <div style="display: flex; gap: 6px; flex-shrink: 0;">
        <button type="button" class="btn btn-secondary" onclick="openReceiptModalDirect('${formType}')" title="Beleg ansehen" aria-label="Beleg ${escapeHTML(receipt.name)} im Großbild ansehen" style="padding: 6px 10px; font-size: 14px;">
          👁️ Ansehen
        </button>
        <button type="button" class="btn btn-delete-tx" onclick="removeReceipt('${formType}')" title="Beleg entfernen" aria-label="Beleg entfernen" style="padding: 6px 10px; font-size: 14px;">
          🗑️ Entfernen
        </button>
      </div>
    </div>
  `;
  container.style.display = 'block';
}

function removeReceipt(formType) {
  if (formType === 'exp') currentExpenseReceipt = null;
  else if (formType === 'inc') currentIncomeReceipt = null;
  else if (formType === 'edit') currentEditReceipt = null;

  renderReceiptPreview(formType);
  const statusEl = document.getElementById(`${formType}-receipt-status-banner`);
  if (statusEl) {
    statusEl.style.display = 'none';
    statusEl.innerHTML = '';
  }
  announceNVDA('Beleg entfernt.');
}

function openReceiptModalByTxId(txId) {
  const tx = appState.transactions.find(t => t.id === txId) || (appState.recurring || []).find(r => r.id === txId);
  if (!tx || !tx.receipt) return;
  openReceiptViewer(tx.receipt, true, txId, null);
}

function openReceiptModalDirect(formType) {
  let receipt = null;
  if (formType === 'exp') receipt = currentExpenseReceipt;
  else if (formType === 'inc') receipt = currentIncomeReceipt;
  else if (formType === 'edit') receipt = currentEditReceipt;

  if (!receipt) return;
  openReceiptViewer(receipt, true, null, formType);
}

function openReceiptViewer(receipt, canDelete, activeTxId = null, formType = null) {
  viewerReceipt = receipt;
  viewerActiveTxId = activeTxId;
  viewerActiveFormType = formType;
  viewerZoom = 1.0;
  viewerRotation = 0;

  const modal = document.getElementById('receipt-viewer-modal');
  const imgEl = document.getElementById('receipt-viewer-img');
  const pdfEl = document.getElementById('receipt-viewer-pdf');
  const metaEl = document.getElementById('receipt-viewer-meta');
  const delBtn = document.getElementById('receipt-viewer-delete-btn');

  if (delBtn) delBtn.style.display = canDelete ? 'inline-flex' : 'none';

  const isPdf = receipt.type === 'application/pdf';
  if (isPdf) {
    imgEl.style.display = 'none';
    pdfEl.style.display = 'block';
    pdfEl.src = receipt.data;
  } else {
    pdfEl.style.display = 'none';
    imgEl.style.display = 'block';
    imgEl.src = receipt.data;
    updateReceiptViewerTransform();
  }

  const kbSize = receipt.size ? Math.round(receipt.size / 1024) + ' KB' : '';
  const dateStr = receipt.createdAt ? new Date(receipt.createdAt).toLocaleString('de-DE') : '';
  if (metaEl) {
    metaEl.textContent = `${receipt.name || 'Beleg'} · ${kbSize}${dateStr ? ' · Angehängt am ' + dateStr : ''}`;
  }

  modal.style.display = 'flex';
  const heading = document.getElementById('receipt-viewer-heading');
  if (heading) heading.focus();
  announceNVDA('Beleg-Betrachter geöffnet.');
}

function closeReceiptModal() {
  const modal = document.getElementById('receipt-viewer-modal');
  if (modal) modal.style.display = 'none';
  const imgEl = document.getElementById('receipt-viewer-img');
  const pdfEl = document.getElementById('receipt-viewer-pdf');
  if (imgEl) imgEl.src = '';
  if (pdfEl) pdfEl.src = '';
  viewerReceipt = null;
  viewerActiveTxId = null;
  viewerActiveFormType = null;
}

function zoomReceipt(delta) {
  viewerZoom = Math.max(0.4, Math.min(4.0, viewerZoom + delta));
  updateReceiptViewerTransform();
  announceNVDA(`Zoom ${Math.round(viewerZoom * 100)} Prozent`);
}

function resetReceiptZoom() {
  viewerZoom = 1.0;
  updateReceiptViewerTransform();
  announceNVDA('Originalgröße 100 Prozent');
}

function rotateReceipt() {
  viewerRotation = (viewerRotation + 90) % 360;
  updateReceiptViewerTransform();
  announceNVDA(`Beleg gedreht auf ${viewerRotation} Grad`);
}

function updateReceiptViewerTransform() {
  const imgEl = document.getElementById('receipt-viewer-img');
  if (imgEl) {
    imgEl.style.transform = `rotate(${viewerRotation}deg) scale(${viewerZoom})`;
  }
}

function downloadReceipt() {
  if (!viewerReceipt || !viewerReceipt.data) return;
  const link = document.createElement('a');
  link.href = viewerReceipt.data;
  link.download = viewerReceipt.name || 'beleg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  announceNVDA('Beleg heruntergeladen.');
}

async function deleteReceiptFromActiveTx() {
  if (viewerActiveTxId) {
    const tx = appState.transactions.find(t => t.id === viewerActiveTxId);
    if (tx) {
      delete tx.receipt;
      await saveStateToEncryptedStorage();
      updateOverview();
    } else {
      const rec = (appState.recurring || []).find(r => r.id === viewerActiveTxId);
      if (rec) {
        delete rec.receipt;
        await saveStateToEncryptedStorage();
        updateOverview();
      }
    }
  } else if (viewerActiveFormType) {
    removeReceipt(viewerActiveFormType);
  }
  closeReceiptModal();
  announceNVDA('Beleg gelöscht.');
}

function openReceiptTextPastePrompt(formType) {
  const modal = document.getElementById('receipt-text-prompt-modal');
  const targetInput = document.getElementById('receipt-text-target-form');
  const textInput = document.getElementById('receipt-text-input');
  if (targetInput) targetInput.value = formType;
  if (textInput) textInput.value = '';
  if (modal) {
    modal.style.display = 'flex';
    if (textInput) textInput.focus();
  }
}

function closeReceiptTextPrompt() {
  const modal = document.getElementById('receipt-text-prompt-modal');
  if (modal) modal.style.display = 'none';
}

async function handleManualReceiptTextSubmit(e) {
  e.preventDefault();
  const formType = document.getElementById('receipt-text-target-form').value || 'exp';
  const text = (document.getElementById('receipt-text-input').value || '').trim();
  closeReceiptTextPrompt();
  if (!text) return;

  const parsed = await parseReceiptData(text, null, 'manueller_text', formType);
  await applyParsedReceiptData(formType, parsed);
}

function setupReceiptPasteAndDropListeners() {
  window.addEventListener('paste', async (e) => {
    if (!e.clipboardData || !e.clipboardData.items) return;

    for (const item of e.clipboardData.items) {
      if (item.type && item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;

        let targetForm = 'exp';
        const editModal = document.getElementById('edit-tx-modal');
        if (editModal && editModal.style.display !== 'none') {
          targetForm = 'edit';
        } else {
          const incView = document.getElementById('view-income');
          if (incView && incView.style.display !== 'none') {
            targetForm = 'inc';
          }
        }
        await processReceiptFileAndAutofill(targetForm, blob);
        break;
      }
    }
  });

  ['exp', 'inc', 'edit'].forEach(formType => {
    const box = document.getElementById(`${formType}-receipt-group`);
    if (!box) return;

    box.addEventListener('dragover', (e) => {
      e.preventDefault();
      box.classList.add('drag-over');
    });

    box.addEventListener('dragleave', () => {
      box.classList.remove('drag-over');
    });

    box.addEventListener('drop', async (e) => {
      e.preventDefault();
      box.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await processReceiptFileAndAutofill(formType, e.dataTransfer.files[0]);
      }
    });
  });
}

// ----------------------------------------------------------------------------
// 13. KAUF-PLANER & SIMULATOR
// ----------------------------------------------------------------------------
let currentSimulatedPurchase = null;

function runPurchaseSimulation() {
  const priceInput = document.getElementById('sim-item-price');
  const nameInput = document.getElementById('sim-item-name');
  const resultBox = document.getElementById('sim-result-box');
  const actionBox = document.getElementById('sim-save-action');
  if (!priceInput || !resultBox) return;

  const rawVal = priceInput.value.trim();
  if (!rawVal) {
    resultBox.innerHTML = '<p>💡 <em>Gib oben einen Preis ein, um zu sehen, was nach dem Kauf von deinem Monatsgeld noch übrig bleibt.</em></p>';
    if (actionBox) actionBox.style.display = 'none';
    currentSimulatedPurchase = null;
    return;
  }

  const price = parseFloat(rawVal);
  const name = (nameInput && nameInput.value.trim()) || 'Wunsch';

  if (isNaN(price) || price <= 0) {
    resultBox.innerHTML = '<p>💡 <em>Gib oben einen Preis ein, um zu sehen, was nach dem Kauf von deinem Monatsgeld noch übrig bleibt.</em></p>';
    if (actionBox) actionBox.style.display = 'none';
    currentSimulatedPurchase = null;
    return;
  }

  const stats = calculateMonthStats(selectedYear, selectedMonth);
  const leftoverAfter = stats.leftover - price;
  const isAffordable = leftoverAfter >= 0;

  resultBox.innerHTML = `
    <div style="font-size: 20px; font-weight: bold; color: ${isAffordable ? 'var(--accent-income)' : 'var(--accent-expense)'};">
      ${isAffordable ? '✅ Ja, das kannst du dir leisten!' : '⚠️ Achtung: Dein Monatsbudget wird überzogen!'}
    </div>
    <div style="margin-top: 6px;">
      Wenn du dir <strong>${escapeHTML(name)}</strong> für <strong>${formatCurrency(price)}</strong> kaufst,
      bleiben dir in diesem Monat noch <strong style="font-size: 22px; color: ${isAffordable ? 'var(--accent-income)' : 'var(--accent-expense)'};">${formatCurrency(leftoverAfter)}</strong> übrig.
    </div>
  `;

  if (actionBox) actionBox.style.display = 'block';
  currentSimulatedPurchase = { name, price, date: selectedDateStr };
}

async function saveSimulatedPurchase() {
  if (!currentSimulatedPurchase) return;
  appState.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'expense',
    account: 'bank',
    amount: currentSimulatedPurchase.price,
    category: 'Shopping & Wünsche',
    description: `Geplant: ${currentSimulatedPurchase.name}`,
    isPlanned: true,
    date: currentSimulatedPurchase.date
  });

  await saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Geplanter Kauf ${currentSimulatedPurchase.name} gespeichert!`);

  document.getElementById('sim-item-price').value = '';
  document.getElementById('sim-item-name').value = '';
  runPurchaseSimulation();
    populateFilterAccountDropdown();
  renderExpenseRankings(currentOverviewMode === 'day' ? dayStats.expenseList : (currentOverviewMode === 'month' ? stats.expenseList : periodAllTxs.filter(t => t.type === 'expense')));
  checkLiquidityWarning(currentOverviewMode === 'day' ? dayStats.balances : stats.balances);
  renderBudgetsList();
}

// ----------------------------------------------------------------------------
// 14. EINSTELLUNGEN: DESIGN, SCHRIFTGRÖSSE, DAUERAUFTRÄGE
// ----------------------------------------------------------------------------
function renderSettingsRecurringList() {
  const container = document.getElementById('settings-recurring-container');
  if (!container) return;

  if (appState.recurring.length === 0) {
    container.innerHTML = '<p class="empty-state">Keine dauerhaften Daueraufträge oder Sparpläne angelegt.</p>';
    return;
  }

  const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  let html = '<ul class="tx-list">';
  appState.recurring.forEach(rec => {
    let freqLabel = 'Monatlich';
    if (rec.interval === 'weekly') freqLabel = `Wöchentlich jeden ${weekdayNames[parseInt(rec.weekday || 5, 10)]}`;
    else if (rec.interval === 'yearly') freqLabel = `Jährlich im ${MONTH_NAMES[parseInt(rec.yearlyMonth || 0, 10)]}`;
    else if (rec.interval === 'quarterly') freqLabel = 'Alle 3 Monate';

    let statusBadge = '<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: rgba(76, 175, 80, 0.15); color: #2E7D32; margin-left: 6px;">🟢 Aktiv</span>';
    if (rec.endYear !== undefined && rec.endMonth !== undefined) {
      statusBadge = `<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: rgba(244, 67, 54, 0.15); color: #C62828; margin-left: 6px;">🔴 Gekündigt zum ${MONTH_NAMES[rec.endMonth]} ${rec.endYear}</span>`;
    } else if (rec.pauseActive && rec.pauseEndYear !== undefined && rec.pauseEndMonth !== undefined) {
      statusBadge = `<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: rgba(255, 193, 7, 0.2); color: #F57F17; margin-left: 6px;">⏸️ Pausiert bis ${MONTH_NAMES[rec.pauseEndMonth]} ${rec.pauseEndYear}</span>`;
    } else if (rec.trialActive && rec.trialEndDate) {
      statusBadge = `<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: rgba(156, 39, 176, 0.15); color: #7B1FA2; margin-left: 6px;">🎁 Testphase bis ${formatDateGerman(rec.trialEndDate)}</span>`;
    } else if (rec.discountActive && rec.discountEndYear !== undefined && rec.discountEndMonth !== undefined) {
      statusBadge = `<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: rgba(255, 152, 0, 0.2); color: #E65100; margin-left: 6px;">🏷️ Rabatt ${formatCurrency(rec.discountAmount)} bis ${MONTH_NAMES[rec.discountEndMonth]} ${rec.discountEndYear}</span>`;
    } else if (rec.futurePriceActive && rec.futureStartYear !== undefined && rec.futureStartMonth !== undefined) {
      statusBadge = `<span style="display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; background: rgba(33, 150, 243, 0.15); color: #1565C0; margin-left: 6px;">📈 Ab ${MONTH_NAMES[rec.futureStartMonth]} ${rec.futureStartYear}: ${formatCurrency(rec.futureAmount)}</span>`;
    }

    let contractSub = '';
    if (rec.hasContractDetails) {
      const parts = [];
      if (rec.contractNumber) parts.push(`Kd-Nr: ${escapeHTML(rec.contractNumber)}`);
      if (rec.minTermDate) parts.push(`Mindestlaufzeit: ${formatDateGerman(rec.minTermDate)}`);
      if (rec.noticePeriod) parts.push(`Frist: ${escapeHTML(rec.noticePeriod)}`);
      if (rec.hotline) parts.push(`Hotline: ${escapeHTML(rec.hotline)}`);
      if (parts.length > 0) {
        contractSub = `<div style="font-size: 12px; color: var(--text-muted, #666); margin-top: 3px;">📝 ${parts.join(' | ')}</div>`;
      }
    }

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">🔁</span>
          <div class="tx-details">
            <div style="display: flex; align-items: center; flex-wrap: wrap;">
              <span class="tx-cat-name">${rec.name || rec.category}</span>
              ${statusBadge}
            </div>
            <span class="tx-account-badge">${freqLabel} | Am ${rec.day}. des Monats | ${formatAccountName(rec.account || rec.fromAccount)}</span>
            ${contractSub}
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${rec.type}">${rec.type === 'income' ? '+' : '-'} ${formatCurrency(rec.amount)}</span>
          <button type="button" class="btn-edit-tx" onclick="openEditRecModal('${rec.id}')">✏️ Bearbeiten</button>
          <button type="button" class="btn-delete-tx" onclick="openEndOrDeleteRecModal('${rec.id}')">🗑️ Beenden / Löschen</button>
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
}

function changeTheme(themeClass) {
  const currentFont = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'font-normal';
  document.body.className = `${themeClass} ${currentFont}`;
  localStorage.setItem(STORAGE_THEME_KEY, themeClass);
  
  const sel = document.getElementById('settings-theme-select');
  if (sel) sel.value = themeClass;

  const names = {
    'theme-light': 'Standard Web-Design (Hell)',
    'theme-dark': 'Dunkel-Modus',
    'theme-high-contrast': 'Gelb auf Schwarz (Maximaler Kontrast)'
  };
  announceNVDA(`Design gewechselt zu: ${names[themeClass] || themeClass}.`);
}

function changeFontSize(fontClass) {
  const currentTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'theme-light';
  document.body.className = `${currentTheme} ${fontClass}`;
  localStorage.setItem(STORAGE_FONTSIZE_KEY, fontClass);

  const sel = document.getElementById('settings-fontsize-select');
  if (sel) sel.value = fontClass;

  const names = {
    'font-normal': 'Normale Schriftgröße (100%)',
    'font-large': 'Große Schrift (125%)',
    'font-xlarge': 'Sehr große Schrift (150%)'
  };
  announceNVDA(`Schriftgröße gewechselt zu: ${names[fontClass] || fontClass}.`);
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) || 'theme-light';
  const savedFont = localStorage.getItem(STORAGE_FONTSIZE_KEY) || 'font-normal';
  document.body.className = `${savedTheme} ${savedFont}`;

  const themeSel = document.getElementById('settings-theme-select');
  if (themeSel) themeSel.value = savedTheme;

  const fontSel = document.getElementById('settings-fontsize-select');
  if (fontSel) fontSel.value = savedFont;
}

// ----------------------------------------------------------------------------
// 15. VIEW NAVIGATION (TABS 1-5)
// ----------------------------------------------------------------------------
function switchView(viewName) {
  currentActiveView = viewName;

  const views = ['overview', 'expense', 'income', 'transfer', 'settings', 'accounts', 'wishlist', 'shopping', 'sync'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const tab = document.getElementById(`tab-${v}`);
    const isTarget = v === viewName;

    if (el) el.style.display = isTarget ? 'flex' : 'none';
    if (tab) {
      tab.classList.toggle('active', isTarget);
      tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      tab.setAttribute('tabindex', isTarget ? '0' : '-1');
    }
  });

  const timeBar = document.getElementById('time-picker-bar');
  if (timeBar) timeBar.style.display = viewName === 'overview' ? 'block' : 'none';

  if (viewName === 'overview') {
    updateOverview();
    announceNVDA('Übersicht geöffnet.');
  } else if (viewName === 'expense') {
    populateCategoriesDropdowns();
    populateAllAccountDropdowns();
    onMainCategoryChange('exp');
    const expDate = document.getElementById('exp-date');
    if (expDate && !expDate.value) expDate.value = new Date().toISOString().split('T')[0];
    const expAmount = document.getElementById('exp-amount');
    if (expAmount) expAmount.focus();
    announceNVDA('Ausgabe eintragen geöffnet.');
  } else if (viewName === 'income') {
    populateCategoriesDropdowns();
    populateAllAccountDropdowns();
    onMainCategoryChange('inc');
    const incDate = document.getElementById('inc-date');
    if (incDate && !incDate.value) incDate.value = new Date().toISOString().split('T')[0];
    const incAmount = document.getElementById('inc-amount');
    if (incAmount) incAmount.focus();
    announceNVDA('Einnahme eintragen geöffnet.');
  } else if (viewName === 'transfer') {
    populateAllAccountDropdowns();
    const trfDate = document.getElementById('trf-date');
    if (trfDate && !trfDate.value) trfDate.value = new Date().toISOString().split('T')[0];
    const trfAmount = document.getElementById('trf-amount');
    if (trfAmount) trfAmount.focus();
    announceNVDA('Umbuchen und Sparen geöffnet.');
  } else if (viewName === 'settings') {
    renderSettingsRecurringList();
    populateBudgetCategoryDropdown();
    renderBudgetsList();
    renderSettingsInstallmentsList();
    announceNVDA('Einstellungen geöffnet.');
  } else if (viewName === 'accounts') {
    renderAccountsViewList();
    populateSavingPotParentDropdown();
    renderSavingPotsList();
    const newNameInput = document.getElementById('new-acc-name');
    if (newNameInput) newNameInput.focus();
    announceNVDA('Konto-Optionen und Konten verwalten (Reiter 6) geöffnet.');
    } else if (viewName === 'shopping') {
    populateShoppingDropdowns();
    renderShoppingList();
    const newNameInput = document.getElementById('shopping-new-name');
    if (newNameInput) newNameInput.focus();
    announceNVDA('Einkaufsliste und Checkliste (Reiter 8) geöffnet.');
  } else if (viewName === 'sync') {
    initSyncView();
  } else if (viewName === 'wishlist') {
    populateWishlistAccountDropdown();
    renderWishlist();
    const wishTitleInput = document.getElementById('wish-title');
    if (wishTitleInput) wishTitleInput.focus();
    announceNVDA('Wunschliste und Sparziele (Reiter 7) geöffnet.');
  }
}

// ----------------------------------------------------------------------------
// 16. AES-256 WEB CRYPTO ENGINE & MULTI-LAYER SELBST-REPARATUR
// ----------------------------------------------------------------------------
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(dataObj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(JSON.stringify(dataObj));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    encodedData
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

async function decryptData(base64Ciphertext, key) {
  const combinedBuffer = base64ToArrayBuffer(base64Ciphertext);
  const combined = new Uint8Array(combinedBuffer);

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );

  const decodedStr = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(decodedStr);
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// IndexedDB Multi-Layer Backup
const IDB_NAME = 'HaushaltsbuchDB';
const IDB_STORE = 'vault_store';

function openIDB() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch(e) {
      reject(e);
    }
  });
}

async function idbSaveVault(vaultData) {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(vaultData, 'current_vault');
  } catch(e) {}
}

async function idbLoadVault() {
  try {
    const db = await openIDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get('current_vault');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch(e) {
    return null;
  }
}




let currentSaltBase64 = null;

async function checkVaultStatus() {
  let savedVault = localStorage.getItem(STORAGE_DATA_KEY);
  let savedSalt = localStorage.getItem(STORAGE_SALT_KEY) || currentSaltBase64;

  // 1. In-Memory Vault aus C# Injektion
  if (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault && window.__DISK_VAULT__.salt) {
    savedVault = window.__DISK_VAULT__.vault;
    savedSalt = window.__DISK_VAULT__.salt;
    currentSaltBase64 = savedSalt;
    try {
      localStorage.setItem(STORAGE_DATA_KEY, savedVault);
      localStorage.setItem(STORAGE_SALT_KEY, savedSalt);
    } catch(e) {}
  }

  // 2. Abfrage an lokalen C# Server (liest Datei im EXE-Ordner)
  const port = window.__LOCAL_PORT__ || 48123;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/api/get_vault`, { headers: getVaultApiHeaders() });
    const data = await r.json();
    if (data && data.vault && data.salt) {
      savedVault = data.vault;
      savedSalt = data.salt;
      currentSaltBase64 = savedSalt;
      localStorage.setItem(STORAGE_DATA_KEY, savedVault);
      localStorage.setItem(STORAGE_SALT_KEY, savedSalt);
      window.__DISK_VAULT__ = data;
      await idbSaveVault(data);
    }
  } catch(e) {}

  // 3. Fallback auf IndexedDB
  if (!savedVault || !savedSalt) {
    const idbData = await idbLoadVault();
    if (idbData && idbData.vault && idbData.salt) {
      savedVault = idbData.vault;
      savedSalt = idbData.salt;
      currentSaltBase64 = savedSalt;
      localStorage.setItem(STORAGE_DATA_KEY, savedVault);
      localStorage.setItem(STORAGE_SALT_KEY, savedSalt);
      window.__DISK_VAULT__ = idbData;
    }
  }

  updateLockScreenUI(!savedVault || !savedSalt);
}

function updateLockScreenUI(isFirstTime) {
  setTimeout(() => {
    if (typeof initLockScreenSync === 'function') initLockScreenSync();
    if (typeof BiometricAuth !== "undefined") {
      BiometricAuth.checkSupport().then(() => {
        if (!isFirstTime) {
          BiometricAuth.checkAutoUnlock();
        }
      });
    }
  }, 100);
  const firstTimeHint = document.getElementById('first-time-hint');
  const lockHeading = document.getElementById('lock-heading');
  const lockInstructions = document.getElementById('lock-instructions');

  if (firstTimeHint) firstTimeHint.style.display = isFirstTime ? 'block' : 'none';

  if (isFirstTime) {
    if (lockHeading) lockHeading.textContent = 'Willkommen! Neue PIN festlegen';
    if (lockInstructions) lockInstructions.textContent = 'Gib eine neue PIN oder ein Passwort ein (z. B. 1234), um deinen sicheren Datentresor in diesem Ordner zu erstellen.';
  } else {
    if (lockHeading) lockHeading.textContent = 'Sicherer AES-256 Zugang';
    if (lockInstructions) lockInstructions.textContent = 'Deine Finanzdaten sind auf diesem Computer geschützt. Bitte gib deine PIN oder dein Passwort ein:';
  }
}

function togglePinVisibility() {
  const pinInput = document.getElementById('pin-input');
  const toggleIcon = document.getElementById('pin-toggle-icon');
  if (!pinInput) return;

  if (pinInput.type === 'password') {
    pinInput.type = 'text';
    if (toggleIcon) toggleIcon.textContent = '🙈 Verbergen';
    announceNVDA('PIN wird im Klartext angezeigt.');
  } else {
    pinInput.type = 'password';
    if (toggleIcon) toggleIcon.textContent = '👁 Anzeigen';
    announceNVDA('PIN ist verborgen.');
  }
}

async function resetVaultSetup() {
  const confirmReset = confirm(
    '⚠️ WICHTIGER HINWEIS ZUM ZURÜCKSETZEN:\n\n' +
    'Wenn du deinen Tresor zurücksetzt, wird der bisherige verschlüsselte Tresor auf diesem Computer geleert, ' +
    'damit du eine neue PIN und ein leeres Haushaltsbuch einrichten kannst.\n\n' +
    'Möchtest du wirklich einen neuen leeren Tresor einrichten?'
  );
  if (!confirmReset) return;

  const secondConfirm = confirm(
    'Bist du dir ganz sicher? Alle bisherigen Buchungen werden gelöscht (sofern du kein Backup hast).'
  );
  if (!secondConfirm) return;

  try {
    localStorage.clear();
    sessionStorage.clear();
    window.__DISK_VAULT__ = null;
    
    const port = window.__LOCAL_PORT__ || 48123;
    await fetch(`http://127.0.0.1:${port}/api/reset_vault`, { method: 'POST', headers: getVaultApiHeaders() }).catch(() => {});
  } catch(e) {}

  announceNVDA('Tresor wurde zurückgesetzt. Bitte gib eine neue PIN ein.');
  alert('✅ Tresor wurde zurückgesetzt. Bitte erstelle jetzt deine neue PIN.');
  window.location.reload();
}

async function unlockVaultWithPin(enteredPin, isFromBio = false) {
  if (!enteredPin) return false;

  if (checkLockoutStatus()) {
    announceNVDA('Zugriff gesperrt wegen zu vieler Fehlversuche.', true);
    return false;
  }

  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error-msg');

  let storedData = localStorage.getItem(STORAGE_DATA_KEY);
  let saltBase64 = localStorage.getItem(STORAGE_SALT_KEY) || currentSaltBase64;

  if (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault && window.__DISK_VAULT__.salt) {
    storedData = window.__DISK_VAULT__.vault;
    saltBase64 = window.__DISK_VAULT__.salt;
  }

  try {
    if (!storedData || !saltBase64) {
      // Neuer Datensafe
      const salt = crypto.getRandomValues(new Uint8Array(16));
      saltBase64 = arrayBufferToBase64(salt.buffer);
      currentSaltBase64 = saltBase64;
      localStorage.setItem(STORAGE_SALT_KEY, saltBase64);
      localStorage.setItem('haushaltsbuch_vault_salt', saltBase64);

      cryptoKey = await deriveKey(enteredPin, salt);
      appState = {
        initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 },
        transactions: [],
        recurring: []
      };
      await saveStateToEncryptedStorage();
      
      setFailedAttempts(0);
      setLockoutEndTime(0);
      window.__ACTIVE_PIN__ = enteredPin;
      if (isFromBio) {
        localStorage.setItem('haushaltsbuch_bio_token', btoa(encodeURIComponent(enteredPin)));
      }
      unlockApp();
      announceNVDA('Neuer Datensafe erfolgreich eingerichtet.');
      return true;
    } else {
      // Vorhandenen Datensafe entsperren
      currentSaltBase64 = saltBase64;
      const saltBuffer = base64ToArrayBuffer(saltBase64);
      const salt = new Uint8Array(saltBuffer);
      
      let decrypted = null;
      let healedFrom1234 = false;

      try {
        const key = await deriveKey(enteredPin, salt);
        decrypted = await decryptData(storedData, key);
        cryptoKey = key;
      } catch (decryptErr) {
        // AUTO-HEALING: Prüfen, ob der Tresor versehentlich mit '1234' verschlüsselt war
        if (enteredPin !== '1234') {
          try {
            const fallbackKey = await deriveKey('1234', salt);
            decrypted = await decryptData(storedData, fallbackKey);
            if (decrypted) {
              healedFrom1234 = true;
              // Repariere sofort auf echte PIN
              cryptoKey = await deriveKey(enteredPin, salt);
              appState = decrypted;
              await saveStateToEncryptedStorage();
              console.log('[Auto-Healing] Tresor erfolgreich von 1234 auf Nutzer-PIN repariert!');
            }
          } catch(e2) {}
        }
        if (!decrypted) {
          throw decryptErr;
        }
      }

      appState = decrypted;
      if (!appState.initialBalances) appState.initialBalances = { bank: 0, paypal: 0, savings: 0, cash: 0 };
      if (!appState.customCategories) appState.customCategories = { exp: {}, inc: {}, trf: {} };
      if (!appState.wishlist || !Array.isArray(appState.wishlist)) appState.wishlist = [];
      if (!appState.shoppingList || !Array.isArray(appState.shoppingList)) appState.shoppingList = [];
      if (!appState.transactions) appState.transactions = [];
      if (!appState.recurring) appState.recurring = [];

      setFailedAttempts(0);
      setLockoutEndTime(0);
      window.__ACTIVE_PIN__ = enteredPin;

      if (isFromBio || localStorage.getItem('haushaltsbuch_bio_enabled') === 'true') {
        try {
          localStorage.setItem('haushaltsbuch_bio_token', btoa(encodeURIComponent(enteredPin)));
        } catch(e) {}
      }

      if (pinInput) pinInput.value = '';
      if (errorMsg) errorMsg.style.display = 'none';

      unlockApp();

      if (healedFrom1234) {
        const healMsg = 'Erfolgreich entsperrt! Dein Tresor wurde automatisch repariert und synchronisiert.';
        announceNVDA(healMsg, true);
      } else {
        announceNVDA('Erfolgreich entsperrt! Alle Finanzdaten wurden geladen.');
      }

      if (typeof BiometricAuth !== 'undefined' && BiometricAuth.isSupported && !localStorage.getItem('haushaltsbuch_bio_token') && !isFromBio) {
        setTimeout(() => {
          if (confirm('👆 Möchtest du die Fingerabdruck-Entsperrung für dein Smartphone aktivieren, um künftig ohne PIN-Eingabe zu öffnen?')) {
            BiometricAuth.enable(enteredPin);
          }
        }, 1200);
      }
      return true;
    }
  } catch (err) {
    let attempts = getFailedAttempts() + 1;
    setFailedAttempts(attempts);

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutEnd = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutEndTime(lockoutEnd);
      checkLockoutStatus();
      announceNVDA('5 Fehlversuche erreicht! Der Zugriff ist für 2 Stunden gesperrt.', true);
    } else {
      const remainingAttempts = MAX_FAILED_ATTEMPTS - attempts;
      if (errorMsg) {
        errorMsg.textContent = `❌ Falsche PIN oder Passwort! Zugriff verweigert. (Noch ${remainingAttempts} Versuch(e) übrig)`;
        errorMsg.style.display = 'block';
      }
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
      announceNVDA(`Falsche PIN. Zugriff verweigert. Noch ${remainingAttempts} Versuch(e) übrig. Bitte erneut eingeben.`, true);
    }
    return false;
  }
}

async function handlePinSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const pinInput = document.getElementById('pin-input');
  const enteredPin = pinInput ? pinInput.value.trim() : '';
  await unlockVaultWithPin(enteredPin, false);
}

async function saveStateToEncryptedStorage() {
  if (!cryptoKey) return;

  try {
    const encryptedVaultBase64 = await encryptData(appState, cryptoKey);
    const saltBase64 = currentSaltBase64 || localStorage.getItem(STORAGE_SALT_KEY) || (window.__DISK_VAULT__ && window.__DISK_VAULT__.salt);

    if (!saltBase64) return;
    currentSaltBase64 = saltBase64;

    // 1. LocalStorage
    localStorage.setItem(STORAGE_DATA_KEY, encryptedVaultBase64);
    localStorage.setItem(STORAGE_SALT_KEY, saltBase64);

    // 2. In-Memory Vault
    window.__DISK_VAULT__ = {
      salt: saltBase64,
      vault: encryptedVaultBase64
    };

    // 3. IndexedDB
    await idbSaveVault({ salt: saltBase64, vault: encryptedVaultBase64 });

    // 4. Festplatte (Haushaltsbuch_Daten.vault im EXE-Ordner)
    const port = window.__LOCAL_PORT__ || 48123;
    const payload = JSON.stringify({ salt: saltBase64, vault: encryptedVaultBase64 });

    try {
      await fetch(`http://127.0.0.1:${port}/api/save_vault`, {
        method: 'POST',
        headers: getVaultApiHeaders({ 'Content-Type': 'application/json' }),
        body: payload,
        keepalive: true
      });
    } catch(e) {}

  } catch (err) {
    console.error('Verschlüsselungsfehler:', err);
    announceNVDA('Fehler beim Speichern der Daten!', true);
  }
}


function unlockApp() {
  mergeCustomCategoriesIntoDB();
  populateCategoriesDropdowns();
  populateAllAccountDropdowns();
  populateBudgetCategoryDropdown();
  populateShoppingDropdowns();
  renderShoppingCart();
  renderAccountsViewList();
  const lockScreen = document.getElementById('lock-screen');
  const appWrapper = document.getElementById('app-wrapper');
  if (lockScreen) lockScreen.style.display = 'none';
  if (appWrapper) appWrapper.style.display = 'block';

  switchView('overview');
  resetInactivityTimer();

  if (window.__PENDING_SYNC_DATA__ && typeof SyncEngine !== 'undefined') {
    const pending = window.__PENDING_SYNC_DATA__;
    window.__PENDING_SYNC_DATA__ = null;
    setTimeout(() => {
      SyncEngine.importSyncedVaultData(pending);
    }, 200);
  }
}

function lockApp() {
  cryptoKey = null;
  window.__ACTIVE_PIN__ = null;
  const lockScreen = document.getElementById('lock-screen');
  const appWrapper = document.getElementById('app-wrapper');
  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error-msg');

  if (appWrapper) appWrapper.style.display = 'none';
  if (lockScreen) lockScreen.style.display = 'flex';
  if (errorMsg) errorMsg.style.display = 'none';
  if (pinInput) {
    pinInput.value = '';
    pinInput.focus();
  }

  checkVaultStatus();
  checkLockoutStatus();
  announceNVDA('App gesperrt.');
}

async function handleChangePin(e) {
  e.preventDefault();
  const oldPin = document.getElementById('change-old-pin').value.trim();
  const newPin = document.getElementById('change-new-pin').value.trim();

  if (!oldPin || !newPin) return;

  const storedData = localStorage.getItem(STORAGE_DATA_KEY);
  const saltBase64 = localStorage.getItem(STORAGE_SALT_KEY);

  try {
    const saltBuffer = base64ToArrayBuffer(saltBase64);
    const salt = new Uint8Array(saltBuffer);
    const oldKey = await deriveKey(oldPin, salt);

    await decryptData(storedData, oldKey);

    const newSalt = crypto.getRandomValues(new Uint8Array(16));
    const newSaltBase64 = arrayBufferToBase64(newSalt.buffer);
    const newKey = await deriveKey(newPin, newSalt);

    cryptoKey = newKey;
    window.__ACTIVE_PIN__ = newPin;
    if (localStorage.getItem('haushaltsbuch_bio_enabled') === 'true') { try { localStorage.setItem('haushaltsbuch_bio_token', btoa(encodeURIComponent(newPin))); } catch(e) {} }
    localStorage.setItem(STORAGE_SALT_KEY, newSaltBase64);
    await saveStateToEncryptedStorage();

    document.getElementById('form-change-pin').reset();
    announceNVDA('PIN erfolgreich geändert und Daten neu verschlüsselt!');
  } catch (err) {
    announceNVDA('Aktuelle PIN war nicht korrekt.', true);
  }
}

function resetAllAppData() {
  if (confirm('WARNUNG: Möchtest du wirklich ALLE deine Finanzdaten und die PIN unwiderruflich löschen?')) {
    localStorage.removeItem(STORAGE_DATA_KEY);
    localStorage.removeItem(STORAGE_SALT_KEY);
    localStorage.removeItem(STORAGE_ATTEMPTS_KEY);
    localStorage.removeItem(STORAGE_LOCKOUT_KEY);
    window.__DISK_VAULT__ = null;

    const port = window.__LOCAL_PORT__ || 48123;
    try {
      fetch(`http://127.0.0.1:${port}/api/save_vault`, {
        method: 'POST',
        headers: getVaultApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({})
      }).catch(() => {});
    } catch(e) {}

    cryptoKey = null;
    appState = { initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 }, transactions: [], recurring: [] };
    lockApp();
    announceNVDA('Alle Daten wurden vollständig gelöscht.');
  }
}

// ----------------------------------------------------------------------------
// 17. UNIVERSELLER BACKUP-EXPORT & -IMPORT
// ----------------------------------------------------------------------------
function exportEncryptedBackup() {
  const vault = localStorage.getItem(STORAGE_DATA_KEY);
  const salt = localStorage.getItem(STORAGE_SALT_KEY);

  if (!vault || !salt) {
    announceNVDA('Keine Daten zum Sichern vorhanden.', true);
    return;
  }

  const backupObj = {
    version: '5.0.0',
    appName: 'BarrierefreieFinanzApp',
    exportedAt: new Date().toISOString(),
    salt: salt,
    vault: vault
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
  const downloadAnchor = document.createElement('a');
  const now = new Date();
  const dateStamp = now.toISOString().split('T')[0];

  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `Haushaltsbuch_Sicherung_${dateStamp}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  announceNVDA('Verschlüsselte Sicherung erfolgreich heruntergeladen!');
}

function hexToUint8Array(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function uint8ArrayToBase64(uint8) {
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

async function importEncryptedBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const backupObj = JSON.parse(e.target.result);
      
      let normalizedVault = null;
      let normalizedSalt = null;
      let directState = null;

      if (backupObj.vault && backupObj.salt) {
        normalizedSalt = backupObj.salt;
        if (/^[0-9a-fA-F]{32}$/.test(normalizedSalt)) {
          normalizedSalt = uint8ArrayToBase64(hexToUint8Array(normalizedSalt));
        }
        normalizedVault = backupObj.vault;
      } else if (backupObj.salt && backupObj.encryptedData) {
        normalizedSalt = backupObj.salt;
        if (/^[0-9a-fA-F]{32}$/.test(normalizedSalt)) {
          normalizedSalt = uint8ArrayToBase64(hexToUint8Array(normalizedSalt));
        }

        let encParsed = backupObj.encryptedData;
        if (typeof encParsed === 'string') {
          try { encParsed = JSON.parse(encParsed); } catch(err) {}
        }

        if (encParsed && encParsed.iv && encParsed.data) {
          const ivBytes = hexToUint8Array(encParsed.iv);
          const dataBytes = hexToUint8Array(encParsed.data);
          const combined = new Uint8Array(ivBytes.length + dataBytes.length);
          combined.set(ivBytes, 0);
          combined.set(dataBytes, ivBytes.length);
          normalizedVault = uint8ArrayToBase64(combined);
        }
      } else if (backupObj.initialBalances || backupObj.transactions) {
        directState = backupObj;
      }

      if (normalizedVault && normalizedSalt) {
        localStorage.setItem(STORAGE_DATA_KEY, normalizedVault);
        localStorage.setItem(STORAGE_SALT_KEY, normalizedSalt);

        window.__DISK_VAULT__ = { salt: normalizedSalt, vault: normalizedVault };
        await idbSaveVault({ salt: normalizedSalt, vault: normalizedVault });

        const port = window.__LOCAL_PORT__ || 48123;
        try {
          fetch(`http://127.0.0.1:${port}/api/save_vault`, {
            method: 'POST',
            headers: getVaultApiHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ salt: normalizedSalt, vault: normalizedVault })
          }).catch(() => {});
        } catch(e) {}

        if (cryptoKey) {
          try {
            const decrypted = await decryptData(normalizedVault, cryptoKey);
            appState = decrypted;
            if (!appState.initialBalances) appState.initialBalances = { bank: 0, paypal: 0, savings: 0, cash: 0 };
            if (!appState.transactions) appState.transactions = [];
            if (!appState.recurring) appState.recurring = [];

            updateOverview();
            switchView('overview');
            announceNVDA('Sicherung erfolgreich importiert und live geladen! Alle Buchungen sind sofort sichtbar.');
            return;
          } catch (err) {
            lockApp();
            announceNVDA('Sicherung importiert. Bitte gib die PIN deiner Sicherungsdatei ein.');
            return;
          }
        } else {
          announceNVDA('Sicherung importiert. Bitte mit deiner PIN entsperren.');
          lockApp();
          return;
        }
      } else if (directState) {
        appState = {
          initialBalances: directState.initialBalances || { bank: 0, paypal: 0, savings: 0, cash: 0 },
          transactions: directState.transactions || [],
          recurring: directState.recurring || []
        };
        await saveStateToEncryptedStorage();
        updateOverview();
        switchView('overview');
        announceNVDA('Finanzdaten erfolgreich importiert und gespeichert!');
        return;
      }

      announceNVDA('Fehler: Unbekanntes Dateiformat.', true);
    } catch (err) {
      console.error('Import-Fehler:', err);
      announceNVDA('Fehler beim Lesen der Backup-Datei.', true);
    }
  };
  reader.readAsText(file);
}

// ----------------------------------------------------------------------------
// 18. FORMATIERUNGS-HILFSFUNKTIONEN
// ----------------------------------------------------------------------------
function formatCurrency(num) {
  const val = Number(num || 0);
  return val.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' €';
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function formatDateGerman(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDate();
  const m = MONTH_NAMES[d.getMonth()];
  const y = d.getFullYear();
  return `${day}. ${m} ${y}`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


// ============================================================================
// 20. ÄNDERUNGSPROTOKOLL (CHANGELOG) BEI UPDATES
// ============================================================================

// (CURRENT_APP_VERSION oben definiert)
const STORAGE_CHANGELOG_ENABLED_KEY = 'haushaltsbuch_show_changelog_enabled_v1';
const STORAGE_LAST_SEEN_VERSION_KEY = 'haushaltsbuch_last_seen_changelog_version_v1';

function getAppCookie(name) {
  try {
    const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? decodeURIComponent(v[2]) : null;
  } catch(e) { return null; }
}

function setAppCookie(name, value) {
  try {
    document.cookie = name + '=' + encodeURIComponent(value) + '; max-age=315360000; path=/';
  } catch(e) {}
}

function isChangelogEnabled() {
  const val = localStorage.getItem(STORAGE_CHANGELOG_ENABLED_KEY) || getAppCookie(STORAGE_CHANGELOG_ENABLED_KEY);
  return val !== 'false';
}

function getLastSeenChangelogVersion() {
  return localStorage.getItem(STORAGE_LAST_SEEN_VERSION_KEY) || getAppCookie(STORAGE_LAST_SEEN_VERSION_KEY);
}

function setLastSeenChangelogVersion(ver) {
  try { localStorage.setItem(STORAGE_LAST_SEEN_VERSION_KEY, ver); } catch(e) {}
  setAppCookie(STORAGE_LAST_SEEN_VERSION_KEY, ver);
}

function checkChangelogOnStartup() {
  const isEnabled = isChangelogEnabled();
  const lastSeen = getLastSeenChangelogVersion();

  const settingChk = document.getElementById('setting-auto-changelog');
  if (settingChk) settingChk.checked = isEnabled;

  if (isEnabled && lastSeen !== CURRENT_APP_VERSION) {
    openChangelogModal(false);
  }
}

function openChangelogModal(isManualOpen) {
  const modal = document.getElementById('changelog-modal');
  const heading = document.getElementById('changelog-modal-heading');
  const chkDontShow = document.getElementById('chk-dont-show-changelog-again');

  if (chkDontShow) {
    chkDontShow.checked = !isChangelogEnabled();
  }

  if (modal) {
    modal.style.display = 'flex';
    if (heading) heading.focus();
    announceNVDA('Änderungsprotokoll geöffnet. Was ist neu in diesem Update? Drücke Enter oder klicke auf Schließen zum Fortfahren.');
  }

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeChangelogModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function closeChangelogModal() {
  const modal = document.getElementById('changelog-modal');
  if (modal) modal.style.display = 'none';

  setLastSeenChangelogVersion(CURRENT_APP_VERSION);

  const pinInput = document.getElementById('pin-input');
  if (pinInput && document.getElementById('lock-screen') && document.getElementById('lock-screen').style.display !== 'none') {
    pinInput.focus();
  }
  announceNVDA('Änderungsprotokoll geschlossen. Bitte gib jetzt deine PIN ein.');
}

function toggleChangelogAutoShow(e) {
  const dontShow = e.target.checked;
  const isEnabled = !dontShow;
  try { localStorage.setItem(STORAGE_CHANGELOG_ENABLED_KEY, isEnabled ? 'true' : 'false'); } catch(err) {}
  setAppCookie(STORAGE_CHANGELOG_ENABLED_KEY, isEnabled ? 'true' : 'false');
  const settingChk = document.getElementById('setting-auto-changelog');
  if (settingChk) settingChk.checked = isEnabled;
  announceNVDA(isEnabled ? 'Änderungsprotokoll wird bei zukünftigen Updates automatisch angezeigt.' : 'Änderungsprotokoll wird bei zukünftigen Updates nicht mehr automatisch angezeigt.');
}

function handleChangelogSettingChange(e) {
  const isEnabled = e.target.checked;
  try { localStorage.setItem(STORAGE_CHANGELOG_ENABLED_KEY, isEnabled ? 'true' : 'false'); } catch(err) {}
  setAppCookie(STORAGE_CHANGELOG_ENABLED_KEY, isEnabled ? 'true' : 'false');
  announceNVDA(isEnabled ? 'Automatische Update-Hinweise vor dem Start aktiviert.' : 'Automatische Update-Hinweise vor dem Start deaktiviert.');
}

// ============================================================================
// 21. FEEDBACK & FEATURE-VORSCHLAG SENDEN
// ============================================================================

async function submitFeatureFeedback(e) {
  e.preventDefault();
  const nameInput = document.getElementById('feedback-name') || document.getElementById('feedback-author');
  const msgInput = document.getElementById('feedback-text') || document.getElementById('feedback-message');
  const btn = document.getElementById('btn-send-feedback') || document.getElementById('btn-submit-feedback');

  const author = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'App-Nutzer (Anonym)';
  const message = msgInput ? msgInput.value.trim() : '';

  if (!message) {
    announceNVDA('Bitte gib eine Nachricht oder deinen Wunsch ein.', true);
    return;
  }

  if (btn) btn.disabled = true;
  announceNVDA('Feedback wird gesendet...');

  const now = new Date().toLocaleString('de-DE');
  const payload = JSON.stringify({
    _subject: 'Haushaltsbuch-Feedback von ' + author,
    _template: 'table',
    _captcha: 'false',
    Absender: author,
    Nachricht: message,
    Datum: now,
    AppVersion: CURRENT_APP_VERSION
  });

  const port = window.__LOCAL_PORT__ || 48123;
  try {
    fetch('http://127.0.0.1:' + port + '/api/send_feedback', {
      method: 'POST',
      headers: getVaultApiHeaders({ 'Content-Type': 'application/json' }),
      body: payload
    }).catch(() => {});
  } catch(e) {}

  const nl = String.fromCharCode(10);
  const ntfyBody = 'Absender: ' + author + nl + 'Art: 💡 Neues Feedback / Idee' + nl + 'Datum: ' + now + nl + 'Nachricht: ' + message;
  try {
    await fetch('https://ntfy.sh/lauju_haushaltsbuch_feedback', {
      method: 'POST',
      headers: {
        'Title': 'Haushaltsbuch Feedback',
        'Priority': 'default',
        'Tags': 'bulb,speech_balloon'
      },
      body: ntfyBody
    });
  } catch(e) {
    try {
      await fetch('https://ntfy.sh/lauju_haushaltsbuch_feedback', {
        method: 'POST',
        mode: 'no-cors',
        body: ntfyBody
      });
    } catch(e2) {}
  }

  if (msgInput) msgInput.value = '';
  if (nameInput) nameInput.value = '';
  if (btn) btn.disabled = false;

  announceNVDA('Vielen Dank! Dein Vorschlag wurde erfolgreich an den Entwickler übermittelt.');
  alert('✅ Vielen Dank! Dein Vorschlag wurde sofort live an den Entwickler übertragen.');
}

function downloadEncryptedBackup() {
  exportEncryptedBackup();
}


function renderSettingsInstallmentsList() {
  const container = document.getElementById('settings-installments-list');
  if (!container) return;

  const plans = (appState.recurring || []).filter(r => r.isInstallment);
  if (plans.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding: 10px; color: var(--text-muted, #666);">Keine laufenden Ratenkäufe oder Kredite vorhanden.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  plans.forEach(plan => {
    const total = Number(plan.installmentTotal || 0);
    const paidMonths = Number(plan.installmentPaidMonths || 1);
    const totalMonths = Number(plan.installmentTotalMonths || 12);
    const rate = Number(plan.amount || 0);
    const paidSum = Math.min(total, paidMonths * rate);
    const remaining = Math.max(0, total - paidSum);
    const percent = total > 0 ? Math.min(100, Math.round((paidSum / total) * 100)) : 0;

    html += `
      <div class="settings-box" style="margin: 0; padding: 14px; border-left: 6px solid #FF9800; background: var(--card-bg, #fff);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
          <div>
            <strong style="font-size: 16px;">💳 ${escapeHTML(plan.name || 'Ratenkauf')}</strong>
            <div style="font-size: 13px; color: var(--text-muted, #666); margin-top: 2px;">
              Kategorie: ${escapeHTML(plan.category || 'Finanzen')} • Konto: ${escapeHTML(formatAccountName(plan.account))}
            </div>
            <div style="font-size: 13px; font-weight: bold; margin-top: 6px; color: #E65100;">
              ${paidMonths} von ${totalMonths} Raten bezahlt • Rate: ${formatCurrency(rate)} monatlich
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: bold; color: #D32F2F;">Restschuld: ${formatCurrency(remaining)}</div>
            <div style="font-size: 12px; color: var(--text-muted, #666);">Gesamt: ${formatCurrency(total)}</div>
          </div>
        </div>

        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>Tilgungsfortschritt</span>
            <span>${percent}% abbezahlt</span>
          </div>
          <div style="background: #e0e0e0; border-radius: 6px; height: 8px; overflow: hidden;">
            <div style="width: ${percent}%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
          </div>
        </div>

        <div style="margin-top: 10px; display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-secondary" onclick="handlePayOffInstallment('${plan.id}')" style="padding: 4px 10px; font-size: 13px;">
            <span>Vollständig ablösen / beenden</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="handleDeleteInstallmentPlan('${plan.id}')" style="padding: 4px 10px; font-size: 13px; color: #D32F2F;">
            <span>🗑️ Löschen</span>
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

async function handlePayOffInstallment(planId) {
  const plan = (appState.recurring || []).find(r => r.id === planId);
  if (!plan) return;

  const total = Number(plan.installmentTotal || 0);
  const paidMonths = Number(plan.installmentPaidMonths || 1);
  const rate = Number(plan.amount || 0);
  const paidSum = Math.min(total, paidMonths * rate);
  const remaining = Math.max(0, total - paidSum);

  if (!confirm(`Möchtest du den Ratenkauf "${plan.name}" vorzeitig beenden? Restschuld von ${formatCurrency(remaining)} wird als Einmalzahlung verbucht und der Plan gestoppt.`)) return;

  if (remaining > 0) {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'expense',
      account: plan.account,
      amount: remaining,
      category: plan.category,
      subcategory: plan.subcategory,
      description: `${plan.name} (Vorzeitige Gesamtablösung)`,
      date: new Date().toISOString().split('T')[0]
    });
  }

  appState.recurring = appState.recurring.filter(r => r.id !== planId);
  await saveStateToEncryptedStorage();
  renderSettingsInstallmentsList();
  renderSettingsRecurringList();
  updateOverview();
  announceNVDA(`Ratenkauf ${plan.name} erfolgreich vollständig abgelöst und beendet!`);
}

async function handleDeleteInstallmentPlan(planId) {
  if (!confirm('Möchtest du diesen Ratenplan wirklich löschen? Bereits getätigte Buchungen bleiben erhalten.')) return;
  appState.recurring = (appState.recurring || []).filter(r => r.id !== planId);
  await saveStateToEncryptedStorage();
  renderSettingsInstallmentsList();
  renderSettingsRecurringList();
  announceNVDA('Ratenplan gelöscht.');
}


function handleWishTypeChange() {
  const typeSelect = document.getElementById('wish-type');
  const labelEl = document.getElementById('wish-amount-label');
  const amountInput = document.getElementById('wish-amount');
  const type = typeSelect ? typeSelect.value : 'once';

  if (!labelEl || !amountInput) return;

  if (type === 'monthly') {
    labelEl.textContent = 'Monatliche Abo-Kosten in Euro (€ / Monat):';
    amountInput.placeholder = 'z. B. 14.99 oder 29.90';
  } else if (type === 'yearly') {
    labelEl.textContent = 'Jährliche Abo-Kosten in Euro (€ / Jahr):';
    amountInput.placeholder = 'z. B. 89.00 oder 120.00';
  } else if (type === 'quarterly') {
    labelEl.textContent = 'Kosten pro Quartal in Euro (€ / 3 Monate):';
    amountInput.placeholder = 'z. B. 35.00';
  } else if (type === 'halfyear') {
    labelEl.textContent = 'Kosten pro Halbjahr in Euro (€ / 6 Monate):';
    amountInput.placeholder = 'z. B. 60.00';
  } else {
    labelEl.textContent = 'Geschätzte Kosten in Euro (€ einmalig):';
    amountInput.placeholder = 'z. B. 80 oder 450';
  }

  handleWishAmountInput();
}

function handleWishAmountInput() {
  const typeSelect = document.getElementById('wish-type');
  const amountInput = document.getElementById('wish-amount');
  const hintEl = document.getElementById('wish-amount-calc-hint');
  if (!typeSelect || !amountInput || !hintEl) return;

  const type = typeSelect.value;
  const val = parseFloat(amountInput.value) || 0;

  if (val <= 0) {
    hintEl.textContent = '';
    return;
  }

  if (type === 'monthly') {
    const yearVal = val * 12;
    hintEl.textContent = `💡 ${formatCurrency(val)} / Monat = ${formatCurrency(yearVal)} im Jahr`;
  } else if (type === 'yearly') {
    const monthVal = val / 12;
    hintEl.textContent = `💡 ${formatCurrency(val)} / Jahr = ${formatCurrency(monthVal)} pro Monat`;
  } else if (type === 'quarterly') {
    const yearVal = val * 4;
    hintEl.textContent = `💡 ${formatCurrency(val)} alle 3 Monate = ${formatCurrency(yearVal)} im Jahr`;
  } else if (type === 'halfyear') {
    const yearVal = val * 2;
    hintEl.textContent = `💡 ${formatCurrency(val)} alle 6 Monate = ${formatCurrency(yearVal)} im Jahr`;
  } else {
    hintEl.textContent = '';
  }
}


async function handleFulfillWishAsRecurring(wishId) {
  ensureWishlistInitialized();
  const wish = appState.wishlist.find(w => w.id === wishId);
  if (!wish) return;

  const intervalNames = {
    monthly: 'monatlichen',
    yearly: 'jährlichen',
    quarterly: 'vierteljährlichen',
    halfyear: 'halbjährlichen'
  };
  const intName = intervalNames[wish.type] || 'wiederkehrenden';

  const confirmMsg = `Möchtest du "${wish.title}" über ${formatCurrency(wish.amount)} jetzt als ${intName} Dauerauftrag aktivieren und die 1. Abbuchung auf Konto "${formatAccountName(wish.account)}" verbuchen?`;
  if (!confirm(confirmMsg)) return;

  // 1. In appState.recurring anlegen
  if (!appState.recurring) appState.recurring = [];
  appState.recurring.push({
    id: `rec_sub_${Date.now()}`,
    type: 'expense',
    account: wish.account,
    amount: wish.amount,
    category: wish.category || 'Streaming, Musik, TV & Unterhaltung',
    subcategory: wish.title,
    name: `Abo: ${wish.title}`,
    interval: wish.type || 'monthly',
    day: 1,
    startYear: selectedYear,
    startMonth: selectedMonth,
    active: true
  });

  // 2. Erste Abbuchung sofort buchen
  const todayStr = new Date().toISOString().split('T')[0];
  appState.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'expense',
    account: wish.account,
    amount: wish.amount,
    category: wish.category || 'Streaming, Musik, TV & Unterhaltung',
    subcategory: wish.title,
    description: `Abo gestartet (Wunsch erfüllt): ${wish.title}`,
    isPlanned: false,
    date: todayStr
  });

  wish.fulfilled = true;
  await saveStateToEncryptedStorage();
  renderWishlist();
  updateOverview();
  announceNVDA(`Abo "${wish.title}" erfolgreich als Dauerauftrag aktiviert und erste Abbuchung gebucht!`);
}


// ----------------------------------------------------------------------------
// SPARTÖPFE (UNTERKONTEN & SPARZIELE) & KREDIT-ACCORDION IN DER ÜBERSICHT
// ----------------------------------------------------------------------------
function ensureSavingPotsInitialized() {
  if (!appState.savingPots || !Array.isArray(appState.savingPots)) {
    appState.savingPots = [];
  }
}

function populateSavingPotParentDropdown() {
  ensureAccountsInitialized();
  const sel = document.getElementById('pot-parent-account');
  if (!sel) return;

  sel.innerHTML = appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    return `<option value="${escapeHTML(acc.id)}" data-emoji="${icon}">${escapeHTML(acc.name)}</option>`;
  }).join('');
  applySymbolsToOptions(sel);
}

async function handleAddSavingPot(e) {
  e.preventDefault();
  ensureSavingPotsInitialized();

  const name = document.getElementById('pot-name').value.trim();
  const parentId = document.getElementById('pot-parent-account').value;
  const currentAmount = parseFloat(document.getElementById('pot-current-amount').value) || 0;
  const targetAmount = parseFloat(document.getElementById('pot-target-amount').value);
  const note = document.getElementById('pot-note').value.trim();

  if (!name || isNaN(targetAmount) || targetAmount <= 0) return;

  const newPot = {
    id: `pot_${Date.now()}`,
    accountId: parentId,
    name: name,
    currentAmount: currentAmount,
    targetAmount: targetAmount,
    note: note,
    createdAt: new Date().toISOString().split('T')[0]
  };

  appState.savingPots.push(newPot);
  await saveStateToEncryptedStorage();

  document.getElementById('form-add-saving-pot').reset();
  renderSavingPotsList();
  populateWishlistAccountDropdown();
  announceNVDA(`Spartopf "${name}" mit Ziel ${formatCurrency(targetAmount)} erfolgreich angelegt!`);
}

function renderSavingPotsList() {
  ensureSavingPotsInitialized();
  const container = document.getElementById('tab-saving-pots-list');
  if (!container) return;

  if (appState.savingPots.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding: 14px; text-align: center; color: var(--text-muted, #666);">Noch keine Spartöpfe angelegt. Erstelle oben deinen ersten Spartopf!</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
  appState.savingPots.forEach(pot => {
    const acc = appState.accounts.find(a => a.id === pot.accountId);
    const accName = acc ? acc.name : 'Hauptkonto';
    const current = Number(pot.currentAmount || 0);
    const target = Number(pot.targetAmount || 1);
    const percent = Math.min(100, Math.round((current / target) * 100));
    const remaining = Math.max(0, target - current);

    html += `
      <div class="settings-box" style="margin: 0; padding: 14px; border-left: 6px solid #9C27B0; background: var(--card-bg, #fff);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
          <div>
            <strong style="font-size: 16px;">🎯 ${escapeHTML(pot.name)}</strong>
            <div style="font-size: 13px; color: var(--text-muted, #666); margin-top: 2px;">
              Zugeordnet zu: <strong>${escapeHTML(accName)}</strong> ${pot.note ? `• <em>${escapeHTML(pot.note)}</em>` : ''}
            </div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 6px; color: #7B1FA2;">
              ${formatCurrency(current)} von ${formatCurrency(target)} gespart (${percent}%)
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: bold; color: ${remaining === 0 ? '#2E7D32' : '#E65100'};">
              ${remaining === 0 ? '🟢 Ziel erreicht!' : `Noch ${formatCurrency(remaining)}`}
            </div>
          </div>
        </div>

        <div style="margin-top: 10px;">
          <div style="background: #e0e0e0; border-radius: 6px; height: 10px; overflow: hidden;">
            <div style="width: ${percent}%; height: 100%; background: ${remaining === 0 ? '#4CAF50' : '#9C27B0'}; transition: width 0.3s;"></div>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary" onclick="switchViewToTransferForPot('${pot.id}')" style="padding: 4px 10px; font-size: 13px;">
            <span>🔄 Per Umbuchung besparen / entnehmen</span>
          </button>
          <button type="button" class="btn btn-secondary" onclick="handleDeleteSavingPot('${pot.id}')" style="padding: 4px 10px; font-size: 13px; color: #D32F2F;">
            <span>🗑️ Löschen</span>
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function switchViewToTransferForPot(potId) {
  ensureSavingPotsInitialized();
  const pot = appState.savingPots.find(p => p.id === potId);
  if (!pot) return;

  switchView('transfer');
  
  const toAccSel = document.getElementById('trf-to');
  if (toAccSel) {
    toAccSel.value = pot.accountId;
    handleTransferAccountsChange();
  }

  const toPotSel = document.getElementById('trf-to-pot');
  if (toPotSel) {
    toPotSel.value = pot.id;
  }

  announceNVDA(`Reiter 4 (Umbuchen) geöffnet. Spartopf "${pot.name}" für Einzahlung ausgewählt.`);
}

async function handleDeleteSavingPot(potId) {
  if (!confirm('Möchtest du diesen Spartopf wirklich löschen?')) return;
  appState.savingPots = (appState.savingPots || []).filter(p => p.id !== potId);
  await saveStateToEncryptedStorage();
  renderSavingPotsList();
  populateWishlistAccountDropdown();
  renderWishlist();
  announceNVDA('Spartopf gelöscht.');
}

function renderOverviewCreditAccordion() {
  const container = document.getElementById('overview-credit-items-feed');
  const subText = document.getElementById('credit-summary-subtext');
  const monthCreditEl = document.getElementById('card-month-credit');
  if (!container) return;

  const plans = (appState.recurring || []).filter(r => r.isInstallment && r.active);
  const totalRemaining = plans.reduce((sum, p) => sum + Number(p.installmentRemaining || 0), 0);

  if (subText) subText.textContent = `${plans.length} aktive Kredite & Raten`;
  if (monthCreditEl) monthCreditEl.textContent = formatCurrency(totalRemaining) + ' Rest';

  if (plans.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding: 10px; color: var(--text-muted, #666);">Aktuell keine laufenden Kredite oder Ratenkäufe vorhanden.</p>';
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';
  plans.forEach(plan => {
    const total = Number(plan.installmentTotal || 0);
    const paidMonths = Number(plan.installmentPaidMonths || 1);
    const totalMonths = Number(plan.installmentTotalMonths || 12);
    const rate = Number(plan.amount || 0);
    const remaining = Number(plan.installmentRemaining || 0);
    const percent = total > 0 ? Math.min(100, Math.round(((total - remaining) / total) * 100)) : 0;

    html += `
      <div style="background: var(--bg-hover, #f8f9fa); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <div>
            <strong>💳 ${escapeHTML(plan.name || 'Ratenkauf')}</strong>
            <div style="font-size: 12px; color: var(--text-muted, #666);">
              Rate: <strong>${formatCurrency(rate)}</strong> • ${paidMonths} von ${totalMonths} gezahlt (${percent}%)
            </div>
          </div>
          <div style="text-align: right;">
            <strong style="color: #D32F2F; font-size: 15px;">Rest: ${formatCurrency(remaining)}</strong>
          </div>
        </div>
        <div style="margin-top: 6px; background: #e0e0e0; border-radius: 4px; height: 6px; overflow: hidden;">
          <div style="width: ${percent}%; height: 100%; background: #4CAF50;"></div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}


function handleTransferAccountsChange() {
  ensureSavingPotsInitialized();
  const fromAccId = document.getElementById('trf-from') ? document.getElementById('trf-from').value : '';
  const toAccId = document.getElementById('trf-to') ? document.getElementById('trf-to').value : '';

  const fromPotGroup = document.getElementById('group-trf-from-pot');
  const fromPotSelect = document.getElementById('trf-from-pot');
  const toPotGroup = document.getElementById('group-trf-to-pot');
  const toPotSelect = document.getElementById('trf-to-pot');

  // 1. Source Account Pots
  if (fromPotGroup && fromPotSelect) {
    const fromPots = (appState.savingPots || []).filter(p => p.accountId === fromAccId);
    if (fromPots.length > 0) {
      fromPotGroup.style.display = 'block';
      let opts = '<option value="">(Kein Spartopf - Aus Kontoguthaben)</option>';
      opts += fromPots.map(p => `<option value="${escapeHTML(p.id)}">🎯 ${escapeHTML(p.name)} (${formatCurrency(p.currentAmount)})</option>`).join('');
      fromPotSelect.innerHTML = opts;
    } else {
      fromPotGroup.style.display = 'none';
      fromPotSelect.innerHTML = '<option value="">(Kein Spartopf)</option>';
    }
  }

  // 2. Destination Account Pots
  if (toPotGroup && toPotSelect) {
    const toPots = (appState.savingPots || []).filter(p => p.accountId === toAccId);
    if (toPots.length > 0) {
      toPotGroup.style.display = 'block';
      let opts = '<option value="">(Kein Spartopf - Auf Kontoguthaben)</option>';
      opts += toPots.map(p => `<option value="${escapeHTML(p.id)}">🎯 ${escapeHTML(p.name)} (${formatCurrency(p.currentAmount)} von ${formatCurrency(p.targetAmount)})</option>`).join('');
      toPotSelect.innerHTML = opts;
    } else {
      toPotGroup.style.display = 'none';
      toPotSelect.innerHTML = '<option value="">(Kein Spartopf)</option>';
    }
  }
}


// ----------------------------------------------------------------------------
// HIGH-ACCURACY FUZZY & PHONETIC SEARCH ENGINE
// ----------------------------------------------------------------------------
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function normalizeSearchText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/ck/g, 'k')
    .replace(/ph/g, 'f')
    .replace(/[^a-z0-9\s.,><=~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesFuzzyOrExact(token, compWords, rawCompText, normCompText) {
  // 1. Exact or normalized full text contains token
  if (rawCompText.includes(token) || normCompText.includes(token)) return true;

  const normToken = normalizeSearchText(token);
  if (!normToken) return false;
  if (normCompText.includes(normToken)) return true;

  if (normToken.length < 3) return false;

  // 2. Word-level fuzzy & prefix matching
  for (const word of compWords) {
    if (word.length < 2) continue;
    // Prefix or full word contains token
    if (word.startsWith(normToken) || normToken.startsWith(word)) return true;
    if (word.includes(normToken)) return true;

    // Direct word distance (lengths must be very close: at most 1 char difference)
    if (Math.abs(word.length - normToken.length) <= 1) {
      const maxAllowedDist = normToken.length <= 4 ? 1 : 2;
      if (levenshteinDistance(word, normToken) <= maxAllowedDist) {
        return true;
      }
    }

    // Substring distance only for longer tokens (at least 6 chars) and with max distance 1
    // (e.g. 'dorfbaecker' vs 'baeker' (length 6) -> 'baecker' has distance 1)
    if (normToken.length >= 6 && word.length > normToken.length) {
      for (let i = 0; i <= word.length - normToken.length; i++) {
        const sub = word.substr(i, normToken.length);
        if (levenshteinDistance(sub, normToken) <= 1) {
          return true;
        }
      }
    }
  }
  return false;
}

function clearTxSearch() {
  const qInput = document.getElementById('tx-search-query');
  if (qInput) qInput.value = '';
  currentTxFilter.query = '';
  handleTxSearchFilterChange();
  if (qInput) qInput.focus();
  announceNVDA('Suche zurückgesetzt. Alle Buchungen werden wieder angezeigt.');
}

function handleTxSearchKeyDown(e) {
  if (e.key === 'Escape') {
    clearTxSearch();
  }
}

function applyQuickSearchChip(chipText) {
  const qInput = document.getElementById('tx-search-query');
  if (!qInput) return;
  qInput.value = chipText;
  handleTxSearchFilterChange();
  qInput.focus();
}


function setQuickDate(type, offsetDays) {
  const dt = new Date();
  dt.setDate(dt.getDate() + offsetDays);
  const dateStr = dt.toISOString().split('T')[0];
  const input = document.getElementById(type + '-date');
  if (input) {
    input.value = dateStr;
    autoUpdateFrequencyByDate(type);
    input.focus();
    const deFormat = dt.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const label = offsetDays === 0 ? 'Heute' : (offsetDays === -1 ? 'Gestern' : (offsetDays === 1 ? 'Morgen' : deFormat));
    announceNVDA(`Datum auf ${label} (${deFormat}) gesetzt.`);
  }
}


function setQuickRecDay(type, dayVal) {
  const input = document.getElementById(type + '-rec-day');
  if (input) {
    input.value = dayVal;
    input.focus();
    const label = dayVal === 28 ? 'Monatsende (28.)' : `${dayVal}. des Monats`;
    announceNVDA(`Fälligkeitstag auf ${label} gesetzt.`);
  }
}


// =============================================================================
// SMARTPHONE & DESKTOP LIVE-SYNCHRONISATION CONTROLLER (E2EE)
// =============================================================================
function getSyncMode() {
  const isAndroid = !!window.__IS_ANDROID__ || 
                    (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
                    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isAndroid ? 'mobile' : 'desktop';
}

function setSyncMode(mode) {
  const mobileBox = document.getElementById('sync-mobile-box');
  const desktopBox = document.getElementById('sync-desktop-box');
  const btnMob = document.getElementById('btn-sync-mode-mobile');
  const btnDesk = document.getElementById('btn-sync-mode-desktop');

  if (btnMob) {
    btnMob.style.background = mode === 'mobile' ? 'var(--primary, #1976D2)' : '';
    btnMob.style.color = mode === 'mobile' ? '#fff' : '';
  }
  if (btnDesk) {
    btnDesk.style.background = mode === 'desktop' ? 'var(--primary, #1976D2)' : '';
    btnDesk.style.color = mode === 'desktop' ? '#fff' : '';
  }

  if (mode === 'mobile') {
    if (mobileBox) mobileBox.style.display = 'block';
    if (desktopBox) desktopBox.style.display = 'none';

    const myName = SyncEngine.getDeviceName();
    const myCode = SyncEngine.getPairingCode();

    const nameEl = document.getElementById('sync-my-device-name');
    const codeEl = document.getElementById('sync-my-code');
    if (nameEl) nameEl.textContent = myName;
    if (codeEl) codeEl.textContent = myCode;

    restartSyncListener();
    announceNVDA(`Smartphone-Synchronisation bereit. Gerätename: ${myName}. Kopplungscode: ${myCode}. Warte auf PC.`);
  } else {
    if (mobileBox) mobileBox.style.display = 'none';
    if (desktopBox) desktopBox.style.display = 'block';

    const targetDevInput = document.getElementById('input-target-device');
    if (targetDevInput) {
      targetDevInput.focus();
    }
    announceNVDA('Smartphone-Synchronisation geöffnet. Bitte Gerätename und Kopplungscode vom Smartphone eingeben.');
  }
}

function isSyncConnected() {
  return localStorage.getItem('haushaltsbuch_sync_connected') === 'true';
}

function getConnectedDevice() {
  return localStorage.getItem('haushaltsbuch_sync_connected_device') || 'Computer';
}

function getConnectedTime() {
  return localStorage.getItem('haushaltsbuch_sync_connected_time') || 'Heute';
}

function disconnectSyncPairing() {
  localStorage.removeItem('haushaltsbuch_sync_connected');
  localStorage.removeItem('haushaltsbuch_sync_connected_device');
  localStorage.removeItem('haushaltsbuch_sync_connected_time');
  if (typeof SyncEngine !== 'undefined') {
    SyncEngine.generateNewPairingCode();
  }
  updateSyncConnectedUI();
  if (typeof initLockScreenSync === 'function') {
    initLockScreenSync();
  }
  if (typeof announceNVDA === 'function') {
    announceNVDA('Verbindung getrennt. Gerätename und neuer Kopplungscode werden wieder angezeigt.');
  }
}

function updateSyncConnectedUI() {
  // Falls window.__PAIRED_DEVICE__ vom C# Server bereitsteht, in LocalStorage übernehmen
  if (typeof window !== 'undefined' && window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.device) {
    if (!localStorage.getItem('haushaltsbuch_sync_connected_device')) {
      localStorage.setItem('haushaltsbuch_sync_connected', 'true');
      localStorage.setItem('haushaltsbuch_sync_connected_device', window.__PAIRED_DEVICE__.device);
      if (window.__PAIRED_DEVICE__.code) {
        localStorage.setItem('haushaltsbuch_sync_connected_code', window.__PAIRED_DEVICE__.code);
      }
      if (window.__PAIRED_DEVICE__.time) {
        localStorage.setItem('haushaltsbuch_sync_connected_time', window.__PAIRED_DEVICE__.time);
      }
    }
  }

  const connected = isSyncConnected();
  const devName = getConnectedDevice();
  const pairedCode = localStorage.getItem('haushaltsbuch_sync_connected_code') || (window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.code) || '';
  const syncTime = getConnectedTime();

  // Lockscreen
  const lockConnectedBox = document.getElementById('lock-sync-connected');
  const lockUnconnectedBox = document.getElementById('lock-sync-unconnected');
  const lockDevSpan = document.getElementById('lock-sync-connected-dev');
  const lockTimeSpan = document.getElementById('lock-sync-connected-time');

  if (lockConnectedBox) lockConnectedBox.style.display = connected ? 'block' : 'none';
  if (lockUnconnectedBox) lockUnconnectedBox.style.display = connected ? 'none' : 'block';
  if (lockDevSpan) lockDevSpan.textContent = devName;
  if (lockTimeSpan) lockTimeSpan.textContent = syncTime;

  // Reiter 8 (Smartphone-Ansicht)
  const mainConnectedBox = document.getElementById('sync-mobile-connected');
  const mainUnconnectedBox = document.getElementById('sync-mobile-unconnected');
  const mainDevSpan = document.getElementById('sync-mobile-connected-dev');
  const mainTimeSpan = document.getElementById('sync-mobile-connected-time');

  if (mainConnectedBox) mainConnectedBox.style.display = connected ? 'block' : 'none';
  if (mainUnconnectedBox) mainUnconnectedBox.style.display = connected ? 'none' : 'block';
  if (mainDevSpan) mainDevSpan.textContent = devName;
  if (mainTimeSpan) mainTimeSpan.textContent = syncTime;

  // Reiter 8 (Desktop-Ansicht): Gespeichertes Smartphone & 1-Klick-Abgleich
  const pairedCard = document.getElementById('sync-desktop-paired-card');
  const manualForm = document.getElementById('sync-desktop-form');
  const pairedDevSpan = document.getElementById('sync-desktop-paired-name');
  const pairedCodeSpan = document.getElementById('sync-desktop-paired-code');
  const pairedTimeSpan = document.getElementById('sync-desktop-paired-time');
  const quickBtnDevName = document.getElementById('sync-quick-btn-devname');
  const targetDevInput = document.getElementById('input-target-device');
  const targetCodeInput = document.getElementById('input-target-code');

  if (devName && devName !== 'Unbekanntes Gerät') {
    if (targetDevInput && !targetDevInput.value) targetDevInput.value = devName;
    if (targetCodeInput && !targetCodeInput.value && pairedCode) targetCodeInput.value = pairedCode;

    if (pairedCard) pairedCard.style.display = 'block';
    if (pairedDevSpan) pairedDevSpan.textContent = devName;
    if (pairedCodeSpan) pairedCodeSpan.textContent = pairedCode || 'Gespeichert';
    if (pairedTimeSpan) pairedTimeSpan.textContent = syncTime;
    if (quickBtnDevName) quickBtnDevName.textContent = devName;
    if (manualForm && !window.__MANUAL_SYNC_EDIT__) manualForm.style.display = 'none';
  } else {
    if (pairedCard) pairedCard.style.display = 'none';
    if (manualForm) manualForm.style.display = 'block';
  }
}

function triggerQuickSyncWithPaired() {
  const devName = localStorage.getItem('haushaltsbuch_sync_connected_device') || (window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.device);
  const code = localStorage.getItem('haushaltsbuch_sync_connected_code') || (window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.code);

  const targetDevInput = document.getElementById('input-target-device');
  const targetCodeInput = document.getElementById('input-target-code');

  if (targetDevInput && devName) targetDevInput.value = devName;
  if (targetCodeInput && code) targetCodeInput.value = code;

  handleStartSync();
}

function editSyncConnection() {
  window.__MANUAL_SYNC_EDIT__ = true;
  const manualForm = document.getElementById('sync-desktop-form');
  if (manualForm) {
    manualForm.style.display = 'block';
    const input = document.getElementById('input-target-device');
    if (input) input.focus();
  }
  if (typeof announceNVDA === 'function') {
    announceNVDA('Eingabefelder für Smartphone-Name und Code eingeblendet.');
  }
}

function initLockScreenSync() {
  if (typeof SyncEngine === 'undefined') return;

  // Wenn noch nicht mit dem Computer verbunden: Bei JEDEM App-Start einen neuen Kopplungscode generieren
  if (!isSyncConnected()) {
    SyncEngine.generateNewPairingCode();
  }

  updateSyncConnectedUI();

  const myDevice = SyncEngine.getDeviceName();
  const myCode = SyncEngine.getPairingCode();

  const devEl = document.getElementById('lock-sync-device-name');
  const codeEl = document.getElementById('lock-sync-code');

  if (typeof setAccessibleCodeValue === 'function') {
    setAccessibleCodeValue(devEl, myDevice, 'Gerätename');
    setAccessibleCodeValue(codeEl, myCode, 'Kopplungscode');
  } else {
    if (devEl) { if (devEl.tagName === 'INPUT') devEl.value = myDevice; else devEl.textContent = myDevice; }
    if (codeEl) { if (codeEl.tagName === 'INPUT') codeEl.value = myCode; else codeEl.textContent = myCode; }
  }

  const mainNameEl = document.getElementById('sync-my-device-name');
  const mainCodeEl = document.getElementById('sync-my-code');
  if (typeof setAccessibleCodeValue === 'function') {
    setAccessibleCodeValue(mainNameEl, myDevice, 'Gerätename');
    setAccessibleCodeValue(mainCodeEl, myCode, 'Kopplungscode');
  } else {
    if (mainNameEl) { if (mainNameEl.tagName === 'INPUT') mainNameEl.value = myDevice; else mainNameEl.textContent = myDevice; }
    if (mainCodeEl) { if (mainCodeEl.tagName === 'INPUT') mainCodeEl.value = myCode; else mainCodeEl.textContent = myCode; }
  }

  restartSyncListener();

  // Regelmäßige Erneuerung des Kopplungscodes (alle 10 Minuten), solange noch nicht gekoppelt
  if (!window.__sync_rotate_timer__) {
    window.__sync_rotate_timer__ = setInterval(() => {
      if (!isSyncConnected() && typeof SyncEngine !== 'undefined') {
        generateNewSyncCode(true); // leise ohne Ton/Alert
      }
    }, 10 * 60 * 1000);
  }
}

function initSyncView() {
  setSyncMode(getSyncMode());
  updateSyncConnectedUI();
}

function restartSyncListener() {
  if (typeof SyncEngine === 'undefined') return;
  const statusEl = document.getElementById('sync-receiver-status');
  const lockStatusEl = document.getElementById('lock-sync-status');

  SyncEngine.stopListening();
  SyncEngine.startListening((state, msg) => {
    if (statusEl) {
      statusEl.textContent = msg;
      if (state === 'success') {
        statusEl.style.color = '#15803d';
      } else if (state === 'error') {
        statusEl.style.color = '#b91c1c';
      } else {
        statusEl.style.color = 'inherit';
      }
    }
    if (lockStatusEl) {
      lockStatusEl.textContent = msg;
      if (state === 'success') {
        lockStatusEl.style.color = '#15803d';
        lockStatusEl.style.background = 'rgba(76, 175, 80, 0.15)';
      } else if (state === 'error') {
        lockStatusEl.style.color = '#b91c1c';
        lockStatusEl.style.background = 'rgba(239, 68, 68, 0.15)';
      } else {
        lockStatusEl.style.color = '#1565C0';
        lockStatusEl.style.background = 'rgba(255, 255, 255, 0.8)';
      }
    }
    if (typeof announceNVDA === 'function') announceNVDA(msg);
  });
}

function generateNewSyncCode(silent = false) {
  if (typeof SyncEngine === 'undefined') return;
  const newCode = SyncEngine.generateNewPairingCode();
  const codeEl = document.getElementById('sync-my-code');
  const lockCodeEl = document.getElementById('lock-sync-code');
  if (typeof setAccessibleCodeValue === 'function') {
    setAccessibleCodeValue(codeEl, newCode, 'Kopplungscode');
    setAccessibleCodeValue(lockCodeEl, newCode, 'Kopplungscode');
  } else {
    if (codeEl) { if (codeEl.tagName === 'INPUT') codeEl.value = newCode; else codeEl.textContent = newCode; }
    if (lockCodeEl) { if (lockCodeEl.tagName === 'INPUT') lockCodeEl.value = newCode; else lockCodeEl.textContent = newCode; }
  }
  restartSyncListener();
  if (!silent && typeof announceNVDA === 'function') {
    announceNVDA(`Neuer Kopplungscode generiert: ${newCode}.`, true);
  }
}

async function handleStartSync(e) {
  if (e && e.preventDefault) e.preventDefault();

  const devInput = document.getElementById('input-target-device');
  const codeInput = document.getElementById('input-target-code');
  const statusBox = document.getElementById('sync-sender-status');
  const btnTrigger = document.getElementById('btn-trigger-sync');

  const targetName = devInput ? devInput.value.trim() : '';
  const targetCode = codeInput ? codeInput.value.trim() : '';

  if (!targetName || !targetCode) {
    alert('Bitte gib den Smartphone-Namen und den Kopplungscode ein!');
    return;
  }

  if (statusBox) {
    statusBox.style.display = 'block';
    statusBox.style.background = 'rgba(33, 150, 243, 0.1)';
    statusBox.style.color = '#0284c7';
    statusBox.textContent = '🚀 Starte hochsichere Ende-zu-Ende verschlüsselte Verbindung...';
  }

  if (btnTrigger) btnTrigger.disabled = true;

  try {
    await SyncEngine.syncWithSmartphone(targetName, targetCode, (state, msg) => {
      if (statusBox) {
        statusBox.textContent = msg;
        if (state === 'success') {
          statusBox.style.background = 'rgba(76, 175, 80, 0.15)';
          statusBox.style.color = '#15803d';
        }
      }
      announceNVDA(msg);
    });
  } catch(err) {
    if (statusBox) {
      statusBox.style.background = 'rgba(239, 68, 68, 0.15)';
      statusBox.style.color = '#b91c1c';
      statusBox.textContent = '❌ ' + err.message;
    }
    announceNVDA('Synchronisationsfehler: ' + err.message);
  } finally {
    if (btnTrigger) btnTrigger.disabled = false;
  }
}


// =============================================================================
// BIOMETRISCHE AUTHENTIFIZIERUNG (FINGERABDRUCK / BIOMETRIE / WEBAUTHN)
// =============================================================================
const BiometricAuth = {
  isSupported: false,
  isCancelledForSession: false,
  isPrompting: false,

  isMobile() {
    return !!window.AndroidBiometrics || 
           !!window.__IS_ANDROID__ || 
           (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
           /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  async checkSupport() {
    try {
      // 1. NATIVES ANDROID SYSTEM (BiometricPrompt via AndroidBiometrics)
      if (window.AndroidBiometrics && typeof window.AndroidBiometrics.isAvailable === 'function') {
        this.isSupported = window.AndroidBiometrics.isAvailable();
      }
      // 2. WEBAUTHN (Nur auf Mobilgeräten)
      else if (this.isMobile() && window.PublicKeyCredential && 
          typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        this.isSupported = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } else {
        this.isSupported = false;
      }
    } catch(e) {
      this.isSupported = false;
    }
    this.updateUI();
    return this.isSupported;
  },

  updateUI() {
    const isBioEnabled = localStorage.getItem('haushaltsbuch_bio_enabled') === 'true';
    const hasPinStored = !!localStorage.getItem('haushaltsbuch_bio_token');
    const bioBtn = document.getElementById('btn-biometric-unlock');
    const bioSection = document.getElementById('settings-biometric-section');
    const bioToggle = document.getElementById('setting-biometric-toggle');
    const bioHint = document.getElementById('bio-status-hint');

    // Button auf Sperrbildschirm nur anzeigen, wenn es ein Mobilgeraet ist und Fingerabdruck eingerichtet ist
    if (bioBtn) {
      bioBtn.style.display = (this.isMobile() && isBioEnabled && hasPinStored) ? 'block' : 'none';
    }

    if (bioSection) {
      bioSection.style.display = 'block';
    }

    if (bioToggle) {
      bioToggle.checked = isBioEnabled && hasPinStored;
    }

    if (bioHint) {
      if (isBioEnabled && hasPinStored) {
        bioHint.textContent = '✅ Fingerabdruck-Entsperrung ist aktiv.';
        bioHint.style.color = '#2E7D32';
      } else {
        bioHint.textContent = 'Fingerabdruck ist derzeit nicht eingerichtet.';
        bioHint.style.color = 'var(--text-muted, #666)';
      }
    }
  },

  // AUTOMATISCHER FINGERABDRUCK-START BEIM ÖFFNEN DER APP
  async checkAutoUnlock() {
    // 1. NIEMALS auf dem Desktop-Computer abfragen!
    if (!this.isMobile()) return;

    // 2. Wenn in dieser Sitzung bereits auf "Abbrechen" geklickt wurde, NICHT mehr abfragen!
    if (this.isCancelledForSession || sessionStorage.getItem('haushaltsbuch_bio_dismissed') === 'true') {
      return;
    }

    // 3. Nur wenn ein Datenspeicherstand existiert und Fingerabdruck aktiv ist
    const hasVault = !!(localStorage.getItem(STORAGE_DATA_KEY) || (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault));
    const isBioEnabled = localStorage.getItem('haushaltsbuch_bio_enabled') === 'true';
    const hasPinStored = !!localStorage.getItem('haushaltsbuch_bio_token');
    const isUnlocked = typeof cryptoKey !== 'undefined' && cryptoKey !== null;

    if (hasVault && isBioEnabled && hasPinStored && !isUnlocked && !this.isPrompting) {
      setTimeout(() => {
        if (!cryptoKey && !this.isCancelledForSession && sessionStorage.getItem('haushaltsbuch_bio_dismissed') !== 'true') {
          this.authenticateAndUnlock(true);
        }
      }, 350);
    }
  },

  async enable(pinToStore) {
    let pin = pinToStore;
    if (!pin && typeof window !== 'undefined' && window.__ACTIVE_PIN__) {
      pin = window.__ACTIVE_PIN__;
    }
    if (!pin) {
      pin = prompt('Bitte bestätige deine aktuelle PIN, um den Fingerabdruck zu aktivieren:');
    }
    if (!pin || !pin.trim()) {
      if (typeof announceNVDA === 'function') announceNVDA('Aktivierung abgebrochen: Keine PIN eingegeben.');
      return false;
    }

    try {
      if (window.AndroidBiometrics && typeof window.AndroidBiometrics.isAvailable === 'function') {
        if (!window.AndroidBiometrics.isAvailable()) {
          alert('Auf diesem Smartphone ist kein Fingerabdruck in den Android-Einstellungen eingerichtet.');
          return false;
        }
      } else if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        const userId = new Uint8Array(16);
        crypto.getRandomValues(userId);

        if (typeof announceNVDA === 'function') announceNVDA('Bitte berühre jetzt den Fingerabdrucksensor deines Geräts...');
        await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: { name: "Barrierefreie FinanzApp", id: window.location.hostname || "localhost" },
            user: { id: userId, name: "user", displayName: "FinanzApp Nutzer" },
            pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
            authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
            timeout: 60000
          }
        }).catch(() => true);
      }

      const token = btoa(encodeURIComponent(pin.trim()));
      localStorage.setItem('haushaltsbuch_bio_token', token);
      localStorage.setItem('haushaltsbuch_bio_enabled', 'true');
      this.isCancelledForSession = false;
      sessionStorage.removeItem('haushaltsbuch_bio_dismissed');
      this.updateUI();

      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate([30, 40, 50]); } catch(e) {}
      }

      const successMsg = 'Fingerabdruck erfolgreich eingerichtet und aktiviert! Die App öffnet sich künftig auf dem Smartphone direkt per Fingerabdruck.';
      if (typeof announceNVDA === 'function') announceNVDA(successMsg, true);
      const bioHint = document.getElementById('bio-status-hint');
      if (bioHint) {
        bioHint.textContent = '✅ Fingerabdruck-Entsperrung ist aktiv.';
        bioHint.style.color = '#2E7D32';
      }
      return true;
    } catch(err) {
      const errMsg = 'Fehler beim Aktivieren der Biometrie: ' + (err.message || 'Unbekannter Fehler');
      if (typeof announceNVDA === 'function') announceNVDA(errMsg, true);
      const bioHint = document.getElementById('bio-status-hint');
      if (bioHint) {
        bioHint.textContent = '❌ ' + errMsg;
        bioHint.style.color = '#C62828';
      }
      return false;
    }
  },

  disable() {
    localStorage.removeItem('haushaltsbuch_bio_token');
    localStorage.setItem('haushaltsbuch_bio_enabled', 'false');
    this.isCancelledForSession = false;
    sessionStorage.removeItem('haushaltsbuch_bio_dismissed');
    this.updateUI();
    const testResult = document.getElementById('bio-test-result');
    if (testResult) testResult.textContent = '';
    if (typeof announceNVDA === 'function') announceNVDA('Fingerabdruck-Entsperrung deaktiviert.');
  },

  async testBiometricAuth() {
    const testResult = document.getElementById('bio-test-result');
    const updateResult = (msg, isSuccess) => {
      if (testResult) {
        testResult.textContent = msg;
        testResult.style.color = isSuccess ? '#2E7D32' : '#C62828';
      }
      if (typeof announceNVDA === 'function') announceNVDA(msg, true);
    };

    const isBioEnabled = localStorage.getItem('haushaltsbuch_bio_enabled') === 'true';
    const hasPinStored = !!localStorage.getItem('haushaltsbuch_bio_token');

    if (!isBioEnabled || !hasPinStored) {
      updateResult('⚠️ Bitte aktiviere zuerst die Option "Mit Fingerabdruck / Biometrie entsperren" oben.', false);
      return;
    }

    updateResult('👆 Bitte Fingerabdruck-Sensor jetzt berühren...', true);

    // A. NATIVES ANDROID SYSTEM (BiometricPrompt)
    if (window.AndroidBiometrics && typeof window.AndroidBiometrics.authenticate === 'function') {
      window.onAndroidBiometricSuccess = () => {
        if (window.navigator && window.navigator.vibrate) {
          try { window.navigator.vibrate(50); } catch(e) {}
        }
        updateResult('✅ Fingerabdruck-Test erfolgreich! Das native System vom Smartphone funktioniert einwandfrei.', true);
      };

      window.onAndroidBiometricError = (code, msg) => {
        console.log('[AndroidBiometrics Test] Error code:', code, msg);
        updateResult('❌ Fingerabdruck-Test abgebrochen oder nicht erkannt (' + (msg || 'Code ' + code) + ').', false);
      };

      window.onAndroidBiometricFailed = () => {
        updateResult('⚠️ Fingerabdruck nicht erkannt, bitte erneut versuchen.', false);
      };

      try {
        window.AndroidBiometrics.authenticate('Fingerabdruck-Test', 'Sensor zur Überprüfung berühren');
        return;
      } catch(e) {
        console.warn('Native test error, fallback to webauthn:', e);
      }
    }

    // B. WEBAUTHN FALLBACK
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);
        await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            userVerification: "required",
            timeout: 60000
          }
        });
      }

      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(50); } catch(e) {}
      }

      updateResult('✅ Fingerabdruck-Test erfolgreich! Dein Sensor funktioniert einwandfrei.', true);
    } catch(err) {
      console.warn('Biometric test failed:', err);
      updateResult('❌ Fingerabdruck nicht erkannt oder abgebrochen (' + (err.name || err.message || 'Abbruch') + ').', false);
    }
  },

  async authenticateAndUnlock(isAuto = false) {
    if (this.isPrompting) return;

    // Wenn abgebrochen und automatischer Aufruf -> abbrechen!
    if (isAuto && (this.isCancelledForSession || sessionStorage.getItem('haushaltsbuch_bio_dismissed') === 'true')) {
      return;
    }

    const token = localStorage.getItem('haushaltsbuch_bio_token');
    if (!token) {
      if (!isAuto && typeof announceNVDA === 'function') announceNVDA('Kein Fingerabdruck hinterlegt. Bitte PIN eingeben.');
      return;
    }

    this.isPrompting = true;

    // A. NATIVES ANDROID SYSTEM VOM HANDY (BiometricPrompt)
    if (window.AndroidBiometrics && typeof window.AndroidBiometrics.authenticate === 'function') {
      window.onAndroidBiometricSuccess = () => {
        this.isPrompting = false;
        this.finishUnlockWithToken(token);
      };

      window.onAndroidBiometricError = (code, msg) => {
        this.isPrompting = false;
        console.log('[AndroidBiometrics] Error/Cancel code:', code, msg);
        // Code 10 = ERROR_USER_CANCELED, Code 13 = ERROR_NEGATIVE_BUTTON ("Abbrechen")
        this.isCancelledForSession = true;
        sessionStorage.setItem('haushaltsbuch_bio_dismissed', 'true');
        if (typeof announceNVDA === 'function') announceNVDA('Fingerabdruck abgebrochen. Bitte PIN manuell eingeben.');
        const pinInput = document.getElementById('pin-input');
        if (pinInput) pinInput.focus();
      };

      window.onAndroidBiometricFailed = () => {
        if (typeof announceNVDA === 'function') announceNVDA('Fingerabdruck nicht erkannt, bitte erneut berühren.');
      };

      try {
        window.AndroidBiometrics.authenticate('Haushaltsbuch Barrierefrei', 'Bitte Fingerabdrucksensor berühren');
        return;
      } catch(e) {
        console.warn('Native biometric call failed, falling back:', e);
        this.isPrompting = false;
      }
    }

    // B. WEBAUTHN FALLBACK (FÜR BROWSER / PWA)
    try {
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        crypto.getRandomValues(challenge);

        if (typeof announceNVDA === 'function') announceNVDA('Bitte Fingerabdrucksensor berühren...');
        await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            userVerification: "required",
            timeout: 60000
          }
        });
      }

      this.finishUnlockWithToken(token);
    } catch(err) {
      console.warn('Biometric auth cancelled or failed:', err);
      // Wenn abgebrochen oder Fehler: In dieser Session nicht mehr automatisch abfragen!
      this.isCancelledForSession = true;
      sessionStorage.setItem('haushaltsbuch_bio_dismissed', 'true');
      if (typeof announceNVDA === 'function') announceNVDA('Fingerabdruck abgebrochen. Bitte PIN manuell eingeben.');
      const pinInput = document.getElementById('pin-input');
      if (pinInput) pinInput.focus();
    } finally {
      this.isPrompting = false;
    }
  },

  finishUnlockWithToken(token) {
    try {
      const pin = decodeURIComponent(atob(token));
      const pinInput = document.getElementById('pin-input');
      if (pinInput) {
        pinInput.value = pin;
      }

      if (window.navigator && window.navigator.vibrate) {
        try { window.navigator.vibrate(50); } catch(e) {}
      }

      unlockVaultWithPin(pin, true);
    } catch(e) {
      console.error('Error unpacking bio token:', e);
    }
  }
};

async function handleBiometricToggle(enable) {
  if (enable) {
    await BiometricAuth.enable();
  } else {
    BiometricAuth.disable();
  }
}


// =========================================================================
// BARRIEREFREIES BUCHSTABIEREN & KOPIEREN FÜR TALKBACK & SCREENREADER
// =========================================================================
window.spellOutText = function(text, label) {
  if (!text || text === '---' || text === '--- ---') {
    if (typeof announceNVDA === 'function') announceNVDA('Kein Code vorhanden.');
    return;
  }

  const phoneticMap = {
    'A': 'A wie Anton', 'B': 'B wie Berta', 'C': 'C wie Cäsar', 'D': 'D wie Dora',
    'E': 'E wie Emil', 'F': 'F wie Friedrich', 'G': 'G wie Gustav', 'H': 'H wie Heinrich',
    'I': 'I wie Ida', 'J': 'J wie Julius', 'K': 'K wie Kaufmann', 'L': 'L wie Ludwig',
    'M': 'M wie Martha', 'N': 'N wie Nordpol', 'O': 'O wie Otto', 'P': 'P wie Paula',
    'Q': 'Q wie Quelle', 'R': 'R wie Richard', 'S': 'S wie Siegfried', 'T': 'T wie Theodor',
    'U': 'U wie Ulrich', 'V': 'V wie Viktor', 'W': 'W wie Wilhelm', 'X': 'X wie Xanthippe',
    'Y': 'Y wie Ypsilon', 'Z': 'Z wie Zeppelin', '-': 'Bindestrich'
  };

  const letters = text.trim().split('').map(c => {
    const up = c.toUpperCase();
    if (phoneticMap[up]) return phoneticMap[up];
    if (c >= '0' && c <= '9') return c;
    if (c === ' ') return 'Leerzeichen';
    return c;
  });

  const spelled = letters.join('. ');
  const announcement = `${label} buchstabiert: ${spelled}.`;

  // 1. NVDA / TalkBack Live Region
  if (typeof announceNVDA === 'function') {
    announceNVDA(announcement, true);
  }

  // 2. Web Speech API (TalkBack Sprachausgabe)
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(announcement);
      utter.lang = 'de-DE';
      utter.rate = 0.85;
      window.speechSynthesis.speak(utter);
    } catch(e) {}
  }

  // 3. Taktiles Feedback
  if (window.navigator && window.navigator.vibrate) {
    try { window.navigator.vibrate([30, 20, 30]); } catch(e) {}
  }
};

window.copyToClipboard = function(text, label) {
  if (!text || text === '---' || text === '--- ---') return;
  const finishMsg = `${label} ${text} in die Zwischenablage kopiert.`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      if (typeof announceNVDA === 'function') announceNVDA(finishMsg, true);
      if (window.navigator && window.navigator.vibrate) try { window.navigator.vibrate([40, 30, 40]); } catch(e) {}
    }).catch(() => fallbackCopy(text, finishMsg));
  } else {
    fallbackCopy(text, finishMsg);
  }
};

function fallbackCopy(text, msg) {
  try {
    const t = document.createElement('textarea');
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand('copy');
    document.body.removeChild(t);
    if (typeof announceNVDA === 'function') announceNVDA(msg, true);
    if (window.navigator && window.navigator.vibrate) try { window.navigator.vibrate([40, 30, 40]); } catch(e) {}
  } catch(e) {}
}

function setAccessibleCodeValue(el, val, label) {
  if (!el) return;
  if (el.tagName === 'INPUT') {
    el.value = val;
  } else {
    el.textContent = val;
  }
  el.setAttribute('aria-label', `${label}: ${val}. Mit TalkBack Zeichen für Zeichen durchwischen zum Buchstabieren oder Buchstabier-Button drücken.`);
}


// =============================================================================
// MAGISCHER SYNC-LINK (E-MAIL, LINK & ZWISCHENABLAGE)
// =============================================================================
