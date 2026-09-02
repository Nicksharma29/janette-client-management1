import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n-server'
import TaskActions from './components/TaskActions'
import DocumentActions from './components/DocumentActions'

export default async function CaseWorkspacePage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { t } = await getTranslations()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select(`
      id,
      client_id,
      owner_id,
      case_number,
      title,
      case_type,
      status,
      description,
      opened_at,
      closed_at,
      created_at,
      updated_at
    `)
    .eq('id', caseId)
    .eq('client_id', id)
    .eq('owner_id', user.id)
    .single()

  if (error || !caseData) {
    notFound()
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, first_name, last_name')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!client) {
    notFound()
  }

  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, document_type, file_path, status, notes, created_at')
    .eq('case_id', caseId)
    .eq('client_id', id)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date, created_at')
    .eq('case_id', caseId)
    .eq('client_id', id)
    .eq('owner_id', user.id)
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
          href={`/clients/${id}`}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          {t.backToClient}
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            {t.workspace}
          </p>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
                {caseData.title}
              </h1>

              <p className="mt-2 text-[#737373]">
                {client.first_name} {client.last_name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#f0f0ee] px-4 py-2 text-sm font-medium text-[#404040]">
                {caseData.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.caseOverview}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <Info
                label={t.caseNumber}
                value={caseData.case_number}
              />

              <Info
                label={t.caseType}
                value={caseData.case_type}
              />

              <Info
                label={caseData.status}
                value={caseData.status}
              />

              <Info
                label={t.opened}
                value={caseData.opened_at}
              />

              <Info
                label={t.closed}
                value={caseData.closed_at}
              />

              <Info
                label={t.client}
                value={`${client.first_name} ${client.last_name}`}
              />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.description}
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#525252] whitespace-pre-wrap">
              {caseData.description || t.noDescription}
            </p>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#171717]">
                  {t.documents}
                </h2>

                <p className="text-sm text-[#737373] mt-1">
                  {t.caseDocumentsDescription}
                </p>
              </div>

              <Link
                href={`/clients/${id}/cases/${caseId}/documents/new`}
                className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition"
              >
                + {t.addDocument}
              </Link>
            </div>

            {documents && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="bg-white rounded-2xl border border-black/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#171717]">
                          {document.name}
                        </h3>

                        <p className="mt-1 text-sm text-[#737373]">
                          {document.document_type || t.document}
                        </p>

                        {document.notes && (
                          <p className="mt-3 text-sm text-[#525252]">
                            {document.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#f0f0ee] px-3 py-1 text-xs font-medium text-[#404040]">
                          {document.status}
                        </span>

                        {document.file_path && (
                          <Link
                            href={`/clients/${id}/cases/${caseId}/documents/${document.id}/view`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-[#404040] hover:bg-[#f7f7f5] transition"
                          >
                            {t.view}
                          </Link>
                        )}

                        <DocumentActions
                          documentId={document.id}
                          deleteLabel={t.delete}
                          deletingLabel={t.deleting}
                          confirmationMessage={t.deletingDocumentConfirmation}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-black/5 p-8 text-center">
                <div className="text-3xl mb-3">
                  📄
                </div>

                <h3 className="font-semibold text-[#171717]">
                  {t.noDocumentsYet}
                </h3>

                <p className="mt-2 text-sm text-[#737373]">
                  {t.noDocumentsDescription}
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#171717]">
                  {t.tasks}
                </h2>

                <p className="text-sm text-[#737373] mt-1">
                  {t.noTasksDescription}
                </p>
              </div>

              <Link
                href={`/clients/${id}/cases/${caseId}/tasks/new`}
                className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition"
              >
                + {t.addTask}
              </Link>
            </div>

            {safeTasks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/5 p-8 text-center">
                <div className="text-3xl mb-3">
                  ✓
                </div>

                <h3 className="font-semibold text-[#171717]">
                  {t.noTasksYet}
                </h3>

                <p className="mt-2 text-sm text-[#737373]">
                  {t.noTasksDescription}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {safeTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-black/5 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-[#171717]">
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="mt-2 text-sm leading-6 text-[#525252] whitespace-pre-wrap">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
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

                    {task.due_date && (
                      <p className="mt-4 text-xs text-[#737373]">
                        {t.due} {task.due_date}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#171717] mb-4">
              {t.caseActivity}
            </h2>

            <div className="bg-white rounded-2xl border border-black/5 p-8 text-center">
              <p className="text-sm text-[#737373]">
                {t.caseActivityDescription}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function Info({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[#737373]">
        {label}
      </p>

      <p className="mt-2 text-sm text-[#171717]">
        {value || '—'}
      </p>
    </div>
  )
}
