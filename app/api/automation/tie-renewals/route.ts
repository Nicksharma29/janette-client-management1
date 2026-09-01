import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_CALENDAR_API =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events'

type GoogleTokenResponse = {
  access_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

async function getGoogleAccessToken(
  supabase: any,
  ownerId: string
) {
  const { data: connection, error: connectionError } = await supabase
    .from('google_calendar_connections')
    .select(
      'id, access_token, refresh_token, token_type, expires_at'
    )
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (connectionError) {
    console.error('Could not load Google Calendar connection:', connectionError)
    return null
  }

  if (!connection?.refresh_token) {
    return null
  }

  const expiresAt = connection.expires_at
    ? new Date(connection.expires_at).getTime()
    : 0

  // Existing access token is still valid for at least 60 seconds.
  if (
    connection.access_token &&
    expiresAt > Date.now() + 60_000
  ) {
    return {
      accessToken: connection.access_token,
      tokenType: connection.token_type ?? 'Bearer',
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Google OAuth credentials are not configured.')
    return null
  }

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

  const tokenData =
    (await tokenResponse.json()) as GoogleTokenResponse

  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error('Google token refresh failed:', tokenData)
    return null
  }

  const expiresIn = Number(tokenData.expires_in ?? 3600)

  const newExpiresAt = new Date(
    Date.now() + expiresIn * 1000
  ).toISOString()

  const { error: updateError } = await supabase
    .from('google_calendar_connections')
    .update({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type ?? connection.token_type ?? 'Bearer',
      scope: tokenData.scope ?? null,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)

  if (updateError) {
    console.error(
      'Could not update refreshed Google Calendar token:',
      updateError
    )
  }

  return {
    accessToken: tokenData.access_token,
    tokenType: tokenData.token_type ?? 'Bearer',
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const automationSecret = process.env.TIE_AUTOMATION_SECRET
  const cronSecret = process.env.CRON_SECRET

  if (!automationSecret && !cronSecret) {
    return NextResponse.json(
      { error: 'Automation authentication is not configured' },
      { status: 500 }
    )
  }

  const suppliedSecret =
    authHeader?.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : null

  const authorized =
    suppliedSecret !== null &&
    ((automationSecret !== undefined &&
      suppliedSecret === automationSecret) ||
      (cronSecret !== undefined &&
        suppliedSecret === cronSecret))

  if (!authorized) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'Supabase server configuration is missing' },
      { status: 500 }
    )
  }


  const supabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )


  const { data: tieDocuments, error: documentsError } = await supabase
    .from('documents')
    .select(`
      id,
      owner_id,
      client_id,
      case_id,
      name,
      expires_at,
      status
    `)
    .eq('document_type', 'TIE')
    .eq('status', 'active')
    .not('expires_at', 'is', null)

  if (documentsError) {
    console.error('TIE automation document query failed:', documentsError)

    return NextResponse.json(
      { error: 'Could not load TIE documents' },
      { status: 500 }
    )
  }

  let created = 0
  let skipped = 0
  let failed = 0
  let calendarCreated = 0
  let calendarSkipped = 0
  let calendarFailed = 0

  for (const tie of tieDocuments ?? []) {
    if (!tie.expires_at || !tie.case_id) {
      skipped++
      continue
    }

    const expiry = new Date(`${tie.expires_at}T00:00:00`)

    if (Number.isNaN(expiry.getTime())) {
      skipped++
      continue
    }

    const renewalDate = new Date(expiry)
    renewalDate.setMonth(renewalDate.getMonth() - 2)

    const renewalDueDate = [
      renewalDate.getFullYear(),
      String(renewalDate.getMonth() + 1).padStart(2, '0'),
      String(renewalDate.getDate()).padStart(2, '0'),
    ].join('-')

    // Do not create late reminders after the 2-month renewal date has passed.
    const today = new Date()
    const todayDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )

    const renewalDateOnly = new Date(
      renewalDate.getFullYear(),
      renewalDate.getMonth(),
      renewalDate.getDate()
    )

    if (renewalDateOnly < todayDate) {
      skipped++
      continue
    }

    const formattedExpiry = [
      String(expiry.getDate()).padStart(2, '0'),
      String(expiry.getMonth() + 1).padStart(2, '0'),
      expiry.getFullYear(),
    ].join('/')

    const { data: client } = await supabase
      .from('clients')
      .select('first_name, last_name')
      .eq('id', tie.client_id)
      .eq('owner_id', tie.owner_id)
      .maybeSingle()

    if (!client) {
      skipped++
      continue
    }

    const taskTitle = `TIE renewal — ${client.first_name} ${client.last_name}`

    const { data: existingTask, error: existingTaskError } = await supabase
      .from('tasks')
      .select('id')
      .eq('owner_id', tie.owner_id)
      .eq('client_id', tie.client_id)
      .eq('case_id', tie.case_id)
      .eq('title', taskTitle)
      .eq('due_date', renewalDueDate)
      .limit(1)

    if (existingTaskError) {
      console.error(
        'Could not check existing TIE task:',
        existingTaskError
      )
      failed++
      continue
    }

    let taskId: string | null =
      existingTask && existingTask.length > 0
        ? existingTask[0].id
        : null

    if (!taskId) {
      const { data: insertedTask, error: insertError } = await supabase
        .from('tasks')
        .insert({
          owner_id: tie.owner_id,
          client_id: tie.client_id,
          case_id: tie.case_id,
          title: taskTitle,
          description: `Renew TIE before expiry on ${formattedExpiry}.`,
          status: 'pending',
          priority: 'high',
          due_date: renewalDueDate,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Could not create TIE renewal task:', insertError)
        failed++
        continue
      }

      taskId = insertedTask.id
      created++
    } else {
      skipped++
    }

    // Check whether this TIE already has a Google Calendar event.
    const { data: existingCalendarEvent, error: calendarLookupError } =
      await supabase
        .from('google_calendar_events')
        .select('id, google_event_id')
        .eq('document_id', tie.id)
        .eq('event_type', 'tie_renewal')
        .maybeSingle()

    if (calendarLookupError) {
      console.error(
        'Could not check existing Google Calendar event:',
        calendarLookupError
      )
      calendarFailed++
      continue
    }

    if (existingCalendarEvent) {
      const googleAuth = await getGoogleAccessToken(
        supabase,
        tie.owner_id
      )

      if (!googleAuth) {
        console.log(
          `Could not verify existing Google Calendar event for owner ${tie.owner_id}; leaving existing record untouched.`
        )
        calendarSkipped++
        continue
      }

      const checkResponse = await fetch(
        `${GOOGLE_CALENDAR_API}/${encodeURIComponent(existingCalendarEvent.google_event_id)}`,
        {
          headers: {
            Authorization: `${googleAuth.tokenType} ${googleAuth.accessToken}`,
          },
        }
      )

      if (checkResponse.ok) {
        // The Google Calendar event still exists.
        calendarSkipped++
        continue
      }

      if (checkResponse.status === 404) {
        // The event was deleted from Google Calendar.
        // Remove the stale Supabase record so the event can be recreated below.
        const { error: deleteCalendarRecordError } = await supabase
          .from('google_calendar_events')
          .delete()
          .eq('id', existingCalendarEvent.id)

        if (deleteCalendarRecordError) {
          console.error(
            'Could not remove stale Google Calendar event record:',
            deleteCalendarRecordError
          )
          calendarFailed++
          continue
        }

        console.log(
          `Google Calendar event ${existingCalendarEvent.google_event_id} no longer exists; recreating it.`
        )
      } else {
        const checkData = await checkResponse.text()

        console.error(
          `Could not verify Google Calendar event ${existingCalendarEvent.google_event_id}. HTTP ${checkResponse.status}:`,
          checkData
        )

        calendarFailed++
        continue
      }
    }

    const googleAuth = await getGoogleAccessToken(
      supabase,
      tie.owner_id
    )

    if (!googleAuth) {
      console.log(
        `No Google Calendar connection for owner ${tie.owner_id}; skipping calendar event.`
      )
      calendarSkipped++
      continue
    }

    const eventResponse = await fetch(GOOGLE_CALENDAR_API, {
      method: 'POST',
      headers: {
        Authorization: `${googleAuth.tokenType} ${googleAuth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: taskTitle,
        description:
          `TIE renewal reminder for ${client.first_name} ${client.last_name}. ` +
          `Current TIE expiry date: ${formattedExpiry}.`,
        start: {
          date: renewalDueDate,
          timeZone: 'Europe/Madrid',
        },
        end: {
          date: (() => {
            const nextDay = new Date(`${renewalDueDate}T00:00:00`)
            nextDay.setDate(nextDay.getDate() + 1)
            return [
              nextDay.getFullYear(),
              String(nextDay.getMonth() + 1).padStart(2, '0'),
              String(nextDay.getDate()).padStart(2, '0'),
            ].join('-')
          })(),
          timeZone: 'Europe/Madrid',
        },
      }),
    })

    const eventData = await eventResponse.json()

    if (!eventResponse.ok || !eventData.id) {
      console.error(
        'Could not create Google Calendar event:',
        eventData
      )
      calendarFailed++
      continue
    }

    const { error: calendarInsertError } = await supabase
      .from('google_calendar_events')
      .insert({
        owner_id: tie.owner_id,
        client_id: tie.client_id,
        case_id: tie.case_id,
        document_id: tie.id,
        task_id: taskId,
        google_event_id: eventData.id,
        event_type: 'tie_renewal',
        event_date: renewalDueDate,
        updated_at: new Date().toISOString(),
      })

    if (calendarInsertError) {
      console.error(
        'Google event was created but could not be recorded in Supabase:',
        calendarInsertError
      )
      calendarFailed++
      continue
    }

    calendarCreated++
  }

  return NextResponse.json({
    success: true,
    processed: tieDocuments?.length ?? 0,
    created,
    skipped,
    failed,
    calendarCreated,
    calendarSkipped,
    calendarFailed,
  })
}
