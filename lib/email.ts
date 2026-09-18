// lib/email.ts
// -> Layanan pengiriman email pengingat jatuh tempo otomatis menggunakan Resend
// -> Mendukung template HTML modern bertema Abi Homestay dan fallback aman

import { Resend } from "resend";
import { formatRentTypeLabel } from "./rent";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface DueReminderEmailData {
  tenantName: string;
  tenantEmail: string;
  roomNumber: string;
  dateDue: Date | string;
  rentAmount: number;
  rentType: string;
}

// helper --------------------------------------------------------------------------
// function untuk membuat template HTML email pengingat jatuh tempo yang elegan & responsif
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
// function untuk mengirimkan email pengingat sewa H-3
// input param : data (DueReminderEmailData)
// output : Promise<{ success: boolean, messageId?: string, error?: string, simulated?: boolean }>
// end of helper ------------------------------------------------------------------
export async function sendDueReminderEmail(data: DueReminderEmailData) {
  try {
    if (!data.tenantEmail || !data.tenantEmail.includes("@")) {
      return { success: false, error: "Alamat email tidak valid atau kosong." };
    }

    const htmlContent = generateDueReminderHtml(data);
    const subject = `[Abi Homestay] Pengingat Jatuh Tempo Sewa Kamar ${data.roomNumber} (H-3)`;

    if (!resend) {
      console.log(`[EMAIL SIMULASI] Resend API Key belum disetel di .env.`);
      console.log(`[EMAIL SIMULASI] Mengirim email ke: ${data.tenantEmail} | Tenant: ${data.tenantName} | Kamar: ${data.roomNumber}`);
      return {
        success: true,
        simulated: true,
        messageId: `simulated_${Date.now()}`,
      };
    }

    // Mengirim melalui Resend API
    // Note: Resend default free sender adalah "onboarding@resend.dev" jika belum pasang custom domain
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
  } catch (err: any) {
    console.error("[EMAIL EXCEPTION]:", err);
    return { success: false, error: err?.message || "Terjadi kesalahan saat mengirim email." };
  }
}
