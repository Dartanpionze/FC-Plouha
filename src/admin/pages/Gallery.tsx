import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { removeStorageFile, removeStorageFiles } from '@/lib/storage'
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react'

type Album = {
  id: number
  created_at: string
  name: string
  description: string | null
  cover_url: string | null
  active: boolean
}

type Photo = {
  id: number
  created_at: string
  album_id: number
  image_url: string
  caption: string | null
  active: boolean
}

export default function Gallery() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])

  const [selectedAlbum, setSelectedAlbum] = useState<number | null>(null)

  const [albumName, setAlbumName] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')

  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [caption, setCaption] = useState('')

  const [showAlbumForm, setShowAlbumForm] = useState(false)
  const [showPhotoForm, setShowPhotoForm] = useState(false)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAlbums()
  }, [])

  useEffect(() => {
    if (selectedAlbum) {
      fetchPhotos(selectedAlbum)
    } else {
      setPhotos([])
    }
  }, [selectedAlbum])

  const fetchAlbums = async () => {
    const { data, error } = await supabase
      .from('gallery_albums')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage('Impossible de récupérer les albums.')
      return
    }

    setAlbums(data || [])

    if (!selectedAlbum && data?.length) {
      setSelectedAlbum(data[0].id)
    }
  }

  const fetchPhotos = async (albumId: number) => {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .eq('album_id', albumId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage('Impossible de récupérer les photos.')
      return
    }

    setPhotos(data || [])
  }

  const resetAlbumForm = () => {
    setAlbumName('')
    setAlbumDescription('')
    setShowAlbumForm(false)
  }

  const resetPhotoForm = () => {
    setPhotoFiles([])
    setPhotoPreviews([])
    setCaption('')
    setShowPhotoForm(false)
  }

  const createAlbum = async () => {
    if (!albumName.trim()) {
      setMessage("Le nom de l'album est obligatoire.")
      return
    }

    setLoading(true)
    setMessage('')

    const { data, error } = await supabase
      .from('gallery_albums')
      .insert([
        {
          name: albumName,
          description: albumDescription || null,
          active: true,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la création de l'album.")
      setLoading(false)
      return
    }

    await fetchAlbums()

    if (data) {
      setSelectedAlbum(data.id)
    }

    resetAlbumForm()

    setMessage('Album créé avec succès.')
    setLoading(false)
  }

  const uploadPhotos = async () => {
    if (!selectedAlbum) {
      setMessage('Sélectionnez un album.')
      return
    }

    if (!photoFiles.length) {
      setMessage('Sélectionnez au moins une photo.')
      return
    }

    setLoading(true)
    setMessage('')

    const uploadedPhotos: {
      album_id: number
      image_url: string
      caption: string | null
      active: boolean
    }[] = []

    for (const file of photoFiles) {
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}-${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(fileName, file)

      if (uploadError) {
        console.error(uploadError)

        await removeStorageFiles(
          'gallery-images',
          uploadedPhotos.map(
            (photo) => photo.image_url,
          ),
        )

        setMessage(
          `Erreur lors de l'envoi de ${file.name}.`,
        )
        setLoading(false)
        return
      }

      const { data } = supabase.storage
        .from('gallery-images')
        .getPublicUrl(fileName)

      uploadedPhotos.push({
        album_id: selectedAlbum,
        image_url: data.publicUrl,
        caption: caption || null,
        active: true,
      })
    }

    const { error } = await supabase
      .from('gallery_photos')
      .insert(uploadedPhotos)

    if (error) {
      console.error(error)

      await removeStorageFiles(
        'gallery-images',
        uploadedPhotos.map(
          (photo) => photo.image_url,
        ),
      )

      setMessage("Erreur lors de l'enregistrement des photos.")
      setLoading(false)
      return
    }

    await fetchPhotos(selectedAlbum)
    await fetchAlbums()

    const uploadedCount = uploadedPhotos.length

    resetPhotoForm()

    setMessage(
      `${uploadedCount} photo${
        uploadedCount > 1 ? 's' : ''
      } ajoutée${uploadedCount > 1 ? 's' : ''}.`,
    )

    setLoading(false)
  }

  const deletePhoto = async (photo: Photo) => {
    const confirmDelete = window.confirm(
      'Supprimer définitivement cette photo ?',
    )

    if (!confirmDelete) return

    const { error } = await supabase
      .from('gallery_photos')
      .delete()
      .eq('id', photo.id)

    if (error) {
      console.error(error)
      setMessage('Erreur lors de la suppression.')
      return
    }

    await removeStorageFile(
      'gallery-images',
      photo.image_url,
    )

    setMessage('Photo supprimée.')

    if (selectedAlbum) {
      fetchPhotos(selectedAlbum)
    }
  }

  const togglePhoto = async (photo: Photo) => {
    const { error } = await supabase
      .from('gallery_photos')
      .update({
        active: !photo.active,
      })
      .eq('id', photo.id)

    if (error) {
      console.error(error)
      setMessage("Impossible de modifier l'état de la photo.")
      return
    }

    if (selectedAlbum) {
      fetchPhotos(selectedAlbum)
    }
  }

  const deleteAlbum = async (album: Album) => {
    const confirmDelete = window.confirm(
      `Supprimer l'album "${album.name}" et toutes ses photos ?`,
    )

    if (!confirmDelete) return

    const { data: albumPhotos, error: photosError } =
      await supabase
        .from('gallery_photos')
        .select('image_url')
        .eq('album_id', album.id)

    if (photosError) {
      console.error(photosError)
      setMessage(
        "Impossible de récupérer les photos de l'album.",
      )
      return
    }

    const { error } = await supabase
      .from('gallery_albums')
      .delete()
      .eq('id', album.id)

    if (error) {
      console.error(error)
      setMessage("Erreur lors de la suppression de l'album.")
      return
    }

    await removeStorageFiles(
      'gallery-images',
      (albumPhotos || []).map(
        (photo) => photo.image_url,
      ),
    )

    setMessage('Album supprimé.')

    if (selectedAlbum === album.id) {
      setSelectedAlbum(null)
    }

    fetchAlbums()
  }

  const selectedAlbumData = albums.find(
    (album) => album.id === selectedAlbum,
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <div>
          <p className="text-sm text-slate-400 mb-1">
            Gestion du club
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Galerie
          </h1>

          <p className="mt-2 text-slate-400">
            Organisez les photos du FC Plouha.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={() => setShowAlbumForm(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-semibold transition"
          >
            <FolderOpen size={18} />
            Nouvel album
          </button>

          {selectedAlbum && (
            <button
              onClick={() => setShowPhotoForm(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--club-yellow)] text-slate-950 font-bold hover:opacity-90 transition"
            >
              <Plus size={18} />
              Ajouter des photos
            </button>
          )}

        </div>

      </div>

      {/* MESSAGE */}
      {message && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {/* CREATION ALBUM */}
      {showAlbumForm && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-xl font-bold">
              Nouvel album
            </h2>

            <button
              onClick={resetAlbumForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X size={18} />
            </button>

          </div>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Nom de l'album
              </label>

              <input
                type="text"
                placeholder="Ex : Reprise 2026/2027"
                value={albumName}
                onChange={(e) =>
                  setAlbumName(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Description
              </label>

              <textarea
                rows={3}
                placeholder="Présentation de l'album..."
                value={albumDescription}
                onChange={(e) =>
                  setAlbumDescription(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">

              <button
                onClick={createAlbum}
                disabled={loading}
                className="flex-1 rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3 font-bold disabled:opacity-50"
              >
                {loading
                  ? 'Création...'
                  : "Créer l'album"}
              </button>

              <button
                onClick={resetAlbumForm}
                className="px-6 rounded-xl bg-white/5 hover:bg-white/10 font-semibold"
              >
                Annuler
              </button>

            </div>

          </div>
        </div>
      )}

      {/* AJOUT PHOTOS */}
      {showPhotoForm && (
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="flex items-center justify-between mb-6">

            <div>
              <h2 className="text-xl font-bold">
                Ajouter des photos
              </h2>

              <p className="text-sm text-slate-500 mt-1">
                Album : {selectedAlbumData?.name}
              </p>
            </div>

            <button
              onClick={resetPhotoForm}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X size={18} />
            </button>

          </div>

          <div className="space-y-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                Photos
              </label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(
                    e.target.files || [],
                  )

                  setPhotoFiles(files)

                  setPhotoPreviews(
                    files.map((file) =>
                      URL.createObjectURL(file),
                    ),
                  )
                }}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
              />
            </div>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                {photoPreviews.map((preview, index) => (
                  <img
                    key={index}
                    src={preview}
                    alt=""
                    className="w-full h-32 object-cover rounded-xl"
                  />
                ))}

              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2">
                Légende
              </label>

              <input
                type="text"
                placeholder="Ex : Reprise des entraînements"
                value={caption}
                onChange={(e) =>
                  setCaption(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 outline-none focus:border-white/30"
              />

              <p className="text-xs text-slate-500 mt-2">
                Cette légende sera appliquée à toutes les photos sélectionnées.
              </p>
            </div>

            <button
              onClick={uploadPhotos}
              disabled={loading}
              className="w-full rounded-xl bg-[var(--club-yellow)] text-slate-950 py-3.5 font-bold disabled:opacity-50"
            >
              {loading
                ? 'Envoi des photos...'
                : `Ajouter ${
                    photoFiles.length || ''
                  } photo${
                    photoFiles.length > 1 ? 's' : ''
                  }`}
            </button>

          </div>
        </div>
      )}

      {/* ALBUMS */}
      <div className="mb-8">

        <h2 className="text-xl font-bold mb-4">
          Albums
        </h2>

        {albums.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-slate-500">
            Aucun album créé.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() =>
                  setSelectedAlbum(album.id)
                }
                className={`cursor-pointer rounded-2xl border p-5 transition ${
                  selectedAlbum === album.id
                    ? 'border-[var(--club-yellow)] bg-[var(--club-yellow)]/5'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >

                <div className="flex items-start justify-between gap-3">

                  <FolderOpen
                    size={22}
                    className={
                      selectedAlbum === album.id
                        ? 'text-[var(--club-yellow)]'
                        : 'text-slate-500'
                    }
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteAlbum(album)
                    }}
                    className="text-slate-600 hover:text-red-400 transition"
                  >
                    <Trash2 size={17} />
                  </button>

                </div>

                <h3 className="font-bold mt-4">
                  {album.name}
                </h3>

                {album.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                    {album.description}
                  </p>
                )}

              </div>
            ))}

          </div>
        )}

      </div>

      {/* PHOTOS */}
      {selectedAlbum && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">

          <div className="p-5 border-b border-white/10">

            <h2 className="font-semibold">
              {selectedAlbumData?.name}
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {photos.length} photo
              {photos.length > 1 ? 's' : ''}
            </p>

          </div>

          {photos.length === 0 ? (
            <div className="p-12 text-center">

              <ImageIcon
                size={40}
                className="mx-auto text-slate-600 mb-3"
              />

              <p className="text-slate-500">
                Aucune photo dans cet album.
              </p>

            </div>
          ) : (
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className={`group rounded-2xl overflow-hidden border border-white/10 bg-slate-950 ${
                    !photo.active ? 'opacity-50' : ''
                  }`}
                >

                  <div className="relative">

                    <img
                      src={photo.image_url}
                      alt={photo.caption || ''}
                      className="w-full h-52 object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition">

                      <div className="flex justify-end gap-2">

                        <button
                          onClick={() =>
                            togglePhoto(photo)
                          }
                          className="w-9 h-9 rounded-lg bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                        >
                          {photo.active ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            deletePhoto(photo)
                          }
                          className="w-9 h-9 rounded-lg bg-red-500/70 text-white flex items-center justify-center hover:bg-red-500"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </div>

                  </div>

                  {photo.caption && (
                    <div className="p-3">
                      <p className="text-sm text-slate-400">
                        {photo.caption}
                      </p>
                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

        </div>
      )}

    </div>
  )
}
