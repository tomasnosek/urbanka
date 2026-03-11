export const PROJECT_PROPERTIES = [
    { id: "dodavatel", label: "Dodavatel", defaultPlaceholder: "Název firmy s.r.o." },
    { id: "investor", label: "Investor", defaultPlaceholder: "Město / Soukromý subjekt" },
    { id: "naklady", label: "Náklady", defaultPlaceholder: "0 Kč" },
    { id: "dotace", label: "Z toho dotace", defaultPlaceholder: "0 Kč" },
    { id: "zhotovitel_pd", label: "Zhotovitel PD", defaultPlaceholder: "Architektonické studio" },
    { id: "zahajeni", label: "Zahájení", defaultPlaceholder: "Leden 2024" },
    { id: "dokonceni", label: "Dokončení", defaultPlaceholder: "Prosinec 2024" },
    { id: "status", label: "Status", defaultPlaceholder: "Ve výstavbě" },
    { id: "kapacita", label: "Kapacita", defaultPlaceholder: "např. 150 míst" },
    { id: "plocha", label: "Plocha", defaultPlaceholder: "0 m²" }
];

export type ProjectPropertyId = typeof PROJECT_PROPERTIES[number]["id"];
