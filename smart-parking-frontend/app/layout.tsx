import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/nav/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Smart Parking Prizren",
  description: "Platformë real-time për parkim inteligjent në Prizren",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sq"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <QueryProvider>
            <Header />
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
