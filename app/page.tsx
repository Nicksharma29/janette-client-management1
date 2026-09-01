'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-sm border border-black/5 p-8">
          <div className="mb-10">
            <div className="text-2xl font-semibold tracking-tight text-[#171717]">
              Janet
            </div>

            <p className="mt-2 text-sm text-[#737373]">
              Client Management System
            </p>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-semibold text-[#171717]">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-[#737373]">
              Sign in to manage your clients and cases.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#404040] mb-2"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#404040] mb-2"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full h-12 rounded-xl border border-black/10 bg-[#fafafa] px-4 text-sm outline-none focus:border-black/30 focus:bg-white transition"
              />
            </div>

            {message && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#171717] text-white text-sm font-medium hover:bg-black transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-black/5 text-center">
            <p className="text-xs text-[#a3a3a3]">
              Janet Client Management
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
