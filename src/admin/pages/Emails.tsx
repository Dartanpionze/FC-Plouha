import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Archive,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
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

function normalizeReplySubject(subject: string) {
  return /^re\s*:/i.test(subject) ? subject : `Re: ${subject}`
}

export default function Emails() {
  const { can } = useAdminAccess()
  const canCreate = can('emails', 'create')
  const canUpdate = can('emails', 'update')

  const [searchParams, setSearchParams] = useSearchParams()
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [sentThreadIds, setSentThreadIds] = useState<Set<string>>(new Set())
  const [selectedThreadId, setSelectedThreadId] = useState('')
  const [filter, setFilter] = useState<MailboxFilter>('inbox')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [composer, setComposer] = useState<ComposerState>(emptyComposer)
  const [sending, setSending] = useState(false)

  const loadThreads = async (preferredThreadId?: string) => {
    setLoading(true)
    setErrorMessage('')

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
        "Impossible de charger la messagerie. Vérifie que la phase 1 est bien installée.",
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
    setErrorMessage('')

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

    if (canUpdate) {
      const now = new Date().toISOString()

      await Promise.all([
        supabase
          .from('email_threads')
          .update({ unread_count: 0, updated_at: now })
          .eq('id', threadId)
          .gt('unread_count', 0),
        supabase
          .from('email_messages')
          .update({ read_at: now })
          .eq('thread_id', threadId)
          .eq('direction', 'inbound')
          .is('read_at', null),
      ])

      setThreads((current) =>
        current.map((thread) =>
          thread.id === threadId ? { ...thread, unread_count: 0 } : thread,
        ),
      )
    }
  }

  useEffect(() => {
    void loadThreads()
  }, [])

  useEffect(() => {
    void loadMessages(selectedThreadId)
  }, [selectedThreadId])

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

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase()

    return threads.filter((thread) => {
      if (filter === 'archived' && !thread.archived) return false
      if (filter !== 'archived' && thread.archived) return false
      if (filter === 'unread' && thread.unread_count === 0) return false
      if (filter === 'sent' && !sentThreadIds.has(thread.id)) return false

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

  const unreadTotal = threads.reduce(
    (total, thread) => total + thread.unread_count,
    0,
  )

  const filters: Array<{
    key: MailboxFilter
    label: string
    icon: typeof Inbox
  }> = [
    { key: 'inbox', label: 'Boîte de réception', icon: Inbox },
    { key: 'unread', label: 'Non lus', icon: MailOpen },
    { key: 'sent', label: 'Envoyés', icon: Send },
    { key: 'archived', label: 'Archivés', icon: Archive },
  ]

  const openNewMessage = () => {
    if (!canCreate) return
    setSuccessMessage('')
    setErrorMessage('')
    setComposer({
      ...emptyComposer,
      open: true,
    })
  }

  const openReply = () => {
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

  const closeComposer = () => {
    if (sending) return
    setComposer(emptyComposer)
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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        setErrorMessage('Ta session administrateur a expiré. Reconnecte-toi.')
        setSending(false)
        return
      }

      const response = await fetch('/api/admin-send-email', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
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
        setSending(false)
        return
      }

      setComposer(emptyComposer)

      if (result.storage_warning) {
        setSuccessMessage(result.storage_warning)
      } else {
        setSuccessMessage('E-mail envoyé avec succès depuis contact@fcplouha.fr.')
      }

      await loadThreads(result.thread_id || composer.threadId || undefined)

      if (result.thread_id) {
        setSelectedThreadId(result.thread_id)
        await loadMessages(result.thread_id)
      }
    } catch (error) {
      console.error(error)
      setErrorMessage("Une erreur est survenue pendant l'envoi.")
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
            Envoie les messages du club depuis contact@fcplouha.fr et conserve
            l'historique des échanges dans le CMS.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadThreads()}
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
          Envoi depuis le CMS activé
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Les messages partent avec FC Plouha &lt;contact@fcplouha.fr&gt;. La
          réception OVH n'est pas modifiée à cette étape.
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
                  {item.key === 'unread' && unreadTotal > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                      {unreadTotal > 99 ? '99+' : unreadTotal}
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
            {loading ? (
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
                <p className="mt-1 text-sm text-slate-500">
                  Les nouveaux envois apparaîtront automatiquement.
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
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-2.5 w-2.5 rounded-full ${
                        thread.unread_count > 0
                          ? 'bg-[var(--club-yellow)]'
                          : 'bg-slate-700'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">
                          {thread.contact_name || thread.contact_email}
                        </p>
                        {thread.unread_count > 0 && (
                          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                            {thread.unread_count}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-300">
                        {thread.subject}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatDate(thread.last_message_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0">
          {!selectedThread ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <Inbox size={44} className="text-slate-700" />
              <h2 className="mt-4 text-xl font-black text-white">
                Messagerie FC Plouha
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Écris un nouveau message ou sélectionne une conversation.
              </p>
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <header className="border-b border-white/10 p-5">
                <h2 className="text-lg font-black text-white">
                  {selectedThread.subject}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedThread.contact_name
                    ? `${selectedThread.contact_name} · `
                    : ''}
                  {selectedThread.contact_email}
                </p>
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
                  onClick={openReply}
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
                  {composer.threadId ? 'Répondre' : 'Nouveau message'}
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
                Si le destinataire répond, sa réponse arrivera pour l'instant
                dans la boîte contact@fcplouha.fr existante. L'intégration des
                réponses dans ce CMS sera la phase suivante.
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
