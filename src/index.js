/* @flow */
/* eslint-disable prefer-destructuring */

import * as Timelines from './timelines'
import * as RAF from './raf'

export const animate = (...args) => {
  RAF.run()
  return Timelines.single(...args)
}

export const timeline = (...args) => {
  RAF.run()
  return Timelines.create(...args)
}

export const addFrameListener = RAF.addFrameListener

export const removeFrameListener = RAF.removeFrameListener

export const stopAll = () => {
  RAF.stop()
  Timelines.unqueueAll()
}

export default timeline
