'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { defaultLocale, translations, type Locale } from '@/lib/i18n'

const COOKIE_NAME = 'janet-language'

export default function NewClientPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
    )

    if (match?.[1] === 'en' || match?.[1] === 'es') {
      setLocale(match[1])
    }
  }, [])

  const t = translations[locale]

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
      setError(
        locale === 'es'
          ? 'No se pudo determinar el propietario del despacho.'
          : 'Could not determine the firm owner.'
      )
      setLoading(false)
      return
    }

    const { error } = await supabase.from('clients').insert({
      owner_id: effectiveOwnerId,
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email') || null,
      phone: formData.get('phone') || null,
      date_of_birth: formData.get('date_of_birth') || null,
      nationality: formData.get('nationality') || null,
      passport_number: formData.get('passport_number') || null,
      address: formData.get('address') || null,
      city: formData.get('city') || null,
      postal_code: formData.get('postal_code') || null,
      notes: formData.get('notes') || null,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/clients'
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
            {t.clientManagementSystem}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link
          href="/clients"
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          {t.backToClients}
        </Link>

        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[#171717]">
            {t.addNewClient}
          </h1>

          <p className="mt-2 text-[#737373]">
            {locale === 'es'
              ? 'Añade un nuevo cliente a Janet.'
              : 'Add a new client to Janet.'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-8 space-y-8"
        >
          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.personalInformation}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field label={t.firstName} name="first_name" required />
              <Field label={t.lastName} name="last_name" required />
              <Field label={t.email} name="email" type="email" />
              <Field label={t.phone} name="phone" type="tel" />
              <Field
                label={t.dateOfBirth}
                name="date_of_birth"
                type="date"
              />
              <Field label={t.nationality} name="nationality" />
              <Field
                label={t.passportNumber}
                name="passport_number"
              />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.addressSection}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="md:col-span-2">
                <Field label={t.address} name="address" />
              </div>

              <Field label={t.city} name="city" />
              <Field label={t.postalCode} name="postal_code" />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#171717]">
              {t.notes}
            </h2>

            <textarea
              name="notes"
              rows={5}
              placeholder={
                locale === 'es'
                  ? 'Información adicional...'
                  : 'Additional information...'
              }
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
              href="/clients"
              className="rounded-xl border border-black/10 px-5 py-3 text-sm font-medium text-[#404040] hover:bg-[#fafafa]"
            >
              {t.cancel}
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#171717] px-5 py-3 text-sm font-medium text-white hover:bg-black transition disabled:opacity-50"
            >
              {loading ? t.saving : t.saveClient}
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
}: {
  label: string
  name: string
  type?: string
  required?: boolean
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
        className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
      />
    </div>
  )
}
