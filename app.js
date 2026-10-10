// ============================================================================
// 1. GLOBALE KONSTANTEN, KATEGORIE-DATENBANK & INITIALER STATE
// ============================================================================
const CURRENT_APP_VERSION = 'v6.9.11';
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
  "Kiosk, Späti, Tabak & Zeitschriften": "🏪",
  "Automaten, SB-Stationen & Verpflegung unterwegs": "🎰",
  "Bäckerei, Café & Snacks unterwegs": "🥐",
  "Restaurants, Cafés & Gastronomie": "🍽️",
  "Lieferdienste & Essen bestellen": "🛵",
  "Post, Pakete, Briefmarken & Schreibwaren": "📮",
  "Miete, Wohnen & Nebenkosten": "🏠",
  "Haushalt, Möbel, Garten & Handwerker": "🛋️",
  "Mobilität, Auto & Kraftfahrzeuge": "🚗",
  "ÖPNV, Bahn, Bus, Flug & Reisen": "🚆",
  "Glücksspiel, Lotto & Wetten": "🎲",
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
  "Pfand, Leergut & Recycling-Einnahmen": "♻️",
  "Trinkgeld, Kaffeekasse & Ehrenamt": "☕",
  "Fundgeld, Glücksfunde & Kleingeld-Erlöse": "🪙",
  "Taschengeld & Private Unterstützung": "👛",
  "Nebenjob, Minijob & Freiberufliche Projekte": "🛠️",
  "Spenden, Zuwendungen & Förderungen": "❤️",
  "Geschenke, Boni & Gewinne": "🎁",
  "Rente, Pension & Versorgung": "👴",
  "Verkäufe, Gebrauchtwaren & Erstattungen": "🏷️",
  "Zinsen, Dividenden, Miete & Kapital": "📈",
  "Cashback, Prämien & Treueprogramme": "🎁",
  "Erstattungen, Steuern & Kautionen": "💶",
  "Private Rückzahlungen & Kostenbeteiligungen": "🤝",
  "Vermietung, Verpachtung & Carsharing": "🔑",
  "Kreatives, Musik, Kunst & Content Creation": "🎨",
  "Krypto, Staking & Web3-Erträge": "🪙",
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
    "Kiosk, Späti, Tabak & Zeitschriften": [
      "Gesamt / Kiosk allgemein",
      "Kiosk / Trinkhalle / Büdchen",
      "Späti / Spätkauf / Nachtkiosk",
      "Tabakwaren & Zigaretten",
      "Zigarettendrehtabak, Filter & Blättchen",
      "E-Zigaretten, Vapes & Liquids",
      "Zigarren & Zigarillos",
      "Zeitschriften, Zeitungen & Magazine",
      "Comics, Rätselhefte & Programmzeitschriften",
      "Kaffee to Go & Heißgetränke am Kiosk",
      "Energy Drinks, Softdrinks & Kaltgetränke",
      "Bier, Spirituosen & Feierabendgetränke",
      "Süßigkeiten, Schokolade, Chips & Kaugummi",
      "Eis & Wassereis am Kiosk",
      "Lottoannahmestelle & Rubbellose",
      "Guthaben- & Prepaid-Karten (Google Play, Paysafe, Apple etc.)"
    ],
    "Automaten, SB-Stationen & Verpflegung unterwegs": [
      "Gesamt / Automaten allgemein",
      "Snackautomat & Süßigkeitenautomat",
      "Getränkeautomat (Dosen & Flaschen)",
      "Kaffeeautomat & Heißgetränkeautomat",
      "Zigarettenautomat",
      "Fahrkartenautomat (Bahn, Bus, Straßenbahn)",
      "Parkscheinautomat & Parkuhr",
      "Pfandautomat / Leergutautomat",
      "Passbildautomat & Fotoautomat",
      "Geldspielautomat / Unterhaltungsautomat",
      "Geldwechselautomat & Münzwechsler",
      "Milchtankstelle & Regiomat (Hofladen-Automat)",
      "Fleischautomat & Grillfleisch-Automat",
      "Eisautomat",
      "SB-Waschsalon / Waschautomat & Trockner",
      "SB-Autowäsche (Waschbox & SB-Staubsauger)",
      "Fahrradschlauch-Automat",
      "Kaugummiautomat & Spielzeugautomat"
    ],
    "Bäckerei, Café & Snacks unterwegs": [
      "Gesamt / Bäckerei allgemein",
      "Bäckerei (Brötchen, Brot & Teilchen)",
      "Kaffee & Gebäck to Go",
      "Belegte Brötchen & Snacks unterwegs",
      "Konditorei (Kuchen, Torten & Feingebäck)",
      "Eisdiele & Eiscafé",
      "Metzgerei-Imbiss & Heißtheke (Leberkäse, Frikadelle)",
      "Foodtruck & Imbisswagen"
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
    "Post, Pakete, Briefmarken & Schreibwaren": [
      "Gesamt / Post & Pakete allgemein",
      "Briefmarken & Postkarten (Deutsche Post)",
      "Paketmarken & Porto (DHL, Hermes, DPD, GLS, UPS)",
      "Einschreiben, Prio & Behördenbriefe",
      "Packmaterial (Kartons, Polsterfolie, Klebeband)",
      "Schreibwaren, Ordner, Hefte, Blöcke & Stifte",
      "Kopieren, Scannen & Drucken (Copyshop)",
      "Postfiliale & Postbank Schaltergebühren"
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
    "Glücksspiel, Lotto & Wetten": [
      "Gesamt / Glücksspiel allgemein",
      "Lotto (Lotto 6aus49, Eurojackpot, GlücksSpirale)",
      "Rubbellose & Losbriefe",
      "Aktion Mensch, Fernsehlotterie & Traumhausverlosung",
      "Sportwetten (Tipico, bwin, Oddset etc.)",
      "Spielhalle & Spielbank",
      "Online-Casino & Poker"
    ],
    "Sonstige Ausgaben & Bargeld": [
      "Bargeldabhebung am Geldautomaten",
      "Geld an Freunde / Familie verliehen (Leihgabe)",
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
    "Pfand, Leergut & Recycling-Einnahmen": [
      "Gesamt / Pfand & Leergut allgemein",
      "Pfandflaschen & Dosen (Einwegpfand 0,25 €)",
      "Mehrwegflaschen & Bierkästen (Mehrwegpfand)",
      "Pfandbon bar an Supermarktkasse ausgezahlt",
      "Altmetall & Schrottverkauf Erlöse",
      "Altpapier & Wertstoffhof Erlöse",
      "Kabel- & Elektronik-Recycling Erlöse",
      "Batterie- & Autobatterie-Pfand Rückerstattung"
    ],
    "Trinkgeld, Kaffeekasse & Ehrenamt": [
      "Gesamt / Trinkgeld allgemein",
      "Trinkgeld bar erhalten (Beruf, Service & Gastronomie)",
      "Trinkgeld-Anteil aus Teamkasse / Tronc",
      "Aufwandsentschädigung Ehrenamt (Übungsleiterpauschale)",
      "Aufwandsentschädigung Wahlhelfer / Schöffe",
      "Aufwandsentschädigung Blutspende / Plasmaspende",
      "Aufwandsentschädigung medizinische Studien",
      "Dankeschön / Trinkgeld privat erhalten"
    ],
    "Fundgeld, Glücksfunde & Kleingeld-Erlöse": [
      "Gesamt / Fundgeld & Kleingeld allgemein",
      "Gefundenes Bargeld (Münzen / Geldscheine)",
      "Kleingeld-Spardose eingezahlt / bei Bank umgetauscht",
      "Einkaufswagen-Münze / Chip behalten",
      "Guthabenkarten Restbetrag / Pfandkarten bar ausgezahlt",
      "Tombola / Verlosung Bargeldgewinn"
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
      "Geld von Freunden / Familie geliehen",
      "Rückzahlung von geliehenem Geld erhalten",
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
  shoppingList: [],
  peerLoans: []
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
    if (tx.splitType === 'shared_no_repay') return;
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
    if (tx.splitType === 'shared_no_repay') return;
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

  const accName = formatAccountName(accountId);
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
// REITER 7: WUNSCHLISTE, SPARZIELE & ANSCHAFFUNGEN
// ----------------------------------------------------------------------------
function ensureWishlistInitialized() {
  if (!appState.wishlist || !Array.isArray(appState.wishlist)) {
    appState.wishlist = [];
  }
}

function populateWishlistAccountDropdown() {
  ensureAccountsInitialized();
  ensureSavingPotsInitialized();
  const sel = document.getElementById('wish-target-account');
  if (!sel) return;

  let html = '';

  if (appState.savingPots && appState.savingPots.length > 0) {
    html += '<optgroup label="🎯 Vorhandene Spartöpfe">';
    html += appState.savingPots.map(pot => {
      const acc = appState.accounts.find(a => a.id === pot.accountId);
      const accName = acc ? acc.name : 'Konto';
      const val = pot.id.startsWith('pot_') ? pot.id : `pot_${pot.id}`;
      return `<option value="${escapeHTML(val)}" data-emoji="🎯">🎯 ${escapeHTML(pot.name)} (${formatCurrency(pot.currentAmount)} auf ${escapeHTML(accName)})</option>`;
    }).join('');
    html += '</optgroup>';
  }

  html += '<optgroup label="🏦 Reguläre Konten">';
  html += appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    return `<option value="${escapeHTML(acc.id)}" data-emoji="${icon}">${escapeHTML(acc.name)}</option>`;
  }).join('');
  html += '</optgroup>';

  sel.innerHTML = html;
  applySymbolsToOptions(sel);
}

async function handleAddWish(e) {
  e.preventDefault();
  ensureWishlistInitialized();

  const typeSelect = document.getElementById('wish-type');
  const wishType = typeSelect ? typeSelect.value : 'once';
  const title = document.getElementById('wish-title').value.trim();
  const amount = parseFloat(document.getElementById('wish-amount').value);
  const priority = document.getElementById('wish-priority').value;
  const category = document.getElementById('wish-category').value;
  const account = document.getElementById('wish-target-account').value;
  const targetDate = document.getElementById('wish-target-date').value;
  const note = document.getElementById('wish-note').value.trim();

  if (!title || isNaN(amount) || amount <= 0) return;

  const newWish = {
    id: `wish_${Date.now()}`,
    type: wishType,
    title: title,
    amount: amount,
    priority: priority,
    category: category,
    account: account,
    targetDate: targetDate,
    note: note,
    fulfilled: false,
    createdAt: new Date().toISOString().split('T')[0]
  };

  appState.wishlist.push(newWish);
  await saveStateToEncryptedStorage();

  document.getElementById('form-add-wish').reset();
  renderWishlist();
  announceNVDA(`Wunsch "${title}" über ${formatCurrency(amount)} erfolgreich zur Wunschliste hinzugefügt!`);
}

function renderWishlist() {
  ensureWishlistInitialized();
  const container = document.getElementById('wishlist-items-container');
  if (!container) return;

  const filterSel = document.getElementById('wish-filter-status');
  const filterStatus = filterSel ? filterSel.value : 'open';

  const filterTypeSel = document.getElementById('wish-filter-type');
  const filterType = filterTypeSel ? filterTypeSel.value : 'all';

  let list = appState.wishlist;
  if (filterStatus === 'open') {
    list = list.filter(w => !w.fulfilled);
  } else if (filterStatus === 'fulfilled') {
    list = list.filter(w => w.fulfilled);
  }

  if (filterType === 'once') {
    list = list.filter(w => !w.type || w.type === 'once');
  } else if (filterType === 'subscriptions') {
    list = list.filter(w => w.type && w.type !== 'once');
  }

  // Calculate statistics
  const openWishes = appState.wishlist.filter(w => !w.fulfilled);
  const totalAmount = openWishes.reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const balances = calculateBalancesUpToDate(todayStr);

  let affordableCount = 0;
  openWishes.forEach(w => {
    const accBal = balances[w.account] !== undefined ? balances[w.account] : balances.total;
    if (accBal >= w.amount) affordableCount++;
  });

  const statCount = document.getElementById('wishlist-stat-count');
  const statTotal = document.getElementById('wishlist-stat-total');
  const statAffordable = document.getElementById('wishlist-stat-affordable');

  if (statCount) statCount.textContent = `${openWishes.length} Wunsch / Wünsche`;
  if (statTotal) statTotal.textContent = formatCurrency(totalAmount);
  if (statAffordable) statAffordable.textContent = `${affordableCount} sofort leistbar`;

  if (list.length === 0) {
    container.innerHTML = `<p class="empty-state" style="padding: 24px; text-align: center;">Keine Wünsche in dieser Ansicht vorhanden. Trage oben einen neuen Wunsch ein!</p>`;
    return;
  }

  const prioLabels = {
    high: '⭐⭐⭐ Hohe Priorität',
    medium: '⭐⭐ Mittlere Priorität',
    low: '⭐ Geringe Priorität'
  };

  let html = '<div class="wishlist-cards-grid" style="display: flex; flex-direction: column; gap: 14px;">';

  list.forEach(w => {
    const isSub = w.type && w.type !== 'once';
    let accName = 'Gesamtguthaben';
    let accBal = balances.total;
    if (w.account && w.account.startsWith('pot_')) {
      const potId = w.account.replace('pot_', '');
      const pot = (appState.savingPots || []).find(p => p.id === potId || p.id === w.account);
      if (pot) {
        accName = `🎯 Spartopf: ${pot.name}`;
        accBal = Number(pot.currentAmount || 0);
      }
    } else {
      const acc = appState.accounts.find(a => a.id === w.account);
      if (acc) accName = acc.name;
      if (balances[w.account] !== undefined) accBal = balances[w.account];
    }
    const isAffordable = accBal >= w.amount;
    const diff = w.amount - accBal;
    const percent = Math.max(0, Math.min(100, Math.round((Math.max(0, accBal) / w.amount) * 100)));

    let typeBadge = '<span class="badge" style="background: #E8EAF6; color: #283593; padding: 2px 8px; border-radius: 4px; font-weight: bold;">📦 Einmalkauf</span>';
    let subIntervalText = '';
    if (w.type === 'monthly') {
      typeBadge = '<span class="badge" style="background: #E1F5FE; color: #0277BD; padding: 2px 8px; border-radius: 4px; font-weight: bold;">🔄 Monatliches Abo</span>';
      subIntervalText = `<div style="font-size: 12px; color: var(--text-muted, #666);">${formatCurrency(w.amount * 12)} / Jahr</div>`;
    } else if (w.type === 'yearly') {
      typeBadge = '<span class="badge" style="background: #FFF3E0; color: #E65100; padding: 2px 8px; border-radius: 4px; font-weight: bold;">🗓 Jährliches Abo</span>';
      subIntervalText = `<div style="font-size: 12px; color: var(--text-muted, #666);">${formatCurrency(w.amount / 12)} / Monat</div>`;
    } else if (w.type === 'quarterly') {
      typeBadge = '<span class="badge" style="background: #EDE7F6; color: #512DA8; padding: 2px 8px; border-radius: 4px; font-weight: bold;">🔄 Quartals-Abo</span>';
      subIntervalText = `<div style="font-size: 12px; color: var(--text-muted, #666);">${formatCurrency(w.amount * 4)} / Jahr</div>`;
    } else if (w.type === 'halfyear') {
      typeBadge = '<span class="badge" style="background: #EDE7F6; color: #512DA8; padding: 2px 8px; border-radius: 4px; font-weight: bold;">🔄 Halbjahres-Abo</span>';
      subIntervalText = `<div style="font-size: 12px; color: var(--text-muted, #666);">${formatCurrency(w.amount * 2)} / Jahr</div>`;
    }

    html += `
      <div class="wish-card" style="border: 2px solid var(--border-color); border-radius: 8px; padding: 16px; background: var(--card-bg, #ffffff); ${w.fulfilled ? 'opacity: 0.75; border-left: 8px solid #4CAF50;' : (isAffordable ? 'border-left: 8px solid #2E7D32;' : 'border-left: 8px solid #FF9800;')}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="margin: 0 0 6px 0; font-size: 18px;">${w.fulfilled ? '✅ ' : (isSub ? '🔄 ' : '🎁 ')}${escapeHTML(w.title)}</h4>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--text-muted, #666); align-items: center;">
              ${typeBadge}
              <span class="badge" style="background: var(--bg-hover, #eee); padding: 2px 8px; border-radius: 4px;">🏷️ ${escapeHTML(w.category || 'Allgemein')}</span>
              <span class="badge" style="background: var(--bg-hover, #eee); padding: 2px 8px; border-radius: 4px;">${prioLabels[w.priority] || w.priority}</span>
              <span class="badge" style="background: var(--bg-hover, #eee); padding: 2px 8px; border-radius: 4px;">💳 Spartopf: ${escapeHTML(accName)}</span>
              ${w.targetDate ? `<span class="badge" style="background: var(--bg-hover, #eee); padding: 2px 8px; border-radius: 4px;">📅 Bis: ${escapeHTML(w.targetDate)}</span>` : ''}
            </div>
            ${w.note ? `<p style="margin: 8px 0 0 0; font-size: 14px; font-style: italic;">📝 ${escapeHTML(w.note)}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 22px; font-weight: bold; color: var(--accent-primary, #2196F3);">${formatCurrency(w.amount)}${isSub ? (w.type === 'monthly' ? ' / Mt.' : (w.type === 'yearly' ? ' / Jr.' : '')) : ''}</div>
            ${subIntervalText}
            ${w.fulfilled ? '<span style="color: #2E7D32; font-weight: bold; font-size: 14px;">✅ Aktiv / Erfüllt!</span>' : ''}
          </div>
        </div>

        ${!w.fulfilled ? `
          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 4px;">
              <span>Guthaben auf ${escapeHTML(accName)}: ${formatCurrency(accBal)}</span>
              <span>${isAffordable ? '🟢 100% Leistbar!' : `Fortschritt: ${percent}% (Fehlen noch ${formatCurrency(diff)})`}</span>
            </div>
            <div style="background: #e0e0e0; border-radius: 6px; height: 10px; overflow: hidden;">
              <div style="width: ${percent}%; height: 100%; background: ${isAffordable ? '#4CAF50' : '#FF9800'}; transition: width 0.3s;"></div>
            </div>
          </div>
        ` : ''}

        <div style="margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
          ${!w.fulfilled ? (
            isSub ? `
              <button type="button" class="btn btn-primary" onclick="handleFulfillWishAsRecurring('${w.id}')" style="background-color: #0288D1; border-color: #01579B; padding: 6px 12px; font-size: 14px;">
                <span>🔄 <strong>Als Dauerauftrag (Abo) starten &amp; Erfüllen</strong></span>
              </button>
            ` : `
              <button type="button" class="btn btn-primary" onclick="handleFulfillWishAsExpense('${w.id}')" style="background-color: #2E7D32; border-color: #1B5E20; padding: 6px 12px; font-size: 14px;">
                <span>🛒 <strong>Als Ausgabe buchen &amp; Erfüllen</strong></span>
              </button>
            `
          ) : `
            <button type="button" class="btn btn-secondary" onclick="handleToggleWishFulfilled('${w.id}')" style="padding: 6px 12px; font-size: 14px;">
              <span>Wieder als offen markieren</span>
            </button>
          `}
          <button type="button" class="btn btn-secondary" onclick="handleDeleteWish('${w.id}')" style="padding: 6px 12px; font-size: 14px; color: #D32F2F;">
            <span>🗑️ Löschen</span>
          </button>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

async function handleFulfillWishAsExpense(wishId) {
  ensureWishlistInitialized();
  ensureSavingPotsInitialized();
  const wish = appState.wishlist.find(w => w.id === wishId);
  if (!wish) return;

  let bookedAccount = wish.account || 'bank';
  let potObj = null;
  let potName = '';

  if (wish.account && wish.account.startsWith('pot_')) {
    const rawId = wish.account.replace(/^pot_+/, '');
    potObj = (appState.savingPots || []).find(p => p.id === wish.account || p.id === rawId || p.id === `pot_${rawId}`);
    if (potObj) {
      potName = potObj.name;
      bookedAccount = potObj.accountId || 'bank';
      const confirmMsg = `Möchtest du "${wish.title}" über ${formatCurrency(wish.amount)} jetzt verbindlich aus dem Spartopf "${potObj.name}" entnehmen und als Ausgabe buchen?`;
      if (!confirm(confirmMsg)) return;
      potObj.currentAmount = Math.max(0, Math.round((Number(potObj.currentAmount || 0) - wish.amount) * 100) / 100);
    }
  } else {
    const confirmMsg = `Möchtest du "${wish.title}" über ${formatCurrency(wish.amount)} jetzt verbindlich als Ausgabe von Konto "${formatAccountName(wish.account)}" abbuchen und den Wunsch als erfüllt markieren?`;
    if (!confirm(confirmMsg)) return;
  }

  // Add expense transaction
  appState.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'expense',
    account: bookedAccount,
    amount: wish.amount,
    category: 'Shopping, Online-Kauf & Marktplätze',
    subcategory: wish.title,
    description: `Wunsch erfüllt: ${wish.title}${potName ? ` (aus Spartopf "${potName}")` : ''}`,
    isPlanned: false,
    date: new Date().toISOString().split('T')[0]
  });

  wish.fulfilled = true;
  wish.fulfilledDate = new Date().toISOString().split('T')[0];

  await saveStateToEncryptedStorage();
  updateOverview();
  renderWishlist();
  renderSavingPotsList();
  announceNVDA(`Glückwunsch! Wunsch "${wish.title}" wurde als Ausgabe über ${formatCurrency(wish.amount)} abgebucht und erfüllt!`);
}

async function handleToggleWishFulfilled(wishId) {
  ensureWishlistInitialized();
  const wish = appState.wishlist.find(w => w.id === wishId);
  if (!wish) return;

  wish.fulfilled = !wish.fulfilled;
  await saveStateToEncryptedStorage();
  renderWishlist();
  announceNVDA(`Wunsch "${wish.title}" Status aktualisiert.`);
}

async function handleDeleteWish(wishId) {
  ensureWishlistInitialized();
  const wish = appState.wishlist.find(w => w.id === wishId);
  if (!wish) return;

  if (!confirm(`Möchtest du den Wunsch "${wish.title}" wirklich löschen?`)) return;

  appState.wishlist = appState.wishlist.filter(w => w.id !== wishId);
  await saveStateToEncryptedStorage();
  renderWishlist();
  announceNVDA(`Wunsch "${wish.title}" gelöscht.`);
}

// ----------------------------------------------------------------------------
// F. BANK-KONTOAUSZUG / CSV-IMPORT ENGINE
// ----------------------------------------------------------------------------
let parsedCsvTransactions = [];

function handleBankCsvUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    parseAndPreviewBankCsv(text);
  };
  reader.readAsText(file, 'utf-8');
  e.target.value = '';
}

function parseCurrencyString(val) {
  if (!val) return NaN;
  let s = val.replace(/€|EUR|\s/g, '').trim();
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

function parseAndPreviewBankCsv(csvText) {
  parsedCsvTransactions = [];
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) {
    alert('Die CSV-Datei enthält keine Buchungszeilen.');
    return;
  }

  const firstLine = lines[0];
  let sep = ';';
  if ((firstLine.match(/;/g) || []).length < (firstLine.match(/,/g) || []).length) sep = ',';
  if ((firstLine.match(/\t/g) || []).length > (firstLine.match(new RegExp(sep, 'g')) || []).length) sep = '\t';

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length < 3) continue;

    let dateStr = null;
    let amountVal = null;
    let payeeOrMemo = '';

    for (let c = 0; c < cols.length; c++) {
      const val = cols[c];
      if (!val) continue;

      // 1. Date matching (YYYY-MM-DD or DD.MM.YYYY)
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        if (!dateStr) dateStr = val;
        continue;
      } else if (/^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
        if (!dateStr) {
          const parts = val.split('.');
          dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        continue;
      }

      // 2. Amount matching (must not contain hyphens in date format or text)
      const cleanNumStr = val.replace(/€|EUR|\s/g, '').replace(/\./g, '').replace(',', '.');
      if (amountVal === null && /^-?\d+(\.\d+)?$/.test(cleanNumStr) && !val.includes(':')) {
        const parsed = parseCurrencyString(val);
        if (!isNaN(parsed) && parsed !== 0) {
          amountVal = parsed;
          continue;
        }
      }

      // 3. Memo / Payee
      if (val.length > 2 && isNaN(val)) {
        payeeOrMemo += (payeeOrMemo ? ' ' : '') + val;
      }
    }

    if (dateStr && amountVal !== null && !isNaN(amountVal) && amountVal !== 0) {
      const isIncome = amountVal > 0;
      const absAmount = Math.abs(amountVal);
      const matchedCat = autoMatchCategoryForPayee(payeeOrMemo, isIncome ? 'inc' : 'exp');

      parsedCsvTransactions.push({
        selected: true,
        date: dateStr,
        amount: absAmount,
        type: isIncome ? 'income' : 'expense',
        category: matchedCat.main,
        subcategory: matchedCat.sub,
        description: payeeOrMemo || (isIncome ? 'Bank-Gutschrift' : 'Bank-Lastschrift / Kartenzahlung'),
        account: (appState.accounts && appState.accounts[0]) ? appState.accounts[0].id : 'bank'
      });
    }
  }

  if (parsedCsvTransactions.length === 0) {
    alert('Es konnten keine gültigen Buchungszeilen in der CSV-Datei erkannt werden.');
    return;
  }

  openCsvPreviewModal();
}

