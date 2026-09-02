import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n-server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { t } = await getTranslations()

  const [clientsResult, casesResult, tasksResult, calendarResult] =
    await Promise.all([
      supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id),

      supabase
        .from('cases')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id),

      supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id),

      supabase
        .from('google_calendar_connections')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle(),
    ])

  const clientsCount = clientsResult.count ?? 0
  const casesCount = casesResult.count ?? 0
  const tasksCount = tasksResult.count ?? 0
  const calendarConnected = Boolean(calendarResult.data)

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold tracking-tight text-[#171717]">
              Janet
            </div>

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
        <div className="mb-10">
          <p className="text-sm text-[#737373]">
            {t.dashboard}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {t.welcome}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.workspace}
          </p>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-black/5 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm text-[#737373]">
                {t.googleCalendar}
              </p>

              <h2 className="mt-2 text-lg font-semibold text-[#171717]">
                {t.connectCalendarTitle}
              </h2>

              <p className="mt-1 text-sm text-[#737373]">
                {t.connectCalendarDescription}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {calendarConnected && (
                <span className="inline-flex items-center rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  ✓ {t.calendarConnected}
                </span>
              )}

              <a
                href="/api/auth/google"
                className="inline-flex items-center justify-center rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition"
              >
                {calendarConnected ? t.reconnectCalendar : t.connectCalendar}
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <a
            href="/clients"
            className="block bg-white rounded-2xl border border-black/5 p-6 hover:border-black/15 hover:shadow-sm transition"
          >
            <p className="text-sm text-[#737373]">
              {t.clients}
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#171717]">
              {clientsCount}
            </p>

            <p className="mt-3 text-xs text-[#737373]">
              {t.viewClients}
            </p>
          </a>

          <a
            href="/clients"
            className="block bg-white rounded-2xl border border-black/5 p-6 hover:border-black/15 hover:shadow-sm transition"
          >
            <p className="text-sm text-[#737373]">
              {t.activeCases}
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#171717]">
              {casesCount}
            </p>

            <p className="mt-3 text-xs text-[#737373]">
              {t.viewCases}
            </p>
          </a>

          <a
            href="/tasks"
            className="block bg-white rounded-2xl border border-black/5 p-6 hover:border-black/15 hover:shadow-sm transition"
          >
            <p className="text-sm text-[#737373]">
              {t.tasks}
            </p>

            <p className="mt-3 text-3xl font-semibold text-[#171717]">
              {tasksCount}
            </p>

            <p className="mt-3 text-xs text-[#737373]">
              {t.viewTasks}
            </p>
          </a>
        </div>
      </div>
    </main>
  )
}
