import { extendCollection, defineCollection, get, getAll, insert, remove, removeAll, file as originalFile, tempFile as originalTempFile, user as originalUser } from 'aeria'

export const file = extendCollection({description:{$id:"file",properties:{}}})
export const extendFileCollection = (collection) => extendCollection(originalFile, collection)

export const tempFile = extendCollection({description:{$id:"tempFile",properties:{}}})
export const extendTempFileCollection = (collection) => extendCollection(originalTempFile, collection)

export const user = extendCollection({description:{$id:"user",properties:{}}})
export const extendUserCollection = (collection) => extendCollection(originalUser, collection)

export const animal = defineCollection({description:{$id:"animal",properties:{name:{type:"string"},specie:{enum:["dog","cat"]},details:{type:"object",properties:{age:{type:"number",minimum:10}}}},owned:true},functions:{get, getAll, insert, remove, removeAll, custom}})
export const extendAnimalCollection = (collection) => extendCollection(animal, collection)

export const pet = defineCollection({description:{$id:"pet",properties:{}}})
export const extendPetCollection = (collection) => extendCollection(pet, collection)

