import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const CmsPageListPage = lazy(() => import('./pages/cms-page-list-page'))
const CmsPageDetailPage = lazy(() => import('./pages/cms-page-detail-page'))
const CmsPageFormPage = lazy(() => import('./pages/cms-page-form-page'))
const BlogPostListPage = lazy(() => import('./pages/blog-post-list-page'))
const BlogPostDetailPage = lazy(() => import('./pages/blog-post-detail-page'))
const BlogPostFormPage = lazy(() => import('./pages/blog-post-form-page'))

/**
 * CMS: two sibling resources sharing one base path — static pages at `/cms`
 * and editorial blog posts nested under `/cms/blog`.
 *
 * Route order matters: React Router ranks static segments above dynamic ones,
 * but `blog` and `new` still have to be declared before `:pageId` for the
 * *reading* of this list to make sense, and — critically — `/cms/blog` and its
 * children must come before the bare `:pageId` pattern so `blog` is never
 * captured as a page id.
 */
export const cmsModule: ModuleDefinition = {
  id: 'cms',
  title: 'CMS',
  basePath: PATHS.cms,
  enabled: true,
  routes: [
    { path: PATHS.cms, Component: CmsPageListPage },
    { path: route(PATHS.cms, 'new'), Component: CmsPageFormPage },
    { path: route(PATHS.cms, 'blog'), Component: BlogPostListPage },
    { path: route(PATHS.cms, 'blog', 'new'), Component: BlogPostFormPage },
    { path: route(PATHS.cms, 'blog', ':postId'), Component: BlogPostDetailPage },
    { path: route(PATHS.cms, 'blog', ':postId', 'edit'), Component: BlogPostFormPage },
    { path: route(PATHS.cms, ':pageId'), Component: CmsPageDetailPage },
    { path: route(PATHS.cms, ':pageId', 'edit'), Component: CmsPageFormPage },
  ],
}

export default cmsModule
