"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import styles from "./styles.module.scss";

export function NewOrderFab() {
    const pathname = usePathname();

    if (pathname === "/dashboard/order") {
        return null;
    }

    return (
        <Link href="/dashboard/order" className={styles.fab} title="Novo pedido">
            <Plus size={28} />
            <span className={styles.fabLabel}>Novo pedido</span>
        </Link>
    );
}
