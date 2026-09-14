
"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import Image from "next/image"

const menuItems = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Partecipanti",
    href: "/partecipanti",
  },
  {
    label: "Importa",
    href: "/importa",
  },
  {
    label: "Asta",
    href: "/asta",
  },
  {
    label: "Assegna",
    href: "/assegna",
  },
  {
    label: "Giocatori",
    href: "/giocatori",
  },
  {
    label: "Overview",
    href: "/overview",
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const auctionId = searchParams.get("auction")

  const [auctionName, setAuctionName] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function loadAuctionName() {
      if (!auctionId) {
        setAuctionName("")
        return
      }

      const { data, error } = await supabase
        .from("auctions")
        .select("name")
        .eq("id", auctionId)
        .single()

      if (error) {
        console.error(error)
        setAuctionName("")
        return
      }

      setAuctionName(data.name)
    }

    loadAuctionName()
  }, [auctionId])

  useEffect(() => {
    async function checkAdmin() {
      const { data, error } = await supabase.rpc("is_admin")

      if (error) {
        console.error(error)
        setIsAdmin(false)
        return
      }

      setIsAdmin(data === true)
    }

    checkAdmin()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function handleLogout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error(error)
      return
    }

    router.push("/login")
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between py-3">

          {/* Logo */}
          <Link
            href={auctionId ? `/?auction=${auctionId}` : "/"}
            className="flex items-center gap-2 text-lg font-bold text-gray-900"
          >
            <Image
              src="/logo.png"
              alt="Fantacalcio"
              width={40}
              height={40}
              className="object-contain"
            />

            <span>Fantacalcio</span>
          </Link>

          {/* Nome asta - desktop */}
          {auctionName && (
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-gray-400">•</span>

              <span className="font-medium text-gray-500">
                Asta:
              </span>

              <span className="font-bold text-red-600">
                {auctionName}
              </span>
            </div>
          )}

          {/* Menu desktop */}
          <div className="hidden items-center gap-1 lg:flex">
            {menuItems.map((item) => {
              const active = pathname === item.href

              const href = auctionId
                ? `${item.href}?auction=${auctionId}`
                : item.href

              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}

            {isAdmin && (
              <Link
                href="/admin"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname === "/admin"
                    ? "bg-red-600 text-white"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="ml-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Esci
            </button>
          </div>

          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg border border-gray-300 p-2 text-gray-700 transition hover:bg-gray-100 lg:hidden"
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
            aria-expanded={menuOpen}
          >
            <span className="text-xl">
              {menuOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>

        {/* Nome asta - mobile */}
        {auctionName && (
          <div className="border-t border-gray-100 py-2 text-center text-sm lg:hidden">
            <span className="font-medium text-gray-500">
              Asta:
            </span>{" "}
            <span className="font-bold text-red-600">
              {auctionName}
            </span>
          </div>
        )}

        {/* Menu mobile */}
        {menuOpen && (
          <div className="border-t border-gray-200 py-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => {
                const active = pathname === item.href

                const href = auctionId
                  ? `${item.href}?auction=${auctionId}`
                  : item.href

                return (
                  <Link
                    key={item.href}
                    href={href}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "bg-gray-900 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition ${
                    pathname === "/admin"
                      ? "bg-red-600 text-white"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="mt-2 rounded-lg border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Esci
              </button>
            </div>
          </div>
        )}

      </div>
    </nav>
  )
}

