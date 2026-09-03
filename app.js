// ============================================================================
// 1. GLOBALE KONSTANTEN, KATEGORIE-DATENBANK & INITIALER STATE
// ============================================================================
const CURRENT_APP_VERSION = 'v6.0.0';
const STORAGE_DATA_KEY = 'barrierefreie_finanzen_enc_v1';
const STORAGE_SALT_KEY = 'barrierefreie_finanzen_salt_v1';
const STORAGE_THEME_KEY = 'barrierefreie_finanzen_theme_v1';
const STORAGE_FONTSIZE_KEY = 'barrierefreie_finanzen_fontsize_v1';
const STORAGE_LOCKOUT_KEY = 'barrierefreie_finanzen_lockout_v1';
const STORAGE_ATTEMPTS_KEY = 'barrierefreie_finanzen_attempts_v1';
const STORAGE_SHOW_SYMBOLS_KEY = 'haushaltsbuch_show_symbols_enabled_v1';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 Stunden

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
  wishlist: []
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
function checkLiquidityWarning(currentBalances) {
  const alertBox = document.getElementById('overview-liquidity-alert');
  if (!alertBox) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.substring(0, 7);

  // Calculate upcoming planned transactions and recurring items until end of month
  const upcomingTx = appState.transactions.filter(t => t.date.startsWith(currentMonthPrefix) && t.date > todayStr && t.type === 'expense');
  const d = new Date();
  const recList = getRecurringTransactionsForMonth(d.getFullYear(), d.getMonth()).filter(r => r.date > todayStr && r.type === 'expense');
  const allUpcoming = [...upcomingTx, ...recList];

  const upcomingTotal = allUpcoming.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const bankBalance = currentBalances ? (currentBalances.bank || 0) : 0;

  if (upcomingTotal > 0 && bankBalance < upcomingTotal) {
    const diff = upcomingTotal - bankBalance;
    alertBox.style.display = 'flex';
    alertBox.className = 'liquidity-alert-box';
    alertBox.innerHTML = `
      <span style="font-size: 24px;" aria-hidden="true">⚠️</span>
      <div>
        <strong>Achtung Kontodeckung:</strong> Bis zum Monatsende stehen noch <strong>${formatCurrency(upcomingTotal)}</strong> an geplanten Ausgaben &amp; Daueraufträgen an. Auf dem Bankkonto sind aktuell <strong>${formatCurrency(bankBalance)}</strong> (Fehlbetrag: <strong>${formatCurrency(diff)}</strong>).
      </div>
    `;
  } else {
    alertBox.style.display = 'none';
  }
}

// ----------------------------------------------------------------------------
// D. EINKAUFSZETTEL- & KASSENZETTEL-RECHNER
// ----------------------------------------------------------------------------
let shoppingCart = [];

function toggleShoppingCalculator() {
  const details = document.getElementById('details-shopping-calc');
  if (!details) return;
  const isOpening = !details.open;
  details.open = isOpening;
  if (isOpening) {
    populateShoppingDropdowns();
    renderShoppingCart();
    const itemInput = document.getElementById('shopping-item-name');
    if (itemInput) itemInput.focus();
    announceNVDA('Einkaufs- und Kassenrechner geöffnet.');
  } else {
    announceNVDA('Einkaufs- und Kassenrechner geschlossen.');
  }
}

function populateShoppingDropdowns() {
  ensureAccountsInitialized();
  const accSel = document.getElementById('shopping-book-account');
  const subSel = document.getElementById('shopping-book-subcat');
  if (accSel) {
    accSel.innerHTML = appState.accounts.map(a => `<option value="${escapeHTML(a.id)}">${escapeHTML(a.name)}</option>`).join('');
    applySymbolsToOptions(accSel);
  }
  if (subSel) {
    const subs = CATEGORIES_DB.exp['Lebensmittel, Supermarkt & Discounter'] || ['Rewe', 'Aldi', 'Lidl', 'Edeka'];
    subSel.innerHTML = subs.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');
    applySymbolsToOptions(subSel);
  }
}

