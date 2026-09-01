import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  normalizeSiteVisibility,
  type PublicSectionKey,
} from '@/lib/siteVisibility'

type Props = {
  section: PublicSectionKey
  children: ReactNode
}

export default function PublicSectionRoute({ section, children }: Props) {
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true

    const checkVisibility = async () => {
      const { data, error } = await supabase
        .from('club_settings')
        .select('site_visibility')
        .limit(1)
        .single()

      if (!active) return

      if (error) {
        console.error(error)
        // En cas de problème de lecture, on ne casse pas le site public.
        setAllowed(true)
        return
      }

      const visibility = normalizeSiteVisibility(data?.site_visibility)
      setAllowed(visibility[section])
    }

    void checkVisibility()

    return () => {
      active = false
    }
  }, [section])

  if (allowed === null) {
    return (
      <div className="min-h-[45vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--club-navy)]" size={30} />
      </div>
    )
  }

  if (!allowed) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
