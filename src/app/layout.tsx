import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VGS Vashishth Global Solutions | Home Appliance Repair & Handyman Services in Lucknow",
  description: "Book RO, AC, fridge, washing machine, chimney, geyser and microwave repair plus plumber, electrician, carpenter, painter, mason and pest control services in Lucknow with VGS Vashishth Global Solutions.",
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
