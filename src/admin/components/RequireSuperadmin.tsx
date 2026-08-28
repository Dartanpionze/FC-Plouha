import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isSuperadmin } from '@/lib/adminPermissions'

type RequireSuperadminProps = {
  children: ReactNode
}

export default function RequireSuperadmin({
  children,
}: RequireSuperadminProps) {
  const location = useLocation()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkAccess = async () => {
      try {
        const result = await isSuperadmin()
        if (!cancelled) setAllowed(result)
      } catch (error) {
        console.error(error)
        if (!cancelled) setAllowed(false)
      }
    }

    setAllowed(null)
    checkAccess()

    return () => {
      cancelled = true
    }
  }, [])

  if (allowed === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-4 text-slate-400">
        Vérification des droits...
      </div>
    )
  }

  if (!allowed) {
    return (
      <Navigate
        to="/admin"
        replace
        state={{ deniedPath: location.pathname }}
      />
    )
  }

  return <>{children}</>
}
