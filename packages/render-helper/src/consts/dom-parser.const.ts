import xmldom from 'xmldom'
import { noop } from '../methods/noop.method'

export const DOMParser = new xmldom.DOMParser({
  errorHandler: { warning: noop, error: noop }
})
