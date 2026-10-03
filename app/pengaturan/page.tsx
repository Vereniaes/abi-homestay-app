"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPricingAndSettings, updatePricing, updateSetting, getCurrentUser, logoutUser, sendDuePaymentReminderEmailAction, triggerDueRemindersAction } from "../actions";
import { clearClientCache } from "@/lib/client-cache";

interface Pricing {
  id: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  semesterlyPrice: number;
  yearlyPrice: number;
}

interface Setting {
  id: string;
  autoWhatsappReminders: boolean;
  reminderRecipientEmail?: string;
  reminderRecipientEmails?: string[];
}

interface UserSession {
  id: string;
  username: string;
  name: string;
  email?: string | null;
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

  const [activeSheet, setActiveSheet] = useState<"PRICE" | "FACILITIES" | "EMAIL_REMINDER" | "HELP" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Pricing Form States
  const [daily, setDaily] = useState("150.000");
  const [weekly, setWeekly] = useState("900.000");
  const [monthly, setMonthly] = useState("2.500.000");
  const [semesterly, setSemesterly] = useState("8.000.000");
  const [yearly, setYearly] = useState("28.000.000");

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [summaryEmails, setSummaryEmails] = useState<string[]>(["abedenstein12@gmail.com"]);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailInputError, setEmailInputError] = useState<string | null>(null);
  const [isSavingSetting, setIsSavingSetting] = useState(false);
  const [settingFeedback, setSettingFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchData();
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      const isDark = savedTheme === "dark" || (!savedTheme && document.documentElement.classList.contains("dark"));
      setIsDarkMode(isDark);
    }
  }, []);

  const fetchData = async () => {
    const data = await getPricingAndSettings();
    if (data.pricing) {
      setPricing(data.pricing as Pricing);
      setDaily(data.pricing.dailyPrice.toLocaleString("id-ID"));
      setWeekly(data.pricing.weeklyPrice.toLocaleString("id-ID"));
      setMonthly(data.pricing.monthlyPrice.toLocaleString("id-ID"));
      setSemesterly(((data.pricing as any).semesterlyPrice || 8000000).toLocaleString("id-ID"));
      setYearly(data.pricing.yearlyPrice.toLocaleString("id-ID"));
    }
    if (data.setting) {
      setSetting(data.setting as any);
      const emails = (data.setting as any).reminderRecipientEmails;
      if (Array.isArray(emails) && emails.length > 0) {
        setSummaryEmails(emails);
      } else if ((data.setting as any).reminderRecipientEmail) {
        const parsed = (data.setting as any).reminderRecipientEmail
          .split(/[,;\s]+/)
          .map((e: string) => e.trim().toLowerCase())
          .filter((e: string) => e.includes("@"));
        if (parsed.length > 0) {
          setSummaryEmails(parsed);
        }
      }
    }
    const user = await getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk menambah email penerima ke daftar lokal
  // input param : none
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleAddRecipientEmail = () => {
    const emailToValidate = newEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailToValidate || !emailRegex.test(emailToValidate)) {
      setEmailInputError("Format email tidak valid (contoh: nama@domain.com).");
      return;
    }
    if (summaryEmails.includes(emailToValidate)) {
      setEmailInputError("Email sudah terdaftar dalam daftar penerima.");
      return;
    }
    setSummaryEmails([...summaryEmails, emailToValidate]);
    setNewEmailInput("");
    setEmailInputError(null);
    setSettingFeedback(null);
  };

  // helper --------------------------------------------------------------------------
  // function untuk menghapus email penerima dari daftar lokal
  // input param : emailToRemove (string)
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleRemoveRecipientEmail = (emailToRemove: string) => {
    if (summaryEmails.length <= 1) {
      setSettingFeedback({
        success: false,
        message: "Minimal harus ada 1 alamat email pengelola untuk menerima rekap.",
      });
      return;
    }
    setSummaryEmails(summaryEmails.filter((email) => email !== emailToRemove));
    setSettingFeedback(null);
  };

  // helper --------------------------------------------------------------------------
  // function untuk menyimpan daftar email penerima rekap ke database
  // input param : none
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleSaveSummaryEmails = async () => {
    if (summaryEmails.length === 0) {
      setSettingFeedback({ success: false, message: "Minimal harus ada 1 alamat email penerima." });
      return;
    }
    setIsSavingSetting(true);
    setSettingFeedback(null);
    try {
      const res = await updateSetting(
        setting?.id || "default",
        setting?.autoWhatsappReminders ?? true,
        summaryEmails.join(", "),
        summaryEmails
      );
      if (res) {
        setSetting(res as any);
        setSettingFeedback({
          success: true,
          message: `${summaryEmails.length} email penerima rekap berhasil diperbarui.`,
        });
      } else {
        setSettingFeedback({ success: false, message: "Gagal menyimpan daftar email pengelola." });
      }
    } catch (err: any) {
      setSettingFeedback({ success: false, message: err?.message || "Terjadi kesalahan." });
    } finally {
      setIsSavingSetting(false);
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk memproses logout pengguna dari halaman Pengaturan
  // input param : none
  // output : void (menghapus cookie dan mengarahkan ke /login)
  // end of helper ------------------------------------------------------------------
  const handleLogout = async () => {
    clearClientCache();
    await logoutUser();
    window.location.href = "/login";
  };

  const handleToggleDarkMode = (checked: boolean) => {
    setIsDarkMode(checked);
    if (checked) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk memicu pengiriman email rekap jatuh tempo sewa ke email pengelola
  // input param : none
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleTriggerEmailReminder = async () => {
    setIsSendingEmail(true);
    setEmailFeedback(null);
    try {
      const result = await sendDuePaymentReminderEmailAction();
      setEmailFeedback({
        success: result.success,
        message: result.message,
      });
    } catch (error: any) {
      setEmailFeedback({
        success: false,
        message: error?.message || "Gagal memproses pengiriman email.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricing) return;

    const d = parseFloat(daily.replace(/[^0-9]/g, ""));
    const w = parseFloat(weekly.replace(/[^0-9]/g, ""));
    const m = parseFloat(monthly.replace(/[^0-9]/g, ""));
    const s = parseFloat(semesterly.replace(/[^0-9]/g, "")) || 14000000;
    const y = parseFloat(yearly.replace(/[^0-9]/g, ""));

    startTransition(async () => {
      await updatePricing(pricing.id, d, w, m, s, y);
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
        {currentUser?.email && (
          <p className="font-body-md text-label-sm text-on-surface-variant mt-2 flex items-center gap-1 justify-center">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            {currentUser.email}
          </p>
        )}
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

          <div className="w-full h-[1px] bg-surface-container-low my-1 ml-14"></div>

          <button
            onClick={() => {
              setTestEmailResult(null);
              setActiveSheet("EMAIL_REMINDER");
            }}
            className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">mark_email_read</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container group-hover:text-secondary transition-colors">
                  Email Pengingat (H-3)
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Notifikasi otomatis jatuh tempo sewa
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
            Tampilan &amp; Sistem
          </h3>

          {/* Email Reminder Trigger Row */}
          <div className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container">
                  Pengingat Email
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[200px] md:max-w-none">
                  Kirim rekap tagihan ke {summaryEmails.length} pengelola ({summaryEmails.slice(0, 2).join(", ")}{summaryEmails.length > 2 ? ", dll" : ""})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTriggerEmailReminder}
              disabled={isSendingEmail}
              className="px-3 py-1.5 bg-brand-teal text-white hover:bg-brand-teal/90 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 shrink-0 shadow-sm"
            >
              <span className={`material-symbols-outlined text-sm ${isSendingEmail ? "animate-spin" : ""}`}>
                {isSendingEmail ? "sync" : "send"}
              </span>
              <span>{isSendingEmail ? "Mengirim..." : "Kirim Rekap"}</span>
            </button>
          </div>

          {emailFeedback && (
            <div className={`mx-3 mb-2 p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              emailFeedback.success
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                : "bg-error-container/20 text-error border-error-container"
            }`}>
              <span className="material-symbols-outlined text-sm shrink-0">
                {emailFeedback.success ? "check_circle" : "error"}
              </span>
              <span className="flex-1">{emailFeedback.message}</span>
              <button
                type="button"
                onClick={() => setEmailFeedback(null)}
                className="opacity-70 hover:opacity-100"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          <div className="w-full h-[1px] bg-surface-container-low my-1 ml-14"></div>

          <button
            type="button"
            onClick={() => router.push("/users")}
            className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                <span className="material-symbols-outlined">manage_accounts</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container group-hover:text-secondary transition-colors">
                  Manajemen Pengguna
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Daftar user, peran (role), dan email pengelola
                </p>
              </div>
            </div>
            <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">
              chevron_right
            </span>
          </button>

          <div className="w-full h-[1px] bg-surface-container-low my-1 ml-14"></div>

          <div className="w-full flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-container/5 flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined">dark_mode</span>
              </div>
              <div className="text-left">
                <p className="font-body-md text-body-md font-medium text-primary-container">
                  Mode Gelap
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  Tampilan tema gelap aplikasi
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                type="checkbox"
                id="toggle-dark-mode"
                checked={isDarkMode}
                onChange={(e) => handleToggleDarkMode(e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer z-10 top-1 left-1 checked:left-auto checked:right-1"
                style={{
                  borderColor: "#f2f4f6",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              />
              <label
                htmlFor="toggle-dark-mode"
                className="toggle-label block overflow-hidden h-8 rounded-full bg-surface-container-low cursor-pointer"
              ></label>
            </div>
          </div>

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
          <button 
            onClick={() => setActiveSheet("HELP")}
            className="menu-item w-full flex items-center justify-between p-3 rounded-lg hover:premium-glow group bg-surface-container-lowest"
          >
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
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveSheet(null) }}
        >
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
                      readOnly={currentUser?.role === "VIEW"}
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
                      readOnly={currentUser?.role === "VIEW"}
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
                      readOnly={currentUser?.role === "VIEW"}
                      onChange={(e) => setMonthly(e.target.value)}
                      className="w-full bg-surface rounded-lg border border-surface-container-high py-3 pl-10 pr-4 font-body-md text-primary-container focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1">
                    Tarif 6 Bulan (Semesteran)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={semesterly}
                      readOnly={currentUser?.role === "VIEW"}
                      onChange={(e) => setSemesterly(e.target.value)}
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
                      readOnly={currentUser?.role === "VIEW"}
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
                  {currentUser?.role !== "VIEW" && (
                    <button
                      type="submit"
                      disabled={isPending}
                      className="flex-1 py-3 px-4 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md text-center shadow-md shadow-secondary/20 hover:bg-secondary-container hover:text-secondary-fixed-variant transition-colors premium-glow"
                    >
                      {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup: Fasilitas & Inventaris */}
      {activeSheet === "FACILITIES" && (
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveSheet(null) }}
        >
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

      {/* Modal Popup: Email Pengingat Otomatis (H-3) */}
      {activeSheet === "EMAIL_REMINDER" && (
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveSheet(null) }}
        >
          <div
            onClick={() => setActiveSheet(null)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[540px] bg-surface-container-lowest z-10 rounded-t-3xl md:rounded-3xl shadow-2xl pt-2 pb-safe max-h-[85vh] overflow-y-auto hide-scrollbar animate-slide-up">
            <div
              className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4 cursor-pointer"
              onClick={() => setActiveSheet(null)}
            ></div>
            <div className="px-md pb-6">
              <h2 className="font-headline-md text-headline-md text-primary-container mb-4 flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-brand-teal">mark_email_read</span>
                Email Pengingat &amp; Rekap Tagihan
              </h2>

              <div className="space-y-4">
                {/* Form Input Email Penerima Rekap */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high space-y-3">
                  <div>
                    <label className="block text-body-sm font-bold text-primary">
                      Daftar Email Penerima Rekap ({summaryEmails.length})
                    </label>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Laporan rekapitulasi harian tagihan akan dikirimkan ke seluruh email di bawah:
                    </p>
                  </div>

                  {/* List of current emails */}
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {summaryEmails.map((email, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 px-3 rounded-xl bg-surface-container-lowest border border-surface-variant/60 shadow-xs group"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="material-symbols-outlined text-brand-teal text-[18px]">mail</span>
                          <span className="text-body-sm font-medium text-on-surface truncate">{email}</span>
                        </div>
                        {currentUser?.role !== "VIEW" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipientEmail(email)}
                            disabled={summaryEmails.length <= 1}
                            title={summaryEmails.length <= 1 ? "Minimal 1 email diperlukan" : "Hapus email ini"}
                            className="p-1 rounded-lg text-outline hover:text-error hover:bg-error-container/20 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-outline cursor-pointer disabled:cursor-not-allowed"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Form Tambah Email Baru */}
                  {currentUser?.role !== "VIEW" && (
                    <div className="space-y-1.5 pt-2 border-t border-surface-variant/40">
                      <label className="block text-xs font-semibold text-on-surface-variant">
                        Tambah Alamat Email Baru
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={newEmailInput}
                          onChange={(e) => {
                            setNewEmailInput(e.target.value);
                            setEmailInputError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddRecipientEmail();
                            }
                          }}
                          placeholder="pengelola.baru@gmail.com"
                          className="flex-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-sm font-medium text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddRecipientEmail}
                          className="px-4 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-deep-blue transition-all active:scale-95 shrink-0 flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Tambah
                        </button>
                      </div>
                      {emailInputError && (
                        <p className="text-xs text-error font-medium">{emailInputError}</p>
                      )}
                    </div>
                  )}

                  {/* Tombol Simpan Daftar */}
                  {currentUser?.role !== "VIEW" && (
                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSavingSetting}
                        onClick={handleSaveSummaryEmails}
                        className="w-full py-2.5 bg-secondary text-on-secondary rounded-xl text-xs font-bold hover:bg-secondary/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        {isSavingSetting ? "Menyimpan..." : "Simpan Perubahan Penerima"}
                      </button>
                    </div>
                  )}

                  {settingFeedback && (
                    <p className={`text-xs font-medium ${settingFeedback.success ? "text-emerald-600 dark:text-emerald-400" : "text-error"}`}>
                      {settingFeedback.message}
                    </p>
                  )}
                </div>

                {/* Status Card */}
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-teal text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <span className="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <div>
                    <h4 className="font-title-sm font-bold text-primary">Jadwal Pengiriman Otomatis</h4>
                    <p className="text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Sistem memeriksa database setiap hari pukul <strong>08:00 WIB</strong> (via Cloud Scheduler &amp; Brevo API). Pengingat dikirim ke masing-masing penghuni (H-5, H-3, H-1, Hari H, H+1, H+3, H+7) dan laporan rekap dikirim ke email pengelola di atas.
                    </p>
                  </div>
                </div>

                {/* Information Card */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high text-body-sm text-on-surface-variant space-y-2">
                  <p className="font-semibold text-primary">Ketentuan Pengiriman:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs leading-relaxed text-outline">
                    <li>Alamat email dapat diisi pada form <strong>Tambah / Edit Penghuni</strong>.</li>
                    <li>Jika email tidak diisi, sistem akan otomatis melewati penghuni tersebut.</li>
                    <li>Email pengingat berisi rincian kamar, tipe sewa, nominal tagihan, dan nomor rekening transfer.</li>
                  </ul>
                </div>

                {/* Test Action Section */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isTestingEmail || currentUser?.role === "VIEW"}
                    onClick={async () => {
                      setIsTestingEmail(true);
                      setTestEmailResult(null);
                      try {
                        const res = await triggerDueRemindersAction();
                        setTestEmailResult(res);
                      } catch (err: any) {
                        setTestEmailResult({ success: false, message: err?.message || "Gagal memproses." });
                      } finally {
                        setIsTestingEmail(false);
                      }
                    }}
                    className="w-full py-3.5 px-4 rounded-xl bg-brand-teal text-white font-label-md text-label-md font-bold flex items-center justify-center gap-2 hover:bg-brand-deep-blue transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {isTestingEmail ? "hourglass_top" : "send"}
                    </span>
                    {isTestingEmail ? "Sedang Memeriksa & Mengirim..." : "Uji Coba Kirim Pengingat H-3 Sekarang"}
                  </button>

                  {/* Test Result Display */}
                  {testEmailResult && (
                    <div className={`mt-3 p-4 rounded-xl border text-body-sm animate-slide-up ${
                      testEmailResult.success 
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-800 dark:text-teal-200" 
                        : "bg-error-container/40 border-error/30 text-on-error-container"
                    }`}>
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <span className="material-symbols-outlined text-base">
                          {testEmailResult.success ? "check_circle" : "error"}
                        </span>
                        <span>{testEmailResult.message || (testEmailResult.success ? "Berhasil!" : "Gagal!")}</span>
                      </div>
                      {testEmailResult.success && (
                        <p className="text-xs opacity-90">
                          {testEmailResult.totalMatched === 0 
                            ? "Tidak ada penghuni yang tepat jatuh tempo dalam 3 hari ke depan saat ini." 
                            : `Berhasil mengirim ${testEmailResult.sentCount} email dari ${testEmailResult.totalMatched} penghuni yang jatuh tempo.`}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSheet(null)}
                    className="w-full py-3 px-4 rounded-xl border border-outline-variant/50 text-primary font-label-md text-label-md hover:bg-surface-variant transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup: Pusat Bantuan */}
      {activeSheet === "HELP" && (
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveSheet(null) }}
        >
          <div
            onClick={() => setActiveSheet(null)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[600px] bg-surface-container-lowest z-10 rounded-t-3xl md:rounded-3xl shadow-2xl pt-2 pb-safe max-h-[85vh] overflow-y-auto hide-scrollbar animate-slide-up">
            <div
              className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mb-4 cursor-pointer"
              onClick={() => setActiveSheet(null)}
            ></div>
            <div className="px-md pb-6">
              <h2 className="font-headline-md text-headline-md text-primary-container mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">help</span>
                Pusat Bantuan &amp; Tutorial
              </h2>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Tutorial 1: Penghuni */}
                <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30">
                  <h3 className="font-title-md text-primary-container flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-sm">group_add</span>
                    </div>
                    1. Mengelola Penghuni
                  </h3>
                  <ul className="list-disc list-outside text-body-sm text-on-surface-variant space-y-2 ml-5">
                    <li>Buka menu <strong className="text-primary-container">Penghuni</strong> dari navigasi bawah.</li>
                    <li>Klik tombol <strong className="text-primary-container">"Tambah Penghuni Baru"</strong> untuk mendaftarkan penyewa.</li>
                    <li>Isi formulir seperti nama, nomor WhatsApp (gunakan format 08xxx), dan pilih kamar yang tersedia.</li>
                    <li>Penyewa akan otomatis menempati kamar tersebut dan tagihan akan dihitung secara otomatis.</li>
                    <li>Untuk mengeluarkan (checkout) penghuni, klik tombol silang (Hapus/Checkout) pada kartu penghuni.</li>
                  </ul>
                </div>

                {/* Tutorial 2: Kamar */}
                <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30">
                  <h3 className="font-title-md text-primary-container flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-sm">meeting_room</span>
                    </div>
                    2. Manajemen Kamar
                  </h3>
                  <ul className="list-disc list-outside text-body-sm text-on-surface-variant space-y-2 ml-5">
                    <li>Buka menu <strong className="text-primary-container">Kamar</strong> untuk melihat status seluruh kamar.</li>
                    <li>Kamar berstatus <strong>Kosong</strong> berwarna hijau, <strong>Terisi</strong> berwarna biru, dan <strong>Perbaikan</strong> berwarna merah.</li>
                    <li>Klik <strong className="text-primary-container">Edit Kamar</strong> untuk mengubah status (misal dari Kosong ke Perbaikan jika ada kerusakan) atau untuk mengubah catatan fasilitas khusus di kamar tersebut.</li>
                  </ul>
                </div>

                {/* Tutorial 3: Transaksi */}
                {currentUser?.role === "ADMIN" && (
                  <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/30">
                    <h3 className="font-title-md text-primary-container flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary text-sm">receipt_long</span>
                      </div>
                      3. Mencatat Pembayaran
                    </h3>
                    <ul className="list-disc list-outside text-body-sm text-on-surface-variant space-y-2 ml-5">
                      <li>Buka menu <strong className="text-primary-container">Laporan</strong>, lalu klik tombol plus <strong className="text-primary-container">"Tambah Transaksi"</strong>.</li>
                      <li>Pilih jenis <strong className="text-primary-container">Pemasukan</strong> (untuk bayar uang kos) atau <strong className="text-primary-container">Pengeluaran</strong> (untuk operasional).</li>
                      <li>Pilih nama penghuni yang membayar, lalu isikan nominal pembayarannya.</li>
                      <li>Anda bisa mengunggah foto struk/bukti transfer bank dengan menekan tombol <strong>"Upload Bukti Transaksi"</strong>.</li>
                      <li>Transaksi akan terekam dan tanggal jatuh tempo tagihan penghuni akan otomatis diperbarui!</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md text-center hover:bg-secondary-container hover:text-secondary-fixed-variant transition-colors premium-glow"
                >
                  Saya Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
