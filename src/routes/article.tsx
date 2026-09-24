import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DOMPurify from 'dompurify'
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Newspaper,
  RefreshCw,
  Share2,
  ArrowRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Seo from '@/components/Seo'

type Article = {
  id: number
  title: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  created_at: string
}

type RelatedArticle = Pick<
  Article,
  'id' | 'title' | 'excerpt' | 'image_url' | 'created_at'
>

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function plainTextToHtml(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n').trim()

  if (!normalized) {
    return ''
  }

  const explicitParagraphs = normalized
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const paragraphs =
    explicitParagraphs.length > 1
      ? explicitParagraphs
      : normalized.includes('\n')
        ? normalized
            .split('\n')
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
        : [normalized]

  return paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join('')
}

function getRenderableContent(value: string | null) {
  if (!value?.trim()) {
    return ''
  }

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(value)

  return looksLikeHtml ? value : plainTextToHtml(value)
}

function getSanitizedContent(value: string | null) {
  return DOMPurify.sanitize(getRenderableContent(value), {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: [
      'script',
      'style',
      'iframe',
      'object',
      'embed',
      'form',
      'input',
      'button',
      'textarea',
      'select',
      'option',
    ],
    ALLOW_DATA_ATTR: false,
  })
}

