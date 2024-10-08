import type { Context, Description, Pagination, GetAllPayload } from '@aeriajs/types'
import { throwIfError } from '@aeriajs/common'

export const makePagination = async (
  payload: GetAllPayload<any>,
  documents: unknown[],
  context: Context<Description, {
    count?: (...args: unknown[])=> unknown
  }>,
): Promise<Pagination> => {
  const limit = payload.limit
    ? payload.limit
    : context.config.paginationLimit!

  const offset = payload.offset || 0

  const recordsTotal = typeof context.collection.functions.count === 'function'
    ? throwIfError(await context.collection.functions.count({
      filters: payload.filters,
    }))
    : await context.collection.model.countDocuments(payload.filters)

  return {
    recordsCount: documents.length,
    recordsTotal,
    offset,
    limit,
  }
}

