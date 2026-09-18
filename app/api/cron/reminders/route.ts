// app/api/cron/reminders/route.ts
// -> Endpoint Cron Job harian untuk memeriksa dan mengirimkan email pengingat H-3 jatuh tempo
// -> Dipanggil secara otomatis oleh Vercel Cron atau pengujian manual

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDueReminderEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// helper --------------------------------------------------------------------------
// function inti untuk memproses pengiriman pengingat H-3
// output : Object berisi ringkasan hasil eksekusi
// end of helper ------------------------------------------------------------------
async function processDueReminders() {
  const now = new Date();
  
  // Hitung tanggal H-3 (3 hari dari hari ini)
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + 3);

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
  const endOfDay = new Date(year, month, day, 23, 59, 59, 999);

  // Ambil data penghuni aktif yang jatuh tempo di H-3 dan memiliki email
  const tenants = await prisma.tenant.findMany({
    where: {
      status: "ACTIVE",
      dateDue: {
        gte: startOfDay,
        lte: endOfDay,
      },
      email: {
        not: null,
      },
    },
    include: {
      room: true,
    },
  });

  const validTenants = tenants.filter((t) => t.email && t.email.trim().length > 0 && t.email.includes("@"));

  const results = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const tenant of validTenants) {
    const emailData = {
      tenantName: tenant.name,
      tenantEmail: tenant.email!.trim(),
      roomNumber: tenant.room?.number || "--",
      dateDue: tenant.dateDue || targetDate,
      rentAmount: tenant.rentAmount,
      rentType: tenant.rentType,
    };

    const res = await sendDueReminderEmail(emailData);
    if (res.success) {
      sentCount++;
    } else {
      failedCount++;
    }

    results.push({
      tenantId: tenant.id,
      name: tenant.name,
      email: tenant.email,
      room: tenant.room?.number,
      dateDue: tenant.dateDue,
      success: res.success,
      simulated: res.simulated || false,
      error: res.error || null,
    });
  }

  return {
    timestamp: new Date().toISOString(),
    targetDateChecked: targetDate.toISOString().split("T")[0],
    totalTenantsMatched: validTenants.length,
    sentCount,
    failedCount,
    details: results,
  };
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Jika CRON_SECRET disetel di lingkungan produksi, lakukan verifikasi
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report = await processDueReminders();
    return NextResponse.json({
      success: true,
      message: `Proses pengingat H-3 selesai: ${report.sentCount} terkirim dari ${report.totalTenantsMatched} penghuni.`,
      ...report,
    });
  } catch (error: any) {
    console.error("Error in cron/reminders route:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // Dukung juga pemanggilan via POST
  return GET(request);
}