function autoMatchCategoryForPayee(text, type) {
  const lower = (text || '').toLowerCase();
  const db = (typeof CATEGORIES_DB !== 'undefined' && CATEGORIES_DB[type]) ? CATEGORIES_DB[type] : (typeof CATEGORIES_DB !== 'undefined' ? CATEGORIES_DB['exp'] : {});

  for (const [mainCat, subs] of Object.entries(db)) {
    for (const sub of subs) {
      if (lower.includes(sub.toLowerCase())) {
        return { main: mainCat, sub: sub };
      }
    }
  }

  if (type === 'exp') {
    if (lower.includes('rewe') || lower.includes('aldi') || lower.includes('lidl') || lower.includes('edeka') || lower.includes('kaufland') || lower.includes('netto') || lower.includes('penny')) {
      return { main: 'Lebensmittel, Supermarkt & Discounter', sub: 'Supermarkt' };
    }
    if (lower.includes('miete') || lower.includes('wohnen') || lower.includes('stadtwerke') || lower.includes('strom')) {
      return { main: 'Miete, Wohnen & Nebenkosten', sub: 'Miete' };
    }
    if (lower.includes('amazon') || lower.includes('paypal') || lower.includes('ebay') || lower.includes('otto') || lower.includes('zalando')) {
      return { main: 'Shopping, Online-Kauf & Marktplätze', sub: 'Online-Kauf' };
    }
    if (lower.includes('tanken') || lower.includes('aral') || lower.includes('shell') || lower.includes('total') || lower.includes('esso')) {
      return { main: 'Mobilität, Auto & Kraftfahrzeuge', sub: 'Tanken' };
    }
    return { main: 'Sonstige Ausgaben & Bargeld', sub: 'Kartenzahlung' };
  } else {
    if (lower.includes('gehalt') || lower.includes('lohn') || lower.includes('bezüge') || lower.includes('arbeitgeber')) {
      return { main: 'Gehalt, Lohn & Beruf', sub: 'Gehalt' };
    }
    if (lower.includes('kindergeld') || lower.includes('rente') || lower.includes('blindengeld') || lower.includes('amt') || lower.includes('kasse')) {
      return { main: 'Staatliche Leistungen, Hilfen & Zuschüsse', sub: 'Leistungen' };
    }
    return { main: 'Sonstige Einnahmen', sub: 'Gutschrift' };
  }
}

