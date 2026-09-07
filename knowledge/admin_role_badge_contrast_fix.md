# Knowledge: Fix Kontras Warna Badge Role ADMIN

## Overview
Dokumen ini mencatat analisis masalah kontras warna pada badge role `ADMIN` di aplikasi Abi Homestay serta solusi desain skema warna yang disepakati dari hasil `/grill-me`.

## 1. Analisis Akar Masalah (Root Cause Analysis)
- **Masalah Utama**: Teks tulisan `ADMIN` pada badge di navigasi aplikasi tidak terlihat/sulit dibaca (kontras warna buruk).
- **Penyebab**:
  - Pada `getRoleBadgeStyle()`, role `ADMIN` sebelumnya menggunakan kelas Tailwind:
    `bg-primary-container text-on-primary-fixed-variant border-primary-fixed-dim/40`
  - Berdasarkan `tailwind.config.ts`:
    - `bg-primary-container` = `#131b2e` (Biru Navy Gelap)
    - `text-on-primary-fixed-variant` = `#3f465c` (Abu-abu Slate Gelap)
  - Penggunaan warna latar gelap dan teks gelap menghasilkan *contrast ratio* yang tidak memenuhi standar aksesibilitas WCAG (perlu kontras minimal 4.5:1 untuk teks kecil).

## 2. Kesepakatan Desain (Hasil /grill-me)
- **Skema Warna Terpilih**: **Executive Dark Navy dengan Teks Emas/Amber**
  - **Styling**: `bg-[#0F172A] text-[#FCD34D] border border-amber-400/40 shadow-xs`
  - **Efek Visual**: Badge `ADMIN` tampak premium dan berbobot dengan latar gelap navy `#0F172A` serta teks tulisan `ADMIN` berwarna kuning emas `#FCD34D` ber-border halus amber, memberikan tingkat kontras visual 100% yang tajam dan nyaman dibaca.
- **Cakupan Pembaruan (Scope)**:
  1. `components/Navigation.tsx` (Fungsi `getRoleBadgeStyle` untuk TopBar Mobile & SideNav Desktop)
  2. `app/users/page.tsx` (Fungsi `getRoleBadgeStyle` untuk Tabel Desktop & Card Mobile Manajemen User)

## 3. Komponen & File Terdampak
- [Navigation.tsx](file:///home/vereniaes/project/abi-homestay-app/components/Navigation.tsx) -> Update `getRoleBadgeStyle` untuk role `ADMIN`.
- [app/users/page.tsx](file:///home/vereniaes/project/abi-homestay-app/app/users/page.tsx) -> Update `getRoleBadgeStyle` untuk role `ADMIN`.
