import { useCallback, useEffect, useState } from 'react'
import {
  getCurrentAdminProfile,
  getCurrentPermissions,
  type AdminAction,
  type AdminModule,
  type AdminPermission,
  type AdminProfile,
} from '@/lib/adminPermissions'

type AdminAccessState = {
  loading: boolean
  profile: AdminProfile | null
  permissions: AdminPermission[]
  isSuperadmin: boolean
}

export function useAdminAccess() {
  const [state, setState] = useState<AdminAccessState>({
    loading: true,
    profile: null,
    permissions: [],
    isSuperadmin: false,
  })

  useEffect(() => {
    let active = true

    const loadAccess = async () => {
      try {
        const [profile, permissions] = await Promise.all([
          getCurrentAdminProfile(),
          getCurrentPermissions(),
        ])

        if (!active) return

        setState({
          loading: false,
          profile,
          permissions,
          isSuperadmin:
            profile?.role === 'superadmin' && profile.active === true,
        })
      } catch {
        if (!active) return

        setState({
          loading: false,
          profile: null,
          permissions: [],
          isSuperadmin: false,
        })
      }
    }

    void loadAccess()

    return () => {
      active = false
    }
  }, [])

  const can = useCallback(
    (module: AdminModule, action: AdminAction) => {
      if (state.isSuperadmin) {
        return true
      }

      if (!state.profile?.active) {
        return false
      }

      const permission = state.permissions.find(
        (item) => item.module === module,
      )

      if (!permission) {
        return false
      }

      switch (action) {
        case 'view':
          return permission.can_view
        case 'create':
          return permission.can_create
        case 'update':
          return permission.can_update
        case 'delete':
          return permission.can_delete
        default:
          return false
      }
    },
    [state.isSuperadmin, state.permissions, state.profile],
  )

  return {
    loading: state.loading,
    profile: state.profile,
    permissions: state.permissions,
    isSuperadmin: state.isSuperadmin,
    can,
  }
}
