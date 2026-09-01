'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [clientId, setClientId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Capture the form BEFORE any await.
    const form = event.currentTarget
    const formData = new FormData(form)

    setLoading(true)
    setError('')

    const { id } = await params
    setClientId(id)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/'
      return
    }

    const { error } = await supabase.from('cases').insert({
      client_id: id,
      owner_id: user.id,
      case_number: formData.get('case_number') || null,
      title: formData.get('title'),
      case_type: formData.get('case_type'),
      status: formData.get('status'),
      description: formData.get('description') || null,
      opened_at: formData.get('opened_at'),
      closed_at: formData.get('closed_at') || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = `/clients/${id}`
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <header className="border-b border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <Link
            href="/clients"
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
          href={clientId ? `/clients/${clientId}` : '/clients'}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          ← Back to Client
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            Case Management
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            Add Case
          </h1>

          <p className="mt-2 text-[#737373]">
            Create a new case for this client.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-8 space-y-8"
        >
          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              Case Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field
                label="Case number"
                name="case_number"
                placeholder="e.g. CASE-2026-001"
              />

              <Field
                label="Title"
                name="title"
                required
                placeholder="e.g. Residence application"
              />

              <div>
                <label
                  htmlFor="case_type"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  Case type
                </label>

                <select
                  id="case_type"
                  name="case_type"
                  required
                  className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
                >
                  <option value="">Select case type</option>
                  <option value="Immigration">Immigration</option>
                  <option value="Residence">Residence</option>
                  <option value="Work Permit">Work Permit</option>
                  <option value="Nationality">Nationality</option>
                  <option value="Family Reunification">
                    Family Reunification
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  Status
                </label>

                <select
                  id="status"
                  name="status"
                  required
                  defaultValue="active"
                  className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <Field
                label="Opened date"
                name="opened_at"
                type="date"
                required
              />

              <Field
                label="Closed date"
                name="closed_at"
                type="date"
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              Description
            </h2>

            <textarea
              name="description"
              rows={6}
              placeholder="Describe the case..."
              className="mt-4 w-full rounded-xl border border-black/10 bg-[#fafafa] px-4 py-3 text-sm outline-none focus:border-black/30 focus:bg-white transition resize-none"
            />
          </section>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={clientId ? `/clients/${clientId}` : '/clients'}
              className="rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-[#404040] hover:bg-[#fafafa]"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Case'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-[#404040] mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
      />
    </div>
  )
}
