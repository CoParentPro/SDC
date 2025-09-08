import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secure Data Compiler",
  description: "A secure, cross-platform application for data management and productivity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
