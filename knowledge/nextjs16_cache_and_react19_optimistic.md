# Knowledge: Next.js 16 Cache Directives & React 19 Optimistic UI

## Next.js 16.3 - Cache Components (Implemented)

### Aktivasi (Top-Level Config - Bukan Experimental)
```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,  // top-level, bukan di experimental
};
```

### use cache Directive
- Bisa ditaruh di level function atau component
- Otomatis cache hasil computation di server
- Harus dipasangkan dengan `cacheLife()` untuk TTL eksplisit
- Mengaktifkan Partial Prerendering (PPR) secara otomatis

### PPR Constraint - Unstable Values
- `new Date()` di useState initializer akan error saat build
- Solusi: pindahkan ke useEffect (client-only computation)
- Pattern: `useState("")` + `useEffect(() => { setX(new Date()...) }, [])`

### cacheLife Profiles
- `cacheLife("minutes")` -> Revalidate 1m, Expire 1h
- `cacheLife("hours")` -> Revalidate 1h, Expire 24h
- Custom: `cacheLife({ revalidate: 60, expire: 3600 })`

### Migrasi dari revalidate export
```diff
- export const revalidate = 30;
+ async function getCachedData() {
+   "use cache";
+   cacheLife("minutes");
+   cacheTag("my-tag");
+   return fetchData();
+ }
```

### cacheTag + revalidateTag
- Granular invalidation - hanya invalidasi data spesifik
- Lebih efisien dari `revalidatePath` yang invalidasi seluruh page

---

## React 19 - useOptimistic Pattern

### Kapan Pakai vs Kapan Skip
**Pakai** jika:
- Delete/toggle item dari list (data bisa di-predict client-side)
- Toggle boolean state (like, archive, dll)

**Skip** jika:
- Add item yang butuh server-generated data (ID, pricing, roomId)
- Form kompleks multi-step
- Sudah punya optimistic cache mutation yang cukup

### Alternatif: Optimistic Cache Mutation (Lebih Simpel)
```ts
// Setelah server action selesai, langsung update state + cache
startTransition(async () => {
  await deleteItem(id);
  const updated = items.filter(i => i.id !== id);
  setItems(updated);
  setClientCache("items", updated);
  // Background refetch untuk sinkronisasi
  fetchItems();
});
```
