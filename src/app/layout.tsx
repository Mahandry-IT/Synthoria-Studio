import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Synthoria",
  description: "Génération de cours structurés par IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
        <Providers>
          <header className="border-b border-gray-200 bg-white">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
              <a href="/" className="text-lg font-bold text-gray-900">
                Synthoria
              </a>
              <nav className="flex items-center gap-4 text-sm" aria-label="Navigation principale">
                <a
                  href="/"
                  className="text-gray-600 transition-colors hover:text-gray-900"
                >
                  Upload
                </a>
                <a
                  href="/ask"
                  className="text-gray-600 transition-colors hover:text-gray-900"
                >
                  Poser une question
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
