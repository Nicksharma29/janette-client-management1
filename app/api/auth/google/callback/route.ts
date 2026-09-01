import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.json(
      { error: 'Google OAuth was cancelled or denied.', details: error },
      { status: 400 }
    )
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing Google authorization code.' },
      { status: 400 }
    )
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured.' },
      { status: 500 }
    )
  }

  const redirectUri =
    'https://janette-client-management.vercel.app/api/auth/google/callback'

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()

  if (!tokenResponse.ok) {
    console.error('Google token exchange failed:', tokenData)

    return NextResponse.json(
      { error: 'Could not exchange Google authorization code.' },
      { status: 502 }
    )
  }

  // Use the normal authenticated client only to identify the logged-in user.
  const authSupabase = await createClient()

  const {
    data: { user },
  } = await authSupabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'You must be logged into Janet before connecting Google Calendar.' },
      { status: 401 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase server configuration is missing.' },
      { status: 500 }
    )
  }

  // Service-role client is required because OAuth tokens are protected
  // from direct authenticated-user access.
  const supabase = createServiceClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const accessToken = tokenData.access_token
  const refreshToken = tokenData.refresh_token

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { error: 'Google did not return the required calendar tokens.' },
      { status: 502 }
    )
  }

  const expiresIn = Number(tokenData.expires_in ?? 3600)

  const expiresAt = new Date(
    Date.now() + expiresIn * 1000
  ).toISOString()

  const { error: saveError } = await supabase
    .from('google_calendar_connections')
    .upsert(
      {
        owner_id: user.id,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: tokenData.token_type ?? 'Bearer',
        scope: tokenData.scope ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'owner_id',
      }
    )

  if (saveError) {
    console.error('Could not save Google Calendar connection:', saveError)

    return NextResponse.json(
      { error: 'Could not save Google Calendar connection.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: 'Google Calendar connected successfully.',
  })
}
