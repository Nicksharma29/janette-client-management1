import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'

const TEST_OWNER_ID = '3c2e2c1c-195a-4d29-b880-97bc2a190313'

const TEST_EVENTS = [
  {
    dbId: 'a75cfed2-c070-4a9c-ae96-a63cf33b373c',
    googleEventId: 'rcs5vraif35nh12c7u457m6iac',
  },
  {
    dbId: '6fb38fe1-7d02-4341-9489-d1274c745228',
    googleEventId: '7dqeu824j1pl9794mc1ot5ihd0',
  },
]

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.TIE_AUTOMATION_SECRET

  const suppliedSecret =
    authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

  if (!secret || suppliedSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!supabaseUrl || !serviceRoleKey || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Server configuration is missing' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data: connection, error: connectionError } = await supabase
    .from('google_calendar_connections')
    .select(
      'id, access_token, refresh_token, token_type, expires_at'
    )
    .eq('owner_id', TEST_OWNER_ID)
    .maybeSingle()

  if (connectionError || !connection?.refresh_token) {
    return NextResponse.json(
      {
        error: 'Google Calendar connection not available',
        details: connectionError?.message ?? 'No refresh token',
      },
      { status: 500 }
    )
  }

  let accessToken = connection.access_token
  let tokenType = connection.token_type ?? 'Bearer'

  const expiresAt = connection.expires_at
    ? new Date(connection.expires_at).getTime()
    : 0

  if (!accessToken || expiresAt <= Date.now() + 60_000) {
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json(
        { error: 'Google token refresh failed' },
        { status: 500 }
      )
    }

    accessToken = tokenData.access_token
    tokenType = tokenData.token_type ?? tokenType

    await supabase
      .from('google_calendar_connections')
      .update({
        access_token: accessToken,
        token_type: tokenType,
        scope: tokenData.scope ?? null,
        expires_at: new Date(
          Date.now() + Number(tokenData.expires_in ?? 3600) * 1000
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
  }

  const results = []

  for (const event of TEST_EVENTS) {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/${encodeURIComponent(event.googleEventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `${tokenType} ${accessToken}`,
        },
      }
    )

    results.push({
      dbId: event.dbId,
      googleEventId: event.googleEventId,
      status: response.status,
      deleted: response.ok || response.status === 404,
    })

    if (response.ok || response.status === 404) {
      await supabase
        .from('google_calendar_events')
        .delete()
        .eq('id', event.dbId)
        .eq('owner_id', TEST_OWNER_ID)
    }
  }

  return NextResponse.json({
    success: true,
    results,
  })
}
