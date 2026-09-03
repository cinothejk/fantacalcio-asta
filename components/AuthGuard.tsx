
"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { supabase } from "@/lib/supabase/client"

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (pathname === "/login") {
      setLoading(false)
      return
    }

    let mounted = true

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.replace("/login")
        return
      }

      if (mounted) {
        setLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && pathname !== "/login") {
        router.replace("/login")
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  if (pathname === "/login") {
    return <>{children}</>
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-sm text-gray-500">
          Controllo autenticazione...
        </div>
      </main>
    )
  }

  return (
    <>
      <Navbar />
      {children}
    </>
  )
}

