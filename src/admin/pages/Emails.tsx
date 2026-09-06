import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Download,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAdminAccess } from '@/admin/hooks/useAdminAccess'

type EmailThread = {
  id: string
  subject: string
  contact_email: string
  contact_name: string | null
  registration_id: number | null
  last_message_at: string
  unread_count: number
  archived: boolean
}

type EmailMessage = {
  id: string
  thread_id: string
  direction: 'inbound' | 'outbound'
  from_email: string
  to_email: string
  subject: string
  body_text: string | null
  status: string
  read_at: string | null
  sent_at: string | null
  received_at: string | null
  created_at: string
}

type ImapAddress = {
  name: string
  email: string
}

type ImapMessageSummary = {
  uid: number
  subject: string
  from: ImapAddress
  date: string
  messageId: string | null
  inReplyTo: string | null
  flags: string[]
  seen: boolean
  size: number
}

type ImapAttachment = {
  filename: string
  contentType: string
  size: number
}

type ImapMessageDetail = ImapMessageSummary & {
  to: ImapAddress[]
  cc: ImapAddress[]
  text: string
  attachments: ImapAttachment[]
}

type MailboxFilter = 'inbox' | 'unread' | 'sent' | 'archived'

type ComposerState = {
  open: boolean
  threadId: string
  registrationId: number | null
  to: string
  contactName: string
  subject: string
  body: string
}

