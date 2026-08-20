import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NO_FLASH_SCRIPT } from "@/lib/theme";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "trainlog",
  description: "Terminal-flavored training log.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the page paint into the notch/home-indicator areas on iOS.
  viewportFit: "cover",
  themeColor: "#212121",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Applies the saved theme before first paint, so a non-default theme
            never flashes the default one on load. */}
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className={`${jetbrainsMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
