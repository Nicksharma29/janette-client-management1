import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n-server'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { t } = await getTranslations()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, first_name, last_name, email, phone, nationality, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-xl font-semibold tracking-tight text-[#171717]"
            >
              Janet
            </Link>

            <div className="text-xs text-[#737373] mt-1">
              {t.clientManagementSystem}
            </div>
          </div>

          <div className="text-sm text-[#737373]">
            {user.email}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-[#737373]">
              {t.management}
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
              {t.clients}
            </h1>

            <p className="mt-2 text-[#737373]">
              {t.manageClients}
            </p>
          </div>

          <Link
            href="/clients/new"
            className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition"
          >
            + {t.addClient}
          </Link>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-700">
            {t.unableToLoadClients}: {error.message}
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-black/5">
                  <tr>
                    <th className="px-6 py-4 text-xs font-medium text-[#737373]">
                      {t.client}
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-[#737373]">
                      {t.email}
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-[#737373]">
                      {t.phone}
                    </th>
                    <th className="px-6 py-4 text-xs font-medium text-[#737373]">
                      {t.nationality}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-black/5 last:border-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/clients/${client.id}`}
                          className="font-medium text-[#171717] hover:underline"
                        >
                          {client.first_name} {client.last_name}
                        </Link>
                      </td>

                      <td className="px-6 py-5 text-sm text-[#737373]">
                        {client.email || '—'}
                      </td>

                      <td className="px-6 py-5 text-sm text-[#737373]">
                        {client.phone || '—'}
                      </td>

                      <td className="px-6 py-5 text-sm text-[#737373]">
                        {client.nationality || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-black/5 p-12 text-center">
            <div className="text-4xl mb-4">
              👤
            </div>

            <h2 className="text-lg font-semibold text-[#171717]">
              {t.noClientsYet}
            </h2>

            <p className="mt-2 text-sm text-[#737373]">
              {t.addFirstClientDescription}
            </p>

            <Link
              href="/clients/new"
              className="inline-block mt-6 rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition"
            >
              {t.addFirstClient}
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
