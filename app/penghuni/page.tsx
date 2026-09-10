"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getTenants, addTenant, deleteTenant } from "../actions";
import { sanitizePhoneDigits, formatPhoneDisplay, formatLiveInputPhone, getWhatsAppUrl } from "@/lib/phone";
import { calculateDueDate, formatRentTypeLabel } from "@/lib/rent";
import dynamic from "next/dynamic";

const ImportExportModal = dynamic(
  () => import("@/components/penghuni/ImportExportModal"),
  { ssr: false }
);

interface Room {
  id: string;
  number: string;
}

interface Tenant {
  id: string;
  name: string;
  phone: string;
  roomId: string;
  room: Room;
  status: "ACTIVE" | "EXPIRING_SOON" | "INACTIVE";
  dateIn: Date;
  dateDue: Date | null;
  rentType: string;
  rentAmount: number;
}

// helper --------------------------------------------------------------------------
// function Halaman Manajemen Penghuni
// input param : none
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function PenghuniPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("semua");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [newName, setNewName] = useState("");
  const [newRoom, setNewRoom] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDateIn, setNewDateIn] = useState(() => new Date().toISOString().split("T")[0]);
  const [newRentType, setNewRentType] = useState("MONTHLY");

  const [debouncedSearch, setDebouncedSearch] = useState("");

  const calculatedDueDatePreview = useMemo(() => {
    if (!newDateIn) return null;
    const d = new Date(newDateIn);
    if (isNaN(d.getTime())) return null;
    return calculateDueDate(d, newRentType);
  }, [newDateIn, newRentType]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchTenants();
  }, [debouncedSearch, filter]);

  const fetchTenants = async () => {
    const data = await getTenants(debouncedSearch, filter);
    setTenants(data as unknown as Tenant[]);
  };

  const handleImportSuccess = async () => {
    await fetchTenants();
    router.refresh();
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("roomNumber", newRoom);
    formData.append("phone", formatPhoneDisplay(newPhone));
    formData.append("dateIn", newDateIn);
    formData.append("rentType", newRentType);

    startTransition(async () => {
      await addTenant(formData);
      setNewName("");
      setNewRoom("");
      setNewPhone("");
      setNewDateIn(new Date().toISOString().split("T")[0]);
      setNewRentType("MONTHLY");
      setIsAddOpen(false);
      await fetchTenants();
    });
  };

  const handleDelete = (tenantId: string) => {
    startTransition(async () => {
      await deleteTenant(tenantId);
      setSelectedTenant(null);
      await fetchTenants();
    });
  };

  return (
    <main className="pt-20 md:pt-8 px-4 md:px-6 max-w-container-max mx-auto pb-28 md:pb-12">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-end mb-6 pt-2">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Daftar Penghuni
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Pengelolaan Data Penghuni &amp; Masa Sewa
          </p>
        </div>
        <button
          onClick={() => setIsImportExportOpen(true)}
          className="px-4 py-2.5 bg-brand-teal/10 text-brand-teal hover:bg-brand-teal/20 rounded-xl font-label-md text-sm font-bold flex items-center gap-2 transition-all active:scale-95 border border-brand-teal/20 shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">table_chart</span>
          Export / Import Excel
        </button>
      </div>

      {/* Mobile Top Action Bar */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <h1 className="font-headline-md text-headline-md text-primary font-bold">Daftar Penghuni</h1>
        <button
          onClick={() => setIsImportExportOpen(true)}
          className="px-3 py-1.5 bg-brand-teal/10 text-brand-teal rounded-lg font-label-sm text-xs font-bold flex items-center gap-1 border border-brand-teal/20"
        >
          <span className="material-symbols-outlined text-sm">table_chart</span>
          Excel
        </button>
      </div>

      {/* Header & Search */}
      <div className="mb-md animate-slide-up stagger-1">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-surface-variant text-body-md font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline"
            placeholder="Cari nama atau nomor kamar..."
            type="text"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto hide-scrollbar gap-sm mb-md pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { key: "semua", label: "Semua" },
          { key: "aktif", label: "Aktif" },
          { key: "akan_jatuh_tempo", label: "Akan Jatuh Tempo" },
          { key: "non_aktif", label: "Non-aktif" },
        ].map((chip) => {
          const isActive = filter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`shrink-0 px-4 py-2 rounded-full font-label-md text-label-md transition-all ${
                isActive
                  ? "bg-brand-teal text-white shadow-[0_4px_12px_rgba(13,148,136,0.2)]"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Tenant List */}
      <div className="space-y-4">
        {tenants.map((t, idx) => {
          const isExpiring = t.status === "EXPIRING_SOON";
          const isInactive = t.status === "INACTIVE";
          const isAboveFold = idx < 8;
          const animDelay = isAboveFold ? `${(idx * 0.03).toFixed(2)}s` : "0s";

          return (
            <div
              key={t.id}
              onClick={() => setSelectedTenant(t)}
              className={`lazy-card tenant-card swipe-action-wrapper shadow-[0px_4px_20px_rgba(15,23,42,0.05)] rounded-2xl bg-surface-container-low animate-slide-up gpu-accelerate`}
              style={{ animationDelay: animDelay }}
            >
              <div className="swipe-content p-4 rounded-2xl flex items-center gap-4 cursor-pointer">
                <div className="relative w-14 h-14 shrink-0 bg-surface-variant rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline text-2xl">
                    {isInactive ? "person_off" : "person"}
                  </span>
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface ${
                      isExpiring
                        ? "bg-error animate-pulse-soft"
                        : isInactive
                        ? "bg-outline"
                        : "bg-[#25D366]"
                    }`}
                  ></div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-headline-md text-body-lg text-primary truncate">
                    {t.name}
                  </h3>
                  <p className="font-body-md text-label-sm text-on-surface-variant truncate">
                    {t.phone}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className="px-2 py-1 bg-surface-container rounded-md font-label-sm text-label-sm text-primary">
                    Kamar {t.room?.number || "--"}
                  </span>
                  <span
                    className={`font-label-sm text-[10px] font-bold tracking-wider uppercase ${
                      isExpiring
                        ? "text-error"
                        : isInactive
                        ? "text-outline"
                        : "text-outline"
                    }`}
                  >
                    {isExpiring
                      ? "Akan Jatuh Tempo"
                      : isInactive
                      ? "Non-aktif"
                      : "Aktif"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddOpen(true)}
        className="fixed bottom-24 right-4 md:right-8 w-14 h-14 bg-secondary text-on-secondary rounded-2xl shadow-[0_8px_24px_rgba(13,148,136,0.3)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-40 animate-slide-up"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* Profile Details Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setSelectedTenant(null)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[500px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar pb-safe z-10 animate-slide-up">
            <div
              className="w-full flex justify-center pt-4 pb-2 cursor-pointer"
              onClick={() => setSelectedTenant(null)}
            >
              <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
            </div>

            <div className="px-6 pb-8">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-headline-md mb-3">
                  <span className="material-symbols-outlined text-4xl">person</span>
                </div>
                <h2 className="font-headline-lg text-headline-lg font-bold text-primary text-center">
                  {selectedTenant.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-3 py-1 bg-surface-container rounded-lg font-label-md text-label-md text-on-surface-variant">
                    Kamar {selectedTenant.room?.number || "--"}
                  </span>
                  <span className="px-3 py-1 bg-error-container text-on-error-container rounded-lg font-label-md text-label-md font-bold">
                    {selectedTenant.status}
                  </span>
                </div>
              </div>

              <a
                href={getWhatsAppUrl(selectedTenant.phone)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-4 rounded-xl bg-[#25D366] text-white font-label-md text-label-md flex items-center justify-center gap-2 mb-6 shadow-[0_4px_16px_rgba(37,211,102,0.3)] active:scale-95 transition-transform"
              >
                Hubungi via WhatsApp
              </a>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-variant">
                  <span className="material-symbols-outlined text-outline mb-2">calendar_today</span>
                  <p className="font-label-sm text-label-sm text-outline mb-1">Tanggal Masuk</p>
                  <p className="font-body-md text-body-md text-primary font-semibold">
                    {new Date(selectedTenant.dateIn).toLocaleDateString("id-ID")}
                  </p>
                </div>

                <div className="bg-error-container/20 rounded-2xl p-4 border border-error-container">
                  <span className="material-symbols-outlined text-error mb-2">event_busy</span>
                  <p className="font-label-sm text-label-sm text-error mb-1">Jatuh Tempo</p>
                  <p className="font-body-md text-body-md text-primary font-semibold">
                    {selectedTenant.dateDue
                      ? new Date(selectedTenant.dateDue).toLocaleDateString("id-ID")
                      : "-"}
                  </p>
                </div>

                <div className="col-span-2 bg-surface-container-low rounded-2xl p-4 border border-surface-variant flex items-center justify-between">
                  <div>
                    <p className="font-label-sm text-label-sm text-outline mb-1">Tipe Sewa</p>
                    <p className="font-body-md text-body-md text-primary font-semibold">
                      {formatRentTypeLabel(selectedTenant.rentType)} (Rp {selectedTenant.rentAmount.toLocaleString("id-ID")})
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary">payments</span>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={() => handleDelete(selectedTenant.id)}
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-error-container/20 border border-error-container text-error font-label-md text-label-md hover:bg-error-container/40 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">person_remove</span>
                  Hapus Penghuni
                </button>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="w-full py-3 rounded-xl bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-variant transition-colors"
                >
                  Kembali ke Daftar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tenant Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setIsAddOpen(false)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[500px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar pb-safe z-10 animate-slide-up">
            <div
              className="w-full flex justify-center pt-4 pb-2 cursor-pointer"
              onClick={() => setIsAddOpen(false)}
            >
              <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2">
              <h3 className="font-headline-md text-headline-md text-primary mb-6">
                Tambah Penghuni Baru
              </h3>
              <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">Nama</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md"
                    placeholder="Nama Lengkap"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">Nomor Kamar</label>
                  <input
                    type="text"
                    required
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md"
                    placeholder="Contoh: 15 atau Kamar 15"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">Nomor HP</label>
                  <div className="flex items-center w-full rounded-xl bg-surface-container-low border border-surface-variant focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary overflow-hidden transition-all">
                    <div className="px-3.5 py-3 bg-surface-variant/40 border-r border-surface-variant font-body-md text-primary font-bold select-none flex items-center gap-1.5 shrink-0">
                      <span className="text-sm">🇮🇩</span>
                      <span>+62</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(formatLiveInputPhone(e.target.value))}
                      className="w-full px-4 py-3 bg-transparent outline-none text-body-md font-body-md"
                      placeholder="8xx-xxxx-xxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">Tanggal Masuk</label>
                  <input
                    type="date"
                    required
                    value={newDateIn}
                    onChange={(e) => setNewDateIn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md font-body-md"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1.5 block">Tipe Sewa</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { key: "MONTHLY", label: "Bulanan" },
                      { key: "YEARLY", label: "Tahunan" },
                      { key: "SEMESTERLY", label: "Per Semester" },
                      { key: "DAILY", label: "Per Hari" },
                    ].map((item) => {
                      const isSelected = newRentType === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setNewRentType(item.key)}
                          className={`py-3 px-3 rounded-xl font-label-md text-label-md border transition-all ${
                            isSelected
                              ? "border-secondary bg-secondary/10 text-secondary font-bold shadow-sm"
                              : "border-surface-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {calculatedDueDatePreview && (
                  <div className="p-3.5 bg-secondary-container/30 border border-secondary/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-secondary">
                      <span className="material-symbols-outlined text-lg">event_available</span>
                      <span className="font-label-sm text-label-sm">Estimasi Jatuh Tempo:</span>
                    </div>
                    <span className="font-body-md text-body-md font-bold text-primary">
                      {calculatedDueDatePreview.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 mt-2 rounded-xl bg-brand-teal text-white font-label-md text-label-md shadow-md flex items-center justify-center gap-2 hover:bg-brand-deep-blue transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">person_add</span>
                  {isPending ? "Menyimpan..." : "Simpan Penghuni"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Export Excel */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        tenants={tenants}
        onSuccess={handleImportSuccess}
      />
    </main>
  );
}
