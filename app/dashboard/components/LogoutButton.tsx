'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Props = {
  label: string
}

export default function LogoutButton({ label }: Props) {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    router.replace('/')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={loggingOut}
      className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#525252] hover:bg-[#fafafa] disabled:opacity-50 transition"
    >
      {loggingOut ? '...' : label}
    </button>
  )
}
