import "./globals.css";
import { Nav } from "@/components/Nav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Fluency Gym (4D)",
  description: "Educational AI fluency self-assessment inspired by the 4D framework and AI Fluency Index themes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-root min-h-screen bg-neutral-50 font-sans text-neutral-900">
        <div className="bg-orb bg-orb-a" aria-hidden="true" />
        <div className="bg-orb bg-orb-b" aria-hidden="true" />
        <div className="bg-orb bg-orb-c" aria-hidden="true" />
        <Nav />
        <main className="relative z-10">{children}</main>
        <footer className="relative z-10 mt-10 border-t border-neutral-200/80 py-8 text-center text-sm text-neutral-600">
          Educational self-assessment • Transcript runs local by default • Challenge runs saved server-side
        </footer>
      </body>
    </html>
  );
}
