"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton({ callbackUrl = "/" }: { callbackUrl?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl })}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 lg:py-3 min-h-[48px] text-[15px] lg:text-sm font-semibold text-brand-dark hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.11C3.26 21.3 7.31 24 12 24z" />
        <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.29V6.6H1.28A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.28 5.4z" />
        <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.6l4.01 3.11C6.23 6.88 8.88 4.77 12 4.77z" />
      </svg>
      Continuar con Google
    </button>
  );
}
