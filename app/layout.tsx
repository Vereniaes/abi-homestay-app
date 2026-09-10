import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-plus-jakarta-sans",
});

export const metadata: Metadata = {
  title: "Abi Homestay - Manajemen Kost Mudah",
  description: "Aplikasi Manajemen Kost Abi Homestay Terpadu",
};

// helper --------------------------------------------------------------------------
// function RootLayout untuk layout utama aplikasi Abi Homestay
// input param : children (React.ReactNode)
// output : HTML Document React JSX dengan navigasi dan wrapper utama
// end of helper ------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-background min-h-screen pb-24 md:pb-0 font-sans">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}

