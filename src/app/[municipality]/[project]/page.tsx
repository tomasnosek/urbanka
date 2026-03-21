import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
// Revalidate cached version every 60 seconds for public visitors.
// Admin requests bypass the cache by setting cookies.get('sb-*') which
// will force Next.js to mark this page as dynamic for that session.
export const revalidate = 60;
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProjectNav } from "@/components/project/ProjectNav";
import { FeedbackForm } from "@/components/project/FeedbackForm";
import { SubscribeForm } from "@/components/project/SubscribeForm";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorDock } from "@/components/editor/EditorDock";
import { BlocksContainer } from "@/components/editor/BlocksContainer";
import { ToastProvider } from "@/components/ui/ToastContext";
import { DialogProvider } from "@/components/ui/DialogContext";
import {
    getMunicipality,
    getProject,
    getAdjacentProjects,
    getProjectsByMunicipality,
} from "@/lib/queries";
import styles from "./page.module.css";

interface ProjectPageProps {
    params: Promise<{
        municipality: string;
        project: string;
    }>;
}

export async function generateMetadata(
    { params }: ProjectPageProps,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { municipality: municipalitySlug, project: projectSlug } = await params;
    const result = await getProject(municipalitySlug, projectSlug);

    if (!result) {
        return {
            title: "Projekt nenalezen | Urbanka",
            description: "Chyba: Požadovaný projekt nebyl nalezen.",
        };
    }

    const { project, municipality } = result;
    const municipalityName = municipality.name;
    const heroBlock = project.content.blocks.find((b: any) => b.type === "hero");

    // Fallbacks
    const title = heroBlock?.data?.title || project.title;
    const description = heroBlock?.data?.lead || `Detailní informace o projektu ${project.title} v obci ${municipalityName}.`;
    
    // Dynamic OG Image URL (Next.js identifies opengraph-image.tsx automatically, but we set it here too)
    const ogImageUrl = `/${municipalitySlug}/${projectSlug}/opengraph-image`;

    return {
        title: `${title} | ${municipalityName} | Urbanka`,
        description: description,
        openGraph: {
            title: title,
            description: description,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | ${municipalityName}`,
            description: description,
            images: [ogImageUrl],
        },
    };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { municipality: municipalitySlug, project: projectSlug } = await params;

    const municipality = await getMunicipality(municipalitySlug);
    if (!municipality) notFound();

    const result = await getProject(municipalitySlug, projectSlug);
    if (!result) notFound();

    const { project } = result;

    const { prev, next } = await getAdjacentProjects(
        municipality.id,
        project.id
    );

    const { meta, blocks = [] } = project.content;

    // Get municipality slug for navigation
    const municipalityProjects = await getProjectsByMunicipality(municipality.id);
    const prevProject = municipalityProjects.find((p) => p.id === prev?.id);
    const nextProject = municipalityProjects.find((p) => p.id === next?.id);

    return (
        <ToastProvider>
        <DialogProvider>
        <div className={styles.page}>
            <Header municipalityName={municipality.name} />
            <main className={styles.main}>
                <BlocksContainer
                    initialBlocks={blocks}
                    meta={meta}
                    projectId={project.id}
                    projectTitle={project.title}
                />

                <div className="layout-wrap">
                    <ProjectNav
                        municipalitySlug={municipalitySlug}
                        prev={prevProject ? { title: prevProject.title, slug: prevProject.slug } : null}
                        next={nextProject ? { title: nextProject.title, slug: nextProject.slug } : null}
                    />
                </div>

                <div className="layout-wrap">
                    <FeedbackForm projectId={project.id} />
                </div>

                <div className="layout-wrap">
                    <SubscribeForm projectId={project.id} />
                </div>
            </main>
            <Footer municipalityName={municipality.name} />
            <EditorToolbar projectId={project.id} />
            <EditorDock projectId={project.id} />
        </div>
        </DialogProvider>
        </ToastProvider>
    );
}
