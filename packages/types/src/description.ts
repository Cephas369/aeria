import type { WithId } from 'mongodb'
import type { IconStyle, PhosphorIcon } from '@phosphor-icons/core'
import type { Condition } from './condition.js'
import type { JsonSchema, PropertiesWithId } from './property.js'
import type { OwnershipMode } from './security.js'

export type CollectionPresets =
  | 'crud'
  | 'duplicate'
  | 'remove'
  | 'removeAll'
  | 'owned'
  | 'timestamped'
  | 'view'

export type Icon =
  | PhosphorIcon['name']
  | `${IconStyle}:${PhosphorIcon['name']}`

export type CollectionAction<TDescription extends Description> = {
  label: string
  icon?: Icon
  ask?: boolean
  selection?: boolean
  effect?: string
  button?: boolean
  translate?: boolean

  // route namespace
  setItem?: boolean
  fetchItem?: boolean
  clearItem?: boolean
  params?: Record<string, any>
  query?: Record<string, any>
  roles?: readonly string[]

  requires?: readonly PropertiesWithId<TDescription>[]
}

export type CollectionActions<TDescription extends Description> =
  Record<string, null | CollectionAction<TDescription>>

export type FormLayout<TDescription extends Description> = {
  fields?: Partial<Record<PropertiesWithId<TDescription>, FormLayoutField<TDescription>>>
}

export type FormLayoutField<TDescription extends Description> = {
  span?: number
  verticalSpacing?: number
  separator?:
    | true
    | 'top'
    | 'bottom'
  if?: Condition<TDescription>
  component?: {
    name: string
    props?: Record<string, any>
  }
}

export type TableLayout<TDescription extends Description> = {
  actions: Partial<Record<keyof TDescription['individualActions'], {
    button?: boolean | Condition<TDescription>
    if?: Condition<TDescription>
  }>>
}

export type FiltersPreset<TDescription extends Description> = {
  label?: string
  icon?: Icon
  filters?: Partial<Record<PropertiesWithId<TDescription> | `$${string}`, any>>
  table?: readonly PropertiesWithId<TDescription>[]
  badgeFunction?: string
  default?: boolean
}

export type CollectionOptions<TDescription extends Description> = {
  queryPreset?: {
    filters?: Partial<Record<PropertiesWithId<TDescription> | `$${string}`, any>>
    sort?: Partial<Record<PropertiesWithId<TDescription>, any>>
  }
}

export type LayoutName =
  | 'tabular'
  | 'grid'
  | 'list'

export type LayoutOptions<TDescription extends Description=any> = {
  picture?: PropertiesWithId<TDescription>
  title?: PropertiesWithId<TDescription>
  badge?: PropertiesWithId<TDescription>
  information?: PropertiesWithId<TDescription>
  active?: PropertiesWithId<TDescription>
  translateBadge?: boolean
}

export type Layout<TDescription extends Description=any> = {
  name: LayoutName
  options?: LayoutOptions<TDescription>
}

export type SearchOptions<TDescription extends Description> = {
  placeholder?: string
  indexes: readonly (keyof TDescription['properties'])[]
}

export type RuntimeDescription<TDescription extends Description = any> = Pick<
  TDescription,
  | 'actions'
  | 'individualActions'
  | 'filters'
  | 'filtersPresets'
  | 'layout'
  | 'table'
  | 'tableMeta'
  | 'form'
  | 'tableLayout'
  | 'formLayout'
>

export type Description<TDescription extends Description = any> = JsonSchema<TDescription> & {
  // unused
  title?: string
  categories?: readonly string[]

  system?: boolean
  inline?: boolean

  preferred?: Record<string, RuntimeDescription<TDescription>>

  icon?: Icon
  options?: CollectionOptions<TDescription>

  indexes?: readonly (keyof TDescription['properties'])[]
  defaults?: Record<string, any>

  // modifiers
  owned?: OwnershipMode
  temporary?: {
    index: keyof TDescription['properties']
    expireAfterSeconds: number
  }
  timestamps?: false
  immutable?:
    | boolean
    | readonly (keyof TDescription['properties'])[]
    | ((doc: WithId<any>)=> boolean | Promise<boolean>)

  // takes an array of something
  route?: readonly string[]
  presets?: readonly CollectionPresets[]

  table?: readonly PropertiesWithId<TDescription>[]
  tableMeta?: readonly PropertiesWithId<TDescription>[]

  filtersPresets?: Record<string, FiltersPreset<TDescription>>
  freshItem?: Partial<Record<PropertiesWithId<TDescription>, any>>

  form?: readonly PropertiesWithId<TDescription>[] | Record<PropertiesWithId<TDescription>, string[]>
  writable?: readonly PropertiesWithId<TDescription>[]
  filters?: readonly (
    PropertiesWithId<TDescription> | {
      property: PropertiesWithId<TDescription>
      default: string
    }
  )[]
  layout?: Layout<TDescription>
  formLayout?: Partial<FormLayout<TDescription>>
  tableLayout?: Partial<TableLayout<TDescription>>

  // actions
  actions?: CollectionActions<TDescription>
  individualActions?: CollectionActions<TDescription>

  search?: SearchOptions<TDescription>
}

