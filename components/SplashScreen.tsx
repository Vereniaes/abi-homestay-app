"use client";

import { useEffect, useState } from "react";

// helper --------------------------------------------------------------------------
// function SplashScreen overlay animasi awal masuk aplikasi (durasi 2.0 detik)
// input param : none
// output : React Component JSX atau null jika sudah selesai
// end of helper ------------------------------------------------------------------
export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (sessionStorage.getItem("splashShown")) {
      setVisible(false);
      return;
    }

    const timer1 = setTimeout(() => {
      setOpacity(0);
      const timer2 = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem("splashShown", "true");
      }, 700);
      return () => clearTimeout(timer2);
    }, 2000);

    return () => clearTimeout(timer1);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{ opacity, transition: "opacity 700ms ease" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-deep-blue"
    >
      <div className="flex flex-col items-center animate-pulse">
        <div className="w-20 h-20 bg-brand-teal rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(13,148,136,0.4)] mb-4">
          <span className="material-symbols-outlined text-white text-5xl" data-icon="home_work">
            home_work
          </span>
        </div>
        <h1 className="font-headline-lg text-white tracking-tight">Abi Homestay</h1>
        <p className="font-body-md text-brand-teal mt-2">Manajemen Kost Mudah</p>
      </div>
    </div>
  );
}
