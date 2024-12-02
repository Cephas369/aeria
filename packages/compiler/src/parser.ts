import type { Property, AccessCondition } from '@aeriajs/types'
import { TokenType, type Token } from './lexer'
import * as AST from './ast'
import * as guards from './guards'

export const parse = (tokens: Token[]) => {
  let current = 0

  const match = (expected: TokenType, value?: string) => {
    const token = tokens[current]
    if( token.type === expected ) {
      if( value !== undefined ) {
        return token.value === value
      }
      return true
    }

    return false
  }

  const consume = (expected: TokenType, value?: string) => {
    const token = tokens[current]
    if( match(expected, value) ) {
      current++
      return token
    }

    throw new Error(`expected "${expected}" but found "${token.type}" instead`)
  }

  const consumePropertyType = (options = {
    allowModifiers: false,
  }): AST.PropertyNode => {
    let property: Property
    let nestedProperties: Record<string, AST.PropertyNode> | undefined
    let modifier: string | undefined

    if( options.allowModifiers ) {
      if( match(TokenType.Identifier) && tokens[current + 1].type === TokenType.LeftBracket ) {
        modifier = consume(TokenType.Identifier).value
      }
    }

    if( match(TokenType.LeftBracket) ) {
      consume(TokenType.LeftBracket)

      property = {
        type: 'object',
        properties: {},
      }

      while( !match(TokenType.RightBracket) ) {
        const { value: keyword } = tokens[current]
        switch( keyword ) {
          case 'properties': {
            consume(TokenType.Identifier, 'properties')
            nestedProperties = consumePropertiesBlock(options)
            break
          }
          default:
            throw new Error(`invalid keyword "${keyword}"`)
        }
      }

      consume(TokenType.RightBracket)

    } else {
      const { value: identifier } = consume(TokenType.Identifier)
      if( guards.isNativePropertyType(identifier) ) {
        switch( identifier ) {
          case 'enum': {
            property = {
              enum: [],
            }
            break
          }
          default:
            property = {
              type: AST.PropertyType[identifier],
            }
        }
      } else {
        const collection = AST.findNode(ast, {
          type: 'collection',
          name: identifier,
        })

        if( !collection ) {
          throw new Error(`invalid reference "${identifier}"`)
        }

        property = {
          $ref: identifier,
        }
      }
    }

    while( match(TokenType.AttributeName) ) {
      const { value: attributeName } = consume(TokenType.AttributeName)
      let insideParens = false
      if( match(TokenType.LeftParens) ) {
        consume(TokenType.LeftParens)
        insideParens = true
      }

      const attributeValue = tokens[current++].value

      if( insideParens ) {
        consume(TokenType.RightParens)
      }

      if( 'enum' in property && attributeName === 'values' ) {
        // TODO
        property.enum = []
        continue
      }

      Object.assign(property, {
        [attributeName]: attributeValue,
      })
    }

    const node: AST.PropertyNode = {
      type: 'property',
      property,
      nestedProperties,
    }

    if( modifier ) {
      if( !guards.isValidPropertyModifier(modifier) ) {
        throw new Error(`invalid modifier: "${modifier}"`)
      }
      node.modifier = modifier
    }

    return node
  }

  const consumePropertiesBlock = (options = {
    allowModifiers: false,
  }) => {
    consume(TokenType.LeftBracket)

    const properties: Record<string, AST.PropertyNode> = {}
    while( !match(TokenType.RightBracket) ) {
      const { value: propName } = consume(TokenType.Identifier)
      properties[propName] = consumePropertyType(options)

      if( match(TokenType.Comma) ) {
        consume(TokenType.Comma)
      }
    }

    consume(TokenType.RightBracket)
    return properties
  }

  const consumeMultiplePropertyTypes = (options = {
    allowModifiers: false,
  }) => {
    if( match(TokenType.Pipe) ) {
      consume(TokenType.Pipe)

      const properties = []
      while( current < tokens.length ) {
        properties.push(consumePropertyType(options))

        if( match(TokenType.Pipe) ) {
          consume(TokenType.Pipe)
        } else {
          break
        }
      }

      return properties
    }

    return consumePropertyType(options)
  }

  const consumeCollection = (ast: AST.Node[]): AST.CollectionNode => {
    consume(TokenType.Identifier, 'collection')
    const { value: name } = consume(TokenType.Identifier)
    consume(TokenType.LeftBracket)

    const node: AST.CollectionNode = {
      type: 'collection',
      name,
      properties: {},
    }

    while( !match(TokenType.RightBracket) ) {
      const { value: propType } = tokens[current]
      switch( propType ) {
        case 'properties': {
          consume(TokenType.Identifier, 'properties')
          node.properties = consumePropertiesBlock()
          break
        }
        case 'functions': {
          consume(TokenType.Identifier, 'functions')
          node.functions = consumeFunctionsBlock(ast)
          break
        }
        default:
          throw new Error(`invalid token "${propType}"`)
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const consumeContract = (): AST.ContractNode => {
    consume(TokenType.Identifier, 'contract')
    const { value: name } = consume(TokenType.Identifier)
    consume(TokenType.LeftBracket)

    const node: AST.ContractNode = {
      type: 'contract',
      name,
    }

    while( !match(TokenType.RightBracket) ) {
      const { value: keyword } = consume(TokenType.Identifier)
      switch( keyword ) {
        case 'payload': {
          node.payload = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
        case 'query': {
          node.query = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
        case 'response': {
          node.response = consumeMultiplePropertyTypes({
            allowModifiers: true,
          })
          break
        }
      }
    }

    consume(TokenType.RightBracket)
    return node
  }

  const consumeFunctionsBlock = (ast: AST.Node[]) => {
    consume(TokenType.LeftBracket)

    const functions: Record<string, AccessCondition> = {}
    while( !match(TokenType.RightBracket) ) {
      if( match(TokenType.AttributeName, 'include') ) {
        consume(TokenType.AttributeName, 'include')
        consume(TokenType.LeftParens)

        const { value: functionSetName } = consume(TokenType.Identifier)

        const functionset = AST.findNode(ast, {
          type: 'functionset',
          name: functionSetName,
        })

        if( !functionset ) {
          throw new Error(`functionset "${functionSetName} not found"`)
        }

        Object.assign(functions, functionset.functions)
        consume(TokenType.RightParens)

        continue
      }

      const { value: functionName } = consume(TokenType.Identifier)
      functions[functionName] = false

      while( match(TokenType.AttributeName, 'expose') ) {
        consume(TokenType.AttributeName, 'expose')
        functions[functionName] = true
      }
    }

    consume(TokenType.RightBracket)
    return functions
  }

  const consumeFunctionSet = (ast: AST.Node[]): AST.FunctionSetNode => {
    consume(TokenType.Identifier, 'functionset')
    const { value: name } = consume(TokenType.Identifier)
    const node: AST.FunctionSetNode = {
      type: 'functionset',
      name,
      functions: consumeFunctionsBlock(ast),
    }

    return node
  }

  const ast: AST.Node[] = []
  while( current < tokens.length ) {
    const { value: declType } = tokens[current]

    switch( declType ) {
      case 'collection': {
        ast.push(consumeCollection(ast))
        break
      }
      case 'contract': {
        ast.push(consumeContract())
        break
      }
      case 'functionset': {
        ast.push(consumeFunctionSet(ast))
        break
      }
      default:
        throw new Error(`invalid declaration type: "${declType}"`)
    }
  }

  return ast
}

