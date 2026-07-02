import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "CLP Learning Hub", template: "%s | CLP Learning Hub" },
  description: "Patient education platform by Clinic Living Plus.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://learn.cliniclivingplus.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
