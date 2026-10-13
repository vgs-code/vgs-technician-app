import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VGS Technician",
  description: "Technician partner app for Vashishth Home Service",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#102c46",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