function handleAddShoppingItem(e) {
  e.preventDefault();
  const nameInput = document.getElementById('shopping-item-name');
  const priceInput = document.getElementById('shopping-item-price');
  const name = nameInput.value.trim() || `Artikel #${shoppingCart.length + 1}`;
  const price = parseFloat(priceInput.value);

  if (isNaN(price) || price <= 0) return;

  shoppingCart.push({ name: name, price: price });
  nameInput.value = '';
  priceInput.value = '';
  nameInput.focus();
  renderShoppingCart();

  const total = shoppingCart.reduce((s, i) => s + i.price, 0);
  announceNVDA(`${name} für ${formatCurrency(price)} hinzugefügt. Zwischensumme: ${formatCurrency(total)}`);
}

function removeShoppingItem(idx) {
  if (idx >= 0 && idx < shoppingCart.length) {
    const removed = shoppingCart.splice(idx, 1)[0];
    renderShoppingCart();
    const total = shoppingCart.reduce((s, i) => s + i.price, 0);
    announceNVDA(`${removed.name} entfernt. Neue Zwischensumme: ${formatCurrency(total)}`);
  }
}

function clearShoppingCart() {
  shoppingCart = [];
  renderShoppingCart();
  announceNVDA('Einkaufswagen geleert.');
}

function renderShoppingCart() {
  const container = document.getElementById('shopping-cart-table-wrapper');
  if (!container) return;

  if (shoppingCart.length === 0) {
    container.innerHTML = '<p class="field-hint" style="margin: 8px 0;">Noch keine Artikel im Einkaufswagen. Gib oben den ersten Artikel oder Preis ein!</p>';
    return;
  }

  const total = shoppingCart.reduce((s, i) => s + i.price, 0);

  container.innerHTML = `
    <table class="shopping-table" aria-label="Einkaufsliste">
      <thead>
        <tr>
          <th>Artikel</th>
          <th style="text-align: right;">Preis</th>
          <th style="width: 60px; text-align: center;">Aktion</th>
        </tr>
      </thead>
      <tbody>
        ${shoppingCart.map((item, idx) => `
          <tr>
            <td>${escapeHTML(item.name)}</td>
            <td style="text-align: right; font-weight: bold;">${formatCurrency(item.price)}</td>
            <td style="text-align: center;">
              <button type="button" class="btn btn-secondary" onclick="removeShoppingItem(${idx})" title="Artikel entfernen" aria-label="${escapeHTML(item.name)} entfernen" style="padding: 2px 8px; color: #f44336;">✕</button>
            </td>
          </tr>
        `).join('')}
        <tr class="shopping-total-row">
          <td><strong>GESAMTSUMME (${shoppingCart.length} Artikel):</strong></td>
          <td style="text-align: right; color: #2E7D32;"><strong>${formatCurrency(total)}</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `;
}

async function bookShoppingCartAsExpense() {
  if (shoppingCart.length === 0) {
    alert('Der Einkaufswagen ist leer.');
    return;
  }

  const total = shoppingCart.reduce((s, i) => s + i.price, 0);
  const account = document.getElementById('shopping-book-account').value || 'bank';
  const subcat = document.getElementById('shopping-book-subcat').value || 'Supermarkt';
  const itemsSummary = shoppingCart.map(i => `${i.name} (${formatCurrency(i.price)})`).join(', ');

  const todayVal = new Date().toISOString().split('T')[0];

  appState.transactions.push({
    id: `tx_${Date.now()}`,
    type: 'expense',
    account: account,
    amount: total,
    category: 'Lebensmittel, Supermarkt & Discounter',
    subcategory: subcat,
    description: `Kassenzettel Einkauf: ${itemsSummary}`,
    isPlanned: false,
    date: todayVal
  });

  await saveStateToEncryptedStorage();
  shoppingCart = [];
  renderShoppingCart();
  updateOverview();
  announceNVDA(`Einkauf über ${formatCurrency(total)} bei ${subcat} erfolgreich gebucht!`);
  alert(`✅ Der Einkauf über ${formatCurrency(total)} (${subcat}) wurde erfolgreich als Ausgabe verbucht!`);
}

