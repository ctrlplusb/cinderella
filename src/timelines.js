/* @flow */
/* eslint-disable no-param-reassign */

import type {
  AnimationDefinition,
  Time,
  Timeline,
  TimelineAPI,
  TimelineQueue,
  TimelineConfig,
  Tween,
  TweenRunValue,
} from './types'
import * as Easings from './easings'
import * as Targets from './targets'
import * as Utils from './utils'

let timelineIdIdx = 0
let targetIdIdx = 0
let animationIdIdx = 0

// Maintains a list of timelines that have been queued to "executed"
let queuedTimelines: TimelineQueue = {}

const defaultConfig: TimelineConfig = {
  direction: 'normal',
  loop: false,
  speed: 1,
}

const timelineDefaultRunState = {
  complete: false,
  executionTime: undefined,
  paused: false,
  startTime: undefined,
  unpause: false,
}

const queue = t => {
  queuedTimelines[t.id.toString()] = t
}

const unqueue = t => {
  delete queuedTimelines[t.id.toString()]
}

export const unqueueAll = () => {
  Object.keys(queuedTimelines).forEach(id => {
    delete queuedTimelines[id]
  })
  queuedTimelines = {}
}

const setDefaultState = t => {
  t = Object.assign(t, timelineDefaultRunState)
  t.tweens.forEach(tween => {
    tween.complete = false
  })
  return t
}

const setLoopIndex = t => {
  t.loopIndex = typeof t.config.loop === 'number' ? t.config.loop : undefined
  return t
}

const relativeOffsetRegex = /^([+-]=)([0-9]+)$/

const resolveRelativeOffset = (offset: string): number | void => {
  const match = relativeOffsetRegex.exec(offset)
  if (!match) {
    return undefined
  }
  const operator = match[1]
  const offsetValue = match[2]
  if (operator === '-=') {
    return offsetValue * -1
  }
  return offsetValue
}

const getResolver = (animation, transform, type) => {
  const { defaults } = animation
  return transform[type] != null
    ? transform[type]
    : defaults && defaults[type] != null ? defaults[type] : undefined
}

const processTween = (
  timeline: Timeline,
  tween: Tween,
  executionTime: Time,
): TweenRunValue | void => {
  if (tween.complete || executionTime < tween.executionStart) {
    return undefined
  }
  if (executionTime >= tween.executionEnd) {
    tween.complete = true
  }
  const baseRunTime =
    executionTime > tween.executionEnd
      ? tween.duration
      : executionTime - tween.executionStart
  const tweenRunTime = timeline.reverse
    ? tween.duration - baseRunTime
    : baseRunTime

  const easingResult = Utils.toInt(
    Easings[tween.easing](
      tweenRunTime,
      tween.from.number,
      tween.diff,
      tween.duration,
    ),
  )
  return {
    targetId: tween.targetId,
    prop: tween.prop,
    propOrder: tween.propOrder,
    value: Object.assign({}, tween.to, {
      number: easingResult,
    }),
  }
}

