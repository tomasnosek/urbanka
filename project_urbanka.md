TECHNICKÝ BRIEF: URBANKA (V5.0 - Hybrid & Cost-Optimized)
Aktualizováno v průběhu vývoje

1. Účel a vize
Urbanka je servisovaný webový portál pro správu a prezentaci obecních investičních projektů. Systém funguje jako "Tool + Service" spravovaný výhradně administrátorem (autorem). Cílem je vizuálně čistá, na konzumaci rychlá prezentace projektů (1-minutové čtení), která obcím řeší informační povinnost a poskytuje moderní PR.

2. Architektura aplikace (Decoupled & Hybrid)
Aplikace je navržena pro škálování na stovky obcí a tisíce projektů bez ztráty výkonu a bez složitých databázových migrací.

Databáze (PostgreSQL / Supabase):
- Relační vrstva: Tabulky pro `municipalities`, `projects`, `feedbacks`, `admin_users` a `api_keys`. Obsahují tvrdá, indexovatelná metadata (ID, vazby, celkové částky, URL slugy, status) pro agregaci a routování.
- Dokumentová vrstva (JSONB): Veškerý dynamický obsah projektové stránky (hero sekce, texty, položky timeline, statistiky) žije v jednom flexibilním sloupci `content` typu JSONB. Frontend konzumuje tento objekt a dynamicky renderuje bloky (např. HeroBlock, StatsBar, Timeline, Content).
- Úložiště médií: Správa médií přes Supabase Storage / CDN (případně Cloudflare R2).

3. AI Data Pipeline & Optimalizace
Aplikace hluboce integruje Google Gemini pro automatizaci tvorby obsahu a analýzy:
- Extrakce z PDF: Zdrojová PDF (smlouvy, technické zprávy) jsou zpracována modelem Gemini (doporučeno `gemini-2.5-flash` nebo `gemini-2.5-pro`). AI vrací striktní strukturovaný JSON, mapující se přímo na strukturu projektu v DB.
- Vizuální analýza: Nahrané hlavní obrázky projektu jsou analyzovány modelem Gemini, který extrahuje hlavní barvy (palette), doporučené barvy textu pro optimální kontrast a popis kompozice pro designové přizpůsobení hero sekce.
- Analýza zpětné vazby: Modul pro občanský feedback automaticky analyzuje zprávy pomocí AI a kategorizuje je (BUG, QUESTION, SPAM, TOXIC), generuje shrnutí a hodnotí urgenci před uložením do databáze.

4. Editační systém a Administrace
- Admin Dashboard: Plně oddělená administrátorská sekce (`/admin`) chráněná přes Supabase Auth. Zde probíhá kompletní správa entit s využitím JSON generátorů.
- Editace JSONB: Administrátor může přímo upravovat vygenerovaný JSON datový strom přes custom editační rozhraní, které umožňuje flexibilní skládání stavebnicových bloků projektové stránky.
- Dynamické vlastnosti (Stats Dropdown): Systém podporuje sémantické obohacování dat skrze kontextový dropdown. Administrátor vybírá statistiky (Termín, Cena, atd.) z předdefinovaného slovníku, přičemž tyto atributy se obousměrně propisují rovnou do JSONB bloků v databázi.
- Správa klíčů (API Keys): Systém umožňuje administrátorům vkládat vlastní API klíče pro AI služby (Google Gemini), což systém izoluje a šetří centrální náklady.

5. UI/UX & Design Tokens (Vizuál)
Design je technický, nadčasový, minimalistický, implementovaný na míru s "Zero-Tailwind" přístupem pro absolutní kontrolu.
- CSS Modules & Variables: Čistý Vanilla CSS přístup s globálním zadefinováním proměnných (`--color-sage`, `--color-slate`, `--wrapper-width`, `--space-X`).
- Estetika: Matné, tlumené barvy (břidlicová #2F3E46, šalvějová #84A98C), vysoký kontrast, bílé pozadí (`#FFFFFF`).
- Geometrie (Striktní pravidlo): Všechny komponenty mají fixní zaoblení hran 4px ("hard-edged minimal"). Bez stínů, k oddělení slouží hraniční linky (1px borders) a white-space.
- Responzivní layout: Flexibilní systém `wrapper` (omezená šířka s přesným paddingem) a `full-width` sekcí s možností průniku obsahu (např. "bleed" do krajů monitoru).
- Klíčová komponenta (Timeline): Vertikální osa s horizontální galerií (`overflow-x: auto`, `scroll-snap-type: x mandatory`). Fotografie přetékají rodičovský kontejner směrem ke kraji displeje.

6. Webové moduly
- Navigace: Čistý Header s logem a jednoduchým menu + Footer.
- Projekty: Komplexní prezentační stránky skládající JSON data do vizuálních sekcí (Hero, Statistiky, Custom obsahové bloky). Systém plně využívá `generateMetadata()` pro automatické propisování dynamických SEO a Open Graph tagů (včetně vizuálů z projektů) kvůli sdílení a botům.
- Feedback Modul: Kontaktní formulář pro občany na konci projektů, integrovaný s AI analýzou.

7. Striktní Tech Stack (Pokyny pro generování kódu)
- Meta-Framework: Next.js (App Router, TypeScript). API routes pro bezpečné operace.
- Databáze & Auth: Supabase (PostgreSQL, Storage, Auth).
- Styling: Vanilla CSS (CSS Modules), Custom CSS variables. **Žádný Tailwind CSS**. Stavebnicový přístup bez opakování tříd.
- AI API: `@google/genai` (Google Gemini API).