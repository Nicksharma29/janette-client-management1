import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n-server'
import TaskActions from '@/components/TaskActions'

export default async function TasksPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { t } = await getTranslations()

  const { data: tasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      client_id,
      case_id,
      clients (
        first_name,
        last_name
      ),
      cases (
        title
      )
    `)
    .eq('owner_id', user.id)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const safeTasks = tasks ?? []

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
            {t.tasks}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {t.tasks}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.noTasksDescription}
          </p>
        </div>

        {safeTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/5 p-10 text-center">
            <div className="text-3xl mb-3">
              ✓
            </div>

            <h2 className="font-semibold text-[#171717]">
              {t.noTasksYet}
            </h2>

            <p className="mt-2 text-sm text-[#737373]">
              {t.noTasksDescription}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {safeTasks.map((task) => {
              const client = Array.isArray(task.clients)
                ? task.clients[0]
                : task.clients

              const caseData = Array.isArray(task.cases)
                ? task.cases[0]
                : task.cases

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-black/5 p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-[#171717]">
                        {task.title}
                      </h2>

                      {task.description && (
                        <p className="mt-2 text-sm leading-6 text-[#525252] whitespace-pre-wrap">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#737373]">
                        {client && (
                          <span>
                            <span className="font-medium text-[#404040]">
                              {t.client}:
                            </span>{' '}
                            {client.first_name} {client.last_name}
                          </span>
                        )}

                        {caseData && (
                          <span>
                            <span className="font-medium text-[#404040]">
                              {t.workspace}:
                            </span>{' '}
                            {caseData.title}
                          </span>
                        )}

                        {task.due_date && (
                          <span>
                            <span className="font-medium text-[#404040]">
                              {t.due}:
                            </span>{' '}
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-[#f0f0ee] px-3 py-1 text-xs font-medium text-[#404040]">
                        {task.priority}
                      </span>

                      <span className="rounded-full bg-[#f0f0ee] px-3 py-1 text-xs font-medium text-[#404040]">
                        {task.status}
                      </span>

                      <TaskActions
                        taskId={task.id}
                        status={task.status}
                      />
                    </div>
                  </div>

                  {task.client_id && task.case_id && (
                    <div className="mt-4 pt-4 border-t border-black/5">
                      <Link
                        href={`/clients/${task.client_id}/cases/${task.case_id}`}
                        className="text-sm font-medium text-[#404040] hover:text-[#171717]"
                      >
                        {t.viewCases} →
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
