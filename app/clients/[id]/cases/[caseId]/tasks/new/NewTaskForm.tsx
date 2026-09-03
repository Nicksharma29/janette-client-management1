'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Translations = {
  clientManagementSystemShort: string
  backToCase: string
  tasks: string
  taskManagement: string
  addNewTask: string
  newTaskDescription: string
  taskTitle: string
  taskTitlePlaceholder: string
  priority: string
  low: string
  medium: string
  high: string
  dueDate: string
  description: string
  taskInformationPlaceholder: string
  cancel: string
  saveTask: string
  savingTask: string
}

export default function NewTaskForm({
  t,
}: {
  t: Translations
}) {
  const { id, caseId } = useParams<{ id: string; caseId: string }>()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/'
      return
    }

    const { data: effectiveOwnerId, error: ownerError } = await supabase.rpc(
      'get_effective_owner_id'
    )

    if (ownerError || !effectiveOwnerId) {
      setError(t.newTaskDescription)
      setLoading(false)
      return
    }

    const { error } = await supabase.from('tasks').insert({
      owner_id: effectiveOwnerId,
      client_id: id,
      case_id: caseId,
      title: formData.get('title'),
      description: formData.get('description') || null,
      status: 'pending',
      priority: formData.get('priority') || 'medium',
      due_date: formData.get('due_date') || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = `/clients/${id}/cases/${caseId}`
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
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
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href={`/clients/${id}/cases/${caseId}`}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          {t.backToCase}
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            {t.tasks}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {t.addNewTask}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.newTaskDescription}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-8 space-y-8"
        >
          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              {t.taskTitle}
            </label>

            <input
              name="title"
              required
              placeholder={t.taskTitlePlaceholder}
              className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              {t.priority}
            </label>

            <select
              name="priority"
              defaultValue="medium"
              className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition"
            >
              <option value="low">{t.low}</option>
              <option value="medium">{t.medium}</option>
              <option value="high">{t.high}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              {t.dueDate}
            </label>

            <input
              name="due_date"
              type="date"
              className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              {t.description}
            </label>

            <textarea
              name="description"
              rows={5}
              placeholder={t.taskInformationPlaceholder}
              className="w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition resize-none"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Link
              href={`/clients/${id}/cases/${caseId}`}
              className="rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-[#404040] hover:bg-[#fafafa]"
            >
              {t.cancel}
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition disabled:opacity-50"
            >
              {loading ? t.savingTask : t.saveTask}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