// ----------------------------------------------------------------------------
// E. GLOBALE SUCHE & FILTER-ENGINE
// ----------------------------------------------------------------------------
let currentTxFilter = {
  query: '',
  status: 'all',
  account: 'all'
};

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
  const totalHits = countExp + countInc;

  const detExp = document.getElementById('details-expense-list');
  const detInc = document.getElementById('details-income-list');

  if (isSearchActive) {
    if (detExp) detExp.open = countExp > 0;
    if (detInc) detInc.open = countInc > 0;

    if (banner && bannerText) {
      banner.style.display = 'flex';
      if (totalHits > 0) {
        bannerText.textContent = `🔍 ${totalHits} Treffer gefunden (${countExp} Ausgaben, ${countInc} Einnahmen).`;
      } else {
        bannerText.textContent = `⚠️ Keine Buchungen gefunden für "${currentTxFilter.query || 'aktuelle Filter'}".`;
      }
    }

    if (currentTxFilter.query && currentTxFilter.query.length >= 2) {
      if (totalHits > 0) {
        announceNVDA(`${totalHits} Buchungen für "${currentTxFilter.query}" gefunden (${countExp} Ausgaben, ${countInc} Einnahmen). Listen geöffnet.`);
      } else {
        announceNVDA(`Keine Buchungen für "${currentTxFilter.query}" gefunden.`);
      }
    }
  } else {
    if (banner) banner.style.display = 'none';
    if (detExp) detExp.open = false;
    if (detInc) detInc.open = false;
  }
}

function populateFilterAccountDropdown() {
  ensureAccountsInitialized();
  const sel = document.getElementById('tx-filter-account');
  if (!sel) return;
  const currentVal = sel.value || 'all';
  sel.innerHTML = '<option value="all">Alle Konten</option>' + appState.accounts.map(a => `<option value="${escapeHTML(a.id)}">${escapeHTML(a.name)}</option>`).join('');
  sel.value = currentVal;
  applySymbolsToOptions(sel);
}


// ----------------------------------------------------------------------------
// GLOBAL SORTING ENGINE FOR OVERVIEW TRANSACTIONS
// ----------------------------------------------------------------------------
let currentTxSortOrder = 'date-desc';

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
  return [...list].sort((a, b) => {
    switch (currentTxSortOrder) {
      case 'date-asc':
        return a.date.localeCompare(b.date);
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
        return b.date.localeCompare(a.date);
    }
  });
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

