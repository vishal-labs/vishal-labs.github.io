import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders({ subsets: ["latin"], weight: ["800", "900"], variable: "--font-display" });
const body = Hanken_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Vishal Dodda · SRE for blockchain infrastructure",
  description:
    "Vishal Dodda (vishal-labs): SRE for blockchain infrastructure, building where reliability, AI and web3 cross, all running on a homelab.",
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
