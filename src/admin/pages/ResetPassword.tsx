import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingLink, setCheckingLink] = useState(true)
  const [recoveryReady, setRecoveryReady] = useState(false)

  useEffect(() => {
    let mounted = true

    const checkRecoverySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!mounted) return

      if (session) {
        setRecoveryReady(true)
      }

      setCheckingLink(false)
    }

    void checkRecoverySession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY' || session) {
        setRecoveryReady(true)
        setCheckingLink(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (password.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }

    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        console.error(error)
        setError(
          "Impossible de modifier le mot de passe. Le lien de récupération a peut-être expiré.",
        )
        return
      }

      setSuccess('Ton mot de passe a bien été modifié.')

      await supabase.auth.signOut()

      window.setTimeout(() => {
        navigate('/admin/login', { replace: true })
      }, 1200)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--club-navy-deep)] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="FC Plouha"
            className="w-24 h-24 object-contain mx-auto mb-5"
          />

          <h1 className="text-3xl font-bold text-white">
            Nouveau mot de passe
          </h1>

          <p className="text-slate-400 mt-2">
            Administration du FC Plouha
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {checkingLink ? (
            <div className="py-8 text-center">
              <p className="font-semibold text-slate-700">
                Vérification du lien de récupération...
              </p>
            </div>
          ) : !recoveryReady ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                Ce lien de récupération est invalide ou a expiré. Demande un
                nouveau lien depuis la page de connexion.
              </div>

              <Link
                to="/admin/login"
                className="block w-full text-center bg-[var(--club-yellow)] hover:bg-yellow-400 transition rounded-xl py-3.5 font-bold"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-semibold mb-2">
                  Nouveau mot de passe
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Confirmer le mot de passe
                </label>

                <input
                  type="password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  placeholder="Saisissez-le une seconde fois"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm">
                  {success} Redirection vers la connexion...
                </div>
              )}

              <button
                type="submit"
                disabled={loading || Boolean(success)}
                className="w-full bg-[var(--club-yellow)] hover:bg-yellow-400 transition rounded-xl py-3.5 font-bold text-lg disabled:opacity-50"
              >
                {loading ? 'Modification...' : 'Changer mon mot de passe'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          FC Plouha · Administration
        </p>
      </div>
    </div>
  )
}
