// lib/email.ts
// -> handling integrasi email transaksional ABI Homestay
//      -> pengiriman email pengingat jatuh tempo H-5 dan H-3 ke masing-masing penghuni
//      -> pengiriman rekapitulasi tagihan jatuh tempo ke pengelola via Brevo API v3
// -> disini buat orkestrasi payload dan pemanggilan REST API Brevo & Resend

import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { formatRentTypeLabel } from "./rent";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface EmailRecipient {
  email: string;
  name?: string;
}

export interface DueTenantItem {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  dateDue: Date | null;
  rentAmount: number;
  room?: {
    number: string;
  } | null;
}

interface SendEmailParams {
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
}

export interface DueReminderEmailData {
  tenantName: string;
  tenantEmail: string;
  roomNumber: string;
  dateDue: Date | string;
  rentAmount: number;
  rentType: string;
  daysLeft?: number;
}

export interface TenantReminderResult {
  tenantId: string;
  name: string;
  email: string | null;
  roomNumber: string;
  daysAhead: number;
  dateDue: Date | null;
  status: "SENT" | "NO_EMAIL" | "FAILED" | "ALREADY_PAID";
  error?: string;
}

export interface BatchReminderSummary {
  daysAhead: number;
  targetDateStr: string;
  totalMatched: number;
  sentCount: number;
  alreadyPaidCount: number;
  noEmailCount: number;
  failedCount: number;
  details: TenantReminderResult[];
}

// helper --------------------------------------------------------------------------
// function untuk memeriksa apakah penghuni sudah memiliki catatan transaksi pemasukan pada periode sewa ini
// input param : tenantId (string), dateDue (Date), rentType? (string)
// output : Promise<boolean> (true jika sudah ada transaksi pemasukan yang valid)
// end of helper ------------------------------------------------------------------
export async function hasTenantPaidForDuePeriod(
  tenantId: string,
  dateDue: Date,
  rentType: string = "MONTHLY"
): Promise<boolean> {
  const windowStart = new Date(dateDue);
  if (rentType === "DAILY") {
    windowStart.setDate(windowStart.getDate() - 1);
  } else if (rentType === "WEEKLY") {
    windowStart.setDate(windowStart.getDate() - 3);
  } else {
    // Bulanan, semesteran, tahunan: cek transaksi pemasukan dalam 14 hari sebelum jatuh tempo
    windowStart.setDate(windowStart.getDate() - 14);
  }

  const payment = await prisma.transaction.findFirst({
    where: {
      tenantId,
      type: "INCOME",
      date: {
        gte: windowStart,
      },
    },
  });

  return !!payment;
}

// helper --------------------------------------------------------------------------
// function untuk memformat angka ke format mata uang Rupiah
// input param : amount (number)
// output : string (format Rp)
// end of helper ------------------------------------------------------------------
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// helper --------------------------------------------------------------------------
// function untuk mengirim email transaksional melalui Brevo API v3
// input param : params (SendEmailParams)
// output : object { success: boolean, messageId?: string, error?: string }
// end of helper ------------------------------------------------------------------
export async function sendBrevoEmail(params: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "abedenstein12@gmail.com";
  const senderName = process.env.BREVO_SENDER_NAME || "ABI Homestay Reminder";

  if (!apiKey) {
    return { success: false, error: "BREVO_API_KEY belum dikonfigurasi di environment." };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail,
        },
        to: params.to,
        subject: params.subject,
        htmlContent: params.htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo API Error:", data);
      return { success: false, error: data?.message || "Gagal mengirim email via Brevo." };
    }

    return { success: true, messageId: data.messageId };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Kesalahan jaringan saat menghubungi Brevo.";
    console.error("Error sending email via Brevo:", error);
    return { success: false, error: errorMsg };
  }
}

