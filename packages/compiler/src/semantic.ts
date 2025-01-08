import { Result } from '@aeriajs/types'
import { isValidCollection } from '@aeriajs/common'
import * as AST from './ast.js'

const checkForeignProperties = async (foreignCollection: AST.CollectionNode, propNames: readonly string[], errors: unknown[] = []) => {
  for( const foreignPropName of propNames ) {
    if( !(foreignPropName in foreignCollection.properties) ) {
      if( foreignCollection.extends ) {
        const { packageName, symbolName } = foreignCollection.extends
        const { [symbolName]: importedCollection } = await import(packageName)

        if( !isValidCollection(importedCollection) ) {
          throw new Error
        }

        if( !(foreignPropName in importedCollection.description.properties) ) {
          errors.push({
            message: `collection "${foreignCollection.name}" hasn't such property "${foreignPropName}"`,
          })
        }
      }
    }
  }
}

export const analyze = async (ast: AST.Node[], errors: unknown[] = []) => {
  for( const node of ast ) {
    switch( node.type ) {
      case 'collection': {
        for( const propName in node.properties ) {
          const { property } = node.properties[propName]
          if( '$ref' in property ) {
            const foreignCollection = AST.findNode(ast, {
              type: 'collection',
              name: property.$ref,
            })

            if( !foreignCollection ) {
              throw new Error
            }

            if( property.indexes ) {
              checkForeignProperties(foreignCollection, property.indexes)
            }
            if( property.populate ) {
              checkForeignProperties(foreignCollection, property.populate)
            }
            if( property.form ) {
              checkForeignProperties(foreignCollection, property.form)
            }
          }
        }
        break
      }
      case 'contract': {
        break
      }
    }
  }

  if( errors.length ) {
    return Result.error(errors)
  }

  return Result.result({})
}

