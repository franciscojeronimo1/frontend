"use client";

import { useState, useEffect } from "react";
import { DateFilter, PeriodType } from "./components/date-filter";
import { SalesDisplay, SalesData } from "./components/sales-display";
import { api } from "@/services/api";
import { getCookieClient } from "@/lib/cookieClient";
import styles from "./styles.module.scss";
import { toast } from "sonner";

export default function SalesPage() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterParams, setFilterParams] = useState<{
    period: PeriodType;
    date?: string;
    start_date?: string;
    end_date?: string;
  } | null>(null);

  const fetchSales = async (params: {
    period: PeriodType;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setLoading(true);
    try {
      const token = getCookieClient();
      if (!token || typeof token !== "string") {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append("period", params.period);

      if (params.date) {
        queryParams.append("date", params.date);
      }
      if (params.start_date) {
        queryParams.append("start_date", params.start_date);
      }
      if (params.end_date) {
        queryParams.append("end_date", params.end_date);
      }

      const response = await api.get(`/order/sales?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSalesData(response.data);
    } catch (error: any) {
      console.error("Error fetching sales:", error);
      toast.error(
        error.response?.data?.message || "Erro ao buscar vendas"
      );
      setSalesData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (params: {
    period: PeriodType;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    setFilterParams(params);
    fetchSales(params);
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetchSales({ period: "day", date: today });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.salesPageContainer}>
      <h1 className={styles.pageTitle}>Vendas</h1>
      
      <DateFilter onFilterChange={handleFilterChange} />
      
      <SalesDisplay salesData={salesData} loading={loading} />
    </div>
  );
}
