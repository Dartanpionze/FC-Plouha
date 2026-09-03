import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileJson,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
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

type BackupTable = (typeof backupTables)[number]

type BackupPayload = {
  format: 'fc-plouha-cms-backup'
  version: 1
  created_at: string
  source: string
  tables: Record<BackupTable, unknown[]>
  summary: Record<BackupTable, number>
  notes: string[]
}

function formatDateForFilename(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}_${hours}-${minutes}`
}

export default function Backups() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const tableCount = useMemo(() => backupTables.length, [])

  const createBackup = async () => {
    if (exporting) return

    setExporting(true)
    setError('')
    setSuccess('')

    try {
      const tables = {} as Record<BackupTable, unknown[]>
      const summary = {} as Record<BackupTable, number>

      for (const table of backupTables) {
        const { data, error: tableError } = await supabase
          .from(table)
          .select('*')

        if (tableError) {
          throw new Error(
            `Impossible de sauvegarder la table « ${table} » : ${tableError.message}`,
          )
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
          'Les références et URL d’images présentes dans les tables sont conservées.',
          'Ce fichier peut contenir des données personnelles liées aux inscriptions et aux comptes administrateurs : conservez-le dans un emplacement privé.',
        ],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `fc-plouha-sauvegarde-${formatDateForFilename(now)}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      const totalRows = Object.values(summary).reduce(
        (total, count) => total + count,
        0,
      )
      setSuccess(
        `Sauvegarde créée avec succès : ${totalRows} enregistrement${totalRows > 1 ? 's' : ''} exporté${totalRows > 1 ? 's' : ''}.`,
      )
    } catch (caughtError) {
      console.error(caughtError)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Une erreur est survenue pendant la sauvegarde.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--club-yellow)] text-slate-950">
              <DatabaseBackup size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Sauvegardes
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Export manuel des données du CMS FC Plouha.
              </p>
            </div>
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
            <div className="mt-2 text-xs text-red-100/60">
              Aucun fichier incomplet n’a été téléchargé.
            </div>
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

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--club-yellow)]">
              <FileJson size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black">Sauvegarde complète des données</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Télécharge un fichier JSON daté contenant les données actuellement enregistrées dans les principales tables du club.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">{tableCount}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                tables exportées
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">JSON</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                format lisible
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="text-2xl font-black text-white">0</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-slate-500">
                donnée modifiée
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={createBackup}
            disabled={exporting}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--club-yellow)] px-5 py-3 text-sm font-black text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {exporting ? (
              <>
                <Loader2 className="animate-spin" size={19} />
                Création de la sauvegarde...
              </>
            ) : (
              <>
                <Download size={19} />
                Télécharger une sauvegarde
              </>
            )}
          </button>
        </section>

        <aside className="rounded-3xl border border-amber-400/15 bg-amber-400/[0.06] p-5 sm:p-6">
          <div className="flex items-center gap-2 font-black text-amber-200">
            <AlertTriangle size={19} />
            À conserver en lieu sûr
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-100/70">
            Le fichier peut contenir des coordonnées issues des inscriptions ainsi que des informations sur les comptes administrateurs. Ne le publie pas et ne l’envoie pas sur un espace public.
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Cette première version sauvegarde les données de la base. Les fichiers image eux-mêmes ne sont pas copiés dans le JSON, mais leurs références enregistrées en base restent présentes.
          </p>
        </aside>
      </div>

      <section className="rounded-3xl border border-white/10 bg-slate-900 p-5 sm:p-6">
        <h2 className="font-black">Contenu de l’export</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {backupTables.map((table) => (
            <span
              key={table}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-300"
            >
              {table}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
