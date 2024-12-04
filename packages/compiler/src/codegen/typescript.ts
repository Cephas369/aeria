import type * as AST from '../ast'

export const generateTypescript = (ast: AST.Node[]): string => {
  let code = ''
  code += makeTSImports(ast) + '\n\n'
  code += makeTSCollections(ast) + '\n'
  return code
}

const makeTSImports = (ast: AST.Node[]) => {
  const toImport = ast.reduce<Record<string, Set<string>>>((imports, node) => {
    if (node.type === 'collection' && node.extends?.packageName) {
      if (!(node.extends.packageName in imports)) {
        imports[node.extends.packageName] = new Set()
      }

      imports[node.extends.packageName].add(node.extends.symbolName)
    }

    if (node.type === 'functionset') {
      if (!('aeria' in imports)) {
        imports['aeria'] = new Set()
      }

      for (const key in node.functions) {
        imports['aeria'].add(key)
      }
    }

    return imports
  }, {})

  return Object.keys(toImport).map((key) => `import { ${[...toImport[key]].join(', ')} } from '${key}'`)
}

type CollectionNode = AST.Node & { type: 'collection' }

const makeTSCollections = (ast: AST.Node[]) => {
  const getCollectionProperties = (properties: CollectionNode['properties']) => {
    return Object.entries(properties).reduce<Record<string, any>>((acc, [key,value]) => {
      acc[key] = value.nestedProperties
        ? {
          ...value.property,
          properties: getCollectionProperties(value.nestedProperties),
        }
        : value.property
      return acc
    }, {})
  }

  const getCollectionId = (name: string) => name.toLocaleLowerCase()

  const result: string[] = []
  for(const collectionNode of ast.filter((node) => node.type === 'collection')) {
    if ('extends' in collectionNode) {
      continue
    }

    const id = getCollectionId(collectionNode.name)
    const typeName = id + 'Collection'
    const upperName = String(collectionNode.name).charAt(0).toUpperCase() + String(collectionNode.name).slice(1)

    const collectionType = `export declare type ${typeName} = ${stringify({
      description: {
        $id: id,
        properties: getCollectionProperties(collectionNode.properties),
        owned: collectionNode.owned,
      },
      ...(collectionNode.functions && {
        functions: Object.keys(collectionNode.functions).reduce<Record<string, any>>((acc, key) => (acc[key] = `typeof ${key}`, acc), {}),
      }),
    })}`

    const collectionDeclaration = `export declare const ${id}: ${typeName} & { item: SchemaWithId<${typeName}["description"]> }`
    const collectionSchema = `export declare type ${upperName} = SchemaWithId<typeof ${id}.description>`
    const collectionExtend = `export declare const extend${upperName}Collection: <
          const TCollection extends {
            [P in Exclude<keyof Collection, "functions">] ? : Partial <Collection[P]>
          } &{
            functions?: {
              [F: string]: (payload: any, context: Context<typeof ${id}["description"]>) => unknown
            }
          }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof ${id}, TCollection>`

    result.push([
      collectionType,
      collectionDeclaration,
      collectionSchema,
      collectionExtend,
    ].join('\n'))
  }

  return result.join('\n\n')
}

/** Assure if specific fields needs to be between quotes or not */
const stringify = (item: any) => {
  if (typeof item !== 'object' || Array.isArray(item)){
    return JSON.stringify(item)
  }

  const objectString: string = Object.keys(item).map((key) => {
    if (!betweenQuotes(key, String(item[key]))) {
      return `${key}:${stringify(item[key]).replaceAll('"', '')}`
    }
    return `${key}:${stringify(item[key])}`
  }).join(',')

  return `{${objectString}}`
}

const booleans = [
  'true',
  'false',
]
const numberAttributes = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'default',
]
const betweenQuotes = (key: string, value: string) => !value.includes('typeof') && !booleans.includes(value) && !numberAttributes.includes(key)
