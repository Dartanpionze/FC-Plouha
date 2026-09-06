import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryLoading, setRecoveryLoading] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()

    setError('')
    setRecoveryMessage('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error(error)
      setError('Adresse e-mail ou mot de passe incorrect.')
      setLoading(false)
      return
    }

    navigate('/admin')
  }

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    setError('')
    setRecoveryMessage('')

    if (!normalizedEmail) {
      setError(
        'Indique ton adresse e-mail dans le champ ci-dessus avant de demander un nouveau mot de passe.',
      )
      return
    }

    setRecoveryLoading(true)

    try {
      const redirectTo = `${window.location.origin}/admin/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo,
        },
      )

      if (error) {
        console.error(error)
        setError(
          "Impossible d'envoyer l'e-mail de récupération pour le moment.",
        )
        return
      }

      setRecoveryMessage(
        "Si cette adresse correspond à un compte administrateur, un e-mail de récupération vient d'être envoyé. Consulte également les courriers indésirables.",
      )
    } finally {
      setRecoveryLoading(false)
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
            Administration
          </h1>

          <p className="text-slate-400 mt-2">
            Connectez-vous pour gérer le FC Plouha
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="space-y-5">
            <div>
              <label className="block font-semibold mb-2">
                Adresse e-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@fcplouha.fr"
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="font-semibold">
                  Mot de passe
                </label>

                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={recoveryLoading}
                  className="text-sm font-semibold text-[var(--club-navy)] hover:underline disabled:opacity-50"
                >
                  {recoveryLoading
                    ? 'Envoi...'
                    : 'Mot de passe oublié ?'}
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
                autoComplete="current-password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {recoveryMessage && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm">
                {recoveryMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || recoveryLoading}
              className="w-full bg-[var(--club-yellow)] hover:bg-yellow-400 transition rounded-xl py-3.5 font-bold text-lg disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link
            to="/"
            className="text-slate-400 hover:text-white transition"
          >
            ← Retour au site
          </Link>
        </div>

        <p className="text-center text-slate-500 text-sm mt-3">
          FC Plouha · Administration
        </p>
      </div>
    </div>
  )
}