const emptyComposer: ComposerState = {
  open: false,
  threadId: '',
  registrationId: null,
  to: '',
  contactName: '',
  subject: '',
  body: '',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '0 o'
  if (value < 1024) return `${value} o`
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} Ko`
  return `${(value / (1024 * 1024)).toFixed(1)} Mo`
}

function normalizeReplySubject(subject: string) {
  return /^re\s*:/i.test(subject) ? subject : `Re: ${subject}`
}

function displayAddress(address: ImapAddress) {
  return address.name || address.email || 'Expéditeur inconnu'
}

export default function Emails() {
  const { can } = useAdminAccess()
  const canCreate = can('emails', 'create')
  const canUpdate = can('emails', 'update')
  const canDelete = can('emails', 'delete')

  const [searchParams, setSearchParams] = useSearchParams()

  const [threads, setThreads] = useState<EmailThread[]>([])
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [sentThreadIds, setSentThreadIds] = useState<Set<string>>(new Set())
  const [selectedThreadId, setSelectedThreadId] = useState('')

  const [imapMessages, setImapMessages] = useState<ImapMessageSummary[]>([])
  const [selectedImapUid, setSelectedImapUid] = useState<number | null>(null)
  const [selectedImapMessage, setSelectedImapMessage] =
    useState<ImapMessageDetail | null>(null)
  const [imapTotal, setImapTotal] = useState(0)
  const [imapUnread, setImapUnread] = useState(0)

  const [filter, setFilter] = useState<MailboxFilter>('inbox')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingInbox, setLoadingInbox] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingImapMessage, setLoadingImapMessage] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [composer, setComposer] = useState<ComposerState>(emptyComposer)
  const [sending, setSending] = useState(false)
  const [imapTesting, setImapTesting] = useState(false)
  const [imapActionLoading, setImapActionLoading] = useState(false)
  const [attachmentLoadingIndex, setAttachmentLoadingIndex] = useState<number | null>(null)

  const getAccessToken = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session?.access_token) {
      throw new Error('SESSION_EXPIRED')
    }

    return session.access_token
  }

  const loadThreads = async (preferredThreadId?: string) => {
    setLoading(true)

    const [threadsResult, sentResult] = await Promise.all([
      supabase
        .from('email_threads')
        .select(
          'id, subject, contact_email, contact_name, registration_id, last_message_at, unread_count, archived',
        )
        .order('last_message_at', { ascending: false }),
      supabase
        .from('email_messages')
        .select('thread_id')
        .eq('direction', 'outbound'),
    ])

    if (threadsResult.error) {
      console.error(threadsResult.error)
      setErrorMessage(
        "Impossible de charger l'historique CMS des e-mails envoyés.",
      )
      setLoading(false)
      return
    }

    if (sentResult.error) {
      console.error(sentResult.error)
    }

    const loaded = (threadsResult.data ?? []) as EmailThread[]
    const sentIds = new Set(
      (sentResult.data ?? []).map((row: { thread_id: string }) => row.thread_id),
    )

    setThreads(loaded)
    setSentThreadIds(sentIds)

    const nextSelected =
      preferredThreadId && loaded.some((thread) => thread.id === preferredThreadId)
        ? preferredThreadId
        : selectedThreadId &&
            loaded.some((thread) => thread.id === selectedThreadId)
          ? selectedThreadId
          : loaded[0]?.id ?? ''

    setSelectedThreadId(nextSelected)
    setLoading(false)
  }

  const loadMessages = async (threadId: string) => {
    if (!threadId) {
      setMessages([])
      return
    }

    setLoadingMessages(true)

    const { data, error } = await supabase
      .from('email_messages')
      .select(
        'id, thread_id, direction, from_email, to_email, subject, body_text, status, read_at, sent_at, received_at, created_at',
      )
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setErrorMessage('Impossible de charger cette conversation.')
      setLoadingMessages(false)
      return
    }

    setMessages((data ?? []) as EmailMessage[])
    setLoadingMessages(false)
  }

  const loadImapInbox = async (preferredUid?: number) => {
    setLoadingInbox(true)
    setErrorMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/admin-imap-inbox', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        setErrorMessage(
          result?.error || 'Impossible de charger la boîte de réception OVH.',
        )
        return
      }

      const loaded = (result.messages ?? []) as ImapMessageSummary[]
      setImapMessages(loaded)
      setImapTotal(Number(result.total ?? loaded.length))
      setImapUnread(Number(result.unread ?? 0))

      const nextUid =
        preferredUid && loaded.some((message) => message.uid === preferredUid)
          ? preferredUid
          : selectedImapUid &&
              loaded.some((message) => message.uid === selectedImapUid)
            ? selectedImapUid
            : loaded[0]?.uid ?? null

      setSelectedImapUid(nextUid)

      if (!nextUid) {
        setSelectedImapMessage(null)
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage(
        error?.message === 'SESSION_EXPIRED'
          ? 'Ta session administrateur a expiré. Reconnecte-toi.'
          : 'Impossible de charger la boîte de réception OVH.',
      )
    } finally {
      setLoadingInbox(false)
    }
  }

  const loadImapMessage = async (uid: number) => {
    setLoadingImapMessage(true)
    setErrorMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch(`/api/admin-imap-inbox?uid=${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        setSelectedImapMessage(null)
        setErrorMessage(
          result?.error || "Impossible d'ouvrir cet e-mail OVH.",
        )
        return
      }

      setSelectedImapMessage(result.message as ImapMessageDetail)
    } catch (error: any) {
      console.error(error)
      setSelectedImapMessage(null)
      setErrorMessage(
        error?.message === 'SESSION_EXPIRED'
          ? 'Ta session administrateur a expiré. Reconnecte-toi.'
          : "Impossible d'ouvrir cet e-mail OVH.",
      )
    } finally {
      setLoadingImapMessage(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadThreads(), loadImapInbox()])
  }, [])

  useEffect(() => {
    if (filter === 'sent' || filter === 'archived') {
      void loadMessages(selectedThreadId)
    }
  }, [filter, selectedThreadId])

  useEffect(() => {
    if ((filter === 'inbox' || filter === 'unread') && selectedImapUid) {
      void loadImapMessage(selectedImapUid)
    }
  }, [filter, selectedImapUid])

  useEffect(() => {
    if (searchParams.get('compose') !== '1' || !canCreate) return

    const registrationParam = Number(searchParams.get('registration'))

    setComposer({
      open: true,
      threadId: '',
      registrationId:
        Number.isInteger(registrationParam) && registrationParam > 0
          ? registrationParam
          : null,
      to: searchParams.get('to') || '',
      contactName: searchParams.get('name') || '',
      subject: searchParams.get('subject') || '',
      body: searchParams.get('body') || '',
    })

    setSearchParams({}, { replace: true })
  }, [canCreate, searchParams, setSearchParams])

  const filteredImapMessages = useMemo(() => {
    const query = search.trim().toLowerCase()

    return imapMessages.filter((message) => {
      if (filter === 'unread' && message.seen) return false

      if (!query) return true

      return [
        message.subject,
        message.from.name,
        message.from.email,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [filter, imapMessages, search])

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase()

    return threads.filter((thread) => {
      if (filter === 'archived' && !thread.archived) return false
      if (filter === 'sent' && (thread.archived || !sentThreadIds.has(thread.id))) {
        return false
      }

      if (!query) return true

      return [
        thread.subject,
        thread.contact_name,
        thread.contact_email,
        thread.registration_id ? String(thread.registration_id) : null,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    })
  }, [filter, search, sentThreadIds, threads])

  const selectedThread =
    threads.find((thread) => thread.id === selectedThreadId) ?? null

  const filters: Array<{
    key: MailboxFilter
    label: string
    icon: typeof Inbox
  }> = [
    { key: 'inbox', label: 'Boîte de réception', icon: Inbox },
    { key: 'unread', label: 'Non lus', icon: MailOpen },
    { key: 'sent', label: 'Envoyés', icon: Send },
    { key: 'archived', label: 'Archivés CMS', icon: Archive },
  ]

  const usingImap = filter === 'inbox' || filter === 'unread'

  const toggleArchive = async () => {
    if (!canUpdate || !selectedThread) return

    const nextArchived = !selectedThread.archived
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await supabase
      .from('email_threads')
      .update({
        archived: nextArchived,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedThread.id)

    if (error) {
      console.error(error)
      setErrorMessage(
        nextArchived
          ? "Impossible d'archiver cette conversation."
          : "Impossible de restaurer cette conversation.",
      )
      return
    }

    setThreads((current) =>
      current.map((thread) =>
        thread.id === selectedThread.id
          ? { ...thread, archived: nextArchived }
          : thread,
      ),
    )

    setSuccessMessage(
      nextArchived
        ? 'Conversation archivée.'
        : 'Conversation restaurée dans les envoyés du CMS.',
    )
  }

  const deleteThread = async () => {
    if (!canDelete || !selectedThread) return

    const confirmed = window.confirm(
      `Supprimer définitivement la conversation « ${selectedThread.subject} » du CMS ?\n\nTous les messages enregistrés dans Supabase pour ce fil seront supprimés. Cette action ne touche pas à la boîte OVH.`,
    )

    if (!confirmed) return

    setErrorMessage('')
    setSuccessMessage('')

    const deletedId = selectedThread.id

    const { error } = await supabase
      .from('email_threads')
      .delete()
      .eq('id', deletedId)

    if (error) {
      console.error(error)
      setErrorMessage('Impossible de supprimer cette conversation.')
      return
    }

    const remaining = threads.filter((thread) => thread.id !== deletedId)
    setThreads(remaining)
    setMessages([])
    setSelectedThreadId(remaining[0]?.id ?? '')
    setSuccessMessage('Conversation supprimée définitivement du CMS.')
  }

  const runImapAction = async (
    action: 'mark_read' | 'mark_unread' | 'trash',
  ) => {
    if (!selectedImapMessage || imapActionLoading) return

    if (action === 'trash' && !canDelete) return
    if (action !== 'trash' && !canUpdate) return

    if (
      action === 'trash' &&
      !window.confirm(
        `Déplacer « ${selectedImapMessage.subject} » dans la corbeille OVH ?`,
      )
    ) {
      return
    }

    setImapActionLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch('/api/admin-imap-action', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          uid: selectedImapMessage.uid,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        setErrorMessage(
          result?.error || "Impossible d'appliquer cette action à l'e-mail.",
        )
        return
      }

      setSuccessMessage(result.message || 'Action effectuée.')

      if (action === 'trash') {
        setSelectedImapMessage(null)
        setSelectedImapUid(null)
        await loadImapInbox()
        return
      }

      const nextSeen = action === 'mark_read'

      setSelectedImapMessage((current) =>
        current ? { ...current, seen: nextSeen } : current,
      )

      setImapMessages((current) =>
        current.map((message) =>
          message.uid === selectedImapMessage.uid
            ? { ...message, seen: nextSeen }
            : message,
        ),
      )

      setImapUnread((current) =>
        action === 'mark_read'
          ? Math.max(0, current - (selectedImapMessage.seen ? 0 : 1))
          : current + (selectedImapMessage.seen ? 1 : 0),
      )
    } catch (error: any) {
      console.error(error)
      setErrorMessage(
        error?.message === 'SESSION_EXPIRED'
          ? 'Ta session administrateur a expiré. Reconnecte-toi.'
          : "Une erreur est survenue pendant l'action IMAP.",
      )
    } finally {
      setImapActionLoading(false)
    }
  }

  const downloadAttachment = async (index: number, filename: string) => {
    if (!selectedImapMessage || attachmentLoadingIndex !== null) return

    setAttachmentLoadingIndex(index)
    setErrorMessage('')

    try {
      const token = await getAccessToken()
      const response = await fetch(
        `/api/admin-imap-attachment?uid=${selectedImapMessage.uid}&index=${index}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (!response.ok) {
        const result = await response.json().catch(() => null)
        setErrorMessage(
          result?.error || 'Impossible de télécharger cette pièce jointe.',
        )
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `piece-jointe-${index + 1}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error(error)
      setErrorMessage(
        error?.message === 'SESSION_EXPIRED'
          ? 'Ta session administrateur a expiré. Reconnecte-toi.'
          : 'Impossible de télécharger cette pièce jointe.',
      )
    } finally {
      setAttachmentLoadingIndex(null)
    }
  }

  const openNewMessage = () => {
    if (!canCreate) return
    setSuccessMessage('')
    setErrorMessage('')
    setComposer({
      ...emptyComposer,
      open: true,
    })
  }

  const openCmsReply = () => {
    if (!canCreate || !selectedThread) return

    setSuccessMessage('')
    setErrorMessage('')
    setComposer({
      open: true,
      threadId: selectedThread.id,
      registrationId: selectedThread.registration_id,
      to: selectedThread.contact_email,
      contactName: selectedThread.contact_name || '',
      subject: normalizeReplySubject(selectedThread.subject),
      body: '',
    })
  }

  const openImapReply = () => {
    if (!canCreate || !selectedImapMessage?.from.email) return

    setSuccessMessage('')
    setErrorMessage('')
    setComposer({
      open: true,
      threadId: '',
      registrationId: null,
      to: selectedImapMessage.from.email,
      contactName: selectedImapMessage.from.name || '',
      subject: normalizeReplySubject(selectedImapMessage.subject),
      body: '',
    })
  }

  const closeComposer = () => {
    if (sending) return
    setComposer(emptyComposer)
  }

  const testImapConnection = async () => {
    if (imapTesting) return

    setImapTesting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = await getAccessToken()

      const response = await fetch('/api/admin-imap-test', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        setErrorMessage(
          result?.error || 'Impossible de tester la connexion IMAP OVH.',
        )
        return
      }

      setSuccessMessage(
        `Connexion IMAP OVH réussie ✅ ${Number(result?.inbox?.messages ?? 0)} message(s), ${Number(result?.inbox?.unread ?? 0)} non lu(s), ${Array.isArray(result?.folders) ? result.folders.length : 0} dossier(s) détecté(s).`,
      )
    } catch (error: any) {
      console.error(error)
      setErrorMessage(
        error?.message === 'SESSION_EXPIRED'
          ? 'Ta session administrateur a expiré. Reconnecte-toi.'
          : 'Une erreur est survenue pendant le test IMAP OVH.',
      )
    } finally {
      setImapTesting(false)
    }
  }

  const refreshCurrentView = async () => {
    setSuccessMessage('')
    setErrorMessage('')

    if (usingImap) {
      await loadImapInbox(selectedImapUid ?? undefined)
      return
    }

    await loadThreads(selectedThreadId || undefined)
    if (selectedThreadId) {
      await loadMessages(selectedThreadId)
    }
  }

  const sendEmail = async () => {
    if (!canCreate || sending) return

    const to = composer.to.trim()
    const subject = composer.subject.trim()
    const body = composer.body.trim()

    if (!to) {
      setErrorMessage('Indique une adresse e-mail destinataire.')
      return
    }

    if (!subject) {
      setErrorMessage("Indique l'objet de l'e-mail.")
      return
    }

    if (!body) {
      setErrorMessage('Le message est vide.')
      return
    }

    setSending(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const token = await getAccessToken()

      const response = await fetch('/api/admin-send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thread_id: composer.threadId || null,
          registration_id: composer.registrationId,
          to,
          contact_name: composer.contactName.trim() || null,
          subject,
          body,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok || !result?.success) {
        setErrorMessage(
          result?.error || "Impossible d'envoyer l'e-mail pour le moment.",
        )
        return
      }

      setComposer(emptyComposer)

      setSuccessMessage(
        result.storage_warning ||
          'E-mail envoyé avec succès depuis contact@fcplouha.fr.',
      )

      await loadThreads(result.thread_id || composer.threadId || undefined)

      if (result.thread_id) {
        setSelectedThreadId(result.thread_id)
      }
    } catch (error: any) {
      console.error(error)
      setErrorMessage(
        error?.message === 'SESSION_EXPIRED'
          ? 'Ta session administrateur a expiré. Reconnecte-toi.'
          : "Une erreur est survenue pendant l'envoi.",
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--club-yellow)]">
            Communication
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">E-mails</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            La réception lit maintenant directement la boîte OVH
            contact@fcplouha.fr. L'envoi continue de passer par Resend.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void testImapConnection()}
            disabled={imapTesting}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-100 hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {imapTesting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <ShieldCheck size={17} />
            )}
            {imapTesting ? 'Test IMAP…' : 'Tester IMAP OVH'}
          </button>

          <button
            type="button"
            onClick={() => void refreshCurrentView()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            <RefreshCw size={17} />
            Actualiser
          </button>

          <button
            type="button"
            onClick={openNewMessage}
            disabled={!canCreate}
            title={
              canCreate
                ? 'Écrire un nouvel e-mail'
                : "Vous n'avez pas le droit d'envoyer des e-mails."
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 text-sm font-black text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={17} />
            Nouveau message
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <p className="text-sm font-bold text-emerald-200">
          Réception OVH connectée en lecture seule
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Les e-mails de la boîte de réception OVH sont affichés directement
          dans le CMS. Tu peux maintenant gérer le statut lu/non lu, déplacer
          un message dans la corbeille OVH et télécharger ses pièces jointes.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 lg:grid-cols-[220px_360px_minmax(0,1fr)]">
        <aside className="border-b border-white/10 p-3 lg:border-b-0 lg:border-r">
          <div className="space-y-1">
            {filters.map((item) => {
              const Icon = item.icon
              const active = filter === item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon
                    size={18}
                    className={active ? 'text-[var(--club-yellow)]' : ''}
                  />
                  <span className="flex-1">{item.label}</span>

                  {item.key === 'inbox' && imapTotal > 0 && (
                    <span className="text-xs font-bold text-slate-500">
                      {imapTotal}
                    </span>
                  )}

                  {item.key === 'unread' && imapUnread > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                      {imapUnread > 99 ? '99+' : imapUnread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </aside>

        <section className="border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3">
              <Search size={17} className="text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un e-mail..."
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="max-h-[560px] overflow-y-auto">
            {usingImap ? (
              loadingInbox ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Lecture de la boîte OVH...
                </div>
              ) : filteredImapMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <Inbox size={32} className="mx-auto text-slate-700" />
                  <p className="mt-3 font-bold text-slate-300">
                    Aucun e-mail dans ce dossier
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Les messages reçus par contact@fcplouha.fr apparaîtront ici.
                  </p>
                </div>
              ) : (
                filteredImapMessages.map((message) => (
                  <button
                    key={message.uid}
                    type="button"
                    onClick={() => setSelectedImapUid(message.uid)}
                    className={`w-full border-b border-white/5 p-4 text-left transition ${
                      selectedImapUid === message.uid
                        ? 'bg-white/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2.5 w-2.5 rounded-full ${
                          message.seen
                            ? 'bg-slate-700'
                            : 'bg-[var(--club-yellow)]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${
                            message.seen
                              ? 'font-semibold text-slate-300'
                              : 'font-black text-white'
                          }`}
                        >
                          {displayAddress(message.from)}
                        </p>
                        <p
                          className={`mt-1 truncate text-sm ${
                            message.seen ? 'text-slate-400' : 'font-bold text-white'
                          }`}
                        >
                          {message.subject}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-slate-600">
                          <span>{formatDate(message.date)}</span>
                          <span>{formatBytes(message.size)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )
            ) : loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <Loader2 size={18} className="animate-spin" />
                Chargement...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <Mail size={32} className="mx-auto text-slate-700" />
                <p className="mt-3 font-bold text-slate-300">
                  Aucun message ici
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full border-b border-white/5 p-4 text-left transition ${
                    selectedThreadId === thread.id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {thread.contact_name || thread.contact_email}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-300">
                      {thread.subject}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {formatDate(thread.last_message_at)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0">
          {usingImap ? (
            !selectedImapUid ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <Inbox size={44} className="text-slate-700" />
                <h2 className="mt-4 text-xl font-black text-white">
                  Boîte de réception OVH
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Sélectionne un e-mail pour lire son contenu directement dans
                  le CMS.
                </p>
              </div>
            ) : loadingImapMessage ? (
              <div className="flex h-full min-h-[420px] items-center justify-center gap-2 p-8 text-sm text-slate-500">
                <Loader2 size={20} className="animate-spin" />
                Ouverture de l'e-mail OVH...
              </div>
            ) : !selectedImapMessage ? (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
                <Mail size={44} className="text-slate-700" />
                <p className="mt-4 text-sm text-slate-500">
                  Impossible d'afficher ce message.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <header className="border-b border-white/10 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-black text-white">
                        {selectedImapMessage.subject}
                      </h2>
                      <p className="mt-2 text-sm text-slate-400">
                        De :{' '}
                        <span className="font-semibold text-slate-200">
                          {displayAddress(selectedImapMessage.from)}
                        </span>
                        {selectedImapMessage.from.name &&
                          selectedImapMessage.from.email && (
                            <> &lt;{selectedImapMessage.from.email}&gt;</>
                          )}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatDate(selectedImapMessage.date)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          void runImapAction(
                            selectedImapMessage.seen
                              ? 'mark_unread'
                              : 'mark_read',
                          )
                        }
                        disabled={!canUpdate || imapActionLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {imapActionLoading ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : selectedImapMessage.seen ? (
                          <Mail size={15} />
                        ) : (
                          <MailOpen size={15} />
                        )}
                        {selectedImapMessage.seen
                          ? 'Marquer non lu'
                          : 'Marquer lu'}
                      </button>

                      <button
                        type="button"
                        onClick={() => void runImapAction('trash')}
                        disabled={!canDelete || imapActionLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        Corbeille
                      </button>
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto p-5">
                  <article className="max-w-4xl">
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-slate-200">
                      {selectedImapMessage.text}
                    </pre>

                    {selectedImapMessage.attachments.length > 0 && (
                      <div className="mt-8 border-t border-white/10 pt-5">
                        <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Pièces jointes
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {selectedImapMessage.attachments.map(
                            (attachment, index) => (
                              <div
                                key={`${attachment.filename}-${index}`}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 p-3"
                              >
                                <Paperclip
                                  size={18}
                                  className="shrink-0 text-[var(--club-yellow)]"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-bold text-white">
                                    {attachment.filename}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {attachment.contentType} ·{' '}
                                    {formatBytes(attachment.size)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void downloadAttachment(
                                      index,
                                      attachment.filename,
                                    )
                                  }
                                  disabled={attachmentLoadingIndex !== null}
                                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {attachmentLoadingIndex === index ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : (
                                    <Download size={15} />
                                  )}
                                  Télécharger
                                </button>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                </div>

                <footer className="border-t border-white/10 p-4">
                  <button
                    type="button"
                    onClick={openImapReply}
                    disabled={!canCreate || !selectedImapMessage.from.email}
                    className="w-full rounded-xl bg-[var(--club-yellow)] px-4 py-3 text-sm font-black text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Répondre
                  </button>
                </footer>
              </div>
            )
          ) : !selectedThread ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <Send size={44} className="text-slate-700" />
              <h2 className="mt-4 text-xl font-black text-white">
                Historique des envois
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Sélectionne une conversation envoyée depuis le CMS.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <header className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-black text-white">
                      {selectedThread.subject}
                    </h2>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {selectedThread.contact_name
                        ? `${selectedThread.contact_name} · `
                        : ''}
                      {selectedThread.contact_email}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleArchive()}
                      disabled={!canUpdate}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {selectedThread.archived ? (
                        <ArchiveRestore size={16} />
                      ) : (
                        <Archive size={16} />
                      )}
                      {selectedThread.archived ? 'Restaurer' : 'Archiver'}
                    </button>

                    <button
                      type="button"
                      onClick={() => void deleteThread()}
                      disabled={!canDelete}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      Supprimer
                    </button>
                  </div>
                </div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {loadingMessages ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 size={18} className="animate-spin" />
                    Chargement de la conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Aucun message enregistré dans cette conversation.
                  </p>
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-2xl rounded-2xl border p-4 ${
                        message.direction === 'outbound'
                          ? 'ml-auto border-[var(--club-yellow)]/20 bg-[var(--club-yellow)]/5'
                          : 'border-white/10 bg-slate-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {message.direction === 'outbound'
                            ? 'FC Plouha'
                            : message.from_email}
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatDate(
                            message.sent_at ||
                              message.received_at ||
                              message.created_at,
                          )}
                        </p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                        {message.body_text || '(Message sans contenu texte)'}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <footer className="border-t border-white/10 p-4">
                <button
                  type="button"
                  onClick={openCmsReply}
                  disabled={!canCreate}
                  className="w-full rounded-xl bg-[var(--club-yellow)] px-4 py-3 text-sm font-black text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Répondre
                </button>
              </footer>
            </div>
          )}
        </section>
      </div>

      {composer.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--club-yellow)]">
                  FC Plouha
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  {composer.to ? 'Message' : 'Nouveau message'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeComposer}
                disabled={sending}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    De
                  </label>
                  <input
                    value="FC Plouha <contact@fcplouha.fr>"
                    disabled
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Destinataire
                  </label>
                  <input
                    type="email"
                    value={composer.to}
                    onChange={(event) =>
                      setComposer((current) => ({
                        ...current,
                        to: event.target.value,
                      }))
                    }
                    disabled={Boolean(composer.threadId) || sending}
                    placeholder="adresse@exemple.fr"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-[var(--club-yellow)]/40 disabled:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Objet
                </label>
                <input
                  value={composer.subject}
                  onChange={(event) =>
                    setComposer((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  disabled={sending}
                  maxLength={200}
                  placeholder="Objet du message"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-[var(--club-yellow)]/40"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Message
                </label>
                <textarea
                  value={composer.body}
                  onChange={(event) =>
                    setComposer((current) => ({
                      ...current,
                      body: event.target.value,
                    }))
                  }
                  disabled={sending}
                  rows={14}
                  maxLength={20000}
                  placeholder="Écris ton message..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-white outline-none focus:border-[var(--club-yellow)]/40"
                />
              </div>

              <p className="text-xs text-slate-500">
                L'envoi continue de passer par Resend. La boîte OVH reste la
                boîte de réception réelle de contact@fcplouha.fr.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeComposer}
                disabled={sending}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/5 disabled:opacity-40"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => void sendEmail()}
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--club-yellow)] px-5 py-3 text-sm font-black text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
                {sending ? 'Envoi...' : "Envoyer l'e-mail"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
