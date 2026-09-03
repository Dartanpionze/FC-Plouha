import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileArchive,
  FileJson,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { zipSync } from 'fflate'
import { supabase } from '@/lib/supabase'

const backupTables = [
  'club_settings',
  'club_history',
  'club_staff',
  'teams',
  'players',
  'matches',
  'training_slots',
  'training_exceptions',
  'news',
  'gallery_albums',
  'gallery_photos',
  'partners',
  'registration_fees',
  'registrations',
  'admin_users',
  'admin_permissions',
] as const

const mediaBuckets = [
  'news-images',
  'gallery-images',
  'team-images',
  'player-images',
  'staff-images',
  'partner-logos',
] as const

type BackupTable = (typeof backupTables)[number]
type MediaBucket = (typeof mediaBuckets)[number]

type BackupPayload = {
  format: 'fc-plouha-cms-backup'
  version: 1
  created_at: string
  source: string
  tables: Record<BackupTable, unknown[]>
  summary: Record<BackupTable, number>
  notes: string[]
}

type StorageEntry = {
  name: string
  id?: string | null
  metadata?: Record<string, unknown> | null
}

function formatDateForFilename(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function listBucketFiles(bucket: MediaBucket, folder = ''): Promise<string[]> {
  const collected: string[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      throw new Error(`Impossible de lire le bucket « ${bucket} » : ${error.message}`)
    }

    const entries = (data ?? []) as StorageEntry[]

    for (const entry of entries) {
      const path = folder ? `${folder}/${entry.name}` : entry.name
      const isFile = Boolean(entry.id) || Boolean(entry.metadata)

      if (isFile) {
        collected.push(path)
      } else {
        collected.push(...(await listBucketFiles(bucket, path)))
      }
    }

    if (entries.length < limit) break
    offset += limit
  }

  return collected
}

