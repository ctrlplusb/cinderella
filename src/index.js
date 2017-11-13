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

const cinderella: Cinderella = config => {
  RAF.run()
  return Timelines.create(config)
}

export default cinderella
