
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

type AdminUser = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [message, setMessage] = useState("")
  const [searchEmail, setSearchEmail] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  async function checkAdmin() {
    const { data, error } = await supabase.rpc("is_admin")

    if (error) {
      console.error(error)
      router.replace("/")
      return false
    }

    if (data !== true) {
      router.replace("/")
      return false
    }

    setCheckingAdmin(false)
    return true
  }

  async function loadUsers() {
    setLoading(true)
    setMessage("")

    const { data, error } = await supabase.rpc("get_admin_users")

    if (error) {
      console.error(error)
      setMessage(error.message)
      setLoading(false)
      return
    }

    setUsers(data ?? [])
    setLoading(false)
  }

  async function approveUser(userId: string) {
    setMessage("")

    const { error } = await supabase.rpc("approve_user", {
      p_user_id: userId,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage("Utente approvato correttamente.")
    await loadUsers()
  }

  async function suspendUser(userId: string) {
    setMessage("")

    const { error } = await supabase.rpc("suspend_user", {
      p_user_id: userId,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage("Utente sospeso correttamente.")
    await loadUsers()
  }

  async function reactivateUser(userId: string) {
    setMessage("")

    const { error } = await supabase.rpc("reactivate_user", {
      p_user_id: userId,
    })

    if (error) {
      setMessage(error.message)
      return
    }

    setMessage("Utente riattivato correttamente.")
    await loadUsers()
  }

  const filteredUsers = users.filter((user) => {
  const matchesEmail = user.email
    .toLowerCase()
    .includes(searchEmail.toLowerCase())

  const matchesStatus =
    statusFilter === "all" || user.status === statusFilter

  return matchesEmail && matchesStatus
})

  useEffect(() => {
    async function initialize() {
      const admin = await checkAdmin()

      if (!admin) {
        return
      }

      await loadUsers()
    }

    initialize()
  }, [])

  if (checkingAdmin || loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-gray-500">
            Controllo autorizzazione...
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Gestione utenti
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Gestisci registrazioni, approvazioni e accessi.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-lg bg-white px-4 py-3 text-sm text-gray-700 shadow-sm">
            {message}
          </div>
        )}

        <div className="mb-6 grid gap-4 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-2">
  <div>
    <label
      htmlFor="searchEmail"
      className="mb-1 block text-sm font-medium text-gray-700"
    >
      Cerca per email
    </label>

    <input
      id="searchEmail"
      type="text"
      value={searchEmail}
      onChange={(e) => setSearchEmail(e.target.value)}
      placeholder="es. mario@email.it"
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    />
  </div>

  <div>
    <label
      htmlFor="statusFilter"
      className="mb-1 block text-sm font-medium text-gray-700"
    >
      Filtra per status
    </label>

    <select
      id="statusFilter"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    >
      <option value="all">Tutti</option>
      <option value="pending">Pending</option>
      <option value="active">Attivi</option>
      <option value="suspended">Sospesi</option>
    </select>
  </div>
</div>

<p className="mb-3 text-sm text-gray-500">
  Visualizzati {filteredUsers.length} di {users.length} utentis
</p>

        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="rounded-xl bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">
                    {user.email}
                  </p>

                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                      {user.role}
                    </span>

                    <span
                      className={
                        user.status === "active"
                          ? "rounded-full bg-green-100 px-2.5 py-1 text-green-700"
                          : user.status === "pending"
                            ? "rounded-full bg-yellow-100 px-2.5 py-1 text-yellow-700"
                            : "rounded-full bg-red-100 px-2.5 py-1 text-red-700"
                      }
                    >
                      {user.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {user.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => approveUser(user.id)}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
                    >
                      Approva
                    </button>
                  )}

                  {user.status === "active" && user.role !== "admin" && (
                    <button
                      type="button"
                      onClick={() => suspendUser(user.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                    >
                      Sospendi
                    </button>
                  )}

                  {user.status === "suspended" && (
                    <button
                      type="button"
                      onClick={() => reactivateUser(user.id)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Riattiva
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