export default function Backups() {
  const [exporting, setExporting] = useState(false)
  const [exportingMedia, setExportingMedia] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mediaProgress, setMediaProgress] = useState('')

  const tableCount = useMemo(() => backupTables.length, [])

  const createBackup = async () => {
    if (exporting || exportingMedia) return

    setExporting(true)
    setError('')
    setSuccess('')
    setMediaProgress('')

    try {
      const tables = {} as Record<BackupTable, unknown[]>
      const summary = {} as Record<BackupTable, number>

      for (const table of backupTables) {
        const { data, error: tableError } = await supabase.from(table).select('*')

        if (tableError) {
          throw new Error(`Impossible de sauvegarder la table « ${table} » : ${tableError.message}`)
        }

        const rows = data ?? []
        tables[table] = rows
        summary[table] = rows.length
      }

      const now = new Date()
      const payload: BackupPayload = {
        format: 'fc-plouha-cms-backup',
        version: 1,
        created_at: now.toISOString(),
        source: window.location.origin,
        tables,
        summary,
        notes: [
          'Sauvegarde des données structurées du CMS FC Plouha.',
          'Les fichiers binaires du stockage Supabase (images) ne sont pas inclus dans ce JSON.',
          'Utilisez également la sauvegarde des médias disponible dans le CMS pour conserver une copie des fichiers.',
          'Les références et URL d’images présentes dans les tables sont conservées.',
          'Ce fichier peut contenir des données personnelles liées aux inscriptions et aux comptes administrateurs : conservez-le dans un emplacement privé.',
        ],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      downloadBlob(blob, `fc-plouha-sauvegarde-${formatDateForFilename(now)}.json`)

      const totalRows = Object.values(summary).reduce((total, count) => total + count, 0)
      setSuccess(`Sauvegarde des données créée : ${totalRows} enregistrement${totalRows > 1 ? 's' : ''} exporté${totalRows > 1 ? 's' : ''}.`)
    } catch (caughtError) {
      console.error(caughtError)
      setError(caughtError instanceof Error ? caughtError.message : 'Une erreur est survenue pendant la sauvegarde.')
    } finally {
      setExporting(false)
    }
  }

  const createMediaBackup = async () => {
    if (exporting || exportingMedia) return

    setExportingMedia(true)
    setError('')
    setSuccess('')
    setMediaProgress('Préparation de la sauvegarde des médias...')

    try {
      const archive: Record<string, Uint8Array> = {}
      let totalFiles = 0
      let totalBytes = 0

      for (const bucket of mediaBuckets) {
        setMediaProgress(`Analyse du stockage : ${bucket}...`)
        const paths = await listBucketFiles(bucket)

        for (let index = 0; index < paths.length; index += 1) {
          const path = paths[index]
          setMediaProgress(`Téléchargement : ${bucket} — ${index + 1}/${paths.length}`)

          const { data, error: downloadError } = await supabase.storage.from(bucket).download(path)

          if (downloadError || !data) {
            throw new Error(`Impossible de sauvegarder « ${bucket}/${path} » : ${downloadError?.message ?? 'fichier introuvable'}`)
          }

          const bytes = new Uint8Array(await data.arrayBuffer())
          archive[`${bucket}/${path}`] = bytes
          totalFiles += 1
          totalBytes += bytes.byteLength
        }
      }

      if (totalFiles === 0) {
        setMediaProgress('')
        setSuccess('Aucun média n’est actuellement présent dans les buckets du CMS.')
        return
      }

      setMediaProgress(`Création de l’archive ZIP (${totalFiles} fichier${totalFiles > 1 ? 's' : ''})...`)
      const zipped = zipSync(archive, { level: 6 })
      const now = new Date()
      const blob = new Blob([zipped], { type: 'application/zip' })
      downloadBlob(blob, `fc-plouha-medias-${formatDateForFilename(now)}.zip`)

      const sizeMo = totalBytes / (1024 * 1024)
      setSuccess(`Sauvegarde des médias créée : ${totalFiles} fichier${totalFiles > 1 ? 's' : ''}, ${sizeMo.toFixed(2)} Mo avant compression.`)
      setMediaProgress('')
    } catch (caughtError) {
      console.error(caughtError)
      setMediaProgress('')
      setError(caughtError instanceof Error ? caughtError.message : 'Une erreur est survenue pendant la sauvegarde des médias.')
    } finally {
      setExportingMedia(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--club-yellow)] text-slate-950">
            <DatabaseBackup size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Sauvegardes</h1>
            <p className="mt-1 text-sm text-slate-400">Sauvegarde manuelle des données et des médias du CMS FC Plouha.</p>
          </div>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
          <ShieldCheck size={15} />
          Superadmin uniquement
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          <div>
            <div className="font-bold">Sauvegarde interrompue</div>
            <div className="mt-1 text-red-100/80">{error}</div>
            <div className="mt-2 text-xs text-red-100/60">Aucun fichier incomplet n’a été téléchargé.</div>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
          <div>
            <div className="font-bold">Sauvegarde terminée</div>
            <div className="mt-1 text-emerald-100/80">{success}</div>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--club-yellow)]">
              <FileJson size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">1. Sauvegarde des données</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Télécharge un JSON contenant les données des principales tables du club.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">{tableCount}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">tables</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">JSON</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">format</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">0</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">donnée modifiée</div>
            </div>
          </div>

          <button type="button" onClick={createBackup} disabled={exporting || exportingMedia} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--club-yellow)] px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {exporting ? <><Loader2 className="animate-spin" size={19} />Création du JSON...</> : <><Download size={19} />Télécharger les données</>}
          </button>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--club-yellow)]">
              <FileArchive size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">2. Sauvegarde des médias</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Télécharge les images Supabase du CMS dans une archive ZIP en conservant leur bucket et leur chemin.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">{mediaBuckets.length}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">buckets vérifiés</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 text-2xl font-black text-white"><ImageIcon size={22} /> ZIP</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">images originales</div>
            </div>
          </div>

          {mediaProgress && <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-400/[0.06] px-4 py-3 text-sm text-sky-100">{mediaProgress}</div>}

          <button type="button" onClick={createMediaBackup} disabled={exporting || exportingMedia} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--club-yellow)] bg-[var(--club-yellow)]/10 px-5 py-3 text-sm font-black text-[var(--club-yellow)] transition hover:bg-[var(--club-yellow)]/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {exportingMedia ? <><Loader2 className="animate-spin" size={19} />Création du ZIP...</> : <><Download size={19} />Télécharger les médias</>}
          </button>
        </section>
      </div>

      <aside className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-5 sm:p-6">
        <div className="flex items-center gap-2 font-black text-amber-200"><AlertTriangle size={19} />À conserver en lieu sûr</div>
        <p className="mt-3 text-sm leading-6 text-amber-100/70">Pour une sauvegarde complète, conserve ensemble le fichier JSON et le fichier ZIP des médias. Le JSON peut contenir des données personnelles issues des inscriptions et des comptes administrateurs : ne le publie pas.</p>
        <p className="mt-4 text-sm leading-6 text-slate-400">L’archive média conserve les dossiers par bucket afin de faciliter une future restauration : actualités, galerie, équipes, joueurs, dirigeants et partenaires.</p>
      </aside>

      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
        <h2 className="font-black">Contenu de la sauvegarde</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {backupTables.map((table) => <span key={table} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">{table}</span>)}
        </div>
        <div className="mt-5 border-t border-white/10 pt-5">
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Buckets médias</div>
          <div className="flex flex-wrap gap-2">
            {mediaBuckets.map((bucket) => <span key={bucket} className="rounded-full border border-[var(--club-yellow)]/15 bg-[var(--club-yellow)]/[0.05] px-3 py-1.5 text-xs font-semibold text-[var(--club-yellow)]">{bucket}</span>)}
          </div>
        </div>
      </section>
    </div>
  )
}
