import type { Context, SchemaWithId, InsertPayload, InsertReturnType } from '@aeriajs/types'
import { Result, HTTPStatus, ACError, ValidationErrorCode, TraverseError } from '@aeriajs/types'
import { useSecurity } from '@aeriajs/security'
import { throwIfError, endpointErrorSchema } from '@aeriajs/common'
import { traverseDocument, normalizeProjection, prepareInsert } from '../collection/index.js'

export type InsertOptions = {
  bypassSecurity?: boolean
}

export const insertErrorSchema = () => endpointErrorSchema({
  httpStatus: [
    HTTPStatus.Forbidden,
    HTTPStatus.NotFound,
    HTTPStatus.UnprocessableContent,
  ],
  code: [
    ACError.InsecureOperator,
    ACError.OwnershipError,
    ACError.ResourceNotFound,
    ACError.TargetImmutable,
    ValidationErrorCode.EmptyTarget,
    ValidationErrorCode.InvalidProperties,
    ValidationErrorCode.MissingProperties,
    TraverseError.InvalidDocumentId,
    TraverseError.InvalidTempfile,
  ],
})

const internalInsert = async <TContext extends Context>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
) => {
  const { error, result: what } = await traverseDocument(payload.what, context.description, {
    recurseDeep: true,
    autoCast: true,
    validate: true,
    validateRequired: '_id' in payload.what && payload.what._id
      ? []
      : context.description.required,
    moveFiles: true,
    skipUndefined: true,
    context,
  })

  if( error ) {
    if( typeof error === 'string' ) {
      return context.error(HTTPStatus.UnprocessableContent, {
        code: error,
      })
    }

    return context.error(HTTPStatus.UnprocessableContent, {
      code: error.code,
      details: error.errors,
    })
  }

  const docId = '_id' in what
    ? what._id
    : null

  const content = prepareInsert(what, context.description)

  const projection = payload.project
    ? normalizeProjection(payload.project, context.description)
    : {}

  let newId = docId

  if( !newId ) {
    const now = new Date()
    Object.assign(content, {
      created_at: now,
      updated_at: now,
    })

    newId = (await context.collection.model.insertOne(content)).insertedId

  } else {
    content.$set ??= {}
    content.$set.updated_at = new Date()
    await context.collection.model.updateOne({
      _id: docId,
    }, content)

  }

  let doc: SchemaWithId<any> | null
  if( context.collection.originalFunctions?.get ) {
    doc = throwIfError(await context.collection.originalFunctions.get({
      filters: {
        _id: newId,
      },
    }, Object.assign({
      inherited: true,
    }, context), {
      bypassSecurity: true,
    }))
  } else {
    doc = await context.collection.model.findOne({
      _id: newId,
    }, {
      projection,
    })
  }

  if( !doc ) {
    return context.error(HTTPStatus.NotFound, {
      code: ACError.ResourceNotFound,
    })
  }

  const result = throwIfError(await traverseDocument(doc, context.description, {
    getters: true,
    fromProperties: true,
    recurseReferences: true,
  }))

  return Result.result(result)
}

export const insert = async <TContext extends Context>(
  payload: InsertPayload<SchemaWithId<TContext['description']>>,
  context: TContext,
  options: InsertOptions = {},
): Promise<InsertReturnType<SchemaWithId<TContext['description']>>> => {
  if( options.bypassSecurity ) {
    return internalInsert(payload, context)
  }

  const security = useSecurity(context)
  const { error, result: securedPayload } = await security.secureWritePayload(payload)
  if( error ) {
    return context.error(HTTPStatus.Forbidden, {
      code: error,
    })
  }
  return internalInsert(securedPayload, context)
}

