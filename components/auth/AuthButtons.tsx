"use client";

import React, { useState, useEffect } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export function AuthButtons() {
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-24 animate-pulse rounded-full bg-zinc-800/80" />
    );
  }

  return (
    <div className="flex items-center gap-3">
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
        <UserButton />
      </Show>
    </div>
  );
}
