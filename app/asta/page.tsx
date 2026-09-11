
"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Participant = {
  id: string
  name: string
  remaining_credits: number
}

type Role = "P" | "D" | "C" | "A"

type Player = {
  id: string
  external_id: number | null
  name: string
  team: string | null
  role: Role
  mantra_role: string | null
  mv: number | null
  fm: number | null
  fvm_1000: number | null
  quotation: number | null
  cost: number | null
}

type Purchase = {
  id: string
  price: number
  created_at: string
  player: {
    name: string
    team: string | null
    role: Role
  } | null
}

const roles: { value: Role; label: string }[] = [
  { value: "P", label: "Portieri" },
  { value: "D", label: "Difensori" },
  { value: "C", label: "Centrocampisti" },
  { value: "A", label: "Attaccanti" },
]

export default function AstaPage() {
  const [auctionId, setAuctionId] = useState<string | null>(null)
  const [auctionName, setAuctionName] = useState("Asta")

  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null)

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loadingPurchases, setLoadingPurchases] = useState(false)

  const [showAuctionModal, setShowAuctionModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [drawing, setDrawing] = useState(false)

  const [selectedParticipantId, setSelectedParticipantId] = useState("")
  const [price, setPrice] = useState("")
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get("auction")

    setAuctionId(id)

    if (!id) {
      setLoading(false)
      setError("Nessuna asta selezionata.")
      return
    }

    loadAuction(id)
    loadParticipants(id)
  }, [])

  async function loadAuction(id: string) {
    const { data, error } = await supabase
      .from("auctions")
      .select("id, name")
      .eq("id", id)
      .single()

    if (error) {
      setError(error.message)
      return
    }

    setAuctionName(data.name)
  }

  async function loadParticipants(id: string) {
    setLoading(true)
    setError("")

    const { data, error } = await supabase
      .from("participants")
      .select("id, name, remaining_credits")
      .eq("auction_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      setError(error.message)
      setParticipants([])
    } else {
      setParticipants(data ?? [])
    }

    setLoading(false)
  }

  function openAuctionModal() {
    setSelectedRole(null)
    setSelectedPlayer(null)
    setSelectedParticipantId("")
    setPrice("")
    setError("")
    setShowAuctionModal(true)
  }

  function closeAuctionModal() {
    setShowAuctionModal(false)
    setSelectedRole(null)
    setSelectedPlayer(null)
    setSelectedParticipantId("")
    setPrice("")
    setError("")
  }

  async function drawPlayer() {
    if (!auctionId || !selectedRole) {
      return
    }

    setSelectedParticipantId("")
    setPrice("")
    setDrawing(true)
    setError("")

    const { data, error } = await supabase.rpc(
      "get_random_available_player",
      {
        p_auction_id: auctionId,
        p_role: selectedRole,
      }
    )

    if (error) {
      setError(error.message)
      setDrawing(false)
      return
    }

    if (!data || data.length === 0) {
      setError(
        `Non ci sono più giocatori disponibili per il ruolo ${selectedRole}.`
      )
      setDrawing(false)
      return
    }

    setSelectedPlayer(data[0])
    setDrawing(false)
  }

  async function declinePlayer() {
    if (!auctionId || !selectedPlayer) {
      return
    }

    setError("")

    const { error } = await supabase.rpc("decline_player", {
      p_auction_id: auctionId,
      p_player_id: selectedPlayer.id,
    })

    if (error) {
      setError(error.message)
      return
    }

    setSelectedPlayer(null)
  }

  async function assignPlayer() {
    if (!auctionId || !selectedPlayer || !selectedParticipantId) {
      setError("Seleziona un partecipante.")
      return
    }

    const numericPrice = Number(price)

    if (!Number.isInteger(numericPrice) || numericPrice < 0) {
      setError("Inserisci un prezzo valido.")
      return
    }

    const participant = participants.find(
      (item) => item.id === selectedParticipantId
    )

    if (!participant) {
      setError("Partecipante non trovato.")
      return
    }

    if (numericPrice > participant.remaining_credits) {
      setError("Il partecipante non ha abbastanza crediti.")
      return
    }

    setAssigning(true)
    setError("")

    const { error } = await supabase.rpc(
      "assign_player_to_participant",
      {
        p_auction_id: auctionId,
        p_player_id: selectedPlayer.id,
        p_participant_id: selectedParticipantId,
        p_price: numericPrice,
      }
    )

    if (error) {
      setError(error.message)
      setAssigning(false)
      return
    }

    setParticipants((current) =>
      current.map((item) =>
        item.id === selectedParticipantId
          ? {
              ...item,
              remaining_credits:
                item.remaining_credits - numericPrice,
            }
          : item
      )
    )

    await loadPurchases(selectedParticipantId)

    setSelectedPlayer(null)
    setSelectedParticipantId("")
    setPrice("")
    setAssigning(false)
  }

  async function loadPurchases(participantId: string) {
    setLoadingPurchases(true)
    setError("")

    const { data, error } = await supabase
      .from("purchases")
      .select(`
        id,
        price,
        created_at,
        player:players (
          name,
          team,
          role
        )
      `)
      .eq("participant_id", participantId)
      .eq("auction_id", auctionId)
      .order("created_at", { ascending: true })

    if (error) {
      setError(error.message)
      setPurchases([])
    } else {
      setPurchases(
        (data ?? []).map((purchase) => ({
          ...purchase,
          player: Array.isArray(purchase.player)
            ? purchase.player[0] ?? null
            : purchase.player,
        })) as Purchase[]
      )
    }

    setLoadingPurchases(false)
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">

        {/* HEADER */}
        <header className="overflow-hidden rounded-xl bg-white shadow-sm">

          <div className="border-b px-4 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Asta
            </p>

            <h1 className="mt-1 break-words text-xl font-bold text-gray-900 sm:text-2xl">
              {auctionName}
            </h1>
          </div>

          <div className="flex overflow-x-auto border-b">
            <button
              type="button"
              onClick={openAuctionModal}
              className="shrink-0 border-b-2 border-black px-5 py-4 text-sm font-bold text-gray-900 transition hover:bg-gray-50 sm:px-6"
            >
              🔨 ASTA
            </button>

            {participants.map((participant) => (
              <button
                key={participant.id}
                type="button"
                onClick={() => {
                  setSelectedParticipant(participant)
                  loadPurchases(participant.id)
                }}
                className={`shrink-0 border-b-2 px-5 py-4 text-sm font-medium transition sm:px-6 ${
                  selectedParticipant?.id === participant.id
                    ? "border-black text-gray-900"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {participant.name}
              </button>
            ))}
          </div>
        </header>

        {/* CONTENUTO */}
        <section className="mt-4 sm:mt-6">

          {loading && (
            <div className="rounded-xl bg-white p-6 text-center text-sm text-gray-500 shadow-sm sm:p-8 sm:text-base">
              Caricamento partecipanti...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 shadow-sm sm:p-6 sm:text-base">
              Errore: {error}
            </div>
          )}

          {!loading &&
            !error &&
            participants.length === 0 && (
              <div className="rounded-xl bg-white p-6 text-center shadow-sm sm:p-8">

                <h2 className="text-xl font-semibold text-gray-900">
                  Nessun partecipante
                </h2>

                <p className="mt-2 text-sm text-gray-500 sm:text-base">
                  Aggiungi almeno un partecipante prima di iniziare
                  l&apos;asta.
                </p>

              </div>
            )}

          {!loading &&
            !error &&
            participants.length > 0 &&
            !selectedParticipant && (
              <div className="rounded-xl bg-white px-5 py-10 text-center shadow-sm sm:p-10">

                <div className="text-5xl">
                  🔨
                </div>

                <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                  Asta del Fantacalcio
                </h1>

                <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 sm:text-base">
                  Clicca su <strong>ASTA</strong> per estrarre il prossimo
                  giocatore.
                </p>

                <button
                  type="button"
                  onClick={openAuctionModal}
                  className="mt-6 w-full rounded-lg bg-black px-6 py-3 font-semibold text-white transition hover:bg-gray-800 sm:w-auto"
                >
                  🔨 Inizia asta
                </button>

              </div>
            )}

          {selectedParticipant && (
            <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">

              {/* RIEPILOGO PARTECIPANTE */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">
                  <p className="text-sm text-gray-500">
                    Partecipante
                  </p>

                  <h1 className="mt-1 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                    {selectedParticipant.name}
                  </h1>
                </div>

                <div className="w-full rounded-lg bg-gray-100 px-5 py-3 sm:w-auto">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Crediti residui
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {selectedParticipant.remaining_credits}
                  </p>
                </div>

              </div>

              <div className="mt-6 border-t pt-5 sm:mt-8 sm:pt-6">

                <h2 className="text-lg font-semibold">
                  Rosa
                </h2>

                <div className="mt-4 sm:mt-6">

                  {/* RIEPILOGO ROSA */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">
                        <h2 className="break-words text-xl font-bold text-gray-900 sm:text-2xl">
                          {selectedParticipant.name}
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 sm:text-base">
                          Situazione attuale
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-gray-500">
                          Crediti rimasti
                        </p>

                        <p className="text-3xl font-bold text-gray-900">
                          {selectedParticipant.remaining_credits}
                        </p>
                      </div>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3">

                      <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                        <p className="text-xs text-gray-500 sm:text-sm">
                          Giocatori acquistati
                        </p>

                        <p className="mt-1 text-xl font-bold sm:text-2xl">
                          {purchases.length}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3 sm:p-4">
                        <p className="text-xs text-gray-500 sm:text-sm">
                          Crediti spesi
                        </p>

                        <p className="mt-1 text-xl font-bold sm:text-2xl">
                          {purchases.reduce(
                            (total, purchase) =>
                              total + purchase.price,
                            0
                          )}
                        </p>
                      </div>

                      <div className="col-span-2 rounded-lg bg-gray-50 p-3 sm:col-span-1 sm:p-4">
                        <p className="text-xs text-gray-500 sm:text-sm">
                          Crediti iniziali
                        </p>

                        <p className="mt-1 text-xl font-bold sm:text-2xl">
                          {selectedParticipant.remaining_credits +
                            purchases.reduce(
                              (total, purchase) =>
                                total + purchase.price,
                              0
                            )}
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* ROSA */}
                  <div className="mt-6">

                    <h3 className="text-xl font-bold text-gray-900">
                      Rosa
                    </h3>

                    {loadingPurchases ? (
                      <p className="mt-4 text-sm text-gray-500 sm:text-base">
                        Caricamento rosa...
                      </p>
                    ) : purchases.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500 sm:p-6 sm:text-base">
                        Nessun giocatore acquistato.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">

                        {purchases.map((purchase, index) => (
                          <div
                            key={purchase.id}
                            className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                          >

                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                                {index + 1}
                              </div>

                              <div className="min-w-0">
                                <p className="break-words font-semibold text-gray-900">
                                  {purchase.player?.name ??
                                    "Giocatore"}
                                </p>

                                <p className="text-sm text-gray-500">
                                  {purchase.player?.team ??
                                    "Squadra non disponibile"}
                                  {" · "}
                                  {purchase.player?.role ?? "-"}
                                </p>
                              </div>

                            </div>

                            <div className="border-t pt-3 text-left sm:border-0 sm:pt-0 sm:text-right">

                              <p className="text-xs text-gray-500">
                                Acquistato
                              </p>

                              <p className="text-xl font-bold text-gray-900">
                                {purchase.price} crediti
                              </p>

                            </div>

                          </div>
                        ))}

                      </div>
                    )}

                  </div>

                </div>
              </div>
            </div>
          )}

        </section>
      </div>

      {/* MODALE ASTA */}
      {showAuctionModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-4"
          onClick={closeAuctionModal}
        >
          <div
              className="my-3 flex max-h-[calc(100vh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:my-0 sm:max-h-[calc(100vh-2rem)]"
              onClick={(event) => event.stopPropagation()}
            >

            {/* HEADER MODALE */}
<div className="shrink-0 border-b px-5 py-4 sm:px-6">
  <div className="flex items-start justify-between gap-4">

    <div className="min-w-0">
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
        Nuova asta
      </h2>

      <p className="mt-1 text-sm text-gray-500">
        Seleziona il ruolo del prossimo giocatore.
      </p>
    </div>

    <button
      type="button"
      onClick={closeAuctionModal}
      className="shrink-0 rounded-lg px-3 py-2 text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
      aria-label="Chiudi"
    >
      ×
    </button>

  </div>
</div>

<div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {/* RUOLI */}
            <div className="mt-5 sm:mt-6">

              <p className="mb-3 text-sm font-medium text-gray-700">
                Ruolo
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                {roles.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`rounded-xl border p-3 text-center transition sm:p-4 ${
                      selectedRole === role.value
                        ? "border-black bg-black text-white"
                        : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
                    }`}
                  >

                    <div className="text-2xl font-bold">
                      {role.value}
                    </div>

                    <div className="mt-1 text-xs">
                      {role.label}
                    </div>

                  </button>
                ))}

              </div>
            </div>

            <div className="mt-5 border-t pt-5 sm:mt-6">

              {/* ESTRAZIONE */}
              <button
                type="button"
                onClick={drawPlayer}
                disabled={!selectedRole || drawing}
                className="w-full rounded-lg bg-black px-5 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {drawing
                  ? "🎲 Estrazione..."
                  : `🎲 Estrai giocatore${
                      selectedRole
                        ? ` — ${selectedRole}`
                        : ""
                    }`}
              </button>

              {/* GIOCATORE ESTRATTO */}
              {selectedPlayer && (
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:mt-6 sm:p-5">

                  <div className="text-center">

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Giocatore estratto
                    </p>

                    <h3 className="mt-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                      {selectedPlayer.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-600 sm:text-base">
                      {selectedPlayer.team ??
                        "Squadra non disponibile"}
                      {" · "}
                      {selectedPlayer.role}
                    </p>

                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 sm:grid-cols-4">

                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-xs text-gray-500">
                        Quotazione
                      </p>

                      <p className="mt-1 font-bold">
                        {selectedPlayer.quotation ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-xs text-gray-500">
                        MV
                      </p>

                      <p className="mt-1 font-bold">
                        {selectedPlayer.mv ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-xs text-gray-500">
                        FM
                      </p>

                      <p className="mt-1 font-bold">
                        {selectedPlayer.fm ?? "-"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white p-3 text-center">
                      <p className="text-xs text-gray-500">
                        Costo
                      </p>

                      <p className="mt-1 font-bold">
                        {selectedPlayer.cost ?? "-"}
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* ASSEGNAZIONE */}
              {selectedPlayer && (
                <div className="mt-4 space-y-4">

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Partecipante
                    </label>

                    <select
                      value={selectedParticipantId}
                      onChange={(e) =>
                        setSelectedParticipantId(e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    >
                      <option value="">
                        Seleziona partecipante
                      </option>

                      {participants.map((participant) => (
                        <option
                          key={participant.id}
                          value={participant.id}
                        >
                          {participant.name} —{" "}
                          {participant.remaining_credits} crediti
                        </option>
                      ))}

                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Prezzo di acquisto
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) =>
                        setPrice(e.target.value)
                      }
                      placeholder="Inserisci il prezzo"
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    <button
                      type="button"
                      onClick={declinePlayer}
                      disabled={assigning}
                      className="w-full rounded-lg border border-red-300 px-5 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ❌ Rifiuta
                    </button>

                    <button
                      type="button"
                      onClick={assignPlayer}
                      disabled={
                        assigning ||
                        !selectedParticipantId ||
                        price === ""
                      }
                      className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      {assigning
                        ? "Assegnazione..."
                        : "💰 Assegna"}
                    </button>

                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
        </div>
      )}
    </main>
  )
}

