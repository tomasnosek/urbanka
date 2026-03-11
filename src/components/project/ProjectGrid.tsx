import { getProjectsByMunicipality } from "@/lib/queries";
import { ProjectCard } from "./ProjectCard";
import { AddProjectSkeleton } from "./AddProjectSkeleton";

interface ProjectGridProps {
    municipalityId: string;
    municipalitySlug: string;
}

export async function ProjectGrid({ municipalityId, municipalitySlug }: ProjectGridProps) {
    const projects = await getProjectsByMunicipality(municipalityId);

    return (
        <>
            <AddProjectSkeleton municipalityId={municipalityId} municipalitySlug={municipalitySlug} />
            {projects.map((project) => (
                <ProjectCard
                    key={project.id}
                    project={project}
                    municipalitySlug={municipalitySlug}
                />
            ))}
        </>
    );
}
