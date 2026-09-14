
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"

export default function RegistrazionePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = searchParams.get("status")

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

  if (status === "pending") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Fantacalcio"
              width={160}
              height={160}
              priority
              className="h-28 w-28 object-contain sm:h-36 sm:w-36"
            />
          </div>

          <div className="mb-5 text-5xl">
            ⏳
          </div>

          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Registrazione in attesa
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Il tuo account è stato creato correttamente.
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Prima di poter accedere all&apos;applicazione,
            il tuo account deve essere approvato da un amministratore.
          </p>

          <p className="mt-5 text-sm text-gray-500">
            Attendi l&apos;approvazione e riprova ad accedere
            successivamente.
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3.5 font-semibold text-white transition hover:bg-gray-800 sm:py-3"
          >
            Vai al login
          </button>
        </div>
      </main>
    )
  }

  if (status === "suspended") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="Fantacalcio"
              width={160}
              height={160}
              priority
              className="h-28 w-28 object-contain sm:h-36 sm:w-36"
            />
          </div>

          <div className="mb-5 text-5xl">
            🚫
          </div>

          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Account sospeso
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Il tuo account è stato sospeso da un amministratore.
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            Al momento non puoi accedere all&apos;applicazione.
          </p>

          <p className="mt-5 text-sm text-gray-500">
            Se ritieni che si tratti di un errore, contatta un amministratore.
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-3.5 font-semibold text-white transition hover:bg-gray-800 sm:py-3"
          >
            Torna al login
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 text-center sm:mb-8">
          <div className="mb-5 flex justify-center sm:mb-6">
            <Image
              src="/logo.png"
              alt="Fantacalcio"
              width={160}
              height={160}
              priority
              className="h-28 w-28 object-contain sm:h-36 sm:w-36"
            />
          </div>

          <h1 className="text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
            Registrati a Fantacalcio Asta
            <br />
            Registrati a Fant Aste e Co.
          </h1>

          <p className="mt-2 text-sm leading-5 text-gray-500">
            Registrati per iniziare a gestire le tue aste
          </p>
        </div>

        {success ? (
          <div>
            <div className="rounded-lg bg-green-50 px-4 py-4 text-sm leading-5 text-green-700">
              <p className="font-semibold">
                Registrazione completata!
              </p>

              <p className="mt-1">
                Il tuo account è stato creato correttamente ed è ora
                in attesa di approvazione da parte di un amministratore.
              </p>

              <p className="mt-2">
                Se richiesto, controlla anche la tua email per completare
                la conferma dell&apos;indirizzo.
              </p>
            </div>

            <button
              onClick={() => router.replace("/login")}
              className="mt-5 w-full rounded-lg bg-gray-900 px-4 py-3.5 font-semibold text-white transition hover:bg-gray-800 sm:py-3"
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
                autoComplete="email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900 sm:text-sm"
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
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900 sm:text-sm"
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
                autoComplete="new-password"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none transition focus:border-gray-900 sm:text-sm"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm leading-5 text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-4 py-3.5 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
            >
              {loading
                ? "Registrazione in corso..."
                : "Registrati"}
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

