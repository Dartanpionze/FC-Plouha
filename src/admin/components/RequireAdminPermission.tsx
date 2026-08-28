import { useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import {
  hasPermission,
  type AdminModule,
} from '@/lib/adminPermissions'

type RequireAdminPermissionProps = {
  module: AdminModule
  children: ReactNode
}

export default function RequireAdminPermission({
  module,
  children,
}: RequireAdminPermissionProps) {
  const location = useLocation()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const checkPermission = async () => {
      try {
        const canView = await hasPermission(module, 'view')
        if (!cancelled) setAllowed(canView)
      } catch (error) {
        console.error(error)
        if (!cancelled) setAllowed(false)
      }
    }

    setAllowed(null)
    checkPermission()

    return () => {
      cancelled = true
    }
  }, [module])

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
