import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

export const metadata: Metadata = {
  title: "MixMaven — Build DJ Sets with Spotify",
  description:
    "Build harmonic DJ sets, preview transitions, and share mixes — powered by Spotify.",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "MixMaven — Build DJ Sets with Spotify",
    description: "Build harmonic DJ sets, preview transitions, and share mixes.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${dmSerif.variable} font-sans bg-bg text-cream antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
