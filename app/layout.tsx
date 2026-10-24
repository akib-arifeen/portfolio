import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "../tokens.css";
import "./globals.css";
import "./desk.css";
import "./booth3d.css";

const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz", "SOFT"], variable: "--font-fraunces", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const siteDescription = "Software engineer in Hong Kong building AI products end to end: video generation, voice, photobooths and the infrastructure under them.";

export const metadata: Metadata = {
  metadataBase: new URL("https://akibarifeen.vercel.app"),
  applicationName: "Akib Arifeen",
  title: { default: "Akib Arifeen · Software engineer, Hong Kong", template: "%s · Akib Arifeen" },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "Akib Arifeen",
    title: "Akib Arifeen · Software engineer, Hong Kong",
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Akib Arifeen · Software engineer, Hong Kong",
    description: siteDescription,
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = { themeColor: "#171b22", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
