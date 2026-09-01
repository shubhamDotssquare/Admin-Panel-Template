import type { StatusMap } from '@/components/patterns'

/** Shared lifecycle for CMS content — pages and blog posts alike. */
export type CmsContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

// ---------------------------------------------------------------------------
// CMS pages
// ---------------------------------------------------------------------------

/** `CmsPage` from the API — a static, sluggable page (about, terms, …). */
export interface CmsPage {
  id: string
  title: string
  slug: string
  content?: string | null
  status: CmsContentStatus
  seoTitle?: string | null
  seoDescription?: string | null
  /** Server-set the moment status flips to `PUBLISHED`. Never sent by the client. */
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCmsPageDto {
  title: string
  slug: string
  content?: string
  status?: CmsContentStatus
  seoTitle?: string
  seoDescription?: string
}

export type UpdateCmsPageDto = Partial<CreateCmsPageDto>

export const CMS_PAGE_STATUS: StatusMap<CmsContentStatus> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PUBLISHED: { label: 'Published', tone: 'success' },
  ARCHIVED: { label: 'Archived', tone: 'warning' },
}

export const CMS_PAGE_STATUS_OPTIONS = (Object.keys(CMS_PAGE_STATUS) as CmsContentStatus[]).map(
  (value) => ({ label: CMS_PAGE_STATUS[value].label, value }),
)

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

/** `BlogPost` from the API. */
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  category?: string | null
  author?: string | null
  status: CmsContentStatus
  /** Read-only view counter, incremented server-side. */
  views: number
  /** Server-set the moment status flips to `PUBLISHED`. Never sent by the client. */
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateBlogPostDto {
  title: string
  slug: string
  excerpt?: string
  content?: string
  category?: string
  author?: string
  status?: CmsContentStatus
}

export type UpdateBlogPostDto = Partial<CreateBlogPostDto>

export const BLOG_STATUS: StatusMap<CmsContentStatus> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PUBLISHED: { label: 'Published', tone: 'success' },
  ARCHIVED: { label: 'Archived', tone: 'warning' },
}

export const BLOG_STATUS_OPTIONS = (Object.keys(BLOG_STATUS) as CmsContentStatus[]).map(
  (value) => ({ label: BLOG_STATUS[value].label, value }),
)
