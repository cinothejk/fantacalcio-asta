"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError("Email o password non corretti.")
      setLoading(false)
      return
    }

    router.replace("/")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Fantacalcio"
              width={160}
              height={160}
              priority
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Fantacalcio Asta<br/>
            Fant Aste e Co.

          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Accedi per gestire l&apos;asta
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="La tua email"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-900"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <Link
                href="/reset-password"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Password dimenticata?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="La tua password"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-900"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>

          <div className="border-t border-gray-100 pt-5 text-center">
            <p className="text-sm text-gray-500">
              Non hai ancora un account?
            </p>

            <Link
              href="/registrazione"
              className="mt-1 inline-block text-sm font-semibold text-gray-900 hover:underline"
            >
              Registrati
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}

