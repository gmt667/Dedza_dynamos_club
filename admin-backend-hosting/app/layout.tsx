import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dedza Dynamos | Staff Admin",
  description: "Private publishing console for Dedza Dynamos FC staff.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/dedza-dynamos-logo.png",
    shortcut: "/dedza-dynamos-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
