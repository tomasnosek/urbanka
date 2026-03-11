"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import styles from "./layout.module.css";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const navItems = [
        { label: "Dashboard", href: "/admin" },
        { label: "Obce", href: "/admin/municipalities" },
        { label: "Projekty", href: "/admin/projects" },
        { label: "Zpětná vazba", href: "/admin/feedback" },
    ];

    return (
        <div className={styles.adminLayout}>
            <header className={styles.adminHeader}>
                <Link href="/admin" className={styles.brand}>
                    Urbanka <span>Admin</span>
                </Link>

                <nav>
                    <ul className={styles.navList}>
                        {navItems.map((item) => (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`${styles.navLink} ${pathname === item.href ? styles.navLinkActive : ""
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <button onClick={logout} className={styles.logoutBtn}>
                    Odhlásit
                </button>
            </header>

            <main className={styles.mainContent}>{children}</main>
        </div>
    );
}
