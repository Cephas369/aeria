import type { Context, SchemaWithId, GetPayload, GetReturnType } from '@aeriajs/types'
import type { Document } from 'mongodb'
import { useSecurity, applyReadMiddlewares } from '@aeriajs/security'
import { Result, HTTPStatus, ACError } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'
import {
  traverseDocument,
  normalizeProjection,
  getReferences,
  buildLookupPipeline,
} from '../collection/index.js'

export type GetOptions = {
  bypassSecurity?: boolean
  noRegExpEscaping?: boolean
}

const internalGet = async <TContext extends Context>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options: GetOptions,
) => {
  const {
    filters = {},
    project,
  } = payload

  if( Object.keys(filters).length === 0 ) {
    return context.error(HTTPStatus.BadRequest, {
      code: ACError.MalformedInput,
    })
  }

  const pipeline: Document[] = []
  const refMap = await getReferences(context.description.properties, {
    memoize: context.description.$id,
  })

  const { error: filtersError, result: traversedFilters } = await traverseDocument(filters, context.description, {
    autoCast: true,
    allowOperators: true,
    noRegExpEscaping: options.noRegExpEscaping,
    context,
  })

  if( filtersError ) {
    switch( filtersError ) {
      case ACError.InsecureOperator: return context.error(HTTPStatus.Forbidden, {
        code: filtersError,
      })
      default: throw new Error
    }
  }

  pipeline.push({
    $match: traversedFilters,
  })

  if( project ) {
    const projection = normalizeProjection(project, context.description)
    if( projection ) {
      pipeline.push({
        $project: projection,
      })
    }
  }

  pipeline.push(...buildLookupPipeline(refMap, {
    memoize: context.description.$id,
    project: payload.populate
      ? payload.populate as string[]
      : project,
  }))

  const doc = await context.collection.model.aggregate<SchemaWithId<TContext['description']>>(pipeline).next()
  if( !doc ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const result = throwIfError(await traverseDocument(doc, context.description, {
    context,
    getters: true,
    fromProperties: true,
    recurseReferences: true,
    recurseDeep: true,
  }))

  return Result.result(result)
}

export const get = async <TContext extends Context>(
  payload: GetPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options: GetOptions = {},
): Promise<GetReturnType<SchemaWithId<TContext['description']>>> => {
  if( options.bypassSecurity ) {
    return internalGet(payload, context, options)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureReadPayload(payload)
  if( error ) {
    switch( error ) {
      case ACError.InvalidLimit: throw new Error
    }
    return context.error(HTTPStatus.Forbidden, {
      code: error,
    })
  }

  return applyReadMiddlewares(securedPayload, context, (payload, context) => {
    return internalGet(payload, context, options)
  })
}

