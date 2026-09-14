"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

type AdminUser = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

export default function AdminTestPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  async function loadUsers() {
    setLoading(true)
    setMessage("")

    const { data, error } = await supabase.rpc("get_admin_users")

    if (error) {
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

  useEffect(() => {
    loadUsers()
  }, [])

  if (loading) {
    return (
      <main className="p-6">
        <p>Caricamento...</p>
      </main>
    )
  }

  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold">
        Admin Test
      </h1>

      {message && (
        <div className="mb-4 rounded-lg bg-gray-100 p-3 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4"
          >
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-gray-500">
                {user.role} · {user.status}
              </p>
            </div>

            {user.status === "pending" && (
  <button
    type="button"
    onClick={() => approveUser(user.id)}
    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
  >
    Approva
  </button>
)}

{user.status === "active" && user.role !== "admin" && (
  <button
    type="button"
    onClick={() => suspendUser(user.id)}
    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
  >
    Sospendi
  </button>
)}

{user.status === "suspended" && (
  <button
    type="button"
    onClick={() => reactivateUser(user.id)}
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
  >
    Riattiva
  </button>
)}
          </div>
        ))}
      </div>
    </main>
  )
}