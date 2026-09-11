
"use client"

import { FormEvent, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

type Participant = {
  id: string
  name: string
  initial_credits: number
  remaining_credits: number
}

export default function PartecipantiPage() {
  const searchParams = useSearchParams()
  const auctionId = searchParams.get("auction")

  const [participants, setParticipants] = useState<Participant[]>([])
  const [auctionName, setAuctionName] = useState("")
  const [name, setName] = useState("")
  const [credits, setCredits] = useState("500")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingInitialCredits, setEditingInitialCredits] = useState("")
  const [editingRemainingCredits, setEditingRemainingCredits] = useState("")
  const [editingSaving, setEditingSaving] = useState(false)
  const [deletingParticipantId, setDeletingParticipantId] = useState<string | null>(null)

  async function loadAuction() {
    if (!auctionId) return

    const { data, error } = await supabase
      .from("auctions")
      .select("name")
      .eq("id", auctionId)
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setAuctionName(data.name)
  }

  async function loadParticipants() {
    if (!auctionId) {
      setLoading(false)
      setError("Nessuna asta selezionata.")
      return
    }

    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("participants")
      .select("id, name, initial_credits, remaining_credits")
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setParticipants(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAuction()
    loadParticipants()
  }, [auctionId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!auctionId) {
      setError("Nessuna asta selezionata.")
      return
    }

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

    const { error } = await supabase
      .from("participants")
      .insert({
        auction_id: auctionId,
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

  function startEditing(participant: Participant) {
    setError("")
    setEditingParticipantId(participant.id)
    setEditingName(participant.name)
    setEditingInitialCredits(String(participant.initial_credits))
    setEditingRemainingCredits(String(participant.remaining_credits))
  }

  function cancelEditing() {
    setEditingParticipantId(null)
    setEditingName("")
    setEditingInitialCredits("")
    setEditingRemainingCredits("")
  }

  async function saveParticipant(participantId: string) {
    const trimmedName = editingName.trim()
    const initialCredits = Number(editingInitialCredits)
    const remainingCredits = Number(editingRemainingCredits)

    if (!trimmedName) {
      setError("Inserisci il nome del partecipante.")
      return
    }

    if (
      !Number.isInteger(initialCredits) ||
      initialCredits < 0 ||
      !Number.isInteger(remainingCredits) ||
      remainingCredits < 0
    ) {
      setError("I crediti devono essere numeri interi maggiori o uguali a 0.")
      return
    }

    if (remainingCredits > initialCredits) {
      setError("I crediti residui non possono essere superiori ai crediti iniziali.")
      return
    }

    setEditingSaving(true)
    setError("")

    const { error } = await supabase.rpc("update_participant", {
      p_participant_id: participantId,
      p_name: trimmedName,
      p_initial_credits: initialCredits,
      p_remaining_credits: remainingCredits,
    })

    if (error) {
      console.error(error)
      setError(error.message)
      setEditingSaving(false)
      return
    }

    cancelEditing()
    await loadParticipants()
    setEditingSaving(false)
  }

  async function deleteParticipant(participant: Participant) {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare "${participant.name}"?\n\n` +
      "Il partecipante può essere eliminato solo se non ha ancora effettuato acquisti."
    )

    if (!confirmed) {
      return
    }

    setDeletingParticipantId(participant.id)
    setError("")

    const { error } = await supabase.rpc("delete_participant", {
      p_participant_id: participant.id,
    })

    if (error) {
      console.error(error)
      setError(error.message)
      setDeletingParticipantId(null)
      return
    }

    setParticipants((currentParticipants) =>
      currentParticipants.filter(
        (currentParticipant) => currentParticipant.id !== participant.id
      )
    )

    setDeletingParticipantId(null)
  }

  if (!auctionId) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Nessuna asta selezionata
            </h1>

            <p className="mt-2 text-gray-600">
              Torna alla Home e apri un&apos;asta prima di gestire i partecipanti.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Asta
          </p>

          <h1 className="mt-1 text-3xl font-bold text-gray-900">
            {auctionName || "Caricamento..."}
          </h1>

          <p className="mt-2 text-gray-600">
            Gestisci i partecipanti di questa asta.
          </p>
        </div>

        <section className="rounded-xl bg-white p-6 shadow-sm">
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
              Nessun partecipante inserito in questa asta.
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {participants.map((participant) => {
                const isEditing = editingParticipantId === participant.id
                const isDeleting = deletingParticipantId === participant.id

                return (
                  <div
                    key={participant.id}
                    className="rounded-xl bg-white p-5 shadow-sm"
                  >
                    {isEditing ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Modifica partecipante
                        </h3>

                        <div className="mt-4 space-y-3">

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Nome
                            </label>

                            <input
                              type="text"
                              value={editingName}
                              onChange={(event) =>
                                setEditingName(event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Crediti iniziali
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editingInitialCredits}
                              onChange={(event) =>
                                setEditingInitialCredits(event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                              Crediti residui
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={editingRemainingCredits}
                              onChange={(event) =>
                                setEditingRemainingCredits(event.target.value)
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-gray-500"
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <button
                            onClick={() => saveParticipant(participant.id)}
                            disabled={editingSaving}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {editingSaving ? "Salvataggio..." : "Salva"}
                          </button>

                          <button
                            onClick={cancelEditing}
                            disabled={editingSaving}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Annulla
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
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

                        <div className="mt-5 flex gap-2">
                          <button
                            onClick={() => startEditing(participant)}
                            disabled={deletingParticipantId !== null}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            ✏️ Modifica
                          </button>

                          <button
                            onClick={() => deleteParticipant(participant)}
                            disabled={isDeleting || deletingParticipantId !== null}
                            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? "Eliminazione..." : "🗑️ Elimina"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </div>
    </main>
  )
}

