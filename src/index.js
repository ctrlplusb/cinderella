/* eslint-disable no-param-reassign */

import createTimeline from './createTimeline'
import processAnimation from './processAnimation'

// Maintains a list of timelines that have been queued to "executed"
const queuedTimelines = {}

// Represents the currently executing raf frame
let currentFrame = null

const defaultConfig = {
  loop: false,
}

function resetTimeline(t) {
  t.runState = null
  Object.keys(t.queue).forEach(animationId => {
    const animation = t.queue[animationId]
    animation.runState = null
  })
}

export const onFrame = time => {
  Object.keys(queuedTimelines).forEach(timelineId => {
    const t = queuedTimelines[timelineId]
    t.runState = t.runState || {}
    const { runState } = t
    runState.startTime = runState.startTime != null ? runState.startTime : time
    Object.keys(t.queue).forEach(animationId => {
      const animation = t.queue[animationId]
      processAnimation(animation, time - runState.startTime)
    })
  })
}

const start = () => {
  if (currentFrame != null) {
    // We are already running the raf. Move along.
    return
  }
  let started
  const loop = time => {
    if (!started) {
      started = time
    }
    onFrame(time)
    currentFrame = window.requestAnimationFrame(loop)
  }
  currentFrame = window.requestAnimationFrame(loop)
}

export const cancelAll = () => {
  const timelineIds = Object.keys(queuedTimelines)
  timelineIds.forEach(id => {
    delete queuedTimelines[id]
  })
  if (currentFrame) {
    window.cancelAnimationFrame(currentFrame)
    currentFrame = null
  }
}

const unqueueTimeline = id => {
  delete queuedTimelines[id]
  if (Object.keys(queuedTimelines).length === 0) {
    cancelAll()
  }
}

export const animate = (animations = [], config = {}) => {
  config = Object.assign({}, defaultConfig, config)
  const t = createTimeline(animations)
  const run = () => {
    const hasExecutableAnimations = t.executionEnd > 0
    if (hasExecutableAnimations) {
      if (queuedTimelines[t.id]) {
        unqueueTimeline(t)
        resetTimeline(t)
        setTimeout(() => {
          // Doing this gives an existing frame time to resolve.
          queuedTimelines[t.id] = t
        }, 1000 / 60)
      } else {
        queuedTimelines[t.id] = t
      }
      start()
    }
    return hasExecutableAnimations
      ? // We will return a promise that resolves when the longest
        // running animation completes.
        new Promise(resolve => {
          const longestAnim = t.queue[t.longestRunningAnimation]
          const customOnComplete = longestAnim.onComplete
          longestAnim.onComplete = x => {
            if (customOnComplete != null) {
              customOnComplete(x)
            }
            if (config.loop) {
              // TODO: Check to see if this is a potential memory leak?
              resolve(run())
            } else {
              resolve()
            }
          }
        })
      : // Otherwise we return a promise that resolves immediately
        Promise.resolve()
  }
  return {
    run,
    cancel: () => unqueueTimeline(t.id),
  }
}
