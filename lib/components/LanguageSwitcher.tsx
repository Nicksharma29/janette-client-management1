'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { defaultLocale, type Locale } from '@/lib/i18n'

const COOKIE_NAME = 'janet-language'

export default function LanguageSwitcher() {
  const router = useRouter()
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  useEffect(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
    )

    if (match?.[1] === 'en' || match?.[1] === 'es') {
      setLocale(match[1])
    }
  }, [])

  function changeLanguage(nextLocale: Locale) {
    document.cookie = `${COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    setLocale(nextLocale)
    router.refresh()
  }

  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-center rounded-full border border-black/10 bg-white/95 p-1 shadow-sm backdrop-blur"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => changeLanguage('es')}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
          locale === 'es'
            ? 'bg-[#171717] text-white'
            : 'text-[#737373] hover:text-[#171717]'
        }`}
      >
        ES
      </button>

      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
          locale === 'en'
            ? 'bg-[#171717] text-white'
            : 'text-[#737373] hover:text-[#171717]'
        }`}
      >
        EN
      </button>
    </div>
  )
}
