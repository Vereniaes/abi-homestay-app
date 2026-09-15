export default function Loading() {
  return (
    <main className="pt-28 md:pt-8 px-4 md:px-6 max-w-container-max mx-auto pb-28 md:pb-12 h-[80vh] flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-surface-variant border-t-brand-teal rounded-full animate-spin"></div>
      <p className="mt-4 font-body-md text-on-surface-variant animate-pulse">Memuat data dasbor...</p>
    </main>
  );
}
