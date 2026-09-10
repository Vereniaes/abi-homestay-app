"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions";
import { clearClientCache } from "@/lib/client-cache";

// helper --------------------------------------------------------------------------
// function Halaman Login Utama dengan Centered Glassmorphism Card & Preset Account Selector
// input param : none
// output : React JSX Component Halaman Login
// end of helper ------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // helper --------------------------------------------------------------------------
  // function untuk memuat preset akun pengujian (admin, edit, view)
  // input param : user (string), pass (string)
  // output : void (mengeset state username & password)
  // end of helper ------------------------------------------------------------------
  const handlePresetSelect = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg("");
  };

  // helper --------------------------------------------------------------------------
  // function untuk menangani submisi form login
  // input param : e (React.FormEvent)
  // output : void (proses autentikasi Server Action & navigasi)
  // end of helper ------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Username dan password wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const result = await loginUser(formData);
    setIsLoading(false);

    if (result.success) {
      clearClientCache();
      window.location.href = "/";
    } else {
      setErrorMsg(result.message || "Username atau password salah.");
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-surface-bright px-4 py-8 relative overflow-hidden">
      {/* Background Subtle Accent */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-secondary-container/10 rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-primary-fixed/10 rounded-full pointer-events-none" />

      {/* Main Login Card Container */}
      <div className="w-full max-w-[28rem] bg-white border border-outline-variant/30 rounded-2xl shadow-xl p-6 sm:p-8 relative z-10 animate-slide-up">
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center shadow-soft-teal mb-3">
            <span className="material-symbols-outlined text-on-secondary text-3xl">
              apartment
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-md text-on-surface font-bold tracking-tight">
            Abi Homestay
          </h1>
          <p className="font-body-md text-label-md text-on-surface-variant mt-1">
            Masuk ke Sistem Manajemen Kost Terpadu
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-error-container/60 border border-error/20 flex items-center gap-3 text-on-error-container animate-pulse-slow">
            <span className="material-symbols-outlined text-error text-xl shrink-0">
              error
            </span>
            <span className="text-label-md font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Form Input Login */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Input Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-semibold text-on-surface">
              Username
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-xl pointer-events-none">
                person
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username Anda"
                className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all text-body-md"
                required
              />
            </div>
          </div>

          {/* Input Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-label-md font-semibold text-on-surface">
              Password
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-xl pointer-events-none">
                lock
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                className="w-full pl-11 pr-11 py-3 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all text-body-md"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-outline hover:text-on-surface transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 mt-2 bg-secondary hover:bg-on-secondary-fixed-variant text-on-secondary font-semibold rounded-xl shadow-soft-teal transition-all flex items-center justify-center gap-2 press-effect disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">login</span>
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Preset Account Badges */}
        <div className="mt-8 pt-6 border-t border-outline-variant/30">
          <p className="text-label-sm text-outline text-center mb-3 font-medium">
            Atau pilih akun pengujian bawaan:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePresetSelect("admin", "admin123")}
              className="py-2 px-2 bg-secondary-container/20 hover:bg-secondary-container/40 border border-secondary/20 rounded-xl flex flex-col items-center transition-all scale-on-press"
            >
              <span className="text-label-sm font-bold text-secondary">ADMIN</span>
              <span className="text-[10px] text-on-surface-variant font-mono">admin123</span>
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("edit", "edit123")}
              className="py-2 px-2 bg-primary-fixed/20 hover:bg-primary-fixed/40 border border-primary-fixed-dim/30 rounded-xl flex flex-col items-center transition-all scale-on-press"
            >
              <span className="text-label-sm font-bold text-on-primary-fixed-variant">EDIT</span>
              <span className="text-[10px] text-on-surface-variant font-mono">edit123</span>
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect("view", "view123")}
              className="py-2 px-2 bg-surface-container-high hover:bg-surface-variant border border-outline-variant/40 rounded-xl flex flex-col items-center transition-all scale-on-press"
            >
              <span className="text-label-sm font-bold text-outline">VIEW</span>
              <span className="text-[10px] text-on-surface-variant font-mono">view123</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
