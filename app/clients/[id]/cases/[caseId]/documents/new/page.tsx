import { getTranslations } from '@/lib/i18n-server'
import NewDocumentForm from './NewDocumentForm'

export default async function NewDocumentPage() {
  const { t } = await getTranslations()

  return <NewDocumentForm t={t} />
}
