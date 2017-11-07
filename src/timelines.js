/* @flow */
/* eslint-disable no-param-reassign */

import * as Animations from './animations'
import { animate } from './index'

let timelineIdx = 0

// Maintains a list of timelines that have been queued to "executed"
let queuedTimelines = {}

const defaultConfig = {
  loop: false,
}

const queue = t => {
  queuedTimelines[t.id] = t
}

const unqueue = t => {
  delete queuedTimelines[t.id]
}

export const unqueueAll = () => {
  queuedTimelines = {}
}

const isPaused = t => t.state.paused

const unpause = t => {
  t.state.paused = false
}

const isComplete = t => t.state.complete

const isTimeline = x => typeof x === 'object' && typeof x.queue === 'object'

const resetTimeline = t => {
  t.state = {}
  t.animations.forEach(a => {
    a.state = {}
  })
}

export const create = (config = {}) => {
  timelineIdx += 1
  const timeline = {
    id: timelineIdx,
    animations: [],
    config: Object.assign({}, defaultConfig, config),
    state: {},
  }

  const api = {
    add: animation => {
      timeline.animations.push(
        isTimeline(animation) ? animation : Animations.initialize(animation),
      )
      return api
    },
    play: () => {
      if (isPaused(timeline)) {
        unpause(timeline)
      } else if (isComplete(timeline)) {
        resetTimeline(timeline)
      }
      queue(timeline)
    },
    pause: () => {
      timeline.state.paused = true
    },
    stop: () => unqueue(timeline),
  }

  return api
}

export const single = animation => create().add(animation)

export const process = (time: number) => {
  Object.keys(queuedTimelines).forEach(id => {
    const timeline = queuedTimelines[id]
    if (isComplete(timeline)) {
      return
    }
    if (timeline.state.startTime == null && timeline.config.onStart != null) {
      timeline.config.onStart()
    }
    timeline.state.startTime =
      timeline.state.startTime != null ? timeline.state.startTime : time
    if (timeline.state.paused) {
      if (timeline.state.startTime != null && timeline.state.prevTime != null) {
        timeline.state.startTime += time - timeline.state.prevTime
      }
    } else {
      timeline.executionTime = time - timeline.state.startTime
      timeline.animations.forEach((animation, i) => {
        if (animation.state.complete) {
          return
        }
        if (
          animation.absoluteOffset != null &&
          time - timeline.state.startTime >= animation.absoluteOffset
        ) {
          Animations.process(animation, time)
        } else {
          let execute = true
          if (animation.state.startTime == null) {
            for (let x = 0; x < i; x += 1) {
              const y = timeline.animations[x]
              if (!y.isAbsoluteOffset && !y.state.complete) {
                execute = false
                break
              }
            }
          }
          if (execute) {
            Animations.process(animation, time)
          }
        }
      })
    }
    timeline.state.prevTime = time
    timeline.state.complete = timeline.animations.every(a => a.state.complete)
    if (timeline.state.complete) {
      if (timeline.config.onComplete) {
        timeline.config.onComplete()
      }
      if (timeline.config.loop) {
        resetTimeline(timeline)
      }
    }
  })
}
