/* @flow */
/* eslint-disable no-param-reassign */

import * as Animations from './animations'

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
  t.animations.forEach(Animations.reset)
}

export const create = animation => {
  timelineIdx += 1
  const timeline = {
    id: timelineIdx,
    animations: [],
    config: defaultConfig,
    state: {},
  }

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
  })

  return api
}

export const process = (time: number) => {
  Object.keys(queuedTimelines).forEach(id => {
    const timeline = queuedTimelines[id]
    if (isComplete(timeline)) {
      return
    }
    if (!timeline.state.initializedAnimations) {
      let relativeExecutionTime = 0
      timeline.animations.map(Animations.initialize).forEach(animation => {
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
        animation.executionOffset = executionOffset
        relativeExecutionTime =
          animation.executionOffset + animation.longestTweenDuration
      })
      timeline.state.initializedAnimations = true
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
      timeline.state.executionTime = Math.round(time - timeline.state.startTime)
      timeline.animations.forEach(animation => {
        if (animation.complete) {
          return
        }
        if (timeline.state.executionTime >= animation.executionOffset) {
          Animations.process(animation, time)
        }
      })
    }
    timeline.state.prevTime = time
    timeline.state.complete = timeline.animations.every(a => a.complete)
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
