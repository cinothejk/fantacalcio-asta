"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

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

const statusLabels = {
  available: "Disponibile",
  sold: "Venduto",
  declined: "Rifiutato",
}

export default function GiocatoriPage() {
  const searchParams = useSearchParams()
  const auctionId = searchParams.get("auction")

  const [auctionName, setAuctionName] = useState("")
  const [players, setPlayers] = useState<Player[]>([])

  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<
    "ALL" | "P" | "D" | "C" | "A"
  >("ALL")

  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "available" | "sold" | "declined"
  >("ALL")

  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!auctionId) {
      setLoading(false)
      setError("Nessuna asta selezionata.")
      return
    }

    loadPlayers(auctionId)
  }, [auctionId])

  async function loadPlayers(currentAuctionId: string) {
    setLoading(true)
    setError("")

    const [auctionResult, playersResult] = await Promise.all([
      supabase
        .from("auctions")
        .select("name")
        .eq("id", currentAuctionId)
        .single(),

      supabase
        .from("players")
        .select(`
          id,
          name,
          team,
          role,
          auction_players!inner(
            status
          )
        `)
        .eq("auction_players.auction_id", currentAuctionId)
        .order("name"),
    ])

    if (auctionResult.error) {
      setError(auctionResult.error.message)
      setLoading(false)
      return
    }

    if (playersResult.error) {
      setError(playersResult.error.message)
      setLoading(false)
      return
    }

    setAuctionName(auctionResult.data?.name ?? "")

    const mappedPlayers = (playersResult.data ?? []).map((player) => {
      const auctionPlayer = Array.isArray(player.auction_players)
        ? player.auction_players[0]
        : player.auction_players

      return {
        id: player.id,
        name: player.name,
        team: player.team,
        role: player.role,
        status: auctionPlayer?.status ?? "available",
      }
    }) as Player[]

    setPlayers(mappedPlayers)
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

      const matchesStatus =
        statusFilter === "ALL" || player.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [players, search, roleFilter, statusFilter])

  async function updateStatus(
    player: Player,
    newStatus: "available" | "declined"
  ) {
    if (!auctionId) {
      setError("Nessuna asta selezionata.")
      return
    }

    if (player.status === newStatus) {
      return
    }

    setUpdatingId(player.id)
    setError("")
    setMessage("")

    const { error: updateError } = await supabase
      .from("auction_players")
      .update({ status: newStatus })
      .eq("auction_id", auctionId)
      .eq("player_id", player.id)
      .eq("status", player.status)

    if (updateError) {
      setError(updateError.message)
      setUpdatingId(null)
      return
    }

    setPlayers((currentPlayers) =>
      currentPlayers.map((currentPlayer) =>
        currentPlayer.id === player.id
          ? { ...currentPlayer, status: newStatus }
          : currentPlayer
      )
    )

    setMessage(
      `${player.name}: stato modificato in "${statusLabels[newStatus]}".`
    )

    setUpdatingId(null)
  }

  const counts = {
    available: players.filter((player) => player.status === "available").length,
    sold: players.filter((player) => player.status === "sold").length,
    declined: players.filter((player) => player.status === "declined").length,
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <div className="mb-1.5 text-sm font-medium text-gray-500 sm:mb-2">
          {auctionName || "Asta"}
        </div>

        <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
          Gestione giocatori
        </h1>

        <p className="mt-2 text-sm leading-5 text-gray-600 sm:text-base">
          Gestisci disponibilità e rifiuto dei giocatori per questa asta.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-800 sm:mb-6">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800 sm:mb-6">
          {error}
        </div>
      )}

      {/* Riepilogo */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setStatusFilter("available")}
          className={`rounded-xl border p-4 text-left transition ${
            statusFilter === "available"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <div className="text-sm text-gray-500">Disponibili</div>

          <div className="mt-1 text-2xl font-bold text-gray-900">
            {counts.available}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("sold")}
          className={`rounded-xl border p-4 text-left transition ${
            statusFilter === "sold"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <div className="text-sm text-gray-500">Venduti</div>

          <div className="mt-1 text-2xl font-bold text-gray-900">
            {counts.sold}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter("declined")}
          className={`rounded-xl border p-4 text-left transition ${
            statusFilter === "declined"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 bg-white hover:border-gray-400"
          }`}
        >
          <div className="text-sm text-gray-500">Rifiutati</div>

          <div className="mt-1 text-2xl font-bold text-gray-900">
            {counts.declined}
          </div>
        </button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        {/* Filtri */}
        <div className="mb-4 grid gap-3 sm:mb-5 md:grid-cols-[1fr_auto_auto]">
          <input
            type="text"
            placeholder="Cerca giocatore o squadra..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-gray-500 sm:py-2.5 sm:text-sm"
          />

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(
                event.target.value as "ALL" | "P" | "D" | "C" | "A"
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-gray-500 sm:py-2.5 sm:text-sm md:w-auto"
          >
            <option value="ALL">Tutti i ruoli</option>
            <option value="P">Portieri</option>
            <option value="D">Difensori</option>
            <option value="C">Centrocampisti</option>
            <option value="A">Attaccanti</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | "available"
                  | "sold"
                  | "declined"
              )
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-gray-500 sm:py-2.5 sm:text-sm md:w-auto"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="available">Disponibili</option>
            <option value="sold">Venduti</option>
            <option value="declined">Rifiutati</option>
          </select>
        </div>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            {filteredPlayers.length} giocatori
          </div>

          {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                setRoleFilter("ALL")
                setStatusFilter("ALL")
              }}
              className="self-start text-sm font-medium text-gray-600 hover:text-gray-900 sm:self-auto"
            >
              Azzera filtri
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-10 text-center text-gray-500">
            Caricamento...
          </p>
        ) : filteredPlayers.length === 0 ? (
          <div className="rounded-lg bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
            Nessun giocatore trovato.
          </div>
        ) : (
          <>
            {/* Vista mobile */}
            <div className="grid gap-3 md:hidden">
              {filteredPlayers.map((player) => {
                const updating = updatingId === player.id

                return (
                  <div
                    key={player.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">
                          {player.name}
                        </div>

                        <div className="mt-1 truncate text-sm text-gray-500">
                          {player.team || "—"}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          roleColors[player.role]
                        }`}
                      >
                        {player.role}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          player.status === "available"
                            ? "bg-green-100 text-green-800"
                            : player.status === "sold"
                              ? "bg-gray-200 text-gray-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {statusLabels[player.status]}
                      </span>

                      <span className="text-xs text-gray-400">
                        {roleLabels[player.role]}
                      </span>
                    </div>

                    <div className="mt-4">
                      {player.status === "available" && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(player, "declined")
                          }
                          className="w-full rounded-lg border border-red-200 px-3 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updating ? "Aggiornamento..." : "Rifiuta"}
                        </button>
                      )}

                      {player.status === "declined" && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() =>
                            updateStatus(player, "available")
                          }
                          className="w-full rounded-lg border border-green-200 px-3 py-3 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {updating
                            ? "Aggiornamento..."
                            : "Rendi disponibile"}
                        </button>
                      )}

                      {player.status === "sold" && (
                        <div className="rounded-lg bg-gray-50 px-3 py-3 text-center text-xs text-gray-400">
                          Gestito dall&apos;acquisto
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Vista desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                    <th className="px-3 py-3 font-medium">
                      Giocatore
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Squadra
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Ruolo
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Stato
                    </th>

                    <th className="px-3 py-3 text-right font-medium">
                      Azioni
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPlayers.map((player) => {
                    const updating = updatingId === player.id

                    return (
                      <tr
                        key={player.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="px-3 py-3">
                          <div className="font-medium text-gray-900">
                            {player.name}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-sm text-gray-500">
                          {player.team || "—"}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                              roleColors[player.role]
                            }`}
                          >
                            {player.role}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                              player.status === "available"
                                ? "bg-green-100 text-green-800"
                                : player.status === "sold"
                                  ? "bg-gray-200 text-gray-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {statusLabels[player.status]}
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-2">
                            {player.status === "available" && (
                              <button
                                type="button"
                                disabled={updating}
                                onClick={() =>
                                  updateStatus(player, "declined")
                                }
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updating ? "..." : "Rifiuta"}
                              </button>
                            )}

                            {player.status === "declined" && (
                              <button
                                type="button"
                                disabled={updating}
                                onClick={() =>
                                  updateStatus(player, "available")
                                }
                                className="rounded-lg border border-green-200 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {updating
                                  ? "..."
                                  : "Rendi disponibile"}
                              </button>
                            )}

                            {player.status === "sold" && (
                              <span className="px-3 py-2 text-xs text-gray-400">
                                Gestito dall&apos;acquisto
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  )
}