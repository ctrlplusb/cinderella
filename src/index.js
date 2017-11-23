/* @flow */
/* eslint-disable prefer-destructuring */

import type { Cinderella } from './types'
import * as Timelines from './timelines'
import * as RAF from './raf'

export const addFrameListener = RAF.addFrameListener

export const removeFrameListener = RAF.removeFrameListener

export const stopAll = () => {
  RAF.stop()
  Timelines.unqueueAll()
}

export const timeline: Cinderella = config => {
  RAF.run()
  return Timelines.create(config)
}
