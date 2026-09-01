import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateLocationDto, LocationAnalytic, UpdateLocationDto } from '../types'

/** `/location-analytics` — literal path; see `revenue-analytics.queries.ts`. */
export const locationAnalytics = createResourceQueries<
  LocationAnalytic,
  CreateLocationDto,
  UpdateLocationDto
>('location-analytics', '/location-analytics')
