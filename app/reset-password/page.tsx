'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function establishRecoverySession() {
      const code = searchParams.get('code')

      if (!code) {
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          setReady(true)
        } else {
          setError('El enlace de recuperación no es válido o ha caducado.')
        }

        return
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        setError('El enlace de recuperación no es válido o ha caducado.')
        return
      }

      setReady(true)
    }

    establishRecoverySession()
  }, [searchParams, supabase])

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setMessage('Contraseña actualizada correctamente. Ya puedes iniciar sesión.')
    setPassword('')
    setConfirmPassword('')

    setTimeout(() => router.push('/'), 1500)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold">Crear nueva contraseña</h1>

        <p className="mt-2 text-sm text-gray-600">
          Introduce una nueva contraseña para tu cuenta.
        </p>

        {!ready && !error && (
          <p className="mt-6 text-sm text-gray-600">
            Verificando el enlace de recuperación...
          </p>
        )}

        {ready && (
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
              required
            />

            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-3"
              required
            />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}

        {error && !ready && (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        )}
      </div>
    </main>
  )
}
