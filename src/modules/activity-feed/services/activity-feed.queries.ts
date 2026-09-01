import { createResourceQueries } from '@/lib/create-resource-queries'
import type { ActivityFeedItem, CreateActivityFeedItemDto, UpdateActivityFeedItemDto } from '../types'

export const activityFeed = createResourceQueries<
  ActivityFeedItem,
  CreateActivityFeedItemDto,
  UpdateActivityFeedItemDto
>('activity-feed', '/activity-feed')
