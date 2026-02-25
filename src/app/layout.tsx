import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kassim Khemaci | Creative Portfolio 2025",
  description: "Digital Portfolio immersing you in the intersection of Fullstack development and Artificial Intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
