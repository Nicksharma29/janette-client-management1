import { getTranslations } from '@/lib/i18n-server'
import NewTaskForm from './NewTaskForm'

export default async function NewTaskPage() {
  const { t } = await getTranslations()

  return <NewTaskForm t={t} />
}
