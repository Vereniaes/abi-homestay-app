// lib/email.ts
// -> handling integrasi email transaksional ABI Homestay
//      -> pengiriman rekapitulasi tagihan jatuh tempo ke pengelola via Brevo API v3
//      -> pengiriman email pengingat jatuh tempo H-3 ke penghuni via Brevo / Resend
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
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "abihomestayreminder@gmail.com";
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
// function untuk membuat template HTML email laporan penghuni jatuh tempo
// input param : dueTenants (Array of DueTenantItem), reportDate (string)
// output : string (HTML Content)
// end of helper ------------------------------------------------------------------
export function buildDueReminderHtml(dueTenants: DueTenantItem[], reportDate: string): string {
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

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: 600; color: #0f172a;">Kamar ${roomNumber}</td>
        <td style="padding: 12px; color: #1e293b;">${tenantName}</td>
        <td style="padding: 12px; color: #475569;">${phone}</td>
        <td style="padding: 12px; color: #dc2626; font-weight: 600;">${dateDueStr}</td>
        <td style="padding: 12px; color: #0d9488; font-weight: 600; text-align: right;">${rentAmountStr}</td>
      </tr>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>Laporan Pengingat Pembayaran Sewa</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #334155;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: linear-gradient(135deg, #0d9488, #115e59); padding: 24px 32px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">ABI Homestay - Pengingat Pembayaran</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Rekapitulasi Tagihan Sewa Jatuh Tempo</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
            Halo Pengelola ABI Homestay,
          </p>
          <p style="font-size: 14px; line-height: 1.6;">
            Berikut adalah daftar penghuni yang telah atau akan segera jatuh tempo dalam waktu dekat per tanggal <strong>${reportDate}</strong>. Total terdapat <strong>${dueTenants.length} penghuni</strong> yang memerlukan konfirmasi atau penagihan sewa:
          </p>
          <div style="overflow-x: auto; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
              <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                  <th style="padding: 10px 12px; color: #475569;">Kamar</th>
                  <th style="padding: 10px 12px; color: #475569;">Penghuni</th>
                  <th style="padding: 10px 12px; color: #475569;">Telepon</th>
                  <th style="padding: 10px 12px; color: #475569;">Jatuh Tempo</th>
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
              <strong>Catatan:</strong> Anda dapat langsung mengingatkan penghuni melalui WhatsApp atau memperbarui transaksi penerimaan di aplikasi ABI Homestay.
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
// function untuk memproses pengiriman email rekap jatuh tempo ke admin
// input param : customRecipientEmail? (string)
// output : object { success: boolean, message: string, count: number }
// end of helper ------------------------------------------------------------------
export async function sendDueReminderReport(customRecipientEmail?: string) {
  try {
    const recipientEmail = customRecipientEmail || process.env.REMINDER_RECIPIENT_EMAIL || "titasaripratiwi8@gmail.com";

    // Query penghuni yang statusnya bukan INACTIVE dan jatuh tempo <= 7 hari ke depan
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

    if (dueTenants.length === 0) {
      return {
        success: true,
        message: "Tidak ada penghuni yang jatuh tempo dalam waktu dekat. Email tidak dikirim.",
        count: 0,
      };
    }

    const reportDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const subject = `[Pengingat Tagihan] Rekap Pembayaran Sewa - ${dueTenants.length} Kamar Jatuh Tempo (${reportDate})`;
    const htmlContent = buildDueReminderHtml(dueTenants, reportDate);

    const sendResult = await sendBrevoEmail({
      to: [{ email: recipientEmail, name: "Pengelola ABI Homestay" }],
      subject,
      htmlContent,
    });

    if (!sendResult.success) {
      return {
        success: false,
        message: sendResult.error || "Gagal mengirim email via Brevo.",
        count: dueTenants.length,
      };
    }

    return {
      success: true,
      message: `Email rekap berhasil dikirim ke ${recipientEmail} untuk ${dueTenants.length} penghuni.`,
      count: dueTenants.length,
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
// function untuk membuat template HTML email pengingat jatuh tempo H-3 yang elegan & responsif
// input param : data (DueReminderEmailData)
// output : string (HTML)
// end of helper ------------------------------------------------------------------
export function generateDueReminderHtml(data: DueReminderEmailData): string {
  const formattedDueDate = new Date(data.dateDue).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedAmount = `Rp ${Number(data.rentAmount || 0).toLocaleString("id-ID")}`;
  const rentTypeLabel = formatRentTypeLabel(data.rentType);

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Jatuh Tempo Sewa - Abi Homestay</title>
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
              <h2 style="margin: 0 0 15px 0; color: #0f172a; font-size: 20px; font-weight: 700;">
                Halo, ${data.tenantName} 👋
              </h2>
              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Ini adalah pemberitahuan otomatis bahwa masa sewa kamar Anda di <strong>Abi Homestay</strong> akan jatuh tempo dalam <strong>3 hari ke depan (H-3)</strong>.
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
                    <strong style="color: #e11d48; font-size: 15px; font-weight: 700;">${formattedDueDate}</strong>
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
                  Pembayaran dapat dilakukan melalui transfer atau QRIS:
                </p>
                <p style="margin: 0; color: #0f172a; font-size: 13.5px; font-weight: 600;">
                  • Rekening BCA: <strong>123-456-7890</strong> (a/n ABI HOMESTAY)
                </p>
              </div>

              <p style="margin: 0 0 25px 0; color: #475569; font-size: 14px; line-height: 1.5;">
                Jika Anda sudah melakukan pembayaran atau ada pertanyaan terkait perpanjangan sewa, silakan konfirmasikan bukti transfer kepada pengelola melalui WhatsApp.
              </p>

              <!-- Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="https://wa.me/6281234567890?text=Halo%20Pengelola%20Abi%20Homestay%2C%20saya%20${encodeURIComponent(data.tenantName)}%20dari%20Kamar%20${encodeURIComponent(data.roomNumber)}%20ingin%20konfirmasi%20pembayaran%20sewa." 
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
                Email ini dikirimkan secara otomatis oleh Sistem Manajemen <strong>Abi Homestay</strong>.<br>
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
// function untuk mengirimkan email pengingat sewa H-3 ke penghuni
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

    const htmlContent = generateDueReminderHtml(data);
    const subject = `[Abi Homestay] Pengingat Jatuh Tempo Sewa Kamar ${data.roomNumber} (H-3)`;

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
      const fromSender = process.env.EMAIL_FROM || "Abi Homestay <onboarding@resend.dev>";
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
    console.log(`[EMAIL SIMULASI] Mengirim email ke: ${data.tenantEmail} | Tenant: ${data.tenantName} | Kamar: ${data.roomNumber}`);
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
