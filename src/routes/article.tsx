import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

function ArticlePage() {
  const { id } = useParams()
  const [article, setArticle] = useState<any>(null)

  useEffect(() => {
    const fetchArticle = async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setArticle(data)
    }

    fetchArticle()
  }, [id])

  if (!article) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20">
        Chargement...
      </div>
    )
  }

  return (
    <article className="max-w-5xl mx-auto px-6 py-20">
      <img
        src={article.image_url}
        alt={article.title}
        className="w-full h-96 object-cover rounded-3xl"
      />

      <div className="mt-8">
        <p className="text-sm text-gray-500">
          {new Date(article.created_at).toLocaleDateString('fr-FR')}
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          {article.title}
        </h1>

        <p className="mt-6 text-lg leading-relaxed">
          {article.excerpt}
        </p>
      </div>
    </article>
  )
}

export default ArticlePage
