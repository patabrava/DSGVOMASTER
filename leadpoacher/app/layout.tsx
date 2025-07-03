import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Providers from "../lib/providers";

export const metadata: Metadata = {
  title: "LeadPoacher - Competitor Mention Research Tool",
  description: "Find companies that mention your competitors and extract contact information from those sources",
  keywords: ["competitor research", "competitor mentions", "lead generation", "business intelligence", "competitor analysis"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-neutral font-sans text-dark antialiased">
        <Providers>
          {/* Header / Navigation */}
          <header className="bg-light border-b-2 border-dark sticky top-0 z-50">
            <nav className="container mx-auto px-4 lg:px-8 flex items-center justify-between h-20">
              <Link href="/" className="font-heading text-2xl text-dark">
                LEADPOACHER
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <a href="#" className="font-bold hover:text-primary transition-colors">
                  Research
                </a>
                <a href="#" className="font-bold hover:text-primary transition-colors">
                  Contacts
                </a>
                <a href="#" className="font-bold hover:text-primary transition-colors">
                  Export
                </a>
              </div>
              <button className="btn btn-primary">
                New Research
              </button>
            </nav>
          </header>

          {/* Main Content */}
          <main className="container mx-auto p-4 lg:p-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-16 border-t-2 border-dark bg-dark text-light">
            <div className="container mx-auto p-8 text-center">
              <p className="font-bold">LeadPoacher</p>
              <p className="text-sm mt-2">Competitor Mention Research • Powered by Next.js & Supabase</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
