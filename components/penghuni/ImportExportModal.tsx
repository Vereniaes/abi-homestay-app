"use client";

import { useState, useTransition } from "react";
import { parsePenghuniPaste, HasilParsePenghuni } from "@/lib/paste-penghuni";
import {
  exportPenghuniExcel,
  exportPenghuniCSV,
  downloadTemplatePenghuniExcel,
  downloadTemplatePenghuniCSV,
  parseFileToTableText,
  TenantExportData,
} from "@/lib/excel-penghuni";
import { importTenantsBulk } from "@/app/actions";
import { formatRentTypeLabel } from "@/lib/rent";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: TenantExportData[];
  onSuccess: () => void | Promise<void>;
}

// helper --------------------------------------------------------------------------
// function Modal Komponen Import & Export Data Penghuni (Excel & CSV)
// input param : props (ImportExportModalProps)
// output : React Component JSX
// end of helper ------------------------------------------------------------------
export default function ImportExportModal({ isOpen, onClose, tenants, onSuccess }: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");
  const [rawText, setRawText] = useState("");
  const [parseResult, setParseResult] = useState<HasilParsePenghuni | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  // helper --------------------------------------------------------------------------
  // function untuk menangani perubahan input teks tempelan spreadsheet
  // input param : teks (string)
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleTextChange = (teks: string) => {
    setRawText(teks);
    setStatusMessage(null);
    if (!teks.trim()) {
      setParseResult(null);
      return;
    }
    const hasil = parsePenghuniPaste(teks);
    setParseResult(hasil);
  };

  // helper --------------------------------------------------------------------------
  // function untuk membaca file unggahan Excel (.xlsx/.xls) atau CSV secara otomatis
  // input param : e (React.ChangeEvent<HTMLInputElement>)
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await parseFileToTableText(file);
      handleTextChange(csvText);
    } catch (err) {
      console.error("Error reading file:", err);
      setStatusMessage({
        type: "error",
        text: "Gagal membaca format file. Pastikan file berformat Excel (.xlsx) atau CSV (.csv) yang valid.",
      });
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk memproses penyimpanan massal data hasil impor ke database & auto close
  // input param : none
  // output : void
  // end of helper ------------------------------------------------------------------
  const handleImportSubmit = () => {
    if (!parseResult || parseResult.baris.length === 0) return;

    startTransition(async () => {
      const res = await importTenantsBulk(parseResult.baris);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Berhasil mengimpor ${res.count} data penghuni baru!`,
        });
        setRawText("");
        setParseResult(null);
        await onSuccess();
        setTimeout(() => {
          onClose();
          setStatusMessage(null);
        }, 1000);
      } else {
        setStatusMessage({
          type: "error",
          text: res.message || "Gagal mengimpor data.",
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 transition-opacity"
      ></div>

      {/* Modal Card */}
      <div className="relative w-full md:w-[680px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden pb-safe z-10 animate-slide-up">
        {/* Top Indicator */}
        <div
          className="w-full flex justify-center pt-3 pb-1 cursor-pointer shrink-0"
          onClick={onClose}
        >
          <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
        </div>

        {/* Header Tabs */}
        <div className="px-6 pt-2 pb-4 border-b border-surface-variant shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-teal">table_chart</span>
              Export &amp; Import Excel / CSV
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-outline hover:bg-surface-variant transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container-low rounded-xl border border-surface-variant">
            <button
              onClick={() => setActiveTab("import")}
              className={`py-2.5 rounded-lg font-label-md text-label-md font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "import"
                  ? "bg-brand-teal text-white shadow-md font-bold"
                  : "text-on-surface-variant hover:bg-surface-variant/50"
              }`}
            >
              <span className="material-symbols-outlined text-lg">file_upload</span>
              Import (Excel / CSV)
            </button>

            <button
              onClick={() => setActiveTab("export")}
              className={`py-2.5 rounded-lg font-label-md text-label-md font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === "export"
                  ? "bg-brand-teal text-white shadow-md font-bold"
                  : "text-on-surface-variant hover:bg-surface-variant/50"
              }`}
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Export (Excel / CSV)
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto hide-scrollbar flex-1 space-y-4">
          {statusMessage && (
            <div
              className={`p-4 rounded-xl flex items-center gap-3 border ${
                statusMessage.type === "success"
                  ? "bg-secondary-container/30 border-secondary/30 text-secondary"
                  : "bg-error-container/30 border-error-container text-error"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {statusMessage.type === "success" ? "check_circle" : "error"}
              </span>
              <p className="font-body-md text-body-md font-medium">{statusMessage.text}</p>
            </div>
          )}

          {activeTab === "import" ? (
            <div className="space-y-4">
              {/* Instructions & Template Download Links */}
              <div className="p-4 bg-surface-container-low rounded-2xl border border-surface-variant text-body-sm text-on-surface-variant space-y-3">
                <div className="flex items-start gap-2 text-primary font-bold">
                  <span className="material-symbols-outlined text-brand-teal text-lg">info</span>
                  <span>Petunjuk Impor (Excel &amp; CSV):</span>
                </div>
                <p className="pl-6 text-xs text-outline leading-relaxed">
                  Unggah file file <strong>.xlsx</strong> / <strong>.csv</strong> atau tempelkan tabel langsung (Ctrl+C &amp; Ctrl+V) dari Excel / Google Sheets:
                </p>
                <div className="pl-6 font-mono text-[11px] bg-surface-variant/50 p-2 rounded-lg text-primary overflow-x-auto">
                  Nama | No Kamar | No HP | Tanggal Masuk | Tipe Sewa | Harga Sewa
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-surface-variant/50">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={downloadTemplatePenghuniExcel}
                      className="text-brand-teal font-label-sm text-xs hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Template Excel (.xlsx)
                    </button>
                    <span className="text-outline text-xs">•</span>
                    <button
                      type="button"
                      onClick={downloadTemplatePenghuniCSV}
                      className="text-brand-teal font-label-sm text-xs hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Template CSV (.csv)
                    </button>
                  </div>

                  <label className="px-3 py-1.5 bg-brand-teal text-white rounded-lg font-label-sm text-xs font-bold cursor-pointer hover:bg-brand-deep-blue transition-all flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-sm">upload_file</span>
                    Pilih File (.xlsx / .csv)
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.tsv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Paste Textarea Area */}
              <div>
                <label className="font-label-sm text-on-surface-variant mb-1.5 block">
                  Atau Tempel Tabel / Teks Spreadsheet Di Sini:
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder={`Contoh:\nBudi Santoso\t01\t081234567890\t2026-09-01\tBulanan\t2500000\nSiti Rahma\t02\t089876543210\t2026-09-05\tTahunan`}
                  className="w-full p-3.5 rounded-xl bg-surface-container-low border border-surface-variant focus:border-brand-teal focus:ring-1 focus:ring-brand-teal outline-none font-mono text-xs text-primary transition-all placeholder:text-outline"
                ></textarea>
              </div>

              {/* Parsing Results Preview & Live Validation */}
              {parseResult && (
                <div className="space-y-3">
                  {/* Summary Status Badges */}
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-secondary-container/40 text-secondary rounded-lg font-label-sm text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {parseResult.baris.length} Data Terbaca
                    </span>
                    {parseResult.masalah.length > 0 && (
                      <span className="px-3 py-1 bg-error-container/40 text-error rounded-lg font-label-sm text-xs font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">warning</span>
                        {parseResult.masalah.length} Bermasalah
                      </span>
                    )}
                  </div>

                  {/* Problematic Rows Alert */}
                  {parseResult.masalah.length > 0 && (
                    <div className="p-3 bg-error-container/20 border border-error-container/40 rounded-xl space-y-1">
                      <p className="font-label-sm text-xs font-bold text-error">Baris Tidak Terbaca:</p>
                      <ul className="text-[11px] text-error/90 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                        {parseResult.masalah.map((m, idx) => (
                          <li key={idx}>
                            Baris {m.nomor}: {m.alasan} ({m.teks.slice(0, 30)}...)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Valid Rows Preview Table */}
                  {parseResult.baris.length > 0 && (
                    <div className="border border-surface-variant rounded-xl overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="bg-surface-variant/50 sticky top-0 font-label-sm text-on-surface-variant">
                            <tr>
                              <th className="p-2.5">Nama</th>
                              <th className="p-2.5">Kamar</th>
                              <th className="p-2.5">No HP</th>
                              <th className="p-2.5">Tanggal</th>
                              <th className="p-2.5">Sewa</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-variant/30 font-body-sm text-primary">
                            {parseResult.baris.map((b, idx) => (
                              <tr key={idx} className="hover:bg-surface-container-low">
                                <td className="p-2.5 font-medium">{b.name}</td>
                                <td className="p-2.5">Kamar {b.roomNumber}</td>
                                <td className="p-2.5 text-outline">{b.phone}</td>
                                <td className="p-2.5">{b.dateIn}</td>
                                <td className="p-2.5">{formatRentTypeLabel(b.rentType)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Export Tab - Option between Excel (.xlsx) and CSV (.csv) */
            <div className="py-4 space-y-6">
              <div className="p-5 bg-surface-container-low rounded-2xl border border-surface-variant flex items-center justify-between">
                <div>
                  <h3 className="font-headline-md text-base font-bold text-primary">
                    Total Penghuni Terdaftar
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                    Pilih format unduhan data penghuni di bawah ini:
                  </p>
                </div>
                <div className="px-4 py-2 bg-brand-teal/10 text-brand-teal font-headline-md text-xl font-bold rounded-xl">
                  {tenants.length} Orang
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Excel Option */}
                <div className="p-5 bg-surface-container-low rounded-2xl border border-surface-variant space-y-4 flex flex-col justify-between hover:border-brand-teal/50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-brand-teal font-bold mb-2">
                      <span className="material-symbols-outlined text-2xl">table_view</span>
                      <h4 className="font-headline-md text-base">Format Excel (.xlsx)</h4>
                    </div>
                    <p className="font-body-sm text-xs text-outline leading-relaxed">
                      Format spreadsheet standar Microsoft Excel. Memiliki kolom &amp; tata letak tabel yang rapi.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportPenghuniExcel(tenants)}
                    className="w-full py-3 rounded-xl bg-brand-teal text-white font-label-md text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:bg-brand-deep-blue transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Unduh Excel (.xlsx)
                  </button>
                </div>

                {/* CSV Option */}
                <div className="p-5 bg-surface-container-low rounded-2xl border border-surface-variant space-y-4 flex flex-col justify-between hover:border-brand-teal/50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 text-secondary font-bold mb-2">
                      <span className="material-symbols-outlined text-2xl">csv</span>
                      <h4 className="font-headline-md text-base">Format CSV (.csv)</h4>
                    </div>
                    <p className="font-body-sm text-xs text-outline leading-relaxed">
                      Format teks ringan dipisah koma dengan encoding UTF-8. Kompatibel dengan semua sistem database &amp; software.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => exportPenghuniCSV(tenants)}
                    className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-label-md text-sm font-bold shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">download</span>
                    Unduh CSV (.csv)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab === "import" && (
          <div className="p-4 border-t border-surface-variant bg-surface-container-low flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-surface-container text-on-surface-variant font-label-md text-sm hover:bg-surface-variant transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!parseResult || parseResult.baris.length === 0 || isPending}
              onClick={handleImportSubmit}
              className="px-6 py-2.5 rounded-xl bg-brand-teal text-white font-label-md text-sm font-bold shadow-md flex items-center gap-2 hover:bg-brand-deep-blue disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              {isPending
                ? "Menyimpan..."
                : `Simpan ${parseResult?.baris.length || 0} Penghuni`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
