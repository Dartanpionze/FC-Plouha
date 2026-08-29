import { supabase } from '@/lib/supabase'

export type AdminRole = 'superadmin' | 'admin'

export type AdminModule =
  | 'news'
  | 'club'
  | 'teams'
  | 'players'
  | 'matches'
  | 'gallery'
  | 'partners'
  | 'registrations'
  | 'settings'

export type AdminAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'

export type AdminProfile = {
  user_id: string
  display_name: string | null
  role: AdminRole
  active: boolean
}

export type AdminPermission = {
  module: AdminModule
  can_view: boolean
  can_create: boolean
  can_update: boolean
  can_delete: boolean
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user?.id ?? null
}

export async function getCurrentAdminProfile(): Promise<AdminProfile | null> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return null
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id, display_name, role, active')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data as AdminProfile | null
}

export async function getCurrentPermissions(): Promise<AdminPermission[]> {
  const userId = await getCurrentUserId()

  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('admin_permissions')
    .select(
      'module, can_view, can_create, can_update, can_delete',
    )
    .eq('user_id', userId)
    .order('module')

  if (error) {
    throw error
  }

  return (data ?? []) as AdminPermission[]
}

export async function isSuperadmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    'is_superadmin',
  )

  if (error) {
    throw error
  }

  return data === true
}

export async function hasPermission(
  module: AdminModule,
  action: AdminAction,
): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    'has_permission',
    {
      requested_module: module,
      requested_action: action,
    },
  )

  if (error) {
    throw error
  }

  return data === true
}
