'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DocumentActions({
  documentId,
  deleteLabel,
  deletingLabel,
  confirmationMessage,
}: {
  documentId: string
  deleteLabel: string
  deletingLabel: string
  confirmationMessage: string
}) {
  const [loading, setLoading] = useState(false)

  async function deleteDocument() {
    const confirmed = window.confirm(confirmationMessage)

    if (!confirmed) return

    setLoading(true)

    const supabase = createClient()

    // First get the file path so we can remove the actual Storage file.
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .single()

    if (fetchError) {
      console.error(fetchError)
      setLoading(false)
      return
    }

    // Delete the uploaded file from the private Storage bucket.
    if (document?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .remove([document.file_path])

      if (storageError) {
        console.error(storageError)
        setLoading(false)
        return
      }
    }

    // Then delete the database record.
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      console.error(deleteError)
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <button
      type="button"
      onClick={deleteDocument}
      disabled={loading}
      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
    >
      {loading ? deletingLabel : deleteLabel}
    </button>
  )
}
