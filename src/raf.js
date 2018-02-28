/* @flow */
/* eslint-disable no-param-reassign */

import * as Timelines from './timelines'

// Represents the currently executing raf frame
let currentFrame = null

// Maintains a list of frame listeners
let frameListeners = []

export const addFrameListener = (fn: number => void) => {
  frameListeners = [...frameListeners, fn]
}

export const removeFrameListener = (fn: number => void) => {
  frameListeners = frameListeners.filter(x => x !== fn)
}

export const run = () => {
  if (currentFrame != null) {
    return
  }
  const frame = time => {
    Timelines.run(time)
    frameListeners.forEach(listener => {
      listener(time)
    })
    currentFrame = window.requestAnimationFrame(frame)
  }
  currentFrame = window.requestAnimationFrame(frame)
}

export const stop = () => {
  if (currentFrame) {
    window.cancelAnimationFrame(currentFrame)
    currentFrame = null
  }
}
