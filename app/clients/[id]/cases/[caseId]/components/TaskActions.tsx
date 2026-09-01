'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TaskActions({
  taskId,
  status,
}: {
  taskId: string
  status: string
}) {
  const [loading, setLoading] = useState(false)

  async function toggleTask() {
    setLoading(true)

    const supabase = createClient()

    const newStatus = status === 'completed' ? 'pending' : 'completed'

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at:
          newStatus === 'completed'
            ? new Date().toISOString()
            : null,
      })
      .eq('id', taskId)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    window.location.reload()
  }

  async function deleteTask() {
    const confirmed = window.confirm(
      'Are you sure you want to delete this task?'
    )

    if (!confirmed) return

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    window.location.reload()
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleTask}
        disabled={loading}
        className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-[#404040] hover:bg-[#f7f7f5] transition disabled:opacity-50"
      >
        {loading
          ? 'Updating...'
          : status === 'completed'
            ? 'Reopen'
            : 'Complete'}
      </button>

      <button
        type="button"
        onClick={deleteTask}
        disabled={loading}
        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}
