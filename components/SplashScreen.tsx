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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            className="w-12 h-12 fill-white"
            aria-hidden="true"
          >
            <path d="M697-623h60v-60h-60v60Zm0 171h60v-60h-60v60Zm0 170h60v-60h-60v60Zm-56 162v-60h219v-600H465v112l-60-42v-130h515v720H641Zm-601 0v-390l271-194 270 194v390H364v-201H258v201H40Zm60-60h98v-201h226v201h97v-299L311-630 100-478.58V-180Zm541-365ZM424-180v-201H198v201-201h226v201Z" />
          </svg>
        </div>
        <h1 className="font-headline-lg text-white tracking-tight">Abi Homestay</h1>
        <p className="font-body-md text-brand-teal mt-2">Manajemen Kost Mudah</p>
      </div>
    </div>
  );
}
