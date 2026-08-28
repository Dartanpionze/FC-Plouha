import { useEffect, useState } from 'react'
import {
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

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

function GalleryPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [photos, setPhotos] = useState<Photo[]>([])

  const [selectedAlbum, setSelectedAlbum] =
    useState<number | null>(null)

  const [lightboxPhoto, setLightboxPhoto] =
    useState<Photo | null>(null)

  useEffect(() => {
    if (!lightboxPhoto) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxPhoto(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxPhoto])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    setLoading(true)
    setError(false)

    const { data: albumsData, error: albumsError } =
      await supabase
        .from('gallery_albums')
        .select('*')
        .eq('active', true)
        .order('created_at', {
          ascending: false,
        })

    if (albumsError) {
      console.error(albumsError)
      setError(true)
      setLoading(false)
      return
    }

    const { data: photosData, error: photosError } =
      await supabase
        .from('gallery_photos')
        .select('*')
        .eq('active', true)
        .order('created_at', {
          ascending: false,
        })

    if (photosError) {
      console.error(photosError)
      setError(true)
      setLoading(false)
      return
    }

    setAlbums(albumsData || [])
    setPhotos(photosData || [])

    setLoading(false)
  }

  const visiblePhotos = selectedAlbum
    ? photos.filter(
        (photo) =>
          photo.album_id === selectedAlbum,
      )
    : photos

  const getAlbumPhotoCount = (albumId: number) => {
    return photos.filter(
      (photo) => photo.album_id === albumId,
    ).length
  }

  const getAlbumCover = (album: Album) => {
    if (album.cover_url) {
      return album.cover_url
    }

    const firstPhoto = photos.find(
      (photo) => photo.album_id === album.id,
    )

    return firstPhoto?.image_url || null
  }

  const selectedAlbumData = albums.find(
    (album) => album.id === selectedAlbum,
  )

  return (
    <div>
      <Seo
        title="Galerie"
        description="Retrouvez en images les matchs, événements et moments de vie du Football Club Plouha."
      />

      {/* HERO */}
      <section className="bg-[var(--club-navy-deep)] grain-overlay py-16 2xl:py-20">

        <div className="max-w-5xl 2xl:max-w-6xl mx-auto px-4 sm:px-6 2xl:px-8 text-center">

          <span className="font-condensed font-bold text-xs tracking-[0.3em] text-[var(--club-yellow)]">
            SOUVENIRS
          </span>

          <h1 className="mt-4 2xl:mt-5 text-4xl sm:text-6xl 2xl:text-7xl text-white">
            Galerie photo
          </h1>

          <p className="mt-5 2xl:mt-6 text-white/60 font-condensed text-lg 2xl:text-xl max-w-2xl 2xl:max-w-3xl mx-auto 2xl:leading-relaxed">
            Retrouvez les moments forts du FC Plouha,
            sur et en dehors des terrains.
          </p>

        </div>

      </section>

      <section className="max-w-7xl 2xl:max-w-[1540px] mx-auto px-4 sm:px-6 2xl:px-8 py-16 2xl:py-20">

        {/* CHARGEMENT */}
        {loading && (
          <div className="py-24 flex flex-col items-center justify-center">

            <Loader2
              size={36}
              className="animate-spin text-[var(--club-navy-deep)]/40"
            />

            <p className="mt-4 font-condensed text-[var(--club-navy-deep)]/50">
              Chargement de la galerie...
            </p>

          </div>
        )}

        {/* ERREUR */}
        {!loading && error && (
          <div className="py-24 text-center">

            <Camera
              size={42}
              className="mx-auto text-[var(--club-red)]"
            />

            <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
              Impossible de charger la galerie
            </h2>

            <p className="mt-2 text-[var(--club-navy-deep)]/60">
              Veuillez réessayer ultérieurement.
            </p>

          </div>
        )}

        {/* GALERIE VIDE */}
        {!loading &&
          !error &&
          photos.length === 0 && (
            <div className="py-24 text-center">

              <ImageIcon
                size={46}
                className="mx-auto text-[var(--club-navy-deep)]/20"
              />

              <h2 className="mt-4 text-2xl text-[var(--club-navy-deep)]">
                La galerie arrive bientôt
              </h2>

              <p className="mt-2 text-[var(--club-navy-deep)]/60">
                Les premières photos du club seront
                prochainement publiées.
              </p>

            </div>
          )}

        {!loading &&
          !error &&
          photos.length > 0 && (
            <>

              {/* ALBUMS */}
              {albums.length > 0 && (
                <div className="mb-12">

                  <div className="flex items-end justify-between gap-4 mb-6">

                    <div>

                      <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
                        NOS ALBUMS
                      </span>

                      <h2 className="mt-2 text-3xl 2xl:text-4xl text-[var(--club-navy-deep)]">
                        Parcourir la galerie
                      </h2>

                    </div>

                    {selectedAlbum && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAlbum(null)
                        }
                        className="hidden sm:block font-condensed font-semibold text-sm text-[var(--club-navy-deep)]/60 hover:text-[var(--club-red)] transition-colors"
                      >
                        Voir toutes les photos
                      </button>
                    )}

                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                    {/* TOUTES LES PHOTOS */}
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAlbum(null)
                      }
                      className={`text-left rounded-2xl overflow-hidden border transition-all ${
                        selectedAlbum === null
                          ? 'border-[var(--club-red)] shadow-lg -translate-y-1'
                          : 'border-black/10 hover:shadow-lg hover:-translate-y-1'
                      }`}
                    >

                      <div className="relative h-36 bg-[var(--club-navy-deep)]">

                        {photos[0]?.image_url && (
                          <img
                            src={
                              photos[0].image_url
                            }
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover opacity-50"
                          />
                        )}

                        <div className="absolute inset-0 bg-[var(--club-navy-deep)]/40" />

                        <div className="absolute inset-0 flex items-center justify-center">

                          <Camera
                            size={32}
                            className="text-white"
                          />

                        </div>

                      </div>

                      <div className="bg-white p-4">

                        <h3 className="font-condensed font-bold text-[var(--club-navy-deep)]">
                          Toutes les photos
                        </h3>

                        <p className="text-xs text-[var(--club-navy-deep)]/50 mt-1">
                          {photos.length} photo
                          {photos.length > 1
                            ? 's'
                            : ''}
                        </p>

                      </div>

                    </button>

                    {albums.map((album) => {

                      const cover =
                        getAlbumCover(album)

                      const photoCount =
                        getAlbumPhotoCount(
                          album.id,
                        )

                      return (
                        <button
                          key={album.id}
                          type="button"
                          onClick={() =>
                            setSelectedAlbum(
                              album.id,
                            )
                          }
                          className={`text-left rounded-2xl overflow-hidden border transition-all ${
                            selectedAlbum ===
                            album.id
                              ? 'border-[var(--club-red)] shadow-lg -translate-y-1'
                              : 'border-black/10 hover:shadow-lg hover:-translate-y-1'
                          }`}
                        >

                          <div className="h-36 bg-[var(--club-navy-deep)]/5">

                            {cover ? (
                              <img
                                src={cover}
                                alt={`Album ${album.name}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">

                                <FolderOpen
                                  size={30}
                                  className="text-[var(--club-navy-deep)]/20"
                                />

                              </div>
                            )}

                          </div>

                          <div className="bg-white p-4">

                            <h3 className="font-condensed font-bold text-[var(--club-navy-deep)] truncate">
                              {album.name}
                            </h3>

                            <p className="text-xs text-[var(--club-navy-deep)]/50 mt-1">
                              {photoCount} photo
                              {photoCount > 1
                                ? 's'
                                : ''}
                            </p>

                          </div>

                        </button>
                      )
                    })}

                  </div>

                </div>
              )}

              {/* TITRE ALBUM */}
              <div className="mb-7">

                <span className="font-condensed font-bold text-xs tracking-[0.25em] text-[var(--club-red)]">
                  PHOTOS
                </span>

                <h2 className="mt-2 text-3xl 2xl:text-4xl text-[var(--club-navy-deep)]">
                  {selectedAlbumData
                    ? selectedAlbumData.name
                    : 'Toutes les photos'}
                </h2>

                {selectedAlbumData?.description && (
                  <p className="mt-2 text-[var(--club-navy-deep)]/60 max-w-2xl">
                    {
                      selectedAlbumData.description
                    }
                  </p>
                )}

              </div>

              {/* PHOTOS */}
              {visiblePhotos.length === 0 ? (
                <div className="rounded-2xl border border-black/10 py-16 text-center">

                  <ImageIcon
                    size={38}
                    className="mx-auto text-[var(--club-navy-deep)]/20"
                  />

                  <p className="mt-3 text-[var(--club-navy-deep)]/50">
                    Aucune photo dans cet album.
                  </p>

                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

                  {visiblePhotos.map(
                    (photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() =>
                          setLightboxPhoto(
                            photo,
                          )
                        }
                        aria-label={
                          photo.caption
                            ? `Ouvrir la photo : ${photo.caption}`
                            : 'Ouvrir la photo en grand'
                        }
                        className="group relative h-52 sm:h-64 rounded-xl overflow-hidden bg-black text-left"
                      >

                        <img
                          src={photo.image_url}
                          alt={
                            photo.caption || ''
                          }
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity" />

                        {photo.caption && (
                          <div className="absolute inset-x-0 bottom-0 p-4">

                            <p className="text-white font-condensed font-semibold text-sm">
                              {
                                photo.caption
                              }
                            </p>

                          </div>
                        )}

                      </button>
                    ),
                  )}

                </div>
              )}

            </>
          )}

      </section>

      {/* LIGHTBOX */}
      {lightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de la photo"
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 sm:p-8"
          onClick={() =>
            setLightboxPhoto(null)
          }
        >

          <button
            type="button"
            onClick={() =>
              setLightboxPhoto(null)
            }
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>

          <div
            className="max-w-6xl max-h-full"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <img
              src={lightboxPhoto.image_url}
              alt={
                lightboxPhoto.caption || 'Photo du Football Club Plouha'
              }
              decoding="async"
              className="max-w-full max-h-[80vh] object-contain mx-auto"
            />

            {lightboxPhoto.caption && (
              <p className="mt-5 text-center text-white/80 font-condensed text-lg">
                {lightboxPhoto.caption}
              </p>
            )}

          </div>

        </div>
      )}

    </div>
  )
}

export default GalleryPage
