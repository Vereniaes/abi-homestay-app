# Panduan Wrapping WebApp ke Aplikasi Android APK (WebView)

Dokumen ini menjelaskan konsep, konfigurasi Gradle, serta langkah kompilasi yang telah berhasil dieksekusi untuk membungkus (*wrapping*) aplikasi Next.js **Abi Homestay** menjadi file `.apk` Android.

---

## 1. Lokasi File APK Hasil Build

Proses kompilasi Gradle telah **berhasil 100%** (`BUILD SUCCESSFUL`). File APK debug dapat ditemukan pada direktori berikut:

- **Path File APK**:
  `android/app/build/outputs/apk/debug/Abi-Homestay.apk`
- **Ukuran File**: ± 3.9 MB (4.043.241 bytes)

---

## 2. Perbaikan Konfigurasi Lingkungan Build (Solusi Issue Gradle & JDK)

Selama proses build awal, ditemukan 2 kendala konfigurasi yang telah berhasil ditangani:

1. **Target Java Release 17 LTS**:
   - Versi JDK 18 pre-release pada kernel Linux mengalami *cgroup v2 NPE exception*. Konfigurasi build disesuaikan menggunakan **OpenJDK 17 LTS** (`JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64`) dan menambahkan override `JavaVersion.VERSION_17` pada `android/build.gradle`.
2. **Konflik Duplicate Class Kotlin**:
   - Pustaka `kotlin-stdlib-jdk7` dan `kotlin-stdlib-jdk8` lawas mengecualikan (*exclude*) duplikasi kelas terhadap `kotlin-stdlib` modern pada `android/app/build.gradle`.
3. **Penyediaan Key Certificate**:
   - Menghasilkan file `~/.android/debug.keystore` standar untuk verifikasi penandatanganan (*signing*) APK debug.

---

## 3. Perintah Build Selanjutnya

Setiap kali Anda mengubah kode Web atau memperbarui URL server, Anda dapat membuat ulang APK secara otomatis melalui perintah berikut di terminal root proyek:

```bash
# Build APK otomatis
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
npm run build:apk
```

Atau jika ingin membuka proyek Android di **Android Studio**:
```bash
npm run cap:open
```

---

## 4. Arsitektur WebView

Aplikasi Android ini dikonfigurasi melalui `capacitor.config.ts` untuk memuat WebApp:
- **App ID**: `com.abihomestay.app`
- **App Name**: `Abi Homestay`
- **WebView URL**: `https://abi-homestay-app.vercel.app` (Atau IP local dev server Anda).

Seluruh fitur Next.js (Prisma Database, Server Actions, dan Upload File) dapat diakses dengan lancar di dalam aplikasi Android ini.
