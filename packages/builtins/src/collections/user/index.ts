import { defineCollection, get, getAll, remove, upload, removeFile } from '@aeriajs/core'
import { description } from './description.js'
import { authenticate } from './authenticate.js'
import { activate } from './activate.js'
import { insert } from './insert.js'
import { createAccount } from './createAccount.js'
import { getInfo } from './getInfo.js'
import { getCurrentUser } from './getCurrentUser.js'
import { getActivationLink } from './getActivationLink.js'

export const user = defineCollection({
  description,
  functions: {
    get,
    getAll,
    remove,
    upload,
    removeFile,
    insert,
    authenticate,
    activate,
    createAccount,
    getInfo,
    getCurrentUser,
    getActivationLink,
  },
  accessControl: {
    roles: {
      root: {
        grantEverything: true,
      },
      guest: {
        grant: ['authenticate'],
      },
    },
  },
})

