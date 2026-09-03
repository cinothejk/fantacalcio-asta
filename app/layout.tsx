
import type { Metadata } from "next"
import "./globals.css"
import AuthGuard from "@/components/AuthGuard"

export const metadata: Metadata = {
  title: "Fantacalcio Asta",
  description: "Gestione asta fantacalcio",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  )
}

