"use client"

import { useEffect, useMemo, useState } from "react"
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
    loadPlayers()
  }, [])

  async function loadPlayers() {
    setLoading(true)
    setError("")

    const { data, error: playersError } = await supabase
      .from("players")
      .select("id, name, team, role, status")
      .order("name")

    if (playersError) {
      setError(playersError.message)
      setLoading(false)
      return
    }

    setPlayers((data ?? []) as Player[])
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
    if (player.status === newStatus) {
      return
    }

    setUpdatingId(player.id)
    setError("")
    setMessage("")

    const { error: updateError } = await supabase
      .from("players")
      .update({ status: newStatus })
      .eq("id", player.id)
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
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Gestione giocatori
        </h1>

        <p className="mt-2 text-gray-600">
          Gestisci disponibilità e rifiuto dei giocatori.
        </p>
      </div>

      {/* Riepilogo */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
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

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        {/* Filtri */}
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
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
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-500"
          >
            <option value="ALL">Tutti gli stati</option>
            <option value="available">Disponibili</option>
            <option value="sold">Venduti</option>
            <option value="declined">Rifiutati</option>
          </select>
        </div>

        <div className="mb-4 flex items-center justify-between">
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
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
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
          <div className="rounded-lg bg-gray-50 px-4 py-10 text-center text-gray-500">
            Nessun giocatore trovato.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-500">
                  <th className="px-3 py-3 font-medium">Giocatore</th>
                  <th className="px-3 py-3 font-medium">Squadra</th>
                  <th className="px-3 py-3 font-medium">Ruolo</th>
                  <th className="px-3 py-3 font-medium">Stato</th>
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
                              {updating ? "..." : "Rendi disponibile"}
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
        )}
      </section>
    </main>
  )
}

