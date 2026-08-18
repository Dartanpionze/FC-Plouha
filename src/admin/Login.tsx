import { FormEvent, useState } from 'react'
import { supabase } from '@/lib/supabase'

type LoginProps = {
  onLogin: () => void
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault()

    setError('')
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

    setLoading(false)
    onLogin()
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@fcplouha.fr"
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--club-navy)]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Mot de passe
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--club-yellow)] hover:bg-yellow-400 transition rounded-xl py-3.5 font-bold text-lg disabled:opacity-50"
            >
              {loading
                ? 'Connexion...'
                : 'Se connecter'}
            </button>

          </div>

        </form>

        <p className="text-center text-slate-500 text-sm mt-6">
          FC Plouha · Administration
        </p>

      </div>

    </div>
  )
}
