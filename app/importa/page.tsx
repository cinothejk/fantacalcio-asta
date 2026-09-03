"use client"

import { ChangeEvent, useState } from "react"
import * as XLSX from "xlsx"
import { supabase } from "@/lib/supabase/client"

type Player = {
  external_id: number | null
  name: string
  out_of_list: string | null
  team: string | null
  under: number | null
  role: string
  mantra_role: string | null
  pgv: number | null
  mv: number | null
  fm: number | null
  fvm_1000: number | null
  quotation: number | null
  fantasquadra: number | null
  cost: number | null
}

const ROLE_NAMES: Record<string, string> = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
}

function toNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") {
    return null
  }

  const number = Number(value)

  return Number.isNaN(number) ? null : number
}

export default function ImportaPage() {
  const [fileName, setFileName] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState("")

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setFileName(file.name)
    setPlayers([])
    setError("")
    setLoading(true)

    try {
      const buffer = await file.arrayBuffer()

      const workbook = XLSX.read(buffer, {
        type: "array",
      })

      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        {
          defval: null,
        }
      )

      const parsedPlayers: Player[] = []

      for (const row of rows) {
        const role = String(row["R."] ?? "")
          .trim()
          .toUpperCase()

        if (!["P", "D", "C", "A"].includes(role)) {
          continue
        }

        const name = String(row["Nome"] ?? "").trim()

        if (!name) {
          continue
        }

        parsedPlayers.push({
          external_id: toNumber(row["#"]),
          name,
          out_of_list:
            row["Fuori lista"] !== null
              ? String(row["Fuori lista"])
              : null,
          team:
            row["Sq."] !== null
              ? String(row["Sq."])
              : null,
          under: toNumber(row["Under"]),
          role,
          mantra_role:
            row["R.MANTRA"] !== null
              ? String(row["R.MANTRA"])
              : null,
          pgv: toNumber(row["PGv"]),
          mv: toNumber(row["MV"]),
          fm: toNumber(row["FM"]),
          fvm_1000: toNumber(row["FVM/1000"]),
          quotation: toNumber(row["QUOT."]),
          fantasquadra: toNumber(row["FantaSquadra"]),
          cost: toNumber(row["Costo"]),
        })
      }

      setPlayers(parsedPlayers)
    } catch (err) {
      console.error(err)
      setError("Impossibile leggere il file.")
    } finally {
      setLoading(false)
    }
  }

  const counts = {
    P: players.filter((player) => player.role === "P").length,
    D: players.filter((player) => player.role === "D").length,
    C: players.filter((player) => player.role === "C").length,
    A: players.filter((player) => player.role === "A").length,
  }

async function handleImport() {
  if (players.length === 0) {
    return
  }

  setImporting(true)
  setImportResult("")
  setError("")

  try {
    const rows = players.map((player) => ({
      external_id: player.external_id,
      name: player.name,
      out_of_list: player.out_of_list,
      team: player.team,
      under: player.under,
      role: player.role,
      mantra_role: player.mantra_role,
      pgv: player.pgv,
      mv: player.mv,
      fm: player.fm,
      fvm_1000: player.fvm_1000,
      quotation: player.quotation,
      fantasquadra: player.fantasquadra,
      cost: player.cost,
      status: "available",
    }))

    const { error } = await supabase
      .from("players")
      .upsert(rows, {
        onConflict: "external_id",
      })

    if (error) {
      throw error
    }

    setImportResult(
      `${players.length} giocatori importati correttamente.`
    )
  } catch (err) {
    console.error(err)

    setError(
      err instanceof Error
        ? err.message
        : "Errore durante l'importazione."
    )
  } finally {
    setImporting(false)
  }
}


  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <h1 className="text-3xl font-bold text-gray-900">
          Importa giocatori
        </h1>

        <p className="mt-2 text-gray-600">
          Importa la lista dei calciatori da XLSX o CSV.
        </p>

        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">

          <label
            htmlFor="player-file"
            className="block text-sm font-medium text-gray-700"
          >
            File giocatori
          </label>

          <input
            id="player-file"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="mt-3 block w-full rounded-lg border border-gray-300 bg-white p-3"
          />

          {fileName && (
            <p className="mt-3 text-sm text-gray-600">
              File selezionato:{" "}
              <span className="font-medium">{fileName}</span>
            </p>
          )}

          {loading && (
            <p className="mt-4 text-sm text-gray-500">
              Lettura del file...
            </p>
          )}

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>

        {players.length > 0 && (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-4">

              {(["P", "D", "C", "A"] as const).map((role) => (
                <div
                  key={role}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <p className="text-sm text-gray-500">
                    {ROLE_NAMES[role]}
                  </p>

                  <p className="mt-1 text-3xl font-bold">
                    {counts[role]}
                  </p>
                </div>
              ))}

            </section>

            <section className="mt-6 rounded-xl bg-white p-6 shadow-sm">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Anteprima
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {players.length} giocatori trovati
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="rounded-lg bg-black px-5 py-3 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing
                    ? "Importazione..."
                    : "Importa nel database"}
                </button>

                {importResult && (
                  <p className="mt-3 text-sm font-medium text-green-700">
                    {importResult}
                  </p>
                )}
              </div>



              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Nome</th>
                      <th className="px-3 py-3">Squadra</th>
                      <th className="px-3 py-3">Ruolo</th>
                      <th className="px-3 py-3">MV</th>
                      <th className="px-3 py-3">FM</th>
                      <th className="px-3 py-3">Quot.</th>
                      <th className="px-3 py-3">Costo</th>
                    </tr>
                  </thead>

                  <tbody>
                    {players.slice(0, 20).map((player, index) => (
                      <tr
                        key={`${player.external_id}-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="px-3 py-3">
                          {player.external_id ?? "-"}
                        </td>

                        <td className="px-3 py-3 font-medium">
                          {player.name}
                        </td>

                        <td className="px-3 py-3">
                          {player.team ?? "-"}
                        </td>

                        <td className="px-3 py-3 font-semibold">
                          {player.role}
                        </td>

                        <td className="px-3 py-3">
                          {player.mv ?? "-"}
                        </td>

                        <td className="px-3 py-3">
                          {player.fm ?? "-"}
                        </td>

                        <td className="px-3 py-3">
                          {player.quotation ?? "-"}
                        </td>

                        <td className="px-3 py-3">
                          {player.cost ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {players.length > 20 && (
                <p className="mt-4 text-sm text-gray-500">
                  Vengono mostrati i primi 20 giocatori come anteprima.
                </p>
              )}

            </section>
          </>
        )}
      </div>
    </main>
  )
}