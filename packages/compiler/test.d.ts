import { get, getAll, insert, remove, removeAll, file, tempFile, user } from 'aeria'

export declare type animalCollection = {description:{$id:"animal",properties:{name:{type:"string"},specie:{enum:["dog","cat"]},details:{type:"object",properties:{age:{type:"number",minimum:10}}}},owned:true},functions:{get:typeof get,getAll:typeof getAll,insert:typeof insert,remove:typeof remove,removeAll:typeof removeAll,custom:typeof custom}}
export declare const animal: animalCollection & { item: SchemaWithId<animalCollection["description"]> }
export declare type Animal = SchemaWithId<typeof animal.description>
export declare const extendAnimalCollection: <
          const TCollection extends {
            [P in Exclude<keyof Collection, "functions">] ? : Partial <Collection[P]>
          } &{
            functions?: {
              [F: string]: (payload: any, context: Context<typeof animal["description"]>) => unknown
            }
          }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof animal, TCollection>

export declare type petCollection = {description:{$id:"pet",properties:{},owned:undefined}}
export declare const pet: petCollection & { item: SchemaWithId<petCollection["description"]> }
export declare type Pet = SchemaWithId<typeof pet.description>
export declare const extendPetCollection: <
          const TCollection extends {
            [P in Exclude<keyof Collection, "functions">] ? : Partial <Collection[P]>
          } &{
            functions?: {
              [F: string]: (payload: any, context: Context<typeof pet["description"]>) => unknown
            }
          }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof pet, TCollection>