function openCsvPreviewModal() {
  const modal = document.getElementById('csv-preview-modal');
  const container = document.getElementById('csv-preview-table-container');
  if (!container || !modal) return;

  container.innerHTML = `
    <table class="shopping-table" aria-label="CSV Vorschautabelle">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">✓</th>
          <th>Datum</th>
          <th>Art</th>
          <th>Betrag</th>
          <th>Hauptkategorie</th>
          <th>Beschreibung</th>
        </tr>
      </thead>
      <tbody>
        ${parsedCsvTransactions.map((tx, idx) => `
          <tr>
            <td style="text-align: center;">
              <input type="checkbox" id="csv-chk-${idx}" ${tx.selected ? 'checked' : ''} onchange="parsedCsvTransactions[${idx}].selected = this.checked" style="width: 18px; height: 18px;">
            </td>
            <td>${escapeHTML(tx.date)}</td>
            <td style="font-weight: bold; color: ${tx.type === 'income' ? '#4CAF50' : '#F44336'};">${tx.type === 'income' ? '📥 Einnahme' : '📤 Ausgabe'}</td>
            <td style="font-weight: bold;">${formatCurrency(tx.amount)}</td>
            <td>
              <select class="large-select" style="padding: 4px 8px; font-size: 13px;" onchange="parsedCsvTransactions[${idx}].category = this.value">
                ${Object.keys(CATEGORIES_DB[tx.type === 'income' ? 'inc' : 'exp'] || {}).map(c => `<option value="${escapeHTML(c)}" ${c === tx.category ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
              </select>
            </td>
            <td><input type="text" class="large-input" value="${escapeHTML(tx.description)}" onchange="parsedCsvTransactions[${idx}].description = this.value" style="padding: 4px 8px; font-size: 13px;"></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  modal.style.display = 'flex';
  announceNVDA(`CSV-Vorschau geöffnet. ${parsedCsvTransactions.length} Buchungen erkannt.`);
}

function closeCsvPreviewModal() {
  const modal = document.getElementById('csv-preview-modal');
  if (modal) modal.style.display = 'none';
}

async function confirmCsvImport() {
  const toImport = parsedCsvTransactions.filter(t => t.selected);
  if (toImport.length === 0) {
    alert('Bitte wähle mindestens eine Buchung zum Importieren aus.');
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  toImport.forEach(tx => {
    appState.transactions.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type: tx.type,
      account: tx.account,
      amount: tx.amount,
      category: tx.category,
      subcategory: tx.subcategory || 'CSV-Import',
      description: tx.description,
      isPlanned: tx.date > todayStr,
      date: tx.date
    });
  });

  await saveStateToEncryptedStorage();
  closeCsvPreviewModal();
  updateOverview();
  announceNVDA(`${toImport.length} Buchungen erfolgreich importiert!`);
  alert(`✅ Erfolgreich ${toImport.length} Buchungen aus dem Bank-Kontoauszug importiert!`);
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
            <td style="padding: 6px 10px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: ${tx.splitType === 'shared_no_repay' ? '#512DA8' : (tx.type === 'income' ? '#2E7D32' : '#C62828')};">
              ${tx.splitType === 'shared_no_repay' ? '👥 ' : (tx.type === 'income' ? '+ ' : '- ')}${formatCurrency(tx.amount)}${tx.splitType === 'shared_no_repay' ? ' (Fremdanteil)' : ''}
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

function getAccountName(accKey) {
  return formatAccountName(accKey);
}

function getAccountIcon(accKey) {
  ensureAccountsInitialized();
  const found = appState.accounts.find(a => a.id === accKey);
  if (found && found.icon) return found.icon;
  return ACCOUNT_TYPE_ICONS[accKey] || '💳';
}

function populateFilterAccountDropdown() {
  ensureAccountsInitialized();
  const sel = document.getElementById('tx-filter-account');
  if (!sel) return;

  const currentVal = sel.value || 'all';
  let html = '<option value="all">Alle Konten</option>';
  (appState.accounts || []).forEach(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    html += `<option value="${escapeHTML(acc.id)}" data-emoji="${icon}">${escapeHTML(acc.name)}</option>`;
  });
  sel.innerHTML = html;
  if (currentVal && (currentVal === 'all' || (appState.accounts || []).some(a => a.id === currentVal))) {
    sel.value = currentVal;
  } else {
    sel.value = 'all';
  }
  applySymbolsToOptions(sel);
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
  populateFilterAccountDropdown();
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

// =============================================================================
// ZENTRALER KATEGORIEN-SYNC (GITHUB CLOUD-KATALOG OHNE APP-UPDATE)
// =============================================================================
const GITHUB_CATEGORIES_URL = 'https://raw.githubusercontent.com/Lauju1909/BarrierefreieFinanzApp/main/categories.json';

function mergeCloudCategoriesIntoDB(cloudData) {
  if (!cloudData || typeof cloudData !== 'object') return 0;
  let addedCount = 0;

  ['exp', 'inc', 'trf'].forEach(type => {
    if (!cloudData[type]) return;
    if (!CATEGORIES_DB[type]) CATEGORIES_DB[type] = {};

    for (const [mainCat, subs] of Object.entries(cloudData[type])) {
      if (!CATEGORIES_DB[type][mainCat]) {
        CATEGORIES_DB[type][mainCat] = [];
        addedCount++;
      }
      if (Array.isArray(subs)) {
        subs.forEach(s => {
          if (!CATEGORIES_DB[type][mainCat].includes(s)) {
            CATEGORIES_DB[type][mainCat].push(s);
            addedCount++;
          }
        });
      }
    }
  });

  if (cloudData.icons && typeof CATEGORY_ICONS !== 'undefined') {
    Object.assign(CATEGORY_ICONS, cloudData.icons);
  }

  mergeCustomCategoriesIntoDB();
  return addedCount;
}

function initCloudCategoriesSync() {
  try {
    const cached = localStorage.getItem('cached_cloud_categories');
    if (cached) {
      const data = JSON.parse(cached);
      mergeCloudCategoriesIntoDB(data);
    }
  } catch(e) {}

  const lastSyncStr = localStorage.getItem('last_cloud_categories_sync');
  const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0;
  const now = Date.now();

  if (!lastSync || (now - lastSync > 24 * 3600 * 1000)) {
    setTimeout(() => {
      syncCategoriesFromGitHub(false);
    }, 2000);
  }
}

async function syncCategoriesFromGitHub(force = false) {
  const syncBtn = document.getElementById('btn-sync-cloud-cats');
  const statusEl = document.getElementById('cloud-cat-sync-status');
  if (syncBtn && force) {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span>⏳ <strong>Katalog wird geladen...</strong></span>';
  }

  let success = false;
  let addedCount = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(GITHUB_CATEGORIES_URL + '?t=' + Date.now(), {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (resp.ok) {
      const cloudData = await resp.json();
      if (cloudData && (cloudData.exp || cloudData.inc)) {
        addedCount = mergeCloudCategoriesIntoDB(cloudData);
        localStorage.setItem('cached_cloud_categories', JSON.stringify(cloudData));
        localStorage.setItem('last_cloud_categories_sync', String(Date.now()));
        populateCategoriesDropdowns();
        success = true;
      }
    }
  } catch(e) {
    try {
      const port = window.__LOCAL_PORT__ || 48123;
      const resp = await fetch('http://127.0.0.1:' + port + '/categories.json?t=' + Date.now());
      if (resp.ok) {
        const localData = await resp.json();
        if (localData && (localData.exp || localData.inc)) {
          addedCount = mergeCloudCategoriesIntoDB(localData);
          localStorage.setItem('cached_cloud_categories', JSON.stringify(localData));
          populateCategoriesDropdowns();
          success = true;
        }
      }
    } catch(e2) {}
  } finally {
    if (syncBtn && force) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span>🔄 <strong>Kategorien-Katalog von GitHub aktualisieren</strong></span>';
    }
  }

  if (force) {
    if (success) {
      const msg = '✅ Kategorien-Katalog erfolgreich von GitHub aktualisiert!';
      announceNVDA(msg, true);
      alert(msg);
      if (statusEl) {
        statusEl.textContent = 'Zuletzt aktualisiert: ' + new Date().toLocaleDateString('de-DE') + ' um ' + new Date().toLocaleTimeString('de-DE') + '.';
      }
    } else {
      const errMsg = '⚠️ Der Online-Katalog konnte gerade nicht erreicht werden. Deine bestehenden Kategorien bleiben vollständig erhalten.';
      announceNVDA(errMsg, true);
      alert(errMsg);
    }
  }

  return success;
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

// =============================================================================
// SCHNELLES KATEGORIE-MENÜ (IN-FORM QUICK ADD OHNE EINSTELLUNGEN ZU ÖFFNEN)
// =============================================================================
function openQuickCategoryModal(context) {
  const modal = document.getElementById('quick-add-category-modal');
  if (!modal) return;

  const targetCtxInput = document.getElementById('quick-cat-target-context');
  if (targetCtxInput) targetCtxInput.value = context || 'exp';

  const typeSel = document.getElementById('quick-cat-type');
  let defaultType = 'exp';
  if (context === 'inc') {
    defaultType = 'inc';
  } else if (context === 'edit-tx') {
    const txType = document.getElementById('edit-tx-type') ? document.getElementById('edit-tx-type').value : 'expense';
    defaultType = (txType === 'income') ? 'inc' : 'exp';
  } else if (context === 'edit-rec') {
    const recType = document.getElementById('edit-rec-type') ? document.getElementById('edit-rec-type').value : 'expense';
    defaultType = (recType === 'income') ? 'inc' : 'exp';
  }

  if (typeSel) {
    typeSel.value = defaultType;
  }

  updateQuickCatParentSelect(defaultType, context);

  const modeSel = document.getElementById('quick-cat-mode');
  if (modeSel) {
    modeSel.value = 'sub';
    onQuickCatModeChange();
  }

  const subInput = document.getElementById('quick-cat-sub-name');
  if (subInput) subInput.value = '';
  const mainInput = document.getElementById('quick-cat-main-name');
  if (mainInput) mainInput.value = '';
  const firstSubInput = document.getElementById('quick-cat-first-sub');
  if (firstSubInput) firstSubInput.value = '';

  modal.style.display = 'flex';
  const heading = document.getElementById('quick-add-cat-heading');
  if (heading) heading.focus();
  setTimeout(() => {
    if (subInput) subInput.focus();
  }, 100);

  announceNVDA('Schnellmenü für neue Kategorie geöffnet.');
}

function closeQuickCategoryModal() {
  const modal = document.getElementById('quick-add-category-modal');
  if (modal) modal.style.display = 'none';
}

function onQuickCatTypeChange() {
  const typeSel = document.getElementById('quick-cat-type');
  const type = typeSel ? typeSel.value : 'exp';
  const targetCtxInput = document.getElementById('quick-cat-target-context');
  const context = targetCtxInput ? targetCtxInput.value : 'exp';
  updateQuickCatParentSelect(type, context);
}

function updateQuickCatParentSelect(type, context) {
  const parentSel = document.getElementById('quick-cat-parent-select');
  if (!parentSel) return;

  const db = CATEGORIES_DB[type] || CATEGORIES_DB['exp'];
  const mainCats = Object.keys(db);

  parentSel.innerHTML = mainCats.map(cat => '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>').join('');
  applySymbolsToOptions(parentSel);

  let preselectVal = null;
  if (context === 'exp') {
    const el = document.getElementById('exp-category');
    if (el) preselectVal = el.value;
  } else if (context === 'inc') {
    const el = document.getElementById('inc-category');
    if (el) preselectVal = el.value;
  } else if (context === 'edit-tx') {
    const el = document.getElementById('edit-tx-category');
    if (el) preselectVal = el.value;
  } else if (context === 'edit-rec') {
    const el = document.getElementById('edit-rec-category');
    if (el) preselectVal = el.value;
  }

  if (preselectVal && db[preselectVal]) {
    parentSel.value = preselectVal;
  }
}

function onQuickCatModeChange() {
  const modeSel = document.getElementById('quick-cat-mode');
  const mode = modeSel ? modeSel.value : 'sub';
  const parentGroup = document.getElementById('quick-cat-parent-group');
  const subGroup = document.getElementById('quick-cat-sub-name-group');
  const mainGroup = document.getElementById('quick-cat-main-group');
  const subInput = document.getElementById('quick-cat-sub-name');
  const mainInput = document.getElementById('quick-cat-main-name');

  if (mode === 'main') {
    if (parentGroup) parentGroup.style.display = 'none';
    if (subGroup) subGroup.style.display = 'none';
    if (mainGroup) mainGroup.style.display = 'block';
    if (subInput) subInput.required = false;
    if (mainInput) mainInput.required = true;
  } else {
    if (parentGroup) parentGroup.style.display = 'block';
    if (subGroup) subGroup.style.display = 'block';
    if (mainGroup) mainGroup.style.display = 'none';
    if (subInput) subInput.required = true;
    if (mainInput) mainInput.required = false;
  }
}

async function handleQuickAddCategorySubmit(e) {
  e.preventDefault();
  const typeSel = document.getElementById('quick-cat-type');
  const modeSel = document.getElementById('quick-cat-mode');
  const targetCtxInput = document.getElementById('quick-cat-target-context');

  const type = typeSel ? typeSel.value : 'exp';
  const mode = modeSel ? modeSel.value : 'sub';
  const context = targetCtxInput ? targetCtxInput.value : 'exp';

  let mainCatName = '';
  let subCatName = '';

  if (mode === 'sub') {
    const parentSel = document.getElementById('quick-cat-parent-select');
    const subInput = document.getElementById('quick-cat-sub-name');
    mainCatName = parentSel ? parentSel.value.trim() : '';
    subCatName = subInput ? subInput.value.trim() : '';
    if (!subCatName) {
      alert('Bitte gib den Namen des Geschäfts oder der Unterkategorie ein.');
      return;
    }
  } else {
    const mainInput = document.getElementById('quick-cat-main-name');
    const firstSubInput = document.getElementById('quick-cat-first-sub');
    const iconInput = document.getElementById('quick-cat-main-icon');
    mainCatName = mainInput ? mainInput.value.trim() : '';
    subCatName = firstSubInput ? firstSubInput.value.trim() : 'Gesamt / Allgemein';
    if (!subCatName) subCatName = 'Gesamt / Allgemein';
    if (!mainCatName) {
      alert('Bitte gib den Namen der Hauptkategorie ein.');
      return;
    }
    const icon = iconInput ? iconInput.value.trim() : '';
    if (icon && typeof CATEGORY_ICONS !== 'undefined') {
      CATEGORY_ICONS[mainCatName] = icon;
    }
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

  closeQuickCategoryModal();

  if (context === 'exp' && type === 'exp') {
    const expMain = document.getElementById('exp-category');
    if (expMain) {
      expMain.value = mainCatName;
      onMainCategoryChange('exp');
      const expSub = document.getElementById('exp-subcategory');
      if (expSub) expSub.value = subCatName;
    }
  } else if (context === 'inc' && type === 'inc') {
    const incMain = document.getElementById('inc-category');
    if (incMain) {
      incMain.value = mainCatName;
      onMainCategoryChange('inc');
      const incSub = document.getElementById('inc-subcategory');
      if (incSub) incSub.value = subCatName;
    }
  } else if (context === 'edit-tx') {
    populateEditModalCategories(type === 'inc' ? 'income' : 'expense', mainCatName, subCatName);
  } else if (context === 'edit-rec') {
    populateEditRecCategories(type === 'inc' ? 'income' : 'expense', mainCatName, subCatName);
  }

  announceNVDA('Kategorie ' + subCatName + ' unter ' + mainCatName + ' erfolgreich angelegt und ausgewählt.');
  alert('✅ Fertig! "' + subCatName + '" (' + mainCatName + ') wurde angelegt und direkt ausgewählt.');
}

function populateCategoriesDropdowns() {
  mergeCustomCategoriesIntoDB();
  initCustomCatSettingsForm();
  ['exp', 'inc'].forEach(type => {
    const mainSel = document.getElementById(type + '-category');
    if (!mainSel) return;

    const prevVal = mainSel.value;
    const db = CATEGORIES_DB[type];
    const mainCats = Object.keys(db);

    mainSel.innerHTML = mainCats.map(cat => '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>').join('');
    if (prevVal && db[prevVal]) {
      mainSel.value = prevVal;
    }
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
  initCloudCategoriesSync();
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
      // Wenn ein Teilbetrag als 'shared_no_repay' markiert ist (Fremdanteil, den die andere Person selbst gezahlt hat):
      // Nicht vom eigenen Konto abbuchen!
      if (tx.splitType === 'shared_no_repay') {
        return;
      }
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

  const dayIncome = incomeList.reduce((sum, t) => sum + (t.splitType === 'shared_no_repay' ? 0 : Number(t.amount || 0)), 0);
  const dayExpense = expenseList.reduce((sum, t) => sum + (t.splitType === 'shared_no_repay' ? 0 : Number(t.amount || 0)), 0);
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

  const totalIncome = incomeList.reduce((sum, t) => sum + (t.splitType === 'shared_no_repay' ? 0 : Number(t.amount || 0)), 0);
  const totalExpense = expenseList.reduce((sum, t) => sum + (t.splitType === 'shared_no_repay' ? 0 : Number(t.amount || 0)), 0);
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
        renderShoppingList();
  populateFilterAccountDropdown();
    renderExpenseRankings(dayStats.expenseList);
    checkLiquidityWarning(dayStats.balances);
    renderBudgetsList();
    renderOverviewCreditAccordion();
    renderOverviewPeerLoans();
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

    const weekIncome = incomeList.reduce((sum, t) => sum + (t.splitType === 'shared_no_repay' ? 0 : Number(t.amount || 0)), 0);
    const weekExpense = expenseList.reduce((sum, t) => sum + (t.splitType === 'shared_no_repay' ? 0 : Number(t.amount || 0)), 0);
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
        populateFilterAccountDropdown();
    renderExpenseRankings(allTx.filter(t => t.type === 'expense'));
    checkLiquidityWarning(weekBalances);
    renderBudgetsList();
    renderOverviewCreditAccordion();
    renderOverviewPeerLoans();
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
        populateFilterAccountDropdown();
    renderExpenseRankings(stats.expenseList);
    checkLiquidityWarning(stats.balances);
    renderBudgetsList();
    renderOverviewCreditAccordion();
    renderOverviewPeerLoans();
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
      populateFilterAccountDropdown();
  renderExpenseRankings(periodAllTxs.filter(t => t.type === 'expense'));
  checkLiquidityWarning(periodEndBalances);
  renderBudgetsList();
  renderOverviewCreditAccordion();
  renderOverviewPeerLoans();
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

  if (containerId === 'overview-transfer-items-feed') {
    const secTrf = document.getElementById('section-transfer-container');
    if (secTrf) {
      secTrf.style.display = (list && list.length > 0) ? '' : 'none';
    }
  }

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
    const isSharedNoRepay = tx.splitType === 'shared_no_repay';
    const sign = isSharedNoRepay ? '👥' : (isIncome ? '+' : (isTransfer ? '🔄' : '-'));
    const colorClass = isSharedNoRepay ? 'transfer' : (isIncome ? 'income' : (isTransfer ? 'transfer' : 'expense'));
    const icon = isSharedNoRepay ? '👥' : (isIncome ? '📥' : (isTransfer ? '🔄' : '📤'));
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
    } else if (tx.splitType === 'shared_no_repay') {
      const personStr = tx.splitPerson ? ` (Anteil ${escapeHTML(tx.splitPerson)})` : '';
      accountBadgeText = `${dateFormatted} | 👥 Geteilt${personStr} • Nicht vom Konto abgebucht`;
    } else {
      accountBadgeText = `${dateFormatted} | ${formatAccountName(tx.account)}`;
    }

    let sharedBadge = '';
    if (tx.splitType === 'shared_no_repay') {
      sharedBadge = '<span class="status-badge" style="background: rgba(103, 58, 183, 0.12); color: #512DA8; border: 1px solid rgba(103, 58, 183, 0.35);">👥 Fremdanteil</span>';
    }

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${categoryDisplayHtml}</span>
            <span class="tx-account-badge">${accountBadgeText}</span>
            ${statusBadge}
            ${sharedBadge}
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
    expenseSplitRows = [];
    const splitContainer = document.getElementById('exp-split-rows-container');
    if (splitContainer) splitContainer.innerHTML = '';
    const summaryEl = document.getElementById('exp-split-summary');
    if (summaryEl) summaryEl.style.display = 'none';
    if (typeof announceNVDA === 'function') {
      announceNVDA('Split-Zahlung deaktiviert. Einfache Kontoauswahl wieder aktiv.');
    }
  }
}

function toggleExpenseLoanFields() {
  const toggle = document.getElementById('exp-loan-toggle');
  const sec = document.getElementById('exp-loan-section');
  const isLoan = toggle && toggle.checked;
  if (sec) sec.style.display = isLoan ? 'block' : 'none';
  if (isLoan) {
    const personInput = document.getElementById('exp-loan-person');
    if (personInput) personInput.focus();
    if (typeof announceNVDA === 'function') {
      announceNVDA('Leihgabe-Details für verliehenes Geld eingeblendet. Bitte gib den Namen der Person ein.');
    }
  } else {
    const personInput = document.getElementById('exp-loan-person');
    if (personInput) personInput.value = '';
    const dueInput = document.getElementById('exp-loan-due-date');
    if (dueInput) dueInput.value = '';
    const noteInput = document.getElementById('exp-loan-note');
    if (noteInput) noteInput.value = '';
    if (typeof announceNVDA === 'function') {
      announceNVDA('Leihgabe-Details ausgeblendet.');
    }
  }
}

function resetExpenseFormState() {
  const form = document.getElementById('form-add-expense');
  if (form) form.reset();
  const expDate = document.getElementById('exp-date');
  if (expDate) expDate.value = new Date().toISOString().split('T')[0];

  // Split-Zahlung vollständig und sauber zurücksetzen
  const splitToggle = document.getElementById('exp-split-toggle');
  if (splitToggle) splitToggle.checked = false;
  const splitSec = document.getElementById('exp-split-section');
  if (splitSec) splitSec.style.display = 'none';
  const accGroup = document.getElementById('exp-account-group');
  if (accGroup) accGroup.style.display = 'block';
  const singleAcc = document.getElementById('exp-account');
  if (singleAcc) singleAcc.required = true;
  expenseSplitRows = [];
  const splitContainer = document.getElementById('exp-split-rows-container');
  if (splitContainer) splitContainer.innerHTML = '';
  const splitSummary = document.getElementById('exp-split-summary');
  if (splitSummary) splitSummary.style.display = 'none';

  // Leihgabe vollständig zurücksetzen
  const loanToggle = document.getElementById('exp-loan-toggle');
  if (loanToggle) loanToggle.checked = false;
  const loanSec = document.getElementById('exp-loan-section');
  if (loanSec) loanSec.style.display = 'none';
  const loanPerson = document.getElementById('exp-loan-person');
  if (loanPerson) loanPerson.value = '';
  const loanDue = document.getElementById('exp-loan-due-date');
  if (loanDue) loanDue.value = '';
  const loanNote = document.getElementById('exp-loan-note');
  if (loanNote) loanNote.value = '';

  // Wiederkehrende Zusatzoptionen zurücksetzen
  const trialReset = document.getElementById('exp-rec-trial-toggle');
  if (trialReset) {
    trialReset.checked = false;
    toggleTrialSection('exp');
  }
  const discountReset = document.getElementById('exp-rec-discount-toggle');
  if (discountReset) {
    discountReset.checked = false;
    toggleDiscountSection('exp');
  }
  const contractReset = document.getElementById('exp-rec-contract-toggle');
  if (contractReset) {
    contractReset.checked = false;
    toggleContractSection('exp');
  }

  currentExpenseReceipt = null;
  renderReceiptPreview('exp');
  toggleExpenseFrequencyFields();
}

function initExpenseSplitRows() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('exp-amount').value) || 0;
  const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
  const acc2 = appState.accounts[1] ? appState.accounts[1].id : (appState.accounts[0] ? appState.accounts[0].id : 'cash');

  const half = Math.round((totalAmt / 2) * 100) / 100;
  const rest = Math.round((totalAmt - half) * 100) / 100;

  expenseSplitRows = [
    { type: 'account', account: acc1, person: '', amount: half > 0 ? half : '' },
    { type: 'account', account: acc2, person: '', amount: rest > 0 ? rest : '' }
  ];
  renderExpenseSplitRows();
}

function renderExpenseSplitRows() {
  const container = document.getElementById('exp-split-rows-container');
  if (!container) return;

  container.innerHTML = expenseSplitRows.map((row, idx) => {
    const canRemove = expenseSplitRows.length > 2;
    const rowType = row.type || 'account';
    const isAccount = rowType === 'account';
    const isLoan = rowType === 'loan_lent';
    const isShared = rowType === 'shared_no_repay';

    return `
      <div class="split-row" data-index="${idx}" style="display: flex; gap: 8px; align-items: flex-end; background: #fff; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color, #ccc); flex-wrap: wrap;">
        <div style="flex: 2; min-width: 170px;">
          <label for="exp-split-type-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teil ${idx + 1} Art:</strong>
          </label>
          <select id="exp-split-type-${idx}" class="large-select" onchange="onExpenseSplitTypeChange(${idx}, this.value)">
            <option value="account" ${isAccount ? 'selected' : ''}>🏦 Eigenes Konto (Mein Anteil, wird abgebucht)</option>
            <option value="loan_lent" ${isLoan ? 'selected' : ''}>🤝 Verliehen (Leihgabe mit Rückzahlung, alles vorgestreckt)</option>
            <option value="shared_no_repay" ${isShared ? 'selected' : ''}>👥 Geteilt (Fremdanteil, nicht von meinem Konto abbuchen)</option>
          </select>
        </div>

        <div id="exp-split-target-col-${idx}" style="flex: 2; min-width: 160px;">
          ${isAccount ? `
            <label for="exp-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
              <strong>Konto:</strong>
            </label>
            <select id="exp-split-acc-${idx}" class="large-select" onchange="onExpenseSplitAccountChange(${idx}, this.value)">
              ${getExpenseSplitAccountOptionsHtml(row.account)}
            </select>
          ` : `
            <label for="exp-split-person-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
              <strong>Person / Name:${isLoan ? '<span class="required-star" aria-hidden="true">*</span>' : ''}</strong>
            </label>
            <input type="text" id="exp-split-person-${idx}" class="large-input" value="${escapeHTML(row.person || '')}" placeholder="${isLoan ? 'z. B. Peter, Anna' : 'z. B. Mitbewohner, Freund'}" oninput="onExpenseSplitPersonInput(${idx}, this.value)">
          `}
        </div>

        <div style="flex: 1; min-width: 120px;">
          <label for="exp-split-amt-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teilbetrag (€):</strong>
          </label>
          <input type="number" step="0.01" min="0.01" id="exp-split-amt-${idx}" class="large-input" value="${row.amount !== '' ? row.amount : ''}" placeholder="0,00" oninput="onExpenseSplitAmountInput(${idx}, this.value)">
        </div>

        ${canRemove ? `
          <button type="button" class="btn btn-secondary" onclick="removeExpenseSplitRow(${idx})" style="padding: 10px 12px; margin-bottom: 2px; color: #D32F2F;" aria-label="Teil ${idx + 1} entfernen">
            🗑️
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  updateExpenseSplitSummary();
}

function onExpenseSplitTypeChange(idx, newType) {
  if (!expenseSplitRows[idx]) return;
  expenseSplitRows[idx].type = newType;
  if (newType === 'account' && !expenseSplitRows[idx].account) {
    const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
    expenseSplitRows[idx].account = acc1;
  }

  // Statt den gesamten DOM-Container neu zu bauen (was Fokus und Screenreader zurücksetzt),
  // aktualisieren wir gezielt nur die Ziel-Spalte (Konto oder Person) für diesen Teil:
  const targetCol = document.getElementById(`exp-split-target-col-${idx}`);
  if (targetCol) {
    const isAccount = newType === 'account';
    const isLoan = newType === 'loan_lent';
    targetCol.innerHTML = isAccount ? `
      <label for="exp-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
        <strong>Konto:</strong>
      </label>
      <select id="exp-split-acc-${idx}" class="large-select" onchange="onExpenseSplitAccountChange(${idx}, this.value)">
        ${getExpenseSplitAccountOptionsHtml(expenseSplitRows[idx].account)}
      </select>
    ` : `
      <label for="exp-split-person-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
        <strong>Person / Name:${isLoan ? '<span class="required-star" aria-hidden="true">*</span>' : ''}</strong>
      </label>
      <input type="text" id="exp-split-person-${idx}" class="large-input" value="${escapeHTML(expenseSplitRows[idx].person || '')}" placeholder="${isLoan ? 'z. B. Peter, Anna' : 'z. B. Mitbewohner, Freund'}" oninput="onExpenseSplitPersonInput(${idx}, this.value)">
    `;
  } else {
    renderExpenseSplitRows();
  }

  updateExpenseSplitSummary();

  const label = (newType === 'account') ? 'Eigenes Konto (wird abgebucht)' : (newType === 'loan_lent' ? 'Verliehen mit Rückzahlung' : 'Geteilt ohne Rückzahlung (nicht vom Konto abbuchen)');
  if (typeof speakAccessibility === 'function') {
    speakAccessibility(label);
  } else if (typeof announceNVDA === 'function') {
    announceNVDA(label);
  }
}

function onExpenseSplitPersonInput(idx, val) {
  if (expenseSplitRows[idx]) {
    expenseSplitRows[idx].person = val;
  }
}

function addExpenseSplitRow() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('exp-amount').value) || 0;
  const currentSum = expenseSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = Math.max(0, Math.round((totalAmt - currentSum) * 100) / 100);

  const usedAccs = expenseSplitRows.filter(r => (r.type || 'account') === 'account').map(r => r.account);
  const unusedAcc = appState.accounts.find(a => !usedAccs.includes(a.id));
  const newAccId = unusedAcc ? unusedAcc.id : (appState.accounts[0] ? appState.accounts[0].id : 'bank');

  expenseSplitRows.push({
    type: 'account',
    account: newAccId,
    person: '',
    amount: diff > 0 ? diff : ''
  });

  renderExpenseSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Teil ${expenseSplitRows.length} hinzugefügt.`);
  }
}

function removeExpenseSplitRow(idx) {
  if (expenseSplitRows.length <= 2) return;
  expenseSplitRows.splice(idx, 1);
  renderExpenseSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Teilbetrag entfernt. Verbleibend: ${expenseSplitRows.length} Teile.`);
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

  // Leihgabe prüfen (Geld an jemanden verliehen)
  const expLoanToggle = document.getElementById('exp-loan-toggle');
  const isExpLoan = expLoanToggle && expLoanToggle.checked;
  let expLoanPerson = '';
  let expLoanDueDate = '';
  let expLoanNote = '';
  if (isExpLoan) {
    expLoanPerson = document.getElementById('exp-loan-person')?.value.trim() || '';
    if (!expLoanPerson) {
      if (typeof announceNVDA === 'function') announceNVDA('Fehler: Bitte gib den Namen der Person ein, an die du das Geld verliehen hast.', true);
      alert('⚠️ Bitte gib den Namen der Person ein, an die du das Geld verliehen hast.');
      document.getElementById('exp-loan-person')?.focus();
      return;
    }
    expLoanDueDate = document.getElementById('exp-loan-due-date')?.value || '';
    expLoanNote = document.getElementById('exp-loan-note')?.value.trim() || '';
  }

  if (isSplit) {
    splitRowsValid = expenseSplitRows.filter(r => {
      const amt = parseFloat(r.amount);
      if (isNaN(amt) || amt <= 0) return false;
      const type = r.type || 'account';
      if (type === 'account') return Boolean(r.account);
      if (type === 'loan_lent') return Boolean((r.person || '').trim());
      if (type === 'shared_no_repay') return true;
      return false;
    });

    if (splitRowsValid.length < 2) {
      if (typeof announceNVDA === 'function') announceNVDA('Fehler: Für eine Split-Zahlung müssen mindestens 2 gültige Teilbeträge mit Konto oder Person angegeben werden.', true);
      alert('⚠️ Bitte gib mindestens 2 gültige Teilbeträge mit Konto bzw. Person für die Aufteilung an.');
      return;
    }
    const splitSum = Math.round(splitRowsValid.reduce((sum, r) => sum + parseFloat(r.amount), 0) * 100) / 100;
    const expectedTotal = Math.round(amount * 100) / 100;
    if (Math.abs(splitSum - expectedTotal) > 0.01) {
      if (typeof announceNVDA === 'function') announceNVDA(`Fehler: Die Summe der Teilbeträge (${formatCurrency(splitSum)}) stimmt nicht mit dem Kaufbetrag (${formatCurrency(expectedTotal)}) überein. Differenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`, true);
      alert(`⚠️ Die Summe der aufgeteilten Beträge (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamtkaufpreis (${formatCurrency(expectedTotal)}) überein!\n\nDifferenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`);
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
    let expenseSplitId = null;
    if (isSplit) {
      expenseSplitId = `split_${Date.now()}`;
      ensurePeerLoansInitialized();

      // Fallback-Konto für Leihgaben / geteilte Kosten ermitteln
      const firstAccRow = splitRowsValid.find(r => (r.type || 'account') === 'account');
      const fallbackAccount = firstAccRow ? firstAccRow.account : (account || (appState.accounts[0] ? appState.accounts[0].id : 'bank'));

      splitRowsValid.forEach((row, idx) => {
        const rowAmt = parseFloat(row.amount);
        const rowType = row.type || 'account';
        const rowAccount = (rowType === 'account') ? (row.account || fallbackAccount) : fallbackAccount;
        let partText = '';

        if (rowType === 'loan_lent') {
          const personName = (row.person || '').trim() || 'Unbekannt';
          partText = `(Split ${idx + 1}/${splitRowsValid.length}: 🤝 ${formatCurrency(rowAmt)} verliehen an ${personName})`;
        } else if (rowType === 'shared_no_repay') {
          const personName = (row.person || '').trim();
          partText = personName
            ? `(Split ${idx + 1}/${splitRowsValid.length}: 👥 ${formatCurrency(rowAmt)} geteilt mit ${personName} ohne Rückzahlung)`
            : `(Split ${idx + 1}/${splitRowsValid.length}: 👥 ${formatCurrency(rowAmt)} geteilte Kosten ohne Rückzahlung)`;
        } else {
          const accName = formatAccountName(rowAccount);
          partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} von ${accName})`;
        }

        const finalDesc = desc ? `${desc} ${partText}` : `Split-Zahlung ${partText}`;

        const splitTx = {
          id: `tx_${Date.now()}_${idx}`,
          splitId: expenseSplitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          splitType: rowType,
          splitPerson: (row.person || '').trim(),
          type: 'expense',
          account: rowAccount,
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

        // Wenn dieser Teilbetrag eine Leihgabe an eine Person ist: PeerLoan anlegen
        if (rowType === 'loan_lent') {
          const personName = (row.person || '').trim() || 'Unbekannt';
          const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
          splitTx.peerLoanId = loanId;
          appState.peerLoans.push({
            id: loanId,
            type: 'lent',
            person: personName,
            amount: rowAmt,
            paidAmount: 0,
            date: date,
            dueDate: expLoanDueDate || '',
            account: rowAccount,
            autoBooked: true,
            txId: splitTx.id,
            note: expLoanNote ? `${expLoanNote} (Split)` : `Aus Split-Zahlung für ${category}`,
            settled: false,
            settledDate: null,
            repayments: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }

        appState.transactions.push(splitTx);
      });

      announceNVDA(`Ausgabe ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Teile ${isPlanned ? 'geplant' : 'gebucht'}!`);
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

      if (isExpLoan) {
        ensurePeerLoansInitialized();
        const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        newTx.peerLoanId = loanId;
        appState.peerLoans.push({
          id: loanId,
          type: 'lent',
          person: expLoanPerson,
          amount: amount,
          paidAmount: 0,
          date: date,
          dueDate: expLoanDueDate,
          account: account,
          autoBooked: true,
          txId: newTx.id,
          note: expLoanNote || desc,
          settled: false,
          settledDate: null,
          repayments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        announceNVDA(`Leihgabe an ${expLoanPerson} über ${formatCurrency(amount)} in deiner Übersicht gespeichert!`);
      }
    }
  }

  // Wenn allgemeine Leihgabe aktiviert war UND Split aktiv war (ohne dass zeilenbasierte Leihgaben gewählt wurden):
  // Nur anlegen, falls in splitRowsValid noch keine zeilenbasierten Leihgaben existieren
  if (isExpLoan && isSplit) {
    const hasRowLoan = splitRowsValid.some(r => (r.type || 'account') === 'loan_lent');
    if (!hasRowLoan) {
      ensurePeerLoansInitialized();
      const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      appState.peerLoans.push({
        id: loanId,
        type: 'lent',
        person: expLoanPerson,
        amount: amount,
        paidAmount: 0,
        date: date,
        dueDate: expLoanDueDate,
        account: splitRowsValid[0]?.account || account,
        autoBooked: true,
        txId: expenseSplitId,
        note: expLoanNote || desc,
        settled: false,
        settledDate: null,
        repayments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // Set peerLoanId on all split transactions
      appState.transactions.forEach(t => {
        if (t.splitId === expenseSplitId) t.peerLoanId = loanId;
      });
      announceNVDA(`Leihgabe an ${expLoanPerson} über ${formatCurrency(amount)} in deiner Übersicht gespeichert!`);
    }
  }

  await saveStateToEncryptedStorage();
  resetExpenseFormState();
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
    incomeSplitRows = [];
    const splitContainer = document.getElementById('inc-split-rows-container');
    if (splitContainer) splitContainer.innerHTML = '';
    const summaryEl = document.getElementById('inc-split-summary');
    if (summaryEl) summaryEl.style.display = 'none';
    if (typeof announceNVDA === 'function') {
      announceNVDA('Split-Einzahlung deaktiviert. Einfache Kontoauswahl wieder aktiv.');
    }
  }
}

function toggleIncomeLoanFields() {
  const toggle = document.getElementById('inc-loan-toggle');
  const sec = document.getElementById('inc-loan-section');
  const isLoan = toggle && toggle.checked;
  if (sec) sec.style.display = isLoan ? 'block' : 'none';
  if (isLoan) {
    const personInput = document.getElementById('inc-loan-person');
    if (personInput) personInput.focus();
    if (typeof announceNVDA === 'function') {
      announceNVDA('Leihgabe-Details für geliehenes Geld eingeblendet. Bitte gib den Namen der Person ein.');
    }
  } else {
    const personInput = document.getElementById('inc-loan-person');
    if (personInput) personInput.value = '';
    const dueInput = document.getElementById('inc-loan-due-date');
    if (dueInput) dueInput.value = '';
    const noteInput = document.getElementById('inc-loan-note');
    if (noteInput) noteInput.value = '';
    if (typeof announceNVDA === 'function') {
      announceNVDA('Leihgabe-Details ausgeblendet.');
    }
  }
}

function resetIncomeFormState() {
  const form = document.getElementById('form-add-income');
  if (form) form.reset();
  const incDate = document.getElementById('inc-date');
  if (incDate) incDate.value = new Date().toISOString().split('T')[0];

  // Split-Einzahlung sauber und vollständig zurücksetzen
  const splitToggle = document.getElementById('inc-split-toggle');
  if (splitToggle) splitToggle.checked = false;
  const splitSec = document.getElementById('inc-split-section');
  if (splitSec) splitSec.style.display = 'none';
  const accGroup = document.getElementById('inc-account-group');
  if (accGroup) accGroup.style.display = 'block';
  const singleAcc = document.getElementById('inc-account');
  if (singleAcc) singleAcc.required = true;
  incomeSplitRows = [];
  const splitContainer = document.getElementById('inc-split-rows-container');
  if (splitContainer) splitContainer.innerHTML = '';
  const splitSummary = document.getElementById('inc-split-summary');
  if (splitSummary) splitSummary.style.display = 'none';

  // Leihgabe sauber zurücksetzen
  const loanToggle = document.getElementById('inc-loan-toggle');
  if (loanToggle) loanToggle.checked = false;
  const loanSec = document.getElementById('inc-loan-section');
  if (loanSec) loanSec.style.display = 'none';
  const loanPerson = document.getElementById('inc-loan-person');
  if (loanPerson) loanPerson.value = '';
  const loanDue = document.getElementById('inc-loan-due-date');
  if (loanDue) loanDue.value = '';
  const loanNote = document.getElementById('inc-loan-note');
  if (loanNote) loanNote.value = '';

  currentIncomeReceipt = null;
  renderReceiptPreview('inc');
  toggleIncomeFrequencyFields();
}

function initIncomeSplitRows() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('inc-amount').value) || 0;
  const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
  const acc2 = appState.accounts[1] ? appState.accounts[1].id : (appState.accounts[0] ? appState.accounts[0].id : 'cash');

  const half = Math.round((totalAmt / 2) * 100) / 100;
  const rest = Math.round((totalAmt - half) * 100) / 100;

  incomeSplitRows = [
    { type: 'account', account: acc1, person: '', amount: half > 0 ? half : '' },
    { type: 'account', account: acc2, person: '', amount: rest > 0 ? rest : '' }
  ];
  renderIncomeSplitRows();
}

function renderIncomeSplitRows() {
  const container = document.getElementById('inc-split-rows-container');
  if (!container) return;

  container.innerHTML = incomeSplitRows.map((row, idx) => {
    const canRemove = incomeSplitRows.length > 2;
    const rowType = row.type || 'account';
    const isAccount = rowType === 'account';
    const isLoan = rowType === 'loan_borrowed';
    const isShared = rowType === 'shared_no_repay';

    return `
      <div class="split-row" data-index="${idx}" style="display: flex; gap: 8px; align-items: flex-end; background: #fff; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color, #ccc); flex-wrap: wrap;">
        <div style="flex: 2; min-width: 170px;">
          <label for="inc-split-type-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teil ${idx + 1} Art:</strong>
          </label>
          <select id="inc-split-type-${idx}" class="large-select" onchange="onIncomeSplitTypeChange(${idx}, this.value)">
            <option value="account" ${isAccount ? 'selected' : ''}>🏦 Eigenes Ziel-Konto (Wird gutgeschrieben)</option>
            <option value="loan_borrowed" ${isLoan ? 'selected' : ''}>🤝 Geliehen (Leihgabe / Schuld mit Rückzahlung)</option>
            <option value="shared_no_repay" ${isShared ? 'selected' : ''}>👥 Geteilt (Fremdanteil, nicht auf mein Konto buchen)</option>
          </select>
        </div>

        <div id="inc-split-target-col-${idx}" style="flex: 2; min-width: 160px;">
          ${isAccount ? `
            <label for="inc-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
              <strong>Ziel-Konto:</strong>
            </label>
            <select id="inc-split-acc-${idx}" class="large-select" onchange="onIncomeSplitAccountChange(${idx}, this.value)">
              ${getIncomeSplitAccountOptionsHtml(row.account)}
            </select>
          ` : `
            <label for="inc-split-person-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
              <strong>Person / Name:${isLoan ? '<span class="required-star" aria-hidden="true">*</span>' : ''}</strong>
            </label>
            <input type="text" id="inc-split-person-${idx}" class="large-input" value="${escapeHTML(row.person || '')}" placeholder="${isLoan ? 'z. B. Markus, Mama' : 'z. B. Partner, Freund'}" oninput="onIncomeSplitPersonInput(${idx}, this.value)">
          `}
        </div>

        <div style="flex: 1; min-width: 120px;">
          <label for="inc-split-amt-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teilbetrag (€):</strong>
          </label>
          <input type="number" step="0.01" min="0.01" id="inc-split-amt-${idx}" class="large-input" value="${row.amount !== '' ? row.amount : ''}" placeholder="0,00" oninput="onIncomeSplitAmountInput(${idx}, this.value)">
        </div>

        ${canRemove ? `
          <button type="button" class="btn btn-secondary" onclick="removeIncomeSplitRow(${idx})" style="padding: 10px 12px; margin-bottom: 2px; color: #D32F2F;" aria-label="Teil ${idx + 1} entfernen">
            🗑️
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  updateIncomeSplitSummary();
}

function onIncomeSplitTypeChange(idx, newType) {
  if (!incomeSplitRows[idx]) return;
  incomeSplitRows[idx].type = newType;
  if (newType === 'account' && !incomeSplitRows[idx].account) {
    const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
    incomeSplitRows[idx].account = acc1;
  }

  // Statt den gesamten DOM-Container neu zu bauen (was Fokus und Screenreader zurücksetzt),
  // aktualisieren wir gezielt nur die Ziel-Spalte (Konto oder Person) für diesen Teil:
  const targetCol = document.getElementById(`inc-split-target-col-${idx}`);
  if (targetCol) {
    const isAccount = newType === 'account';
    const isLoan = newType === 'loan_borrowed';
    targetCol.innerHTML = isAccount ? `
      <label for="inc-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
        <strong>Ziel-Konto:</strong>
      </label>
      <select id="inc-split-acc-${idx}" class="large-select" onchange="onIncomeSplitAccountChange(${idx}, this.value)">
        ${getIncomeSplitAccountOptionsHtml(incomeSplitRows[idx].account)}
      </select>
    ` : `
      <label for="inc-split-person-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
        <strong>Person / Name:${isLoan ? '<span class="required-star" aria-hidden="true">*</span>' : ''}</strong>
      </label>
      <input type="text" id="inc-split-person-${idx}" class="large-input" value="${escapeHTML(incomeSplitRows[idx].person || '')}" placeholder="${isLoan ? 'z. B. Markus, Mama' : 'z. B. Partner, Freund'}" oninput="onIncomeSplitPersonInput(${idx}, this.value)">
    `;
  } else {
    renderIncomeSplitRows();
  }

  updateIncomeSplitSummary();

  const label = (newType === 'account') ? 'Eigenes Ziel-Konto' : (newType === 'loan_borrowed' ? 'Geliehen von Person mit Rückzahlung' : 'Geteilt ohne Rückzahlung');
  if (typeof speakAccessibility === 'function') {
    speakAccessibility(label);
  } else if (typeof announceNVDA === 'function') {
    announceNVDA(label);
  }
}

function onIncomeSplitPersonInput(idx, val) {
  if (incomeSplitRows[idx]) {
    incomeSplitRows[idx].person = val;
  }
}

function addIncomeSplitRow() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('inc-amount').value) || 0;
  const currentSum = incomeSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const diff = Math.max(0, Math.round((totalAmt - currentSum) * 100) / 100);

  const usedAccs = incomeSplitRows.filter(r => (r.type || 'account') === 'account').map(r => r.account);
  const unusedAcc = appState.accounts.find(a => !usedAccs.includes(a.id));
  const newAccId = unusedAcc ? unusedAcc.id : (appState.accounts[0] ? appState.accounts[0].id : 'bank');

  incomeSplitRows.push({
    type: 'account',
    account: newAccId,
    person: '',
    amount: diff > 0 ? diff : ''
  });

  renderIncomeSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Teil ${incomeSplitRows.length} hinzugefügt.`);
  }
}

function removeIncomeSplitRow(idx) {
  if (incomeSplitRows.length <= 2) return;
  incomeSplitRows.splice(idx, 1);
  renderIncomeSplitRows();
  if (typeof announceNVDA === 'function') {
    announceNVDA(`Teilbetrag entfernt. Verbleibend: ${incomeSplitRows.length} Teile.`);
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

  // Leihgabe prüfen (Geld von jemandem geliehen)
  const incLoanToggle = document.getElementById('inc-loan-toggle');
  const isIncLoan = incLoanToggle && incLoanToggle.checked;
  let incLoanPerson = '';
  let incLoanDueDate = '';
  let incLoanNote = '';
  if (isIncLoan) {
    incLoanPerson = document.getElementById('inc-loan-person')?.value.trim() || '';
    if (!incLoanPerson) {
      if (typeof announceNVDA === 'function') announceNVDA('Fehler: Bitte gib den Namen der Person ein, von der du dir das Geld geliehen hast.', true);
      alert('⚠️ Bitte gib den Namen der Person ein, von der du dir das Geld geliehen hast.');
      document.getElementById('inc-loan-person')?.focus();
      return;
    }
    incLoanDueDate = document.getElementById('inc-loan-due-date')?.value || '';
    incLoanNote = document.getElementById('inc-loan-note')?.value.trim() || '';
  }

  if (isSplit) {
    splitRowsValid = incomeSplitRows.filter(r => {
      const amt = parseFloat(r.amount);
      if (isNaN(amt) || amt <= 0) return false;
      const type = r.type || 'account';
      if (type === 'account') return Boolean(r.account);
      if (type === 'loan_borrowed') return Boolean((r.person || '').trim());
      if (type === 'shared_no_repay') return true;
      return false;
    });

    if (splitRowsValid.length < 2) {
      if (typeof announceNVDA === 'function') announceNVDA('Fehler: Für eine Split-Einzahlung müssen mindestens 2 gültige Teilbeträge mit Konto oder Person angegeben werden.', true);
      alert('⚠️ Bitte gib mindestens 2 gültige Teilbeträge mit Konto bzw. Person für die Aufteilung der Einnahme an.');
      return;
    }
    const splitSum = Math.round(splitRowsValid.reduce((sum, r) => sum + parseFloat(r.amount), 0) * 100) / 100;
    const expectedTotal = Math.round(amount * 100) / 100;
    if (Math.abs(splitSum - expectedTotal) > 0.01) {
      if (typeof announceNVDA === 'function') announceNVDA(`Fehler: Die Summe der Teilbeträge (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamteinnahmebetrag (${formatCurrency(expectedTotal)}) überein. Differenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`, true);
      alert(`⚠️ Die Summe der aufgeteilten Beträge (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamteinnahmebetrag (${formatCurrency(expectedTotal)}) überein!\n\nDifferenz: ${formatCurrency(Math.abs(splitSum - expectedTotal))}`);
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
        const rowType = row.type || 'account';
        const rowAccount = (rowType === 'account') ? row.account : (account || (appState.accounts[0] ? appState.accounts[0].id : 'bank'));
        const accName = formatAccountName(rowAccount);
        const partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} auf ${accName})`;
        const recName = desc ? `${desc} ${partText}` : `${category} ${partText}`;

        appState.recurring.push({
          id: `rec_${Date.now()}_${idx}`,
          splitId: splitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          splitType: rowType,
          splitPerson: (row.person || '').trim(),
          type: 'income',
          account: rowAccount,
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
      announceNVDA(`Dauerhafte Einnahme ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Teile gespeichert!`);
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
    let incomeSplitId = null;
    if (isSplit) {
      incomeSplitId = `split_inc_${Date.now()}`;
      ensurePeerLoansInitialized();

      // Fallback-Konto für Leihgaben / geteilte Einnahmen ermitteln
      const firstAccRow = splitRowsValid.find(r => (r.type || 'account') === 'account');
      const fallbackAccount = firstAccRow ? firstAccRow.account : (account || (appState.accounts[0] ? appState.accounts[0].id : 'bank'));

      splitRowsValid.forEach((row, idx) => {
        const rowAmt = parseFloat(row.amount);
        const rowType = row.type || 'account';
        const rowAccount = (rowType === 'account') ? (row.account || fallbackAccount) : fallbackAccount;
        let partText = '';

        if (rowType === 'loan_borrowed') {
          const personName = (row.person || '').trim() || 'Unbekannt';
          partText = `(Split ${idx + 1}/${splitRowsValid.length}: 🤝 ${formatCurrency(rowAmt)} geliehen von ${personName})`;
        } else if (rowType === 'shared_no_repay') {
          const personName = (row.person || '').trim();
          partText = personName
            ? `(Split ${idx + 1}/${splitRowsValid.length}: 👥 ${formatCurrency(rowAmt)} geteilt mit ${personName} ohne Rückzahlung)`
            : `(Split ${idx + 1}/${splitRowsValid.length}: 👥 ${formatCurrency(rowAmt)} geteilter Betrag ohne Rückzahlung)`;
        } else {
          const accName = formatAccountName(rowAccount);
          partText = `(Split ${idx + 1}/${splitRowsValid.length}: ${formatCurrency(rowAmt)} auf ${accName})`;
        }

        const finalDesc = desc ? `${desc} ${partText}` : `Split-Einzahlung ${partText}`;

        const splitTx = {
          id: `tx_${Date.now()}_${idx}`,
          splitId: incomeSplitId,
          splitIndex: idx + 1,
          splitTotalCount: splitRowsValid.length,
          splitTotalAmount: amount,
          splitType: rowType,
          splitPerson: (row.person || '').trim(),
          type: 'income',
          account: rowAccount,
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

        // Wenn dieser Teilbetrag eine Leihgabe von einer Person ist: PeerLoan anlegen
        if (rowType === 'loan_borrowed') {
          const personName = (row.person || '').trim() || 'Unbekannt';
          const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
          splitTx.peerLoanId = loanId;
          appState.peerLoans.push({
            id: loanId,
            type: 'borrowed',
            person: personName,
            amount: rowAmt,
            paidAmount: 0,
            date: date,
            dueDate: incLoanDueDate || '',
            account: rowAccount,
            autoBooked: true,
            txId: splitTx.id,
            note: incLoanNote ? `${incLoanNote} (Split)` : `Aus Split-Einzahlung für ${category}`,
            settled: false,
            settledDate: null,
            repayments: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }

        appState.transactions.push(splitTx);
      });

      announceNVDA(`Einnahme ${category} über ${formatCurrency(amount)} aufgeteilt auf ${splitRowsValid.length} Teile ${isPlanned ? 'geplant' : 'gebucht'}!`);
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

      if (isIncLoan) {
        ensurePeerLoansInitialized();
        const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        newTx.peerLoanId = loanId;
        appState.peerLoans.push({
          id: loanId,
          type: 'borrowed',
          person: incLoanPerson,
          amount: amount,
          paidAmount: 0,
          date: date,
          dueDate: incLoanDueDate,
          account: account,
          autoBooked: true,
          txId: newTx.id,
          note: incLoanNote || desc,
          settled: false,
          settledDate: null,
          repayments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        announceNVDA(`Geliehenes Geld von ${incLoanPerson} über ${formatCurrency(amount)} in deiner Übersicht gespeichert!`);
      }
    }
  }

  // Wenn allgemeine Leihgabe aktiviert war UND Split aktiv war (ohne dass zeilenbasierte Leihgaben gewählt wurden):
  // Nur anlegen, falls in splitRowsValid noch keine zeilenbasierten Leihgaben existieren
  if (isIncLoan && isSplit) {
    const hasRowLoan = splitRowsValid.some(r => (r.type || 'account') === 'loan_borrowed');
    if (!hasRowLoan) {
      ensurePeerLoansInitialized();
      const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      appState.peerLoans.push({
        id: loanId,
        type: 'borrowed',
        person: incLoanPerson,
        amount: amount,
        paidAmount: 0,
        date: date,
        dueDate: incLoanDueDate,
        account: splitRowsValid[0]?.account || account,
        autoBooked: true,
        txId: incomeSplitId,
        note: incLoanNote || desc,
        settled: false,
        settledDate: null,
        repayments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // Set peerLoanId on all split transactions
      appState.transactions.forEach(t => {
        if (t.splitId === incomeSplitId) t.peerLoanId = loanId;
      });
      announceNVDA(`Geliehenes Geld von ${incLoanPerson} über ${formatCurrency(amount)} in deiner Übersicht gespeichert!`);
    }
  }

  await saveStateToEncryptedStorage();
  resetIncomeFormState();
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

  const safeType = (type === 'income' || type === 'inc') ? 'inc' : 'exp';
  const db = CATEGORIES_DB[safeType] || CATEGORIES_DB['exp'];
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

  const currentType = (type === 'income' || type === 'inc') ? 'inc' : 'exp';
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
  const splitToggleGroup = document.getElementById('edit-tx-split-toggle-group');
  const splitToggle = document.getElementById('edit-tx-split-toggle');
  const splitSec = document.getElementById('edit-tx-split-section');
  const loanToggleGroup = document.getElementById('edit-tx-loan-toggle-group');
  const loanToggle = document.getElementById('edit-tx-loan-toggle');
  const loanSec = document.getElementById('edit-tx-loan-section');
  const loanLabel = document.getElementById('edit-tx-loan-label');
  const loanPersonLabel = document.getElementById('edit-tx-loan-person-label');

  if (type === 'transfer') {
    if (splitToggleGroup) splitToggleGroup.style.display = 'none';
    if (splitToggle) splitToggle.checked = false;
    if (splitSec) splitSec.style.display = 'none';
    if (loanToggleGroup) loanToggleGroup.style.display = 'none';
    if (loanToggle) loanToggle.checked = false;
    if (loanSec) loanSec.style.display = 'none';
    if (singleAcc) singleAcc.style.display = 'none';
    if (trfAcc) trfAcc.style.display = 'grid';
    if (catSection) catSection.style.display = 'none';
  } else {
    if (splitToggleGroup) splitToggleGroup.style.display = 'block';
    const isSplit = splitToggle && splitToggle.checked;
    if (singleAcc) singleAcc.style.display = isSplit ? 'none' : 'block';
    if (splitSec) splitSec.style.display = isSplit ? 'block' : 'none';
    if (trfAcc) trfAcc.style.display = 'none';
    if (catSection) catSection.style.display = 'block';

    if (loanToggleGroup) loanToggleGroup.style.display = 'block';
    const isLoan = loanToggle && loanToggle.checked;
    if (loanSec) loanSec.style.display = isLoan ? 'block' : 'none';
    if (loanLabel) {
      loanLabel.textContent = (type === 'income')
        ? '🤝 Geld von jemandem geliehen (als Leihgabe / Schuld erfassen)'
        : '🤝 Geld an jemanden verliehen (als Leihgabe / Forderung erfassen)';
    }
    if (loanPersonLabel) {
      loanPersonLabel.textContent = (type === 'income')
        ? 'Von wem geliehen? (Name der Person):'
        : 'An wen verliehen? (Name der Person):';
    }

    const catType = (type === 'income') ? 'inc' : 'exp';
    populateEditModalCategories(catType);
  }
}

function toggleEditLoanFields() {
  const toggle = document.getElementById('edit-tx-loan-toggle');
  const sec = document.getElementById('edit-tx-loan-section');
  const isLoan = toggle && toggle.checked;
  if (sec) sec.style.display = isLoan ? 'block' : 'none';
  if (isLoan) {
    const personInput = document.getElementById('edit-tx-loan-person');
    if (personInput) personInput.focus();
    if (typeof announceNVDA === 'function') {
      announceNVDA('Leihgabe-Details für Buchung eingeblendet. Bitte gib den Namen der Person ein.');
    }
  } else {
    if (typeof announceNVDA === 'function') {
      announceNVDA('Leihgabe-Details ausgeblendet.');
    }
  }
}

// ----------------------------------------------------------------------------
// SPLIT-ZAHLUNG IN BUCHUNGS-BEARBEITUNG
// ----------------------------------------------------------------------------
let editSplitRows = [];

function getEditSplitAccountOptionsHtml(selectedAccId) {
  ensureAccountsInitialized();
  return appState.accounts.map(acc => {
    const sel = (acc.id === selectedAccId) ? 'selected' : '';
    return `<option value="${escapeHTML(acc.id)}" ${sel}>${escapeHTML(acc.name)}</option>`;
  }).join('');
}

function toggleEditSplitPayment() {
  const toggle = document.getElementById('edit-tx-split-toggle');
  const splitSec = document.getElementById('edit-tx-split-section');
  const singleAcc = document.getElementById('edit-tx-single-account-group');
  const isSplit = toggle && toggle.checked;

  if (splitSec) splitSec.style.display = isSplit ? 'block' : 'none';
  if (singleAcc) singleAcc.style.display = isSplit ? 'none' : 'block';

  if (isSplit) {
    if (!editSplitRows || editSplitRows.length < 2) {
      initEditSplitRows();
    } else {
      renderEditSplitRows();
    }
    announceNVDA('Split-Zahlung in Bearbeitung aktiviert. Du kannst den Betrag nun auf mehrere Konten aufteilen.');
  } else {
    announceNVDA('Split-Zahlung in Bearbeitung deaktiviert. Einfache Kontoauswahl wieder aktiv.');
  }
}

function initEditSplitRows() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('edit-tx-amount').value) || 0;
  const currentAcc = document.getElementById('edit-tx-account')?.value;
  const acc1 = currentAcc || (appState.accounts[0] ? appState.accounts[0].id : 'bank');
  const acc2 = appState.accounts.find(a => a.id !== acc1)?.id || (appState.accounts[1] ? appState.accounts[1].id : 'cash');

  const half = Math.round((totalAmt / 2) * 100) / 100;
  const rest = Math.round((totalAmt - half) * 100) / 100;

  editSplitRows = [
    { type: 'account', account: acc1, person: '', amount: half > 0 ? half : '' },
    { type: 'account', account: acc2, person: '', amount: rest > 0 ? rest : '' }
  ];
  renderEditSplitRows();
}

function renderEditSplitRows() {
  const container = document.getElementById('edit-tx-split-rows-container');
  if (!container) return;

  const type = document.getElementById('edit-tx-type')?.value || 'expense';
  const isIncome = type === 'income';

  container.innerHTML = editSplitRows.map((row, idx) => {
    const canRemove = editSplitRows.length > 2;
    const rowType = row.type || 'account';
    const isAccount = rowType === 'account';
    const isLoan = (rowType === 'loan_lent' || rowType === 'loan_borrowed');
    const isShared = rowType === 'shared_no_repay';

    const optLoanValue = isIncome ? 'loan_borrowed' : 'loan_lent';
    const optLoanLabel = isIncome ? '🤝 Geliehen (Leihgabe mit Rückzahlung)' : '🤝 Verliehen (Leihgabe mit Rückzahlung)';

    return `
      <div class="split-row" data-index="${idx}" style="display: flex; gap: 8px; align-items: flex-end; background: #fff; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color, #ccc); flex-wrap: wrap;">
        <div style="flex: 2; min-width: 170px;">
          <label for="edit-split-type-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teil ${idx + 1} Art:</strong>
          </label>
          <select id="edit-split-type-${idx}" class="large-select" onchange="onEditSplitTypeChange(${idx}, this.value)">
            <option value="account" ${isAccount ? 'selected' : ''}>🏦 Eigenes Konto (Wird verbucht)</option>
            <option value="${optLoanValue}" ${isLoan ? 'selected' : ''}>${optLoanLabel}</option>
            <option value="shared_no_repay" ${isShared ? 'selected' : ''}>👥 Geteilt (Fremdanteil, nicht vom Konto buchen)</option>
          </select>
        </div>

        <div id="edit-split-target-col-${idx}" style="flex: 2; min-width: 160px;">
          ${isAccount ? `
            <label for="edit-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
              <strong>Konto:</strong>
            </label>
            <select id="edit-split-acc-${idx}" class="large-select" onchange="onEditSplitAccountChange(${idx}, this.value)">
              ${getEditSplitAccountOptionsHtml(row.account)}
            </select>
          ` : `
            <label for="edit-split-person-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
              <strong>Person / Name:${isLoan ? '<span class="required-star" aria-hidden="true">*</span>' : ''}</strong>
            </label>
            <input type="text" id="edit-split-person-${idx}" class="large-input" value="${escapeHTML(row.person || '')}" placeholder="z. B. Peter, Anna" oninput="onEditSplitPersonInput(${idx}, this.value)">
          `}
        </div>

        <div style="flex: 1; min-width: 120px;">
          <label for="edit-split-amt-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
            <strong>Teilbetrag (€):</strong>
          </label>
          <input type="number" step="0.01" min="0.01" id="edit-split-amt-${idx}" class="large-input" value="${row.amount !== '' ? row.amount : ''}" placeholder="0,00" oninput="onEditSplitAmountInput(${idx}, this.value)">
        </div>

        ${canRemove ? `
          <button type="button" class="btn btn-secondary" onclick="removeEditSplitRow(${idx})" style="padding: 10px 12px; margin-bottom: 2px; color: #D32F2F;" aria-label="Teil ${idx + 1} entfernen">
            🗑️
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  updateEditSplitSummary();
}

function onEditSplitTypeChange(idx, newType) {
  if (!editSplitRows[idx]) return;
  editSplitRows[idx].type = newType;
  if (newType === 'account' && !editSplitRows[idx].account) {
    const acc1 = appState.accounts[0] ? appState.accounts[0].id : 'bank';
    editSplitRows[idx].account = acc1;
  }

  // Statt den gesamten DOM-Container neu zu bauen (was Fokus und Screenreader zurücksetzt),
  // aktualisieren wir gezielt nur die Ziel-Spalte (Konto oder Person) für diesen Teil:
  const targetCol = document.getElementById(`edit-split-target-col-${idx}`);
  if (targetCol) {
    const isAccount = newType === 'account';
    const isLoan = (newType === 'loan_lent' || newType === 'loan_borrowed');
    targetCol.innerHTML = isAccount ? `
      <label for="edit-split-acc-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
        <strong>Konto:</strong>
      </label>
      <select id="edit-split-acc-${idx}" class="large-select" onchange="onEditSplitAccountChange(${idx}, this.value)">
        ${getEditSplitAccountOptionsHtml(editSplitRows[idx].account)}
      </select>
    ` : `
      <label for="edit-split-person-${idx}" class="field-label" style="font-size: 13px; margin-bottom: 2px;">
        <strong>Person / Name:${isLoan ? '<span class="required-star" aria-hidden="true">*</span>' : ''}</strong>
      </label>
      <input type="text" id="edit-split-person-${idx}" class="large-input" value="${escapeHTML(editSplitRows[idx].person || '')}" placeholder="z. B. Peter, Anna" oninput="onEditSplitPersonInput(${idx}, this.value)">
    `;
  } else {
    renderEditSplitRows();
  }

  updateEditSplitSummary();

  const label = (newType === 'account') ? 'Eigenes Konto' : (newType === 'loan_lent' ? 'Verliehen mit Rückzahlung' : (newType === 'loan_borrowed' ? 'Geliehen mit Rückzahlung' : 'Geteilt ohne Rückzahlung'));
  if (typeof speakAccessibility === 'function') {
    speakAccessibility(label);
  } else if (typeof announceNVDA === 'function') {
    announceNVDA(label);
  }
}

function onEditSplitPersonInput(idx, val) {
  if (editSplitRows[idx]) {
    editSplitRows[idx].person = val;
  }
}

function addEditSplitRow() {
  ensureAccountsInitialized();
  const totalAmt = parseFloat(document.getElementById('edit-tx-amount').value) || 0;
  const currentSum = editSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const remaining = Math.max(0, Math.round((totalAmt - currentSum) * 100) / 100);

  const usedAccs = new Set(editSplitRows.filter(r => (r.type || 'account') === 'account').map(r => r.account));
  const freeAcc = appState.accounts.find(a => !usedAccs.has(a.id));
  const newAcc = freeAcc ? freeAcc.id : (appState.accounts[0] ? appState.accounts[0].id : 'bank');

  editSplitRows.push({
    type: 'account',
    account: newAcc,
    person: '',
    amount: remaining > 0 ? remaining : ''
  });
  renderEditSplitRows();
  announceNVDA(`Weiterer Teilbetrag hinzugefügt. Jetzt ${editSplitRows.length} Teile.`);
}

function removeEditSplitRow(idx) {
  if (editSplitRows.length <= 2) return;
  editSplitRows.splice(idx, 1);
  renderEditSplitRows();
  announceNVDA(`Teilbetrag entfernt. Noch ${editSplitRows.length} Teile im Split.`);
}

function onEditSplitAccountChange(idx, val) {
  if (editSplitRows[idx]) {
    editSplitRows[idx].account = val;
  }
}

function onEditSplitAmountInput(idx, val) {
  if (editSplitRows[idx]) {
    editSplitRows[idx].amount = val;
    updateEditSplitSummary();
  }
}

function updateEditSplitSummary() {
  const summaryEl = document.getElementById('edit-tx-split-summary');
  if (!summaryEl) return;

  const totalAmt = parseFloat(document.getElementById('edit-tx-amount').value) || 0;
  const currentSum = Math.round(editSplitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) * 100) / 100;
  const diff = Math.round((totalAmt - currentSum) * 100) / 100;

  if (Math.abs(diff) < 0.01 && totalAmt > 0) {
    summaryEl.style.background = '#E8F5E9';
    summaryEl.style.borderColor = '#4CAF50';
    summaryEl.style.color = '#1B5E20';
    summaryEl.innerHTML = `✅ Perfekt aufgeteilt: ${formatCurrency(currentSum)} von ${formatCurrency(totalAmt)}`;
  } else if (diff > 0) {
    summaryEl.style.background = '#FFF3E0';
    summaryEl.style.borderColor = '#FF9800';
    summaryEl.style.color = '#E65100';
    summaryEl.innerHTML = `⚠️ Noch offen: ${formatCurrency(diff)} (Summe: ${formatCurrency(currentSum)} / Ziel: ${formatCurrency(totalAmt)})`;
  } else {
    summaryEl.style.background = '#FFEBEE';
    summaryEl.style.borderColor = '#F44336';
    summaryEl.style.color = '#B71C1C';
    summaryEl.innerHTML = `❌ Zu viel aufgeteilt: ${formatCurrency(Math.abs(diff))} über Ziel (Summe: ${formatCurrency(currentSum)} / Ziel: ${formatCurrency(totalAmt)})`;
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
  document.getElementById('edit-tx-date').value = tx.date;
  document.getElementById('edit-tx-type').value = tx.type || 'expense';
  document.getElementById('edit-tx-planned').value = tx.isPlanned ? 'true' : 'false';

  const splitToggle = document.getElementById('edit-tx-split-toggle');
  const splitSec = document.getElementById('edit-tx-split-section');
  const singleAccGroup = document.getElementById('edit-tx-single-account-group');

  if (tx.type === 'transfer') {
    document.getElementById('edit-tx-amount').value = tx.amount;
    document.getElementById('edit-tx-from').value = tx.fromAccount || 'bank';
    document.getElementById('edit-tx-to').value = tx.toAccount || 'savings';
    if (splitToggle) splitToggle.checked = false;
    if (splitSec) splitSec.style.display = 'none';
  } else {
    // Prüfen, ob dies Teil einer Split-Buchung ist
    const isSplit = Boolean(tx.splitId);
    if (isSplit) {
      const splitSiblings = appState.transactions.filter(t => t.splitId === tx.splitId);
      splitSiblings.sort((a, b) => (a.splitIndex || 0) - (b.splitIndex || 0));
      const totalAmount = splitSiblings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      document.getElementById('edit-tx-amount').value = totalAmount.toFixed(2);
      
      if (splitToggle) splitToggle.checked = true;
      if (splitSec) splitSec.style.display = 'block';
      if (singleAccGroup) singleAccGroup.style.display = 'none';

      editSplitRows = splitSiblings.map(s => {
        let rType = s.splitType;
        let rPerson = s.splitPerson || '';
        if (!rType) {
          if (s.peerLoanId) {
            rType = (s.type === 'income') ? 'loan_borrowed' : 'loan_lent';
            const matchedLoan = (appState.peerLoans || []).find(l => l.id === s.peerLoanId);
            if (matchedLoan && matchedLoan.person) rPerson = matchedLoan.person;
          } else if (s.description && s.description.includes('verliehen an ')) {
            rType = 'loan_lent';
            const m = s.description.match(/verliehen an ([^)]+)/i);
            if (m) rPerson = m[1].trim();
          } else if (s.description && s.description.includes('geliehen von ')) {
            rType = 'loan_borrowed';
            const m = s.description.match(/geliehen von ([^)]+)/i);
            if (m) rPerson = m[1].trim();
          } else if (s.description && s.description.includes('geteilt mit ')) {
            rType = 'shared_no_repay';
            const m = s.description.match(/geteilt mit ([^)]+)/i);
            if (m) rPerson = m[1].trim();
          } else if (s.description && s.description.includes('geteilte Kosten')) {
            rType = 'shared_no_repay';
          } else {
            rType = 'account';
          }
        }
        return {
          type: rType,
          account: s.account || (appState.accounts[0] ? appState.accounts[0].id : 'bank'),
          person: rPerson,
          amount: parseFloat(s.amount) || 0
        };
      });
      renderEditSplitRows();
    } else {
      document.getElementById('edit-tx-amount').value = tx.amount;
      document.getElementById('edit-tx-account').value = tx.account || 'bank';
      if (splitToggle) splitToggle.checked = false;
      if (splitSec) splitSec.style.display = 'none';
      if (singleAccGroup) singleAccGroup.style.display = 'block';
      editSplitRows = [];
    }
  }

  onEditTxTypeChange();

  // Prüfen, ob eine verknüpfte Leihgabe existiert
  ensurePeerLoansInitialized();
  const linkedLoan = (appState.peerLoans || []).find(l => {
    if (l.txId && (l.txId === tx.id || (tx.splitId && l.txId === tx.splitId))) return true;
    if (tx.peerLoanId && l.id === tx.peerLoanId) return true;
    if (Math.abs(Number(l.amount) - Number(tx.amount)) < 0.01 && l.person && tx.description && tx.description.toLowerCase().includes(l.person.toLowerCase())) return true;
    return false;
  });

  let detectedPerson = '';
  let detectedNote = '';
  if (!linkedLoan && tx.type !== 'transfer') {
    const isLentText = (tx.description || '').startsWith('Verliehen an ');
    const isBorrowedText = (tx.description || '').startsWith('Geliehen von ');
    if (isLentText || isBorrowedText) {
      const fullText = tx.description.substring(14).trim();
      const match = fullText.match(/^([^(]+)(?:\((.*)\))?$/);
      if (match) {
        detectedPerson = match[1].trim();
        detectedNote = match[2] ? match[2].trim() : '';
      } else {
        detectedPerson = fullText;
      }
    }
  }

  const loanToggle = document.getElementById('edit-tx-loan-toggle');
  const loanSec = document.getElementById('edit-tx-loan-section');
  const loanPersonInput = document.getElementById('edit-tx-loan-person');
  const loanDueDateInput = document.getElementById('edit-tx-loan-due-date');
  const loanNoteInput = document.getElementById('edit-tx-loan-note');

  if (linkedLoan && tx.type !== 'transfer') {
    if (loanToggle) loanToggle.checked = true;
    if (loanSec) loanSec.style.display = 'block';
    if (loanPersonInput) loanPersonInput.value = linkedLoan.person || '';
    if (loanDueDateInput) loanDueDateInput.value = linkedLoan.dueDate || '';
    if (loanNoteInput) loanNoteInput.value = linkedLoan.note || '';
  } else if (detectedPerson && tx.type !== 'transfer') {
    if (loanToggle) loanToggle.checked = true;
    if (loanSec) loanSec.style.display = 'block';
    if (loanPersonInput) loanPersonInput.value = detectedPerson;
    if (loanDueDateInput) loanDueDateInput.value = '';
    if (loanNoteInput) loanNoteInput.value = detectedNote;
  } else {
    if (loanToggle) loanToggle.checked = false;
    if (loanSec) loanSec.style.display = 'none';
    if (loanPersonInput) loanPersonInput.value = '';
    if (loanDueDateInput) loanDueDateInput.value = '';
    if (loanNoteInput) loanNoteInput.value = '';
  }

  if (tx.type !== 'transfer') {
    const catType = (tx.type === 'income') ? 'inc' : 'exp';
    populateEditModalCategories(catType, tx.category, tx.subcategory);
  }

  // Beschreibung bereinigen von "(Split X/Y: ...)" falls vorhanden
  const cleanDesc = (tx.description || '').replace(/\s*\(Split \d+\/\d+:.*?\)/g, '').trim();
  document.getElementById('edit-tx-desc').value = cleanDesc;

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

  const originalSplitId = tx.splitId;
  const originalPeerLoanId = tx.peerLoanId;

  const type = document.getElementById('edit-tx-type').value;
  const date = document.getElementById('edit-tx-date').value;
  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;
  const rawAmt = document.getElementById('edit-tx-amount').value || '0';
  const totalAmount = parseFloat(rawAmt.toString().replace(',', '.')) || 0;
  const plannedVal = document.getElementById('edit-tx-planned').value;
  const isPlanned = (plannedVal === 'true') || isFuture;
  const desc = document.getElementById('edit-tx-desc').value.trim();

  const isSplitToggle = document.getElementById('edit-tx-split-toggle')?.checked && type !== 'transfer';
  const isLoanToggle = document.getElementById('edit-tx-loan-toggle')?.checked && type !== 'transfer';

  // Frühzeitige Validierung der Leihgabe vor allen Änderungen
  let loanPerson = '';
  let loanDueDate = '';
  let loanNote = '';
  if (isLoanToggle) {
    loanPerson = document.getElementById('edit-tx-loan-person')?.value.trim();
    if (!loanPerson) {
      alert('Bitte gib den Namen der Person für die Leihgabe ein.');
      document.getElementById('edit-tx-loan-person')?.focus();
      return;
    }
    loanDueDate = document.getElementById('edit-tx-loan-due-date')?.value || '';
    loanNote = document.getElementById('edit-tx-loan-note')?.value.trim() || '';
  }

  let newSplitId = null;
  if (isSplitToggle) {
    const validRows = editSplitRows.filter(r => {
      const amt = parseFloat(r.amount);
      if (isNaN(amt) || amt <= 0) return false;
      const rType = r.type || 'account';
      if (rType === 'account') return Boolean(r.account);
      if (rType === 'loan_lent' || rType === 'loan_borrowed') return Boolean((r.person || '').trim());
      if (rType === 'shared_no_repay') return true;
      return false;
    });

    if (validRows.length < 2) {
      alert('Bei einer Split-Zahlung müssen mindestens 2 gültige Teilbeträge mit Konto bzw. Person angegeben werden.');
      return;
    }
    const splitSum = Math.round(validRows.reduce((sum, r) => sum + parseFloat(r.amount), 0) * 100) / 100;
    const roundedTotal = Math.round(totalAmount * 100) / 100;
    if (Math.abs(splitSum - roundedTotal) > 0.01) {
      alert(`Die Summe der Teilbeträge (${formatCurrency(splitSum)}) stimmt nicht mit dem Gesamtbetrag (${formatCurrency(roundedTotal)}) überein. Differenz: ${formatCurrency(Math.abs(splitSum - roundedTotal))}`);
      return;
    }

    const category = document.getElementById('edit-tx-category').value;
    const subcategory = document.getElementById('edit-tx-subcategory').value;
    const receiptToKeep = currentEditReceipt ? JSON.parse(JSON.stringify(currentEditReceipt)) : (tx.receipt ? JSON.parse(JSON.stringify(tx.receipt)) : null);

    // Alle alten Split-Geschwister ermitteln und deren verknüpfte zeilenbasierte Leihgaben bereinigen
    const oldSplitId = tx.splitId;
    if (oldSplitId) {
      const oldSiblings = appState.transactions.filter(t => t.splitId === oldSplitId);
      const oldLoanIds = oldSiblings.map(s => s.peerLoanId).filter(Boolean);
      if (oldLoanIds.length > 0) {
        appState.peerLoans = (appState.peerLoans || []).filter(l => !oldLoanIds.includes(l.id));
      }
      appState.transactions = appState.transactions.filter(t => t.splitId !== oldSplitId);
    } else {
      if (tx.peerLoanId) {
        appState.peerLoans = (appState.peerLoans || []).filter(l => l.id !== tx.peerLoanId);
      }
      appState.transactions = appState.transactions.filter(t => t.id !== id);
    }

    // Neue Split-Buchungen anlegen
    newSplitId = oldSplitId || (`split_${Date.now()}`);
    ensurePeerLoansInitialized();

    const firstAccRow = validRows.find(r => (r.type || 'account') === 'account');
    const fallbackAccount = firstAccRow ? firstAccRow.account : (document.getElementById('edit-tx-account')?.value || (appState.accounts[0] ? appState.accounts[0].id : 'bank'));

    validRows.forEach((row, idx) => {
      const rowAmt = parseFloat(row.amount);
      const rowType = row.type || 'account';
      const rowAccount = (rowType === 'account') ? (row.account || fallbackAccount) : fallbackAccount;
      let partText = '';

      if (rowType === 'loan_lent') {
        const personName = (row.person || '').trim() || 'Unbekannt';
        partText = `(Split ${idx + 1}/${validRows.length}: 🤝 ${formatCurrency(rowAmt)} verliehen an ${personName})`;
      } else if (rowType === 'loan_borrowed') {
        const personName = (row.person || '').trim() || 'Unbekannt';
        partText = `(Split ${idx + 1}/${validRows.length}: 🤝 ${formatCurrency(rowAmt)} geliehen von ${personName})`;
      } else if (rowType === 'shared_no_repay') {
        const personName = (row.person || '').trim();
        partText = personName
          ? `(Split ${idx + 1}/${validRows.length}: 👥 ${formatCurrency(rowAmt)} geteilt mit ${personName} ohne Rückzahlung)`
          : `(Split ${idx + 1}/${validRows.length}: 👥 ${formatCurrency(rowAmt)} geteilter Betrag ohne Rückzahlung)`;
      } else {
        const accName = formatAccountName(rowAccount);
        partText = `(Split ${idx + 1}/${validRows.length}: ${formatCurrency(rowAmt)} von ${accName})`;
      }

      const finalDesc = desc ? `${desc} ${partText}` : `Split-Zahlung ${partText}`;

      const newTx = {
        id: `tx_${Date.now()}_${idx}`,
        splitId: newSplitId,
        splitIndex: idx + 1,
        splitTotalCount: validRows.length,
        splitTotalAmount: roundedTotal,
        splitType: rowType,
        splitPerson: (row.person || '').trim(),
        type: type,
        account: rowAccount,
        amount: rowAmt,
        category: category,
        subcategory: subcategory,
        description: finalDesc,
        isPlanned: isPlanned,
        date: date
      };

      if (receiptToKeep) {
        newTx.receipt = JSON.parse(JSON.stringify(receiptToKeep));
      }

      // Wenn diese Zeile eine Leihgabe ist: PeerLoan anlegen
      if (rowType === 'loan_lent' || rowType === 'loan_borrowed') {
        const personName = (row.person || '').trim() || 'Unbekannt';
        const loanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const pType = (rowType === 'loan_borrowed' || type === 'income') ? 'borrowed' : 'lent';
        newTx.peerLoanId = loanId;
        appState.peerLoans.push({
          id: loanId,
          type: pType,
          person: personName,
          amount: rowAmt,
          paidAmount: 0,
          date: date,
          dueDate: loanDueDate || '',
          account: rowAccount,
          autoBooked: true,
          txId: newTx.id,
          note: loanNote ? `${loanNote} (Split)` : `Aus Split-Buchung für ${category}`,
          settled: false,
          settledDate: null,
          repayments: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }

      appState.transactions.push(newTx);
    });

    announceNVDA(`Split-Buchung über ${formatCurrency(roundedTotal)} aufgeteilt auf ${validRows.length} Teile erfolgreich aktualisiert!`);
  } else {
    // Normale Einzelbuchung (oder vorherige Split-Buchung zu Einzelbuchung zusammenführen)
    if (tx.splitId) {
      // Vorher war es ein Split, jetzt wurde Split abgewählt: Geschwister entfernen
      appState.transactions = appState.transactions.filter(t => t.splitId !== tx.splitId || t.id === tx.id);
      delete tx.splitId;
      delete tx.splitIndex;
      delete tx.splitTotalCount;
      delete tx.splitTotalAmount;
    }

    tx.type = type;
    tx.amount = totalAmount;
    tx.date = date;
    tx.isPlanned = isPlanned;

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

    tx.description = desc;

    if (currentEditReceipt) {
      tx.receipt = currentEditReceipt;
    } else {
      delete tx.receipt;
    }

    announceNVDA('Buchung erfolgreich aktualisiert!');
  }

  // Leihgabe-Synchronisation beim Bearbeiten der Buchung
  ensurePeerLoansInitialized();
  const linkedLoan = (appState.peerLoans || []).find(l => {
    if (l.txId && (l.txId === id || (originalSplitId && l.txId === originalSplitId))) return true;
    if (originalPeerLoanId && l.id === originalPeerLoanId) return true;
    if (Math.abs(Number(l.amount) - Number(totalAmount)) < 0.01 && l.person && (desc && desc.toLowerCase().includes(l.person.toLowerCase()))) return true;
    return false;
  });

  const targetTxId = isSplitToggle ? newSplitId : id;

  if (isLoanToggle) {
    const loanType = (type === 'income') ? 'borrowed' : 'lent';
    const loanAcc = tx?.account || (isSplitToggle ? editSplitRows[0]?.account : 'bank');

    if (linkedLoan) {
      linkedLoan.person = loanPerson;
      linkedLoan.type = loanType;
      linkedLoan.amount = totalAmount;
      linkedLoan.date = date;
      linkedLoan.dueDate = loanDueDate;
      linkedLoan.account = loanAcc || linkedLoan.account;
      linkedLoan.note = loanNote;
      linkedLoan.txId = targetTxId;
      linkedLoan.updatedAt = Date.now();
      if (Number(linkedLoan.paidAmount || 0) >= totalAmount) {
        linkedLoan.settled = true;
      } else {
        linkedLoan.settled = false;
        linkedLoan.settledDate = null;
      }
      if (tx) tx.peerLoanId = linkedLoan.id;
      if (isSplitToggle && newSplitId) {
        appState.transactions.forEach(t => {
          if (t.splitId === newSplitId) t.peerLoanId = linkedLoan.id;
        });
      }
    } else {
      const newLoanId = 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      appState.peerLoans.push({
        id: newLoanId,
        type: loanType,
        person: loanPerson,
        amount: totalAmount,
        paidAmount: 0,
        date: date,
        dueDate: loanDueDate,
        account: loanAcc || 'bank',
        autoBooked: true,
        txId: targetTxId,
        note: loanNote || desc,
        settled: false,
        settledDate: null,
        repayments: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      if (tx) tx.peerLoanId = newLoanId;
      if (isSplitToggle && newSplitId) {
        appState.transactions.forEach(t => {
          if (t.splitId === newSplitId) t.peerLoanId = newLoanId;
        });
      }
    }
  } else if (linkedLoan) {
    // Häkchen wurde entfernt: Leihgabe entfernen
    appState.peerLoans = appState.peerLoans.filter(l => l.id !== linkedLoan.id);
    if (tx) delete tx.peerLoanId;
    if (isSplitToggle && newSplitId) {
      appState.transactions.forEach(t => {
        if (t.splitId === newSplitId) delete t.peerLoanId;
      });
    }
  }

  currentEditReceipt = null;
  renderReceiptPreview('edit');
  await saveStateToEncryptedStorage();
  closeEditModal();
  updateOverview();
}

window.toggleEditSplitPayment = toggleEditSplitPayment;
window.toggleEditLoanFields = toggleEditLoanFields;
window.addEditSplitRow = addEditSplitRow;
window.removeEditSplitRow = removeEditSplitRow;
window.onEditSplitAccountChange = onEditSplitAccountChange;
window.onEditSplitAmountInput = onEditSplitAmountInput;
window.onEditSplitTypeChange = onEditSplitTypeChange;
window.onEditSplitPersonInput = onEditSplitPersonInput;
window.onExpenseSplitTypeChange = onExpenseSplitTypeChange;
window.onExpenseSplitPersonInput = onExpenseSplitPersonInput;
window.onIncomeSplitTypeChange = onIncomeSplitTypeChange;
window.onIncomeSplitPersonInput = onIncomeSplitPersonInput;
window.resetExpenseFormState = resetExpenseFormState;
window.resetIncomeFormState = resetIncomeFormState;

async function deleteTransaction(txId) {
  const idx = appState.transactions.findIndex(t => t.id === txId);
  if (idx !== -1) {
    const deleted = appState.transactions.splice(idx, 1)[0];

    // Auch dazu gehörende Leihgaben (geliehenes / verliehenes Geld) automatisch löschen
    ensurePeerLoansInitialized();
    if (appState.peerLoans && Array.isArray(appState.peerLoans)) {
      const beforeCount = appState.peerLoans.length;
      appState.peerLoans = appState.peerLoans.filter(l => {
        // 1. Direkt per txId verknüpft
        if (l.txId && l.txId === txId) return false;
        // 2. Per peerLoanId auf der Buchung verknüpft
        if (deleted.peerLoanId && l.id === deleted.peerLoanId) return false;
        // 3. Wenn Buchung Teil eines Splits mit Leihgabe war
        if (deleted.splitId && l.txId && l.txId.startsWith('tx_') && l.splitId === deleted.splitId) return false;
        return true;
      });

      // Auch falls diese Buchung eine Teilrückzahlung einer Leihgabe war, diese entfernen & Stand aktualisieren
      appState.peerLoans.forEach(l => {
        if (Array.isArray(l.repayments)) {
          const repIdx = l.repayments.findIndex(r => r.txId === txId);
          if (repIdx !== -1) {
            l.repayments.splice(repIdx, 1);
            l.paidAmount = l.repayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
            if (l.paidAmount < Number(l.amount || 0)) {
              l.settled = false;
              l.settledDate = null;
            }
          }
        }
      });
    }

    await saveStateToEncryptedStorage();
    updateOverview();
    announceNVDA(`Buchung über ${formatCurrency(deleted.amount)} und zugehörige Leihgaben gelöscht.`);
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

// 13. KAUF-PLANER & SIMULATOR (Entfernt in v6.8.0)

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
    const expAmount = document.getElementById('exp-amount');
    if (!expAmount || !expAmount.value) {
      resetExpenseFormState();
    }
    const expDate = document.getElementById('exp-date');
    if (expDate && !expDate.value) expDate.value = new Date().toISOString().split('T')[0];
    if (expAmount) expAmount.focus();
    announceNVDA('Ausgabe eintragen geöffnet.');
  } else if (viewName === 'income') {
    populateCategoriesDropdowns();
    populateAllAccountDropdowns();
    onMainCategoryChange('inc');
    const incAmount = document.getElementById('inc-amount');
    if (!incAmount || !incAmount.value) {
      resetIncomeFormState();
    }
    const incDate = document.getElementById('inc-date');
    if (incDate && !incDate.value) incDate.value = new Date().toISOString().split('T')[0];
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

let isUnlockingVault = false;

async function unlockVaultWithPin(enteredPin, isFromBio = false) {
  if (!enteredPin) return false;
  if (isUnlockingVault) return false;

  if (checkLockoutStatus()) {
    announceNVDA('Zugriff gesperrt wegen zu vieler Fehlversuche.', true);
    return false;
  }

  isUnlockingVault = true;
  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error-msg');
  const btnUnlock = document.getElementById('btn-unlock');

  if (btnUnlock) btnUnlock.disabled = true;

  try {
    let storedData = localStorage.getItem(STORAGE_DATA_KEY);
    let saltBase64 = localStorage.getItem(STORAGE_SALT_KEY) || currentSaltBase64;

    if (window.__DISK_VAULT__ && window.__DISK_VAULT__.vault && window.__DISK_VAULT__.salt) {
      storedData = window.__DISK_VAULT__.vault;
      saltBase64 = window.__DISK_VAULT__.salt;
    }

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
      if (pinInput) pinInput.value = '';
      if (errorMsg) errorMsg.style.display = 'none';

      try {
        unlockApp();
      } catch (uiErr) {
        console.error('Fehler beim Initialisieren der App-Oberfläche:', uiErr);
      }
      announceNVDA('Neuer Datensafe erfolgreich eingerichtet.');
      return true;
    }

    // Vorhandenen Datensafe entsperren
    currentSaltBase64 = saltBase64;
    const saltBuffer = base64ToArrayBuffer(saltBase64);
    const salt = new Uint8Array(saltBuffer);
    
    let decrypted = null;
    let healedFrom1234 = false;

    // Nur das Entschlüsseln mit der eingegebenen PIN entscheidet über die Richtigkeit
    try {
      const key = await deriveKey(enteredPin, salt);
      decrypted = await decryptData(storedData, key);
      cryptoKey = key;
    } catch (decryptErr) {
      // PIN ist tatsächlich falsch!
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

    // Hier ist sichergestellt: PIN ist KORREKT und Entschlüsselung war ERFOLGREICH!
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

    try {
      unlockApp();
    } catch (uiErr) {
      console.error('Fehler beim Initialisieren der App-Oberfläche nach Entsperren:', uiErr);
    }

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

  } finally {
    isUnlockingVault = false;
    if (btnUnlock) btnUnlock.disabled = false;
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

    // 5. Asynchrones E2E-Postfach im Hintergrund versiegeln und hinterlegen
    if (typeof SyncEngine !== 'undefined' && typeof SyncEngine.scheduleMailboxPush === 'function') {
      SyncEngine.scheduleMailboxPush();
    }

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

  // Asynchrones E2E-Postfach beim Entsperren prüfen
  if (typeof SyncEngine !== 'undefined') {
    if (typeof SyncEngine.startMailboxListener === 'function') {
      SyncEngine.startMailboxListener();
    }
    if (typeof SyncEngine.checkMailbox === 'function') {
      SyncEngine.checkMailbox(null, false).catch(() => {});
    }
  }

  let pending = window.__PENDING_SYNC_DATA__;
  if (!pending) {
    try {
      const storedPending = localStorage.getItem('haushaltsbuch_pending_sync_data');
      if (storedPending) pending = JSON.parse(storedPending);
    } catch(e) {}
  }
  if (pending && typeof SyncEngine !== 'undefined') {
    window.__PENDING_SYNC_DATA__ = null;
    try { localStorage.removeItem('haushaltsbuch_pending_sync_data'); } catch(e) {}
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
  const sectionCredit = document.getElementById('section-credit-container');
  if (!container) return;

  const plans = (appState.recurring || []).filter(r => r.isInstallment && r.active);
  const totalRemaining = plans.reduce((sum, p) => sum + Number(p.installmentRemaining || 0), 0);

  if (plans.length === 0) {
    if (sectionCredit) sectionCredit.style.display = 'none';
    if (subText) subText.textContent = '0 aktive Kredite & Raten';
    if (monthCreditEl) monthCreditEl.textContent = '0,00 € Rest';
    container.innerHTML = '<p class="empty-state" style="padding: 10px; color: var(--text-muted, #666);">Aktuell keine laufenden Kredite oder Ratenkäufe vorhanden.</p>';
    return;
  }

  if (sectionCredit) sectionCredit.style.display = '';
  if (subText) subText.textContent = `${plans.length} aktive Kredite & Raten`;
  if (monthCreditEl) monthCreditEl.textContent = formatCurrency(totalRemaining) + ' Rest';

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

// ============================================================================
// 1f. GELIEHENES & VERLIEHENES GELD (PEER LOANS & SCHULDEN)
// ============================================================================

function ensurePeerLoansInitialized() {
  if (!appState.peerLoans || !Array.isArray(appState.peerLoans)) {
    appState.peerLoans = [];
  }
}

function renderOverviewPeerLoans() {
  ensurePeerLoansInitialized();
  const secPeer = document.getElementById('section-peer-loans-container');
  const container = document.getElementById('overview-peer-loans-feed');
  const subText = document.getElementById('peer-loans-summary-subtext');
  const totalEl = document.getElementById('card-month-peer-loans');
  if (!container) return;

  const activeLoans = (appState.peerLoans || []).filter(l => !l.settled);

  // Verstecken, wenn keine offenen Leihgaben vorhanden sind (so wie bei Krediten & Umbuchungen)
  if (activeLoans.length === 0) {
    if (secPeer) secPeer.style.display = 'none';
    container.innerHTML = '<p class="empty-state" style="padding: 10px; color: var(--text-muted, #666);">Aktuell keine offenen geliehenen oder verliehenen Beträge vorhanden.</p>';
    if (subText) subText.textContent = '0 offene Einträge';
    if (totalEl) totalEl.textContent = '0,00 €';
    return;
  }

  if (secPeer) secPeer.style.display = '';

  let lentRemainingTotal = 0;
  let borrowedRemainingTotal = 0;

  activeLoans.forEach(l => {
    const rem = Math.max(0, Number(l.amount || 0) - Number(l.paidAmount || 0));
    if (l.type === 'lent') {
      lentRemainingTotal += rem;
    } else {
      borrowedRemainingTotal += rem;
    }
  });

  const net = lentRemainingTotal - borrowedRemainingTotal;
  if (totalEl) {
    if (net > 0) {
      totalEl.textContent = `+ ${formatCurrency(net)} Forderung`;
      totalEl.style.color = 'var(--accent-income, #2E7D32)';
    } else if (net < 0) {
      totalEl.textContent = `- ${formatCurrency(Math.abs(net))} Verbindlichkeit`;
      totalEl.style.color = '#D32F2F';
    } else {
      totalEl.textContent = '0,00 € ausgeglichen';
      totalEl.style.color = '#8E24AA';
    }
  }

  if (subText) {
    subText.textContent = `${activeLoans.length} offene Leihgabe(n) (Verliehen: ${formatCurrency(lentRemainingTotal)} | Geliehen: ${formatCurrency(borrowedRemainingTotal)})`;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
  activeLoans.forEach(loan => {
    const isLent = loan.type === 'lent';
    const total = Number(loan.amount || 0);
    const paid = Number(loan.paidAmount || 0);
    const remaining = Math.max(0, total - paid);
    const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    const dateFormatted = formatDateGerman(loan.date);
    const typeLabel = isLent ? '🟢 Ich habe verliehen (Forderung / Mir wird geschuldet)' : '🔴 Ich habe mir geliehen (Verbindlichkeit / Ich schulde)';
    const typeColor = isLent ? '#2E7D32' : '#D32F2F';
    const dueDateNotice = loan.dueDate ? ` • 📅 Rückzahlung bis: <strong>${formatDateGerman(loan.dueDate)}</strong>` : '';
    const repaymentsList = Array.isArray(loan.repayments) && loan.repayments.length > 0;

    html += `
      <div style="background: var(--bg-hover, #f8f9fa); border: 2px solid ${isLent ? 'rgba(46,125,50,0.3)' : 'rgba(211,47,47,0.3)'}; border-left: 6px solid ${typeColor}; border-radius: 8px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
          <div>
            <div style="font-size: 13px; font-weight: bold; color: ${typeColor}; margin-bottom: 2px;">
              ${typeLabel}
            </div>
            <div style="font-size: 18px; font-weight: bold; color: var(--text-color);">
              👤 ${escapeHTML(loan.person || 'Unbekannt')}
            </div>
            <div style="font-size: 13px; color: var(--text-muted, #666); margin-top: 3px;">
              Ausgegeben / Erhalten am: <strong>${dateFormatted}</strong>${dueDateNotice}
              ${loan.note ? ` • <span style="font-style: italic;">„${escapeHTML(loan.note)}“</span>` : ''}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: var(--text-muted, #666);">Ursprünglich: ${formatCurrency(total)}</div>
            <div style="font-size: 19px; font-weight: bold; color: ${typeColor}; margin-top: 2px;">
              Offen: ${formatCurrency(remaining)}
            </div>
          </div>
        </div>

        ${paid > 0 ? `
          <div style="margin-top: 10px; background: rgba(0,0,0,0.03); padding: 8px; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted, #666); margin-bottom: 4px;">
              <span>Bereits zurückgezahlt: <strong>${formatCurrency(paid)}</strong> (${percent}%)</span>
              <span>Noch offen: <strong>${formatCurrency(remaining)}</strong></span>
            </div>
            <div style="background: #e0e0e0; border-radius: 4px; height: 8px; overflow: hidden;">
              <div style="width: ${percent}%; height: 100%; background: #4CAF50;"></div>
            </div>
          </div>
        ` : ''}

        ${repaymentsList ? `
          <details style="margin-top: 10px; background: rgba(0,0,0,0.02); border: 1px solid var(--border-color); border-radius: 6px; padding: 6px 10px;">
            <summary style="cursor: pointer; font-size: 13px; font-weight: bold; color: var(--text-color);">
              📋 Historie der Teilrückzahlungen (${loan.repayments.length}) anzeigen
            </summary>
            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
              ${loan.repayments.map(rep => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg, #fff); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border-color); font-size: 13px; flex-wrap: wrap; gap: 6px;">
                  <div>
                    <strong>${formatDateGerman(rep.date)}:</strong> <span style="font-weight: bold; color: ${isLent ? '#2E7D32' : '#D32F2F'};">${formatCurrency(rep.amount)}</span>
                    ${rep.account ? `<span style="color: var(--text-muted, #666); font-size: 12px;"> (${escapeHTML(formatAccountName(rep.account))})</span>` : ''}
                    ${rep.note ? `<div style="font-size: 12px; color: var(--text-muted, #666); font-style: italic;">„${escapeHTML(rep.note)}“</div>` : ''}
                  </div>
                  <div style="display: flex; gap: 6px;">
                    <button type="button" class="btn btn-secondary" onclick="openPeerLoanRepayModal('${loan.id}', '${rep.id}')" style="font-size: 12px; padding: 3px 8px;" aria-label="Rückzahlung vom ${formatDateGerman(rep.date)} über ${formatCurrency(rep.amount)} bearbeiten">
                      ✏️ Bearbeiten
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="deletePeerLoanRepayment('${loan.id}', '${rep.id}')" style="font-size: 12px; padding: 3px 8px; color: #D32F2F;" aria-label="Rückzahlung vom ${formatDateGerman(rep.date)} über ${formatCurrency(rep.amount)} löschen">
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </details>
        ` : ''}

        <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; align-items: center;">
          <button type="button" class="btn btn-primary" onclick="settlePeerLoan('${loan.id}')" style="background-color: #2E7D32; font-size: 13px; padding: 6px 14px;" aria-label="Leihgabe mit ${escapeHTML(loan.person)} über ${formatCurrency(remaining)} als vollständig zurückgezahlt markieren">
            ✅ Vollständig zurückgezahlt
          </button>
          <button type="button" class="btn btn-secondary" onclick="openPeerLoanRepayModal('${loan.id}')" style="font-size: 13px; padding: 6px 14px; border: 2px solid #8E24AA; color: #6A1B9A; font-weight: bold;" aria-label="Teilrückzahlung für ${escapeHTML(loan.person)} erfassen">
            💵 Teilrückzahlung
          </button>
          <button type="button" class="btn btn-secondary" onclick="openPeerLoanModal('${loan.id}')" style="font-size: 13px; padding: 6px 12px;" aria-label="Leihgabe mit ${escapeHTML(loan.person)} bearbeiten">
            ✏️ Bearbeiten
          </button>
          <button type="button" class="btn btn-secondary" onclick="deletePeerLoan('${loan.id}')" style="font-size: 13px; padding: 6px 12px; color: #D32F2F;" aria-label="Leihgabe mit ${escapeHTML(loan.person)} löschen">
            🗑️ Löschen
          </button>
        </div>
      </div>
    `;
  });

  const settledLoans = (appState.peerLoans || []).filter(l => l.settled);
  if (settledLoans.length > 0) {
    html += `
      <details style="margin-top: 14px; background: var(--bg-hover, #f8f9fa); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 14px;">
        <summary style="cursor: pointer; font-weight: bold; font-size: 14px; color: var(--text-color);">
          📦 Archiv: Bereits vollständig beglichene Leihgaben (${settledLoans.length})
        </summary>
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
          ${settledLoans.map(sl => {
            const slIsLent = sl.type === 'lent';
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg, #fff); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color); flex-wrap: wrap; gap: 6px;">
                <div>
                  <strong>👤 ${escapeHTML(sl.person || 'Unbekannt')}</strong>: ${formatCurrency(sl.amount)}
                  <span style="color: var(--text-muted, #666); font-size: 12px;">(${slIsLent ? '🟢 Verliehen' : '🔴 Geliehen'} • Beglichen: ${formatDateGerman(sl.settledDate || sl.date)})</span>
                  ${sl.note ? `<div style="font-size: 12px; color: var(--text-muted, #666); font-style: italic;">„${escapeHTML(sl.note)}“</div>` : ''}
                </div>
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="btn btn-secondary" onclick="reopenPeerLoan('${sl.id}')" style="font-size: 12px; padding: 4px 8px; border: 1px solid #8E24AA; color: #6A1B9A;" aria-label="Leihgabe mit ${escapeHTML(sl.person)} wieder öffnen">
                    ↩️ Wieder öffnen
                  </button>
                  <button type="button" class="btn btn-secondary" onclick="openPeerLoanModal('${sl.id}')" style="font-size: 12px; padding: 4px 8px;" aria-label="Leihgabe mit ${escapeHTML(sl.person)} bearbeiten">
                    ✏️ Bearbeiten
                  </button>
                  <button type="button" class="btn btn-secondary" onclick="deletePeerLoan('${sl.id}')" style="font-size: 12px; padding: 4px 8px; color: #D32F2F;" aria-label="Leihgabe mit ${escapeHTML(sl.person)} löschen">
                    🗑️ Löschen
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </details>
    `;
  }

  html += '</div>';
  container.innerHTML = html;
}

function populatePeerLoanAccountsDropdown(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  ensureAccountsInitialized();
  sel.innerHTML = (appState.accounts || []).map(acc => {
    return `<option value="${escapeHTML(acc.id)}">💳 ${escapeHTML(acc.name)}</option>`;
  }).join('');
}

function handlePeerLoanTypeChange() {
  const isLent = document.getElementById('peer-type-lent')?.checked;
  const lblLent = document.getElementById('lbl-peer-type-lent');
  const lblBorrowed = document.getElementById('lbl-peer-type-borrowed');
  const personLabel = document.getElementById('peer-loan-person-label');
  const autoBookText = document.getElementById('peer-loan-auto-book-text');

  if (lblLent) {
    lblLent.style.borderColor = isLent ? '#2E7D32' : 'var(--border-color)';
    lblLent.style.background = isLent ? 'rgba(46,125,50,0.08)' : 'transparent';
  }
  if (lblBorrowed) {
    lblBorrowed.style.borderColor = !isLent ? '#D32F2F' : 'var(--border-color)';
    lblBorrowed.style.background = !isLent ? 'rgba(211,47,47,0.08)' : 'transparent';
  }
  if (personLabel) {
    personLabel.textContent = isLent 
      ? 'An wen hast du das Geld geliehen? (Name):' 
      : 'Von wem hast du dir das Geld geliehen? (Name):';
  }
  if (autoBookText) {
    autoBookText.textContent = isLent
      ? 'Gleich als Geldausgang (Ausgabe) von diesem Konto buchen'
      : 'Gleich als Geldeingang (Einnahme) auf dieses Konto buchen';
  }
}

function setPeerLoanDateQuick(when) {
  const dateInput = document.getElementById('peer-loan-date');
  if (!dateInput) return;
  const now = new Date();
  if (when === 'yesterday') {
    now.setDate(now.getDate() - 1);
  }
  dateInput.value = now.toISOString().split('T')[0];
  announceNVDA(`Datum gesetzt auf: ${formatDateGerman(dateInput.value)}`);
}

function openPeerLoanModal(loanId = null, defaultType = null) {
  ensurePeerLoansInitialized();
  const modal = document.getElementById('peer-loan-modal');
  if (!modal) return;

  populatePeerLoanAccountsDropdown('peer-loan-account');

  const editIdInput = document.getElementById('peer-loan-edit-id');
  const personInput = document.getElementById('peer-loan-person');
  const amountInput = document.getElementById('peer-loan-amount');
  const dateInput = document.getElementById('peer-loan-date');
  const dueDateInput = document.getElementById('peer-loan-due-date');
  const accountSelect = document.getElementById('peer-loan-account');
  const autoBookChk = document.getElementById('peer-loan-auto-book');
  const noteInput = document.getElementById('peer-loan-note');
  const heading = document.getElementById('peer-loan-heading');
  const saveBtn = document.getElementById('btn-save-peer-loan');

  if (loanId) {
    const loan = appState.peerLoans.find(l => l.id === loanId);
    if (!loan) return;

    if (editIdInput) editIdInput.value = loan.id;
    if (heading) heading.textContent = '✏️ Leihgabe bearbeiten';
    if (saveBtn) saveBtn.textContent = '💾 Änderungen speichern';
    const typeRadio = document.querySelector(`input[name="peer-loan-type"][value="${loan.type}"]`);
    if (typeRadio) typeRadio.checked = true;
    if (personInput) personInput.value = loan.person || '';
    if (amountInput) amountInput.value = Number(loan.amount || 0).toFixed(2);
    if (dateInput) dateInput.value = loan.date || new Date().toISOString().split('T')[0];
    if (dueDateInput) dueDateInput.value = loan.dueDate || '';
    if (accountSelect && loan.account) accountSelect.value = loan.account;
    if (autoBookChk) {
      autoBookChk.checked = false;
      autoBookChk.disabled = true; // Bei Bearbeitung keine Doppelbuchung
    }
    if (noteInput) noteInput.value = loan.note || '';
  } else {
    if (editIdInput) editIdInput.value = '';
    if (heading) heading.textContent = '🤝 Geliehenes / Verliehenes Geld erfassen';
    if (saveBtn) saveBtn.textContent = '💾 Speichern';

    const useType = defaultType || 'lent';
    const typeRadio = document.querySelector(`input[name="peer-loan-type"][value="${useType}"]`);
    if (typeRadio) typeRadio.checked = true;

    // Falls aus Ausgabe- oder Einnahme-Ansicht geöffnet, Betrag & Konto übernehmen
    let prefilledAmt = '';
    let prefilledAcc = '';
    if (useType === 'lent') {
      const expAmt = document.getElementById('exp-amount')?.value;
      if (expAmt && parseFloat(expAmt) > 0) prefilledAmt = parseFloat(expAmt).toFixed(2);
      const expAcc = document.getElementById('exp-account')?.value;
      if (expAcc) prefilledAcc = expAcc;
    } else if (useType === 'borrowed') {
      const incAmt = document.getElementById('inc-amount')?.value;
      if (incAmt && parseFloat(incAmt) > 0) prefilledAmt = parseFloat(incAmt).toFixed(2);
      const incAcc = document.getElementById('inc-account')?.value;
      if (incAcc) prefilledAcc = incAcc;
    }

    if (personInput) personInput.value = '';
    if (amountInput) amountInput.value = prefilledAmt;
    if (accountSelect && prefilledAcc) accountSelect.value = prefilledAcc;
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (dueDateInput) dueDateInput.value = '';
    if (autoBookChk) {
      autoBookChk.checked = true;
      autoBookChk.disabled = false;
    }
    if (noteInput) noteInput.value = '';
  }

  handlePeerLoanTypeChange();
  modal.style.display = 'flex';
  if (personInput) personInput.focus();
}

function closePeerLoanModal() {
  const modal = document.getElementById('peer-loan-modal');
  if (!modal) return;
  modal.style.display = 'none';
}

async function handleSavePeerLoan(e) {
  if (e && e.preventDefault) e.preventDefault();
  ensurePeerLoansInitialized();

  const editId = document.getElementById('peer-loan-edit-id')?.value;
  const isLent = document.getElementById('peer-type-lent')?.checked;
  const type = isLent ? 'lent' : 'borrowed';
  const person = document.getElementById('peer-loan-person')?.value.trim();
  const amount = parseFloat(document.getElementById('peer-loan-amount')?.value);
  const date = document.getElementById('peer-loan-date')?.value || new Date().toISOString().split('T')[0];
  const dueDate = document.getElementById('peer-loan-due-date')?.value || '';
  const account = document.getElementById('peer-loan-account')?.value || '';
  const autoBook = document.getElementById('peer-loan-auto-book')?.checked;
  const note = document.getElementById('peer-loan-note')?.value.trim() || '';

  if (!person) {
    alert('Bitte gib den Namen der Person ein.');
    return;
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    alert('Bitte gib einen gültigen Geldbetrag größer als 0 ein.');
    return;
  }

  let txId = null;

  if (editId) {
    const loan = appState.peerLoans.find(l => l.id === editId);
    if (loan) {
      loan.type = type;
      loan.person = person;
      loan.amount = amount;
      loan.date = date;
      loan.dueDate = dueDate;
      loan.account = account;
      loan.note = note;
      loan.updatedAt = Date.now();

      // Status neu prüfen falls Betrag angepasst wurde
      if (Number(loan.paidAmount || 0) >= amount) {
        loan.settled = true;
      } else {
        loan.settled = false;
        loan.settledDate = null;
      }

      // Falls verknüpfte Buchung vorhanden ist, diese auch aktualisieren
      if (loan.txId) {
        const linkedTx = appState.transactions.find(t => t.id === loan.txId);
        if (linkedTx) {
          linkedTx.amount = amount;
          linkedTx.date = date;
          if (account) linkedTx.account = account;
          linkedTx.type = type === 'lent' ? 'expense' : 'income';
          linkedTx.category = type === 'lent' ? 'Privat & Familie' : 'Sonstige Einnahmen';
          linkedTx.subCategory = type === 'lent' ? 'Geld verliehen (an Freunde / Familie)' : 'Geld geliehen (von Freunden / Familie)';
          linkedTx.description = type === 'lent' 
            ? `Verliehen an ${person}${note ? ' (' + note + ')' : ''}`
            : `Geliehen von ${person}${note ? ' (' + note + ')' : ''}`;
        }
      }
    }
  } else {
    // Wenn autoBook aktiv ist, buchen wir sofort eine reale Transaktion
    if (autoBook && account) {
      txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      if (type === 'lent') {
        appState.transactions.push({
          id: txId,
          type: 'expense',
          amount: amount,
          date: date,
          account: account,
          category: 'Privat & Familie',
          subcategory: 'Geld verliehen (an Freunde / Familie)',
          description: `Verliehen an ${person}${note ? ' (' + note + ')' : ''}`,
          isPlanned: false,
          isRecurring: false
        });
      } else {
        appState.transactions.push({
          id: txId,
          type: 'income',
          amount: amount,
          date: date,
          account: account,
          category: 'Sonstige Einnahmen',
          subcategory: 'Geld geliehen (von Freunden / Familie)',
          description: `Geliehen von ${person}${note ? ' (' + note + ')' : ''}`,
          isPlanned: false,
          isRecurring: false
        });
      }
    }

    const newLoan = {
      id: 'loan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      type: type,
      person: person,
      amount: amount,
      paidAmount: 0,
      date: date,
      dueDate: dueDate,
      account: account,
      autoBooked: Boolean(autoBook),
      txId: txId,
      note: note,
      settled: false,
      settledDate: null,
      repayments: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    appState.peerLoans.push(newLoan);
  }

  await saveStateToEncryptedStorage();
  closePeerLoanModal();
  updateOverview();

  const msg = editId 
    ? `Änderungen für ${person} erfolgreich gespeichert.`
    : (isLent 
        ? `Verliehenes Geld an ${person} über ${formatCurrency(amount)} gespeichert.`
        : `Geliehenes Geld von ${person} über ${formatCurrency(amount)} gespeichert.`);
  announceNVDA(msg);
}

let activeRepayLoanId = null;

function openPeerLoanRepayModal(loanId, repayItemId = null) {
  ensurePeerLoansInitialized();
  const loan = appState.peerLoans.find(l => l.id === loanId);
  if (!loan) return;

  activeRepayLoanId = loanId;
  const modal = document.getElementById('peer-loan-repay-modal');
  if (!modal) return;

  populatePeerLoanAccountsDropdown('peer-loan-repay-account');

  const headingEl = document.getElementById('peer-loan-repay-heading');
  const infoEl = document.getElementById('peer-loan-repay-info');
  const repayIdInput = document.getElementById('peer-loan-repay-id');
  const repayItemInput = document.getElementById('peer-loan-repay-item-id');
  const amountInput = document.getElementById('peer-loan-repay-amount');
  const dateInput = document.getElementById('peer-loan-repay-date');
  const accountSelect = document.getElementById('peer-loan-repay-account');
  const noteInput = document.getElementById('peer-loan-repay-note');
  const autoBookChk = document.getElementById('peer-loan-repay-auto-book');
  const autoBookText = document.getElementById('peer-loan-repay-auto-book-text');
  const submitBtn = document.getElementById('peer-loan-repay-submit-btn');

  const total = Number(loan.amount || 0);
  const paid = Number(loan.paidAmount || 0);
  const remaining = Math.max(0, total - paid);
  const isLent = loan.type === 'lent';

  if (repayIdInput) repayIdInput.value = loan.id;

  if (repayItemId && Array.isArray(loan.repayments)) {
    // Bearbeitung einer bestehenden Teilrückzahlung
    const rep = loan.repayments.find(r => r.id === repayItemId);
    if (!rep) return;

    if (repayItemInput) repayItemInput.value = rep.id;
    if (headingEl) headingEl.textContent = '✏️ Teilrückzahlung bearbeiten';
    if (submitBtn) submitBtn.textContent = '💾 Änderungen speichern';
    if (amountInput) {
      amountInput.value = Number(rep.amount || 0).toFixed(2);
      amountInput.removeAttribute('max');
    }
    if (dateInput) dateInput.value = rep.date || new Date().toISOString().split('T')[0];
    if (accountSelect && rep.account) accountSelect.value = rep.account;
    if (noteInput) noteInput.value = rep.note || '';
    if (autoBookChk) {
      autoBookChk.checked = Boolean(rep.txId);
      autoBookChk.disabled = true; // Buchungsverknüpfung bleibt synchron
    }
    if (autoBookText) {
      autoBookText.textContent = rep.txId 
        ? 'Verknüpfte Buchung auf dem Konto wird automatisch aktualisiert'
        : 'Keine direkte Kontobuchung verknüpft';
    }

    if (infoEl) {
      infoEl.innerHTML = `
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
          👤 ${escapeHTML(loan.person)} – Teilrückzahlung bearbeiten
        </div>
        <div style="font-size: 13px; color: var(--text-color);">
          Gesamtbetrag: <strong>${formatCurrency(total)}</strong> • Bisher erfasster Teilbetrag: <strong>${formatCurrency(rep.amount)}</strong>
        </div>
      `;
    }
  } else {
    // Neue Teilrückzahlung erfassen
    if (repayItemInput) repayItemInput.value = '';
    if (headingEl) headingEl.textContent = '💵 Teilrückzahlung verbuchen';
    if (submitBtn) submitBtn.textContent = '✅ Rückzahlung buchen';
    if (amountInput) {
      amountInput.value = remaining > 0 ? remaining.toFixed(2) : '';
      amountInput.max = remaining > 0 ? remaining.toFixed(2) : '';
    }
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (noteInput) noteInput.value = '';
    if (autoBookChk) {
      autoBookChk.checked = true;
      autoBookChk.disabled = false;
    }
    if (autoBookText) {
      autoBookText.textContent = isLent
        ? 'Gleich als Einnahme (Rückzahlung erhalten) auf dieses Konto buchen'
        : 'Gleich als Ausgabe (Schuld zurückgezahlt) von diesem Konto buchen';
    }

    if (infoEl) {
      infoEl.innerHTML = `
        <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">
          👤 ${escapeHTML(loan.person)} – ${isLent ? '🟢 Hat sich Geld geliehen' : '🔴 Du hast dir Geld geliehen'}
        </div>
        <div style="font-size: 13px; color: var(--text-color);">
          Ursprünglich: <strong>${formatCurrency(total)}</strong> • Bereits zurückgezahlt: <strong>${formatCurrency(paid)}</strong>
        </div>
        <div style="font-size: 17px; font-weight: bold; color: ${isLent ? '#2E7D32' : '#D32F2F'}; margin-top: 4px;">
          Aktuell noch offen: ${formatCurrency(remaining)}
        </div>
      `;
    }
  }

  modal.style.display = 'flex';
  if (amountInput) amountInput.focus();
}

function closePeerLoanRepayModal() {
  const modal = document.getElementById('peer-loan-repay-modal');
  if (modal) modal.style.display = 'none';
  activeRepayLoanId = null;
}

function setPeerLoanRepayFull() {
  ensurePeerLoansInitialized();
  if (!activeRepayLoanId) return;
  const loan = appState.peerLoans.find(l => l.id === activeRepayLoanId);
  if (!loan) return;
  const remaining = Math.max(0, Number(loan.amount || 0) - Number(loan.paidAmount || 0));
  const amountInput = document.getElementById('peer-loan-repay-amount');
  if (amountInput) amountInput.value = remaining.toFixed(2);
}

async function handleConfirmPeerLoanRepay(e) {
  if (e && e.preventDefault) e.preventDefault();
  ensurePeerLoansInitialized();

  const loanId = document.getElementById('peer-loan-repay-id')?.value || activeRepayLoanId;
  const repayItemId = document.getElementById('peer-loan-repay-item-id')?.value;
  const loan = appState.peerLoans.find(l => l.id === loanId);
  if (!loan) return;

  const repayAmount = parseFloat(document.getElementById('peer-loan-repay-amount')?.value);
  const repayDate = document.getElementById('peer-loan-repay-date')?.value || new Date().toISOString().split('T')[0];
  const repayAccount = document.getElementById('peer-loan-repay-account')?.value || '';
  const autoBook = document.getElementById('peer-loan-repay-auto-book')?.checked;
  const repayNote = document.getElementById('peer-loan-repay-note')?.value.trim() || '';

  if (!repayAmount || isNaN(repayAmount) || repayAmount <= 0) {
    alert('Bitte gib einen gültigen Rückzahlungsbetrag größer als 0 ein.');
    return;
  }

  if (repayItemId && Array.isArray(loan.repayments)) {
    // Bearbeitung einer bestehenden Rückzahlung
    const rep = loan.repayments.find(r => r.id === repayItemId);
    if (!rep) return;

    const diff = repayAmount - Number(rep.amount || 0);
    rep.amount = repayAmount;
    rep.date = repayDate;
    rep.account = repayAccount;
    rep.note = repayNote;

    loan.paidAmount = Math.max(0, Number(loan.paidAmount || 0) + diff);
    if (loan.paidAmount >= Number(loan.amount || 0)) {
      loan.settled = true;
      loan.settledDate = repayDate;
    } else {
      loan.settled = false;
      loan.settledDate = null;
    }
    loan.updatedAt = Date.now();

    // Verknüpfte Buchung synchronisieren falls vorhanden
    if (rep.txId) {
      const linkedTx = appState.transactions.find(t => t.id === rep.txId);
      if (linkedTx) {
        linkedTx.amount = repayAmount;
        linkedTx.date = repayDate;
        if (repayAccount) linkedTx.account = repayAccount;
        linkedTx.description = loan.type === 'lent'
          ? `Rückzahlung von ${loan.person}${repayNote ? ' (' + repayNote + ')' : ''}`
          : `Rückzahlung an ${loan.person}${repayNote ? ' (' + repayNote + ')' : ''}`;
      }
    }

    await saveStateToEncryptedStorage();
    closePeerLoanRepayModal();
    updateOverview();
    announceNVDA(`Rückzahlung über ${formatCurrency(repayAmount)} für ${loan.person} erfolgreich aktualisiert.`);
    return;
  }

  // Neue Rückzahlung verbuchen
  const remainingBefore = Math.max(0, Number(loan.amount || 0) - Number(loan.paidAmount || 0));
  if (repayAmount > remainingBefore + 0.01) {
    if (!confirm(`Der eingegebene Betrag (${formatCurrency(repayAmount)}) ist höher als die offene Restschuld (${formatCurrency(remainingBefore)}). Möchtest du ihn trotzdem so buchen?`)) {
      return;
    }
  }

  let txId = null;
  if (autoBook && repayAccount) {
    txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    if (loan.type === 'lent') {
      // Einnahme: Freund zahlt Geld an mich zurück
      appState.transactions.push({
        id: txId,
        type: 'income',
        amount: repayAmount,
        date: repayDate,
        account: repayAccount,
        category: 'Sonstige Einnahmen',
        subcategory: 'Rückzahlung von geliehenem Geld (Freunde / Familie)',
        description: `Rückzahlung von ${loan.person}${repayNote ? ' (' + repayNote + ')' : ''}`,
        isPlanned: false,
        isRecurring: false
      });
    } else {
      // Ausgabe: Ich zahle geliehenes Geld an Freund zurück
      appState.transactions.push({
        id: txId,
        type: 'expense',
        amount: repayAmount,
        date: repayDate,
        account: repayAccount,
        category: 'Privat & Familie',
        subcategory: 'Rückzahlung geliehenes Geld',
        description: `Rückzahlung an ${loan.person}${repayNote ? ' (' + repayNote + ')' : ''}`,
        isPlanned: false,
        isRecurring: false
      });
    }
  }

  if (!Array.isArray(loan.repayments)) loan.repayments = [];
  loan.repayments.push({
    id: 'repay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    amount: repayAmount,
    date: repayDate,
    account: repayAccount,
    note: repayNote,
    txId: txId
  });

  loan.paidAmount = Number(loan.paidAmount || 0) + repayAmount;
  if (loan.paidAmount >= Number(loan.amount || 0)) {
    loan.settled = true;
    loan.settledDate = repayDate;
  }
  loan.updatedAt = Date.now();

  await saveStateToEncryptedStorage();
  closePeerLoanRepayModal();
  updateOverview();

  const isComplete = loan.settled;
  const msg = isComplete
    ? `Rückzahlung über ${formatCurrency(repayAmount)} verbucht. Die Leihgabe mit ${loan.person} ist nun vollständig beglichen!`
    : `Rückzahlung über ${formatCurrency(repayAmount)} von ${loan.person} verbucht. Neuer Restbetrag: ${formatCurrency(Math.max(0, loan.amount - loan.paidAmount))}.`;
  announceNVDA(msg);
}

async function deletePeerLoanRepayment(loanId, repayItemId) {
  ensurePeerLoansInitialized();
  const loan = appState.peerLoans.find(l => l.id === loanId);
  if (!loan || !Array.isArray(loan.repayments)) return;
  const repIdx = loan.repayments.findIndex(r => r.id === repayItemId);
  if (repIdx === -1) return;
  const rep = loan.repayments[repIdx];

  if (!confirm(`Möchtest du diese Teilrückzahlung über ${formatCurrency(rep.amount)} vom ${formatDateGerman(rep.date)} wirklich löschen?`)) {
    return;
  }

  // Falls verknüpfte Buchung existiert, diese auch löschen
  if (rep.txId) {
    appState.transactions = appState.transactions.filter(t => t.id !== rep.txId);
  }

  loan.paidAmount = Math.max(0, Number(loan.paidAmount || 0) - Number(rep.amount || 0));
  if (loan.paidAmount < Number(loan.amount || 0)) {
    loan.settled = false;
    loan.settledDate = null;
  }
  loan.repayments.splice(repIdx, 1);
  loan.updatedAt = Date.now();

  await saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Rückzahlung über ${formatCurrency(rep.amount)} gelöscht. Neuer Restbetrag: ${formatCurrency(Math.max(0, loan.amount - loan.paidAmount))}.`);
}

async function reopenPeerLoan(loanId) {
  ensurePeerLoansInitialized();
  const loan = appState.peerLoans.find(l => l.id === loanId);
  if (!loan) return;

  loan.settled = false;
  loan.settledDate = null;
  if (Array.isArray(loan.repayments) && loan.repayments.length > 0) {
    loan.paidAmount = loan.repayments.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  } else {
    loan.paidAmount = 0;
  }
  loan.updatedAt = Date.now();

  await saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Leihgabe mit ${loan.person} wieder geöffnet.`);
}

async function settlePeerLoan(loanId) {
  ensurePeerLoansInitialized();
  const loan = appState.peerLoans.find(l => l.id === loanId);
  if (!loan) return;

  const remaining = Math.max(0, Number(loan.amount || 0) - Number(loan.paidAmount || 0));
  const isLent = loan.type === 'lent';

  const confirmMsg = isLent
    ? `Möchtest du die Leihgabe mit "${loan.person}" über noch offene ${formatCurrency(remaining)} als VOLLSTÄNDIG zurückgezahlt abhaken?`
    : `Möchtest du deine Schuld bei "${loan.person}" über noch offene ${formatCurrency(remaining)} als VOLLSTÄNDIG zurückgezahlt abhaken?`;

  if (!confirm(confirmMsg)) return;

  const todayStr = new Date().toISOString().split('T')[0];

  const bookAccount = remaining > 0 && confirm(`Soll der Restbetrag von ${formatCurrency(remaining)} auch als ${isLent ? 'Geldeingang (Einnahme)' : 'Geldausgang (Ausgabe)'} auf dein Konto gebucht werden?`);
  if (bookAccount) {
    const acc = loan.account || (appState.accounts && appState.accounts[0] ? appState.accounts[0].id : 'bank');
    const txId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    if (isLent) {
      appState.transactions.push({
        id: txId,
        type: 'income',
        amount: remaining,
        date: todayStr,
        account: acc,
        category: 'Sonstige Einnahmen',
        subcategory: 'Rückzahlung von geliehenem Geld (Freunde / Familie)',
        description: `Vollständige Rückzahlung von ${loan.person}`,
        isPlanned: false,
        isRecurring: false
      });
    } else {
      appState.transactions.push({
        id: txId,
        type: 'expense',
        amount: remaining,
        date: todayStr,
        account: acc,
        category: 'Privat & Familie',
        subcategory: 'Rückzahlung geliehenes Geld',
        description: `Vollständige Rückzahlung an ${loan.person}`,
        isPlanned: false,
        isRecurring: false
      });
    }
  }

  loan.paidAmount = loan.amount;
  loan.settled = true;
  loan.settledDate = todayStr;
  loan.updatedAt = Date.now();

  await saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Leihgabe mit ${loan.person} als vollständig zurückgezahlt markiert.`);
}

async function deletePeerLoan(loanId) {
  ensurePeerLoansInitialized();
  const loan = appState.peerLoans.find(l => l.id === loanId);
  if (!loan) return;

  if (!confirm(`Möchtest du den Eintrag für "${loan.person}" über ${formatCurrency(loan.amount)} wirklich löschen?`)) {
    return;
  }

  // Verknüpfte Buchungen entfernen falls vorhanden
  const txIdsToDelete = new Set();
  if (loan.txId) txIdsToDelete.add(loan.txId);
  if (Array.isArray(loan.repayments)) {
    loan.repayments.forEach(r => { if (r.txId) txIdsToDelete.add(r.txId); });
  }
  if (txIdsToDelete.size > 0) {
    if (confirm(`Sollen auch die ${txIdsToDelete.size} verknüpfte(n) Buchung(en) auf deinen Konten gelöscht werden?`)) {
      appState.transactions = appState.transactions.filter(t => !txIdsToDelete.has(t.id));
    }
  }

  appState.peerLoans = appState.peerLoans.filter(l => l.id !== loanId);
  await saveStateToEncryptedStorage();
  updateOverview();
  announceNVDA(`Eintrag für ${loan.person} gelöscht.`);
}

// Global functions attached to window for inline HTML onclick handlers
window.openPeerLoanModal = openPeerLoanModal;
window.closePeerLoanModal = closePeerLoanModal;
window.handlePeerLoanTypeChange = handlePeerLoanTypeChange;
window.setPeerLoanDateQuick = setPeerLoanDateQuick;
window.handleSavePeerLoan = handleSavePeerLoan;
window.openPeerLoanRepayModal = openPeerLoanRepayModal;
window.closePeerLoanRepayModal = closePeerLoanRepayModal;
window.setPeerLoanRepayFull = setPeerLoanRepayFull;
window.handleConfirmPeerLoanRepay = handleConfirmPeerLoanRepay;
window.deletePeerLoanRepayment = deletePeerLoanRepayment;
window.reopenPeerLoan = reopenPeerLoan;
window.settlePeerLoan = settlePeerLoan;
window.deletePeerLoan = deletePeerLoan;
window.toggleExpenseLoanFields = toggleExpenseLoanFields;
window.toggleIncomeLoanFields = toggleIncomeLoanFields;
window.openQuickCategoryModal = openQuickCategoryModal;
window.closeQuickCategoryModal = closeQuickCategoryModal;
window.onQuickCatTypeChange = onQuickCatTypeChange;
window.onQuickCatModeChange = onQuickCatModeChange;
window.handleQuickAddCategorySubmit = handleQuickAddCategorySubmit;
window.syncCategoriesFromGitHub = syncCategoriesFromGitHub;
window.initCloudCategoriesSync = initCloudCategoriesSync;


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

// ----------------------------------------------------------------------------
// GLOBALE SUCHE, FILTER & SORTIERUNG ENGINE FÜR BUCHUNGEN
// ----------------------------------------------------------------------------
let currentTxFilter = {
  query: '',
  status: 'all',
  account: 'all'
};

let currentTxSortOrder = 'date-desc';

function handleTxSearchFilterChange() {
  const qInput = document.getElementById('tx-search-query');
  const sSelect = document.getElementById('tx-filter-status');
  const aSelect = document.getElementById('tx-filter-account');
  const banner = document.getElementById('tx-search-results-banner');
  const bannerText = document.getElementById('tx-search-results-text');
  const clearBtn = document.getElementById('btn-clear-tx-search');

  currentTxFilter.query = qInput ? qInput.value.trim().toLowerCase() : '';
  currentTxFilter.status = sSelect ? sSelect.value : 'all';
  currentTxFilter.account = aSelect ? aSelect.value : 'all';

  if (clearBtn) clearBtn.style.display = currentTxFilter.query ? 'inline-block' : 'none';

  updateOverview();

  const isSearchActive = Boolean(currentTxFilter.query || currentTxFilter.status !== 'all' || currentTxFilter.account !== 'all');

  const feedExp = document.getElementById('overview-expense-items-feed');
  const countExp = feedExp ? feedExp.querySelectorAll('.tx-item, [role="listitem"]').length : 0;
  const feedInc = document.getElementById('overview-income-items-feed');
  const countInc = feedInc ? feedInc.querySelectorAll('.tx-item, [role="listitem"]').length : 0;
  const feedTrf = document.getElementById('overview-transfer-items-feed');
  const countTrf = feedTrf ? feedTrf.querySelectorAll('.tx-item, [role="listitem"]').length : 0;
  const totalHits = countExp + countInc + countTrf;

  const detExp = document.getElementById('details-expense-list');
  const detInc = document.getElementById('details-income-list');
  const detTrf = document.getElementById('details-transfer-list');

  if (isSearchActive) {
    if (detExp) detExp.open = countExp > 0;
    if (detInc) detInc.open = countInc > 0;
    if (detTrf) detTrf.open = countTrf > 0;

    if (banner && bannerText) {
      banner.style.display = 'flex';
      if (totalHits > 0) {
        bannerText.textContent = `🔍 ${totalHits} Treffer gefunden (${countExp} Ausgaben, ${countInc} Einnahmen, ${countTrf} Umbuchungen).`;
      } else {
        bannerText.textContent = `⚠️ Keine Buchungen gefunden für "${currentTxFilter.query || 'aktuelle Filter'}".`;
      }
    }

    if (currentTxFilter.query && currentTxFilter.query.length >= 2) {
      if (totalHits > 0) {
        announceNVDA(`${totalHits} Buchungen für "${currentTxFilter.query}" gefunden (${countExp} Ausgaben, ${countInc} Einnahmen, ${countTrf} Umbuchungen). Listen geöffnet.`);
      } else {
        announceNVDA(`Keine Buchungen für "${currentTxFilter.query}" gefunden.`);
      }
    }
  } else {
    if (banner) banner.style.display = 'none';
    if (detExp) detExp.open = false;
    if (detInc) detInc.open = false;
    if (detTrf) detTrf.open = false;
  }
}

function handleTxSortChange() {
  const sel = document.getElementById('tx-sort-order');
  if (sel) {
    currentTxSortOrder = sel.value;
    const sortLabels = {
      'date-desc': 'Datum: Neueste zuerst (Neu bis Alt)',
      'date-asc': 'Datum: Älteste zuerst (Alt bis Neu)',
      'alpha-asc': 'Alphabetisch: A bis Z',
      'alpha-desc': 'Alphabetisch: Z bis A',
      'amount-desc': 'Betrag: Höchste zuerst (Groß bis Klein)',
      'amount-asc': 'Betrag: Niedrigste zuerst (Klein bis Groß)',
      'category-asc': 'Kategorie: Alphabetisch (A bis Z)'
    };
    announceNVDA(`Sortierung geändert auf: ${sortLabels[currentTxSortOrder] || currentTxSortOrder}`);
  }
  updateOverview();
}

function applyTxSorting(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    switch (currentTxSortOrder) {
      case 'date-asc':
        return (a.date || '').localeCompare(b.date || '');
      case 'alpha-asc': {
        const nameA = a.description || a.subcategory || a.category || '';
        const nameB = b.description || b.subcategory || b.category || '';
        return nameA.localeCompare(nameB, 'de', { sensitivity: 'base' });
      }
      case 'alpha-desc': {
        const nameA = a.description || a.subcategory || a.category || '';
        const nameB = b.description || b.subcategory || b.category || '';
        return nameB.localeCompare(nameA, 'de', { sensitivity: 'base' });
      }
      case 'amount-desc':
        return Number(b.amount || 0) - Number(a.amount || 0);
      case 'amount-asc':
        return Number(a.amount || 0) - Number(b.amount || 0);
      case 'category-asc': {
        const catA = a.category || '';
        const catB = b.category || '';
        return catA.localeCompare(catB, 'de', { sensitivity: 'base' });
      }
      case 'date-desc':
      default:
        return (b.date || '').localeCompare(a.date || '');
    }
  });
}

function applyTxFilters(list) {
  if (!Array.isArray(list)) return [];
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const monthNamesDe = ['januar', 'februar', 'maerz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
  const monthNamesRaw = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
  const weekdayNames = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];

  return list.filter(tx => {
    // 1. Super-Suche Engine
    if (currentTxFilter.query) {
      const rawQuery = currentTxFilter.query.trim().toLowerCase();
      const qTokens = rawQuery.split(/\s+/).filter(Boolean);

      const acc = (appState && appState.accounts) ? appState.accounts.find(a => a.id === tx.account) : null;
      const accName = acc ? acc.name : (tx.account || '');
      const fromAcc = (appState && appState.accounts) ? appState.accounts.find(a => a.id === tx.fromAccount) : null;
      const fromAccName = fromAcc ? fromAcc.name : (tx.fromAccount || '');
      const toAcc = (appState && appState.accounts) ? appState.accounts.find(a => a.id === tx.toAccount) : null;
      const toAccName = toAcc ? toAcc.name : (tx.toAccount || '');
      const txAmt = Number(tx.amount || 0);
      const amtStr = txAmt.toFixed(2);
      const amtGerman = amtStr.replace('.', ',');
      const amtNoDec = Math.round(txAmt).toString();

      // Date information
      let dateWords = [];
      if (tx.date) {
        dateWords.push(tx.date);
        const [y, m, d] = tx.date.split('-');
        if (y && m && d) {
          const mIdx = parseInt(m, 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            dateWords.push(monthNamesDe[mIdx], monthNamesRaw[mIdx]);
            dateWords.push(monthNamesRaw[mIdx].substring(0, 3), monthNamesDe[mIdx].substring(0, 3));
          }
          const dtObj = new Date(tx.date + 'T12:00:00');
          if (!isNaN(dtObj.getTime())) {
            dateWords.push(weekdayNames[dtObj.getDay()]);
          }
          dateWords.push(`${d}.${m}.${y}`, `${d}.${m}.`, `${d}.`);
        }
        if (tx.date === todayStr) dateWords.push('heute');
        if (tx.date === yesterdayStr) dateWords.push('gestern');
      }

      // Types & Tags
      let typeWords = [];
      if (tx.type === 'income') typeWords.push('einnahme', 'geld plus', 'einnahmen', 'habenseite');
      else if (tx.type === 'transfer') typeWords.push('umbuchung', 'transfer', 'sparen', 'verschieben', 'sparplan');
      else typeWords.push('ausgabe', 'ausgaben', 'minus', 'kosten');

      if (tx.isRecurring) typeWords.push('wiederkehrend', 'dauerauftrag', 'abo', 'fixkosten', 'vertrag', 'sparplan');
      else typeWords.push('einmalig', 'variabel');

      if (tx.isInstallment || (tx.description && (tx.description.includes('Rate') || tx.description.includes('Kredit')))) {
        typeWords.push('kredit', 'rate', 'ratenkauf', 'ratenzahlung', 'finanzierung', 'darlehen', 'schuld');
      }

      const rawComp = [
        tx.description || '',
        tx.category || '',
        tx.subcategory || '',
        accName,
        tx.account || '',
        fromAccName,
        tx.fromAccount || '',
        toAccName,
        tx.toAccount || '',
        ...dateWords,
        ...typeWords,
        amtStr,
        amtGerman,
        amtNoDec,
        `${amtGerman} €`,
        `${amtGerman}€`,
        `${amtNoDec} €`,
        `${amtNoDec}€`
      ].join(' ').toLowerCase();

      const normComp = (typeof normalizeSearchText === 'function') ? normalizeSearchText(rawComp) : rawComp;
      const compWords = normComp.split(/\s+/).filter(Boolean);

      // Check each token
      for (let token of qTokens) {
        // Strip trailing currency symbols
        token = token.replace(/€|euro/g, '').trim();
        if (!token) continue;

        // A. Negation: -token (e.g. -rewe, -paypal)
        if (token.startsWith('-') && token.length > 1) {
          const negToken = token.slice(1);
          if (typeof matchesFuzzyOrExact === 'function' && matchesFuzzyOrExact(negToken, compWords, rawComp, normComp)) {
            return false;
          } else if (rawComp.includes(negToken) || normComp.includes(negToken)) {
            return false;
          }
          continue;
        }

        // B. Range match: 10-50 or 10..50
        const rangeMatch = token.match(/^(\d+(?:[.,]\d+)?)(?:-|\.\.)(\d+(?:[.,]\d+)?)$/);
        if (rangeMatch) {
          const minVal = parseFloat(rangeMatch[1].replace(',', '.'));
          const maxVal = parseFloat(rangeMatch[2].replace(',', '.'));
          if (!isNaN(minVal) && !isNaN(maxVal)) {
            if (!(txAmt >= minVal && txAmt <= maxVal)) return false;
            continue;
          }
        }

        // C. Approximate amount: ~50
        if (token.startsWith('~') && token.length > 1) {
          const approxTarget = parseFloat(token.slice(1).replace(',', '.'));
          if (!isNaN(approxTarget)) {
            const margin = Math.max(2, approxTarget * 0.1);
            if (Math.abs(txAmt - approxTarget) > margin) return false;
            continue;
          }
        }

        // D. Greater / Lesser comparison operators: >50, <100, >=20, <=80
        if (token.startsWith('>') || token.startsWith('<')) {
          const isGte = token.startsWith('>=');
          const isLte = token.startsWith('<=');
          const isGt = !isGte && token.startsWith('>');
          const isLt = !isLte && token.startsWith('<');
          const numStr = token.replace(/^[><]=?/, '').replace(',', '.');
          const threshold = parseFloat(numStr);
          if (!isNaN(threshold)) {
            if (isGt && !(txAmt > threshold)) return false;
            if (isLt && !(txAmt < threshold)) return false;
            if (isGte && !(txAmt >= threshold)) return false;
            if (isLte && !(txAmt <= threshold)) return false;
            continue;
          }
        }

        // E. Fuzzy, phonetic & exact token matching
        if (typeof matchesFuzzyOrExact === 'function') {
          if (!matchesFuzzyOrExact(token, compWords, rawComp, normComp)) {
            return false;
          }
        } else {
          if (!rawComp.includes(token) && !normComp.includes(token)) {
            return false;
          }
        }
      }
    }

    // 2. Status
    if (currentTxFilter.status === 'booked') {
      if (tx.isPlanned || tx.date > todayStr) return false;
    } else if (currentTxFilter.status === 'planned') {
      if (!tx.isPlanned && tx.date <= todayStr) return false;
    } else if (currentTxFilter.status === 'recurring') {
      if (!tx.isRecurring) return false;
    }

    // 3. Account
    if (currentTxFilter.account && currentTxFilter.account !== 'all') {
      if (tx.account !== currentTxFilter.account && tx.fromAccount !== currentTxFilter.account && tx.toAccount !== currentTxFilter.account) {
        return false;
      }
    }

    return true;
  });
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
  const isConn = localStorage.getItem('haushaltsbuch_sync_connected') === 'true';
  const dev = localStorage.getItem('haushaltsbuch_sync_connected_device');
  const code = localStorage.getItem('haushaltsbuch_sync_connected_code') || 
               (typeof SyncEngine !== 'undefined' && SyncEngine.getActivePairingCode ? SyncEngine.getActivePairingCode() : null);

  const isAndroid = !!window.__IS_ANDROID__ || 
                    (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
                    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Auf Desktop darf der Partner nicht "Computer" oder "PC" heißen (denn das ist der PC selbst!)
  if (!isAndroid && (dev === 'Computer' || dev === 'PC')) {
    localStorage.removeItem('haushaltsbuch_sync_connected');
    localStorage.removeItem('haushaltsbuch_sync_connected_device');
    localStorage.removeItem('haushaltsbuch_sync_connected_code');
    localStorage.removeItem('haushaltsbuch_sync_connected_time');
    return false;
  }

  // Ein Gerät darf nicht mit seinem eigenen Namen gekoppelt sein
  const myDev = (typeof SyncEngine !== 'undefined' && typeof SyncEngine.getDeviceName === 'function') ? SyncEngine.getDeviceName() : '';
  if (dev && myDev && dev.toLowerCase() === myDev.toLowerCase()) {
    localStorage.removeItem('haushaltsbuch_sync_connected');
    localStorage.removeItem('haushaltsbuch_sync_connected_device');
    localStorage.removeItem('haushaltsbuch_sync_connected_code');
    localStorage.removeItem('haushaltsbuch_sync_connected_time');
    return false;
  }

  return isConn && !!dev && !!code;
}

function getConnectedDevice() {
  const dev = localStorage.getItem('haushaltsbuch_sync_connected_device');
  const isAndroid = !!window.__IS_ANDROID__ || 
                    (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
                    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isAndroid && (dev === 'Computer' || dev === 'PC')) return '';
  return dev || '';
}

function getConnectedTime() {
  return localStorage.getItem('haushaltsbuch_sync_connected_time') || '';
}

function disconnectSyncPairing() {
  localStorage.removeItem('haushaltsbuch_sync_connected');
  localStorage.removeItem('haushaltsbuch_sync_connected_device');
  localStorage.removeItem('haushaltsbuch_sync_connected_code');
  localStorage.removeItem('haushaltsbuch_sync_connected_time');
  localStorage.removeItem('haushaltsbuch_mailbox_last_sync');
  localStorage.removeItem('haushaltsbuch_last_received_mailbox_ts');
  localStorage.removeItem('haushaltsbuch_last_sent_mailbox_ts');
  localStorage.removeItem('haushaltsbuch_pending_sync_data');
  if (typeof window !== 'undefined') {
    window.__PAIRED_DEVICE__ = null;
    window.__MANUAL_SYNC_EDIT__ = false;
  }
  const targetDevInput = document.getElementById('input-target-device');
  const targetCodeInput = document.getElementById('input-target-code');
  if (targetDevInput) targetDevInput.value = '';
  if (targetCodeInput) targetCodeInput.value = '';

  try {
    const port = window.__LOCAL_PORT__ || 48123;
    const headers = (typeof getVaultApiHeaders === 'function') ? getVaultApiHeaders({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' };
    fetch(`http://127.0.0.1:${port}/api/save_pairing`, {
      method: 'POST',
      headers: headers,
      body: '{}'
    }).catch(() => {});
  } catch(e) {}

  if (typeof SyncEngine !== 'undefined') {
    SyncEngine.generateNewPairingCode();
  }
  updateSyncConnectedUI();
  if (typeof initLockScreenSync === 'function') {
    initLockScreenSync();
  }
  if (typeof announceNVDA === 'function') {
    announceNVDA('Kopplung aufgehoben. Beide Geräte sind nun getrennt.');
  }
}

function updateSyncConnectedUI() {
  // Falls window.__PAIRED_DEVICE__ vom C# Server bereitsteht, in LocalStorage übernehmen
  if (typeof window !== 'undefined' && window.__PAIRED_DEVICE__ && window.__PAIRED_DEVICE__.device && window.__PAIRED_DEVICE__.device !== 'Computer' && window.__PAIRED_DEVICE__.device !== 'PC') {
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
  const pairedCode = localStorage.getItem('haushaltsbuch_sync_connected_code') || '';
  const syncTime = getConnectedTime() || 'Heute';

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

  if (connected && devName) {
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

  // Asynchrone Postfach-Statuskarte aktualisieren
  const mailboxBadge = document.getElementById('sync-mailbox-badge');
  const mailboxDevSpan = document.getElementById('sync-mailbox-partner-name');
  const mailboxLastSync = document.getElementById('sync-mailbox-last-sync-time');
  const mailboxNotice = document.getElementById('sync-mailbox-unpaired-notice');
  const mailboxContent = document.getElementById('sync-mailbox-paired-content');
  const lastSyncTimeStr = localStorage.getItem('haushaltsbuch_mailbox_last_sync') || syncTime;

  if (mailboxBadge) {
    if (connected && devName) {
      mailboxBadge.textContent = '🟢 Postfach aktiv & gekoppelt';
      mailboxBadge.style.color = '#15803d';
      mailboxBadge.style.background = '#dcfce7';
      mailboxBadge.style.border = '1px solid #86efac';
    } else {
      mailboxBadge.textContent = '⚪ Noch nicht gekoppelt';
      mailboxBadge.style.color = '#475569';
      mailboxBadge.style.background = '#f1f5f9';
      mailboxBadge.style.border = '1px solid #cbd5e1';
    }
  }
  if (mailboxDevSpan) {
    mailboxDevSpan.textContent = devName || 'Gekoppeltes Partnergerät';
  }
  if (mailboxLastSync && lastSyncTimeStr) {
    mailboxLastSync.textContent = lastSyncTimeStr;
  }
  if (mailboxNotice && mailboxContent) {
    mailboxNotice.style.display = (connected && devName) ? 'none' : 'block';
    mailboxContent.style.display = (connected && devName) ? 'block' : 'none';
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

  if (typeof SyncEngine !== 'undefined' && typeof SyncEngine.checkMailbox === 'function') {
    SyncEngine.checkMailbox(null, false).catch(() => {});
  }
}

function initSyncView() {
  setSyncMode(getSyncMode());
  updateSyncConnectedUI();
  if (typeof SyncEngine !== 'undefined') {
    if (typeof SyncEngine.startMailboxListener === 'function') {
      SyncEngine.startMailboxListener();
    }
  }
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

  const isAndroid = !!window.__IS_ANDROID__ || 
                    (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) || 
                    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const myDevice = (typeof SyncEngine !== 'undefined' && typeof SyncEngine.getDeviceName === 'function') ? SyncEngine.getDeviceName() : '';
  if (!isAndroid && (targetName.toLowerCase() === 'computer' || targetName.toLowerCase() === 'pc' || (myDevice && targetName.toLowerCase() === myDevice.toLowerCase()))) {
    const msg = '⚠️ Bitte gib den Namen deines Smartphones ein (z. B. Handy-XXXX), nicht deinen eigenen Computer. Den Gerätenamen findest du auf deinem Smartphone unter Reiter 8 (Smartphone-Sync).';
    if (statusBox) {
      statusBox.style.display = 'block';
      statusBox.style.background = 'rgba(239, 68, 68, 0.15)';
      statusBox.style.color = '#b91c1c';
      statusBox.textContent = msg;
    }
    if (typeof announceNVDA === 'function') announceNVDA(msg, true);
    else alert(msg);
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

async function triggerManualMailboxSync() {
  if (typeof SyncEngine === 'undefined') return;
  const btn = document.getElementById('btn-manual-mailbox-sync');
  const statusEl = document.getElementById('sync-mailbox-last-status');
  if (btn) btn.disabled = true;
  try {
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = '📬 Prüfe verschlüsseltes Postfach auf Aktualisierungen...';
      statusEl.style.color = '#0284c7';
    }
    await SyncEngine.checkMailbox((state, msg) => {
      if (statusEl) {
        statusEl.textContent = msg;
        if (state === 'success') statusEl.style.color = '#15803d';
        else if (state === 'error') statusEl.style.color = '#b91c1c';
        else statusEl.style.color = '#0284c7';
      }
    }, true);

    // Anschließend aktuellen lokalen Stand im Postfach absichern
    setTimeout(async () => {
      try {
        await SyncEngine.postToMailbox((state, msg) => {
          if (statusEl && state === 'success') {
            statusEl.textContent = msg;
            statusEl.style.color = '#15803d';
          }
        }, false);
      } catch(e) {}
    }, 1200);
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = '⚠️ ' + err.message;
      statusEl.style.color = '#b91c1c';
    }
  } finally {
    setTimeout(() => {
      if (btn) btn.disabled = false;
    }, 1500);
  }
}

// Global: Postfach automatisch abfragen, wenn App wieder in den Vordergrund tritt
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && typeof SyncEngine !== 'undefined' && typeof SyncEngine.checkMailbox === 'function') {
    if (SyncEngine.isPaired()) {
      SyncEngine.checkMailbox(null, false).catch(() => {});
    }
  }
});

window.addEventListener('focus', () => {
  if (typeof SyncEngine !== 'undefined' && typeof SyncEngine.checkMailbox === 'function') {
    if (SyncEngine.isPaired()) {
      SyncEngine.checkMailbox(null, false).catch(() => {});
    }
  }
});


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
