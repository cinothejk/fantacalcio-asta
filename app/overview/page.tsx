"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type Role = "P" | "D" | "C" | "A"

type Participant = {
  id: string
  name: string
  initial_credits: number
  remaining_credits: number
}

type Purchase = {
  id: string
  participant_id: string
  price: number
  created_at: string
  player: {
    name: string
    team: string | null
    role: Role
  } | null
}

export default function OverviewPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingPurchaseId, setDeletingPurchaseId] = useState("")

  useEffect(() => {
    loadOverview()
  }, [])

async function deletePurchase(purchaseId: string) {
const confirmed = window.confirm(
"Sei sicuro di voler eliminare questo acquisto?"
)

if (!confirmed) {
return
}

setDeletingPurchaseId(purchaseId)
setError("")

const { error } = await supabase.rpc("delete_purchase", {
p_purchase_id: purchaseId,
})

if (error) {
setError(error.message)
setDeletingPurchaseId("")
return
}

await loadOverview()
setDeletingPurchaseId("")
}



  async function loadOverview() {
    setLoading(true)
    setError("")

    const participantsResult = await supabase
      .from("participants")
      .select("id, name, initial_credits, remaining_credits")
      .order("created_at", { ascending: true })

    if (participantsResult.error) {
      setError(participantsResult.error.message)
      setLoading(false)
      return
    }

    const purchasesResult = await supabase
      .from("purchases")
      .select(`
        id,
        participant_id,
        price,
        created_at,
        player:players (
          name,
          team,
          role
        )
      `)
      .order("created_at", { ascending: true })

    if (purchasesResult.error) {
      setError(purchasesResult.error.message)
      setLoading(false)
      return
    }

    setParticipants(participantsResult.data ?? [])
    setPurchases(
  (purchasesResult.data ?? []).map((purchase) => ({
    ...purchase,
    player: Array.isArray(purchase.player)
      ? purchase.player[0] ?? null
      : purchase.player,
  })) as Purchase[]
)
    setLoading(false)
  }

  function getParticipantPurchases(participantId: string) {
    return purchases.filter(
      (purchase) => purchase.participant_id === participantId
    )
  }

  function getSpentCredits(participantId: string) {
    return getParticipantPurchases(participantId).reduce(
      (total, purchase) => total + purchase.price,
      0
    )
  }

  function getRoleCount(
    participantId: string,
    role: Role
  ) {
    return getParticipantPurchases(participantId).filter(
      (purchase) => purchase.player?.role === role
    ).length
  }

  const totalSpent = purchases.reduce(
    (total, purchase) => total + purchase.price,
    0
  )

  const totalPlayers = purchases.length

  const totalRemainingCredits = participants.reduce(
    (total, participant) =>
      total + participant.remaining_credits,
    0
  )

  const averagePrice =
    totalPlayers > 0
      ? Math.round(totalSpent / totalPlayers)
      : 0

  const highestPrice =
    totalPlayers > 0
      ? Math.max(...purchases.map((purchase) => purchase.price))
      : 0

  const highestPurchase =
    purchases.find(
      (purchase) => purchase.price === highestPrice
    ) ?? null

  const sortedParticipants = [...participants].sort(
    (a, b) =>
      getSpentCredits(b.id) -
      getSpentCredits(a.id)
  )

  const roleTotals: Record<Role, number> = {
    P: purchases.filter(
      (purchase) => purchase.player?.role === "P"
    ).length,

    D: purchases.filter(
      (purchase) => purchase.player?.role === "D"
    ).length,

    C: purchases.filter(
      (purchase) => purchase.player?.role === "C"
    ).length,

    A: purchases.filter(
      (purchase) => purchase.player?.role === "A"
    ).length,
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-500">
            Caricamento overview...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Overview asta
            </h1>

            <p className="mt-1 text-gray-500">
              Situazione generale dell'asta
            </p>
          </div>

          <button
            type="button"
            onClick={loadOverview}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
          >
            ↻ Aggiorna
          </button>
        </div>

        {/* Errore */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {participants.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            Nessun partecipante presente.
          </div>
        ) : (
          <>
            {/* Statistiche principali */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  Partecipanti
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {participants.length}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  Giocatori acquistati
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalPlayers}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  Crediti spesi
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalSpent}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  Crediti disponibili
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {totalRemainingCredits}
                </p>
              </div>

            </div>

            {/* Statistiche asta */}
            <div className="mt-5 grid gap-4 md:grid-cols-3">

              {/* Maggiore spesa */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  🏆 Maggiore spesa
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {sortedParticipants[0]?.name ?? "-"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {sortedParticipants[0]
                    ? `${getSpentCredits(
                        sortedParticipants[0].id
                      )} crediti spesi`
                    : "-"}
                </p>
              </div>

              {/* Media */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  💰 Prezzo medio
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {averagePrice}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  crediti per giocatore
                </p>
              </div>

              {/* Acquisto massimo */}
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-sm text-gray-500">
                  🔥 Acquisto più costoso
                </p>

                <p className="mt-2 text-xl font-bold text-gray-900">
                  {highestPurchase?.player?.name ?? "-"}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {highestPrice > 0
                    ? `${highestPrice} crediti`
                    : "-"}
                </p>
              </div>

            </div>

            {/* Ruoli */}
            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="text-xl font-bold text-gray-900">
                Giocatori acquistati per ruolo
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-sm font-semibold text-gray-500">
                    P
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {roleTotals.P}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Portieri
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-sm font-semibold text-gray-500">
                    D
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {roleTotals.D}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Difensori
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-sm font-semibold text-gray-500">
                    C
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {roleTotals.C}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Centrocampisti
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4 text-center">
                  <p className="text-sm font-semibold text-gray-500">
                    A
                  </p>

                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {roleTotals.A}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Attaccanti
                  </p>
                </div>

              </div>
            </section>

            {/* Classifica spesa */}
            <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5">

              <h2 className="text-xl font-bold text-gray-900">
                Classifica spesa
              </h2>

              <div className="mt-5 space-y-3">

                {sortedParticipants.map(
                  (participant, index) => {
                    const spent =
                      getSpentCredits(participant.id)

                    const playerCount =
                      getParticipantPurchases(
                        participant.id
                      ).length

                    return (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-4"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-600">
                            {index + 1}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900">
                              {participant.name}
                            </p>

                            <p className="text-sm text-gray-500">
                              {playerCount}{" "}
                              {playerCount === 1
                                ? "giocatore"
                                : "giocatori"}
                            </p>
                          </div>

                        </div>

                        <p className="text-lg font-bold text-gray-900">
                          {spent} crediti
                        </p>

                      </div>
                    )
                  }
                )}

              </div>
            </section>

            {/* Rose */}
            <section className="mt-8">

              <h2 className="text-xl font-bold text-gray-900">
                Rose
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {participants.map((participant) => {
                  const participantPurchases =
                    getParticipantPurchases(
                      participant.id
                    )

                  const spentCredits =
                    getSpentCredits(participant.id)

                  return (
                    <section
                      key={participant.id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                    >

                      {/* Dati partecipante */}
                      <div className="border-b border-gray-200 p-5">

                        <div className="flex items-start justify-between gap-4">

                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {participant.name}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {participantPurchases.length}{" "}
                              {participantPurchases.length === 1
                                ? "giocatore"
                                : "giocatori"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Crediti
                            </p>

                            <p className="text-2xl font-bold text-gray-900">
                              {participant.remaining_credits}
                            </p>
                          </div>

                        </div>

                        {/* Ruoli */}
                        <div className="mt-4 grid grid-cols-4 gap-2">

                          {(["P", "D", "C", "A"] as Role[]).map(
  (role) => {
    const roleColors: Record<Role, string> = {
      P: "bg-orange-100",
      D: "bg-green-100",
      C: "bg-blue-100",
      A: "bg-red-100",
    }

    return (
      <div
        key={role}
        className={`rounded-lg p-2 text-center ${roleColors[role]}`}
      >
        <p className="text-xs font-bold text-gray-600">
          {role}
        </p>

        <p className="mt-1 font-bold text-gray-900">
          {getRoleCount(
            participant.id,
            role
          )}
        </p>
      </div>
    )
  }
)}

                        </div>

                        {/* Crediti */}
                        <div className="mt-3 grid grid-cols-2 gap-2">

                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">
                              Spesi
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {spentCredits}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">
                              Budget iniziale
                            </p>

                            <p className="mt-1 font-bold text-gray-900">
                              {participant.initial_credits}
                            </p>
                          </div>

                        </div>

                      </div>

                      {/* Rosa */}
                      <div className="p-5">

                        <h4 className="font-semibold text-gray-900">
                          Rosa
                        </h4>

                        {participantPurchases.length === 0 ? (
                          <p className="mt-4 text-sm text-gray-500">
                            Nessun giocatore acquistato.
                          </p>
                        ) : (
                          <div className="mt-4 space-y-3">

                            {participantPurchases.map(
                              (purchase, index) => (
                                <div
  key={purchase.id}
  className={`flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 ${
    purchase.player?.role === "P"
      ? "bg-orange-100"
      : purchase.player?.role === "D"
        ? "bg-green-100"
        : purchase.player?.role === "C"
          ? "bg-blue-100"
          : purchase.player?.role === "A"
            ? "bg-red-100"
            : "bg-gray-50"
  }`}
>
  <div className="flex min-w-0 items-center gap-3">


<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-500">
  {index + 1}
</span>

<div className="min-w-0">

  <p className="truncate font-medium text-gray-900">
    {purchase.player?.name ?? "Giocatore"}
  </p>

  <p className="text-xs text-gray-600">
    {purchase.player?.team ?? "Squadra non disponibile"}
    {" · "}
    {purchase.player?.role ?? "-"}
  </p>

</div>


  </div>

  <div className="flex shrink-0 items-center gap-2">
  <p className="font-bold text-gray-900">
    {purchase.price}
  </p>

<button
type="button"
onClick={() => deletePurchase(purchase.id)}
disabled={deletingPurchaseId === purchase.id}
className="rounded-lg bg-white px-2 py-1 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
title="Elimina acquisto"

>

{deletingPurchaseId === purchase.id ? "..." : "🗑️"}

  </button>
</div>

</div>

                              )
                            )}

                          </div>
                        )}

                      </div>

                    </section>
                  )
                })}

              </div>
            </section>
          </>
        )}

      </div>
    </main>
  )
}