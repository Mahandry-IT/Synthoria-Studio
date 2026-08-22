import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/Sidebar";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
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
    <html lang="fr" className={geist.variable}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900"
      >
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-6 py-8">
              <div className="mx-auto max-w-4xl">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
