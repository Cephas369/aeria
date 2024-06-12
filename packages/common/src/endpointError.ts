import type { EndpointError } from '@aeriajs/types'
import { ERROR_SYMBOL, ERROR_SYMBOL_DESCRIPTION } from '@aeriajs/types'
import { Result } from './result.js'

export const endpointError = <const TEndpointError extends EndpointError>(value: TEndpointError) => {
  return Result.error(Object.assign({
    [ERROR_SYMBOL]: true,
  }, value) as TEndpointError)
}

export const isEndpointError = (object: EndpointError | any): object is Result.Error<EndpointError<any>> => {
  return object
    && object.error
    && (ERROR_SYMBOL in object.error || ERROR_SYMBOL_DESCRIPTION in object.error)
}

