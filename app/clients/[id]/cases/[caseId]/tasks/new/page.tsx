'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewTaskPage() {
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

    const { error } = await supabase.from('tasks').insert({
      owner_id: user.id,
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
            Client Management System
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href={`/clients/${id}/cases/${caseId}`}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          ← Back to Case
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            Task Management
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            Add Task
          </h1>

          <p className="mt-2 text-[#737373]">
            Create a task for this case.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-8 space-y-8"
        >
          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              Task title
            </label>

            <input
              name="title"
              required
              placeholder="e.g. Request updated passport copy"
              className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              Priority
            </label>

            <select
              name="priority"
              defaultValue="medium"
              className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              Due date
            </label>

            <input
              name="due_date"
              type="date"
              className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm text-[#171717] outline-none focus:border-black/30 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040] mb-2">
              Description
            </label>

            <textarea
              name="description"
              rows={5}
              placeholder="Additional information about this task..."
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
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
