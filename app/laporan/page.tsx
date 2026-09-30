"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { getTransactions, getTenants, addTransaction, updateTransaction } from "../actions";
import AnimatedCounter from "@/components/AnimatedCounter";
import { getClientCache, setClientCache, isCacheStale, clearClientCache } from "@/lib/client-cache";
import { compressImage } from "@/lib/image-compression";

// helper --------------------------------------------------------------------------
// function untuk memformat URL bukti transaksi ke streaming proxy jika berupa private blob
// input param : url (string | null)
// output : string | null
// end of helper ------------------------------------------------------------------
const formatProofUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.includes(".private.blob.") && !url.startsWith("/api/receipts")) {
    return `/api/receipts?url=${encodeURIComponent(url)}`;
  }
  return url;
};

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

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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
  const [syncDateDue, setSyncDateDue] = useState(true);
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

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [accountFilter, setAccountFilter] = useState<"ALL" | "BSI" | "BPD" | "ROCCHI">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredTransactions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      // Filter tipe transaksi (Pemasukan / Pengeluaran)
      if (typeFilter !== "ALL" && tx.type !== typeFilter) {
        return false;
      }

      // Filter rekening / sumber dana (BSI Faraby, BPD KBS, Kas Rocchi)
      const descLower = (tx.description || "").toLowerCase();
      if (accountFilter === "BSI") {
        const isBsi = descLower.includes("bsi") || descLower.includes("farab");
        if (!isBsi) return false;
      } else if (accountFilter === "BPD") {
        const isBpd = descLower.includes("bpd") || descLower.includes("kbs");
        if (!isBpd) return false;
      } else if (accountFilter === "ROCCHI") {
        const isRocchi = descLower.includes("rocchi");
        if (!isRocchi) return false;
      }

      if (!q) return true;

      const tenantName = tx.tenant?.name?.toLowerCase() || "";
      if (tenantName.includes(q)) return true;

      const roomNum = tx.room?.number?.toLowerCase() || "";
      if (roomNum.includes(q)) return true;
      if (`kamar ${roomNum}`.includes(q)) return true;

      const refId = tx.refId?.toLowerCase() || "";
      if (refId.includes(q)) return true;

      if (descLower.includes(q)) return true;

      const rentType = tx.rentType?.toLowerCase() || "";
      if (rentType.includes(q)) return true;

      const method = tx.paymentMethod?.toLowerCase() || "";
      if (method.includes(q)) return true;

      return false;
    });
  }, [transactions, searchQuery, typeFilter, accountFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedTransactions = useMemo(() => {
    if (itemsPerPage >= 999) return filteredTransactions;
    const start = (validCurrentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, validCurrentPage, itemsPerPage]);

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
      if (!isCacheStale("transactions", 15000)) return;
    }
    fetchData();
  }, []);

  const fetchData = async (force: boolean = false) => {
    if (force) {
      clearClientCache("transactions");
      clearClientCache("dashboardStats");
    }
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
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchData(true);
  };

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const availableYears = useMemo(() => {
    const years = new Set<number>([now.getFullYear(), 2026]);
    transactions.forEach((tx) => {
      const yr = new Date(tx.date).getFullYear();
      if (!isNaN(yr)) years.add(yr);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Kalkulasi Lengkap Uang Masuk, Uang Keluar, dan Saldo per Rekening & Keseluruhan
  const financialSummary = useMemo(() => {
    let totalMasuk = 0;
    let totalKeluar = 0;

    let bsiMasuk = 0;
    let bsiKeluar = 0;
    let bpdMasuk = 0;
    let bpdKeluar = 0;
    let rocchiMasuk = 0;
    let rocchiKeluar = 0;

    transactions.forEach((tx) => {
      const desc = (tx.description || "").toLowerCase();
      const isBsi = desc.includes("bsi") || desc.includes("farab");
      const isBpd = desc.includes("bpd") || desc.includes("kbs");
      const isRocchi = desc.includes("rocchi");

      if (tx.type === "INCOME") {
        totalMasuk += tx.amount;
        if (isBsi) bsiMasuk += tx.amount;
        else if (isBpd) bpdMasuk += tx.amount;
        else if (isRocchi) rocchiMasuk += tx.amount;
      } else {
        totalKeluar += tx.amount;
        if (isBsi) bsiKeluar += tx.amount;
        else if (isBpd) bpdKeluar += tx.amount;
        else if (isRocchi) rocchiKeluar += tx.amount;
      }
    });

    const saldoBersih = totalMasuk - totalKeluar;
    const bsiSaldo = bsiMasuk - bsiKeluar;
    const bpdSaldo = bpdMasuk - bpdKeluar;
    const rocchiSaldo = rocchiMasuk - rocchiKeluar;

    return {
      totalMasuk,
      totalKeluar,
      saldoBersih,
      bsi: { masuk: bsiMasuk, keluar: bsiKeluar, saldo: bsiSaldo },
      bpd: { masuk: bpdMasuk, keluar: bpdKeluar, saldo: bpdSaldo },
      rocchi: { masuk: rocchiMasuk, keluar: rocchiKeluar, saldo: rocchiSaldo },
    };
  }, [transactions]);

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("type", txType);
    formData.append("tenantId", selectedTenantId);
    formData.append("rentType", txType === "EXPENSE" ? expenseDescription : paymentType);
    formData.append("amount", amount);
    formData.append("syncDateDue", syncDateDue ? "true" : "false");
    
    if (selectedFile) {
      const fileToUpload = await compressImage(selectedFile);
      formData.append("file", fileToUpload);
    }

    startTransition(async () => {
      await addTransaction(formData);
      setIsModalOpen(false);
      setAmount("");
      setExpenseDescription("");
      setSelectedFile(null);
      setSelectedTenantId("");
      setSyncDateDue(true);
      // Invalidasi cache agar data baru langsung terlihat
      clearClientCache("transactions");
      clearClientCache("dashboardStats");
      clearClientCache("tenants");
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
  const handleEditSubmit = async (e: React.FormEvent) => {
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
      const fileToUpload = await compressImage(editSelectedFile);
      formData.append("file", fileToUpload);
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6 pt-2">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Laporan Keuangan
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Rekapitulasi Arus Kas Masuk, Keluar, dan Saldo Rekening (Laporan Lamgugob)
          </p>
        </div>

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoading}
          className="self-start sm:self-auto px-4 py-2 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl text-xs font-bold flex items-center gap-2 border border-brand-teal/20 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
          title="Segarkan data dari database"
        >
          <span className={`material-symbols-outlined text-base ${isRefreshing ? "animate-spin" : ""}`}>
            sync
          </span>
          <span>{isRefreshing ? "Memperbarui..." : "Segarkan Data"}</span>
        </button>
      </div>

      {/* 3 Grand Summary Cards (Total Uang Masuk, Keluar, Saldo Bersih) */}
      <section className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Uang Masuk */}
        <div className="relative bg-gradient-to-br from-emerald-900/90 via-emerald-950 to-slate-900 rounded-3xl p-6 overflow-hidden shadow-xl border border-emerald-500/20 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-emerald-300 text-xs font-bold tracking-wider uppercase">Total Uang Masuk</span>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-500/30">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-emerald-400/80 text-sm font-bold">Rp</span>
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
              <AnimatedCounter target={financialSummary.totalMasuk} formatCurrency={true} />
            </h2>
          </div>
          <p className="text-emerald-300/70 text-xs mt-2 font-medium">
            39 Transaksi sewa &amp; penerimaan terverifikasi
          </p>
        </div>

        {/* Card 2: Total Uang Keluar */}
        <div className="relative bg-gradient-to-br from-rose-900/90 via-rose-950 to-slate-900 rounded-3xl p-6 overflow-hidden shadow-xl border border-rose-500/20 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-rose-300 text-xs font-bold tracking-wider uppercase">Total Uang Keluar</span>
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-300 border border-rose-500/30">
              <span className="material-symbols-outlined text-[20px]">trending_down</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-rose-400/80 text-sm font-bold">Rp</span>
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight">
              <AnimatedCounter target={financialSummary.totalKeluar} formatCurrency={true} />
            </h2>
          </div>
          <p className="text-rose-300/70 text-xs mt-2 font-medium">
            Biaya operasional, servis, listrik, sedot WC, &amp; kas
          </p>
        </div>

        {/* Card 3: Saldo Bersih */}
        <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0D9488]/80 rounded-3xl p-6 overflow-hidden shadow-xl border border-teal-500/30 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-teal-300 text-xs font-bold tracking-wider uppercase">Saldo Bersih / Sisa Kas</span>
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-300 border border-teal-500/30">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-teal-300/80 text-sm font-bold">Rp</span>
            <h2 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-300">
              <AnimatedCounter target={financialSummary.saldoBersih} formatCurrency={true} />
            </h2>
          </div>
          <p className="text-teal-200/70 text-xs mt-2 font-medium flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Akumulasi kas surplus seluruh rekening
          </p>
        </div>
      </section>

      {/* 3 Buku Rekening Sesuai Halaman 2, 3, 4 Laporan PDF */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-bold text-primary text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-brand-teal text-xl">account_balance</span>
            <span>Rincian 3 Buku Rekening &amp; Kas (Sesuai Laporan PDF)</span>
          </h3>
          <span className="text-xs text-on-surface-variant hidden sm:inline-block">Klik kartu untuk memfilter transaksi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Buku 1: BSI Faraby */}
          <div
            onClick={() => {
              setAccountFilter(accountFilter === "BSI" ? "ALL" : "BSI");
              setCurrentPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              accountFilter === "BSI"
                ? "bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/30 shadow-md"
                : "bg-surface-container-lowest border-outline-variant/30 hover:border-blue-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                1. BSI Faraby (Dede)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                Halaman 2
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Uang Masuk:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {financialSummary.bsi.masuk.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Uang Keluar:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">Rp {financialSummary.bsi.keluar.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-outline-variant/20 font-bold text-primary">
                <span>Sisa Saldo BSI:</span>
                <span className="text-blue-600 dark:text-blue-400">Rp {financialSummary.bsi.saldo.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Buku 2: BPD KBS */}
          <div
            onClick={() => {
              setAccountFilter(accountFilter === "BPD" ? "ALL" : "BPD");
              setCurrentPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              accountFilter === "BPD"
                ? "bg-purple-500/10 border-purple-500 ring-2 ring-purple-500/30 shadow-md"
                : "bg-surface-container-lowest border-outline-variant/30 hover:border-purple-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                2. BPD KBS
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300">
                Halaman 3
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Uang Masuk:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {financialSummary.bpd.masuk.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Uang Keluar:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">Rp {financialSummary.bpd.keluar.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-outline-variant/20 font-bold text-primary">
                <span>Sisa Saldo BPD:</span>
                <span className="text-purple-600 dark:text-purple-400">Rp {financialSummary.bpd.saldo.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Buku 3: Kas Operasional Rocchi */}
          <div
            onClick={() => {
              setAccountFilter(accountFilter === "ROCCHI" ? "ALL" : "ROCCHI");
              setCurrentPage(1);
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              accountFilter === "ROCCHI"
                ? "bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-md"
                : "bg-surface-container-lowest border-outline-variant/30 hover:border-amber-400 hover:shadow-sm"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                3. Kas Operasional Rocchi
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300">
                Halaman 4
              </span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Dana Diterima:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {financialSummary.rocchi.masuk.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Uang Keluar:</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">Rp {financialSummary.rocchi.keluar.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-outline-variant/20 font-bold text-primary">
                <span>Sisa Kas Rocchi:</span>
                <span className="text-amber-600 dark:text-amber-400">Rp {financialSummary.rocchi.saldo.toLocaleString("id-ID")}</span>
              </div>
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
          <span className="font-bold text-body-lg tracking-wide">Catat Transaksi Baru</span>
        </button>
      </section>

      {/* Transaction History */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 px-2">
          <div>
            <h3 className="text-headline-md font-bold text-primary-container text-[20px]">
              Riwayat Transaksi
            </h3>
            <p className="text-on-surface-variant text-label-sm mt-0.5">
              Cari dan pantau riwayat uang masuk dan uang keluar sesuai laporan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-secondary text-label-sm font-semibold bg-secondary/10 px-3 py-1 rounded-full">
              {filteredTransactions.length} dari {transactions.length} Transaksi
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-2.5 py-1 text-xs font-semibold text-primary outline-none cursor-pointer"
            >
              <option value={10}>10 / halaman</option>
              <option value={20}>20 / halaman</option>
              <option value={999}>Tampilkan Semua (39)</option>
            </select>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-4 space-y-3 px-1">
          {/* Search Input */}
          <div className="relative flex items-center w-full">
            <span className="material-symbols-outlined absolute left-3.5 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                setExpandedId(null);
              }}
              placeholder="Cari nama penghuni, no. kamar (misal: 46), Ref ID, keterangan transaksi..."
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 text-body-md placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                  setExpandedId(null);
                }}
                className="absolute right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Hapus pencarian"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Filter Chips: Rekening & Tipe */}
          <div className="flex flex-col gap-2">
            {/* 1. Filter Rekening */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
              <span className="text-xs font-semibold text-on-surface-variant mr-1 shrink-0">Buku Kas:</span>
              {[
                { key: "ALL", label: "Semua Rekening" },
                { key: "BSI", label: "BSI Faraby" },
                { key: "BPD", label: "BPD KBS" },
                { key: "ROCCHI", label: "Kas Rocchi" },
              ].map((item) => {
                const isActive = accountFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setAccountFilter(item.key as any);
                      setCurrentPage(1);
                      setExpandedId(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 border ${
                      isActive
                        ? "bg-brand-deep-blue text-white border-brand-deep-blue dark:bg-brand-teal dark:text-white"
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* 2. Filter Tipe Transaksi */}
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              <span className="text-xs font-semibold text-on-surface-variant mr-1 shrink-0">Tipe:</span>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("ALL");
                  setCurrentPage(1);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 border ${
                  typeFilter === "ALL"
                    ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container"
                }`}
              >
                <span>Semua ({transactions.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("INCOME");
                  setCurrentPage(1);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1 border ${
                  typeFilter === "INCOME"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                <span>Uang Masuk ({transactions.filter((t) => t.type === "INCOME").length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTypeFilter("EXPENSE");
                  setCurrentPage(1);
                  setExpandedId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1 border ${
                  typeFilter === "EXPENSE"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                <span>Uang Keluar ({transactions.filter((t) => t.type === "EXPENSE").length})</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <div className="h-20 rounded-2xl skeleton-shimmer w-full"></div>
              <div className="h-20 rounded-2xl skeleton-shimmer w-full"></div>
              <div className="h-20 rounded-2xl skeleton-shimmer w-full"></div>
            </>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-2xl border border-surface-variant text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
              <p className="font-semibold text-body-md text-primary">Tidak ada transaksi ditemukan</p>
              <p className="text-label-sm text-on-surface-variant">
                {searchQuery ? `Tidak ada hasil untuk pencarian "${searchQuery}"` : "Belum ada transaksi di filter ini"}
              </p>
              {(searchQuery || typeFilter !== "ALL" || accountFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("ALL");
                    setAccountFilter("ALL");
                  }}
                  className="mt-2 px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary font-bold text-label-sm rounded-xl transition-all"
                >
                  Reset Seluruh Filter
                </button>
              )}
            </div>
          ) : (
            paginatedTransactions.map((tx, idx) => {
            const isExpanded = expandedId === tx.id;
            const isAboveFold = idx < 6;
            const animDelay = isAboveFold ? `${((idx + 1) * 0.05).toFixed(2)}s` : "0s";

            // Tentukan label buku rekening
            const descLower = (tx.description || "").toLowerCase();
            let accountBadge = { label: "Umum", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700" };
            if (descLower.includes("bsi") || descLower.includes("farab")) {
              accountBadge = { label: "BSI Faraby", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" };
            } else if (descLower.includes("bpd") || descLower.includes("kbs")) {
              accountBadge = { label: "BPD KBS", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" };
            } else if (descLower.includes("rocchi")) {
              accountBadge = { label: "Kas Rocchi", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" };
            }

            // Tentukan judul transaksi yang jelas & informatif
            let txTitle = tx.description || "Transaksi";
            if (tx.tenant) {
              const roomNumber = tx.room?.number || tx.tenant.room?.number || "";
              txTitle = `${tx.tenant.name} ${roomNumber ? `• Kamar ${roomNumber}` : ""}`;
            }

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
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        tx.type === "INCOME"
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-error-container/40 text-error"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {tx.type === "INCOME" ? "trending_up" : "trending_down"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface text-body-md line-clamp-1">
                        {txTitle}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-on-surface-variant text-label-sm">
                          {tx.paymentMethod} • {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${accountBadge.color}`}>
                          {accountBadge.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className={`font-bold text-body-lg sm:text-title-md ${tx.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {tx.type === "INCOME" ? "+" : "-"}Rp {tx.amount.toLocaleString("id-ID")}
                      </p>
                      <span className="text-[11px] font-semibold text-on-surface-variant block">
                        {tx.type === "INCOME" ? "Uang Masuk" : "Uang Keluar"}
                      </span>
                    </div>
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
                          style={{ backgroundImage: `url('${formatProofUrl(tx.proofUrl)}')` }}
                        ></div>
                      ) : (
                        <div className="w-full h-full bg-surface-variant flex flex-col items-center justify-center text-outline gap-1">
                          <span className="material-symbols-outlined text-[32px]">image_not_supported</span>
                          <span className="text-[10px] font-semibold">Tidak Ada Foto</span>
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
        {!isLoading && filteredTransactions.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-2 px-1 text-on-surface-variant">
            <span className="text-label-sm text-outline">
              Menampilkan {Math.min((validCurrentPage - 1) * itemsPerPage + 1, filteredTransactions.length)}-
              {Math.min(validCurrentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
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
        <div 
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
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

              {txType === "INCOME" && selectedTenantId && (
                <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-xl border border-secondary/20">
                  <input
                    type="checkbox"
                    id="syncDateDueCheckbox"
                    checked={syncDateDue}
                    onChange={(e) => setSyncDateDue(e.target.checked)}
                    className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary accent-secondary cursor-pointer"
                  />
                  <label htmlFor="syncDateDueCheckbox" className="text-body-sm font-medium text-on-surface cursor-pointer select-none">
                    Perpanjang tanggal jatuh tempo penghuni ke siklus berikutnya otomatis
                  </label>
                </div>
              )}

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
        <div 
          className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPreviewReceiptTx(null) }}
        >
          <div
            onClick={() => setPreviewReceiptTx(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="relative w-full md:w-[520px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] pb-safe animate-slide-up overflow-hidden z-10">
            {/* Mobile Sheet Handle Bar */}
            <div className="w-full flex justify-center pt-3 pb-1 shrink-0 md:hidden">
              <div className="w-12 h-1.5 rounded-full bg-outline-variant/50"></div>
            </div>

            {/* Sticky Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-outline-variant/30 shrink-0 bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-sm text-primary font-bold">
                    Struk Pembayaran
                  </h3>
                  <p className="text-label-sm text-outline font-mono">{previewReceiptTx.refId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptTx(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-variant/50 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {previewReceiptTx.proofUrl ? (
                <div className="space-y-4">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/40 bg-black/5 flex items-center justify-center min-h-[220px] max-h-[50vh]">
                    <img
                      src={formatProofUrl(previewReceiptTx.proofUrl) || ""}
                      alt="Bukti Transfer Pembayaran"
                      className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={formatProofUrl(previewReceiptTx.proofUrl) || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 px-4 rounded-xl bg-secondary text-on-secondary font-label-md font-bold text-center flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                      Buka Gambar Penuh
                    </a>
                    <a
                      href={formatProofUrl(previewReceiptTx.proofUrl) || "#"}
                      download={`struk-${previewReceiptTx.refId}.jpg`}
                      className="py-3 px-4 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md font-bold flex items-center justify-center gap-1.5 border border-outline-variant/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                      Unduh
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-lowest border-2 border-dashed border-outline-variant/50 rounded-2xl">
                  <span className="material-symbols-outlined text-5xl text-outline-variant">image_not_supported</span>
                  <div>
                    <h4 className="font-headline-md text-on-surface font-bold">Foto Bukti Tidak Tersedia</h4>
                    <p className="text-body-sm text-outline mt-1">Transaksi ini tidak memiliki file foto bukti transfer asli yang diunggah.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-end md:items-center justify-center p-0 md:p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false) }}
        >
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
                        src={formatProofUrl(editProofUrl) || ""}
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
