/* @flow */
/* eslint-disable no-param-reassign */

import type {
  Animation,
  AnimationDefinition,
  Timeline,
  TimelineAPI,
  TimelineQueue,
  TimelineConfig,
} from './types'
import * as Animations from './animations'

let timelineIdx = 0

// Maintains a list of timelines that have been queued to "executed"
let queuedTimelines: TimelineQueue = {}

const defaultConfig: TimelineConfig = {
  loop: false,
}

const defaultState = {
  initializedAnimations: false,
  complete: false,
  executionTime: undefined,
  paused: false,
  prevTime: undefined,
  startTime: undefined,
}

const queue = t => {
  queuedTimelines[t.id.toString()] = t
}

const unqueue = t => {
  delete queuedTimelines[t.id.toString()]
}

export const unqueueAll = () => {
  queuedTimelines = {}
}

const isTimeline = x => typeof x === 'object' && Array.isArray(x.animations)

const resetTimeline = t => {
  t = Object.assign(t, defaultState)
  t.animations.forEach(Animations.reset)
}

export const create = (
  animation: AnimationDefinition | Timeline,
): TimelineAPI => {
  timelineIdx += 1
  const timeline: Timeline = Object.assign(
    {},
    {
      id: timelineIdx,
      animations: [],
      config: Object.assign({}, defaultConfig),
    },
    defaultState,
  )
  const api = {}
  const add = newAnimation => {
    timeline.animations.push(
      isTimeline(newAnimation) ? newAnimation : Animations.create(newAnimation),
    )
    return api
  }

  add(animation)

  Object.assign(api, {
    add,
    play: (config = {}) => {
      timeline.config = Object.assign({}, timeline.config, config)
      if (timeline.paused) {
        timeline.paused = false
      } else if (timeline.complete) {
        resetTimeline(timeline)
      }
      queue(timeline)
      return api
    },
    pause: () => {
      timeline.paused = true
      return api
    },
    stop: () => {
      unqueue(timeline)
      return api
    },
  })

  return api
}

export const process = (time: number) => {
  Object.keys(queuedTimelines).forEach(id => {
    const timeline = queuedTimelines[id]
    if (timeline.complete) {
      return
    }
    if (!timeline.initializedAnimations) {
      let relativeExecutionTime = 0
      timeline.animations
        .map(Animations.initialize)
        .forEach((animation: Animation) => {
          if (animation.absoluteOffset != null) {
            animation.executionOffset = animation.absoluteOffset
            return
          }
          let executionOffset =
            relativeExecutionTime +
            (animation.relativeOffset != null ? animation.relativeOffset : 0)
          if (executionOffset < 0) {
            executionOffset = 0
          }
          animation.executionOffset = executionOffset /*?*/
          relativeExecutionTime =
            animation.executionOffset + animation.longestTweenDuration
        })
      timeline.initializedAnimations = true
    }
    if (timeline.startTime == null) {
      timeline.startTime = time
      if (timeline.config.onStart != null) {
        timeline.config.onStart()
      }
    }
    if (timeline.paused) {
      if (timeline.startTime != null && timeline.prevTime != null) {
        timeline.startTime += time - timeline.prevTime
      }
    } else {
      timeline.executionTime = Math.round(time - timeline.startTime)
      timeline.animations.forEach(animation => {
        if (animation.complete) {
          return
        }
        if (timeline.executionTime >= animation.executionOffset) {
          Animations.process(animation, time)
        }
      })
    }
    timeline.prevTime = time
    timeline.complete = timeline.animations.every(a => a.complete)
    if (timeline.complete) {
      if (timeline.config.onComplete) {
        timeline.config.onComplete()
      }
      if (timeline.config.loop) {
        resetTimeline(timeline)
      }
    }
  })
}
