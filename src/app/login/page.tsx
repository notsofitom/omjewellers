
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Please try again.");
        return;
      }

      setPassword("");
      router.replace("/dashboard/products");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-5 rounded-2xl border p-6 shadow-sm"
      >
        <div>
          <h1 className="text-2xl font-bold">Owner Login</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to manage your jewellery catalogue.
          </p>
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Owner password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <a href="/shop" className="block text-center text-sm underline">
          Return to customer shop
        </a>
      </form>
    </main>
  );
}
