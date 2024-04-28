import type { Context, SchemaWithId, RemovePayload } from '@aeriajs/types'
import type { description } from './description.js'
import { defineExposedFunction, remove as originalRemove, type ObjectId } from '@aeriajs/core'
import fs from 'fs/promises'

export const remove = defineExposedFunction(async (
  payload: RemovePayload<SchemaWithId<typeof description>>,
  context: Context<typeof description>
) => {
  const file = await context.collection.model.findOne({
    _id: <ObjectId>payload.filters._id,
  }, {
    projection: {
      absolute_path: 1,
    },
  })

  if( !file ) {
    throw new Error('')
  }

  try {
    await fs.unlink(file.absolute_path)
  } catch( err ) {
    console.trace(err)
  }

  return originalRemove(payload, context)
})

