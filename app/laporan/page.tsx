"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { getTransactions, getTenants, addTransaction } from "../actions";
import AnimatedCounter from "@/components/AnimatedCounter";

interface Tenant {
  id: string;
  name: string;
  room?: { number: string };
}

interface Transaction {
  id: string;
  refId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  paymentMethod: string;
  rentType: string | null;
  description: string | null;
  proofUrl: string | null;
  date: Date;
  tenant?: Tenant | null;
  room?: { number: string } | null;
}

// helper --------------------------------------------------------------------------
// function Halaman Laporan Keuangan & Tagihan
// input param : none
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [paymentType, setPaymentType] = useState("MONTHLY");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [txData, tenantData] = await Promise.all([
        getTransactions(),
        getTenants("", "semua"),
      ]);
      setTransactions(txData as unknown as Transaction[]);
      setTenants(tenantData as unknown as Tenant[]);
    } catch (err) {
      console.error("Gagal memuat data laporan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = useMemo(() => {
    return transactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [transactions]);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("type", txType);
    formData.append("tenantId", selectedTenantId);
    formData.append("rentType", txType === "EXPENSE" ? expenseDescription : paymentType);
    formData.append("amount", amount);
    
    if (selectedFile) {
      if (selectedFile.size > 1 * 1024 * 1024) {
        alert("Maaf, ukuran gambar terlalu besar (Maksimal 1MB). Silakan kompres atau pilih gambar lain.");
        return;
      }
      formData.append("file", selectedFile);
    }

    startTransition(async () => {
      await addTransaction(formData);
      setIsModalOpen(false);
      setAmount("");
      setExpenseDescription("");
      setSelectedFile(null);
      setSelectedTenantId("");
      await fetchData();
    });
  };

  return (
    <main className="flex-1 px-4 md:px-6 py-6 max-w-container-max mx-auto w-full pt-20 md:pt-8 pb-28 md:pb-12">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-end mb-6 pt-2">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Ringkasan Transaksi &amp; Catatan Pembayaran
          </p>
        </div>
      </div>

      {/* Top Section: Pendapatan */}
      <section className="mb-8 pt-2">
        <div className="relative bg-primary-container rounded-3xl p-6 overflow-hidden shadow-lg border border-outline-variant/20">
          <div className="absolute inset-0 bg-chart-pattern opacity-60"></div>
          <div className="relative z-10">
            <p className="text-inverse-primary text-label-md uppercase tracking-wider mb-2">
              Pendapatan Bulan Ini
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-on-primary text-body-lg font-semibold">Rp</span>
              {isLoading ? (
                <div className="h-10 w-44 rounded-xl skeleton-shimmer my-1 opacity-60"></div>
              ) : (
                <h2 className="text-on-primary text-2xl sm:text-3xl md:text-[40px] leading-tight font-bold tracking-tight animate-slide-up">
                  <AnimatedCounter target={totalRevenue} formatCurrency={true} />
                </h2>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-secondary-fixed">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              <span className="text-label-sm">+12.5% vs bulan lalu</span>
            </div>
          </div>
        </div>
      </section>

      {/* Primary Action */}
      <section className="mb-8 px-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full h-14 rounded-2xl bg-teal-gradient shadow-soft-teal scale-on-press transition-transform flex items-center justify-center gap-3 text-on-primary group"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">add</span>
          </div>
          <span className="font-bold text-body-lg tracking-wide">Catat Pembayaran</span>
        </button>
      </section>

      {/* Transaction History */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-headline-md font-bold text-primary-container text-[20px]">
            Riwayat Transaksi Terbaru
          </h3>
          <button className="text-secondary text-label-md font-semibold hover:underline">
            Lihat Semua
          </button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <div className="h-20 rounded-2xl skeleton-shimmer w-full"></div>
              <div className="h-20 rounded-2xl skeleton-shimmer w-full"></div>
              <div className="h-20 rounded-2xl skeleton-shimmer w-full"></div>
            </>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-2xl border border-surface-variant text-on-surface-variant">
              <p className="font-medium text-body-md">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            transactions.map((tx, idx) => {
            const isExpanded = expandedId === tx.id;
            const isAboveFold = idx < 6;
            const animDelay = isAboveFold ? `${((idx + 1) * 0.05).toFixed(2)}s` : "0s";

            return (
              <div
                key={tx.id}
                onClick={() => toggleAccordion(tx.id)}
                className="lazy-card transaction-card bg-surface rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-surface-variant cursor-pointer transition-colors hover:bg-surface-container-lowest gpu-accelerate"
                style={{ animationDelay: animDelay }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        tx.type === "INCOME"
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-error-container/40 text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {tx.type === "INCOME" ? "account_balance_wallet" : "payments"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-body-md">
                        {tx.tenant ? `${tx.tenant.name} - Kamar ${tx.room?.number || "--"}` : "Transaksi Umumi"}
                      </h4>
                      <p className="text-on-surface-variant text-label-sm">
                        {tx.paymentMethod} • {new Date(tx.date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`font-bold text-body-lg ${tx.type === "INCOME" ? "text-secondary" : "text-error"}`}>
                      {tx.type === "INCOME" ? "+" : "-"}Rp {tx.amount.toLocaleString("id-ID")}
                    </p>
                    <span
                      className={`material-symbols-outlined text-outline text-[20px] transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expanded Accordion Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-surface-variant flex gap-4">
                    {tx.proofUrl ? (
                      <div
                        className="w-20 h-28 bg-cover bg-center rounded-lg shadow-sm border border-outline-variant/30 flex-shrink-0"
                        style={{ backgroundImage: `url('${tx.proofUrl}')` }}
                      ></div>
                    ) : (
                      <div className="w-20 h-28 bg-surface-variant rounded-lg flex items-center justify-center text-outline flex-shrink-0">
                        <span className="material-symbols-outlined text-[32px]">receipt_long</span>
                      </div>
                    )}
                    <div className="flex flex-col justify-between py-1 flex-1">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-label-sm text-outline">Ref ID</span>
                          <span className="text-label-sm font-medium">{tx.refId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-label-sm text-outline">Tipe</span>
                          <span className="text-label-sm font-medium">
                            {tx.type === "EXPENSE" ? tx.description : tx.rentType || "Sewa Bulanan"}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/?text=Bukti%20Pembayaran%20${tx.refId}%20Rp%20${tx.amount}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 mt-2 rounded-lg bg-[#25D366]/10 text-[#1DA851] font-semibold text-label-sm flex items-center justify-center gap-2 transition-colors hover:bg-[#25D366]/20"
                      >
                        <span className="material-symbols-outlined text-[16px]">share</span>
                        Bagikan Struk via WA
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </section>

      {/* Modal Popup: Catat Pembayaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[500px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] pb-safe animate-slide-up overflow-hidden z-10">
            <div className="w-full flex justify-center pt-4 pb-2 shrink-0 md:hidden">
              <div className="w-12 h-1.5 rounded-full bg-outline-variant/50"></div>
            </div>
            <div className="px-6 pb-4 flex items-center justify-between border-b border-surface-variant shrink-0">
              <h2 className="text-headline-md font-bold text-on-surface">Catat Pembayaran</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitTransaction} className="overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Kategori Transaksi</label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tx_type"
                      checked={txType === "INCOME"}
                      onChange={() => setTxType("INCOME")}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-xl border px-4 py-3 text-center text-body-md font-medium transition-colors ${
                        txType === "INCOME"
                          ? "border-secondary bg-secondary/10 text-secondary"
                          : "border-outline-variant text-outline"
                      }`}
                    >
                      Uang Masuk
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="tx_type"
                      checked={txType === "EXPENSE"}
                      onChange={() => setTxType("EXPENSE")}
                      className="sr-only"
                    />
                    <div
                      className={`rounded-xl border px-4 py-3 text-center text-body-md font-medium transition-colors ${
                        txType === "EXPENSE"
                          ? "border-error bg-error/10 text-error"
                          : "border-outline-variant text-outline"
                      }`}
                    >
                      Uang Keluar
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Pilih Penghuni</label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                >
                  <option value="">Pilih penghuni kamar...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - Kamar {t.room?.number || "--"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">
                  {txType === "INCOME" ? "Tipe Catatan Pembayaran" : "Deskripsi Pengeluaran"}
                </label>
                {txType === "INCOME" ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "MONTHLY", label: "Bulanan" },
                      { key: "YEARLY", label: "Tahunan" },
                      { key: "SEMESTERLY", label: "Per Semester" },
                      { key: "DAILY", label: "Per Hari" },
                    ].map((item) => (
                      <label key={item.key} className="cursor-pointer">
                        <input
                          type="radio"
                          name="payment_type"
                          checked={paymentType === item.key}
                          onChange={() => setPaymentType(item.key)}
                          className="sr-only"
                        />
                        <div
                          className={`rounded-xl border px-4 py-3 text-center text-body-md font-medium transition-colors ${
                            paymentType === item.key
                              ? "border-secondary bg-secondary/10 text-secondary"
                              : "border-outline-variant text-outline"
                          }`}
                        >
                          {item.label}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="Contoh: Perbaikan AC Kamar 12, Tagihan Listrik"
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md font-medium text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-lg font-semibold text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                />
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant mb-2">Upload Bukti Transaksi (Vercel Blob)</label>
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center text-center bg-surface-container-lowest cursor-pointer hover:bg-surface-container-low transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file && file.size > 1 * 1024 * 1024) {
                        alert("Maaf, ukuran gambar terlalu besar (Maksimal 1MB). Silakan kompres atau pilih gambar lain.");
                        e.target.value = "";
                        setSelectedFile(null);
                        return;
                      }
                      setSelectedFile(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mb-2">
                    <span className="material-symbols-outlined">cloud_upload</span>
                  </div>
                  <p className="text-body-md font-semibold text-on-surface">
                    {selectedFile ? selectedFile.name : "Tap untuk upload gambar"}
                  </p>
                  <p className="text-label-sm text-outline">JPG, PNG max 1MB</p>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-variant pb-8">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-14 rounded-2xl bg-primary-container text-on-primary font-bold text-body-lg"
                >
                  {isPending ? "Menyimpan & Uploading..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
