// lib/rent.ts
// -> handling modul utilitas sewa & tanggal jatuh tempo
//    -> kalkulasi tanggal jatuh tempo (dateDue) berdasarkan rentType
//    -> penentuan harga sewa standar (rentAmount)
//    -> pemformatan label tipe sewa Bahasa Indonesia

// helper --------------------------------------------------------------------------
// function untuk menghitung tanggal jatuh tempo berdasarkan tanggal masuk dan tipe sewa
// input param : dateIn (Date), rentType (string)
// output : Date (tanggal jatuh tempo)
// end of helper ------------------------------------------------------------------
export function calculateDueDate(dateIn: Date, rentType: string): Date {
  const due = new Date(dateIn);
  switch (rentType) {
    case "DAILY":
      due.setDate(due.getDate() + 1);
      break;
    case "WEEKLY":
      due.setDate(due.getDate() + 7);
      break;
    case "SEMESTERLY":
      due.setMonth(due.getMonth() + 6);
      break;
    case "YEARLY":
      due.setFullYear(due.getFullYear() + 1);
      break;
    case "MONTHLY":
    default:
      due.setMonth(due.getMonth() + 1);
      break;
  }
  return due;
}

// helper --------------------------------------------------------------------------
// function untuk mendapatkan harga sewa berdasarkan tipe sewa & master pricing
// input param : rentType (string), pricing (object opsional)
// output : number (nominal harga)
// end of helper ------------------------------------------------------------------
export function getRentAmount(rentType: string, pricing?: any): number {
  if (pricing) {
    if (rentType === "DAILY") return pricing.dailyPrice || 150000;
    if (rentType === "WEEKLY") return pricing.weeklyPrice || 900000;
    if (rentType === "MONTHLY") return pricing.monthlyPrice || 2500000;
    if (rentType === "SEMESTERLY") return pricing.semesterlyPrice || 14000000;
    if (rentType === "YEARLY") return pricing.yearlyPrice || 28000000;
  }

  switch (rentType) {
    case "DAILY":
      return 150000;
    case "WEEKLY":
      return 900000;
    case "SEMESTERLY":
      return 14000000;
    case "YEARLY":
      return 28000000;
    case "MONTHLY":
    default:
      return 2500000;
  }
}

// helper --------------------------------------------------------------------------
// function untuk memformat kode enum rentType menjadi label Bahasa Indonesia
// input param : rentType (string)
// output : string label Bahasa Indonesia
// end of helper ------------------------------------------------------------------
export function formatRentTypeLabel(rentType: string): string {
  switch (rentType) {
    case "DAILY":
      return "Per Hari";
    case "WEEKLY":
      return "Mingguan";
    case "SEMESTERLY":
      return "Per Semester";
    case "YEARLY":
      return "Tahunan";
    case "MONTHLY":
    default:
      return "Bulanan";
  }
}
