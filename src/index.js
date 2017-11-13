/* @flow */
/* eslint-disable prefer-destructuring */

import type { AnimationDefinition, TimelineAPI } from './types'
import * as Timelines from './timelines'
import * as RAF from './raf'

export const addFrameListener = RAF.addFrameListener

export const removeFrameListener = RAF.removeFrameListener

export const stopAll = () => {
  RAF.stop()
  Timelines.unqueueAll()
}

export default (animation: AnimationDefinition): TimelineAPI => {
  RAF.run()
  return Timelines.create(animation)
}
