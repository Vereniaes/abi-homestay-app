"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import SplashScreen from "@/components/SplashScreen";

// helper --------------------------------------------------------------------------
// function AppLayoutWrapper untuk mengontrol navigasi global, splash screen, dan layout
// input param : children (React.ReactNode)
// output : React JSX Component Layout Wrapper
// end of helper ------------------------------------------------------------------
export default function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <>
      <SplashScreen />
      {!isLoginPage && <Navigation />}
      <div className={isLoginPage ? "min-h-screen w-full" : "md:pl-64 min-h-screen overflow-x-hidden w-full transition-all"}>
        {children}
      </div>
    </>
  );
}

