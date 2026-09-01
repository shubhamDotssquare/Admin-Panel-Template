import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateDeviceDto, DeviceAnalytic, UpdateDeviceDto } from '../types'

/** `/device-analytics` — literal path; see `revenue-analytics.queries.ts`. */
export const deviceAnalytics = createResourceQueries<
  DeviceAnalytic,
  CreateDeviceDto,
  UpdateDeviceDto
>('device-analytics', '/device-analytics')
