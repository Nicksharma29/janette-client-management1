import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string
      caseId: string
      documentId: string
    }>
  }
) {
  const { id, caseId, documentId } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { data: document, error } = await supabase
    .from('documents')
    .select('id, file_path, mime_type, name')
    .eq('id', documentId)
    .eq('client_id', id)
    .eq('case_id', caseId)
    .eq('owner_id', user.id)
    .single()

  if (error || !document) {
    return new NextResponse('Document not found', { status: 404 })
  }

  if (!document.file_path) {
    return new NextResponse('This document has no uploaded file', {
      status: 404,
    })
  }

  const { data: signedUrl, error: signedUrlError } =
    await supabase.storage
      .from('case-documents')
      .createSignedUrl(document.file_path, 60 * 10)

  if (signedUrlError || !signedUrl?.signedUrl) {
    console.error(signedUrlError)
    return new NextResponse('Could not create document URL', {
      status: 500,
    })
  }

  return NextResponse.redirect(signedUrl.signedUrl)
}
