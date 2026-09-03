import { ChangeEvent, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileArchive,
  FileCheck2,
  FileJson,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { unzipSync, zipSync } from 'fflate'
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

const restoreOrder = [
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

const RESTORE_CONFIRMATION = 'RESTAURER'

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

type AnalysedBackup = {
  fileName: string
  payload: BackupPayload
  currentCounts: Record<BackupTable, number | null>
  totalBackupRows: number
}

type MediaArchiveEntry = {
  archivePath: string
  bucket: MediaBucket
  storagePath: string
  bytes: Uint8Array
}

type AnalysedMediaArchive = {
  fileName: string
  entries: MediaArchiveEntry[]
  sizeBytes: number
  byBucket: Record<MediaBucket, number>
}

function formatDateForFilename(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}`
}

function formatBackupDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function isMediaBucket(value: string): value is MediaBucket {
  return mediaBuckets.includes(value as MediaBucket)
}

function getContentType(path: string) {
  const extension = path.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'avif':
      return 'image/avif'
    default:
      return 'application/octet-stream'
  }
}

function validateBackupPayload(value: unknown): BackupPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Le fichier JSON ne contient pas une sauvegarde valide.')
  }

  const candidate = value as Partial<BackupPayload>

  if (candidate.format !== 'fc-plouha-cms-backup') {
    throw new Error('Ce fichier ne correspond pas au format de sauvegarde FC Plouha.')
  }

  if (candidate.version !== 1) {
    throw new Error(`Version de sauvegarde non prise en charge : ${String(candidate.version ?? 'inconnue')}.`)
  }

  if (!candidate.tables || typeof candidate.tables !== 'object') {
    throw new Error('La section « tables » est absente de la sauvegarde.')
  }

  for (const table of backupTables) {
    const rows = (candidate.tables as Record<string, unknown>)[table]
    if (!Array.isArray(rows)) {
      throw new Error(`La table « ${table} » est absente ou invalide dans la sauvegarde.`)
    }
  }

  const tables = candidate.tables as Record<BackupTable, unknown[]>
  const summary = {} as Record<BackupTable, number>

  for (const table of backupTables) {
    summary[table] = tables[table].length
  }

  return {
    format: 'fc-plouha-cms-backup',
    version: 1,
    created_at: typeof candidate.created_at === 'string' ? candidate.created_at : '',
    source: typeof candidate.source === 'string' ? candidate.source : '',
    tables,
    summary,
    notes: Array.isArray(candidate.notes) ? candidate.notes.filter((note): note is string => typeof note === 'string') : [],
  }
}

function chunkRows<T>(rows: T[], size = 100): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size))
  }
  return chunks
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

  const [analysedBackup, setAnalysedBackup] = useState<AnalysedBackup | null>(null)
  const [selectedTables, setSelectedTables] = useState<BackupTable[]>([])
  const [restoreConfirmation, setRestoreConfirmation] = useState('')
  const [restoringData, setRestoringData] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState('')

  const [analysedMedia, setAnalysedMedia] = useState<AnalysedMediaArchive | null>(null)
  const [overwriteMedia, setOverwriteMedia] = useState(false)
  const [restoringMedia, setRestoringMedia] = useState(false)
  const [mediaRestoreConfirmation, setMediaRestoreConfirmation] = useState('')
  const [mediaRestoreProgress, setMediaRestoreProgress] = useState('')

  const tableCount = useMemo(() => backupTables.length, [])
  const busy = exporting || exportingMedia || restoringData || restoringMedia

  const createBackup = async () => {
    if (busy) return

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
    if (busy) return

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

  const analyseBackupFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return

    setError('')
    setSuccess('')
    setRestoreProgress('Analyse de la sauvegarde...')
    setAnalysedBackup(null)
    setSelectedTables([])
    setRestoreConfirmation('')

    try {
      const parsed = JSON.parse(await file.text()) as unknown
      const payload = validateBackupPayload(parsed)
      const currentCounts = {} as Record<BackupTable, number | null>

      for (const table of backupTables) {
        const { count, error: countError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        currentCounts[table] = countError ? null : (count ?? 0)
      }

      const tablesWithData = backupTables.filter((table) => payload.tables[table].length > 0)
      const totalBackupRows = tablesWithData.reduce((total, table) => total + payload.tables[table].length, 0)

      setAnalysedBackup({
        fileName: file.name,
        payload,
        currentCounts,
        totalBackupRows,
      })
      setSelectedTables([...tablesWithData])
      setRestoreProgress('')
    } catch (caughtError) {
      console.error(caughtError)
      setRestoreProgress('')
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible d’analyser cette sauvegarde.')
    }
  }

  const toggleTable = (table: BackupTable) => {
    setSelectedTables((current) =>
      current.includes(table)
        ? current.filter((item) => item !== table)
        : [...current, table],
    )
  }

  const restoreData = async () => {
    if (!analysedBackup || busy || restoreConfirmation !== RESTORE_CONFIRMATION || selectedTables.length === 0) return

    setRestoringData(true)
    setError('')
    setSuccess('')
    setRestoreProgress('Préparation de la restauration...')

    try {
      let restoredRows = 0
      const orderedTables = restoreOrder.filter((table) => selectedTables.includes(table))

      for (const table of orderedTables) {
        const rows = analysedBackup.payload.tables[table]
        if (rows.length === 0) continue

        setRestoreProgress(`Restauration de ${table} (${rows.length} ligne${rows.length > 1 ? 's' : ''})...`)

        for (const chunk of chunkRows(rows)) {
          const { error: restoreError } = await supabase.from(table).upsert(chunk)

          if (restoreError) {
            throw new Error(`Restauration interrompue sur « ${table} » : ${restoreError.message}`)
          }

          restoredRows += chunk.length
        }
      }

      setRestoreProgress('')
      setRestoreConfirmation('')
      setSuccess(`Restauration des données terminée : ${restoredRows} ligne${restoredRows > 1 ? 's' : ''} insérée${restoredRows > 1 ? 's' : ''} ou mise${restoredRows > 1 ? 's' : ''} à jour. Aucune donnée supplémentaire n’a été supprimée.`)
    } catch (caughtError) {
      console.error(caughtError)
      setRestoreProgress('')
      setError(caughtError instanceof Error ? caughtError.message : 'Une erreur est survenue pendant la restauration des données.')
    } finally {
      setRestoringData(false)
    }
  }

  const analyseMediaFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || busy) return

    setError('')
    setSuccess('')
    setMediaRestoreProgress('Analyse de l’archive ZIP...')
    setAnalysedMedia(null)
    setMediaRestoreConfirmation('')

    try {
      const archive = unzipSync(new Uint8Array(await file.arrayBuffer())) as Record<string, Uint8Array>
      const entries: MediaArchiveEntry[] = []
      const byBucket = Object.fromEntries(mediaBuckets.map((bucket) => [bucket, 0])) as Record<MediaBucket, number>
      let sizeBytes = 0

      for (const [archivePath, bytes] of Object.entries(archive)) {
        if (archivePath.endsWith('/')) continue

        const [bucketName, ...pathParts] = archivePath.split('/')
        const storagePath = pathParts.join('/')

        if (!isMediaBucket(bucketName) || !storagePath) {
          throw new Error(`L’archive contient un chemin non reconnu : « ${archivePath} ».`)
        }

        entries.push({
          archivePath,
          bucket: bucketName,
          storagePath,
          bytes,
        })
        byBucket[bucketName] += 1
        sizeBytes += bytes.byteLength
      }

      if (entries.length === 0) {
        throw new Error('Cette archive ne contient aucun média restaurable.')
      }

      setAnalysedMedia({
        fileName: file.name,
        entries,
        sizeBytes,
        byBucket,
      })
      setMediaRestoreProgress('')
    } catch (caughtError) {
      console.error(caughtError)
      setMediaRestoreProgress('')
      setError(caughtError instanceof Error ? caughtError.message : 'Impossible d’analyser cette archive média.')
    }
  }

  const restoreMedia = async () => {
    if (!analysedMedia || busy || mediaRestoreConfirmation !== RESTORE_CONFIRMATION) return

    setRestoringMedia(true)
    setError('')
    setSuccess('')
    setMediaRestoreProgress('Préparation de la restauration des médias...')

    try {
      let restored = 0
      let skipped = 0

      for (let index = 0; index < analysedMedia.entries.length; index += 1) {
        const entry = analysedMedia.entries[index]
        setMediaRestoreProgress(`Restauration ${index + 1}/${analysedMedia.entries.length} : ${entry.archivePath}`)

        const { error: uploadError } = await supabase.storage
          .from(entry.bucket)
          .upload(entry.storagePath, entry.bytes, {
            cacheControl: '3600',
            contentType: getContentType(entry.storagePath),
            upsert: overwriteMedia,
          })

        if (uploadError) {
          const normalizedMessage = uploadError.message.toLowerCase()
          const alreadyExists = normalizedMessage.includes('already exists') || normalizedMessage.includes('duplicate') || normalizedMessage.includes('resource already exists')

          if (!overwriteMedia && alreadyExists) {
            skipped += 1
            continue
          }

          throw new Error(`Restauration interrompue sur « ${entry.archivePath} » : ${uploadError.message}`)
        }

        restored += 1
      }

      setMediaRestoreProgress('')
      setMediaRestoreConfirmation('')
      setSuccess(`Restauration des médias terminée : ${restored} fichier${restored > 1 ? 's' : ''} restauré${restored > 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} fichier${skipped > 1 ? 's' : ''} déjà présent${skipped > 1 ? 's' : ''} ignoré${skipped > 1 ? 's' : ''}` : ''}.`)
    } catch (caughtError) {
      console.error(caughtError)
      setMediaRestoreProgress('')
      setError(caughtError instanceof Error ? caughtError.message : 'Une erreur est survenue pendant la restauration des médias.')
    } finally {
      setRestoringMedia(false)
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
            <p className="mt-1 text-sm text-slate-400">Sauvegarde et restauration contrôlée du CMS FC Plouha.</p>
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
            <div className="font-bold">Opération interrompue</div>
            <div className="mt-1 text-red-100/80">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 shrink-0" size={19} />
          <div>
            <div className="font-bold">Opération terminée</div>
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

          <button type="button" onClick={createBackup} disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--club-yellow)] px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
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

          <button type="button" onClick={createMediaBackup} disabled={busy} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--club-yellow)] bg-[var(--club-yellow)]/10 px-5 py-3 text-sm font-black text-[var(--club-yellow)] transition hover:bg-[var(--club-yellow)]/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            {exportingMedia ? <><Loader2 className="animate-spin" size={19} />Création du ZIP...</> : <><Download size={19} />Télécharger les médias</>}
          </button>
        </section>
      </div>

      <div className="border-t border-white/10 pt-2" />

      <section className="rounded-3xl border border-sky-400/20 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
              <RotateCcw size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">3. Restaurer les données</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Charge une sauvegarde JSON, vérifie son contenu, choisis les tables à restaurer puis confirme manuellement. La restauration est non destructive : elle insère les lignes absentes et met à jour celles qui ont le même identifiant, sans supprimer les données supplémentaires présentes dans la base.</p>
            </div>
          </div>

          <label className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-sky-400/30 bg-sky-400/10 px-5 py-3 text-sm font-black text-sky-200 transition hover:bg-sky-400/15 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload size={19} />
            Analyser un JSON
            <input type="file" accept="application/json,.json" className="hidden" onChange={analyseBackupFile} disabled={busy} />
          </label>
        </div>

        {restoreProgress && <div className="mt-5 rounded-2xl border border-sky-400/15 bg-sky-400/[0.06] px-4 py-3 text-sm text-sky-100">{restoreProgress}</div>}

        {analysedBackup && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Fichier</div>
                <div className="mt-2 break-all text-sm font-bold text-white">{analysedBackup.fileName}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Créée le</div>
                <div className="mt-2 text-sm font-bold text-white">{formatBackupDate(analysedBackup.payload.created_at)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Lignes sauvegardées</div>
                <div className="mt-2 text-2xl font-black text-white">{analysedBackup.totalBackupRows}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Format</div>
                <div className="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-300"><FileCheck2 size={17} />Valide · v{analysedBackup.payload.version}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-[minmax(0,1fr)_90px_90px] gap-3 bg-white/[0.04] px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 sm:grid-cols-[minmax(0,1fr)_120px_120px]">
                <div>Table</div>
                <div className="text-right">Sauvegarde</div>
                <div className="text-right">Actuel</div>
              </div>
              {backupTables.map((table) => {
                const backupCount = analysedBackup.payload.tables[table].length
                const currentCount = analysedBackup.currentCounts[table]
                const disabled = backupCount === 0
                const selected = selectedTables.includes(table)

                return (
                  <label key={table} className={`grid grid-cols-[minmax(0,1fr)_90px_90px] items-center gap-3 border-t border-white/10 px-4 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_120px_120px] ${disabled ? 'opacity-45' : 'cursor-pointer hover:bg-white/[0.025]'}`}>
                    <div className="flex min-w-0 items-center gap-3">
                      <input type="checkbox" checked={selected} disabled={disabled || busy} onChange={() => toggleTable(table)} className="h-4 w-4 shrink-0 accent-[var(--club-yellow)]" />
                      <span className="truncate font-semibold text-slate-200">{table}</span>
                    </div>
                    <div className="text-right font-black text-white">{backupCount}</div>
                    <div className="text-right font-semibold text-slate-400">{currentCount === null ? '—' : currentCount}</div>
                  </label>
                )
              })}
            </div>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={19} />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-amber-200">Confirmation obligatoire</div>
                  <p className="mt-2 text-sm leading-6 text-amber-100/70">Vérifie les tables cochées. Saisis <strong>{RESTORE_CONFIRMATION}</strong> pour autoriser la restauration. Cette opération peut modifier des données existantes ayant le même identifiant.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value.toUpperCase())} disabled={busy} placeholder={RESTORE_CONFIRMATION} className="min-h-12 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm font-bold text-white outline-none transition focus:border-[var(--club-yellow)] disabled:opacity-60" />
                    <button type="button" onClick={restoreData} disabled={busy || selectedTables.length === 0 || restoreConfirmation !== RESTORE_CONFIRMATION} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40">
                      {restoringData ? <><Loader2 className="animate-spin" size={19} />Restauration...</> : <><RotateCcw size={19} />Restaurer {selectedTables.length} table{selectedTables.length > 1 ? 's' : ''}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-violet-400/20 bg-slate-900 p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-400/10 text-violet-300">
              <ImageIcon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">4. Restaurer les médias</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Charge l’archive ZIP créée par le CMS. Les fichiers sont replacés dans leur bucket et sous leur nom d’origine. Par défaut, un fichier déjà présent n’est pas remplacé.</p>
            </div>
          </div>

          <label className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-400/10 px-5 py-3 text-sm font-black text-violet-200 transition hover:bg-violet-400/15 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload size={19} />
            Analyser un ZIP
            <input type="file" accept="application/zip,.zip" className="hidden" onChange={analyseMediaFile} disabled={busy} />
          </label>
        </div>

        {mediaRestoreProgress && <div className="mt-5 rounded-2xl border border-violet-400/15 bg-violet-400/[0.06] px-4 py-3 text-sm text-violet-100">{mediaRestoreProgress}</div>}

        {analysedMedia && (
          <div className="mt-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 xl:col-span-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Fichier</div>
                <div className="mt-2 break-all text-sm font-bold text-white">{analysedMedia.fileName}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Médias</div>
                <div className="mt-2 text-2xl font-black text-white">{analysedMedia.entries.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Taille décompressée</div>
                <div className="mt-2 text-2xl font-black text-white">{(analysedMedia.sizeBytes / (1024 * 1024)).toFixed(2)} Mo</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {mediaBuckets.map((bucket) => (
                <span key={bucket} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300">
                  {bucket} · {analysedMedia.byBucket[bucket]}
                </span>
              ))}
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <input type="checkbox" checked={overwriteMedia} onChange={(event) => setOverwriteMedia(event.target.checked)} disabled={busy} className="mt-1 h-4 w-4 shrink-0 accent-[var(--club-yellow)]" />
              <div>
                <div className="text-sm font-black text-white">Remplacer les fichiers déjà présents</div>
                <div className="mt-1 text-xs leading-5 text-slate-500">Laisse cette option décochée pour la restauration la plus sûre. Les fichiers existants seront ignorés.</div>
              </div>
            </label>

            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0 text-amber-300" size={19} />
                <div className="min-w-0 flex-1">
                  <div className="font-black text-amber-200">Confirmation obligatoire</div>
                  <p className="mt-2 text-sm leading-6 text-amber-100/70">Saisis <strong>{RESTORE_CONFIRMATION}</strong> pour lancer l’envoi de {analysedMedia.entries.length} média{analysedMedia.entries.length > 1 ? 's' : ''} vers Supabase Storage.</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <input value={mediaRestoreConfirmation} onChange={(event) => setMediaRestoreConfirmation(event.target.value.toUpperCase())} disabled={busy} placeholder={RESTORE_CONFIRMATION} className="min-h-12 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 text-sm font-bold text-white outline-none transition focus:border-[var(--club-yellow)] disabled:opacity-60" />
                    <button type="button" onClick={restoreMedia} disabled={busy || mediaRestoreConfirmation !== RESTORE_CONFIRMATION} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40">
                      {restoringMedia ? <><Loader2 className="animate-spin" size={19} />Restauration...</> : <><RotateCcw size={19} />Restaurer les médias</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <aside className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-5 sm:p-6">
        <div className="flex items-center gap-2 font-black text-amber-200"><AlertTriangle size={19} />À conserver en lieu sûr</div>
        <p className="mt-3 text-sm leading-6 text-amber-100/70">Pour une sauvegarde complète, conserve ensemble le fichier JSON et le fichier ZIP des médias. Le JSON peut contenir des données personnelles issues des inscriptions et des comptes administrateurs : ne le publie pas.</p>
        <p className="mt-4 text-sm leading-6 text-slate-400">Avant une restauration importante, crée toujours une nouvelle sauvegarde du site dans son état actuel. Le système de restauration ne supprime volontairement aucune ligne supplémentaire de la base.</p>
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
