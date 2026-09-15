import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  // Authorization header for secure cron execution (Opsional, Vercel merekomendasikan CRON_SECRET)
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cari penghuni yang tanggal jatuh temponya 5 hari lagi (H-5)
    // atau yang sudah lewat/pas hari H tapi belum dinotifikasi hari ini
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + 5);
    
    // Set target date ke jam 23:59:59 untuk mencari semua yang jatuh tempo hingga akhir hari ke-5
    const targetDateEnd = new Date(targetDate);
    targetDateEnd.setHours(23, 59, 59, 999);

    const tenants = await prisma.tenant.findMany({
      where: {
        status: { not: "INACTIVE" },
        email: { not: null }, // Pastikan punya email
        dateDue: { lte: targetDateEnd }, // Jatuh tempo dalam 5 hari atau kurang
        OR: [
          { lastNotifiedAt: null },
          { lastNotifiedAt: { lt: today } } // Belum dinotifikasi hari ini
        ]
      },
      include: {
        room: true
      }
    });

    if (tenants.length === 0) {
      return NextResponse.json({ message: "Tidak ada penghuni yang perlu dikirimi email notifikasi hari ini." }, { status: 200 });
    }

    // Konfigurasi Nodemailer dengan Gmail
    // PENTING: User harus mengisi GMAIL_USER dan GMAIL_APP_PASSWORD di Vercel/env
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER || '',
        pass: process.env.GMAIL_APP_PASSWORD || '' // Gunakan App Password dari Google (bukan password biasa)
      }
    });

    // Validasi kredensial
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
       console.error("GMAIL_USER atau GMAIL_APP_PASSWORD belum diset di environment variables!");
       return NextResponse.json({ error: "Email credentials belum dikonfigurasi" }, { status: 500 });
    }

    const notifiedTenants = [];

    for (const tenant of tenants) {
      if (!tenant.email) continue;
      
      const due = tenant.dateDue ? new Date(tenant.dateDue) : new Date();
      
      // Hitung selisih hari (H-x)
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let subject = "";
      let message = "";
      
      if (diffDays > 0) {
        subject = `[PENGINGAT] Tagihan Sewa Kamar Abi Homestay (H-${diffDays})`;
        message = `
          <p>Halo <b>${tenant.name}</b>,</p>
          <p>Ini adalah pengingat otomatis dari Abi Homestay.</p>
          <p>Masa sewa kamar Anda (<b>Kamar ${tenant.room?.number}</b>) akan jatuh tempo dalam <b>${diffDays} hari</b> pada tanggal <b>${due.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b>.</p>
          <p>Mohon segera lakukan pembayaran sewa sebesar <b>Rp ${tenant.rentAmount.toLocaleString('id-ID')}</b> agar Anda dapat terus menikmati kenyamanan di Abi Homestay.</p>
          <br/>
          <p>Abaikan email ini jika Anda sudah melakukan pembayaran.</p>
          <p>Terima kasih,<br/>Manajemen Abi Homestay</p>
        `;
      } else {
         subject = `[JATUH TEMPO] Tagihan Sewa Kamar Abi Homestay`;
         message = `
          <p>Halo <b>${tenant.name}</b>,</p>
          <p>Masa sewa kamar Anda (<b>Kamar ${tenant.room?.number}</b>) telah <b>jatuh tempo</b> pada tanggal <b>${due.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b>.</p>
          <p>Mohon segera selesaikan pembayaran sewa sebesar <b>Rp ${tenant.rentAmount.toLocaleString('id-ID')}</b>.</p>
          <p>Jika pembayaran tidak segera diselesaikan, akses atau status penghuni Anda mungkin dinonaktifkan.</p>
          <br/>
          <p>Abaikan email ini jika Anda baru saja melakukan pembayaran.</p>
          <p>Terima kasih,<br/>Manajemen Abi Homestay</p>
        `;
      }

      // Kirim Email
      try {
        await transporter.sendMail({
          from: `"Abi Homestay" <${process.env.GMAIL_USER}>`,
          to: tenant.email,
          subject: subject,
          html: message,
        });

        // Update database bahwa penghuni ini sudah dinotifikasi hari ini
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { lastNotifiedAt: new Date() } // Update waktu sekarang
        });

        notifiedTenants.push(tenant.name);
      } catch (err) {
        console.error(`Gagal mengirim email ke ${tenant.email}:`, err);
      }
    }

    return NextResponse.json({
      message: "Sukses menjalankan cron job email notifikasi",
      sentTo: notifiedTenants
    }, { status: 200 });

  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
