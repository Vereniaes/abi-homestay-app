"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPricingAndSettings, updatePricing, updateSetting, getCurrentUser, logoutUser } from "../actions";

interface Pricing {
  id: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  yearlyPrice: number;
}

interface Setting {
  id: string;
  autoWhatsappReminders: boolean;
}

interface UserSession {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "EDIT" | "VIEW";
}

const FACILITIES_LIST = [
  "Kamar mandi dalam (shower)",
  "AC",
  "TV",
  "Lemari",
  "Meja + Kursi",
  "CCTV",
  "WIFI",
  "Dapur umum",
  "Halaman luas",
  "Air",
];

// helper --------------------------------------------------------------------------
// function Halaman Pengaturan & Operasional
// input param : none
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function PengaturanPage() {
  const router = useRouter();
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const [activeSheet, setActiveSheet] = useState<"PRICE" | "FACILITIES" | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pricing Form States
  const [daily, setDaily] = useState("150.000");
  const [weekly, setWeekly] = useState("900.000");
  const [monthly, setMonthly] = useState("2.500.000");
  const [yearly, setYearly] = useState("28.000.000");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const data = await getPricingAndSettings();
    if (data.pricing) {
      setPricing(data.pricing);
      setDaily(data.pricing.dailyPrice.toLocaleString("id-ID"));
      setWeekly(data.pricing.weeklyPrice.toLocaleString("id-ID"));
      setMonthly(data.pricing.monthlyPrice.toLocaleString("id-ID"));
      setYearly(data.pricing.yearlyPrice.toLocaleString("id-ID"));
    }
    if (data.setting) {
      setSetting(data.setting);
    }
    const user = await getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk memproses logout pengguna dari halaman Pengaturan
  // input param : none
  // output : void (menghapus cookie dan mengarahkan ke /login)
  // end of helper ------------------------------------------------------------------
  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
    router.refresh();
  };

  const handleToggleAutoWhatsapp = (checked: boolean) => {
    if (!setting) return;
    setSetting({ ...setting, autoWhatsappReminders: checked });
    startTransition(async () => {
      await updateSetting(setting.id, checked);
    });
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricing) return;

    const d = parseFloat(daily.replace(/[^0-9]/g, ""));
    const w = parseFloat(weekly.replace(/[^0-9]/g, ""));
    const m = parseFloat(monthly.replace(/[^0-9]/g, ""));
    const y = parseFloat(yearly.replace(/[^0-9]/g, ""));

    startTransition(async () => {
      await updatePricing(pricing.id, d, w, m, y);
      setActiveSheet(null);
      await fetchData();
    });
  };

  return (
    <main className="flex-1 w-full max-w-container-max mx-auto px-4 md:px-6 pt-28 md:pt-8 pb-28 md:pb-12">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-end mb-6 pt-2">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Pengaturan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Konfigurasi Operasional &amp; Sistem
          </p>
        </div>
      </div>

      {/* Header Profile */}
      <section className="flex flex-col items-center justify-center pt-md pb-lg text-center relative z-10 animate-slide-up stagger-1">
        <div className="w-14 h-14 rounded-full bg-secondary-container/50 text-secondary font-bold text-xl flex items-center justify-center mb-3 border border-secondary/30 shadow-soft-teal">
          {currentUser ? currentUser.name.charAt(0).toUpperCase() : "A"}
        </div>
        <h2 className="font-headline-md text-headline-md text-primary-container mb-1 font-bold">
          {currentUser ? currentUser.name : "Abi Homestay Pusat"}
        </h2>
        <div className="inline-flex items-center gap-2 bg-secondary text-on-secondary font-label-sm text-label-sm px-3 py-1 rounded-full shadow-sm">
          {currentUser ? currentUser.role : "Administrator"}
        </div>
      </section>

      {/* Settings Cards */}
      <div className="space-y-sm md:grid md:grid-cols-2 md:gap-gutter md:space-y-0">
        {/* Operasional Group */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-sm border border-surface-container-low mb-sm md:mb-0 animate-slide-up stagger-2">
          <h3 className="font-label-md text-label-md text-on-surface-variant mb-3 px-2 uppercase tracking-wider">
            Operasional
          </h3>

          <button
            onClick={() => setActiveSheet("PRICE")}
            className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">sell</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container group-hover:text-secondary transition-colors">
                  Master Harga Sewa
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Atur tarif harian s/d tahunan
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
              chevron_right
            </span>
          </button>

          <div className="w-full h-[1px] bg-surface-container-low my-1 ml-14"></div>

          <button
            onClick={() => setActiveSheet("FACILITIES")}
            className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">chair</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container group-hover:text-secondary transition-colors">
                  Fasilitas &amp; Inventaris
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Daftar inventaris default kamar
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
              chevron_right
            </span>
          </button>
        </div>

        {/* Sistem Group */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-sm border border-surface-container-low animate-slide-up stagger-3">
          <h3 className="font-label-md text-label-md text-on-surface-variant mb-3 px-2 uppercase tracking-wider">
            Sistem &amp; Keamanan
          </h3>

          <div className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container">
                  Auto-WhatsApp Reminders
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Tagihan &amp; info otomatis
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                id="toggle1"
                checked={setting?.autoWhatsappReminders || false}
                onChange={(e) => handleToggleAutoWhatsapp(e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 top-1 left-1 checked:left-auto checked:right-1"
                style={{
                  borderColor: "#f2f4f6",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />
              <label
                htmlFor="toggle1"
                className="toggle-label block overflow-hidden h-8 rounded-full bg-surface-container-low cursor-pointer"
              ></label>
            </div>
          </div>

          <div className="w-full h-[1px] bg-surface-container-low my-1 ml-14"></div>

          <button className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">shield</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container group-hover:text-secondary transition-colors">
                  Keamanan Akun
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Password &amp; Akses staf
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
              chevron_right
            </span>
          </button>

          <div className="w-full h-[1px] bg-surface-container-low my-1 ml-14"></div>

          <button
            type="button"
            onClick={handleLogout}
            className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:bg-error-container/20 group bg-surface-container-lowest transition-colors press-effect"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-error-container/40 flex items-center justify-center text-error group-hover:bg-error-container group-hover:text-on-error-container transition-colors">
                <span className="material-symbols-outlined">logout</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-bold text-error">
                  Keluar dari Akun
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Akhiri sesi penggunaan aplikasi
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-error/60 group-hover:text-error transition-colors">
              chevron_right
            </span>
          </button>
        </div>

        {/* Support Group */}
        <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-sm border border-surface-container-low md:col-span-2 mt-sm md:mt-0 animate-slide-up stagger-4">
          <button className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">help</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container group-hover:text-secondary transition-colors">
                  Pusat Bantuan
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
              chevron_right
            </span>
          </button>
        </div>
      </div>

      {/* Modal Popup: Master Harga Sewa */}
      {activeSheet === "PRICE" && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setActiveSheet(null)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[500px] bg-surface-container-lowest z-10 rounded-t-3xl md:rounded-3xl shadow-2xl pt-2 pb-safe max-h-[85vh] overflow-y-auto hide-scrollbar animate-slide-up">
            <div
              className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4 cursor-pointer"
              onClick={() => setActiveSheet(null)}
            ></div>
            <div className="px-md pb-6">
              <h2 className="font-headline-md text-headline-md text-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">sell</span>
                Master Harga Sewa
              </h2>

              <form onSubmit={handleSavePricing} className="space-y-4">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                    Tarif Harian
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={daily}
                      onChange={(e) => setDaily(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-surface-container-high py-3 pl-10 pr-4 font-body-md text-primary-container focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                    Tarif Mingguan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={weekly}
                      onChange={(e) => setWeekly(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-surface-container-high py-3 pl-10 pr-4 font-body-md text-primary-container focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                    Tarif Bulanan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={monthly}
                      onChange={(e) => setMonthly(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-surface-container-high py-3 pl-10 pr-4 font-body-md text-primary-container focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                    Tarif Tahunan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={yearly}
                      onChange={(e) => setYearly(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-surface-container-high py-3 pl-10 pr-4 font-body-md text-primary-container focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-primary-container text-primary-container font-label-md text-label-md text-center hover:bg-surface-variant transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 px-4 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md text-center shadow-md shadow-secondary/20 hover:bg-secondary-container hover:text-secondary-fixed-variant transition-colors premium-glow"
                  >
                    {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup: Fasilitas & Inventaris */}
      {activeSheet === "FACILITIES" && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setActiveSheet(null)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[500px] bg-surface-container-lowest z-10 rounded-t-3xl md:rounded-3xl shadow-2xl pt-2 pb-safe max-h-[85vh] overflow-y-auto hide-scrollbar animate-slide-up">
            <div
              className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4 cursor-pointer"
              onClick={() => setActiveSheet(null)}
            ></div>
            <div className="px-md pb-6">
              <h2 className="font-headline-md text-headline-md text-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">chair</span>
                Fasilitas &amp; Inventaris
              </h2>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {FACILITIES_LIST.map((facility) => (
                  <div key={facility} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary">check_circle</span>
                    <span className="font-body-md text-on-surface">{facility}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-surface-variant text-on-surface-variant font-label-md text-label-md text-center hover:bg-surface-container-high transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
