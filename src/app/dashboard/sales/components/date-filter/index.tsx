"use client";

import { useState } from "react";
import styles from "./styles.module.scss";

export type PeriodType = "day" | "week" | "month" | "custom";

export interface DateFilterProps {
  onFilterChange: (params: {
    period: PeriodType;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => void;
}

export function DateFilter({ onFilterChange }: DateFilterProps) {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [date, setDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    
    if (newPeriod !== "custom") {
      setStartDate("");
      setEndDate("");
    }
    if (newPeriod !== "day") {
      setDate("");
    }

    if (newPeriod === "day") {
      const today = new Date().toISOString().split("T")[0];
      setDate(today);
      onFilterChange({ period: newPeriod, date: today });
    } else if (newPeriod !== "custom") {
      onFilterChange({ period: newPeriod });
    }
  };

  const handleDateChange = (selectedDate: string) => {
    setDate(selectedDate);
    if (selectedDate) {
      onFilterChange({ period: "day", date: selectedDate });
    }
  };

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      onFilterChange({
        period: "custom",
        start_date: startDate,
        end_date: endDate,
      });
    }
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    setPeriod("day");
    onFilterChange({ period: "day", date: today });
  };

  return (
    <div className={styles.dateFilterContainer}>
      <div className={styles.periodButtons}>
        <button
          type="button"
          className={period === "day" ? styles.active : ""}
          onClick={() => handlePeriodChange("day")}
        >
          Dia
        </button>
        <button
          type="button"
          className={period === "week" ? styles.active : ""}
          onClick={() => handlePeriodChange("week")}
        >
          Semana
        </button>
        <button
          type="button"
          className={period === "month" ? styles.active : ""}
          onClick={() => handlePeriodChange("month")}
        >
          Mês
        </button>
        <button
          type="button"
          className={period === "custom" ? styles.active : ""}
          onClick={() => handlePeriodChange("custom")}
        >
          Personalizado
        </button>
      </div>

      <div className={styles.dateInputs}>
        {period === "day" && (
          <div className={styles.inputGroup}>
            <label htmlFor="date">Data:</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
            <button
              type="button"
              onClick={handleTodayClick}
              className={styles.todayButton}
            >
              Hoje
            </button>
          </div>
        )}

        {period === "custom" && (
          <div className={styles.customDateGroup}>
            <div className={styles.inputGroup}>
              <label htmlFor="start_date">Data Inicial:</label>
              <input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="end_date">Data Final:</label>
              <input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={handleCustomDateApply}
              disabled={!startDate || !endDate}
              className={styles.applyButton}
            >
              Aplicar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
