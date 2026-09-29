// app/api/cron/due-notif/route.ts
// -> handling endpoint cron background untuk pengiriman email pengingat jatuh tempo sewa
//      -> verifikasi otorisasi cron (jika ada CRON_SECRET)
//      -> eksekusi pembuatan dan pengiriman laporan rekap ke email pengelola
// -> disini buat route handler GET dan POST

import { NextResponse } from "next/server";
import { sendDueReminderReport } from "@/lib/email";

// helper --------------------------------------------------------------------------
// function untuk memproses pemanggilan otomatis cron pengingat sewa
// input param : request (Request)
// output : NextResponse JSON { success, message, count }
// end of helper ------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Validasi token rahasia cron jika dikonfigurasi di environment
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, message: "Akses cron ditolak: Token tidak valid." }, { status: 401 });
    }

    const result = await sendDueReminderReport();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Cron Due Notif Error:", error);
    return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
