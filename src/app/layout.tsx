import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home Appliance Repair & Handyman Services in Lucknow | Vashishth Home Service",
  description: "Book RO, AC, fridge, washing machine, chimney, geyser and microwave repair plus plumber, electrician, carpenter, painter, mason and pest control services in Lucknow with Vashishth Home Service.",
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
