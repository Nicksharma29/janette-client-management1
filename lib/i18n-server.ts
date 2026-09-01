import { cookies } from 'next/headers'
import {
  defaultLocale,
  isLocale,
  translations,
  type Locale,
} from '@/lib/i18n'

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const value = cookieStore.get('janet-language')?.value

  return isLocale(value) ? value : defaultLocale
}

export async function getTranslations() {
  const locale = await getLocale()

  return {
    locale,
    t: translations[locale],
  }
}
