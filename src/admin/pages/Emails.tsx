import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function Emails() {
  const [threads, setThreads] = useState<EmailThread[]>([])
  const [messages, setMessages] = useState<EmailMessage[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState('')
  const [filter, setFilter] = useState<MailboxFilter>('inbox')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadThreads = async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('email_threads')
      .select(
        'id, subject, contact_email, contact_name, registration_id, last_message_at, unread_count, archived',
      )
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error(error)
      setErrorMessage(
        "Impossible de charger la messagerie. Vérifie que le SQL de la phase 1 a bien été exécuté.",
      )
      setLoading(false)
      return
    }

    const loaded = (data ?? []) as EmailThread[]
    setThreads(loaded)
    setSelectedThreadId((current) =>
      current && loaded.some((thread) => thread.id === current)
        ? current
        : loaded[0]?.id ?? '',
    )
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

  useEffect(() => {
    void loadThreads()
  }, [])

  useEffect(() => {
    void loadMessages(selectedThreadId)
  }, [selectedThreadId])

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase()

    return threads.filter((thread) => {
      if (filter === 'archived' && !thread.archived) return false
      if (filter !== 'archived' && thread.archived) return false
      if (filter === 'unread' && thread.unread_count === 0) return false

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
  }, [filter, search, threads])

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--club-yellow)]">
            Communication
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">E-mails</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            La boîte mail du FC Plouha sera centralisée ici : messages reçus,
            réponses, envois et conversations liées aux inscriptions.
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
            disabled
            title="Disponible à la phase 2 après connexion du service e-mail."
            className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-[var(--club-yellow)] px-4 py-2.5 text-sm font-black text-slate-950 opacity-50"
          >
            <Mail size={17} />
            Nouveau message
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
        <p className="text-sm font-bold text-amber-200">
          Phase 1 : la boîte est prête côté CMS et Supabase.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Aucun DNS ni e-mail OVH n'est modifié à cette étape. L'envoi et la
          réception réels seront branchés ensuite sans casser la boîte
          contact@fcplouha.fr existante.
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
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
                  Aucun message pour le moment
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  C'est normal tant que la réception n'est pas branchée.
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
                Boîte de réception
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                Sélectionne une conversation pour afficher son historique.
                Après la phase 2, les réponses reçues à contact@fcplouha.fr
                apparaîtront ici.
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
                          {formatDate(message.created_at)}
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
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-slate-600"
                >
                  Répondre — disponible après connexion du service e-mail
                </button>
              </footer>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
