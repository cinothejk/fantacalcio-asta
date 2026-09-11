
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [recoverySession, setRecoverySession] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkRecoverySession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (mounted) {
        setRecoverySession(!!session)
        setCheckingSession(false)
      }
    }

    checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) {
        return
      }

      if (event === "PASSWORD_RECOVERY") {
        setRecoverySession(!!session)
        setCheckingSession(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleUpdatePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setError("")

    if (password.length < 6) {
      setError("La password deve contenere almeno 6 caratteri.")
      return
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono.")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })


if (error) {
  console.error(error)

  const errorMessages: Record<string, string> = {
    "New password should be different from the old password.":
      "La nuova password deve essere diversa da quella precedente.",
    "Password should be at least 6 characters.":
      "La password deve contenere almeno 6 caratteri.",
    "Auth session missing!":
      "La sessione di recupero è scaduta. Richiedi un nuovo link.",
  }

  setError(
    errorMessages[error.message] ||
      "Non è stato possibile aggiornare la password. Il link potrebbe essere scaduto."
  )

  setLoading(false)
  return
}



    setSuccess(true)
    setLoading(false)
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-500">
          Verifica del link in corso...
        </div>
      </main>
    )
  }

  if (!recoverySession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">

          <div className="mb-8 text-center">
            <div className="mb-3 text-4xl">🔐</div>

            <h1 className="text-2xl font-bold text-gray-900">
              Reimposta password
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Per cambiare la password devi utilizzare il link
              ricevuto via email.
            </p>
          </div>

          <Link
            href="/reset-password"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
          >
            Richiedi un nuovo link
          </Link>

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Torna al login
            </Link>
          </div>

        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">

          <div className="mb-8 text-center">
            <div className="mb-3 text-4xl">✅</div>

            <h1 className="text-2xl font-bold text-gray-900">
              Password aggiornata!
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              La tua nuova password è stata salvata correttamente.
            </p>
          </div>

          <Link
            href="/"
            className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
          >
            Vai all&apos;app
          </Link>

        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🔐</div>

          <h1 className="text-2xl font-bold text-gray-900">
            Nuova password
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Inserisci la nuova password per il tuo account.
          </p>
        </div>

        <form
          onSubmit={handleUpdatePassword}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nuova password
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
              Conferma nuova password
            </label>

            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Ripeti la nuova password"
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
            {loading
              ? "Salvataggio in corso..."
              : "Imposta nuova password"}
          </button>
        </form>

      </div>
    </main>
  )
}

