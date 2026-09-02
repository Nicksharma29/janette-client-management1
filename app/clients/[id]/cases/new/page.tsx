import { getTranslations } from '@/lib/i18n-server'
import NewCaseForm from './NewCaseForm'

export default async function NewCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { t } = await getTranslations()

  return <NewCaseForm clientId={id} t={t} />
}
