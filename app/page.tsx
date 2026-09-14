import { getDashboardStats } from "./actions";
import HomeDashboardClient from "@/components/HomeDashboardClient";
import { cacheLife, cacheTag } from "next/cache";

// helper --------------------------------------------------------------------------
// function untuk mengambil statistik dashboard dengan server-side caching
// input param : none
// output : object dashboard stats (cached)
// end of helper ------------------------------------------------------------------
async function getCachedDashboardStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("dashboard");
  return getDashboardStats();
}

// helper --------------------------------------------------------------------------
// function Halaman Utama Beranda (Server Component)
// input param : none
// output : React Server Component JSX
// end of helper ------------------------------------------------------------------
export default async function HomePage() {
  const stats = await getCachedDashboardStats();
  return <HomeDashboardClient stats={stats} />;
}
