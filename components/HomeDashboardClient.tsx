"use client";

import Link from "next/link";
import AnimatedCounter from "./AnimatedCounter";
import { getWhatsAppUrl } from "@/lib/phone";

interface DashboardStats {
  totalRooms: number;
  occupiedCount: number;
  availableCount: number;
  maintenanceCount: number;
  occupancyRate: number;
  dueTenants: any[];
  maintenanceRoomsList: any[];
}

// helper --------------------------------------------------------------------------
// function HomeDashboardClient untuk merender UI Beranda secara dinamis dan kaya animasi
// input param : stats (DashboardStats)
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function HomeDashboardClient({ stats }: { stats: DashboardStats }) {
  const occupiedPercent = stats.totalRooms > 0 ? Math.round((stats.occupiedCount / stats.totalRooms) * 100) : 0;
  const vacantPercent = stats.totalRooms > 0 ? Math.round((stats.availableCount / stats.totalRooms) * 100) : 0;
  const maintenancePercent = stats.totalRooms > 0 ? Math.max(0, 100 - occupiedPercent - vacantPercent) : 0;

  return (
    <>
      <main className="pt-20 md:pt-8 px-4 md:px-6 max-w-container-max mx-auto pb-28 md:pb-12">
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
                <span className="material-symbols-outlined text-brand-amber animate-pulse-slow" data-icon="key">
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
                <span className="material-symbols-outlined text-error animate-pulse-slow" data-icon="build">
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
                      <span className="material-symbols-outlined animate-pulse-slow" data-icon="payments">
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
                    <span className="material-symbols-outlined animate-pulse-slow" data-icon="water_drop">
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
              <div className="relative w-40 h-40 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container stroke-current"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="3"
                  ></path>
                  <path
                    className="text-brand-teal stroke-current donut-segment"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray={`${occupiedPercent}, 100`}
                    fill="none"
                    strokeWidth="3"
                  ></path>
                  <path
                    className="text-brand-amber stroke-current donut-segment"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray={`${vacantPercent}, 100`}
                    strokeDashoffset={`-${occupiedPercent}`}
                    fill="none"
                    strokeWidth="3"
                  ></path>
                  <path
                    className="text-error stroke-current donut-segment"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    strokeDasharray={`${maintenancePercent}, 100`}
                    strokeDashoffset={`-${occupiedPercent + vacantPercent}`}
                    fill="none"
                    strokeWidth="3"
                  ></path>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-headline-lg-mobile text-brand-deep-blue">
                    <AnimatedCounter target={stats.occupancyRate} />%
                  </span>
                  <span className="font-label-sm text-on-surface-variant">Okupansi</span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full flex justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-teal"></div>
                  <span className="font-label-sm">Terisi ({stats.occupiedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-brand-amber"></div>
                  <span className="font-label-sm">Kosong ({stats.availableCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <span className="font-label-sm">Perbaikan ({stats.maintenanceCount})</span>
                </div>
              </div>
            </div>

            {/* Mini Bar Chart */}
            <div className="mt-6 pt-6 border-t border-surface-container-high">
              <p className="font-label-sm text-on-surface-variant mb-4 text-center">
                Trend Okupansi 5 Bulan Terakhir
              </p>
              <div className="flex justify-between items-end h-20 px-2">
                <div className="w-8 bg-brand-teal/40 rounded-t-sm h-[60%] hover:bg-brand-teal transition-all duration-300 hover:scale-y-105 origin-bottom"></div>
                <div className="w-8 bg-brand-teal/40 rounded-t-sm h-[65%] hover:bg-brand-teal transition-all duration-300 hover:scale-y-105 origin-bottom"></div>
                <div className="w-8 bg-brand-teal/60 rounded-t-sm h-[50%] hover:bg-brand-teal transition-all duration-300 hover:scale-y-105 origin-bottom"></div>
                <div className="w-8 bg-brand-teal/80 rounded-t-sm h-[70%] hover:bg-brand-teal transition-all duration-300 hover:scale-y-105 origin-bottom"></div>
                <div className="w-8 bg-brand-teal rounded-t-sm h-[72%] micro-glow-teal hover:scale-y-105 origin-bottom transition-all duration-300"></div>
              </div>
              <div className="flex justify-between px-2 mt-2 font-label-sm text-on-surface-variant">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>Mei</span>
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
