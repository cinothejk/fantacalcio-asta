"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { useEffect, useState } from "react"



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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3">

        <Link
          href="/"
          className="mr-4 text-lg font-bold text-gray-900"
        >
          ⚽ Fantacalcio
        </Link>

        {auctionName && (
  <div className="mr-4 hidden items-center gap-2 text-sm sm:flex">
    <span className="text-gray-400">•</span>
    <span className="font-medium text-gray-500">
      Asta:
    </span>
    <span className="font-bold text-red-600">
      {auctionName}
    </span>
  </div>
)}

        {menuItems.map((item) => {
          const active = pathname === item.href

          const href =
            auctionId
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

        <div className="ml-auto">
          <button
            onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Esci
          </button>
        </div>

      </div>
    </nav>
  )
}

