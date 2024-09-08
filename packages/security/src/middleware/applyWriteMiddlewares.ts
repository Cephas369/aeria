import type { Context, Collection, CollectionHookWritePayload, InsertReturnType } from '@aeriajs/types'
import { iterableMiddlewares } from './iterableMiddlewares.js'

export const applyWriteMiddlewares = <TContext extends Context>(
  payload: CollectionHookWritePayload,
  context: Omit<TContext, 'collection'> & {
    collection: Collection
  },
  fn: (p: typeof payload, context: Context)=> Promise<InsertReturnType<unknown>>,
) => {
  if( !context.collection.middlewares ) {
    throw new Error
  }

  if( Array.isArray(context.collection.middlewares) ) {
    const writeMiddlewares = context.collection.middlewares.map((middleware) => middleware.beforeWrite).filter((fn) => !!fn)
    const start = iterableMiddlewares<typeof payload, ReturnType<typeof fn>>(
      writeMiddlewares,
      fn,
    )

    return start(payload, context)
  }

  if( context.collection.middlewares.beforeWrite ) {
    return context.collection.middlewares.beforeWrite(payload, context, fn)
  }
}