function applyTxFilters(list) {
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

      const acc = appState.accounts ? appState.accounts.find(a => a.id === tx.account) : null;
      const accName = acc ? acc.name : (tx.account || '');
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
      else if (tx.type === 'transfer') typeWords.push('umbuchung', 'transfer', 'sparen', 'verschieben');
      else typeWords.push('ausgabe', 'ausgaben', 'minus', 'kosten');

      if (tx.isRecurring) typeWords.push('wiederkehrend', 'dauerauftrag', 'abo', 'fixkosten', 'vertrag');
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

      const normComp = normalizeSearchText(rawComp);
      const compWords = normComp.split(/\s+/).filter(Boolean);

      // Check each token
      for (let token of qTokens) {
        // Strip trailing currency symbols
        token = token.replace(/€|euro/g, '').trim();
        if (!token) continue;

        // A. Negation: -token (e.g. -rewe, -paypal)
        if (token.startsWith('-') && token.length > 1) {
          const negToken = token.slice(1);
          if (matchesFuzzyOrExact(negToken, compWords, rawComp, normComp)) {
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
        if (!matchesFuzzyOrExact(token, compWords, rawComp, normComp)) {
          return false;
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
        account: appState.accounts[0] ? appState.accounts[0].id : 'bank'
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
  const db = CATEGORIES_DB[type] || CATEGORIES_DB['exp'];

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
            <td style="font-weight: bold; color: ${tx.type === 'income' ? '#4CAF50' : '#F44336'};">${tx.type === 'income' ? '🟢 Einnahme' : '🔴 Ausgabe'}</td>
            <td style="font-weight: bold;">${formatCurrency(tx.amount)}</td>
            <td>
              <select class="large-select" style="padding: 4px 8px; font-size: 13px;" onchange="parsedCsvTransactions[${idx}].category = this.value">
                ${Object.keys(CATEGORIES_DB[tx.type === 'income' ? 'inc' : 'exp']).map(c => `<option value="${escapeHTML(c)}" ${c === tx.category ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
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

  container.innerHTML = appState.accounts.map(acc => {
    const icon = acc.icon || ACCOUNT_TYPE_ICONS[acc.type] || '💳';
    const typeLabel = ACCOUNT_TYPE_NAMES[acc.type] || acc.type;
    const balanceStr = formatCurrency(acc.initialBalance || 0);

    const iconHtml = show ? `<span class="emoji-icon" aria-hidden="true" style="font-size: 26px;">${icon}</span>` : '';
    const editBtnText = show ? '✏️ Bearbeiten' : 'Bearbeiten';
    const delBtnText = show ? '🗑️ Löschen' : 'Löschen';

    return `
      <div class="settings-account-item" style="display: flex; align-items: center; justify-content: space-between; background: var(--card-bg, #ffffff); border: 2px solid var(--border-color, #e0e0e0); border-radius: 8px; padding: 14px 18px; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 220px;">
          ${iconHtml}
          <div>
            <div style="font-size: 18px; font-weight: bold; color: var(--text-primary);">${escapeHTML(acc.name)}</div>
            <div style="font-size: 14px; color: var(--text-secondary); margin-top: 2px;">
              ${escapeHTML(typeLabel)} | Startguthaben: <strong style="color: var(--text-primary);">${balanceStr}</strong>
            </div>
            ${acc.hint ? `<div style="font-size: 13px; color: var(--text-muted, #777); margin-top: 2px;">${escapeHTML(acc.hint)}</div>` : ''}
          </div>
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="button" class="btn btn-secondary" onclick="openAccountModal('${acc.id}')" title="Konto bearbeiten" aria-label="Konto ${escapeHTML(acc.name)} bearbeiten" style="padding: 8px 16px;">
            ${editBtnText}
          </button>
          <button type="button" class="btn btn-secondary" onclick="deleteAccount('${acc.id}')" title="Konto löschen" aria-label="Konto ${escapeHTML(acc.name)} löschen" style="padding: 8px 16px; color: #f44336; border-color: rgba(244, 67, 54, 0.4);">
            ${delBtnText}
          </button>
        </div>
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
  { id: 'paypal', name: 'PayPal Guthaben', type: 'paypal', icon: '🅿', hint: 'Online-Shopping, Freunde, Abos', initialBalance: 0 },
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

function openAccountModal(accId) {
  ensureAccountsInitialized();
  const modal = document.getElementById('account-modal');
  const heading = document.getElementById('account-modal-heading');
  const idInput = document.getElementById('account-modal-id');
  const nameInput = document.getElementById('account-modal-name');
  const typeInput = document.getElementById('account-modal-type');
  const balInput = document.getElementById('account-modal-balance');
  const hintInput = document.getElementById('account-modal-hint');

  if (accId) {
    const acc = appState.accounts.find(a => a.id === accId);
    if (!acc) return;
    heading.textContent = 'Konto bearbeiten';
    idInput.value = acc.id;
    nameInput.value = acc.name;
    typeInput.value = acc.type || 'bank';
    balInput.value = (acc.initialBalance !== undefined) ? acc.initialBalance : 0;
    hintInput.value = acc.hint || '';
  } else {
    heading.textContent = 'Neues Konto hinzufügen';
    idInput.value = '';
    nameInput.value = '';
    typeInput.value = 'bank';
    balInput.value = '0.00';
    hintInput.value = '';
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
      initialBalance: balance
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
    AppVersion: 'v6.0.0'
  });

  const port = window.__LOCAL_PORT__ || 48123;
  try {
    fetch('http://127.0.0.1:' + port + '/api/send_feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    fetch(`http://127.0.0.1:${port}/api/heartbeat`).catch(() => {});
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
      closeEditModal();
      closeEditRecModal();
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

  if (year < startY || (year === startY && month < startM)) return false;

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

            list.push({
              id: `rec_instance_${rec.id}_${year}_${month}_${d}`,
              recurringId: rec.id,
              isRecurring: true,
              type: rec.type,
              account: rec.account,
              fromAccount: rec.fromAccount,
              toAccount: rec.toAccount,
              amount: Number(rec.amount),
              category: rec.category,
              subcategory: rec.subcategory || '',
              description: `${rec.name} (Wöchentlich)`,
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

        list.push({
          id: `rec_instance_${rec.id}_${year}_${month}`,
          recurringId: rec.id,
          isRecurring: true,
          type: rec.type,
          account: rec.account,
          fromAccount: rec.fromAccount,
          toAccount: rec.toAccount,
          amount: Number(rec.amount),
          category: rec.category,
          subcategory: rec.subcategory || '',
          description: `${rec.name} (Dauerauftrag / Sparplan)`,
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

  const dayIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dayLeftover = dayIncome - dayExpense;

  const balances = calculateBalancesUpToDate(dayStr);

  return { dayIncome, dayExpense, dayLeftover, incomeList, expenseList, balances };
}

function calculateMonthStats(year, month) {
  const mFormatted = String(month + 1).padStart(2, '0');
  const monthPrefix = `${year}-${mFormatted}`;

  const monthTx = appState.transactions.filter(t => t.date.startsWith(monthPrefix));
  const recList = getRecurringTransactionsForMonth(year, month);
  const allMonth = [...monthTx, ...recList];

  const incomeList = allMonth.filter(t => t.type === 'income');
  const expenseList = allMonth.filter(t => t.type === 'expense');

  const totalIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const leftover = totalIncome - totalExpense;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endOfMonthStr = `${year}-${mFormatted}-${String(daysInMonth).padStart(2, '0')}`;
  const balances = calculateBalancesUpToDate(endOfMonthStr);

  return { totalIncome, totalExpense, leftover, incomeList, expenseList, balances };
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

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(dayStats.dayIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(dayStats.dayExpense)}`;
    if (cardTotal) cardTotal.textContent = formatCurrency(dayStats.balances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (dayStats.dayLeftover >= 0 ? '+ ' : '') + formatCurrency(dayStats.dayLeftover);
      monthLeftover.style.color = dayStats.dayLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(dayStats.balances);
    renderTransactionList(dayStats.incomeList, 'overview-income-items-feed', 'Keine Einnahmen an diesem Tag erfasst.');
    renderTransactionList(dayStats.expenseList, 'overview-expense-items-feed', 'Keine Ausgaben an diesem Tag erfasst.');
    runPurchaseSimulation();
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

    const weekIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const weekExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
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

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(weekIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(weekExpense)}`;
    if (cardTotal) cardTotal.textContent = formatCurrency(weekBalances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (weekLeftover >= 0 ? '+ ' : '') + formatCurrency(weekLeftover);
      monthLeftover.style.color = weekLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(weekBalances);
    renderTransactionList(incomeList, 'overview-income-items-feed', 'Keine Einnahmen in dieser Kalenderwoche erfasst.');
    renderTransactionList(expenseList, 'overview-expense-items-feed', 'Keine Ausgaben in dieser Kalenderwoche erfasst.');
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

    if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(stats.totalIncome)}`;
    if (cardExpense) cardExpense.textContent = `- ${formatCurrency(stats.totalExpense)}`;
    if (cardTotal) cardTotal.textContent = formatCurrency(stats.balances.total);

    if (monthLeftover) {
      monthLeftover.textContent = (stats.leftover >= 0 ? '+ ' : '') + formatCurrency(stats.leftover);
      monthLeftover.style.color = stats.leftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
    }

    renderAccountCardBalances(stats.balances);
    renderTransactionList(stats.incomeList, 'overview-income-items-feed', 'Keine Einnahmen in diesem Monat erfasst.');
    renderTransactionList(stats.expenseList, 'overview-expense-items-feed', 'Keine Ausgaben in diesem Monat erfasst.');
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

  let grandIncome = 0, grandExpense = 0;
  const allPeriodIncome = [];
  const allPeriodExpense = [];
  const monthlyBreakdown = [];

  for (let m = startM; m <= endM; m++) {
    const mStats = calculateMonthStats(selectedYear, m);
    grandIncome += mStats.totalIncome;
    grandExpense += mStats.totalExpense;
    allPeriodIncome.push(...mStats.incomeList);
    allPeriodExpense.push(...mStats.expenseList);
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

  if (cardIncome) cardIncome.textContent = `+ ${formatCurrency(grandIncome)}`;
  if (cardExpense) cardExpense.textContent = `- ${formatCurrency(grandExpense)}`;
  if (cardTotal) cardTotal.textContent = formatCurrency(periodEndBalances.total);

  if (monthLeftover) {
    monthLeftover.textContent = (grandLeftover >= 0 ? '+ ' : '') + formatCurrency(grandLeftover);
    monthLeftover.style.color = grandLeftover >= 0 ? 'var(--accent-income)' : 'var(--accent-expense)';
  }

  renderAccountCardBalances(periodEndBalances);
  renderTransactionList(allPeriodIncome, 'overview-income-items-feed', 'Keine Einnahmen in diesem Zeitraum.');
  renderTransactionList(allPeriodExpense, 'overview-expense-items-feed', 'Keine Ausgaben in diesem Zeitraum.');

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
    const sign = isIncome ? '+' : '-';
    const colorClass = isIncome ? 'income' : 'expense';
    const icon = isIncome ? '📥' : '📤';
    const dateFormatted = formatDateGerman(tx.date);

    const todayStr = new Date().toISOString().split('T')[0];
    const isFuture = tx.date > todayStr;
    const isEffectivelyPlanned = (tx.isPlanned === true) || isFuture;

    let statusBadge = '';
    if (isEffectivelyPlanned) {
      statusBadge = '<span class="status-badge status-planned">🎯 Geplant</span>';
    } else if (tx.isRecurring) {
      statusBadge = '<span class="status-badge status-booked">🔁 Dauerhaft (Gebucht)</span>';
    } else {
      statusBadge = '<span class="status-badge status-booked">✅ Gebucht</span>';
    }

    // JEDER EINTRAG HAT BEARBEITEN & LÖSCHEN BUTTONS (AUCH DAUERHAFTE!)
    const editBtn = tx.isRecurring
      ? `<button type="button" class="btn-edit-tx" onclick="openEditRecModal('${tx.recurringId}')" title="Dauerauftrag bearbeiten" aria-label="Dauerauftrag ${tx.category} bearbeiten">✏️ Bearbeiten</button>`
      : `<button type="button" class="btn-edit-tx" onclick="openEditModal('${tx.id}')" title="Buchung bearbeiten" aria-label="Buchung ${tx.category} bearbeiten">✏️ Bearbeiten</button>`;

    const deleteBtn = tx.isRecurring
      ? `<button type="button" class="btn-delete-tx" onclick="deleteRecurring('${tx.recurringId}')" title="Dauerauftrag löschen" aria-label="Dauerauftrag ${tx.category} löschen">🗑️ Löschen</button>`
      : `<button type="button" class="btn-delete-tx" onclick="deleteTransaction('${tx.id}')" title="Buchung löschen" aria-label="Buchung ${tx.category} löschen">🗑️ Löschen</button>`;

    const hasSub = tx.subcategory && tx.subcategory !== 'Gesamt / Allgemein' && tx.subcategory !== tx.category;
    let categoryDisplayHtml = '';
    if (hasSub) {
      categoryDisplayHtml = `${escapeHTML(tx.category)} <span class="tx-subcat-badge">› ${escapeHTML(tx.subcategory)}</span>`;
    } else {
      categoryDisplayHtml = escapeHTML(tx.category || 'Buchung');
    }

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">${icon}</span>
          <div class="tx-details">
            <span class="tx-cat-name">${categoryDisplayHtml}</span>
            <span class="tx-account-badge">${dateFormatted} | ${formatAccountName(tx.account)}</span>
            ${statusBadge}
            ${tx.description ? `<span class="tx-note">${tx.description}</span>` : ''}
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${colorClass}">${sign} ${formatCurrency(tx.amount)}</span>
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
  const freq = document.getElementById('exp-frequency') ? document.getElementById('exp-frequency').value : 'once';
  if (freq === 'installment') {
    handleInstallmentCalculation();
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
  const isRec = ['weekly', 'monthly', 'yearly'].includes(freq);
  document.getElementById('inc-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('inc-date-group').style.display = isRec ? 'none' : 'block';

  const isWeekly = freq === 'weekly';
  if (document.getElementById('inc-weekday-group')) document.getElementById('inc-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('inc-month-day-group')) document.getElementById('inc-month-day-group').style.display = isWeekly ? 'none' : 'block';
}

function toggleTransferFrequencyFields() {
  const freq = document.getElementById('trf-frequency').value;
  const isRec = ['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq);
  document.getElementById('trf-recurring-details').style.display = isRec ? 'block' : 'none';
  document.getElementById('trf-date-group').style.display = isRec ? 'none' : 'block';

  const isWeekly = freq === 'weekly';
  if (document.getElementById('trf-weekday-group')) document.getElementById('trf-weekday-group').style.display = isWeekly ? 'block' : 'none';
  if (document.getElementById('trf-month-day-group')) document.getElementById('trf-month-day-group').style.display = isWeekly ? 'none' : 'block';
}

async function handleAddExpense(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const freq = document.getElementById('exp-frequency').value;
  const account = document.getElementById('exp-account').value;
  const category = document.getElementById('exp-category').value;
  const subcategory = document.getElementById('exp-subcategory') ? document.getElementById('exp-subcategory').value : '';
  const date = document.getElementById('exp-date').value;
  const desc = document.getElementById('exp-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;
  const isPlanned = (freq === 'planned') || isFuture;

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
      startYear: selectedYear,
      startMonth: selectedMonth,
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
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Dauerhafte Ausgabe ${category} über ${formatCurrency(amount)} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'expense',
      account: account,
      amount: amount,
      category: category,
      subcategory: subcategory,
      description: desc,
      isPlanned: isPlanned,
      date: date
    });
    announceNVDA(`Ausgabe ${category} über ${formatCurrency(amount)} ${isPlanned ? 'geplant' : 'gebucht'}!`);
  }

  await saveStateToEncryptedStorage();
  document.getElementById('form-add-expense').reset();
  document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];
  toggleExpenseFrequencyFields();
  updateOverview();
  switchView('overview');
}

async function handleAddIncome(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('inc-amount').value);
  const freq = document.getElementById('inc-frequency').value;
  const account = document.getElementById('inc-account').value;
  const category = document.getElementById('inc-category').value;
  const subcategory = document.getElementById('inc-subcategory') ? document.getElementById('inc-subcategory').value : '';
  const date = document.getElementById('inc-date').value;
  const desc = document.getElementById('inc-desc').value.trim();

  if (isNaN(amount) || amount <= 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;
  const isPlanned = (freq === 'planned') || isFuture;

  if (['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('inc-rec-day').value, 10) || 1;
    const weekday = document.getElementById('inc-rec-weekday') ? parseInt(document.getElementById('inc-rec-weekday').value, 10) : 5;
    
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
      startYear: selectedYear,
      startMonth: selectedMonth,
      active: true
    });
    announceNVDA(`Dauerhafte Einnahme ${category} über ${formatCurrency(amount)} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'income',
      account: account,
      amount: amount,
      category: category,
      subcategory: subcategory,
      description: desc,
      isPlanned: isPlanned,
      date: date
    });
    announceNVDA(`Einnahme ${category} über ${formatCurrency(amount)} ${isPlanned ? 'geplant' : 'gebucht'}!`);
  }

  await saveStateToEncryptedStorage();
  document.getElementById('form-add-income').reset();
  document.getElementById('inc-date').value = new Date().toISOString().split('T')[0];
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
  const date = document.getElementById('trf-date').value;
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

  const todayStr = new Date().toISOString().split('T')[0];
  const isFuture = date > todayStr;
  const isPlanned = (freq === 'planned') || isFuture;

  if (['weekly', 'monthly', 'quarterly', 'halfyear', 'yearly'].includes(freq)) {
    const day = parseInt(document.getElementById('trf-rec-day').value, 10) || 1;
    const weekday = document.getElementById('trf-rec-weekday') ? parseInt(document.getElementById('trf-rec-weekday').value, 10) : 5;
    
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
      startYear: selectedYear,
      startMonth: selectedMonth,
      targetPotId: toPotId || '',
      sourcePotId: fromPotId || '',
      active: true
    });
    announceNVDA(`Sparplan über ${formatCurrency(amount)}${potInfo} gespeichert!`);
  } else {
    appState.transactions.push({
      id: `tx_${Date.now()}`,
      type: 'transfer',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: amount,
      category: 'Umbuchung',
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

  const modal = document.getElementById('edit-tx-modal');
  modal.style.display = 'flex';
  document.getElementById('edit-tx-amount').focus();
  announceNVDA('Buchung bearbeiten geöffnet.');
}

function closeEditModal() {
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

    html += `
      <li class="tx-item" tabindex="0">
        <div class="tx-info">
          <span class="tx-icon" aria-hidden="true">🔁</span>
          <div class="tx-details">
            <span class="tx-cat-name">${rec.name || rec.category}</span>
            <span class="tx-account-badge">${freqLabel} | Am ${rec.day}. des Monats | ${formatAccountName(rec.account || rec.fromAccount)}</span>
          </div>
        </div>
        <div class="tx-amount-col">
          <span class="tx-sum ${rec.type}">${rec.type === 'income' ? '+' : '-'} ${formatCurrency(rec.amount)}</span>
          <button type="button" class="btn-edit-tx" onclick="openEditRecModal('${rec.id}')">✏️ Bearbeiten</button>
          <button type="button" class="btn-delete-tx" onclick="deleteRecurring('${rec.id}')">🗑️ Löschen</button>
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

  const views = ['overview', 'expense', 'income', 'transfer', 'settings', 'accounts', 'wishlist'];
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
    const r = await fetch(`http://127.0.0.1:${port}/api/get_vault`);
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
    await fetch(`http://127.0.0.1:${port}/api/reset_vault`, { method: 'POST' }).catch(() => {});
  } catch(e) {}

  announceNVDA('Tresor wurde zurückgesetzt. Bitte gib eine neue PIN ein.');
  alert('✅ Tresor wurde zurückgesetzt. Bitte erstelle jetzt deine neue PIN.');
  window.location.reload();
}

async function handlePinSubmit(e) {
  e.preventDefault();

  if (checkLockoutStatus()) {
    announceNVDA('Zugriff gesperrt wegen zu vieler Fehlversuche.', true);
    return;
  }

  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error-msg');
  const enteredPin = pinInput.value.trim();

  if (!enteredPin) return;

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

      cryptoKey = await deriveKey(enteredPin, salt);
      appState = {
        initialBalances: { bank: 0, paypal: 0, savings: 0, cash: 0 },
        transactions: [],
        recurring: []
      };
      await saveStateToEncryptedStorage();
      
      setFailedAttempts(0);
      setLockoutEndTime(0);

      unlockApp();
      announceNVDA('Neuer Datensafe erfolgreich eingerichtet.');
    } else {
      // Vorhandenen Datensafe entsperren
      currentSaltBase64 = saltBase64;
      const saltBuffer = base64ToArrayBuffer(saltBase64);
      const salt = new Uint8Array(saltBuffer);
      const key = await deriveKey(enteredPin, salt);

      const decrypted = await decryptData(storedData, key);
      cryptoKey = key;
      appState = decrypted;

      if (!appState.initialBalances) appState.initialBalances = { bank: 0, paypal: 0, savings: 0, cash: 0 };
            if (!appState.customCategories) appState.customCategories = { exp: {}, inc: {}, trf: {} };
            if (!appState.wishlist || !Array.isArray(appState.wishlist)) appState.wishlist = [];
            mergeCustomCategoriesIntoDB();
            populateCategoriesDropdowns();
  populateAllAccountDropdowns();
  populateBudgetCategoryDropdown();
  populateShoppingDropdowns();
  renderShoppingCart();
  renderAccountsViewList();
      if (!appState.transactions) appState.transactions = [];
      if (!appState.recurring) appState.recurring = [];

      setFailedAttempts(0);
      setLockoutEndTime(0);

      unlockApp();
      announceNVDA('Erfolgreich entsperrt! Alle Finanzdaten wurden geladen.');
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
      pinInput.value = '';
      pinInput.focus();
      announceNVDA(`Falsche PIN. Zugriff verweigert. Noch ${remainingAttempts} Versuch(e) übrig. Bitte erneut eingeben.`, true);
    }
  }
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
        headers: { 'Content-Type': 'application/json' },
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
}

function lockApp() {
  cryptoKey = null;
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
        headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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
    AppVersion: 'v6.0.0'
  });

  const port = window.__LOCAL_PORT__ || 48123;
  try {
    fetch('http://127.0.0.1:' + port + '/api/send_feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
