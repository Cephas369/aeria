import { Result } from '@aeriajs/types'
import { type Diagnostic } from './diagnostic'

export enum TokenType {
  LineBreak = 'LINE_BREAK',
  Comment = 'COMMENT',
  LeftBracket = 'LEFT_BRACKET',
  RightBracket = 'RIGHT_BRACKET',
  LeftParens = 'LEFT_PARENS',
  RightParens = 'RIGHT_PARENS',
  LeftSquareBracket = 'LEFT_SQUARE_BRACKET',
  RightSquareBracket = 'RIGHT_SQUARE_BRACKET',
  Pipe = 'PIPE',
  Comma = 'COMMA',
  Dot = 'DOT',
  Number = 'NUMBER',
  Boolean = 'BOOLEAN',
  Keyword = 'KEYWORD',
  Identifier = 'IDENTIFIER',
  QuotedString = 'QUOTED_STRING',
  AttributeName = 'ATTRIBUTE_NAME',
}

export type TokenConfig = {
  type:
    | TokenType
    | null
  matcher:
    | RegExp
    | string
    | string[]
  valueExtractor?: (value: string) => string
}

export type Location = {
  index:number
  line:number
  start:number
  end:number
}

export type Token = {
  type: TokenType
  location:Location
  value: string
}

const TOKENS: TokenConfig[] = [
  {
    type: null,
    matcher: /\r?[ \t]+/,
  },
  {
    type: TokenType.LineBreak,
    matcher: '\n',
  },
  {
    type: TokenType.Comment,
    matcher: '//',
  },
  {
    type: TokenType.LeftBracket,
    matcher: '{',
  },
  {
    type: TokenType.RightBracket,
    matcher: '}',
  },
  {
    type: TokenType.LeftParens,
    matcher: '(',
  },
  {
    type: TokenType.RightParens,
    matcher: ')',
  },
  {
    type: TokenType.LeftSquareBracket,
    matcher: '[',
  },
  {
    type: TokenType.RightSquareBracket,
    matcher: ']',
  },
  {
    type: TokenType.Pipe,
    matcher: '|',
  },
  {
    type: TokenType.Comma,
    matcher: ',',
  },
  {
    type: TokenType.Dot,
    matcher: '.',
  },
  {
    type: TokenType.Number,
    matcher: /[0-9]+(\.[0-9]+)?/,
  },
  {
    type: TokenType.Boolean,
    matcher: [
      'true',
      'false',
    ],
  },
  {
    type: TokenType.Keyword,
    matcher: [
      'collection',
      'contract',
      'extends',
      'functions',
      'functionset',
      'owned',
      'payload',
      'properties',
      'query',
      'response',
    ],
  },
  {
    type: TokenType.Identifier,
    matcher: /[a-zA-Z0-9]+/,
  },
  {
    type: TokenType.QuotedString,
    matcher: /"[a-zA-Z0-9]+"/,
    valueExtractor: (value) => value.slice(1, -1),
  },
  {
    type: TokenType.AttributeName,
    matcher: /@[a-zA-Z0-9]+/,
    valueExtractor: (value) => value.slice(1),
  },
]

export const tokenize = function (input: string): Result.Either<Diagnostic,Token[]> {
  let index = 0
  let line = 1
  let start = 0
  let end = 0
  const tokens: Token[] = []
  while( index < input.length ) {
    let hasMatch = false
    for( const { type, matcher, valueExtractor } of TOKENS ) {
      let value: string | undefined

      if( typeof matcher === 'string' ) {
        if( input.slice(index).startsWith(matcher) ) {
          value = matcher
        }
      } else if( matcher instanceof RegExp ) {
        const currentMatcher = new RegExp(matcher.source, 'y')
        currentMatcher.lastIndex = index
        const matched = currentMatcher.exec(input)
        if( matched ) {
          [value] = matched
        }
      } else {
        const segment = input.slice(index, index + input.slice(index).search(/[ \t\n]+/))
        if( segment && matcher.includes(segment) ) {
          value = segment
        }
      }
      if( value ) {
        const location: Location = {
          index: index += value.length,
          line,
          end: end += value.length,
          start: start = end - value.length
        }
        switch( type ) {
          case null: break
          case TokenType.LineBreak:
            line++
            end = 0
            start = 0
            break
          case TokenType.Comment: {
            while( input[index++] !== '\n' ) {}
            break
          }
          default: {
            if( valueExtractor ) {
              tokens.push({
                type,
                location,
                value: valueExtractor(value),
              })
              continue
            }
            tokens.push({
              type,
              location,
              value,
            })
          }
        }

        hasMatch = true
      }
    }

    if( !hasMatch ) {
      return Result.error({
        message: 'unexpected token',
        location: {
          index,
          line,
          start,
          end,
        },
      })
    }
  }
  return Result.result(tokens)
}

