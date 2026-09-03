"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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
label: "Overview",
href: "/overview",
},
]

export default function Navbar() {
const pathname = usePathname()

return ( <nav className="border-b border-gray-200 bg-white"> <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3">

    <Link
      href="/"
      className="mr-4 text-lg font-bold text-gray-900"
    >
      ⚽ Fantacalcio
    </Link>

    {menuItems.map((item) => {
      const active = pathname === item.href

      return (
        <Link
          key={item.href}
          href={item.href}
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

  </div>
</nav>

)
}
