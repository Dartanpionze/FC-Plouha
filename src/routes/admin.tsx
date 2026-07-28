import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

function Admin() {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [news, setNews] = useState<any[]>([])

  useEffect(() => {
    fetchNews()
  }, [])


  const fetchNews = async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    setNews(data || [])
  }


  const publishNews = async () => {
    let imageUrl = ''

    if (image) {
      const fileName = `${Date.now()}-${image.name}`

      const { error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(fileName, image)

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur lors de l'envoi de l'image")
        return
      }

      const { data } = supabase.storage
        .from('news-images')
        .getPublicUrl(fileName)

      imageUrl = data.publicUrl
    }


    const { error } = await supabase
      .from('news')
      .insert([
        {
          title,
          excerpt,
          content,
          image_url: imageUrl,
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
    setImage(null)
    setPreview('')

    fetchNews()
  }


  const deleteNews = async (id: number) => {
    const confirmDelete = window.confirm(
      "Supprimer cette actualité ?"
    )

    if (!confirmDelete) return


    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)


    if (error) {
      console.error(error)
      setMessage("Erreur lors de la suppression")
      return
    }


    setMessage("Actualité supprimée")

    fetchNews()
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


          <div className="mt-12">

            <h2 className="text-2xl font-bold mb-6">
              Actualités publiées
            </h2>


            <div className="space-y-4">

              {news.map((item) => (

                <div
                  key={item.id}
                  className="bg-gray-50 rounded-xl p-4 flex items-center justify-between gap-4"
                >

                  <div className="flex items-center gap-4">

                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}


                    <div>

                      <h3 className="font-bold">
                        {item.title}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </p>

                    </div>

                  </div>


                  <button
                    onClick={() => deleteNews(item.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    Supprimer
                  </button>


                </div>

              ))}

            </div>

          </div>


        </div>


      </div>
    </div>
  )
}

export default Admin
