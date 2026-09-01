/**
 * Application-wide settings.
 *
 * `GET|PATCH /settings` is a singleton — one global row, not a collection — so
 * this deliberately has no `CreateXDto`/list shape to go with it.
 */
export interface AppSettings {
  id: string
  appName: string
  supportEmail: string
  timezone: string
  currency: string
  language: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  createdAt: string
  updatedAt: string
}

/** `PATCH /settings` — every field optional, and never `id`/timestamps. */
export type UpdateAppSettingsDto = Partial<
  Pick<
    AppSettings,
    | 'appName'
    | 'supportEmail'
    | 'timezone'
    | 'currency'
    | 'language'
    | 'maintenanceMode'
    | 'registrationEnabled'
    | 'emailVerificationRequired'
  >
>
