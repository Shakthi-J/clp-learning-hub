import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CLP Learning Hub", template: "%s | CLP Learning Hub" },
  description: "Patient education from the Clinic Living Plus care team.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://learn.cliniclivingplus.com"),
};

// Runs before first paint so a saved theme is applied without the page flashing
// the wrong one. "system" stores nothing and lets the CSS media query decide.
const THEME_SCRIPT = `
(function () {
  try {
    var t = localStorage.getItem("clp-theme");
    if (t === "light" || t === "dark") document.documentElement.classList.add(t);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* next/script rather than a raw tag: React 19 warns that scripts
            rendered inside a component are not executed on the client. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_SCRIPT}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
