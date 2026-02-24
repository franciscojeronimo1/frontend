import Link from "next/link";
import styles from "./sobre.module.scss";

export const metadata = {
  title: "Sobre nós | Delivery - Gestão para seu delivery",
  description:
    "Conheça o sistema de gestão para seu delivery: pedidos, cardápio, categorias e vendas em um só lugar.",
};

export default function SobrePage() {
  return (
    <div className={styles.landing}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.logo}>CGS Delivery</span>
          <Link href="/" className={styles.loginLink}>
            Entrar
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          Sistema de gestão para seu delivery
        </h1>
        <p className={styles.heroSubtitle}>
          Controle pedidos, cardápio, categorias e vendas em um só lugar.
          Simples, rápido e feito para o dia a dia do seu negócio.
        </p>
        <Link href="/" className={styles.ctaButton}>
          Acessar o sistema
        </Link>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Como funciona</h2>
        <div className={styles.cards}>
          <div className={styles.card}>
            <span className={styles.cardNumber}>1</span>
            <h3>Organize o cardápio</h3>
            <p>
              Cadastre categorias, tamanhos e produtos. Mantenha preços e
              descrições sempre atualizados.
            </p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardNumber}>2</span>
            <h3>Registre os pedidos</h3>
            <p>
              Crie pedidos de forma rápida, acompanhe status e tenha histórico
              completo à mão.
            </p>
          </div>
          <div className={styles.card}>
            <span className={styles.cardNumber}>3</span>
            <h3>Acompanhe as vendas</h3>
            <p>
              Visualize vendas por período, analise resultados e tome decisões
              com base em dados.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>O que você pode fazer</h2>
        <ul className={styles.features}>
          <li>Gestão de categorias de produtos</li>
          <li>Cadastro de tamanhos (P, M, G, etc.)</li>
          <li>Produtos com preços e detalhes</li>
          <li>Criação e acompanhamento de pedidos</li>
          <li>Relatório de vendas por período</li>
        </ul>
      </section>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Pronto para começar?</h2>
        <p className={styles.ctaText}>
          Faça login e gerencie sua pizzaria de forma profissional.
        </p>
        <Link href="/" className={styles.ctaButton}>
          Acessar o sistema
        </Link>
      </section>


    </div>
  );
}
