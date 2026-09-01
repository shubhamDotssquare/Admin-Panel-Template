/** `FeatureFlag` from the API. */
export interface FeatureFlag {
  id: string
  /** Stable identifier code, e.g. `NEW_CHECKOUT_FLOW`. */
  key: string
  name: string
  description?: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFeatureFlagDto {
  key: string
  name: string
  description?: string
  enabled?: boolean
}

export type UpdateFeatureFlagDto = Partial<CreateFeatureFlagDto>
