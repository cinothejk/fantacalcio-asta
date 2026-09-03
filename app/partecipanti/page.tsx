"use client"

import { FormEvent, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Participant = {
  id: string
  name: string
  initial_credits: number
  remaining_credits: number
}

export default function PartecipantiPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [name, setName] = useState("")
  const [credits, setCredits] = useState("500")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function loadParticipants() {
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("participants")
      .select("id, name, initial_credits, remaining_credits")
      .order("created_at", { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setParticipants(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadParticipants()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()
    const initialCredits = Number(credits)

    if (!trimmedName) {
      setError("Inserisci il nome del partecipante.")
      return
    }

    if (!Number.isInteger(initialCredits) || initialCredits < 0) {
      setError("I crediti devono essere un numero intero maggiore o uguale a 0.")
      return
    }

    setSaving(true)
    setError("")

    const { error } = await supabase.from("participants").insert({
      name: trimmedName,
      initial_credits: initialCredits,
      remaining_credits: initialCredits,
    })

    if (error) {
      setError(error.message)
    } else {
      setName("")
      setCredits("500")
      await loadParticipants()
    }

    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Partecipanti
        </h1>

        <p className="mt-2 text-gray-600">
          Aggiungi i partecipanti che prenderanno parte all&apos;asta.
        </p>

        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Nuovo partecipante
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Nome
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Es. Mario Rossi"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="credits"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Crediti iniziali
              </label>

              <input
                id="credits"
                type="number"
                min="0"
                step="1"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Salvataggio..." : "+ Aggiungi partecipante"}
            </button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">
            Partecipanti registrati
          </h2>

          {loading ? (
            <p className="mt-4 text-gray-500">
              Caricamento...
            </p>
          ) : participants.length === 0 ? (
            <div className="mt-4 rounded-xl bg-white p-6 text-gray-500 shadow-sm">
              Nessun partecipante inserito.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    {participant.name}
                  </h3>

                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Crediti iniziali
                    </span>

                    <span className="font-medium">
                      {participant.initial_credits}
                    </span>
                  </div>

                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-500">
                      Crediti residui
                    </span>

                    <span className="font-semibold">
                      {participant.remaining_credits}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}