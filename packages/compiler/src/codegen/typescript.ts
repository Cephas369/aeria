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
    } else if (node.type === 'functionset' && Object.keys(node.functions).length > 0) {
      if (!('aeria' in imports)) {
        imports['aeria'] = new Set()
      }

      for (const key in node.functions) {
        imports['aeria'].add(key)
      }
    }

    return imports
  }, {}) // { package1: [...variablestoimport], package2: [...variablestoimport] }

  return Object.keys(toImport).map((key) => `import { ${[...toImport[key]].join(', ')} } from '${key}'`)
}

/** Creates the code exporting the collection type, declaration, schema and extend for each collection and returns them in a string */
const makeTSCollections = (ast: AST.Node[]) => {
  return ast.filter((node): node is AST.CollectionNode => node.type === 'collection' && !('extends' in node))
    .map((collectionNode) => {
      const id = resizeFirstChar(collectionNode.name, false) //CollectionName -> collectionName
      const schemaName = resizeFirstChar(collectionNode.name, true) //collectionName -> CollectionName
      const typeName = id + 'Collection' //Pet -> petCollection

      const collectionType = `export declare type ${typeName} = ${stringify({
        description: {
          $id: id,
          properties: getCollectionProperties(collectionNode.properties),
          owned: collectionNode.owned ?? false,
        },
        ...(collectionNode.functions && {
          functions: makeTSFunctions(collectionNode.functions),
        }),
      })}`

      const collectionDeclaration = `export declare const ${id}: ${typeName} & { item: SchemaWithId<${typeName}["description"]> }`
      const collectionSchema = `export declare type ${schemaName} = SchemaWithId<typeof ${id}.description>`
      const collectionExtend = `export declare const extend${schemaName}Collection: <
            const TCollection extends {
              [P in Exclude<keyof Collection, "functions">] ? : Partial <Collection[P]>
            } &{
              functions?: {
                [F: string]: (payload: any, context: Context<typeof ${id}["description"]>) => unknown
              }
            }>(collection: Pick<TCollection, keyof Collection>) => ExtendCollection<typeof ${id}, TCollection>`

      return [
        collectionType,
        collectionDeclaration,
        collectionSchema,
        collectionExtend,
      ].join('\n')
    }).join('\n\n')
}

const resizeFirstChar = (name: string, capitalize: boolean): string => name.charAt(0)[capitalize
  ? 'toUpperCase'
  : 'toLowerCase']() + name.slice(1)

/** Transforms the AST properties to the format of aeria schema properties */
const getCollectionProperties = (properties: AST.CollectionNode['properties']) => {
  return Object.entries(properties).reduce<Record<string, any>>((acc, [key, value]) => {
    if(value.nestedProperties) {
      acc[key] = {
        ...value.property,
        properties: getCollectionProperties(value.nestedProperties),
      }
    } else {
      acc[key] = value.property
    }
    return acc
  }, {})
}

/** Turns each function to 'typeof functioName' if it's from aeria or  */
const makeTSFunctions = (functions: NonNullable<AST.CollectionNode['functions']>) => {
  return Object.keys(functions).reduce<Record<string, string>>((acc, key) => {
    acc[key] = functions[key].fromFunctionSet
      ? `typeof ${key}`
      : 'never'
    return acc
  }, {})
}

/** Assure if specific fields needs to be between quotes or not */
const stringify = (item: any) => {
  if (typeof item !== 'object' || Array.isArray(item)) {
    return JSON.stringify(item)
  }

  const objectString: string = Object.keys(item).map((key) =>
    !betweenQuotes(key, String(item[key]))
      ? `${key}:${stringify(item[key]).replaceAll('"', '')}`
      : `${key}:${stringify(item[key])}`).join(',')

  return `{${objectString}}`
}

const typeValues = [
  'true',
  'false',
  'never',
]
const numberAttributes = [
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'default',
]
const betweenQuotes = (key: string, value: string) => !value.includes('typeof') && !typeValues.includes(value) && !numberAttributes.includes(key)
