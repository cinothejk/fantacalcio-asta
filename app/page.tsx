
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import Image from "next/image"

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
  const [deletingAuctionId, setDeletingAuctionId] = useState<string | null>(null)
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

    const {
      data: auction,
      error,
    } = await supabase
      .from("auctions")
      .insert({
        user_id: user.id,
        name,
      })
      .select("id")
      .single()

    if (error) {
      console.error(error)
      setError("Errore nella creazione dell'asta.")
      setCreating(false)
      return
    }

    setAuctionName("")
    setShowNewAuction(false)
    setCreating(false)

    window.location.href = `/partecipanti?auction=${auction.id}`
  }

  async function deleteAuction(auction: Auction) {
    const confirmed = window.confirm(
      `Sei sicuro di voler cancellare l'asta "${auction.name}"?\n\n` +
      "Verranno cancellati anche tutti i partecipanti, gli acquisti e i dati relativi a questa asta.\n\n" +
      "Questa operazione non può essere annullata."
    )

    if (!confirmed) {
      return
    }

    setDeletingAuctionId(auction.id)
    setError("")

    const { error } = await supabase
      .from("auctions")
      .delete()
      .eq("id", auction.id)

    if (error) {
      console.error(error)
      setError("Errore nella cancellazione dell'asta.")
      setDeletingAuctionId(null)
      return
    }

    setAuctions((currentAuctions) =>
      currentAuctions.filter(
        (currentAuction) => currentAuction.id !== auction.id
      )
    )

    setDeletingAuctionId(null)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">

        {/* HEADER */}
        <header className="mb-8 sm:mb-10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Fantacalcio"
              width={64}
              height={64}
              priority
              className="h-12 w-12 object-contain sm:h-16 sm:w-16"
            />

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Fantacalcio Asta
            </h1>
          </div>

          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Gestisci le tue aste di fantacalcio
          </p>
        </header>

        {/* ASTE */}
        <section className="mb-10">

          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Le mie aste
            </h2>

            <button
              onClick={() => {
                setShowNewAuction(true)
                setError("")
              }}
              className="shrink-0 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 sm:px-4"
            >
              + Nuova asta
            </button>
          </div>

          {error && !showNewAuction && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
              <p className="text-sm text-gray-500 sm:text-base">
                Caricamento aste...
              </p>
            </div>
          ) : auctions.length === 0 ? (
            <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-8">
              <p className="text-lg font-semibold text-gray-900">
                Nessuna asta presente
              </p>

              <p className="mt-2 text-sm text-gray-500">
                Crea la tua prima asta per iniziare.
              </p>

              <button
                onClick={() => setShowNewAuction(true)}
                className="mt-5 w-full rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 sm:w-auto sm:py-2.5"
              >
                + Crea nuova asta
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {auctions.map((auction) => {
                const isDeleting = deletingAuctionId === auction.id

                return (
                  <div
                    key={auction.id}
                    className="rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-6"
                  >
                    <h3 className="break-words text-xl font-semibold text-gray-900">
                      🏆 {auction.name}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      {auction.participants_count}{" "}
                      {auction.participants_count === 1
                        ? "partecipante"
                        : "partecipanti"}
                    </p>

                    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Link
                        href={`/asta?auction=${auction.id}`}
                        className="rounded-lg bg-black px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-800 sm:py-2.5"
                      >
                        Apri asta →
                      </Link>

                      <button
                        onClick={() => deleteAuction(auction)}
                        disabled={
                          isDeleting || deletingAuctionId !== null
                        }
                        className="rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2.5"
                      >
                        {isDeleting
                          ? "Cancellazione..."
                          : "🗑️ Cancella"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* MODALE NUOVA ASTA */}
        {showNewAuction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 px-4 py-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">

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

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  onClick={() => {
                    setShowNewAuction(false)
                    setAuctionName("")
                    setError("")
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 sm:py-2"
                >
                  Annulla
                </button>

                <button
                  onClick={createAuction}
                  disabled={creating}
                  className="rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
                >
                  {creating ? "Creazione..." : "Crea asta"}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </main>
  )
}

