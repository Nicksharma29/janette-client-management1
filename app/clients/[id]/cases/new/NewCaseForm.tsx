'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Translations = {
  clientManagementSystemShort: string
  backToClient: string
  cases: string
  addNewCase: string
  newCaseDescription: string
  caseInformation: string
  caseNumber: string
  caseType: string
  selectCaseType: string
  title: string
  status: string
  active: string
  pending: string
  closed: string
  cancelled: string
  immigration: string
  residenceRenewal: string
  workPermit: string
  nationality: string
  familyReunification: string
  otherCaseType: string
  openedDate: string
  closedDate: string
  description: string
  describeCase: string
  cancel: string
  saveCase: string
  savingCase: string
  caseNumberPlaceholder: string
  caseTitlePlaceholder: string
}

export default function NewCaseForm({
  clientId,
  t,
}: {
  clientId: string
  t: Translations
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    setLoading(true)
    setError('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/'
      return
    }

    const { error } = await supabase.from('cases').insert({
      client_id: clientId,
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

    window.location.href = `/clients/${clientId}`
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
            {t.clientManagementSystemShort}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href={`/clients/${clientId}`}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          {t.backToClient}
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            {t.cases}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {t.addNewCase}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.newCaseDescription}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-8 space-y-8"
        >
          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.caseInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field
                label={t.caseNumber}
                name="case_number"
                placeholder={t.caseNumberPlaceholder}
              />

              <Field
                label={t.title}
                name="title"
                required
                placeholder={t.caseTitlePlaceholder}
              />

              <div>
                <label
                  htmlFor="case_type"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  {t.caseType}
                </label>

                <select
                  id="case_type"
                  name="case_type"
                  required
                  className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
                >
                  <option value="">{t.selectCaseType}</option>
                  <option value="Immigration">{t.immigration}</option>
                  <option value="Residence">{t.residenceRenewal}</option>
                  <option value="Work Permit">{t.workPermit}</option>
                  <option value="Nationality">{t.nationality}</option>
                  <option value="Family Reunification">
                    {t.familyReunification}
                  </option>
                  <option value="Other">{t.otherCaseType}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-[#404040] mb-2"
                >
                  {t.status}
                </label>

                <select
                  id="status"
                  name="status"
                  required
                  defaultValue="active"
                  className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
                >
                  <option value="active">{t.active}</option>
                  <option value="pending">{t.pending}</option>
                  <option value="closed">{t.closed}</option>
                  <option value="cancelled">{t.cancelled}</option>
                </select>
              </div>

              <Field
                label={t.openedDate}
                name="opened_at"
                type="date"
                required
              />

              <Field
                label={t.closedDate}
                name="closed_at"
                type="date"
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.description}
            </h2>

            <textarea
              name="description"
              rows={6}
              placeholder={t.describeCase}
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
              href={`/clients/${clientId}`}
              className="rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-[#404040] hover:bg-[#fafafa]"
            >
              {t.cancel}
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition disabled:opacity-50"
            >
              {loading ? t.savingCase : t.saveCase}
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
