"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"

export default function RegistrazionePage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleRegistration(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError("")

    if (password !== confirmPassword) {
      setError("Le password non coincidono.")
      return
    }

    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error(error)
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
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
            Registrati a Fantacalcio Asta
            Registrati a Fant Aste e Co.
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Registrati per iniziare a gestire le tue aste
          </p>
        </div>

        {success ? (
          <div>
            <div className="rounded-lg bg-green-50 px-4 py-4 text-sm text-green-700">
              <p className="font-semibold">
                Registrazione completata!
              </p>

              <p className="mt-1">
                Controlla la tua email e clicca sul link di conferma
                per attivare il tuo account.
              </p>
            </div>

            <button
              onClick={() => router.replace("/login")}
              className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
            >
              Vai al login
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegistration} className="space-y-5">

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
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Almeno 6 caratteri"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Conferma password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Ripeti la password"
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
              {loading ? "Registrazione in corso..." : "Registrati"}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Hai già un account? Accedi
              </Link>
            </div>
          </form>
        )}

      </div>
    </main>
  )
}

