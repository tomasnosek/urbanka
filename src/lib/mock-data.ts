/* =============================================
   URBANKA — Mock Data (bude nahrazeno Supabase)
   ============================================= */

import { Municipality, Project } from "./types";

export const municipalities: Municipality[] = [
    {
        id: "m1",
        name: "Město Lužice",
        slug: "luzice",
        postal_code: null,
        emblem_url: null,
        created_at: "2024-01-15T10:00:00Z",
    },
];

export const projects: Project[] = [
    {
        id: "p1",
        municipality_id: "m1",
        title: "Rekonstrukce administrativního skladu",
        slug: "rekonstrukce-administrativniho-skladu",
        status: "published",
        total_cost: 12500000,
        source_pdf_url: null,
        ai_confidence: null,
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2024-11-15T14:30:00Z",
        published_at: "2024-03-01T10:00:00Z",
        content: {
            meta: {
                status: "V realizaci",
                updateDate: "15. 11. 2024",
            },
            blocks: [
                {
                    id: "b-hero-1",
                    type: "hero",
                    data: {
                        title: "Rekonstrukce administrativního skladu",
                        lead: "Kompletní přestavba historického skladu na moderní administrativní zázemí obecního úřadu. Projekt zahrnuje zateplení, novou fasádu, výměnu oken a kompletní rekonstrukci interiéru.",
                        imageUrl: "/images/black.png",
                        imageCaption: "Vizualizace budoucí podoby administrativního skladu po rekonstrukci",
                    }
                },
                {
                    id: "b-stats-1",
                    type: "stats",
                    data: [
                        { label: "Zhotovitel", value: "STRABAG a.s." },
                        { label: "Celková cena", value: "12 500 000 Kč" },
                        { label: "Financování", value: "Dotace EU 75 % + vlastní zdroje" },
                        { label: "Doba realizace", value: "03/2024 — 06/2025" },
                    ]
                },
                {
                    id: "b-cb-1",
                    type: "contentBlockRight",
                    data: {
                        id: "c1",
                        title: "Záměr projektu",
                        content:
                            "Obec Lužice se rozhodla pro rekonstrukci nevyužívaného skladu v centru obce. Budova byla ve špatném technickém stavu a nevyhovovala moderním standardům. Cílem přestavby je vytvořit důstojné administrativní zázemí pro obecní úřad, které bude energeticky úsporné a bezbariérově přístupné.",
                        imageUrl: "/images/black.png",
                        imagePosition: "right",
                    }
                },
                {
                    id: "b-cb-2",
                    type: "contentBlockLeft",
                    data: {
                        id: "c2",
                        title: "Rozsah stavebních prací",
                        content:
                            "Stavební práce zahrnují kompletní zateplení obvodového pláště budovy kontaktním zateplovacím systémem, výměnu všech oken za trojskla, rekonstrukci střechy včetně nové krytiny a instalaci fotovoltaických panelů. V interiéru dojde ke kompletní přestavbě dispozice, nové elektroinstalaci, vytápění tepelným čerpadlem a moderní vzduchotechnice.",
                        imageUrl: "/images/black.png",
                        imagePosition: "left",
                    }
                },
                {
                    id: "b-cb-3",
                    type: "contentBlockRight",
                    data: {
                        id: "c3",
                        title: "Financování a harmonogram",
                        content:
                            "Projekt je z 75 % financován z dotace Evropské unie prostřednictvím Integrovaného regionálního operačního programu (IROP). Zbývajících 25 % hradí obec z vlastních zdrojů. Stavba byla zahájena v březnu 2024, předpokládané dokončení je červen 2025. V současnosti probíhají hrubé stavební práce na interiéru.",
                        imageUrl: "/images/black.png",
                        imagePosition: "right",
                    }
                },
                {
                    id: "b-timeline-1",
                    type: "timeline",
                    data: [
                        {
                            id: "t1",
                            date: "Březen 2024",
                            title: "Zahájení stavby",
                            description:
                                "Předání staveniště zhotoviteli, zahájení bouracích prací v interiéru a příprava staveniště.",
                            images: [
                                { url: "/images/black.png", caption: "Předání staveniště" },
                                { url: "/images/black.png", caption: "Zahájení bouracích prací" },
                                { url: "/images/black.png", caption: "Stav před rekonstrukcí" },
                            ],
                        },
                        {
                            id: "t2",
                            date: "Červen 2024",
                            title: "Hrubá stavba",
                            description:
                                "Dokončení bouracích prací, nové příčky, betonáž podlah, začátek zateplení obvodového pláště.",
                            images: [
                                { url: "/images/black.png", caption: "Nové příčky v 1. NP" },
                                { url: "/images/black.png", caption: "Zateplení fasády" },
                            ],
                        },
                        {
                            id: "t3",
                            date: "Říjen 2024",
                            title: "Dokončení fasády a střechy",
                            description:
                                "Kompletní zateplení dokončeno, nová fasáda v šedém tónu, výměna oken, montáž nové skládané krytiny.",
                            images: [
                                { url: "/images/black.png", caption: "Nová fasáda" },
                                { url: "/images/black.png", caption: "Detail oken" },
                                { url: "/images/black.png", caption: "Střecha s FVE panely" },
                                { url: "/images/black.png", caption: "Celkový pohled z ulice" },
                            ],
                        },
                        {
                            id: "t4",
                            date: "Únor 2025",
                            title: "Interiérové práce",
                            description:
                                "Probíhá montáž rozvodů topení a elektřiny, osazení tepelného čerpadla, příprava pro podlahové vytápění.",
                            images: [
                                { url: "/images/black.png", caption: "Elektroinstalace" },
                                { url: "/images/black.png", caption: "Tepelné čerpadlo" },
                            ],
                        },
                    ]
                }
            ],
        },
    },
    {
        id: "p2",
        municipality_id: "m1",
        title: "Revitalizace obecního parku",
        slug: "revitalizace-obecniho-parku",
        status: "published",
        total_cost: 4200000,
        source_pdf_url: null,
        ai_confidence: null,
        created_at: "2024-05-10T10:00:00Z",
        updated_at: "2024-12-01T09:00:00Z",
        published_at: "2024-06-01T10:00:00Z",
        content: {
            meta: {
                status: "Dokončeno",
                updateDate: "1. 12. 2024",
            },
            blocks: [
                {
                    id: "b-hero-2",
                    type: "hero",
                    data: {
                        title: "Revitalizace obecního parku",
                        lead: "Obnova centrálního parku v Lužicích zahrnuje nové chodníky, mobiliář, osvětlení a výsadbu zeleně. Cílem je vytvořit příjemný prostor pro relaxaci i komunitní akce.",
                        imageUrl: "/images/black.png",
                        imageCaption: "Vizualizace obnoveného parku",
                    }
                },
                {
                    id: "b-stats-2",
                    type: "stats",
                    data: [
                        { label: "Zhotovitel", value: "Zahradní architektura s.r.o." },
                        { label: "Celková cena", value: "4 200 000 Kč" },
                        { label: "Financování", value: "SFŽP 60 % + vlastní zdroje" },
                        { label: "Doba realizace", value: "05/2024 — 11/2024" },
                    ]
                },
                {
                    id: "b-cb-4",
                    type: "contentBlockRight",
                    data: {
                        id: "c1",
                        title: "O projektu",
                        content:
                            "Park v centru Lužic prošel kompletní revitalizací. Nové mlatové chodníky nahradily původní asfaltové cesty, přibyly lavičky, odpadkové koše a nové LED osvětlení. Celkem bylo vysazeno 15 nových stromů a stovky keřů.",
                        imageUrl: "/images/black.png",
                        imagePosition: "right",
                    }
                },
                {
                    id: "b-timeline-2",
                    type: "timeline",
                    data: [
                        {
                            id: "t1",
                            date: "Květen 2024",
                            title: "Zahájení prací",
                            description: "Demolice starých chodníků a příprava terénu.",
                            images: [{ url: "/images/black.png", caption: "Příprava terénu" }],
                        },
                        {
                            id: "t2",
                            date: "Listopad 2024",
                            title: "Slavnostní otevření",
                            description: "Park byl slavnostně otevřen za účasti občanů.",
                            images: [
                                { url: "/images/black.png", caption: "Slavnostní otevření parku" },
                            ],
                        },
                    ]
                }
            ],
        },
    },
];

/* --- Helpers --- */

export function getMunicipality(slug: string) {
    return municipalities.find((m) => m.slug === slug) ?? null;
}

export function getProjectsByMunicipality(municipalityId: string) {
    return projects.filter(
        (p) => p.municipality_id === municipalityId && p.status === "published"
    );
}

export function getProject(municipalitySlug: string, projectSlug: string) {
    const municipality = getMunicipality(municipalitySlug);
    if (!municipality) return null;
    return (
        projects.find(
            (p) =>
                p.municipality_id === municipality.id &&
                p.slug === projectSlug &&
                p.status === "published"
        ) ?? null
    );
}

export function getAdjacentProjects(
    municipalityId: string,
    currentProjectId: string
) {
    const municipalityProjects = getProjectsByMunicipality(municipalityId);
    const idx = municipalityProjects.findIndex((p) => p.id === currentProjectId);

    return {
        prev: idx > 0 ? municipalityProjects[idx - 1] : null,
        next:
            idx < municipalityProjects.length - 1
                ? municipalityProjects[idx + 1]
                : null,
    };
}
