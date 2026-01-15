import { IWhiteList } from 'xss'

export interface XSSWhiteList extends IWhiteList {
  iframe?: string[]
  strike?: string[]
  video?: string[]
}
