// lib/excel-penghuni.ts
// -> handling pembuat, pengunduh, dan pembaca file Excel (.xlsx) dan CSV data penghuni
// -> mendukung pembukaan langsung di Microsoft Excel dengan UTF-8 BOM & SheetJS

import * as XLSX from "xlsx";
import { formatRentTypeLabel } from "./rent";

export interface TenantExportData {
  name: string;
  phone: string;
  email?: string | null;
  room?: { number: string };
  status: string;
  dateIn: Date | string;
  dateDue: Date | string | null;
  rentType: string;
  rentAmount: number;
}

// helper --------------------------------------------------------------------------
// function untuk mengekspor data penghuni ke format file Excel (.xlsx)
// input param : tenants (TenantExportData[])
// output : void
// end of helper ------------------------------------------------------------------
export function exportPenghuniExcel(tenants: TenantExportData[]): void {
  const data = tenants.map((t) => ({
    "Nama Penghuni": t.name || "",
    "Nomor Kamar": t.room?.number || "--",
    "Nomor HP": t.phone || "-",
    "Email": t.email || "-",
    "Tanggal Masuk": t.dateIn ? new Date(t.dateIn).toISOString().split("T")[0] : "-",
    "Jatuh Tempo": t.dateDue ? new Date(t.dateDue).toISOString().split("T")[0] : "-",
    "Tipe Sewa": formatRentTypeLabel(t.rentType),
    "Status": t.status === "ACTIVE" ? "Aktif" : t.status === "EXPIRING_SOON" ? "Akan Jatuh Tempo" : "Non-aktif",
    "Harga Sewa (Rp)": t.rentAmount || 0,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Penghuni");
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `Data_Penghuni_ABI_Homestay_${dateStr}.xlsx`);
}

// helper --------------------------------------------------------------------------
// function untuk menghasilkan string CSV dari daftar penghuni
// input param : tenants (TenantExportData[])
// output : string (konten file CSV dengan UTF-8 BOM)
// end of helper ------------------------------------------------------------------
export function generatePenghuniCSV(tenants: TenantExportData[]): string {
  const headers = [
    "Nama Penghuni",
    "Nomor Kamar",
    "Nomor HP",
    "Email",
    "Tanggal Masuk",
    "Jatuh Tempo",
    "Tipe Sewa",
    "Status",
    "Harga Sewa (Rp)",
  ];

  const rows = tenants.map((t) => {
    const tglMasuk = t.dateIn ? new Date(t.dateIn).toISOString().split("T")[0] : "-";
    const tglJatuhTempo = t.dateDue ? new Date(t.dateDue).toISOString().split("T")[0] : "-";
    const statusLabel =
      t.status === "ACTIVE"
        ? "Aktif"
        : t.status === "EXPIRING_SOON"
        ? "Akan Jatuh Tempo"
        : "Non-aktif";

    return [
      `"${(t.name || "").replace(/"/g, '""')}"`,
      `"${t.room?.number || "--"}"`,
      `"${t.phone || "-"}"`,
      `"${t.email || "-"}"`,
      `"${tglMasuk}"`,
      `"${tglJatuhTempo}"`,
      `"${formatRentTypeLabel(t.rentType)}"`,
      `"${statusLabel}"`,
      t.rentAmount || 0,
    ].join(",");
  });

  return "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
}

// helper --------------------------------------------------------------------------
// function untuk memicu unduhan file CSV di browser client
// input param : content (string), filename (string)
// output : void
// end of helper ------------------------------------------------------------------
export function triggerFileDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// helper --------------------------------------------------------------------------
// function untuk mengekspor data penghuni ke file CSV
// input param : tenants (TenantExportData[])
// output : void
// end of helper ------------------------------------------------------------------
export function exportPenghuniCSV(tenants: TenantExportData[]): void {
  const csvContent = generatePenghuniCSV(tenants);
  const dateStr = new Date().toISOString().split("T")[0];
  triggerFileDownload(csvContent, `Data_Penghuni_ABI_Homestay_${dateStr}.csv`);
}

// helper --------------------------------------------------------------------------
// function untuk mengunduh template Excel (.xlsx) kosong
// input param : none
// output : void
// end of helper ------------------------------------------------------------------
export function downloadTemplatePenghuniExcel(): void {
  const sampleData = [
    {
      "Nama Penghuni": "Budi Santoso",
      "Nomor Kamar": "01",
      "Nomor HP": "081234567890",
      "Tanggal Masuk": "2026-09-01",
      "Tipe Sewa": "Bulanan",
      "Harga Sewa": 2500000,
    },
    {
      "Nama Penghuni": "Siti Rahma",
      "Nomor Kamar": "02",
      "Nomor HP": "089876543210",
      "Tanggal Masuk": "2026-09-05",
      "Tipe Sewa": "Tahunan",
      "Harga Sewa": 28000000,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  XLSX.writeFile(workbook, "Template_Penghuni_Baru.xlsx");
}

// helper --------------------------------------------------------------------------
// function untuk mengunduh template CSV sampel penghuni baru
// input param : none
// output : void
// end of helper ------------------------------------------------------------------
export function downloadTemplatePenghuniCSV(): void {
  const headers = ["Nama Penghuni", "Nomor Kamar", "Nomor HP", "Tanggal Masuk", "Tipe Sewa", "Harga Sewa"];
  const sampleRows = [
    ["Budi Santoso", "01", "081234567890", "2026-09-01", "Bulanan", "2500000"],
    ["Siti Rahma", "02", "089876543210", "2026-09-05", "Tahunan", "28000000"],
  ];

  const csvContent =
    "\uFEFF" +
    [headers.join(","), ...sampleRows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\r\n");

  triggerFileDownload(csvContent, "Template_Penghuni_Baru.csv");
}

// helper --------------------------------------------------------------------------
// function untuk membaca file unggahan (.xlsx / .xls / .csv / .tsv) menjadi string teks tabel
// input param : file (File)
// output : Promise<string> (string CSV/TSV)
// end of helper ------------------------------------------------------------------
export async function parseFileToTableText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        resolve(csvText);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
