'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Translations = {
  clientManagementSystemShort: string
  backToCase: string
  caseDocuments: string
  addDocument: string
  uploadAndStoreDocument: string
  documentName: string
  documentNamePlaceholder: string
  documentType: string
  selectDocumentType: string
  passport: string
  residencePermit: string
  tie: string
  nie: string
  contract: string
  application: string
  certificate: string
  other: string
  file: string
  selected: string
  documentExpiryDate: string
  optionalDocumentExpiry: string
  descriptionNotes: string
  documentNotesPlaceholder: string
  cancel: string
  uploading: string
  uploadDocument: string
  pleaseSelectDocumentFile: string
  pleaseEnterDocumentName: string
  uploadFailed: string
  couldNotSaveDocument: string
  uploadDocumentError: string
}

export default function NewDocumentForm({
  t,
}: {
  t: Translations
}) {
  const { id, caseId } = useParams<{ id: string; caseId: string }>()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/'
        return
      }

      if (!file) {
        setError(t.pleaseSelectDocumentFile)
        setLoading(false)
        return
      }

      const { data: effectiveOwnerId, error: ownerError } = await supabase.rpc(
        'get_effective_owner_id'
      )

      if (ownerError || !effectiveOwnerId) {
        setError(t.uploadDocumentError)
        setLoading(false)
        return
      }

      const formData = new FormData(form)

      const name = String(formData.get('name') || '').trim()
      const documentType = String(formData.get('document_type') || '').trim()
      const expiresAt = String(formData.get('expires_at') || '').trim()
      const notes = String(formData.get('description') || '').trim()

      if (!name) {
        setError(t.pleaseEnterDocumentName)
        setLoading(false)
        return
      }

      const extension = file.name.includes('.')
        ? file.name.split('.').pop()
        : 'bin'

      const storagePath =
        `${effectiveOwnerId}/${id}/${caseId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        setError(`${t.uploadFailed}: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          owner_id: effectiveOwnerId,
          client_id: id,
          case_id: caseId,
          name,
          document_type: documentType || null,
          file_path: storagePath,
          mime_type: file.type || null,
          file_size: file.size,
          status: 'active',
          expires_at: expiresAt || null,
          notes: notes || null,
        })

      if (insertError) {
        console.error(insertError)

        await supabase.storage
          .from('case-documents')
          .remove([storagePath])

        setError(`${t.couldNotSaveDocument}: ${insertError.message}`)
        setLoading(false)
        return
      }

      window.location.href = `/clients/${id}/cases/${caseId}`
    } catch (err) {
      console.error(err)
      setError(t.uploadDocumentError)
      setLoading(false)
    }
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

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href={`/clients/${id}/cases/${caseId}`}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          ← {t.backToCase}
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            {t.caseDocuments}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            {t.addDocument}
          </h1>

          <p className="mt-2 text-[#737373]">
            {t.uploadAndStoreDocument}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-6 space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              {t.documentName}
            </label>

            <input
              name="name"
              type="text"
              required
              placeholder={t.documentNamePlaceholder}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              {t.documentType}
            </label>

            <select
              name="document_type"
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm bg-white outline-none focus:border-black/30"
              defaultValue=""
            >
              <option value="">{t.selectDocumentType}</option>
              <option value="Passport">{t.passport}</option>
              <option value="Residence Permit">{t.residencePermit}</option>
              <option value="TIE">{t.tie}</option>
              <option value="NIE">{t.nie}</option>
              <option value="Contract">{t.contract}</option>
              <option value="Application">{t.application}</option>
              <option value="Certificate">{t.certificate}</option>
              <option value="Other">{t.other}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              {t.file}
            </label>

            <input
              type="file"
              required
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null)
              }}
              className="mt-2 block w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm"
            />

            {file && (
              <p className="mt-2 text-xs text-[#737373]">
                {t.selected}: {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              {t.documentExpiryDate}
            </label>

            <input
              name="expires_at"
              type="date"
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
            />

            <p className="mt-2 text-xs text-[#737373]">
              {t.optionalDocumentExpiry}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              {t.descriptionNotes}
            </label>

            <textarea
              name="description"
              rows={4}
              placeholder={t.documentNotesPlaceholder}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
            />
          </div>

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
              {loading ? t.uploading : t.uploadDocument}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
