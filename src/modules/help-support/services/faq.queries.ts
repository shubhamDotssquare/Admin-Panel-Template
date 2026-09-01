import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateFaqDto, Faq, UpdateFaqDto } from '../types'

export const faqs = createResourceQueries<Faq, CreateFaqDto, UpdateFaqDto>('faqs', '/faqs')
