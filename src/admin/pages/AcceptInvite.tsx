import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, KeyRound, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function hasInviteMarker() {
  const search = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  const type = search.get('type') ?? hash.get('type')
  const hasAccessToken = Boolean(hash.get('access_token'))
  const hasCode = Boolean(search.get('code'))

  return type === 'invite' || (hasAccessToken && type === 'invite') || (hasCode && type === 'invite')
}

export default function AcceptInvite() {
  const navigate = useNavigate()
  const inviteMarker = useMemo(() => hasInviteMarker(), [])
  const [sessionReady, setSessionReady] = useState(false)
  const [hasInviteSession, setHasInviteSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const readSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      setHasInviteSession(inviteMarker && !error && Boolean(data.session))
      setSessionReady(true)
    }

    void readSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setHasInviteSession(inviteMarker && Boolean(session))
      setSessionReady(true)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [inviteMarker])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')

    if (!hasInviteSession) {
      setErrorMessage("Cette page n'a pas été ouverte depuis une invitation valide.")
      return
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.')
      return
    }

    setSaving(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMessage("Impossible d'enregistrer le mot de passe. Le lien d'invitation a peut-être expiré.")
      setSaving(false)
      return
    }

    navigate('/admin', { replace: true })
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[var(--club-navy-deep)] flex items-center justify-center px-4 text-white">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="animate-spin" size={20} />
          Vérification de l’invitation...
        </div>
      </div>
    )
  }

  if (!hasInviteSession) {
    return (
      <div className="min-h-screen bg-[var(--club-navy-deep)] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img
              src="/logo.png"
              alt="FC Plouha"
              className="w-24 h-24 object-contain mx-auto mb-5"
            />
            <h1 className="text-3xl font-bold text-white">Activation du compte</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Aucune invitation valide détectée</p>
                <p className="mt-1 text-sm">
                  Utilisez le lien reçu par e-mail pour activer votre compte CMS. Une session déjà connectée ne suffit pas à ouvrir cette page d’activation.
                </p>
              </div>
            </div>

            <Link
              to="/admin/login"
              className="mt-6 block w-full rounded-xl bg-[var(--club-yellow)] px-4 py-3.5 text-center font-bold hover:bg-yellow-400 transition"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--club-navy-deep)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="FC Plouha"
            className="w-24 h-24 object-contain mx-auto mb-5"
          />
          <h1 className="text-3xl font-bold text-white">Bienvenue dans le CMS</h1>
          <p className="text-slate-400 mt-2">
            Choisissez votre mot de passe pour terminer l’activation de votre compte.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-slate-700">
            <KeyRound size={20} className="shrink-0" />
            <p className="text-sm">Votre invitation a été validée. Il ne reste qu’à définir votre mot de passe.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block font-semibold mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
              />
              <p className="mt-1.5 text-xs text-slate-500">8 caractères minimum.</p>
            </div>

            <div>
              <label className="block font-semibold mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
                autoComplete="new-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
              />
            </div>

            {errorMessage && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--club-yellow)] hover:bg-yellow-400 transition rounded-xl py-3.5 font-bold text-lg disabled:opacity-50"
            >
              {saving ? 'Activation...' : 'Activer mon compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
