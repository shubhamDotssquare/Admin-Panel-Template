import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createResourceQueries } from '@/lib/create-resource-queries'
import { httpClient } from '@/services/http-client'
import type { CreateFeatureFlagDto, FeatureFlag, UpdateFeatureFlagDto } from '../types'

export const featureFlags = createResourceQueries<
  FeatureFlag,
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto
>('feature-flags', '/feature-flags')

/** Flips `enabled` server-side — its own endpoint, not a status PATCH. */
export function useToggleFeatureFlag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => httpClient.patch<FeatureFlag>(`/feature-flags/${id}/toggle`),
    meta: { invalidates: [featureFlags.keys.all()] },
    onSuccess: (updated) => {
      if (updated?.id) queryClient.setQueryData(featureFlags.keys.detail(updated.id), updated)
    },
  })
}
