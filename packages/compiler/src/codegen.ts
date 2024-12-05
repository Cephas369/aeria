import { generateTypescript } from './codegen/typescript'
import type * as AST from './ast'
import fs from 'fs'
import { generateJavascript } from './codegen/javascript'

export const generateCode = (ast: AST.Node[]) => {
  const typescript = generateTypescript(ast)
  fs.writeFileSync('./test.d.ts', typescript)

  const javascript = generateJavascript(ast)
  fs.writeFileSync('./test.js', javascript)

  return ast
}

