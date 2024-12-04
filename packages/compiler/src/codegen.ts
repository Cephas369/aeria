import { generateTypescript } from './codegen/typescript'
import type * as AST from './ast'
import fs from 'fs'

export const generateCode = (ast: AST.Node[]) => {
  const typescript = generateTypescript(ast)
  fs.writeFileSync('./test.d.ts', typescript)

  return ast
}

