import { createResourceQueries } from '@/lib/create-resource-queries'
import type { BlogPost, CreateBlogPostDto, UpdateBlogPostDto } from '../types'

export const blogPosts = createResourceQueries<BlogPost, CreateBlogPostDto, UpdateBlogPostDto>(
  'blog-posts',
  '/blog',
)
