import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function Admin() {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')

  const publishNews = async () => {
    const { error } = await supabase
      .from('news')
      .insert([
        {
          title,
          excerpt,
          content,
          created_at: new Date(),
        },
      ])

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la publication")
      return
    }

    setMessage("Actualité publiée !")

    setTitle('')
    setExcerpt('')
    setContent('')
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-4xl font-bold">
        Administration FC Plouha
      </h1>

      <div className="mt-10 space-y-5">

        <input
          className="w-full border rounded-lg p-3"
          placeholder="Titre de l'article"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border rounded-lg p-3"
          placeholder="Résumé"
          rows={3}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />

        <textarea
          className="w-full border rounded-lg p-3"
          placeholder="Contenu de l'article"
          rows={10}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          onClick={publishNews}
          className="bg-[var(--club-yellow)] px-6 py-3 rounded-lg font-bold"
        >
          Publier
        </button>

        {message && (
          <p className="mt-4">
            {message}
          </p>
        )}

      </div>
    </div>
  )
}

export default Admin
