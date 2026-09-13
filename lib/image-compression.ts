// lib/image-compression.ts
// -> handling kompresi gambar sisi klien sebelum pengiriman FormData
//      -> memperkecil ukuran foto kamera ponsel resolusi tinggi (< 800KB)
//      -> mempertahankan kejelasan teks struk pembayaran tanpa membebani memori server
// -> mencegah timeout upload dan kegagalan batasan ukuran berkas

// helper --------------------------------------------------------------------------
// function untuk mengompresi berkas gambar menggunakan HTML5 Canvas API
// input param : file (File), maxDimension (number, default 1600), quality (number, default 0.8)
// output : Promise<File> (berkas gambar terkompresi)
// end of helper ------------------------------------------------------------------
export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.8
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Jika ukuran berkas sudah di bawah 300KB, tidak perlu kompresi ulang
  if (file.size <= 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
            return;
          }

          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}
