"use client";

import styles from "./styles.module.scss";

export interface SalesData {
  total: number;
  period: string;
  start_date: string;
  end_date: string;
  orders_count: number;
}

interface SalesDisplayProps {
  salesData: SalesData | null;
  loading: boolean;
}

export function SalesDisplay({ salesData, loading }: SalesDisplayProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    // YYYY-MM-DD do back: interpretar como dia local (evita UTC virar dia anterior no Brasil)
    const [y, m, d] = dateString.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  if (loading) {
    return (
      <div className={styles.salesDisplayContainer}>
        <div className={styles.loading}>Carregando vendas...</div>
      </div>
    );
  }

  if (!salesData) {
    return (
      <div className={styles.salesDisplayContainer}>
        <div className={styles.emptyState}>
          Selecione um período para visualizar as vendas
        </div>
      </div>
    );
  }

  const isSameDate = salesData.start_date === salesData.end_date;

  return (
    <div className={styles.salesDisplayContainer}>
      <div className={styles.salesCards}>
        <div className={styles.salesCard}>
          <div className={styles.cardLabel}>Total de Vendas</div>
          <div className={styles.cardValue}>{formatCurrency(salesData.total)}</div>
        </div>

        <div className={styles.salesCard}>
          <div className={styles.cardLabel}>Pedidos Finalizados</div>
          <div className={styles.cardValue}>{salesData.orders_count}</div>
        </div>

        <div className={styles.salesCard}>
          <div className={styles.cardLabel}>Valor Médio por Pedido</div>
          <div className={styles.cardValue}>
            {salesData.orders_count > 0
              ? formatCurrency(salesData.total / salesData.orders_count)
              : formatCurrency(0)}
          </div>
        </div>
      </div>

      <div className={styles.periodInfo}>
        <div className={styles.periodLabel}>Período:</div>
        <div className={styles.periodDates}>
          {isSameDate ? (
            <span>{formatDate(salesData.start_date)}</span>
          ) : (
            <span>
              {formatDate(salesData.start_date)} até {formatDate(salesData.end_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
