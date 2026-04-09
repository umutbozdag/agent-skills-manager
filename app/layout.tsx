import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Skills Manager",
  description: "Manage all your AI agent skills from a single dashboard",
};

function Sidebar() {
  return (
    <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <Image
              src="/app-icon-symbol.png"
              alt="Skills Manager"
              width={22}
              height={22}
            />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Skills Manager</h1>
            <p className="text-xs text-muted">AI Agent Skills</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        <NavLink href="/" icon="grid">Dashboard</NavLink>
        <NavLink href="/install" icon="download">Install Skill</NavLink>
        <NavLink href="/projects" icon="folder">Projects</NavLink>
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted">Scans global, plugin, and project skill directories</p>
      </div>
    </aside>
  );
}

function NavLink({ href, icon, children }: { href: string; icon: string; children: React.ReactNode }) {
  const icons: Record<string, string> = {
    grid: "M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z",
    download: "M12 2v13m0 0l-4-4m4 4l4-4M4 19h16",
    folder: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  };

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-card-hover transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={icons[icon]} />
      </svg>
      {children}
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Suspense fallback={<div className="p-8 text-muted">Loading...</div>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
