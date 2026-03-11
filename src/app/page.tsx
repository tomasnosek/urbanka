import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getMunicipalities, getProjectsByMunicipality, getHomepageProjects } from "@/lib/queries";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Urbanka | Databáze obecních projektů",
  description: "Transparentní přehled investičních projektů vaší obce. Urbanka je moderní informační portál, který přehledně prezentuje investiční projekty obcí.",
  openGraph: {
    title: "Urbanka | Databáze obecních projektů",
    description: "Transparentní přehled investičních projektů vaší obce. Urbanka je moderní informační portál.",
    type: "website",
  }
};

export default async function Home() {
  const municipalities = await getMunicipalities();
  const featuredProjects = await getHomepageProjects(6);

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            V přípravě
          </div>
          <h1 className={styles.heroTitle}>
            Transparentní přehled investičních projektů vaší obce
          </h1>
          <p className={styles.heroLead}>
            Urbanka je moderní informační portál, který přehledně prezentuje
            investiční projekty obcí. Jednoduchý, rychlý, srozumitelný.
          </p>
        </section>

        {featuredProjects.length > 0 && (
          <section className={styles.municipalities}>
            <h2 className={styles.sectionTitle}>Vybrané projekty</h2>
            <div className={styles.municipalityGrid}>
              {featuredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/${project.municipality.slug}/${project.slug}`}
                  className={styles.projectCard}
                >
                  <div className={styles.projectCardHeader}>
                    <span className={styles.projectMunicipalityName}>{project.municipality.name}</span>
                    {project.is_featured && (
                      <span className={styles.featuredBadge}>Doporučujeme</span>
                    )}
                  </div>
                  <h3 className={styles.projectTitle}>{project.title}</h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={styles.municipalities}>
          <h2 className={styles.sectionTitle}>Zapojené obce</h2>
          <div className={styles.municipalityGrid}>
            {await Promise.all(
              municipalities.map(async (m) => {
                const projects = await getProjectsByMunicipality(m.id);
                return (
                  <Link
                    key={m.id}
                    href={`/${m.slug}`}
                    className={styles.municipalityCard}
                  >
                    <h3 className={styles.municipalityName}>{m.name}</h3>
                    <span className={styles.projectCount}>
                      {projects.length}{" "}
                      {projects.length === 1
                        ? "projekt"
                        : projects.length < 5
                          ? "projekty"
                          : "projektů"}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
