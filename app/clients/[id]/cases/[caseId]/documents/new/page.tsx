'use client'

import Link from 'next/link'
import { use, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NewDocumentPage({
  params,
}: {
  params: Promise<{ id: string; caseId: string }>
}) {
  const { id, caseId } = use(params)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)

  async function handleSubmit(formData: FormData) {
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
        setError('Please select a document file.')
        setLoading(false)
        return
      }

      const name = String(formData.get('name') || '').trim()
      const documentType = String(formData.get('document_type') || '').trim()
      const expiresAt = String(formData.get('expires_at') || '').trim()
      const notes = String(formData.get('description') || '').trim()

      if (!name) {
        setError('Please enter a document name.')
        setLoading(false)
        return
      }

      const extension = file.name.includes('.')
        ? file.name.split('.').pop()
        : 'bin'

      const storagePath =
        `${user.id}/${id}/${caseId}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) {
        console.error(uploadError)
        setError(`Upload failed: ${uploadError.message}`)
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          owner_id: user.id,
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

        setError(`Could not save document: ${insertError.message}`)
        setLoading(false)
        return
      }

      window.location.href = `/clients/${id}/cases/${caseId}`
    } catch (err) {
      console.error(err)
      setError('Something went wrong while uploading the document.')
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
            Client Management System
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <Link
          href={`/clients/${id}/cases/${caseId}`}
          className="text-sm text-[#737373] hover:text-[#171717]"
        >
          ← Back to Case
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm text-[#737373]">
            Case Documents
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#171717]">
            Add Document
          </h1>

          <p className="mt-2 text-[#737373]">
            Upload and securely store a document for this case.
          </p>
        </div>

        <form
          action={handleSubmit}
          className="bg-white rounded-2xl border border-black/5 p-6 space-y-6"
        >
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              Document name
            </label>

            <input
              name="name"
              type="text"
              required
              placeholder="e.g. Passport"
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              Document type
            </label>

            <select
              name="document_type"
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm bg-white outline-none focus:border-black/30"
              defaultValue=""
            >
              <option value="">Select type</option>
              <option value="Passport">Passport</option>
              <option value="Residence Permit">Residence Permit</option>
              <option value="TIE">TIE</option>
              <option value="NIE">NIE</option>
              <option value="Contract">Contract</option>
              <option value="Application">Application</option>
              <option value="Certificate">Certificate</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              File
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
                Selected: {file.name} · {(file.size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              Document expiry date
            </label>

            <input
              name="expires_at"
              type="date"
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
            />

            <p className="mt-2 text-xs text-[#737373]">
              Optional. Use this for documents such as TIE, residence permits, passports, or other documents with an expiry date.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#404040]">
              Description / Notes
            </label>

            <textarea
              name="description"
              rows={4}
              placeholder="Optional notes about this document..."
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black/30"
            />
          </div>

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
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
