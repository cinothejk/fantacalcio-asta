"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"

type Auction = {
  id: string
  name: string
  created_at: string
  participants_count: number
}

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNewAuction, setShowNewAuction] = useState(false)
  const [auctionName, setAuctionName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadAuctions()
  }, [])

  async function loadAuctions() {
    setLoading(true)
    setError("")

    const { data, error } = await supabase.rpc("get_my_auctions")

    if (error) {
      console.error(error)
      setError("Errore nel caricamento delle aste.")
    } else {
      setAuctions(data || [])
    }

    setLoading(false)
  }

  async function createAuction() {
    const name = auctionName.trim()

    if (!name) {
      setError("Inserisci un nome per l'asta.")
      return
    }

    setCreating(true)
    setError("")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Utente non autenticato.")
      setCreating(false)
      return
    }

    const { error } = await supabase
      .from("auctions")
      .insert({
        user_id: user.id,
        name,
      })

    if (error) {
      console.error(error)
      setError("Errore nella creazione dell'asta.")
      setCreating(false)
      return
    }

    setAuctionName("")
    setShowNewAuction(false)
    setCreating(false)

    await loadAuctions()
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            ⚽ Fantacalcio Asta
          </h1>

          <p className="mt-2 text-gray-600">
            Gestisci le tue aste di fantacalcio
          </p>
        </header>

        {/* ASTE */}
        <section className="mb-10">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Le mie aste
            </h2>

            <button
              onClick={() => {
                setShowNewAuction(true)
                setError("")
              }}
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              + Nuova asta
            </button>
          </div>

          {loading ? (
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-gray-500">
                Caricamento aste...
              </p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-lg font-semibold text-gray-900">
                Nessuna asta presente
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Crea la tua prima asta per iniziare.
              </p>

              <button
                onClick={() => setShowNewAuction(true)}
                className="mt-5 rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
              >
                + Crea nuova asta
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {auctions.map((auction) => (
                <div
                  key={auction.id}
                  className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <h3 className="text-xl font-semibold text-gray-900">
                    🏆 {auction.name}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {auction.participants_count}{" "}
                    {auction.participants_count === 1
                      ? "partecipante"
                      : "partecipanti"}
                  </p>

                  <Link
                    href={`/asta?auction=${auction.id}`}
                    className="mt-5 inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                  >
                    Apri asta →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MODALE NUOVA ASTA */}
        {showNewAuction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

              <h2 className="text-2xl font-bold text-gray-900">
                Nuova asta
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Inserisci il nome della nuova asta.
              </p>

              <input
                type="text"
                value={auctionName}
                onChange={(e) => setAuctionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createAuction()
                  }
                }}
                placeholder="Es. Fantacalcio amici 2026"
                className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-black"
                autoFocus
              />

              {error && (
                <p className="mt-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNewAuction(false)
                    setAuctionName("")
                    setError("")
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Annulla
                </button>

                <button
                  onClick={createAuction}
                  disabled={creating}
                  className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creazione..." : "Crea asta"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MENU */}
        <section>
          <h2 className="mb-5 text-2xl font-bold text-gray-900">
            Gestione
          </h2>

          <nav className="grid gap-4 sm:grid-cols-2">

            <Link
              href="/partecipanti"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                👥 Partecipanti
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Aggiungi e gestisci i partecipanti all&apos;asta.
              </p>
            </Link>

            <Link
              href="/importa"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                📋 Importa giocatori
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Importa la lista dei giocatori da XLSX o CSV.
              </p>
            </Link>

            <Link
              href="/asta"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                🔨 Asta
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Avvia e gestisci l&apos;asta dei giocatori.
              </p>
            </Link>

            <Link
              href="/overview"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                📊 Overview
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Visualizza la situazione delle rose e dei crediti.
              </p>
            </Link>

            <Link
              href="/assegna"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                📌 Assegna
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Assegna giocatori manualmente.
              </p>
            </Link>

            <Link
              href="/giocatori"
              className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                🏃 Giocatori
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Visualizza la situazione dei giocatori.
              </p>
            </Link>

          </nav>
        </section>

      </div>
    </main>
  )
}