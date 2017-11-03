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
  duration = 0,
  easing = 'linear',
  onUpdate = () => undefined,
  ...rest
}) => ({
  delay,
  duration,
  easing,
  easingFn: Easings[easing],
  onUpdate,
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

  if (state.runDuration == null) {
    state.runDuration = anim.duration

    if (Array.isArray(state.toValue)) {
      state.toValue.forEach((v, i) => {
        let valueDuration = 0
        if (typeof v === 'object') {
          v.state = v.state != null ? v.state : {}
          v.state = {
            runDuration: v.duration || 0,
            delay: v.delay || 0,
            diff: v.value - state.fromValue[i],
          }
          valueDuration = v.state.runDuration + v.state.delay
        } else {
          valueDuration = anim.duration
        }
        state.runDuration =
          valueDuration > state.runDuration ? valueDuration : state.runDuration
      })
    }
  }

  state.diff =
    state.diff != null
      ? state.diff
      : Array.isArray(state.toValue)
        ? state.toValue.map((x, idx) => x - state.fromValue[idx])
        : state.toValue - state.fromValue

  state.complete = time >= state.startTime + state.runDuration + anim.delay

  if (state.complete) {
    anim.onUpdate(
      Array.isArray(state.toValue)
        ? state.toValue.map(x => (typeof x === 'object' ? x.value : x))
        : state.toValue,
      state.prevValue,
    )
    if (anim.onComplete) {
      anim.onComplete()
    }
  } else {
    const timePassed = time - state.startTime + anim.delay
    const newValue = Array.isArray(state.toValue)
      ? state.toValue.map((x, idx) => {
          if (typeof x === 'object') {
            if (x.state.delay > timePassed) {
              return state.fromValue[idx]
            } else if (x.state.runDuration < timePassed) {
              return x.value
            }
            // The below normalises the value so we can apply the delayed
            // value to the same easing function and get an expected uniform
            // easing across all of the concurrent values.
            if (x.state.bufferredFrom == null) {
              const animDurPerc = state.runDuration / 100
              const postRunDuration =
                state.runDuration - x.state.runDuration - x.state.delay

              const prePercentage = x.state.delay / animDurPerc
              const runPercentage = x.state.runDuration / animDurPerc
              const postPercentage =
                postRunDuration > 0.001 ? postRunDuration / animDurPerc : 0

              const val = Math.abs(x.state.diff) / runPercentage
              const beforeBuffer = prePercentage * val
              const postBuffer = postPercentage * val

              x.state.bufferredFrom = state.fromValue[idx] - beforeBuffer
              x.state.diff = x.value + postBuffer - x.state.bufferredFrom
            }
            return anim.easingFn(
              timePassed,
              x.state.bufferredFrom,
              x.state.diff,
              state.runDuration,
            )
          }
          return anim.easingFn(
            timePassed,
            state.fromValue[idx],
            state.diff[idx],
            state.runDuration,
          )
        })
      : anim.easingFn(
          time - state.startTime,
          state.fromValue,
          state.diff,
          state.runDuration,
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
