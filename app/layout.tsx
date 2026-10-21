import type { Metadata } from "next";
import { IBM_Plex_Mono, Press_Start_2P } from "next/font/google";
import { Shell } from "@/components/shell";
import { WalletProvider } from "@/lib/wallet";
import "./globals.css";

const pixel = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "fees.cards",
  description: "Cards that pay you.",
  metadataBase: new URL("https://fees.cards"),
  openGraph: {
    title: "fees.cards",
    description: "Cards that pay you.",
    images: [{ url: "https://feescards-frontend.vercel.app/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "fees.cards",
    description: "Cards that pay you.",
    images: ["https://feescards-frontend.vercel.app/og.png"],
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body className={`${pixel.variable} ${mono.variable} bg-black font-mono text-cream antialiased`}>
      <WalletProvider>
        <Shell>{children}</Shell>
      </WalletProvider>
    </body>
  </html>
);

export default RootLayout;
