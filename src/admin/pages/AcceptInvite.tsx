import { FormEvent, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AcceptInvite() {
  const navigate = useNavigate()
  const [sessionReady, setSessionReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let mounted = true

    const readSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      setHasSession(Boolean(data.session))
      setSessionReady(true)
    }

    readSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setHasSession(Boolean(session))
      setSessionReady(true)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')

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
      console.error(error)
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

  if (!hasSession) {
    return <Navigate to="/admin/login" replace />
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
