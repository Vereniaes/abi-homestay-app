import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// app/api/receipts/route.ts
// -> handling secure streaming untuk berkas bukti transfer dari Vercel Blob Private Store
//      -> membaca stream data langsung dari storage privat dengan token server
//      -> menyajikan gambar ke browser dengan caching yang optimal tanpa galat 403
// -> mencegah kebocoran kredensial dan mengamankan akses berkas privat

// helper --------------------------------------------------------------------------
// function GET route handler untuk streaming bukti transfer privat
// input param : request (NextRequest)
// output : NextResponse (streaming binary gambar atau pesan galat)
// end of helper ------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("Parameter URL bukti transfer diperlukan.", { status: 400 });
  }

  try {
    const blobRes = await get(targetUrl, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    if (!blobRes || !blobRes.stream) {
      return new NextResponse("Bukti transfer tidak ditemukan.", { status: 404 });
    }

    const contentType = blobRes.headers.get("content-type") || "image/jpeg";
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");

    return new NextResponse(blobRes.stream as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Gagal streaming bukti transfer Vercel Blob:", error);
    return new NextResponse("Terjadi kesalahan saat memuat berkas bukti transfer.", { status: 500 });
  }
}
