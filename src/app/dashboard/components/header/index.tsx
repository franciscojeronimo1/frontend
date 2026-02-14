"use client"

import Link from "next/link";
import styles from "./styles.module.scss";
import { LogOutIcon } from "lucide-react";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import {toast} from "sonner"

export function Header() {

  const router = useRouter();
  async function handleLogout() {
    deleteCookie("session", { path: "/" });
    toast.success("Deslogado com sucesso!")
    router.replace("/");
  }

  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <Link href="/dashboard" className={styles.dashboardLink}>
          Dashboard
        </Link>

        <nav>
          <Link href="/dashboard/category">Categoria</Link>
          <Link href="/dashboard/sales">Vendas</Link>
          <Link href="/dashboard/size">Tamanhos</Link>
          <Link href="/dashboard/products">Listar Produtos</Link>
          <Link href="/dashboard/product">Novo Produto</Link>
          <Link href="/dashboard/order">Criar pedido</Link>

          <form action={handleLogout}>
            <button type="submit">
              <LogOutIcon size={24} color="#fff" />
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
