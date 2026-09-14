import { getDashboardStats } from "./actions";
import HomeDashboardClient from "@/components/HomeDashboardClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// helper --------------------------------------------------------------------------
// function Halaman Utama Beranda (Server Component)
// input param : none
// output : React Server Component JSX
// end of helper ------------------------------------------------------------------
export default async function HomePage() {
  const stats = await getDashboardStats();
  return <HomeDashboardClient stats={stats} />;
}