const ensureInitialized = timeline => {
  if (timeline.initialized) {
    return
  }
  let propOrderIdx = 0
  const negOne = Utils.scaleUp(-1)
  const posOne = Utils.scaleUp(1)
  let timelineExecutionTime: number = negOne
  timeline.definitions.forEach((definition: AnimationDefinition) => {
    const { defaults } = definition
    let animationExecutionTime: number = timelineExecutionTime
    const isAbsolute = typeof definition.offset === 'number'
    if (isAbsolute) {
      animationExecutionTime = Utils.scaleUp(definition.offset)
    }
    if (typeof definition.offset === 'string') {
      const relativeOffset = resolveRelativeOffset(definition.offset)
      if (relativeOffset != null) {
        animationExecutionTime += Utils.scaleUp(relativeOffset)
        if (animationExecutionTime < negOne) {
          animationExecutionTime = negOne
        }
      }
    }
    // We set up an animation object for useful tracking
    animationIdIdx += 1
    const animation = {
      id: animationIdIdx,
      startTime: Infinity,
      endTime: -Infinity,
    }
    // We create a tween per target due to the resolvers being able to
    // resolve values based on target data/idx/length
    const targets = Targets.resolveTargets(definition)
    targets.forEach((target, targetIdx) => {
      targetIdIdx += 1
      timeline.targets[targetIdIdx.toString()] = {
        target,
        idx: targetIdx,
        length: targets.length,
      }
      Object.keys(definition.transform).forEach(propName => {
        let propExecutionOffset = animationExecutionTime
        const createTween = (
          propName,
          transform,
          transformIdx = 0,
          prev,
        ): Tween => {
          const delayResolver = getResolver(definition, transform, 'delay')
          const durationResolver = getResolver(
            definition,
            transform,
            'duration',
          )
          const easingResolver = getResolver(definition, transform, 'easing')
          const delay: number = Utils.scaleUp(
            (typeof delayResolver === 'function'
              ? delayResolver(target, targetIdx, targets.length)
              : typeof delayResolver === 'number' ? delayResolver : 0) +
              (definition.delay || 0),
          )
          const duration: number =
            Utils.scaleUp(
              typeof durationResolver === 'function'
                ? durationResolver(target, targetIdx, targets.length)
                : typeof durationResolver === 'number' ? durationResolver : 0,
            ) / timeline.config.speed
          const executionStart: number = propExecutionOffset + delay + posOne
          const easing: string =
            typeof easingResolver === 'function'
              ? easingResolver(target, targetIdx, targets.length)
              : typeof easingResolver === 'string' ? easingResolver : 'linear'
          const fromResolver =
            transform.from != null
              ? transform.from
              : defaults && defaults.from != null ? defaults.from : undefined
          const toResolver =
            transform.to != null
              ? transform.to
              : defaults && defaults.to != null ? defaults.to : undefined
          const from =
            prev != null
              ? prev.to
              : typeof fromResolver === 'function'
                ? Targets.extractValue(
                    target,
                    propName,
                    fromResolver(target, targetIdx, targets.length),
                  )
                : Targets.extractValue(target, propName, fromResolver)
          const to =
            typeof toResolver === 'function'
              ? Targets.extractValue(
                  target,
                  propName,
                  toResolver(target, targetIdx, targets.length),
                )
              : Targets.extractValue(target, propName, toResolver)
          if (to == null || from == null) {
            throw new Error('Invalid/missing from/to data on transform')
          }
          if (from.unit == null) {
            from.unit = to.unit
          }
          if (from.unit !== to.unit) {
            // eslint-disable-next-line no-console
            console.warn(
              `Mixed units from from/to of ${propName}. from: ${from.unit ||
                ''}, to: "${to.unit || ''}"`,
            )
          }
          propOrderIdx += 1
          const tween = {
            animationId: animationIdIdx,
            complete: false,
            delay,
            diff: to.number - from.number,
            duration,
            easing,
            executionStart,
            executionEnd: executionStart + duration,
            from,
            prop: propName,
            propOrder: propOrderIdx,
            targetId: targetIdIdx.toString(),
            to,
          }
          // We set this so that the next prop "keyframe" will be directly
          // relative in execution to the previous "keyframe"
          propExecutionOffset = tween.executionEnd
          // If this is not an absolute definition then we need to make sure
          // that we track the end of last running tween so that subsequent
          // definitions execute relatively to the end of this definition.
          if (!isAbsolute && tween.executionEnd > timelineExecutionTime) {
            timelineExecutionTime = tween.executionEnd
          }
          if (tween.executionStart < animation.startTime) {
            animation.startTime = tween.executionStart
          }
          if (tween.executionEnd > animation.endTime) {
            animation.endTime = tween.executionEnd
          }
          return tween
        }
        const propTransform = definition.transform[propName]
        const tweens = Array.isArray(propTransform)
          ? propTransform.reduce(
              (acc, transform, transformIdx) => {
                const tween = createTween(
                  propName,
                  transform,
                  transformIdx,
                  acc.prev,
                )
                acc.tweens.push(tween)
                acc.prev = tween
                return acc
              },
              {
                tweens: [],
                prev: null,
              },
            ).tweens
          : typeof propTransform === 'object'
            ? [createTween(propName, propTransform)]
            : []
        tweens.forEach(tween => {
          timeline.tweens.push(tween)
        })
      })
    })
    timeline.animations[animationIdIdx.toString()] = animation
    if (animation.endTime > timeline.endTime) {
      timeline.endTime = animation.endTime
    }
  })
  timeline.initialized = true
}

