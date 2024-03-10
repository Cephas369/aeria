import type { ObjectId } from 'mongodb'
import type {
  Context,
  Contract,
  CollectionFunctionsWithContext,
  Description,
  SecurityPolicy,
  AccessControl,
  PackReferences,

} from '.'

export type Collection<TCollection extends Collection = any> = {
  description: Description
  item?: any
  security?: SecurityPolicy
  accessControl?: AccessControl<TCollection>
  functions?: Partial<CollectionFunctionsWithContext<any>> & Record<string, (payload: any, context: Context, ...args: any[])=> any>
  functionContracts?: Record<string, Contract>
}

export type AssetType = keyof Collection
export type FunctionPath = `${string}@${string}`

export type UserACProfile = {
  readonly roles: string[]
  readonly allowed_functions?: string[]
}

export type DecodedToken =
  | {
    authenticated: true
    sub: ObjectId
    roles: string[]
    userinfo: PackReferences<Collections['user']['item']>
    allowed_functions?: FunctionPath[]
  }
  | {
    authenticated: false
    sub: null
  }

