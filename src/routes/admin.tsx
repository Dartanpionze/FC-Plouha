import { useState } from 'react'
import { supabase } from '@/lib/supabase'

function Admin() {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')

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
    <div className="min-h-screen bg-gray-100 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        <h1 className="text-4xl font-bold text-[var(--club-navy)] mb-2">
          Administration
        </h1>
        
        <p className="text-gray-600 mb-8">
          Créer une nouvelle actualité pour le site du FC Plouha.
        </p>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          <div className="space-y-6">
            
            <div>
              <label className="block font-semibold mb-2">
                Titre
              </label>
              
              <input
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Titre de l'article"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                />
            </div>
            
            <div>
              <label className="block font-semibold mb-2">
                Résumé
              </label>
              
              <textarea
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={3}
                placeholder="Petit résumé..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Image de couverture
              </label>
              
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  
                  if (file) {
                    setImage(file)
                      setPreview(URL.createObjectURL(file))
                  }
                }}
                className="w-full border rounded-xl p-3"
                />
              
              {preview && (
      <img
        src={preview}
        alt="Aperçu"
        className="mt-4 h-48 w-full object-cover rounded-xl"
        />
    )}
            </div>
            
            <div>
              <label className="block font-semibold mb-2">
                Contenu
              </label>
              
              <textarea
                className="w-full border rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                rows={12}
                placeholder="Rédigez votre article..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                />
            </div>
            
            <button
              onClick={publishNews}
              className="w-full bg-[var(--club-yellow)] hover:bg-yellow-400 transition rounded-xl py-4 font-bold text-lg"
              >
              Publier l'actualité
            </button>
            
            {message && (
      <div className="rounded-xl bg-green-100 border border-green-300 p-4 text-green-700 font-medium">
        {message}
      </div>
    )}
            
          </div>
          
        </div>
        
      </div>
    </div>
  )
}

export default Admin