// helper --------------------------------------------------------------------------
// function untuk membuat template HTML email laporan penghuni jatuh tempo untuk pengelola
// input param : dueTenants (Array of DueTenantItem), reportDate (string), tenantReminders? (BatchReminderSummary[])
// output : string (HTML Content)
// end of helper ------------------------------------------------------------------
export function buildDueReminderHtml(
  dueTenants: DueTenantItem[],
  reportDate: string,
  tenantReminders?: BatchReminderSummary[]
): string {
  const tenantRows = dueTenants.map((t) => {
    const roomNumber = t.room?.number || "-";
    const tenantName = t.name || "-";
    const phone = t.phone || "-";
    const dateDueStr = t.dateDue ? new Date(t.dateDue).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) : "-";
    const rentAmountStr = formatRupiah(t.rentAmount || 0);
    const emailStatusBadge = t.email && t.email.includes("@")
      ? `<span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: #ccfbf1; color: #0f766e; font-weight: 600;">${t.email}</span>`
      : `<span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; background: #fee2e2; color: #991b1b; font-weight: 500;">Belum ada email</span>`;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: 600; color: #0f172a;">Kamar ${roomNumber}</td>
        <td style="padding: 12px; color: #1e293b;">${tenantName}</td>
        <td style="padding: 12px; color: #475569;">${phone}</td>
        <td style="padding: 12px; color: #dc2626; font-weight: 600;">${dateDueStr}</td>
        <td style="padding: 12px;">${emailStatusBadge}</td>
        <td style="padding: 12px; color: #0d9488; font-weight: 600; text-align: right;">${rentAmountStr}</td>
      </tr>
    `;
  }).join("");

  const reminderSummaryCards = tenantReminders && tenantReminders.length > 0 ? `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #0f172a;">
        Status Pengingat Personal ke Penghuni (Hari Ini):
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${tenantReminders.map((r) => {
          let label = `Pengingat H-${r.daysAhead}`;
          let color = "#d97706";
          if (r.daysAhead === 0) {
            label = "Hari H (Jatuh Tempo Hari Ini)";
            color = "#991b1b";
          } else if (r.daysAhead === 1) {
            label = "Pengingat H-1 (Besok)";
            color = "#b91c1c";
          } else if (r.daysAhead === 3) {
            label = "Pengingat H-3";
            color = "#dc2626";
          } else if (r.daysAhead === 5) {
            label = "Pengingat H-5";
            color = "#d97706";
          } else if (r.daysAhead === -1) {
            label = "Keterlambatan H+1 (Lewat 1 Hari)";
            color = "#c2410c";
          } else if (r.daysAhead === -3) {
            label = "Keterlambatan H+3 (Lewat 3 Hari)";
            color = "#991b1b";
          } else if (r.daysAhead === -7) {
            label = "Keterlambatan H+7 (Lewat 7 Hari)";
            color = "#7f1d1d";
          }
          const alreadyPaidText = r.alreadyPaidCount > 0 
            ? `Sudah Bayar: <strong style="color: #2563eb;">${r.alreadyPaidCount}</strong> | ` 
            : "";
          return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; font-weight: 600; color: ${color};">
              ${label} (${r.targetDateStr})
            </td>
            <td style="padding: 8px 0; text-align: right; color: #475569;">
              Terkirim: <strong style="color: #0d9488;">${r.sentCount}</strong> / ${r.totalMatched} | 
              ${alreadyPaidText}
              Tanpa Email: <strong style="color: #991b1b;">${r.noEmailCount}</strong> | 
              Gagal: <strong>${r.failedCount}</strong>
            </td>
          </tr>
          `;
        }).join("")}
      </table>
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Pengingat Pembayaran Sewa</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
      <div style="max-width: 750px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #0d9488, #115e59); padding: 24px 32px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">ABI Homestay - Pengingat Pembayaran</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Rekapitulasi Tagihan Sewa Jatuh Tempo</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
            Halo Pengelola ABI Homestay,
          </p>
          <p style="font-size: 14px; line-height: 1.6;">
            Berikut adalah laporan tagihan sewa jatuh tempo per tanggal <strong>${reportDate}</strong>. Total terdapat <strong>${dueTenants.length} penghuni</strong> yang memerlukan konfirmasi atau penagihan sewa:
          </p>

          ${reminderSummaryCards}

          <div style="overflow-x: auto; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 10px 12px; color: #475569;">Kamar</th>
                  <th style="padding: 10px 12px; color: #475569;">Penghuni</th>
                  <th style="padding: 10px 12px; color: #475569;">Telepon</th>
                  <th style="padding: 10px 12px; color: #475569;">Jatuh Tempo</th>
                  <th style="padding: 10px 12px; color: #475569;">Status Email</th>
                  <th style="padding: 10px 12px; color: #475569; text-align: right;">Tarif</th>
                </tr>
              </thead>
              <tbody>
                ${tenantRows}
              </tbody>
            </table>
          </div>
          <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #115e59;">
              <strong>Catatan:</strong> Penghuni yang belum memiliki email dapat dilengkapi melalui menu Edit Penghuni di aplikasi agar menerima pengingat otomatis H-5 dan H-3 ke depannya.
            </p>
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
            Email ini dikirim secara otomatis oleh sistem ABI Homestay Management App.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          &copy; ${new Date().getFullYear()} ABI Homestay. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </body>
    </html>
  `;
}

// helper --------------------------------------------------------------------------
// function untuk membuat template HTML email pengingat jatuh tempo personal ke penghuni (H-5 atau H-3)
// input param : data (DueReminderEmailData)
// output : string (HTML)
// end of helper ------------------------------------------------------------------
export function generateDueReminderHtml(data: DueReminderEmailData): string {
  const daysLeft = data.daysLeft ?? 3;
  const formattedDueDate = new Date(data.dateDue).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let badgeColor = "#d97706";
  let badgeBg = "#fef3c7";
  let badgeText = `Pemberitahuan Tagihan (H-${daysLeft})`;
  let openingMessage = `Ini adalah pemberitahuan bahwa masa sewa kamar Anda di <strong>ABI Homestay</strong> akan jatuh tempo dalam <strong>${daysLeft} hari ke depan (H-${daysLeft})</strong>, tepatnya pada <strong>${formattedDueDate}</strong>.`;

  if (daysLeft === -7) {
    badgeColor = "#7f1d1d";
    badgeBg = "#fee2e2";
    badgeText = "Peringatan Keras: Keterlambatan 7 Hari (H+7)";
    openingMessage = `Ini adalah surat peringatan resmi bahwa pembayaran sewa kamar Anda di <strong>ABI Homestay</strong> telah <strong>melewati jatuh tempo selama 7 hari</strong> (jatuh tempo pada: <strong>${formattedDueDate}</strong>). Mohon segera menyelesaikan kewajiban pembayaran hari ini juga untuk menghindari sanksi administratif atau penertiban kamar.`;
  } else if (daysLeft === -3) {
    badgeColor = "#991b1b";
    badgeBg = "#fee2e2";
    badgeText = "Peringatan: Keterlambatan 3 Hari (H+3)";
    openingMessage = `Kami menginformasikan bahwa pembayaran sewa kamar Anda di <strong>ABI Homestay</strong> telah <strong>melewati batas jatuh tempo selama 3 hari</strong> (jatuh tempo pada: <strong>${formattedDueDate}</strong>). Mohon segera menyelesaikan pembayaran sewa atau menghubungi pengelola.`;
  } else if (daysLeft === -1) {
    badgeColor = "#c2410c";
    badgeBg = "#ffedd5";
    badgeText = "Peringatan: Keterlambatan 1 Hari (H+1)";
    openingMessage = `Masa sewa kamar Anda di <strong>ABI Homestay</strong> telah <strong>melewati tanggal jatuh tempo kemarin</strong> (jatuh tempo pada: <strong>${formattedDueDate}</strong>). Jika Anda sudah melakukan pembayaran, mohon segera mengirimkan bukti transfer kepada pengelola melalui WhatsApp agar data pembayaran Anda segera diverifikasi.`;
  } else if (daysLeft < 0) {
    badgeColor = "#991b1b";
    badgeBg = "#fee2e2";
    badgeText = `Peringatan Keterlambatan (H+${Math.abs(daysLeft)})`;
    openingMessage = `Pembayaran sewa kamar Anda di <strong>ABI Homestay</strong> telah <strong>melewati tanggal jatuh tempo selama ${Math.abs(daysLeft)} hari</strong> (jatuh tempo pada: <strong>${formattedDueDate}</strong>). Mohon segera menyelesaikan pembayaran sewa Anda.`;
  } else if (daysLeft === 0) {
    badgeColor = "#991b1b";
    badgeBg = "#fee2e2";
    badgeText = "Jatuh Tempo Hari Ini (Hari H)";
    openingMessage = `Ini adalah pemberitahuan resmi bahwa masa sewa kamar Anda di <strong>ABI Homestay</strong> jatuh tempo <strong>HARI INI (${formattedDueDate})</strong>. Mohon segera menyelesaikan pembayaran sewa hari ini dan mengunggah/mengirimkan konfirmasi bukti transfer kepada pengelola.`;
  } else if (daysLeft === 1) {
    badgeColor = "#b91c1c";
    badgeBg = "#fee2e2";
    badgeText = "Peringatan Terakhir: Jatuh Tempo Besok (H-1)";
    openingMessage = `Ini adalah pengingat terakhir bahwa masa sewa kamar Anda di <strong>ABI Homestay</strong> akan jatuh tempo <strong>BESOK (H-1)</strong>, tepatnya pada <strong>${formattedDueDate}</strong>. Mohon segera melakukan pembayaran sewa dan konfirmasi bukti transfer kepada pengelola.`;
  } else if (daysLeft <= 3) {
    badgeColor = "#e11d48";
    badgeBg = "#ffe4e6";
    badgeText = `Peringatan Segera (H-${daysLeft})`;
    openingMessage = `Ini adalah pemberitahuan bahwa masa sewa kamar Anda di <strong>ABI Homestay</strong> akan segera jatuh tempo dalam <strong>${daysLeft} hari ke depan (H-${daysLeft})</strong>, tepatnya pada <strong>${formattedDueDate}</strong>.`;
  }

  const formattedAmount = `Rp ${Number(data.rentAmount || 0).toLocaleString("id-ID")}`;
  const rentTypeLabel = formatRentTypeLabel(data.rentType);

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Jatuh Tempo Sewa - ABI Homestay</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 35px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">
                ABI HOMESTAY
              </h1>
              <p style="margin: 6px 0 0 0; color: #ccfbf1; font-size: 14px; font-weight: 500;">
                Kenyamanan &amp; Kemudahan Tinggal
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 35px 30px 25px 30px;">
              <div style="display: inline-block; background-color: ${badgeBg}; color: ${badgeColor}; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px;">
                ${badgeText}
              </div>
              <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                Halo, ${data.tenantName} 👋
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                ${openingMessage}
              </p>

              <!-- Rent Info Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 14px; border: 1px solid #e2e8f0; margin-bottom: 25px; overflow: hidden;">
                <tr>
                  <td style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; display: block; margin-bottom: 3px;">Nomor Kamar</span>
                    <strong style="color: #0f172a; font-size: 16px; font-weight: 700;">Kamar ${data.roomNumber}</strong>
                  </td>
                  <td style="padding: 18px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; display: block; margin-bottom: 3px;">Tipe Sewa</span>
                    <strong style="color: #0f172a; font-size: 16px; font-weight: 700;">${rentTypeLabel}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 20px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; display: block; margin-bottom: 3px;">Tanggal Jatuh Tempo</span>
                    <strong style="color: ${badgeColor}; font-size: 15px; font-weight: 700;">${formattedDueDate}</strong>
                  </td>
                  <td style="padding: 18px 20px;">
                    <span style="color: #64748b; font-size: 13px; font-weight: 500; display: block; margin-bottom: 3px;">Tagihan Sewa</span>
                    <strong style="color: #0d9488; font-size: 17px; font-weight: 800;">${formattedAmount}</strong>
                  </td>
                </tr>
              </table>

              <!-- Payment Instructions -->
              <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 18px; border-radius: 8px; margin-bottom: 25px;">
                <p style="margin: 0 0 8px 0; color: #0f766e; font-size: 14px; font-weight: 700;">
                  💳 Petunjuk Pembayaran / Perpanjangan:
                </p>
                <p style="margin: 0 0 4px 0; color: #334155; font-size: 13.5px; line-height: 1.5;">
                  Pembayaran dapat dilakukan melalui transfer rekening bank pengelola ABI Homestay.
                </p>
              </div>

              <p style="margin: 0 0 25px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                Jika Anda sudah melakukan pembayaran atau ingin konfirmasi perpanjangan sewa, silakan kirimkan bukti transfer kepada pengelola melalui WhatsApp.
              </p>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6281234567890?text=Halo%20Pengelola%20ABI%20Homestay%2C%20saya%20${encodeURIComponent(data.tenantName)}%20dari%20Kamar%20${encodeURIComponent(data.roomNumber)}%20ingin%20konfirmasi%20pembayaran%20sewa." 
                       target="_blank" 
                       style="display: inline-block; background-color: #0d9488; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 12px; box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);">
                      Konfirmasi via WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 30px; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                Email ini dikirimkan secara otomatis oleh Sistem Manajemen <strong>ABI Homestay</strong>.<br>
                Mohon tidak membalas langsung ke alamat email sistem ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// helper --------------------------------------------------------------------------
// function untuk mengirimkan email pengingat sewa personal ke penghuni
// input param : data (DueReminderEmailData)
// output : Promise<{ success: boolean, messageId?: string, error?: string, simulated?: boolean }>
// end of helper ------------------------------------------------------------------
export async function sendDueReminderEmail(data: DueReminderEmailData): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}> {
  try {
    if (!data.tenantEmail || !data.tenantEmail.includes("@")) {
      return { success: false, error: "Alamat email tidak valid atau kosong." };
    }

    const daysLeft = data.daysLeft ?? 3;
    const htmlContent = generateDueReminderHtml(data);
    let subject = `[ABI Homestay] Pengingat Jatuh Tempo Sewa Kamar ${data.roomNumber} (H-${daysLeft})`;
    if (daysLeft === -7) {
      subject = `[ABI Homestay] PERINGATAN KERAS: Keterlambatan Sewa Kamar ${data.roomNumber} (Lewat 7 Hari)`;
    } else if (daysLeft === -3) {
      subject = `[ABI Homestay] Peringatan: Keterlambatan Sewa Kamar ${data.roomNumber} (Lewat 3 Hari)`;
    } else if (daysLeft === -1) {
      subject = `[ABI Homestay] Konfirmasi: Pembayaran Sewa Kamar ${data.roomNumber} Melewati Jatuh Tempo (H+1)`;
    } else if (daysLeft < 0) {
      subject = `[ABI Homestay] Peringatan: Keterlambatan Sewa Kamar ${data.roomNumber} (Lewat ${Math.abs(daysLeft)} Hari)`;
    } else if (daysLeft === 0) {
      subject = `[ABI Homestay] Jatuh Tempo Hari Ini: Pembayaran Sewa Kamar ${data.roomNumber}`;
    } else if (daysLeft === 1) {
      subject = `[ABI Homestay] Pengingat Terakhir: Jatuh Tempo Sewa Kamar ${data.roomNumber} Besok (H-1)`;
    }

    // Prioritas 1: Gunakan Brevo jika BREVO_API_KEY tersedia
    if (process.env.BREVO_API_KEY) {
      const res = await sendBrevoEmail({
        to: [{ email: data.tenantEmail, name: data.tenantName }],
        subject,
        htmlContent,
      });
      return res;
    }

    // Prioritas 2: Gunakan Resend jika RESEND_API_KEY tersedia
    if (resend) {
      const fromSender = process.env.EMAIL_FROM || "ABI Homestay <onboarding@resend.dev>";
      const result = await resend.emails.send({
        from: fromSender,
        to: data.tenantEmail,
        subject,
        html: htmlContent,
      });

      if (result.error) {
        console.error("[EMAIL ERROR] Gagal mengirim via Resend:", result.error);
        return { success: false, error: result.error.message };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    }

    // Fallback: Simulasi di environment development tanpa API key
    console.log(`[EMAIL SIMULASI] API Key email belum disetel di .env.`);
    console.log(`[EMAIL SIMULASI] Mengirim email (H-${daysLeft}) ke: ${data.tenantEmail} | Tenant: ${data.tenantName} | Kamar: ${data.roomNumber}`);
    return {
      success: true,
      simulated: true,
      messageId: `simulated_${Date.now()}`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengirim email.";
    console.error("[EMAIL EXCEPTION]:", err);
    return { success: false, error: errorMsg };
  }
}

// helper --------------------------------------------------------------------------
// function untuk memproses pengiriman batch email personal ke penghuni pada target H-X
// input param : daysAhead (number, misal 5 atau 3)
// output : Promise<BatchReminderSummary>
// end of helper ------------------------------------------------------------------
export async function processTenantDueReminders(daysAhead: number): Promise<BatchReminderSummary> {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + daysAhead);

  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  let targetDateStr = targetDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (daysAhead === 0) {
    targetDateStr = `Hari Ini, ${targetDateStr}`;
  } else if (daysAhead === 1) {
    targetDateStr = `Besok (H-1), ${targetDateStr}`;
  } else if (daysAhead > 1) {
    targetDateStr = `H-${daysAhead}, ${targetDateStr}`;
  } else if (daysAhead < 0) {
    targetDateStr = `H+${Math.abs(daysAhead)} (Lewat ${Math.abs(daysAhead)} Hari), ${targetDateStr}`;
  }

  const tenants = await prisma.tenant.findMany({
    where: {
      status: { not: "INACTIVE" },
      dateDue: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      room: true,
    },
    orderBy: {
      dateDue: "asc",
    },
  });

  const details: TenantReminderResult[] = [];
  let sentCount = 0;
  let alreadyPaidCount = 0;
  let noEmailCount = 0;
  let failedCount = 0;

  for (const t of tenants) {
    const email = t.email?.trim() || null;
    const roomNumber = t.room?.number || "-";

    // Validasi apakah penghuni sudah melakukan pembayaran (khusus Hari H dan keterlambatan H+1, H+3, H+7)
    if (daysAhead <= 0 && t.dateDue) {
      const alreadyPaid = await hasTenantPaidForDuePeriod(t.id, t.dateDue, t.rentType);
      if (alreadyPaid) {
        alreadyPaidCount++;
        details.push({
          tenantId: t.id,
          name: t.name,
          email,
          roomNumber,
          daysAhead,
          dateDue: t.dateDue,
          status: "ALREADY_PAID",
        });
        continue;
      }
    }

    if (!email || !email.includes("@")) {
      noEmailCount++;
      details.push({
        tenantId: t.id,
        name: t.name,
        email: null,
        roomNumber,
        daysAhead,
        dateDue: t.dateDue,
        status: "NO_EMAIL",
      });
      continue;
    }

    const res = await sendDueReminderEmail({
      tenantName: t.name,
      tenantEmail: email,
      roomNumber,
      dateDue: t.dateDue || targetDate,
      rentAmount: t.rentAmount,
      rentType: t.rentType,
      daysLeft: daysAhead,
    });

    if (res.success) {
      sentCount++;
      details.push({
        tenantId: t.id,
        name: t.name,
        email,
        roomNumber,
        daysAhead,
        dateDue: t.dateDue,
        status: "SENT",
      });
    } else {
      failedCount++;
      details.push({
        tenantId: t.id,
        name: t.name,
        email,
        roomNumber,
        daysAhead,
        dateDue: t.dateDue,
        status: "FAILED",
        error: res.error,
      });
    }
  }

  return {
    daysAhead,
    targetDateStr,
    totalMatched: tenants.length,
    sentCount,
    alreadyPaidCount,
    noEmailCount,
    failedCount,
    details,
  };
}

// helper --------------------------------------------------------------------------
// function untuk memproses alur terpadu pengingat sewa (H-5, H-3, H-1, Hari H, H+1, H+3, H+7, dan rekap pengelola)
// input param : customRecipientEmail? (string)
// output : object { success: boolean, message: string, count: number, h5, h3, h1, h0, hp1, hp3, hp7 }
// end of helper ------------------------------------------------------------------
export async function sendDueReminderReport(customRecipientEmail?: string) {
  try {
    let recipientEmail = customRecipientEmail;
    if (!recipientEmail) {
      const setting = await prisma.setting.findFirst();
      recipientEmail = (setting as any)?.reminderRecipientEmail || process.env.REMINDER_RECIPIENT_EMAIL || "titasaripratiwi8@gmail.com";
    }
    const finalRecipientEmail: string = recipientEmail || "titasaripratiwi8@gmail.com";

    // 1. Eksekusi pengingat personal H-5, H-3, H-1, Hari H (D-Day), dan keterlambatan H+1, H+3, H+7
    const [h5Result, h3Result, h1Result, h0Result, hp1Result, hp3Result, hp7Result] = await Promise.all([
      processTenantDueReminders(5),
      processTenantDueReminders(3),
      processTenantDueReminders(1),
      processTenantDueReminders(0),
      processTenantDueReminders(-1),
      processTenantDueReminders(-3),
      processTenantDueReminders(-7),
    ]);

    // 2. Query seluruh penghuni jatuh tempo dalam 7 hari ke depan untuk rekap pengelola
    const sevenDaysAhead = new Date();
    sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

    const dueTenants = await prisma.tenant.findMany({
      where: {
        status: { not: "INACTIVE" },
        dateDue: { lte: sevenDaysAhead },
      },
      include: {
        room: true,
      },
      orderBy: {
        dateDue: "asc",
      },
    });

    const totalMatchedAny =
      dueTenants.length +
      h5Result.totalMatched +
      h3Result.totalMatched +
      h1Result.totalMatched +
      h0Result.totalMatched +
      hp1Result.totalMatched +
      hp3Result.totalMatched +
      hp7Result.totalMatched;

    if (totalMatchedAny === 0) {
      return {
        success: true,
        message: "Tidak ada penghuni yang jatuh tempo dalam waktu dekat. Email tidak dikirim.",
        count: 0,
        h5: h5Result,
        h3: h3Result,
        h1: h1Result,
        h0: h0Result,
        hp1: hp1Result,
        hp3: hp3Result,
        hp7: hp7Result,
      };
    }

    const reportDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const subject = `[Pengingat Tagihan] Rekap Pembayaran Sewa - ${dueTenants.length} Kamar Jatuh Tempo (${reportDate})`;
    const htmlContent = buildDueReminderHtml(dueTenants, reportDate, [
      h5Result,
      h3Result,
      h1Result,
      h0Result,
      hp1Result,
      hp3Result,
      hp7Result,
    ]);

    const sendResult = await sendBrevoEmail({
      to: [{ email: finalRecipientEmail, name: "Pengelola ABI Homestay" }],
      subject,
      htmlContent,
    });

    if (!sendResult.success) {
      return {
        success: false,
        message: sendResult.error || "Gagal mengirim email via Brevo.",
        count: dueTenants.length,
        h5: h5Result,
        h3: h3Result,
        h1: h1Result,
        h0: h0Result,
        hp1: hp1Result,
        hp3: hp3Result,
        hp7: hp7Result,
      };
    }

    return {
      success: true,
      message: `Email rekap berhasil dikirim ke ${finalRecipientEmail}. Notifikasi personal terkirim: H-5 (${h5Result.sentCount}), H-3 (${h3Result.sentCount}), H-1 (${h1Result.sentCount}), Hari H (${h0Result.sentCount}), H+1 (${hp1Result.sentCount}), H+3 (${hp3Result.sentCount}), H+7 (${hp7Result.sentCount}).`,
      count: dueTenants.length,
      h5: h5Result,
      h3: h3Result,
      h1: h1Result,
      h0: h0Result,
      hp1: hp1Result,
      hp3: hp3Result,
      hp7: hp7Result,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Terjadi kesalahan internal saat memproses rekap email.";
    console.error("Error in sendDueReminderReport:", error);
    return {
      success: false,
      message: errorMsg,
      count: 0,
    };
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengirim email pengingat jatuh tempo secara manual ke satu penghuni spesifik
// input param : tenantId (string)
// output : Promise<{ success: boolean; message: string; messageId?: string }>
// end of helper ------------------------------------------------------------------
export async function sendSingleTenantReminder(tenantId: string): Promise<{
  success: boolean;
  message: string;
  messageId?: string;
}> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { room: true },
    });

    if (!tenant) {
      return { success: false, message: "Data penghuni tidak ditemukan." };
    }

    const email = tenant.email?.trim();
    if (!email || !email.includes("@")) {
      return {
        success: false,
        message: `Penghuni ${tenant.name} belum memiliki alamat email yang valid. Silakan lengkapi email terlebih dahulu di form edit penghuni.`,
      };
    }

    const now = new Date();
    const dueDate = tenant.dateDue ? new Date(tenant.dateDue) : now;
    const diffTime = dueDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const res = await sendDueReminderEmail({
      tenantName: tenant.name,
      tenantEmail: email,
      roomNumber: tenant.room?.number || "-",
      dateDue: dueDate,
      rentAmount: tenant.rentAmount,
      rentType: tenant.rentType,
      daysLeft,
    });

    if (!res.success) {
      return {
        success: false,
        message: res.error || "Gagal mengirim email pengingat melalui server email.",
      };
    }

    return {
      success: true,
      message: `Email pengingat berhasil dikirimkan ke ${tenant.name} (${email}).`,
      messageId: res.messageId,
    };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Terjadi kesalahan internal saat mengirim email.";
    console.error("Error in sendSingleTenantReminder:", error);
    return { success: false, message: errorMsg };
  }
}
