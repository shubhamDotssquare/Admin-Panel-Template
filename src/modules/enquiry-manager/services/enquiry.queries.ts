import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateEnquiryDto, Enquiry, UpdateEnquiryDto } from '../types'

export const enquiries = createResourceQueries<Enquiry, CreateEnquiryDto, UpdateEnquiryDto>(
  'enquiries',
  '/enquiries',
)
