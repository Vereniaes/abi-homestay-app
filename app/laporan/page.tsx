"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { getTransactions, getTenants, addTransaction, updateTransaction } from "../actions";
import AnimatedCounter from "@/components/AnimatedCounter";
import { getClientCache, setClientCache, isCacheStale, clearClientCache } from "@/lib/client-cache";

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
// function Halaman Laporan Keuangan & Tagihan dengan SWR Client Caching
// input param : none
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function LaporanPage() {
  const cachedTx = getClientCache<Transaction[]>("transactions");
  const cachedTenants = getClientCache<Tenant[]>("tenants");
  const hasValidCache = Boolean(cachedTx && cachedTx.length > 0);

  const [transactions, setTransactions] = useState<Transaction[]>(() => cachedTx || []);
  const [tenants, setTenants] = useState<Tenant[]>(() => cachedTenants || []);
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
  const [isLoading, setIsLoading] = useState(() => !hasValidCache);

  // Struk viewer & Edit states
  const [previewReceiptTx, setPreviewReceiptTx] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTxId, setEditTxId] = useState("");
  const [editTxType, setEditTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [editTenantName, setEditTenantName] = useState("");
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editRentType, setEditRentType] = useState("MONTHLY");
  const [editDescription, setEditDescription] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("TRANSFER");
  const [editDate, setEditDate] = useState("");
  const [editProofUrl, setEditProofUrl] = useState<string | null>(null);
  const [editRemoveProof, setEditRemoveProof] = useState(false);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editError, setEditError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (validCurrentPage - 1) * itemsPerPage;
    return transactions.slice(start, start + itemsPerPage);
  }, [transactions, validCurrentPage, itemsPerPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validCurrentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    if (validCurrentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [
      validCurrentPage - 2,
      validCurrentPage - 1,
      validCurrentPage,
      validCurrentPage + 1,
      validCurrentPage + 2,
    ];
  }, [totalPages, validCurrentPage]);

  useEffect(() => {
    const cached = getClientCache<Transaction[]>("transactions");
    if (cached && cached.length > 0) {
      setTransactions(cached);
      setIsLoading(false);
      // Revalidasi senyap di latar belakang hanya jika cache sudah basi (> 30 detik)
      if (!isCacheStale("transactions", 30000)) return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!getClientCache("transactions")) {
      setIsLoading(true);
    }
    try {
      const [txData, tenantData] = await Promise.all([
        getTransactions(),
        getTenants("", "semua"),
      ]);
      const safeTx = txData as unknown as Transaction[];
      const safeTenants = tenantData as unknown as Tenant[];
      setTransactions(safeTx);
      setTenants(safeTenants);
      setClientCache("transactions", safeTx);
      setClientCache("tenants", safeTenants);
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
      // Invalidasi cache agar data baru langsung terlihat
      clearClientCache("transactions");
      setCurrentPage(1);
      await fetchData();
    });
  };

  // helper --------------------------------------------------------------------------
  // function untuk membuka modal edit transaksi
  // input param : tx (Transaction)
  // output : void (mengeset nilai form dan membuka modal)
  // end of helper ------------------------------------------------------------------
  const handleOpenEditTx = (tx: Transaction) => {
    setEditTxId(tx.id);
    setEditTxType(tx.type);
    setEditTenantName(tx.tenant?.name || "Transaksi Umum");
    setEditRoomNumber(tx.room?.number || "--");
    setEditAmount(String(tx.amount));
    setEditRentType(tx.rentType || "MONTHLY");
    setEditDescription(tx.description || "");
    setEditPaymentMethod(tx.paymentMethod || "TRANSFER");
    setEditDate(new Date(tx.date).toISOString().split("T")[0]);
    setEditProofUrl(tx.proofUrl);
    setEditRemoveProof(false);
    setEditSelectedFile(null);
    setEditError("");
    setIsEditModalOpen(true);
  };

  // helper --------------------------------------------------------------------------
  // function untuk menyimpan perubahan data transaksi keuangan
  // input param : e (React.FormEvent)
  // output : void (memanggil server action updateTransaction)
  // end of helper ------------------------------------------------------------------
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    const formData = new FormData();
    formData.append("id", editTxId);
    formData.append("amount", editAmount);
    formData.append("rentType", editRentType);
    formData.append("description", editDescription);
    formData.append("paymentMethod", editPaymentMethod);
    formData.append("date", editDate);
    formData.append("removeProof", String(editRemoveProof));

    if (editSelectedFile) {
      if (editSelectedFile.size > 2 * 1024 * 1024) {
        setEditError("Ukuran gambar terlalu besar (Maksimal 2MB).");
        return;
      }
      formData.append("file", editSelectedFile);
    }

    startTransition(async () => {
      const result = await updateTransaction(formData);
      if (result && result.success) {
        setIsEditModalOpen(false);
        clearClientCache("transactions");
        clearClientCache("dashboardStats");
        await fetchData();
      } else {
        setEditError(result?.message || "Gagal memperbarui transaksi.");
      }
    });
  };

  return (
    <main className="flex-1 px-4 md:px-6 py-6 max-w-container-max mx-auto w-full pt-28 md:pt-8 pb-28 md:pb-12">
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
          <span className="text-secondary text-label-sm font-semibold bg-secondary/10 px-2.5 py-1 rounded-full">
            {transactions.length} Transaksi
          </span>
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
            paginatedTransactions.map((tx, idx) => {
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
                  <div className="mt-4 pt-4 border-t border-surface-variant flex flex-col sm:flex-row gap-4">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewReceiptTx(tx);
                      }}
                      title="Klik untuk melihat struk penuh"
                      className="relative group w-24 h-32 rounded-xl overflow-hidden border border-outline-variant/40 flex-shrink-0 cursor-pointer shadow-sm hover:border-secondary transition-all"
                    >
                      {tx.proofUrl ? (
                        <div
                          className="w-full h-full bg-cover bg-center"
                          style={{ backgroundImage: `url('${tx.proofUrl}')` }}
                        ></div>
                      ) : (
                        <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center text-outline gap-1">
                          <span className="material-symbols-outlined text-[32px]">receipt_long</span>
                          <span className="text-[10px] font-semibold">Nota Digital</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold gap-1 transition-opacity">
                        <span className="material-symbols-outlined text-sm">zoom_in</span>
                        <span>Lihat</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between py-1 flex-1 gap-3">
                      <div className="space-y-1.5 text-label-sm">
                        <div className="flex justify-between pb-1 border-b border-surface-variant/50">
                          <span className="text-outline">Ref ID</span>
                          <span className="font-bold text-on-surface">{tx.refId}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-surface-variant/50">
                          <span className="text-outline">Kategori / Tipe</span>
                          <span className="font-semibold text-primary">
                            {tx.type === "EXPENSE" ? tx.description : tx.rentType || "Sewa Bulanan"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-outline">Metode Pembayaran</span>
                          <span className="font-medium text-on-surface">{tx.paymentMethod}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewReceiptTx(tx);
                          }}
                          className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface text-label-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/30 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                          <span>Lihat Struk</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditTx(tx);
                          }}
                          className="py-2 px-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary text-label-sm font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_note</span>
                          <span>Edit</span>
                        </button>

                        <a
                          href={`https://wa.me/?text=Bukti%20Pembayaran%20${tx.refId}%20Rp%20${tx.amount}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-2 px-3 rounded-xl bg-[#25D366]/10 text-[#1DA851] hover:bg-[#25D366]/20 font-bold text-label-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">share</span>
                          <span>Bagikan WA</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && transactions.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-2 px-1 text-on-surface-variant">
            <span className="text-label-sm text-outline">
              Menampilkan {Math.min((validCurrentPage - 1) * itemsPerPage + 1, transactions.length)}-
              {Math.min(validCurrentPage * itemsPerPage, transactions.length)} dari {transactions.length} transaksi
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setExpandedId(null);
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={validCurrentPage <= 1}
                aria-label="Halaman sebelumnya"
                className="flex items-center justify-center w-8 h-8 rounded-xl border border-surface-variant bg-surface text-on-surface disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-container-lowest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              <div className="flex items-center gap-1">
                {visiblePages.map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => {
                      setExpandedId(null);
                      setCurrentPage(pageNum);
                    }}
                    className={`w-8 h-8 rounded-xl text-label-sm font-semibold transition-all flex items-center justify-center ${
                      validCurrentPage === pageNum
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface hover:bg-surface-container-lowest text-on-surface-variant border border-surface-variant"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setExpandedId(null);
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={validCurrentPage >= totalPages}
                aria-label="Halaman selanjutnya"
                className="flex items-center justify-center w-8 h-8 rounded-xl border border-surface-variant bg-surface text-on-surface disabled:opacity-30 disabled:pointer-events-none hover:bg-surface-container-lowest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
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

      {/* Modal Pratinjau Struk Pembayaran */}
      {previewReceiptTx && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            onClick={() => setPreviewReceiptTx(null)}
            className="fixed inset-0 bg-black/60 transition-opacity"
          ></div>
          <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl p-6 z-10 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/30 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-body-lg text-primary font-bold">
                    Struk Pembayaran
                  </h3>
                  <p className="text-label-sm text-outline">{previewReceiptTx.refId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptTx(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {previewReceiptTx.proofUrl ? (
              <div className="space-y-4">
                <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/40 bg-black/5 flex items-center justify-center max-h-[55vh]">
                  <img
                    src={previewReceiptTx.proofUrl}
                    alt="Bukti Transfer Pembayaran"
                    className="max-h-[55vh] w-auto object-contain rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={previewReceiptTx.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-secondary text-on-secondary font-label-md font-bold text-center flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                    Buka Gambar Penuh
                  </a>
                  <a
                    href={previewReceiptTx.proofUrl}
                    download={`struk-${previewReceiptTx.refId}.jpg`}
                    className="py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md font-bold flex items-center justify-center gap-1.5 border border-outline-variant/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Unduh
                  </a>
                </div>
              </div>
            ) : (
              /* Nota Struk Digital Resmi jika tanpa upload foto */
              <div className="p-6 bg-surface-container-lowest border-2 border-dashed border-outline-variant/50 rounded-2xl space-y-4">
                <div className="text-center pb-3 border-b border-dashed border-outline-variant/50">
                  <h4 className="font-headline-md text-primary font-extrabold tracking-wide uppercase">
                    Abi Homestay
                  </h4>
                  <p className="text-label-sm text-outline">Tanda Terima Pembayaran Resmi</p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-xs font-extrabold tracking-wider uppercase border border-[#2E7D32]/20">
                    Lunas
                  </span>
                </div>

                <div className="space-y-2 text-body-md">
                  <div className="flex justify-between">
                    <span className="text-outline">No. Referensi:</span>
                    <span className="font-bold text-on-surface">{previewReceiptTx.refId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Tanggal:</span>
                    <span className="font-semibold text-on-surface">
                      {new Date(previewReceiptTx.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Penerima / Penghuni:</span>
                    <span className="font-bold text-primary">
                      {previewReceiptTx.tenant ? previewReceiptTx.tenant.name : "Umum / Operasional"}
                    </span>
                  </div>
                  {previewReceiptTx.room && (
                    <div className="flex justify-between">
                      <span className="text-outline">Nomor Kamar:</span>
                      <span className="font-bold text-on-surface">Kamar {previewReceiptTx.room.number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-outline">Rincian:</span>
                    <span className="font-semibold text-on-surface">
                      {previewReceiptTx.type === "EXPENSE" ? previewReceiptTx.description : previewReceiptTx.rentType || "Sewa Kost"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Metode:</span>
                    <span className="font-semibold text-on-surface">{previewReceiptTx.paymentMethod}</span>
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-dashed border-outline-variant/50 flex justify-between items-center">
                  <span className="font-bold text-body-lg text-on-surface">Total Dibayar:</span>
                  <span className="font-headline-lg text-headline-md text-secondary font-extrabold">
                    Rp {previewReceiptTx.amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[540px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar pb-safe z-10 animate-slide-up">
            <div
              className="w-full flex justify-center pt-4 pb-2 cursor-pointer"
              onClick={() => setIsEditModalOpen(false)}
            >
              <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary font-bold">
                    Edit Transaksi
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 rounded-xl bg-error-container/60 border border-error/20 text-on-error-container text-label-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-lg">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <div className="p-3 bg-surface-container-low rounded-xl border border-surface-variant flex items-center justify-between text-label-sm">
                  <div>
                    <span className="text-outline block text-xs">Penghuni / Transaksi:</span>
                    <span className="font-bold text-primary">{editTenantName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-outline block text-xs">Kamar:</span>
                    <span className="font-bold text-on-surface">Kamar {editRoomNumber}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">
                    Nominal Transaksi (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-lg font-bold text-primary focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">
                      Tanggal Transaksi
                    </label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md font-medium text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">
                      Metode Pembayaran
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-body-md font-medium text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    >
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="CASH">Tunai (Cash)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5">
                    {editTxType === "INCOME" ? "Tipe Sewa" : "Keterangan Pengeluaran"}
                  </label>
                  {editTxType === "INCOME" ? (
                    <select
                      value={editRentType}
                      onChange={(e) => setEditRentType(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md font-medium text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    >
                      <option value="DAILY">Harian</option>
                      <option value="WEEKLY">Mingguan</option>
                      <option value="MONTHLY">Bulanan</option>
                      <option value="SEMESTERLY">Per Semester</option>
                      <option value="YEARLY">Tahunan</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-body-md font-medium text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
                    />
                  )}
                </div>

                {/* Bagian Bukti Transaksi Struk */}
                <div className="bg-surface-container-low border border-surface-variant rounded-2xl p-4 space-y-3">
                  <label className="block text-label-sm font-bold text-on-surface">
                    Foto Bukti Struk
                  </label>

                  {editProofUrl && !editRemoveProof ? (
                    <div className="flex items-center gap-3 p-2 bg-surface rounded-xl border border-outline-variant/40">
                      <img
                        src={editProofUrl}
                        alt="Bukti Struk Lama"
                        className="w-14 h-14 object-cover rounded-lg border border-outline-variant/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-label-sm font-semibold text-on-surface truncate">Struk Terpasang</p>
                        <p className="text-[11px] text-outline truncate">{editProofUrl}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditRemoveProof(true)}
                        className="p-2 rounded-lg text-error hover:bg-error-container/20 text-label-sm font-bold flex items-center gap-1 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                        Hapus
                      </button>
                    </div>
                  ) : (
                    editRemoveProof && (
                      <div className="flex items-center justify-between p-2.5 bg-error-container/20 border border-error/20 rounded-xl text-error text-label-sm">
                        <span>Bukti struk akan dihapus saat disimpan.</span>
                        <button
                          type="button"
                          onClick={() => setEditRemoveProof(false)}
                          className="font-bold underline text-xs ml-2"
                        >
                          Batalkan
                        </button>
                      </div>
                    )
                  )}

                  <div>
                    <label className="block text-label-sm text-outline mb-1">
                      {editProofUrl && !editRemoveProof ? "Ganti dengan berkas baru (Opsional):" : "Unggah berkas baru:"}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file && file.size > 2 * 1024 * 1024) {
                          alert("Ukuran berkas maksimal 2MB.");
                          e.target.value = "";
                          setEditSelectedFile(null);
                          return;
                        }
                        setEditSelectedFile(file);
                        if (file) setEditRemoveProof(false);
                      }}
                      className="w-full text-label-sm text-on-surface-variant file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-label-sm file:font-semibold file:bg-secondary/10 file:text-secondary hover:file:bg-secondary/20 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-surface-container text-on-surface-variant font-label-md text-label-md hover:bg-surface-variant transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary font-label-md text-label-md font-bold hover:bg-secondary/90 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
