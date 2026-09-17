"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import AnimatedCounter from "./AnimatedCounter";
import { getWhatsAppUrl } from "@/lib/phone";
import { getCurrentUser } from "@/app/actions";
import { getClientCache, setClientCache } from "@/lib/client-cache";

interface MonthlyTrend {
  month: string;
  fullMonth: string;
  rate: number;
  occupied: number;
  total: number;
  isCurrentMonth: boolean;
}

interface FinancialTransaction {
  date: string | Date;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

interface DashboardStats {
  totalRooms: number;
  occupiedCount: number;
  availableCount: number;
  maintenanceCount: number;
  occupancyRate: number;
  monthlyTrends?: MonthlyTrend[];
  dueTenants: any[];
  maintenanceRoomsList: any[];
  financialTransactions?: FinancialTransaction[];
}

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// helper --------------------------------------------------------------------------
// function HomeDashboardClient untuk merender UI Beranda secara dinamis dan kaya animasi
// input param : stats (DashboardStats)
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function HomeDashboardClient({ 
  stats, 
  userRole 
}: { 
  stats: DashboardStats; 
  userRole?: string; 
}) {
  const [currentRole, setCurrentRole] = useState<string | undefined>(() => {
    if (userRole) return userRole;
    const cachedUser = getClientCache<{ role: string }>("currentUser");
    return cachedUser?.role;
  });

  useEffect(() => {
    if (!currentRole) {
      getCurrentUser().then((user) => {
        if (user) {
          setCurrentRole(user.role);
          setClientCache("currentUser", user);
        }
      });
    }
  }, [currentRole]);

  const isAdmin = currentRole === "ADMIN";

  const total = stats.totalRooms || (stats.occupiedCount + stats.availableCount + stats.maintenanceCount) || 1;
  const occupiedPercent = Math.round((stats.occupiedCount / total) * 100);
  const vacantPercent = Math.round((stats.availableCount / total) * 100);
  const maintenancePercent = Math.round((stats.maintenanceCount / total) * 100);

  // Financial Period Filter States (Mendukung 5 siklus: Harian, Mingguan, Bulanan, 6 Bulan, Tahunan)
  const now = new Date();
  const [filterMode, setFilterMode] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "SEMESTERLY" | "YEARLY">("MONTHLY");
  const [selectedDailyDate, setSelectedDailyDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedWeek, setSelectedWeek] = useState<number>(() => {
    const d = now.getDate();
    if (d <= 7) return 1;
    if (d <= 14) return 2;
    if (d <= 21) return 3;
    if (d <= 28) return 4;
    return 5;
  });
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(() => (now.getMonth() < 6 ? 1 : 2));

  // Dynamic Year Options (2024 to current year + 2)
  const availableYears = useMemo(() => {
    const currentYr = now.getFullYear();
    const years = [];
    for (let y = 2024; y <= Math.max(currentYr + 1, 2026); y++) {
      years.push(y);
    }
    return years;
  }, [now]);

  // Financial Computations based on the 5 filter cycles
  const financialData = useMemo(() => {
    const txs = stats.financialTransactions || [];

    // 1. Filter current selected period transactions
    const currentPeriodTxs = txs.filter((tx) => {
      const d = new Date(tx.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      const dateNum = d.getDate();

      if (filterMode === "DAILY") {
        const targetD = new Date(selectedDailyDate);
        return (
          y === targetD.getFullYear() &&
          m === targetD.getMonth() &&
          dateNum === targetD.getDate()
        );
      }

      if (filterMode === "WEEKLY") {
        if (y !== selectedYear || m !== selectedMonth) return false;
        if (selectedWeek === 1) return dateNum >= 1 && dateNum <= 7;
        if (selectedWeek === 2) return dateNum >= 8 && dateNum <= 14;
        if (selectedWeek === 3) return dateNum >= 15 && dateNum <= 21;
        if (selectedWeek === 4) return dateNum >= 22 && dateNum <= 28;
        return dateNum >= 29;
      }

      if (filterMode === "MONTHLY") {
        return y === selectedYear && m === selectedMonth;
      }

      if (filterMode === "SEMESTERLY") {
        if (y !== selectedYear) return false;
        return selectedSemester === 1 ? m >= 0 && m <= 5 : m >= 6 && m <= 11;
      }

      // YEARLY
      return y === selectedYear;
    });

    const income = currentPeriodTxs
      .filter((t) => t.type === "INCOME")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = currentPeriodTxs
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const netProfit = income - expense;
    const profitMargin = income > 0 ? Math.round(((income - expense) / income) * 100) : (expense > 0 ? -100 : 0);

    // 2. Calculate previous period for comparison & growth rate
    let prevIncome = 0;
    if (filterMode === "DAILY") {
      const targetD = new Date(selectedDailyDate);
      targetD.setDate(targetD.getDate() - 1);
      prevIncome = txs
        .filter((tx) => {
          const d = new Date(tx.date);
          return (
            d.getFullYear() === targetD.getFullYear() &&
            d.getMonth() === targetD.getMonth() &&
            d.getDate() === targetD.getDate() &&
            tx.type === "INCOME"
          );
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
    } else if (filterMode === "WEEKLY") {
      let prevW = selectedWeek - 1;
      let prevM = selectedMonth;
      let prevY = selectedYear;
      if (prevW < 1) {
        prevW = 4;
        prevM = selectedMonth === 0 ? 11 : selectedMonth - 1;
        prevY = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      }
      prevIncome = txs
        .filter((tx) => {
          const d = new Date(tx.date);
          const y = d.getFullYear();
          const m = d.getMonth();
          const dateNum = d.getDate();
          if (y !== prevY || m !== prevM || tx.type !== "INCOME") return false;
          if (prevW === 1) return dateNum >= 1 && dateNum <= 7;
          if (prevW === 2) return dateNum >= 8 && dateNum <= 14;
          if (prevW === 3) return dateNum >= 15 && dateNum <= 21;
          if (prevW === 4) return dateNum >= 22 && dateNum <= 28;
          return dateNum >= 29;
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
    } else if (filterMode === "MONTHLY") {
      const prevM = selectedMonth === 0 ? 11 : selectedMonth - 1;
      const prevY = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
      prevIncome = txs
        .filter((tx) => {
          const d = new Date(tx.date);
          return d.getFullYear() === prevY && d.getMonth() === prevM && tx.type === "INCOME";
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
    } else if (filterMode === "SEMESTERLY") {
      const prevSem = selectedSemester === 1 ? 2 : 1;
      const prevY = selectedSemester === 1 ? selectedYear - 1 : selectedYear;
      prevIncome = txs
        .filter((tx) => {
          const d = new Date(tx.date);
          const y = d.getFullYear();
          const m = d.getMonth();
          if (y !== prevY || tx.type !== "INCOME") return false;
          return prevSem === 1 ? m >= 0 && m <= 5 : m >= 6 && m <= 11;
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
    } else {
      // YEARLY
      const prevY = selectedYear - 1;
      prevIncome = txs
        .filter((tx) => {
          const d = new Date(tx.date);
          return d.getFullYear() === prevY && tx.type === "INCOME";
        })
        .reduce((acc, curr) => acc + curr.amount, 0);
    }

    let growthPercent: number | null = null;
    if (prevIncome > 0) {
      growthPercent = Math.round(((income - prevIncome) / prevIncome) * 100);
    }

    const totalVolume = income + expense;
    const incomeRatio = totalVolume > 0 ? Math.round((income / totalVolume) * 100) : 100;
    const expenseRatio = totalVolume > 0 ? 100 - incomeRatio : 0;

    return {
      income,
      expense,
      netProfit,
      profitMargin,
      growthPercent,
      prevIncome,
      incomeRatio,
      expenseRatio,
      txCount: currentPeriodTxs.length,
    };
  }, [
    stats.financialTransactions,
    filterMode,
    selectedDailyDate,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedSemester,
  ]);

  const periodLabel = useMemo(() => {
    if (filterMode === "DAILY") {
      const d = new Date(selectedDailyDate);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
        : selectedDailyDate;
    }
    if (filterMode === "WEEKLY") {
      const weekRanges = [
        "Tgl 1 - 7",
        "Tgl 8 - 14",
        "Tgl 15 - 21",
        "Tgl 22 - 28",
        "Tgl 29 - Akhir",
      ];
      return `Minggu ke-${selectedWeek} (${weekRanges[selectedWeek - 1]}), ${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`;
    }
    if (filterMode === "MONTHLY") {
      return `${MONTH_NAMES_ID[selectedMonth]} ${selectedYear}`;
    }
    if (filterMode === "SEMESTERLY") {
      return `Semester ${selectedSemester} (${selectedSemester === 1 ? "Jan - Jun" : "Jul - Des"}) ${selectedYear}`;
    }
    return `Tahun ${selectedYear}`;
  }, [filterMode, selectedDailyDate, selectedWeek, selectedMonth, selectedSemester, selectedYear]);

  return (
    <>
      <main className="pt-28 md:pt-8 px-4 md:px-6 max-w-container-max mx-auto pb-28 md:pb-12">
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-end mb-6 pt-2">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
              Beranda
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              Ringkasan Operasional Abi Homestay
            </p>
          </div>
        </div>

        {/* 1. Stat Cards Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 pt-2">
          {/* Total Kamar */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col justify-between micro-glow-blue transition-all duration-300 hover:scale-[1.02] animate-slide-up stagger-1">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-brand-deep-blue" data-icon="meeting_room">
                  meeting_room
                </span>
              </div>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant">Total Kamar</p>
              <p className="text-3xl sm:text-4xl md:text-display-lg font-bold text-brand-deep-blue mt-1">
                <AnimatedCounter target={stats.totalRooms} />
              </p>
            </div>
          </div>

          {/* Terisi */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col justify-between micro-glow-teal transition-all duration-300 hover:scale-[1.02] animate-slide-up stagger-2">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-brand-teal" data-icon="bed">
                  bed
                </span>
              </div>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant">Terisi</p>
              <p className="text-3xl sm:text-4xl md:text-display-lg font-bold text-brand-teal mt-1">
                <AnimatedCounter target={stats.occupiedCount} />
              </p>
            </div>
          </div>

          {/* Kosong */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col justify-between micro-glow-amber transition-all duration-300 hover:scale-[1.02] animate-slide-up stagger-3">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-brand-amber" data-icon="key">
                  key
                </span>
              </div>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant">Kosong</p>
              <p className="text-3xl sm:text-4xl md:text-display-lg font-bold text-brand-amber mt-1">
                <AnimatedCounter target={stats.availableCount} />
              </p>
            </div>
          </div>

          {/* Perlu Perbaikan */}
          <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] flex flex-col justify-between micro-glow-red transition-all duration-300 hover:scale-[1.02] animate-slide-up stagger-4">
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center">
                <span className="material-symbols-outlined text-error" data-icon="build">
                  build
                </span>
              </div>
            </div>
            <div>
              <p className="font-label-md text-on-surface-variant">Perbaikan</p>
              <p className="text-3xl sm:text-4xl md:text-display-lg font-bold text-error mt-1">
                <AnimatedCounter target={stats.maintenanceCount} />
              </p>
            </div>
          </div>
        </section>

        {/* 2. Jatuh Tempo & Perhatian Section (HANYA Penghuni Jatuh Tempo) */}
        <section className="mb-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-4 animate-slide-up stagger-2">
            Jatuh Tempo &amp; Perhatian
          </h2>
          <div className="flex flex-col gap-3">
            {stats.dueTenants.length > 0 ? (
              stats.dueTenants.map((tenant: any) => (
                <div
                  key={tenant.id}
                  className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between border-l-4 border-brand-amber animate-slide-up stagger-2 micro-glow-amber transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-tertiary-fixed rounded-full text-brand-amber">
                      <span className="material-symbols-outlined" data-icon="payments">
                        payments
                      </span>
                    </div>
                    <div>
                      <p className="font-label-md text-primary font-semibold">Kamar {tenant.room.number} - {tenant.name}</p>
                      <p className="font-label-sm text-on-surface-variant">Akan Jatuh Tempo</p>
                    </div>
                  </div>
                  <a
                    href={getWhatsAppUrl(tenant.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-surface-container rounded-lg font-label-sm text-primary font-bold hover:bg-surface-variant transition-all duration-300 active:scale-95 inline-block"
                  >
                    Ingatkan
                  </a>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-center border-l-4 border-brand-teal animate-slide-up stagger-2">
                <p className="font-label-md text-on-surface-variant text-center">Tidak ada penyewa yang akan jatuh tempo dalam waktu dekat.</p>
              </div>
            )}
          </div>
        </section>

        {/* 3. Laporan Keuangan Persentase & Ringkasan Section (Mendukung 5 Siklus Sewa) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-headline-md text-headline-md text-primary">
                Laporan Keuangan
              </h2>
              <p className="font-label-sm text-on-surface-variant">
                Ringkasan Arus Kas &amp; Persentase Keuntungan
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/laporan"
                className="px-3 py-1.5 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl font-label-sm font-bold flex items-center gap-1 transition-all active:scale-95"
              >
                <span>Lihat Detail</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant/20 animate-slide-up stagger-3">
            {/* Period Filter Controls: 5 Siklus */}
            <div className="space-y-3 pb-4 mb-5 border-b border-outline-variant/20">
              {/* Mode Switcher Chips (Harian, Mingguan, Bulanan, 6 Bulan, Tahunan) */}
              <div className="flex overflow-x-auto hide-scrollbar gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant/30">
                {[
                  { key: "DAILY", label: "Harian" },
                  { key: "WEEKLY", label: "Mingguan" },
                  { key: "MONTHLY", label: "Bulanan" },
                  { key: "SEMESTERLY", label: "6 Bulan" },
                  { key: "YEARLY", label: "Tahunan" },
                ].map((item) => {
                  const isActive = filterMode === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilterMode(item.key as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        isActive
                          ? "bg-brand-teal text-white shadow-sm"
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Parameter Selectors */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* 1. Harian Selector */}
                {filterMode === "DAILY" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="date"
                      value={selectedDailyDate}
                      onChange={(e) => setSelectedDailyDate(e.target.value)}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedDailyDate(new Date().toISOString().split("T")[0])}
                      className="px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-variant text-[11px] font-bold text-on-surface-variant transition-colors"
                    >
                      Hari Ini
                    </button>
                  </div>
                )}

                {/* 2. Mingguan Selector */}
                {filterMode === "WEEKLY" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      <option value={1}>Minggu 1 (Tgl 1 - 7)</option>
                      <option value={2}>Minggu 2 (Tgl 8 - 14)</option>
                      <option value={3}>Minggu 3 (Tgl 15 - 21)</option>
                      <option value={4}>Minggu 4 (Tgl 22 - 28)</option>
                      <option value={5}>Minggu 5 (Tgl 29 - Akhir)</option>
                    </select>

                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      {MONTH_NAMES_ID.map((name, idx) => (
                        <option key={name} value={idx}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 3. Bulanan Selector */}
                {filterMode === "MONTHLY" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      {MONTH_NAMES_ID.map((name, idx) => (
                        <option key={name} value={idx}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Semester (6 Bulan) Selector */}
                {filterMode === "SEMESTERLY" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2)}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      <option value={1}>Semester 1 (Januari - Juni)</option>
                      <option value={2}>Semester 2 (Juli - Desember)</option>
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 5. Tahunan Selector */}
                {filterMode === "YEARLY" && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-1.5 text-xs font-semibold text-primary outline-none focus:border-brand-teal transition-all"
                    >
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              {/* Total Pendapatan */}
              <div className="p-4 rounded-xl bg-[#0D9488]/10 border border-[#0D9488]/20 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Uang Masuk</span>
                  <span className="p-1.5 rounded-lg bg-[#0D9488]/20 text-brand-teal">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                  </span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-brand-teal">
                    <AnimatedCounter target={financialData.income} formatCurrency={true} />
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5 truncate font-medium" title={periodLabel}>
                    {periodLabel}
                  </p>
                </div>
              </div>

              {/* Total Pengeluaran */}
              <div className="p-4 rounded-xl bg-error-container/20 border border-error/20 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Uang Keluar</span>
                  <span className="p-1.5 rounded-lg bg-error-container text-error">
                    <span className="material-symbols-outlined text-sm">trending_down</span>
                  </span>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-error">
                    <AnimatedCounter target={financialData.expense} formatCurrency={true} />
                  </p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Biaya operasional
                  </p>
                </div>
              </div>

              {/* Keuntungan Bersih */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-on-surface-variant">Sisa Kas / Bersih</span>
                  <span className="p-1.5 rounded-lg bg-brand-deep-blue/10 text-brand-deep-blue dark:text-teal-400">
                    <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                  </span>
                </div>
                <div>
                  <p className={`text-xl sm:text-2xl font-bold ${financialData.netProfit >= 0 ? "text-brand-teal" : "text-error"}`}>
                    <AnimatedCounter target={financialData.netProfit} formatCurrency={true} />
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${financialData.profitMargin >= 0 ? "bg-teal-500/10 text-brand-teal" : "bg-error/10 text-error"}`}>
                      {financialData.profitMargin}% Margin
                    </span>
                    {financialData.growthPercent !== null && (
                      <span className={`text-[10px] font-bold ${financialData.growthPercent >= 0 ? "text-brand-teal" : "text-error"}`}>
                        {financialData.growthPercent >= 0 ? `+${financialData.growthPercent}%` : `${financialData.growthPercent}%`} vs lalu
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ratio Bar */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant mb-1.5">
                <span>Rasio Aliran Dana</span>
                <span>{financialData.incomeRatio}% Masuk vs {financialData.expenseRatio}% Keluar</span>
              </div>
              <div className="w-full h-3 rounded-full bg-surface-container-high overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${financialData.incomeRatio}%` }}
                  className="h-full bg-gradient-to-r from-brand-teal to-[#0d9488] transition-all duration-500"
                  title={`Uang Masuk: ${financialData.incomeRatio}%`}
                />
                <div
                  style={{ width: `${financialData.expenseRatio}%` }}
                  className="h-full bg-error transition-all duration-500"
                  title={`Uang Keluar: ${financialData.expenseRatio}%`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Quick Actions Row (DITUKAR: BERADA DI ATAS STATUS KAMAR) */}
        <section className="mb-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-4 animate-slide-up stagger-4">
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-2 gap-4 animate-slide-up stagger-4">
            <Link
              href="/penghuni"
              className="bg-gradient-to-br from-brand-teal to-[#0f766e] text-on-primary rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm transition-transform duration-200 active:scale-95 micro-glow-teal"
            >
              <span className="material-symbols-outlined text-3xl" data-icon="person_add">
                person_add
              </span>
              <span className="font-label-md text-center">Tambah Penghuni</span>
            </Link>
            <Link
              href="/laporan"
              className="bg-gradient-to-br from-brand-deep-blue to-[#1e293b] text-on-primary rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm transition-transform duration-200 active:scale-95 micro-glow-blue"
            >
              <span className="material-symbols-outlined text-3xl" data-icon="request_quote">
                request_quote
              </span>
              <span className="font-label-md text-center">Catat Pembayaran</span>
            </Link>
          </div>
        </section>

        {/* 5. Status Kamar Visualization (DITUKAR: BERADA DI PALING BAWAH HALAMAN) */}
        <section className="mb-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-4 animate-slide-up stagger-4">
            Status Kamar
          </h2>
          <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0px_4px_20px_rgba(15,23,42,0.05)] animate-slide-up stagger-4">
            <div className="flex flex-col items-center">
              {/* SVG Donut Chart */}
              <div className="relative w-44 h-44 mb-6">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-surface-container stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3.2"
                  />
                  {/* Segment: Terisi */}
                  {occupiedPercent > 0 && (
                    <path
                      className="text-brand-teal stroke-current donut-segment transition-all duration-700 ease-out"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      strokeDasharray={`${occupiedPercent}, 100`}
                      strokeDashoffset="0"
                      fill="none"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                    />
                  )}
                  {/* Segment: Kosong */}
                  {vacantPercent > 0 && (
                    <path
                      className="text-brand-amber stroke-current donut-segment transition-all duration-700 ease-out"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      strokeDasharray={`${vacantPercent}, 100`}
                      strokeDashoffset={`-${occupiedPercent}`}
                      fill="none"
                      strokeWidth="3.4"
                      strokeLinecap={maintenancePercent === 0 ? "round" : "butt"}
                    />
                  )}
                  {/* Segment: Perbaikan */}
                  {maintenancePercent > 0 && (
                    <path
                      className="text-error stroke-current donut-segment transition-all duration-700 ease-out"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      strokeDasharray={`${maintenancePercent}, 100`}
                      strokeDashoffset={`-${occupiedPercent + vacantPercent}`}
                      fill="none"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-brand-deep-blue font-headline-lg tracking-tight">
                    <AnimatedCounter target={stats.occupancyRate} />%
                  </span>
                  <span className="font-label-sm text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Okupansi
                  </span>
                </div>
              </div>

              {/* Legend with Badges */}
              <div className="w-full grid grid-cols-3 gap-2 bg-surface-container-low/70 rounded-xl p-3 border border-outline-variant/20">
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-teal shrink-0"></div>
                    <span className="font-label-sm font-semibold text-primary">Terisi</span>
                  </div>
                  <span className="font-body-md text-sm font-bold text-brand-teal">
                    {stats.occupiedCount} <span className="text-[11px] font-normal text-on-surface-variant">({occupiedPercent}%)</span>
                  </span>
                </div>

                <div className="flex flex-col items-center text-center border-x border-outline-variant/30">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-amber shrink-0"></div>
                    <span className="font-label-sm font-semibold text-primary">Kosong</span>
                  </div>
                  <span className="font-body-md text-sm font-bold text-brand-amber">
                    {stats.availableCount} <span className="text-[11px] font-normal text-on-surface-variant">({vacantPercent}%)</span>
                  </span>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-error shrink-0"></div>
                    <span className="font-label-sm font-semibold text-primary">Perbaikan</span>
                  </div>
                  <span className="font-body-md text-sm font-bold text-error">
                    {stats.maintenanceCount} <span className="text-[11px] font-normal text-on-surface-variant">({maintenancePercent}%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Current Month Bar Chart */}
            <div className="mt-6 pt-6 border-t border-surface-container-high">
              <div className="flex items-center justify-between mb-4">
                <p className="font-label-sm font-semibold text-primary">
                  Okupansi Bulan Ini
                </p>
                <span className="text-[11px] text-brand-teal bg-teal-500/10 px-2 py-0.5 rounded-md border border-brand-teal/20">
                  Data Aktif
                </span>
              </div>

              <div className="flex justify-between items-end h-28 px-1 sm:px-3 pt-4">
                {(stats.monthlyTrends || []).map((trend, idx) => (
                  <div key={`${trend.month}-${idx}`} className="group relative flex flex-col items-center flex-1 h-full justify-end">
                    {/* Tooltip Hover Bubble */}
                    <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 bg-primary text-on-primary text-[10px] font-medium py-1 px-2 rounded-md shadow-lg whitespace-nowrap -translate-y-1 group-hover:translate-y-0">
                      {trend.fullMonth}: {trend.rate}% ({trend.occupied}/{trend.total} kamar)
                    </div>

                    {/* Rate text above bar */}
                    <span className={`text-[11px] mb-1.5 transition-colors ${
                      trend.isCurrentMonth
                        ? "font-bold text-brand-teal"
                        : "font-medium text-on-surface-variant group-hover:text-primary"
                    }`}>
                      {trend.rate}%
                    </span>

                    {/* Bar Pill */}
                    <div
                      style={{ height: `${Math.max(14, trend.rate)}%` }}
                      className={`w-8 sm:w-11 rounded-t-md transition-all duration-300 origin-bottom group-hover:scale-y-105 ${
                        trend.isCurrentMonth
                          ? "bg-gradient-to-t from-brand-teal to-[#0d9488] shadow-sm ring-2 ring-brand-teal/30 micro-glow-teal"
                          : "bg-brand-teal/35 group-hover:bg-brand-teal/70"
                      }`}
                    />

                    {/* Month Label */}
                    <span className={`text-xs mt-2 transition-colors ${
                      trend.isCurrentMonth
                        ? "font-bold text-brand-teal"
                        : "font-medium text-on-surface-variant group-hover:text-primary"
                    }`}>
                      {trend.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
