"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
const [email, setEmail] = useState("")
const [password, setPassword] = useState("")
const [confirmPassword, setConfirmPassword] = useState("")

const [loading, setLoading] = useState(false)
const [checkingSession, setCheckingSession] = useState(true)

const [error, setError] = useState("")
const [message, setMessage] = useState("")
const [success, setSuccess] = useState(false)
const [recoverySession, setRecoverySession] = useState(false)

useEffect(() => {
let mounted = true


async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!mounted) {
    return
  }

  setRecoverySession(!!session)
  setCheckingSession(false)
}

checkSession()

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

async function handleSendResetEmail(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault()


setError("")
setMessage("")

if (!email.trim()) {
  setError("Inserisci il tuo indirizzo email.")
  return
}

setLoading(true)

const { error } = await supabase.auth.resetPasswordForEmail(
  email.trim(),
  {
    redirectTo: `${window.location.origin}/reset-password`,
  }
)

if (error) {
  console.error(error)

  setError(
    "Non è stato possibile inviare il link. Controlla l'indirizzo email e riprova."
  )

  setLoading(false)
  return
}

setMessage(
  "Se l'indirizzo è associato a un account, riceverai a breve un'email con il link per reimpostare la password."
)

setLoading(false)


}

async function handleUpdatePassword(
event: React.FormEvent<HTMLFormElement>
) {
event.preventDefault()


setError("")
setMessage("")

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
return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6"> <div className="text-center text-sm text-gray-500">
Verifica del link in corso... </div> </main>
)
}

if (success) {
return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6"> <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8"> <div className="mb-8 text-center"> <div className="mb-3 text-4xl">✅</div>


        <h1 className="text-2xl font-bold text-gray-900">
          Password aggiornata!
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          La tua nuova password è stata salvata correttamente.
        </p>
      </div>

      <Link
        href="/login"
        className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800"
      >
        Torna al login
      </Link>
    </div>
  </main>
)


}

if (recoverySession) {
return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6"> <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8"> <div className="mb-8 text-center"> <div className="mb-3 text-4xl">🔐</div>


        <h1 className="text-2xl font-bold text-gray-900">
          Nuova password
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Inserisci la nuova password per il tuo account.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-5">
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
            autoComplete="new-password"
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
            onChange={(event) =>
              setConfirmPassword(event.target.value)
            }
            placeholder="Ripeti la nuova password"
            required
            autoComplete="new-password"
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

return ( <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6"> <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-8"> <div className="mb-8 text-center"> <div className="mb-3 text-4xl">🔐</div>


      <h1 className="text-2xl font-bold text-gray-900">
        Reimposta password
      </h1>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        Inserisci il tuo indirizzo email per ricevere il link
        per reimpostare la password.
      </p>
    </div>

    <form onSubmit={handleSendResetEmail} className="space-y-5">
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
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-900"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Invio in corso..."
          : "Invia link di recupero"}
      </button>
    </form>

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
