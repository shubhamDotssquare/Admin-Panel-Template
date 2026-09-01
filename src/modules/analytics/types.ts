/**
 * Three tiny, flat analytics resources: a monthly revenue snapshot, and two
 * simple breakdowns (by country, by device). No charting library is in this
 * project, so these are plain CRUD tables — not dashboards.
 */

/** `GET /revenue-analytics` — one row per calendar month. */
export interface RevenueSnapshot {
  id: string
  /** `YYYY-MM`, unique. */
  month: string
  revenue: number
  users: number
  newUsers: number
  createdAt: string
  updatedAt: string
}

export interface CreateRevenueDto {
  month: string
  revenue: number
  users: number
  newUsers: number
}

export type UpdateRevenueDto = Partial<CreateRevenueDto>

/** `GET /location-analytics` — users by country. */
export interface LocationAnalytic {
  id: string
  country: string
  users: number
  createdAt: string
  updatedAt: string
}

export interface CreateLocationDto {
  country: string
  users?: number
}

export type UpdateLocationDto = Partial<CreateLocationDto>

/** `GET /device-analytics` — users by device type. */
export interface DeviceAnalytic {
  id: string
  device: string
  users: number
  createdAt: string
  updatedAt: string
}

export interface CreateDeviceDto {
  device: string
  users?: number
}

export type UpdateDeviceDto = Partial<CreateDeviceDto>
