"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getCurrentUser, logoutUser, getNotificationAlerts } from "@/app/actions";
import { getWhatsAppUrl } from "@/lib/phone";

interface UserSession {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "EDIT" | "VIEW";
}

interface NotificationAlerts {
  dueTenants: any[];
  maintenanceRooms: any[];
  totalAlerts: number;
}

// helper --------------------------------------------------------------------------
// function untuk menampilkan navigasi aplikasi (TopAppBar, BottomNavBar, SideNav, Profil & Notifikasi)
// input param : none
// output : React component JSX Navigasi
// end of helper ------------------------------------------------------------------
export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [formattedDate] = useState(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date().toLocaleDateString("id-ID", options);
  });
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [alerts, setAlerts] = useState<NotificationAlerts>({
    dueTenants: [],
    maintenanceRooms: [],
    totalAlerts: 0,
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Memuat profil pengguna aktif dari cookie sesi
    getCurrentUser().then((user: UserSession | null) => {
      if (user) {
        setCurrentUser(user);
      }
    });

    // Memuat data notifikasi operasional (jatuh tempo & perbaikan)
    getNotificationAlerts().then((res) => {
      if (res) {
        setAlerts(res);
      }
    });
  }, [pathname]);

  // helper --------------------------------------------------------------------------
  // function untuk menutup popover notifikasi saat mengklik di luar area popover
  // input param : none
  // output : void (listener event document)
  // end of helper ------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen]);

  // helper --------------------------------------------------------------------------
  // function untuk menangani aksi logout pengguna
  // input param : none
  // output : void (menghapus cookie dan mengarahkan ke /login)
  // end of helper ------------------------------------------------------------------
  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    { label: "Beranda", href: "/", icon: "home" },
    { label: "Kamar", href: "/kamar", icon: "bed" },
    { label: "Penghuni", href: "/penghuni", icon: "group" },
    { label: "Laporan", href: "/laporan", icon: "analytics" },
    { label: "Pengaturan", href: "/pengaturan", icon: "settings" },
  ];

  const getTitle = () => {
    switch (pathname) {
      case "/kamar":
        return "Manajemen Kamar";
      case "/penghuni":
        return "Daftar Penghuni";
      case "/laporan":
        return "Laporan Keuangan";
      case "/pengaturan":
        return "Pengaturan";
      case "/users":
        return "Manajemen User";
      default:
        return "Beranda";
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk mendapatkan style badge warna berdasarkan role pengguna
  // input param : role (string)
  // output : string (kelas css tailwind untuk background, text, & border)
  // end of helper ------------------------------------------------------------------
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#0F172A] text-[#FCD34D] border-amber-400/40";
      case "EDIT":
        return "bg-secondary-container/40 text-secondary border-secondary/30";
      default:
        return "bg-surface-container-high text-outline border-outline-variant/40";
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk merender Tombol Lonceng Notifikasi & Popover Dropdown dengan posisi adaptif
  // input param : position ("mobile" | "desktop")
  // output : React JSX Component Popover Notifikasi
  // end of helper ------------------------------------------------------------------
  const renderNotificationWidget = (position: "mobile" | "desktop") => {
    const popoverPositionClass =
      position === "mobile"
        ? "right-0 top-12 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px]"
        : "left-full top-0 ml-3 w-[360px] max-w-[360px]";

    return (
      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          title="Pemberitahuan / Notifikasi"
          className="relative p-2 rounded-full hover:bg-surface-variant/40 text-on-surface-variant hover:text-secondary transition-all duration-300 flex items-center justify-center press-effect"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {alerts.totalAlerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-error text-on-error text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-surface">
              {alerts.totalAlerts}
            </span>
          )}
        </button>

        {/* Popover Dropdown Notifikasi */}
        {isNotificationOpen && (
          <div
            className={`absolute ${popoverPositionClass} bg-white border border-outline-variant/40 rounded-2xl shadow-xl z-50 p-4 text-on-surface`}
          >
            {/* Header Popover */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">
                  notifications_active
                </span>
                <h3 className="font-headline-md text-label-md font-bold text-on-surface">
                  Pemberitahuan
                </h3>
                {alerts.totalAlerts > 0 && (
                  <span className="px-2 py-0.5 bg-error-container text-on-error-container text-[10px] font-extrabold rounded-full">
                    {alerts.totalAlerts} Baru
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Body List Notifikasi */}
            <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
              {alerts.totalAlerts === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-outline">
                  <span className="material-symbols-outlined text-3xl mb-1 text-secondary/60">
                    check_circle
                  </span>
                  <p className="text-label-md font-medium">Tidak ada pemberitahuan baru</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    Semua tagihan sewa dan kondisi kamar dalam keadaan baik.
                  </p>
                </div>
              ) : (
                <>
                  {/* Daftar Tenant Jatuh Tempo */}
                  {alerts.dueTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="p-3 bg-tertiary-fixed/30 border border-brand-amber/30 rounded-xl flex items-center justify-between gap-2 transition-all hover:bg-tertiary-fixed/50"
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <div className="p-1.5 bg-tertiary-fixed rounded-lg text-brand-amber shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-base">payments</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-label-sm font-bold text-on-surface truncate">
                            Kamar {tenant.room?.number || "-"} - {tenant.name}
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-medium">
                            Akan Jatuh Tempo
                          </span>
                        </div>
                      </div>
                      <a
                        href={getWhatsAppUrl(tenant.phone)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsNotificationOpen(false)}
                        className="px-2.5 py-1 bg-secondary text-on-secondary rounded-lg text-[11px] font-semibold hover:bg-on-secondary-fixed-variant transition-all shrink-0 active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xs">chat</span>
                        <span>Ingatkan</span>
                      </a>
                    </div>
                  ))}

                  {/* Daftar Kamar Perbaikan */}
                  {alerts.maintenanceRooms.map((room) => (
                    <div
                      key={room.id}
                      className="p-3 bg-error-container/20 border border-error/20 rounded-xl flex items-center justify-between gap-2 transition-all hover:bg-error-container/30"
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <div className="p-1.5 bg-error-container rounded-lg text-error shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-base">build</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-label-sm font-bold text-on-surface truncate">
                            Kamar {room.number}
                          </span>
                          <span className="text-[11px] text-error font-medium">
                            Perlu Perbaikan / Maintenance
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/kamar?room=${encodeURIComponent(room.number)}`}
                        onClick={() => setIsNotificationOpen(false)}
                        className="px-2.5 py-1 bg-surface-container-high text-on-surface rounded-lg text-[11px] font-semibold hover:bg-surface-variant transition-all shrink-0 active:scale-95 flex items-center gap-1"
                      >
                        <span>Detail</span>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* TopAppBar (Mobile & Tablet) */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-md py-sm bg-[#F8FAFC]/98 border-b border-outline-variant/20 shadow-sm transition-colors duration-200 md:hidden">
        <div className="flex items-center gap-sm">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary tracking-tight">
              {getTitle()}
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && (
            <div className="flex items-center gap-1.5 bg-surface-container/80 border border-outline-variant/40 px-2.5 py-1 rounded-full">
              <span className="text-[11px] font-bold text-on-surface">
                {currentUser.name}
              </span>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getRoleBadgeStyle(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
          )}

          {/* Tombol & Popover Notifikasi Mobile di pojok paling kanan */}
          {renderNotificationWidget("mobile")}
        </div>
      </header>

      {/* Desktop SideNav */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface shadow-sm z-40 pt-md px-4 pb-4 border-r border-outline-variant/30">
        <div className="flex items-center justify-between mb-xl px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center shadow-soft-teal">
              <span className="material-symbols-outlined text-white text-sm" data-icon="apartment">
                apartment
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-primary font-bold">
              Abi Homestay
            </span>
          </div>

          {/* Tombol & Popover Notifikasi Desktop */}
          {renderNotificationWidget("desktop")}
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "text-secondary bg-secondary-container/20 font-semibold"
                    : "text-on-surface-variant hover:bg-surface-variant/50"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span className="font-label-md text-label-md">{item.label}</span>
              </Link>
            );
          })}

          {currentUser?.role === "ADMIN" && (
            <>
              <div className="mt-4 mb-2 px-4">
                <span className="text-[10px] font-bold text-outline tracking-widest uppercase">
                  Administrator
                </span>
              </div>
              <Link
                href="/users"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  pathname === "/users"
                    ? "text-on-primary bg-primary font-semibold shadow-md"
                    : "text-on-surface-variant hover:bg-surface-variant/50"
                }`}
              >
                <span className="material-symbols-outlined" style={pathname === "/users" ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  manage_accounts
                </span>
                <span className="font-label-md text-label-md">Manajemen User</span>
              </Link>
            </>
          )}
        </nav>

        {/* User Profile Box Footer */}
        <div className="pt-4 border-t border-outline-variant/30">
          {currentUser ? (
            <div className="flex items-center p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-secondary-container/40 flex items-center justify-center text-secondary font-bold text-sm shrink-0 border border-secondary/30">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-label-md font-bold text-on-surface truncate">
                    {currentUser.name}
                  </span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border w-fit ${getRoleBadgeStyle(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-secondary text-on-secondary font-semibold rounded-xl text-label-md shadow-soft-teal hover:bg-on-secondary-fixed-variant transition-all"
            >
              <span className="material-symbols-outlined text-lg">login</span>
              <span>Masuk Aplikasi</span>
            </Link>
          )}
        </div>
      </aside>

      {/* BottomNavBar (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1 sm:px-3 pb-safe pt-1.5 bg-[#F8FAFC]/98 border-t border-outline-variant/20 shadow-[0px_-4px_20px_rgba(15,23,42,0.05)] rounded-t-xl md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-1.5 sm:px-3 py-1 transition-colors duration-100 active:scale-95 ${
                isActive
                  ? "text-secondary bg-secondary-container/30 rounded-xl font-bold"
                  : "text-on-surface-variant hover:text-secondary-fixed-variant"
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px] sm:text-[24px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium leading-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
