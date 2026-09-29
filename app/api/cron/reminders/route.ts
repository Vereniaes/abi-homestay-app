// app/api/cron/reminders/route.ts
// -> Endpoint Cron Job harian untuk memeriksa dan mengirimkan email pengingat H-5 dan H-3 ke masing-masing penghuni
// -> Menggunakan fungsi modular processTenantDueReminders dari lib/email.ts

import { NextResponse } from "next/server";
import { processTenantDueReminders } from "@/lib/email";

export const dynamic = "force-dynamic";

// helper --------------------------------------------------------------------------
// function route handler GET untuk pemicuan cron pengingat personal penghuni
// input param : request (Request)
// output : NextResponse JSON
// end of helper ------------------------------------------------------------------
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [h5, h3, h1, h0, hp1, hp3, hp7] = await Promise.all([
      processTenantDueReminders(5),
      processTenantDueReminders(3),
      processTenantDueReminders(1),
      processTenantDueReminders(0),
      processTenantDueReminders(-1),
      processTenantDueReminders(-3),
      processTenantDueReminders(-7),
    ]);

    const totalSent =
      h5.sentCount +
      h3.sentCount +
      h1.sentCount +
      h0.sentCount +
      hp1.sentCount +
      hp3.sentCount +
      hp7.sentCount;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      totalSent,
      h5,
      h3,
      h1,
      h0,
      hp1,
      hp3,
      hp7,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal server error";
    console.error("Cron Reminders Error:", error);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
