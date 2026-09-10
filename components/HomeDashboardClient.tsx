"use client";

import Link from "next/link";
import AnimatedCounter from "./AnimatedCounter";
import { getWhatsAppUrl } from "@/lib/phone";

interface MonthlyTrend {
  month: string;
  fullMonth: string;
  rate: number;
  occupied: number;
  total: number;
  isCurrentMonth: boolean;
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
}

// helper --------------------------------------------------------------------------
// function HomeDashboardClient untuk merender UI Beranda secara dinamis dan kaya animasi
// input param : stats (DashboardStats)
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function HomeDashboardClient({ stats }: { stats: DashboardStats }) {
  const total = stats.totalRooms || (stats.occupiedCount + stats.availableCount + stats.maintenanceCount) || 1;
  const occupiedPercent = Math.round((stats.occupiedCount / total) * 100);
  const vacantPercent = Math.round((stats.availableCount / total) * 100);
  const maintenancePercent = Math.max(0, 100 - occupiedPercent - vacantPercent);

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

        {/* Stat Cards Grid */}
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

        {/* Jatuh Tempo & Perhatian Section */}
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
                      <p className="font-label-md text-primary">Kamar {tenant.room.number} - {tenant.name}</p>
                      <p className="font-label-sm text-on-surface-variant">Akan Jatuh Tempo</p>
                    </div>
                  </div>
                  <a
                    href={getWhatsAppUrl(tenant.phone)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-surface-container rounded-lg font-label-sm text-primary hover:bg-surface-variant transition-all duration-300 active:scale-95 inline-block"
                  >
                    Ingatkan
                  </a>
                </div>
              ))
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between border-l-4 border-brand-amber animate-slide-up stagger-2 micro-glow-amber">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tertiary-fixed rounded-full text-brand-amber">
                    <span className="material-symbols-outlined" data-icon="payments">
                      payments
                    </span>
                  </div>
                  <div>
                    <p className="font-label-md text-primary">Kamar 12</p>
                    <p className="font-label-sm text-on-surface-variant">H-3 Jatuh Tempo</p>
                  </div>
                </div>
                <button className="px-3 py-1 bg-surface-container rounded-lg font-label-sm text-primary hover:bg-surface-variant transition-all duration-300 active:scale-95">
                  Ingatkan
                </button>
              </div>
            )}

            {stats.maintenanceRoomsList.length > 0 && (
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm flex items-center justify-between border-l-4 border-error animate-slide-up stagger-4 micro-glow-red transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-error-container rounded-full text-error">
                    <span className="material-symbols-outlined" data-icon="water_drop">
                      water_drop
                    </span>
                  </div>
                  <div>
                    <p className="font-label-md text-primary">Kamar {stats.maintenanceRoomsList[0].number}</p>
                    <p className="font-label-sm text-on-surface-variant">Laporan: AC Bocor / Perbaikan</p>
                  </div>
                </div>
                <Link
                  href={`/kamar?room=${encodeURIComponent(stats.maintenanceRoomsList[0].number)}`}
                  className="px-3 py-1 bg-surface-container rounded-lg font-label-sm text-primary hover:bg-surface-variant transition-all duration-300 active:scale-95"
                >
                  Detail
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Status Kamar Visualization */}
        <section className="mb-8">
          <h2 className="font-headline-md text-headline-md text-primary mb-4 animate-slide-up stagger-3">
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

            {/* Dynamic Rolling 5-Month Bar Chart */}
            <div className="mt-6 pt-6 border-t border-surface-container-high">
              <div className="flex items-center justify-between mb-4">
                <p className="font-label-sm font-semibold text-primary">
                  Trend Okupansi 5 Bulan Terakhir
                </p>
                <span className="text-[11px] text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-md border border-outline-variant/20">
                  Data Historis
                </span>
              </div>

              <div className="flex justify-between items-end h-28 px-1 sm:px-3 pt-4">
                {(stats.monthlyTrends && stats.monthlyTrends.length > 0
                  ? stats.monthlyTrends
                  : [
                      { month: "Mei", fullMonth: "Mei 2026", rate: 50, occupied: 29, total: 58, isCurrentMonth: false },
                      { month: "Jun", fullMonth: "Juni 2026", rate: 52, occupied: 30, total: 58, isCurrentMonth: false },
                      { month: "Jul", fullMonth: "Juli 2026", rate: 53, occupied: 31, total: 58, isCurrentMonth: false },
                      { month: "Agu", fullMonth: "Agustus 2026", rate: 55, occupied: 32, total: 58, isCurrentMonth: false },
                      { month: "Sep", fullMonth: "September 2026", rate: 57, occupied: 33, total: 58, isCurrentMonth: true },
                    ]
                ).map((trend, idx) => (
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

        {/* Quick Actions Row */}
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
      </main>
    </>
  );
}
