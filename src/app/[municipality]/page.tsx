import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getMunicipality } from "@/lib/queries";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { ProjectGrid } from "@/components/project/ProjectGrid";
import { ProjectGridSkeleton } from "@/components/project/ProjectGridSkeleton";
import styles from "./page.module.css";

interface MunicipalityPageProps {
    params: Promise<{
        municipality: string;
    }>;
}

export async function generateMetadata({ params }: MunicipalityPageProps): Promise<Metadata> {
    const { municipality: slug } = await params;
    const municipality = await getMunicipality(slug);

    if (!municipality) {
        return {
            title: "Obec nenalezena | Urbanka",
        };
    }

    return {
        title: `Projekty města ${municipality.name} | Urbanka`,
        description: `Přehled investičních projektů pro město nebo obec ${municipality.name}.`,
    };
}

export default async function MunicipalityPage({ params }: MunicipalityPageProps) {
    const { municipality: slug } = await params;

    const municipality = await getMunicipality(slug);
    if (!municipality) {
        notFound();
        return null;
    }

    return (
        <div className={styles.page}>
            <Header municipalityName={municipality.name} />
            <main className={styles.main}>
                <h1 className={styles.title}>Investiční projekty</h1>
                <p className={styles.subtitle}>
                    Přehled investičních projektů — {municipality.name}
                </p>

                <div className={styles.grid}>
                    <Suspense fallback={<ProjectGridSkeleton municipalityId={municipality.id} municipalitySlug={slug} />}>
                        <ProjectGrid municipalityId={municipality.id} municipalitySlug={slug} />
                    </Suspense>
                </div>
            </main>
            <Footer municipalityName={municipality.name} />
            <EditorToolbar municipalityId={municipality.id} municipalitySlug={slug} />
        </div>
    );
}
