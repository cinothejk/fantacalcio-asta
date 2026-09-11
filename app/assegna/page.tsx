
"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

type Participant = {
  id: string
  name: string
  remaining_credits: number
}

type Player = {
  id: string
  name: string
  team: string | null
  role: "P" | "D" | "C" | "A"
  status: "available" | "sold" | "declined"
}

const roleLabels = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
}

const roleColors = {
  P: "bg-orange-100 text-orange-900",
  D: "bg-green-100 text-green-900",
  C: "bg-blue-100 text-blue-900",
  A: "bg-red-100 text-red-900",
}

export default function AssegnaPage() {
  const searchParams = useSearchParams()
  const auctionId = searchParams.get("auction")

  const [auctionName, setAuctionName] = useState("")

  const [participants, setParticipants] = useState<Participant[]>([])
  const [players, setPlayers] = useState<Player[]>([])

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "P" | "D" | "C" | "A"
  >("ALL")

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [selectedParticipantId, setSelectedParticipantId] = useState("")
  const [price, setPrice] = useState("")

  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!auctionId) {
      setLoading(false)
      setError("Nessuna asta selezionata.")
      return
    }

    loadData(auctionId)
  }, [auctionId])

  async function loadData(currentAuctionId: string) {
    setLoading(true)
    setError("")

    const [auctionResult, participantsResult, playersResult] =
      await Promise.all([
        supabase
          .from("auctions")
          .select("name")
          .eq("id", currentAuctionId)
          .single(),

        supabase
          .from("participants")
          .select("id, name, remaining_credits")
          .eq("auction_id", currentAuctionId)
          .order("name"),

        supabase
          .from("players")
          .select(`
            id,
            name,
            team,
            role,
            auction_players!inner(status)
          `)
          .eq("auction_players.auction_id", currentAuctionId)
          .eq("auction_players.status", "available")
          .order("name"),
      ])

    if (auctionResult.error) {
      setError(auctionResult.error.message)
      setLoading(false)
      return
    }

    if (participantsResult.error) {
      setError(participantsResult.error.message)
      setLoading(false)
      return
    }

    if (playersResult.error) {
      setError(playersResult.error.message)
      setLoading(false)
      return
    }

    setAuctionName(auctionResult.data?.name ?? "")
    setParticipants(participantsResult.data ?? [])

    const availablePlayers = (playersResult.data ?? []).map((player) => ({
      id: player.id,
      name: player.name,
      team: player.team,
      role: player.role,
      status: "available" as const,
    }))

    setPlayers(availablePlayers)
    setLoading(false)
  }

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return players.filter((player) => {
      const matchesSearch =
        normalizedSearch === "" ||
        player.name.toLowerCase().includes(normalizedSearch) ||
        (player.team ?? "").toLowerCase().includes(normalizedSearch)

      const matchesRole =
        roleFilter === "ALL" || player.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [players, search, roleFilter])

  const selectedParticipant = participants.find(
    (participant) => participant.id === selectedParticipantId
  )

  async function assignPlayer() {
    if (!auctionId) {
      setError("Nessuna asta selezionata.")
      return
    }

    if (!selectedPlayer) {
      setError("Seleziona un giocatore.")
      return
    }

    if (!selectedParticipantId) {
      setError("Seleziona un partecipante.")
      return
    }

    const parsedPrice = Number(price)

    if (!Number.isInteger(parsedPrice) || parsedPrice < 0) {
      setError("Inserisci un prezzo valido.")
      return
    }

    if (
      selectedParticipant &&
      parsedPrice > selectedParticipant.remaining_credits
    ) {
      setError("Il partecipante non ha abbastanza crediti.")
      return
    }

    setAssigning(true)
    setError("")
    setMessage("")

    const { error: rpcError } = await supabase.rpc(
      "assign_player_to_participant",
      {
        p_auction_id: auctionId,
        p_player_id: selectedPlayer.id,
        p_participant_id: selectedParticipantId,
        p_price: parsedPrice,
      }
    )

    if (rpcError) {
      setError(rpcError.message)
      setAssigning(false)
      return
    }

    setMessage(
      `${selectedPlayer.name} assegnato a ${selectedParticipant?.name}.`
    )

    setSelectedPlayer(null)
    setPrice("")

    await loadData(auctionId)

    setAssigning(false)
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <div className="mb-2 text-sm font-medium text-gray-500">
          {auctionName || "Asta"}
        </div>

        <h1 className="text-3xl font-bold text-gray-900">
          Assegnazione manuale
        </h1>

        <p className="mt-2 text-gray-600">
          Cerca un giocatore e assegnalo direttamente a un partecipante.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Lista giocatori */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              placeholder="Cerca giocatore o squadra..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500"
            />

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value as "ALL" | "P" | "D" | "C" | "A"
                )
              }
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500"
            >
              <option value="ALL">Tutti i ruoli</option>
              <option value="P">Portieri</option>
              <option value="D">Difensori</option>
              <option value="C">Centrocampisti</option>
              <option value="A">Attaccanti</option>
            </select>
          </div>

          <div className="mb-4 text-sm text-gray-500">
            {filteredPlayers.length} giocatori disponibili
          </div>

          {loading ? (
            <p className="py-10 text-center text-gray-500">
              Caricamento...
            </p>
          ) : filteredPlayers.length === 0 ? (
            <div className="rounded-lg bg-gray-50 px-4 py-10 text-center text-gray-500">
              Nessun giocatore trovato.
            </div>
          ) : (
            <div className="max-h-[650px] overflow-y-auto">
              <div className="grid gap-2">
                {filteredPlayers.map((player) => {
                  const selected = selectedPlayer?.id === player.id

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlayer(player)
                        setError("")
                        setMessage("")
                      }}
                      className={`flex items-center justify-between rounded-lg border p-3 text-left transition ${
                        selected
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {player.name}
                        </div>

                        <div className="mt-1 text-sm text-gray-500">
                          {player.team || "—"}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          roleColors[player.role]
                        }`}
                      >
                        {player.role}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </section>

        {/* Pannello assegnazione */}
        <section className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Assegna giocatore
          </h2>

          {selectedPlayer ? (
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">
                    {selectedPlayer.name}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    {selectedPlayer.team || "—"} ·{" "}
                    {roleLabels[selectedPlayer.role]}
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    roleColors[selectedPlayer.role]
                  }`}
                >
                  {selectedPlayer.role}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
              Seleziona un giocatore dalla lista.
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Partecipante
              </label>

              <select
                value={selectedParticipantId}
                onChange={(event) =>
                  setSelectedParticipantId(event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500"
              >
                <option value="">Seleziona partecipante...</option>

                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.name} — {participant.remaining_credits} crediti
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Prezzo
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="Es. 25"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            {selectedParticipant && (
              <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Crediti disponibili</span>

                  <strong className="text-gray-900">
                    {selectedParticipant.remaining_credits}
                  </strong>
                </div>

                {price !== "" && Number(price) >= 0 && (
                  <div className="mt-2 flex justify-between">
                    <span className="text-gray-500">Dopo l&apos;acquisto</span>

                    <strong className="text-gray-900">
                      {selectedParticipant.remaining_credits - Number(price)}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={assignPlayer}
              disabled={
                !selectedPlayer ||
                !selectedParticipantId ||
                assigning ||
                !auctionId
              }
              className="w-full rounded-lg bg-gray-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {assigning ? "Assegnazione..." : "Assegna giocatore"}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

