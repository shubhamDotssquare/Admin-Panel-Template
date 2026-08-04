/** Primitive helpers shared across the framework. */

export type Nullable<T> = T | null

export type Maybe<T> = T | null | undefined

/** Every key optional, recursively — handy for partial form state and patches. */
export type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

/** A plain string-keyed record with a known value type. */
export type Dictionary<T = unknown> = Record<string, T>

/** Union of the values of a `const` object — the enum replacement used here. */
export type ValueOf<T> = T[keyof T]

/** Anything the router or a component can render as an icon. */
export type IconComponent = React.ComponentType<{ className?: string }>

/** Standard async lifecycle for UI that loads. */
export type LoadState = 'idle' | 'loading' | 'success' | 'error'

/** Direction for any sortable collection. */
export type SortDirection = 'asc' | 'desc'

export interface SortState<TField extends string = string> {
  field: TField
  direction: SortDirection
}

/** A single option for selects, radio groups and filters. */
export interface SelectOption<TValue = string> {
  label: string
  value: TValue
  description?: string
  disabled?: boolean
  icon?: IconComponent
}
