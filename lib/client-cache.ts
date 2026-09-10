// lib/client-cache.ts
// -> handling in-memory client-side cache untuk navigasi instan antar-halaman
//      -> menyimpan snapshot data kamar, laporan, tenant, profil user, dan notifikasi
//      -> mengimplementasikan pola stale-while-revalidate tanpa dependensi eksternal
// -> mencegah refetch berulang dan menghilangkan jeda layar kosong saat berpindah menu

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

// helper --------------------------------------------------------------------------
// function untuk mengambil data dari cache memori klien
// input param : key (string)
// output : data generik T atau null jika belum ada di cache
// end of helper ------------------------------------------------------------------
export function getClientCache<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  return entry.data as T;
}

// helper --------------------------------------------------------------------------
// function untuk menyimpan atau memperbarui data di cache memori klien
// input param : key (string), data (T)
// output : void
// end of helper ------------------------------------------------------------------
export function setClientCache<T>(key: string, data: T): void {
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

// helper --------------------------------------------------------------------------
// function untuk memeriksa apakah data di cache sudah melewati masa berlaku (stale)
// input param : key (string), ttlMs (number, default 30000 ms)
// output : boolean (true jika data sudah basi atau belum pernah disimpan)
// end of helper ------------------------------------------------------------------
export function isCacheStale(key: string, ttlMs: number = 30000): boolean {
  const entry = memoryCache.get(key);
  if (!entry) return true;
  return Date.now() - entry.timestamp > ttlMs;
}

// helper --------------------------------------------------------------------------
// function untuk menghapus data tertentu atau seluruh isi cache klien
// input param : key (string opsional)
// output : void
// end of helper ------------------------------------------------------------------
export function clearClientCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}
