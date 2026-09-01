import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CmsPage, CreateCmsPageDto, UpdateCmsPageDto } from '../types'

export const cmsPages = createResourceQueries<CmsPage, CreateCmsPageDto, UpdateCmsPageDto>(
  'cms-pages',
  '/cms-pages',
)
