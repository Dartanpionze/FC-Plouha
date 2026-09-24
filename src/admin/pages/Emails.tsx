import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  Download,
  FileText,
  PenLine,
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
import useAccessibleDialog from '@/hooks/useAccessibleDialog'

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

type ImapFolder = {
  path: string
  name: string
  label: string
  specialUse: string | null
}

type ImapConversationItem = {
  key: string
  direction: 'inbound' | 'outbound'
  date: string
  subject: string
  fromName: string
  fromEmail: string
  toEmail: string

