import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-display" });
const body = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

const description =
  "Vishal Dodda (vishal-labs): SRE for blockchain infrastructure, building where reliability, AI and web3 cross, all running on a homelab.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vishaldodda.me"),
  title: "Vishal Dodda · SRE for blockchain infrastructure",
  description,
  alternates: { canonical: "/" },
  // the card a shared link unfolds into: a real frame of the loom, captured by scripts/og.mjs
  openGraph: {
    type: "website",
    url: "/",
    siteName: "vishal-labs",
    title: "Vishal Dodda · SRE for blockchain infrastructure",
    description,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vishal Dodda's name woven into a Jacquard loom of homelab services" }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#16112e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
