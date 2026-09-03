import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            ⚽ Fantacalcio Asta
          </h1>

          <p className="mt-2 text-gray-600">
            Gestione dell&apos;asta del fantacalcio
          </p>
        </header>

        <nav className="grid gap-4 sm:grid-cols-2">
          
          <Link
            href="/partecipanti"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              👥 Partecipanti
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Aggiungi e gestisci i partecipanti all&apos;asta.
            </p>
          </Link>

          <Link
            href="/importa"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              📋 Importa giocatori
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Importa la lista dei giocatori da XLSX o CSV.
            </p>
          </Link>

          <Link
            href="/asta"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              🔨 Asta
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Avvia e gestisci l&apos;asta dei giocatori.
            </p>
          </Link>

          <Link
            href="/overview"
            className="rounded-xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              📊 Overview
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Visualizza la situazione delle rose e dei crediti.
            </p>
          </Link>

        </nav>
      </div>
    </main>
  )
}