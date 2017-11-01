/* eslint-disable no-param-reassign */

import createTimeline from './createTimeline'
import processAnimation from './processAnimation'

// Maintains a list of timelines that have been queued to "executed"
const queuedTimelines = {}

// Maintains a list of frame listeners
let frameListeners = []

// Represents the currently executing raf frame
let currentFrame = null

const defaultConfig = {
  loop: false,
}

const resetTimelineAnimations = t => {
  Object.keys(t.queue).forEach(animationId => {
    const animation = t.queue[animationId]
    animation.runState = null
  })
}

const resetTimeline = t => {
  t.runState = null
  resetTimelineAnimations(t)
}

const onFrame = time => {
  Object.keys(queuedTimelines).forEach(timelineId => {
    const t = queuedTimelines[timelineId]
    t.runState = t.runState || {}
    const { runState } = t
    if (
      runState.seek != null &&
      (!runState.playFromSeek || !runState.seekResolved)
    ) {
      runState.timeForSeek = t.executionEnd / 100 * runState.seek
      Object.keys(t.queue).forEach(animationId => {
        const animation = t.queue[animationId]
        processAnimation(animation, runState.timeForSeek, true)
      })
      runState.seekResolved = true
    } else if (runState.complete) {
      resetTimeline(t)
      if (!t.config.loop) {
        delete queuedTimelines[t.id]
      }
    } else {
      if (runState.playFromSeek) {
        runState.startTime = time - runState.timeForSeek
        delete runState.seek
        delete runState.seekResolved
        delete runState.timeForSeek
        delete runState.playFromSeek
      } else {
        runState.startTime =
          runState.startTime != null ? runState.startTime : time
      }

      if (runState.paused) {
        if (runState.startTime != null && runState.prevTime != null) {
          runState.startTime += time - runState.prevTime
        }
      } else {
        Object.keys(t.queue).forEach(animationId => {
          const animation = t.queue[animationId]
          processAnimation(animation, time - runState.startTime)
        })
      }
      if (time - runState.startTime >= t.executionEnd) {
        runState.complete = true
        if (t.config.onComplete) {
          t.config.onComplete(time)
        }
      }
      runState.prevTime = time
    }
  })

  frameListeners.forEach(listener => {
    listener(time)
  })
}

const ensureRafIsRunning = () => {
  if (currentFrame != null) {
    // We are already running the raf. Move along.
    return
  }
  const loop = time => {
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

const emptyAnimation = {
  play: () => Promise.resolve(),
  pause: () => undefined,
  seek: () => undefined,
  dispose: () => undefined,
}

export const animate = (animations = [], config = {}) => {
  config = Object.assign({}, defaultConfig, config)
  const t = createTimeline(animations)
  t.config = config
  if (t.executionEnd <= 0) {
    return emptyAnimation
  }
  const play = () => {
    if (queuedTimelines[t.id]) {
      if (t.runState) {
        if (t.runState.paused) {
          t.runState.paused = false
        } else if (t.runState.complete) {
          resetTimeline(t)
        } else if (t.runState.seek) {
          t.runState.playFromSeek = true
        }
      }
    } else {
      queuedTimelines[t.id] = t
    }
    ensureRafIsRunning()
  }
  return {
    play,
    pause: () => {
      t.runState = t.runState || {}
      t.runState.paused = true
    },
    seek: percentage => {
      t.runState = t.runState || {}
      t.runState.seek = percentage
      t.runState.seekResolved = false
      resetTimelineAnimations(t)
      queuedTimelines[t.id] = t
      ensureRafIsRunning()
    },
    dispose: () => unqueueTimeline(t.id),
  }
}

export const addFrameListener = fn => {
  frameListeners = [...frameListeners, fn]
}

export const removeFrameListener = fn => {
  frameListeners = frameListeners.filter(x => x !== fn)
}
