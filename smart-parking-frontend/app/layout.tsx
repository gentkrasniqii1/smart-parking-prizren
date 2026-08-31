import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/nav/Header";
import { Footer } from "@/components/nav/Footer";
import { Toaster } from "@/components/providers/Toaster";
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
  title: {
    default: "Smart Parking Prizren — Gjej vendparkim në kohë reale",
    template: "%s · Smart Parking Prizren",
  },
  description:
    "Gjej vendparkime të lira në Prizren, rezervo vendparkim dhe menaxho sesionin tënd të parkimit në kohë reale.",
  applicationName: "Smart Parking Prizren",
  openGraph: {
    type: "website",
    locale: "sq_AL",
    siteName: "Smart Parking Prizren",
    title: "Smart Parking Prizren — Gjej vendparkim në kohë reale",
    description:
      "Gjej vendparkime të lira në Prizren, rezervo vendparkim dhe menaxho sesionin tënd të parkimit në kohë reale.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Parking Prizren — Gjej vendparkim në kohë reale",
    description:
      "Gjej vendparkime të lira në Prizren, rezervo vendparkim dhe menaxho sesionin tënd të parkimit në kohë reale.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sq"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <ThemeProvider>
          <QueryProvider>
            <a href="#main-content" className="skip-link rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              Kalo te përmbajtja
            </a>
            <Header />
            <div id="main-content" className="flex flex-1 flex-col">
              {children}
            </div>
            <Footer />
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
