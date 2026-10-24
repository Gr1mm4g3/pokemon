import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Pokémon 151 Auto-Battler & Tournament Simulator",
  description:
    "Massive 22,650-match automated double round-robin tournament simulator featuring all 151 original Pokémon with live broadcast and global Elo rankings.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 selection:bg-red-500/30 selection:text-red-200">
        <ClerkProvider>
          <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-amber-500 shadow-lg shadow-red-500/20 text-white font-black text-xl">
                ⚡
              </div>
              <div>
                <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                  POKÉMON 151
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    Auto-Battler
                  </span>
                </div>
                <div className="text-[11px] font-medium text-zinc-400 hidden sm:block">
                  Massive Double Round-Robin Tournament (22,650 Matches)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Suspense
                fallback={
                  <div className="h-9 w-20 animate-pulse rounded-full bg-zinc-800" />
                }
              >
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="px-4 py-1.5 text-xs font-semibold rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-1.5 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <div className="flex items-center gap-3">
                    <UserButton />
                  </div>
                </Show>
              </Suspense>
            </div>
          </header>

          <main className="flex-1 flex flex-col">{children}</main>

          <footer className="border-t border-zinc-900 bg-zinc-950/90 py-6 px-6 text-center text-xs text-zinc-500">
            Pokémon Auto-Battler & Tournament Simulator &bull; 151 Double Round-Robin Engine with Global Elo System
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}