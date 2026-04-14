import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Face Detection and Mood Tracking System",
  description: "Track your moods with AI",
};
// test check

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
