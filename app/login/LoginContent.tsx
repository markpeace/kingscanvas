"use client";

import { signIn } from "next-auth/react";

export default function LoginContent() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 text-gray-900">
      <div className="flex w-full max-w-md flex-col items-center justify-center rounded-md border border-gray-200 bg-white p-8 text-center shadow-md">
        <h1 className="mb-2 text-2xl font-semibold text-kings-red">King’s Canvas</h1>
        <p className="mb-6 text-sm text-gray-600">
          Sign in to access your personalised goals and plans.
        </p>
        <button
          type="button"
          aria-label="Sign in with Google"
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center gap-2 rounded-md border border-kings-red px-4 py-2 text-kings-red transition-colors hover:bg-kings-red hover:text-white focus:outline-none focus:ring-2 focus:ring-kings-red focus:ring-offset-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width="22"
            height="22"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.72 1.22 9.22 3.59l6.84-6.84C36.04 2.42 30.44 0 24 0 14.64 0 6.44 5.36 2.56 13.09l7.96 6.19C12.32 12.37 17.69 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.98 24.55c0-1.57-.14-3.09-.41-4.55H24v9.08h12.94c-.56 2.84-2.23 5.24-4.73 6.84l7.27 5.63c4.25-3.93 6.7-9.72 6.7-16z"
            />
            <path
              fill="#4A90E2"
              d="M10.52 28.77A14.46 14.46 0 0 1 9.5 24c0-1.65.28-3.24.78-4.77l-7.96-6.19C.79 16.35 0 20.08 0 24c0 3.92.79 7.65 2.32 10.96l8.2-6.19z"
            />
            <path
              fill="#FBBC05"
              d="M24 48c6.48 0 11.92-2.13 15.89-5.79l-7.27-5.63C30.64 38.41 27.52 39.5 24 39.5c-6.31 0-11.68-3.87-13.95-9.27l-8.2 6.19C6.44 42.64 14.64 48 24 48z"
            />
            <path fill="none" d="M0 0h48v48H0z" />
          </svg>
          Sign in with Google
        </button>
      </div>

      <footer className="mt-8 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} King’s College London
      </footer>
    </main>
  );
}