const runTimeline = (timeline: Timeline, time: Time = 0) => {
  if (timeline.complete) {
    return
  }
  ensureInitialized(timeline)
  if (timeline.unpause) {
    if (timeline.startTime) {
      timeline.startTime = time - (timeline.executionTime || 0)
    }
    timeline.unpause = false
    timeline.paused = false
  }
  if (
    timeline.seek == null &&
    timeline.startTime == null &&
    timeline.executionTime == null
  ) {
    // No seeking has occurred, the timeline is starting naturally
    timeline.startTime = time
    if (timeline.config.onStart != null) {
      timeline.config.onStart()
    }
  } else if (timeline.startTime == null && timeline.executionTime != null) {
    // We have seeked to this point
    timeline.startTime = time - timeline.executionTime
  }
  if (timeline.reverse && timeline.reversed == null) {
    timeline.reversed = timeline.tweens.reverse()
  }
  if (!timeline.paused) {
    timeline.executionTime =
      timeline.seek != null ? timeline.seek : time - timeline.startTime
    const targetsValues = timeline[timeline.reverse ? 'reversed' : 'tweens']
      .map(tween => processTween(timeline, tween, timeline.executionTime))
      .filter(x => x != null)
      .sort((a, b) => a.propOrder - b.propOrder)
      .reduce((acc, tweenValue) => {
        if (tweenValue == null) {
          return acc
        }
        const { targetId, prop, value } = tweenValue
        if (acc[targetId] == null) {
          acc[targetId] = {}
        }
        acc[targetId][prop] = value
        return acc
      }, {})
    Object.keys(targetsValues).forEach(targetId => {
      const { target } = timeline.targets[targetId]
      const values = targetsValues[targetId]
      Targets.setValuesOnTarget(target, values)
    })
  }

  if (timeline.config.onUpdate) {
    timeline.config.onUpdate({
      progress: 100 / timeline.endTime * timeline.executionTime,
    })
  }

  if (timeline.seek == null) {
    timeline.complete = timeline.executionTime >= timeline.endTime
    if (timeline.complete) {
      if (timeline.config.onComplete) {
        timeline.config.onComplete()
      }
      if (timeline.config.loop) {
        if (typeof timeline.loopIndex === 'number') {
          timeline.loopIndex -= 1
          if (timeline.loopIndex < 0) {
            return
          }
        }
        setDefaultState(timeline)
        if (timeline.config.direction === 'alternate') {
          timeline.reverse = !timeline.reverse
        }
      }
    }
  } else {
    timeline.seek = undefined
  }
}

export const run = (t: number) => {
  const time = Utils.scaleUp(t)
  Object.keys(queuedTimelines).forEach(id => {
    const timeline = queuedTimelines[id]
    runTimeline(timeline, time)
  })
}

export const create = (config?: TimelineConfig): TimelineAPI => {
  timelineIdIdx += 1
  const resolvedConfig = Object.assign({}, defaultConfig, config || {})
  const timeline: Timeline = setLoopIndex(
    setDefaultState({
      animations: {},
      config: resolvedConfig,
      definitions: [],
      endTime: 0,
      id: timelineIdIdx,
      initialized: false,
      reverse: resolvedConfig.direction === 'reverse',
      reversed: undefined,
      targets: {},
      tweens: [],
    }),
  )
  const api = {}
  Object.assign(api, {
    add: animation => {
      timeline.definitions.push(animation)
      return api
    },
    play: () => {
      if (timeline.paused) {
        timeline.unpause = true
      } else if (timeline.complete) {
        setDefaultState(timeline)
        setLoopIndex(timeline)
      }
      queue(timeline)
      return api
    },
    pause: () => {
      timeline.paused = true
      return api
    },
    seek: perc => {
      setDefaultState(timeline)
      ensureInitialized(timeline)
      const targetPerc = perc < 0 ? 0 : perc > 100 ? 100 : perc
      timeline.seek = timeline.endTime / 100 * targetPerc
      runTimeline(timeline)
      return api
    },
    seekTime: time => {
      setDefaultState(timeline)
      ensureInitialized(timeline)
      const endTime = Utils.scaleUp(timeline.endTime)
      const scaledTime = Utils.scaleUp(time)
      timeline.seek = time < 0 ? 0 : scaledTime > endTime ? endTime : scaledTime
      runTimeline(timeline)
      return api
    },
    stop: () => {
      unqueue(timeline)
      return api
    },
  })
  return api
}
