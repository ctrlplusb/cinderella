/* eslint-disable no-param-reassign */

import * as Easings from './easings'

let timelineIdx = 0

// Maintains a list of timelines that have been queued to "executed"
const queuedTimelines = {}

// Maintains a list of frame listeners
let frameListeners = []

// Represents the currently executing raf frame
let currentFrame = null

const defaultTimelineConfig = {
  loop: false,
}

export const isTimeline = x =>
  typeof x === 'object' && x.id != null && typeof x.queue === 'object'

const applyAnimationDefaults = ({
  delay = 0,
  duration = 1000,
  easing = 'linear',
  ...rest
}) => ({
  delay,
  duration,
  easing,
  easingFn: Easings[easing],
  state: {},
  ...rest,
})

const initializeAnimation = animation => {
  if (isTimeline(animation)) {
    return animation
  }
  animation = applyAnimationDefaults(animation)
  if (typeof animation.offset === 'number') {
    animation.absoluteOffset = animation.offset
  } else if (
    typeof animation.offset === 'string' &&
    animation.offset.length > 3
  ) {
    const operator = animation.offset.substr(0, 2)
    const value = parseInt(animation.offset.substr(2), 10)
    if (operator === '-=') {
      animation.relativeOffset = value * -1
    } else if (operator === '+=') {
      animation.relativeOffset = value
    } else {
      throw new Error(`Invalid relative offset "${animation.offset}"`)
    }
  }

  return animation
}

const createTimeline = (animations = [], config = {}) => {
  timelineIdx += 1
  return {
    id: timelineIdx,
    animations: Array.isArray(animations)
      ? animations.map(initializeAnimation)
      : [initializeAnimation(animations)],
    config: Object.assign({}, defaultTimelineConfig, config),
    state: {},
  }
}

const resetTimeline = t => {
  t.state = {}
  t.animations.forEach(a => {
    a.state = {}
  })
}

const processAnimation = (anim, time) => {
  const { state } = anim

  if (state.startTime == null && anim.onStart != null) {
    anim.onStart()
  }

  state.startTime = state.startTime != null ? state.startTime : time

  if (time - state.startTime < anim.delay) {
    return
  }

  state.fromValue =
    state.fromValue != null
      ? state.fromValue
      : typeof anim.from === 'function' ? anim.from() : anim.from

  state.toValue =
    state.toValue != null
      ? state.toValue
      : typeof anim.to === 'function' ? anim.to() : anim.to

  state.diff =
    state.diff != null
      ? state.diff
      : Array.isArray(state.toValue)
        ? state.toValue.map((x, idx) => x - state.fromValue[idx])
        : state.toValue - state.fromValue

  state.complete = time >= state.startTime + anim.duration + anim.delay

  if (state.complete) {
    anim.onUpdate(state.toValue, state.prevValue)
    if (anim.onComplete) {
      anim.onComplete()
    }
  } else {
    const timePassed = time - state.startTime
    const newValue = Array.isArray(state.fromValue)
      ? state.fromValue.map((x, idx) =>
          anim.easingFn(
            timePassed,
            state.fromValue[idx],
            state.diff[idx],
            anim.duration,
          ),
        )
      : anim.easingFn(
          time - state.startTime,
          state.fromValue,
          state.diff,
          anim.duration,
        )
    anim.onUpdate(newValue, state.prevValue)
    state.prevValue = newValue
  }
}

const onFrame = time => {
  Object.keys(queuedTimelines).forEach(timelineId => {
    const t = queuedTimelines[timelineId]
    const { state, config } = t
    if (state.complete) {
      return
    }
    if (state.startTime == null && config.onStart != null) {
      config.onStart()
    }
    state.startTime = state.startTime != null ? state.startTime : time
    if (state.paused) {
      if (state.startTime != null && state.prevTime != null) {
        state.startTime += time - state.prevTime
      }
    } else {
      t.executionTime = time - state.startTime
      t.animations.map(x => x.state.complete)
      t.animations.forEach((a, i) => {
        if (a.state.complete) {
          return
        }
        if (
          a.absoluteOffset != null &&
          time - state.startTime >= a.absoluteOffset
        ) {
          processAnimation(a, time)
        } else {
          let execute = true
          if (a.state.startTime == null) {
            for (let x = 0; x < i; x += 1) {
              const y = t.animations[x]
              if (!y.isAbsoluteOffset && !y.state.complete) {
                execute = false
                break
              }
            }
          }
          if (execute) {
            processAnimation(a, time)
          }
        }
      })
    }
    state.prevTime = time
    state.complete = t.animations.every(a => a.state.complete)
    if (state.complete) {
      if (config.onComplete) {
        config.onComplete()
      }
      if (config.loop) {
        resetTimeline(t)
      }
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

export const animate = (animations, config) => {
  const t = createTimeline(animations, config)
  const play = () => {
    if (queuedTimelines[t.id]) {
      if (t.state) {
        if (t.state.paused) {
          t.state.paused = false
        } else if (t.state.complete) {
          resetTimeline(t)
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
      t.state.paused = true
    },
    stop: () => unqueueTimeline(t.id),
  }
}

export const addFrameListener = fn => {
  frameListeners = [...frameListeners, fn]
}

export const removeFrameListener = fn => {
  frameListeners = frameListeners.filter(x => x !== fn)
}
