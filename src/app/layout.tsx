import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppNav } from "@/components/nav/AppNav";
import { ScrollableMain } from "@/components/ScrollableMain";
import { THEME_INIT_SCRIPT } from "@/shared/utils/theme";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  weight: "variable", // axes opsz exige la police variable (wght inclus)
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains",
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
    <html
      lang="fr"
      data-theme="light"
      suppressHydrationWarning
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-bg font-sans antialiased text-ink"
      >
        <Providers>
          <a
            href="#contenu"
            className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-60 focus:rounded-ctrl focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-ink focus:shadow-lift"
          >
            Aller au contenu
          </a>
          <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
            <AppNav />
            <ScrollableMain>{children}</ScrollableMain>
          </div>
        </Providers>
      </body>
    </html>
  );
}
