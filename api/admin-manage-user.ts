import { createClient } from '@supabase/supabase-js'

type ManageAction = 'set-active' | 'delete'

function getBearerToken(req: any) {
  const header = req.headers?.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return ''
  return header.slice(7).trim()
}

function cleanUserId(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !secretKey) {
    console.error('Missing Supabase server configuration')
    return res.status(500).json({ error: 'Configuration serveur invalide.' })
  }

  const accessToken = getBearerToken(req)
  if (!accessToken) {
    return res.status(401).json({ error: 'Session administrateur requise.' })
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  try {
    const { data: authData, error: authError } =
      await adminClient.auth.getUser(accessToken)

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Session invalide ou expirée.' })
    }

    const callerId = authData.user.id

    const { data: caller, error: callerError } = await adminClient
      .from('admin_users')
      .select('role, active')
      .eq('user_id', callerId)
      .maybeSingle()

    if (
      callerError ||
      !caller ||
      caller.role !== 'superadmin' ||
      caller.active !== true
    ) {
      return res.status(403).json({ error: 'Accès réservé au Superadmin.' })
    }

    const action = req.body?.action as ManageAction
    const userId = cleanUserId(req.body?.user_id)

    if ((action !== 'set-active' && action !== 'delete') || !isUuid(userId)) {
      return res.status(400).json({ error: 'Requête invalide.' })
    }

    if (userId === callerId) {
      return res.status(400).json({
        error: 'Vous ne pouvez pas désactiver ou supprimer votre propre compte.',
      })
    }

    const { data: target, error: targetError } = await adminClient
      .from('admin_users')
      .select('user_id, role, active')
      .eq('user_id', userId)
      .maybeSingle()

    if (targetError) {
      console.error('ADMIN USER LOOKUP ERROR:', targetError)
      return res.status(500).json({ error: 'Impossible de vérifier ce compte.' })
    }

    if (!target) {
      return res.status(404).json({ error: 'Compte CMS introuvable.' })
    }

    if (target.role === 'superadmin') {
      return res.status(403).json({
        error: 'Un compte Superadmin ne peut pas être modifié ici.',
      })
    }

    if (action === 'set-active') {
      if (typeof req.body?.active !== 'boolean') {
        return res.status(400).json({ error: 'État du compte invalide.' })
      }

      const { error: updateError } = await adminClient
        .from('admin_users')
        .update({ active: req.body.active })
        .eq('user_id', userId)
        .eq('role', 'admin')

      if (updateError) {
        console.error('ADMIN USER ACTIVE UPDATE ERROR:', updateError)
        return res.status(500).json({
          error: "Impossible de modifier l'état de ce compte.",
        })
      }

      return res.status(200).json({ success: true })
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('ADMIN AUTH DELETE ERROR:', deleteError)
      return res.status(500).json({ error: 'Impossible de supprimer ce compte.' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('ADMIN MANAGE USER API ERROR:', error)
    return res.status(500).json({ error: 'Erreur serveur.' })
  }
}
