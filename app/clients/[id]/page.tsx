import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from '@/lib/i18n-server'

export default async function ClientDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { t } = await getTranslations()

  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      nationality,
      passport_number,
      address,
      city,
      postal_code,
      notes,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (clientError || !client) {
    notFound()
  }

  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select(`
      id,
      case_number,
      title,
      case_type,
      status,
      description,
      opened_at,
      closed_at,
      created_at
    `)
    .eq('client_id', client.id)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const safeCases = cases ?? []

  const { count: documentsCount } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('owner_id', user.id)

  const { count: tasksCount } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', client.id)
    .eq('owner_id', user.id)


  // TIE documents are read here only for the Immigration Deadlines panel.
  // Task creation is handled exclusively by /api/automation/tie-renewals.
  const { data: tieDocuments } = await supabase
    .from('documents')
    .select('id, name, document_type, expires_at, case_id')
    .eq('client_id', client.id)
    .eq('owner_id', user.id)
    .eq('document_type', 'TIE')
    .not('expires_at', 'is', null)

  const { data: attentionTasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date, case_id')
    .eq('client_id', client.id)
    .eq('owner_id', user.id)
    .eq('status', 'pending')
    .not('due_date', 'is', null)
    .order('due_date', { ascending: true })

  const { data: attentionDocuments } = await supabase
    .from('documents')
    .select('id, name, document_type, status, expires_at, case_id')
    .eq('client_id', client.id)
    .eq('owner_id', user.id)
    .not('expires_at', 'is', null)
    .order('expires_at', { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  const sixtyDaysFromNow = new Date(today)
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)
  const immigrationDeadlines = (tieDocuments ?? [])
    .filter((tie) => tie.expires_at && tie.case_id)
    .map((tie) => {
      const expiry = new Date(`${tie.expires_at}T00:00:00`)
      const renewalDate = new Date(expiry)
      renewalDate.setMonth(renewalDate.getMonth() - 2)

      const renewalDueDate = [
        renewalDate.getFullYear(),
        String(renewalDate.getMonth() + 1).padStart(2, '0'),
        String(renewalDate.getDate()).padStart(2, '0'),
      ].join('-')

      const expiryDate = [
        String(expiry.getDate()).padStart(2, '0'),
        String(expiry.getMonth() + 1).padStart(2, '0'),
        expiry.getFullYear(),
      ].join('/')

      const renewalDateFormatted = [
        String(renewalDate.getDate()).padStart(2, '0'),
        String(renewalDate.getMonth() + 1).padStart(2, '0'),
        renewalDate.getFullYear(),
      ].join('/')

      let status = 'Upcoming'

      if (renewalDate < today) {
        status = 'Overdue'
      } else if (renewalDate.getTime() === today.getTime()) {
        status = 'Due today'
      } else if (renewalDate <= sixtyDaysFromNow) {
        status = 'Upcoming'
      }

      return {
        id: tie.id,
        caseId: tie.case_id,
        name: tie.name,
        expiryDate,
        renewalDate: renewalDateFormatted,
        renewalDueDate,
        status,
      }
    })
    .sort((a, b) => a.renewalDueDate.localeCompare(b.renewalDueDate))


  // TIE renewal tasks are already shown in the dedicated
  // Immigration Deadlines panel, so exclude them here to avoid duplicates.
  const nonTieRenewalTasks = (attentionTasks ?? []).filter(
    (task) => !task.title.startsWith('TIE renewal — ')
  )

  const overdueTasks = nonTieRenewalTasks.filter((task) => {
    if (!task.due_date) return false
    return new Date(`${task.due_date}T00:00:00`) < today
  })

  const todayTasks = nonTieRenewalTasks.filter((task) => {
    if (!task.due_date) return false
    const due = new Date(`${task.due_date}T00:00:00`)
    return due.getTime() === today.getTime()
  })

  const upcomingTasks = nonTieRenewalTasks.filter((task) => {
    if (!task.due_date) return false
    const due = new Date(`${task.due_date}T00:00:00`)
    return due > today && due <= sevenDaysFromNow
  })

  const expiredDocuments = (attentionDocuments ?? []).filter((document) => {
    if (!document.expires_at) return false
    return new Date(`${document.expires_at}T00:00:00`) < today
  })

  const expiringDocuments = (attentionDocuments ?? []).filter((document) => {
    if (!document.expires_at) return false
    const expires = new Date(`${document.expires_at}T00:00:00`)
    return expires >= today && expires <= sixtyDaysFromNow
  })

  const attentionCount =
    overdueTasks.length +
    todayTasks.length +
    upcomingTasks.length +
    expiredDocuments.length +
    expiringDocuments.length

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
              {t.clientManagementSystemShort}
            </div>
          </div>

          <div className="text-sm text-[#737373]">
            {user.email}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link
          href="/clients"
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          {t.backToClients}
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            {t.clientProfile}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {client.first_name} {client.last_name}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.clientInformationWorkspace}
          </p>
        </div>

        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.personalInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Info label={t.firstName} value={client.first_name} />
              <Info label={t.lastName} value={client.last_name} />
              <Info label={t.dateOfBirth} value={client.date_of_birth} />
              <Info label={t.nationality} value={client.nationality} />
              <Info label={t.passportNumber} value={client.passport_number} />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.contactInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Info label={t.email} value={client.email} />
              <Info label={t.phone} value={client.phone} />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.addressSection}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Info label={t.address} value={client.address} />
              <Info label={t.city} value={client.city} />
              <Info label={t.postalCode} value={client.postal_code} />
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.notes}
            </h2>

            <p className="mt-4 text-sm leading-7 text-[#525252] whitespace-pre-wrap">
              {client.notes || t.noNotesAdded}
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#737373]">
                  {t.immigration}
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[#171717]">
                  {t.immigrationDeadlines}
                </h2>

                <p className="mt-1 text-sm text-[#737373]">
                  {t.immigrationDeadlinesDescription}
                </p>
              </div>

              <span className="rounded-full bg-[#f0f0ee] px-3 py-1 text-xs font-semibold text-[#525252]">
                {immigrationDeadlines.length}{' '}
                {immigrationDeadlines.length === 1 ? t.deadline : t.deadlines}
              </span>
            </div>

            {immigrationDeadlines.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-black/5 bg-[#f7f7f5] p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/5 text-sm">
                  ✓
                </div>

                <p className="mt-3 text-sm font-semibold text-[#171717]">
                  {t.noImmigrationDeadlines}
                </p>

                <p className="mt-1 text-sm text-[#737373]">
                  {t.noImmigrationDeadlinesDescription}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {immigrationDeadlines.map((deadline) => (
                  <Link
                    key={`immigration-deadline-${deadline.id}`}
                    href={`/clients/${client.id}/cases/${deadline.caseId}`}
                    className={`group block rounded-2xl border p-4 transition ${
                      deadline.status === 'Overdue'
                        ? 'border-red-200 bg-red-50/70 hover:bg-red-50'
                        : deadline.status === 'Due today'
                          ? 'border-orange-200 bg-orange-50/70 hover:bg-orange-50'
                          : 'border-yellow-200 bg-yellow-50/70 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          deadline.status === 'Overdue'
                            ? 'bg-red-100 text-red-700'
                            : deadline.status === 'Due today'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        !
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p
                            className={`text-sm font-semibold ${
                              deadline.status === 'Overdue'
                                ? 'text-red-950'
                                : deadline.status === 'Due today'
                                  ? 'text-orange-950'
                                  : 'text-yellow-950'
                            }`}
                          >
                            {t.tieRenewal}
                          </p>

                          <span
                            className={`shrink-0 text-xs font-semibold ${
                              deadline.status === 'Overdue'
                                ? 'text-red-700'
                                : deadline.status === 'Due today'
                                  ? 'text-orange-700'
                                  : 'text-yellow-700'
                            }`}
                          >
                            {deadline.status === 'Overdue'
                              ? t.overdue
                              : deadline.status === 'Due today'
                                ? t.dueToday
                                : t.upcoming}
                          </span>
                        </div>

                        <p
                          className={`mt-1 text-sm ${
                            deadline.status === 'Overdue'
                              ? 'text-red-900'
                              : deadline.status === 'Due today'
                                ? 'text-orange-900'
                                : 'text-yellow-900'
                          }`}
                        >
                          {t.renewalActionDateShort}: {deadline.renewalDate}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#737373]">
                          <span>
                            {t.tieExpires}: {deadline.expiryDate}
                          </span>

                          <span>
                            {t.document}: {deadline.name}
                          </span>
                        </div>

                        <p
                          className={`mt-3 text-xs font-medium opacity-80 group-hover:opacity-100 ${
                            deadline.status === 'Overdue'
                              ? 'text-red-700'
                              : deadline.status === 'Due today'
                                ? 'text-orange-700'
                                : 'text-yellow-700'
                          }`}
                        >
                          {t.openCase}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-[#171717]">
                    {t.needsAttention}
                  </h2>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      attentionCount > 0
                        ? 'bg-[#171717] text-white'
                        : 'bg-[#f0f0ee] text-[#525252]'
                    }`}
                  >
                    {attentionCount} {attentionCount === 1 ? t.item : t.items}
                  </span>
                </div>

                <p className="mt-1 text-sm text-[#737373]">
                  {t.needsAttentionDescription}
                </p>
              </div>
            </div>

            {attentionCount === 0 ? (
              <div className="mt-6 rounded-2xl border border-black/5 bg-[#f7f7f5] p-8 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/5 text-lg">
                  ✓
                </div>

                <p className="mt-3 text-sm font-semibold text-[#171717]">
                  {t.nothingNeedsAttention}
                </p>

                <p className="mt-1 text-sm text-[#737373]">
                  {t.nothingNeedsAttentionDescription}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {overdueTasks.map((task) => (
                  <Link
                    key={`overdue-task-${task.id}`}
                    href={`/clients/${client.id}/cases/${task.case_id}`}
                    className="group block rounded-2xl border border-red-200 bg-red-50/70 p-4 hover:bg-red-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-bold">
                        !
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-red-950">
                            {t.overdueTask}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-red-700">
                            {t.due} {task.due_date}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-red-900">
                          {task.title}
                        </p>

                        <p className="mt-2 text-xs font-medium text-red-700 opacity-80 group-hover:opacity-100">
                          {t.openCase}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}

                {todayTasks.map((task) => (
                  <Link
                    key={`today-task-${task.id}`}
                    href={`/clients/${client.id}/cases/${task.case_id}`}
                    className="group block rounded-2xl border border-orange-200 bg-orange-50/70 p-4 hover:bg-orange-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-sm font-bold">
                        !
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-orange-950">
                            {t.taskDueToday}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-orange-700">
                            Today
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-orange-900">
                          {task.title}
                        </p>

                        <p className="mt-2 text-xs font-medium text-orange-700 opacity-80 group-hover:opacity-100">
                          {t.openCase}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}

                {upcomingTasks.map((task) => (
                  <Link
                    key={`upcoming-task-${task.id}`}
                    href={`/clients/${client.id}/cases/${task.case_id}`}
                    className="group block rounded-2xl border border-yellow-200 bg-yellow-50/70 p-4 hover:bg-yellow-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">
                        →
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-yellow-950">
                            {t.upcomingTask}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-yellow-700">
                            {t.due} {task.due_date}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-yellow-900">
                          {task.title}
                        </p>

                        <p className="mt-2 text-xs font-medium text-yellow-700 opacity-80 group-hover:opacity-100">
                          {t.openCase}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}

                {expiredDocuments.map((document) => (
                  <Link
                    key={`expired-document-${document.id}`}
                    href={`/clients/${client.id}/cases/${document.case_id}`}
                    className="group block rounded-2xl border border-red-200 bg-red-50/70 p-4 hover:bg-red-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-bold">
                        !
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-red-950">
                            {t.expiredDocument}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-red-700">
                            Expired {document.expires_at}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-red-900">
                          {document.name}
                        </p>

                        <p className="mt-2 text-xs font-medium text-red-700 opacity-80 group-hover:opacity-100">
                          {t.openCase}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}

                {expiringDocuments.map((document) => (
                  <Link
                    key={`expiring-document-${document.id}`}
                    href={`/clients/${client.id}/cases/${document.case_id}`}
                    className="group block rounded-2xl border border-yellow-200 bg-yellow-50/70 p-4 hover:bg-yellow-50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">
                        !
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-yellow-950">
                            {t.documentExpiringSoon}
                          </p>

                          <span className="shrink-0 text-xs font-semibold text-yellow-700">
                            {t.expires} {document.expires_at}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-yellow-900">
                          {document.name}
                        </p>

                        <p className="mt-2 text-xs font-medium text-yellow-700 opacity-80 group-hover:opacity-100">
                          {t.openCase}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-black/5 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#171717]">
                  {t.cases}
                </h2>

                <p className="mt-1 text-sm text-[#737373]">
                  {t.manageCases}
                </p>
              </div>

              <Link
                href={`/clients/${client.id}/cases/new`}
                className="rounded-xl bg-[#171717] px-4 py-2.5 text-sm font-medium text-white hover:bg-black transition"
              >
                + {t.addCase}
              </Link>
            </div>

            {casesError ? (
              <div className="mt-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {t.unableToLoadCases}: {casesError.message}
              </div>
            ) : safeCases.length === 0 ? (
              <div className="mt-6 rounded-xl bg-[#f7f7f5] p-8 text-center">
                <div className="text-3xl mb-3">
                  📁
                </div>

                <h3 className="text-base font-semibold text-[#171717]">
                  {t.noCasesYet}
                </h3>

                <p className="mt-1 text-sm text-[#737373]">
                  {t.createFirstCase}
                </p>

                <Link
                  href={`/clients/${client.id}/cases/new`}
                  className="inline-block mt-5 rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition"
                >
                  {t.addFirstCase}
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {safeCases.map((caseItem) => (
                  <div
                    key={caseItem.id}
                    className="rounded-xl border border-black/5 p-5 hover:bg-[#fafafa] transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <Link
                             href={`/clients/${client.id}/cases/${caseItem.id}`}
                             className="font-semibold text-[#171717] hover:underline"
                           >
                             {caseItem.title === 'Residence Renewal'
                              ? t.residenceRenewal
                              : caseItem.title}
                           </Link>

                          <span className="rounded-full bg-[#f0f0ee] px-2.5 py-1 text-xs font-medium text-[#525252]">
                            {caseItem.status === 'active'
                              ? t.active
                              : caseItem.status}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#737373]">
                          {caseItem.case_number || t.noCaseNumber}
                          {' · '}
                          {caseItem.case_type === 'Immigration'
                              ? t.immigrationCaseType
                              : caseItem.case_type}
                        </p>
                      </div>

                      <div className="text-right text-xs text-[#737373]">
                        <div>
                          {t.opened}
                        </div>

                        <div className="mt-1 text-sm text-[#404040]">
                          {caseItem.opened_at}
                        </div>
                      </div>
                    </div>

                    {caseItem.description && (
                      <p className="mt-4 text-sm leading-6 text-[#525252] whitespace-pre-wrap">
                        {caseItem.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl bg-[#f7f7f5] p-5">
                <p className="text-sm text-[#737373]">{t.cases}</p>
                <p className="mt-2 text-2xl font-semibold text-[#171717]">
                  {safeCases.length}
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7f5] p-5">
                <p className="text-sm text-[#737373]">{t.documents}</p>
                <p className="mt-2 text-2xl font-semibold text-[#171717]">
                  {documentsCount ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7f5] p-5">
                <p className="text-sm text-[#737373]">{t.caseTasks}</p>
                <p className="mt-2 text-2xl font-semibold text-[#171717]">
                  {tasksCount ?? 0}
                </p>
              </div>
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
