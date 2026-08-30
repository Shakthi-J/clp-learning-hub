import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CLP Learning Hub", template: "%s | CLP Learning Hub" },
  description: "Patient education from the Clinic Living Plus care team.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://learn.cliniclivingplus.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
