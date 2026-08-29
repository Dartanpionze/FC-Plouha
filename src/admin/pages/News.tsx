import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { removeStorageFile } from '@/lib/storage'
import {
  createImageFileName,
  MAX_IMAGE_SIZE_LABEL,
  validateImageFile,
} from '@/lib/uploads'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Image as ImageIcon,
} from 'lucide-react'

type NewsItem = {
  id: number
  title: string
  excerpt: string
  content: string
  image_url: string | null
  created_at: string
}

export default function News() {
  const { loading: accessLoading, can } = useAdminAccess()

  const [news, setNews] = useState<NewsItem[]>([])
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [imageValidationError, setImageValidationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const canCreate = can('news', 'create')
  const canUpdate = can('news', 'update')
  const canDelete = can('news', 'delete')

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: {
      attributes: {
        class: 'cms-editor-content',
      },
    },
    onUpdate({ editor }) {
      setContent(editor.getHTML())
    },
  })

  useEffect(() => {
    void fetchNews()
  }, [])

  const fetchNews = async () => {
    setFetching(true)

    try {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
        setMessage(
          'Impossible de récupérer les actualités. Vous pouvez réessayer.',
        )
        return false
      }

      setNews(data || [])
      return true
    } catch (fetchError) {
      console.error(fetchError)
      setMessage(
        'Impossible de récupérer les actualités. Vous pouvez réessayer.',
      )
      return false
    } finally {
      setFetching(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setExcerpt('')
    setContent('')
    setImage(null)
    setPreview('')
    setEditingId(null)
    setMessage('')
    setImageValidationError('')

    editor?.commands.setContent('')
    setShowForm(false)
  }

  const openNewForm = () => {
    if (!canCreate) {
      setMessage(
        "Vous n'avez pas l'autorisation de créer une actualité.",
      )
      return
    }

    resetForm()
    setShowForm(true)
  }

  const editNews = (item: NewsItem) => {
    if (!canUpdate) {
      setMessage(
        "Vous n'avez pas l'autorisation de modifier une actualité.",
      )
      return
    }

    setEditingId(item.id)
    setTitle(item.title)
    setExcerpt(item.excerpt || '')
    setContent(item.content || '')
    setPreview(item.image_url || '')
    setImage(null)

    editor?.commands.setContent(item.content || '')

    setMessage('')
    setImageValidationError('')
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const saveNews = async () => {
    if (editingId && !canUpdate) {
      setMessage(
        "Vous n'avez pas l'autorisation de modifier une actualité.",
      )
      return
    }

    if (!editingId && !canCreate) {
      setMessage(
        "Vous n'avez pas l'autorisation de créer une actualité.",
      )
      return
    }

    if (!title.trim()) {
      setMessage('Le titre est obligatoire.')
      return
    }

    setLoading(true)
    setMessage('')

    const previousImageUrl = editingId
      ? news.find((item) => item.id === editingId)?.image_url || null
      : null

    let imageUrl = ''

    if (image) {
      const imageError = validateImageFile(image)

      if (imageError) {
        setImageValidationError(imageError)
        setLoading(false)
        return
      }

      const fileName = createImageFileName(image)

      const { error: uploadError } = await supabase.storage
        .from('news-images')
        .upload(fileName, image)

      if (uploadError) {
        console.error(uploadError)
        setMessage("Erreur lors de l'envoi de l'image.")
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('news-images')
        .getPublicUrl(fileName)

      imageUrl = data.publicUrl
    }

    let error

    if (editingId) {
      const result = await supabase
        .from('news')
        .update({
          title,
          excerpt,
          content,
          ...(imageUrl && { image_url: imageUrl }),
        })
        .eq('id', editingId)

      error = result.error
    } else {
      const result = await supabase
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

      error = result.error
    }

    if (error) {
      console.error(error)

      if (imageUrl) {
        await removeStorageFile(
          'news-images',
          imageUrl,
        )
      }

      setMessage("Erreur lors de l'enregistrement.")
      setLoading(false)
      return
    }

    if (imageUrl && previousImageUrl) {
      await removeStorageFile(
        'news-images',
        previousImageUrl,
      )
    }

    const wasEditing = Boolean(editingId)

    resetForm()

    const refreshed = await fetchNews()

    if (refreshed) {
      setMessage(
        wasEditing
          ? 'Actualité modifiée avec succès.'
          : 'Actualité publiée avec succès.',
      )
    }

    setLoading(false)
  }

  const deleteNews = async (id: number) => {
    if (!canDelete) {
      setMessage(
        "Vous n'avez pas l'autorisation de supprimer une actualité.",
      )
      return
    }

    const confirmDelete = window.confirm(
      'Supprimer définitivement cette actualité ?',
    )

    if (!confirmDelete) return

    const item = news.find(
      (newsItem) => newsItem.id === id,
    )

    const { error } = await supabase
      .from('news')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression.')
      return
    }

    if (item?.image_url) {
      await removeStorageFile(
        'news-images',
        item.image_url,
      )
    }

    const refreshed = await fetchNews()

    if (refreshed) {
      setMessage('Actualité supprimée.')
    }
  }

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()),
  )

  if (accessLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
          Vérification des droits...
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion du contenu
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Actualités
          </h1>

          <p className="mt-2 text-slate-400">
            Créez et gérez les actualités du FC Plouha.
          </p>
        </div>

        {canCreate && (
          <button
            onClick={openNewForm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
          >
            <Plus size={19} />
            Nouvelle actualité
          </button>
        )}

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {fetching && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-400">
          Chargement des actualités...
        </div>
      )}

      {!fetching &&
        message.startsWith('Impossible de récupérer') && (
          <button
            type="button"
            onClick={() => void fetchNews()}
            className="mb-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition"
          >
            Réessayer le chargement
          </button>
        )}

      {/* FORMULAIRE */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                {editingId
                  ? "Modifier l'actualité"
                  : 'Nouvelle actualité'}
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Les modifications seront visibles sur le site public.
              </p>
            </div>

            <button
              onClick={resetForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <X size={19} />
            </button>

          </div>

          <div className="space-y-6">

            {/* TITRE */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Titre
              </label>

              <input
                type="text"
                placeholder="Titre de l'article"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
              />
            </div>

            {/* RESUME */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Résumé
              </label>

              <textarea
                rows={3}
                placeholder="Petit résumé de l'article..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30 resize-none"
              />
            </div>

            {/* IMAGE */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Image de couverture
              </label>

              <label className="flex items-center gap-3 cursor-pointer rounded-xl border border-dashed border-white/15 bg-slate-950 px-4 py-4 hover:bg-white/[0.03] transition">

                <ImageIcon
                  size={20}
                  className="text-slate-500"
                />

                <span className="text-sm text-slate-400">
                  Choisir une image
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]

                    if (file) {
                      const imageError =
                        validateImageFile(file)

                      if (imageError) {
                        setImage(null)
                        setPreview('')
                        setImageValidationError(imageError)
                        e.currentTarget.value = ''
                        return
                      }

                      setImageValidationError('')
                      setImage(file)
                      setPreview(
                        URL.createObjectURL(file),
                      )
                    }
                  }}
                />

              </label>

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG ou WebP — {MAX_IMAGE_SIZE_LABEL} maximum.
              </p>

              {imageValidationError && (
                <div
                  role="alert"
                  className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300"
                >
                  {imageValidationError}
                </div>
              )}

              {preview && (
                <img
                  src={preview}
                  alt="Aperçu"
                  className="mt-4 w-full max-h-72 object-cover rounded-xl border border-white/10"
                />
              )}

            </div>

            {/* EDITEUR */}
            <div>
              <div className="flex items-end justify-between gap-4 mb-2">
                <div>
                  <label className="block text-sm font-semibold">
                    Contenu
                  </label>
                  <p className="mt-1 text-xs text-slate-500">
                    Rédigez l’article comme dans un traitement de texte.
                  </p>
                </div>

                <span className="hidden sm:inline text-xs text-slate-600">
                  Aperçu proche du rendu public
                </span>
              </div>

              <div className="cms-editor-shell overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                <div className="cms-editor-toolbar">
                  <select
                    aria-label="Style du paragraphe"
                    value={
                      editor?.isActive('heading', { level: 2 })
                        ? 'h2'
                        : editor?.isActive('heading', { level: 3 })
                          ? 'h3'
                          : 'p'
                    }
                    onChange={(event) => {
                      const value = event.target.value

                      if (value === 'h2') {
                        editor?.chain().focus().setHeading({ level: 2 }).run()
                      } else if (value === 'h3') {
                        editor?.chain().focus().setHeading({ level: 3 }).run()
                      } else {
                        editor?.chain().focus().setParagraph().run()
                      }
                    }}
                    className="cms-editor-select"
                  >
                    <option value="p">Paragraphe</option>
                    <option value="h2">Titre 2</option>
                    <option value="h3">Titre 3</option>
                  </select>

                  <span className="cms-editor-separator" />

                  <button
                    type="button"
                    title="Gras"
                    aria-pressed={editor?.isActive('bold') || false}
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`cms-editor-button ${editor?.isActive('bold') ? 'is-active' : ''}`}
                  >
                    <strong>B</strong>
                  </button>

                  <button
                    type="button"
                    title="Italique"
                    aria-pressed={editor?.isActive('italic') || false}
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`cms-editor-button ${editor?.isActive('italic') ? 'is-active' : ''}`}
                  >
                    <em>I</em>
                  </button>

                  <button
                    type="button"
                    title="Barré"
                    aria-pressed={editor?.isActive('strike') || false}
                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                    className={`cms-editor-button ${editor?.isActive('strike') ? 'is-active' : ''}`}
                  >
                    <span className="line-through">S</span>
                  </button>

                  <span className="cms-editor-separator" />

                  <button
                    type="button"
                    title="Liste à puces"
                    aria-pressed={editor?.isActive('bulletList') || false}
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`cms-editor-button ${editor?.isActive('bulletList') ? 'is-active' : ''}`}
                  >
                    • Liste
                  </button>

                  <button
                    type="button"
                    title="Liste numérotée"
                    aria-pressed={editor?.isActive('orderedList') || false}
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={`cms-editor-button ${editor?.isActive('orderedList') ? 'is-active' : ''}`}
                  >
                    1. Liste
                  </button>

                  <button
                    type="button"
                    title="Citation"
                    aria-pressed={editor?.isActive('blockquote') || false}
                    onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                    className={`cms-editor-button ${editor?.isActive('blockquote') ? 'is-active' : ''}`}
                  >
                    “ Citation
                  </button>

                  <button
                    type="button"
                    title="Séparateur horizontal"
                    onClick={() => editor?.chain().focus().setHorizontalRule().run()}
                    className="cms-editor-button"
                  >
                    —
                  </button>

                  <span className="cms-editor-separator" />

                  <button
                    type="button"
                    title="Annuler"
                    disabled={!editor?.can().chain().focus().undo().run()}
                    onClick={() => editor?.chain().focus().undo().run()}
                    className="cms-editor-button"
                  >
                    ↶
                  </button>

                  <button
                    type="button"
                    title="Rétablir"
                    disabled={!editor?.can().chain().focus().redo().run()}
                    onClick={() => editor?.chain().focus().redo().run()}
                    className="cms-editor-button"
                  >
                    ↷
                  </button>

                  <button
                    type="button"
                    title="Effacer la mise en forme"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .clearNodes()
                        .unsetAllMarks()
                        .run()
                    }
                    className="cms-editor-button cms-editor-button-wide"
                  >
                    Effacer le format
                  </button>
                </div>

                <div className="cms-editor-workspace">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">

              <button
                onClick={saveNews}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {loading
                  ? 'Enregistrement...'
                  : editingId
                    ? "Mettre à jour l'actualité"
                    : "Publier l'actualité"}
              </button>

              <button
                onClick={resetForm}
                className="px-6 rounded-xl bg-white/5 hover:bg-white/10 py-3.5 font-semibold transition"
              >
                Annuler
              </button>

            </div>

          </div>
        </div>
      )}

      {/* LISTE */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center md:justify-between">

          <div>
            <h2 className="font-semibold">
              Articles publiés
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {news.length} article{news.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="relative w-full md:w-72">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />

            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-white/30"
            />

          </div>

        </div>

        <div className="divide-y divide-white/5">

          {filteredNews.length === 0 && (
            <div className="p-10 text-center text-slate-500">
              Aucune actualité trouvée.
            </div>
          )}

          {filteredNews.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col md:flex-row md:items-center gap-5 hover:bg-white/[0.02] transition"
            >

              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt=""
                  className="w-full md:w-28 h-20 object-cover rounded-xl shrink-0"
                />
              ) : (
                <div className="w-full md:w-28 h-20 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <ImageIcon
                    size={22}
                    className="text-slate-600"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">

                <h3 className="font-semibold truncate">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-500 mt-1">
                  {new Date(
                    item.created_at,
                  ).toLocaleDateString(
                    'fr-FR',
                  )}
                </p>

                {item.excerpt && (
                  <p className="text-sm text-slate-400 mt-2 line-clamp-2">
                    {item.excerpt}
                  </p>
                )}

              </div>

              {(canUpdate || canDelete) && (
                <div className="flex gap-2 shrink-0">

                  {canUpdate && (
                    <button
                      onClick={() =>
                        editNews(item)
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition"
                    >
                      <Pencil size={16} />
                      Modifier
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() =>
                        deleteNews(item.id)
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  )}

                </div>
              )}

            </div>
          ))}

        </div>
      </div>

    </div>
  )
}
