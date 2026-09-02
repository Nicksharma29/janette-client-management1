import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n-server'

export default async function CasesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { t } = await getTranslations()

  const { data: cases } = await supabase
    .from('cases')
    .select(`
      id,
      client_id,
      case_number,
      title,
      case_type,
      status,
      description,
      opened_at,
      closed_at,
      clients (
        first_name,
        last_name
      )
    `)
    .eq('owner_id', user.id)
    .order('opened_at', { ascending: false })

  const safeCases = cases ?? []

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

      <div className="max-w-6xl mx-auto px-6 py-10">
        <Link
          href="/dashboard"
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          Volver al panel
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            {t.cases}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {t.cases}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.manageCases}
          </p>
        </div>

        {safeCases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/5 p-10 text-center">
            <div className="text-3xl mb-3">
              📁
            </div>

            <h2 className="font-semibold text-[#171717]">
              {t.noCasesYet}
            </h2>

            <p className="mt-2 text-sm text-[#737373]">
              {t.createFirstCase}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeCases.map((caseItem) => {
              const client = Array.isArray(caseItem.clients)
                ? caseItem.clients[0]
                : caseItem.clients

              return (
                <div
                  key={caseItem.id}
                  className="bg-white rounded-2xl border border-black/5 p-5 hover:border-black/10 hover:shadow-sm transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/clients/${caseItem.client_id}/cases/${caseItem.id}`}
                          className="font-semibold text-[#171717] hover:underline"
                        >
                          {caseItem.title === 'Residence Renewal'
                            ? t.residenceRenewal
                            : caseItem.title}
                        </Link>

                        <span className="rounded-full bg-[#f0f0ee] px-3 py-1 text-xs font-medium text-[#404040]">
                          {caseItem.status === 'active'
                            ? t.active
                            : caseItem.status}
                        </span>
                      </div>

                      {client && (
                        <p className="mt-2 text-sm font-medium text-[#404040]">
                          {client.first_name} {client.last_name}
                        </p>
                      )}

                      <p className="mt-2 text-sm text-[#737373]">
                        {caseItem.case_number || t.noCaseNumber}
                        {' · '}
                        {caseItem.case_type === 'Immigration'
                          ? t.immigrationCaseType
                          : caseItem.case_type}
                      </p>

                      {caseItem.description && (
                        <p className="mt-4 text-sm leading-6 text-[#525252] whitespace-pre-wrap">
                          {caseItem.description}
                        </p>
                      )}
                    </div>

                    <div className="text-left lg:text-right text-xs text-[#737373] shrink-0">
                      <div>
                        {t.opened}
                      </div>

                      <div className="mt-1 text-sm text-[#404040]">
                        {caseItem.opened_at}
                      </div>

                      {caseItem.closed_at && (
                        <div className="mt-3">
                          <div>
                            {t.closed}
                          </div>

                          <div className="mt-1 text-sm text-[#404040]">
                            {caseItem.closed_at}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-black/5">
                    <Link
                      href={`/clients/${caseItem.client_id}/cases/${caseItem.id}`}
                      className="text-sm font-medium text-[#404040] hover:text-[#171717]"
                    >
                      {t.viewCases} →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
