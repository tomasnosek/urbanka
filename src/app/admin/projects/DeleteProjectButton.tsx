"use client";
import styles from "../admin.module.css";
export function DeleteProjectButton() {
    return (
        <button 
           type="submit" 
           className={styles.btnSecondary} 
           style={{ fontSize: "var(--text-sm)", padding: "var(--space-1) var(--space-3)", color: "var(--color-error)", borderColor: "var(--color-error)" }}
           onClick={(e) => {
               if(!confirm('Opravdu chcete projekt nenávratně smazat?')) e.preventDefault();
           }}
        >
           Smazat
        </button>
    );
}
