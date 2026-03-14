import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
export const dynamic = 'force-dynamic';
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/project/HeroSection";
import { StatsBar } from "@/components/project/StatsBar";
import { ContentBlock } from "@/components/project/ContentBlock";
import { Timeline } from "@/components/project/Timeline";
import { ProjectNav } from "@/components/project/ProjectNav";
import { FeedbackForm } from "@/components/project/FeedbackForm";
import { Gallery } from "@/components/project/Gallery";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorDock } from "@/components/editor/EditorDock";
import { SectionWrapper } from "@/components/editor/SectionWrapper";
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
        <div className={styles.page}>
            <Header municipalityName={municipality.name} />
            <main className={styles.main}>
                {blocks.map((block: any, index: number) => (
                    <SectionWrapper key={block.id} blockId={block.id} projectId={project.id} blockIndex={index} totalBlocks={blocks.length}>
                        {block.type === "hero" && (
                            <HeroSection
                                title={block.data.title}
                                lead={block.data.lead}
                                imageUrl={block.data.imageUrl}
                                imageCaption={block.data.imageCaption}
                                status={meta.status}
                                updateDate={meta.updateDate}
                                projectId={project.id}
                                blockIndex={index}
                            />
                        )}
                        {block.type === "stats" && (
                            <StatsBar
                                stats={block.data}
                                projectId={project.id}
                                blockIndex={index}
                            />
                        )}
                        {(block.type === "contentBlockLeft" || block.type === "contentBlockRight") && (
                            <ContentBlock
                                block={block.data}
                                index={block.type === "contentBlockLeft" ? 1 : 0}
                                projectId={project.id}
                                blockIndex={index}
                            />
                        )}
                        {block.type === "timeline" && block.data?.length > 0 && (
                            <Timeline
                                items={block.data}
                                projectId={project.id}
                                blockIndex={index}
                            />
                        )}
                        {block.type === "gallery" && (
                            <Gallery
                                images={block.data}
                                projectId={project.id}
                                blockIndex={index}
                            />
                        )}
                    </SectionWrapper>
                ))}

                <ProjectNav
                    municipalitySlug={municipalitySlug}
                    prev={prevProject ? { title: prevProject.title, slug: prevProject.slug } : null}
                    next={nextProject ? { title: nextProject.title, slug: nextProject.slug } : null}
                />

                <FeedbackForm projectId={project.id} />
            </main>
            <Footer municipalityName={municipality.name} />
            <EditorToolbar projectId={project.id} />
            <EditorDock projectId={project.id} />
        </div>
    );
}
