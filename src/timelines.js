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
  loop: false,
}

const timelineDefaultState = {
  animations: {},
  complete: false,
  endTime: 0,
  executionTime: undefined,
  initializedTweens: false,
  paused: false,
  prevTime: undefined,
  startTime: undefined,
  targets: {},
  tweens: [],
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

const resetTimeline = t => {
  t = Object.assign(t, timelineDefaultState)
  t.tweens.forEach(tween => {
    tween.complete = false
    tween.diff = undefined
    tween.from = undefined
    tween.to = undefined
  })
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
  const { transformDefaults } = animation
  return transform[type] != null
    ? transform[type]
    : transformDefaults && transformDefaults[type] != null
      ? transformDefaults[type]
      : undefined
}

const createTweens = (timeline: Timeline) => {
  const negOne = Utils.scaleUp(-1)
  const posOne = Utils.scaleUp(1)
  let timelineExecutionTime: number = negOne
  timeline.definitions.forEach((definition: AnimationDefinition) => {
    const { transformDefaults } = definition
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
        const createTween = (propName, transform, transformIdx = 0): Tween => {
          const delayResolver = getResolver(definition, transform, 'delay')
          const durationResolver = getResolver(
            definition,
            transform,
            'duration',
          )
          const easingResolver = getResolver(definition, transform, 'easing')
          const delay: number = Utils.scaleUp(
            typeof delayResolver === 'function'
              ? delayResolver(target, targetIdx, targets.length)
              : typeof delayResolver === 'number'
                ? delayResolver
                : 0 + (definition.delay || 0),
          )
          const duration: number = Utils.scaleUp(
            typeof durationResolver === 'function'
              ? durationResolver(target, targetIdx, targets.length)
              : typeof durationResolver === 'number' ? durationResolver : 0,
          )
          const executionStart: number = propExecutionOffset + delay + posOne
          const easing: string =
            typeof easingResolver === 'function'
              ? easingResolver(target, targetIdx, targets.length)
              : typeof easingResolver === 'string' ? easingResolver : 'linear'
          const toResolver =
            transform.to != null
              ? transform.to
              : transformDefaults && transformDefaults.to != null
                ? transformDefaults.to
                : undefined
          if (toResolver == null) {
            throw new Error('Invalid/missing "to" on transform')
          }
          const tween = {
            animationId: animationIdIdx,
            complete: false,
            delay,
            duration,
            easing,
            executionStart,
            executionEnd: executionStart + duration,
            fromResolver:
              transform.from != null
                ? transform.from
                : transformDefaults && transformDefaults.from != null
                  ? transformDefaults.from
                  : undefined,
            prop: propName,
            targetId: targetIdIdx.toString(),
            toResolver,
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
          ? propTransform.map((transform, transformIdx) =>
              createTween(propName, transform, transformIdx),
            )
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
    // return undefined
  }
  const tweenRunTime =
    executionTime > tween.executionEnd
      ? tween.duration
      : executionTime - tween.executionStart
  const { target, idx: targetIdx, length: targetsLength } = timeline.targets[
    tween.targetId
  ]
  // Resolve the to/from/diff values for the tween
  if (tween.to == null || tween.from == null || tween.diff == null) {
    if (tween.fromResolver == null) {
      tween.from = Targets.getValueFromTarget(target, tween.prop)
    } else {
      tween.from =
        typeof tween.fromResolver === 'function'
          ? Targets.extractValue(
              target,
              tween.prop,
              tween.fromResolver(target, targetIdx, targetsLength),
            )
          : Targets.extractValue(target, tween.prop, tween.fromResolver)
    }
    tween.to =
      typeof tween.toResolver === 'function'
        ? Targets.extractValue(
            target,
            tween.prop,
            tween.toResolver(target, targetIdx, targetsLength),
          )
        : Targets.extractValue(target, tween.prop, tween.toResolver)
    if (tween.to == null) {
      // Do nothing as we have no destination value
      return undefined
    }
    if (tween.from == null) {
      tween.from = Targets.getDefaultFromValue(target, tween.prop, tween.to)
    }
    if (tween.from == null) {
      // Do nothing as we have no source value
      return undefined
    }
    if (tween.from.unit !== tween.to.unit) {
      // eslint-disable-next-line no-console
      console.warn(
        `Mixed units from from/to of ${tween.prop}. from: ${tween.from.unit ||
          ''}, to: "${tween.to.unit || ''}"`,
      )
    }
    tween.diff = tween.to.number - tween.from.number
  }
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
    value: Object.assign({}, tween.to, {
      number: easingResult,
    }),
  }
}
export const process = (t: number) => {
  const time = Utils.scaleUp(t)
  Object.keys(queuedTimelines).forEach(id => {
    const timeline = queuedTimelines[id]
    if (timeline.complete) {
      return
    }
    if (!timeline.initializedTweens) {
      createTweens(timeline)
      timeline.initializedTweens = true
    }
    if (timeline.startTime == null) {
      timeline.startTime = time
      if (timeline.config.onStart != null) {
        timeline.config.onStart()
      }
    }
    if (timeline.paused && timeline.startTime != null) {
      timeline.startTime += time - timeline.startTime
    } else {
      timeline.executionTime = time - timeline.startTime
      const targetsValues = timeline.tweens
        .map(tween => processTween(timeline, tween, timeline.executionTime))
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
    timeline.prevTime = time
    if (timeline.config.onFrame) {
      timeline.config.onFrame()
    }
    timeline.complete = timeline.executionTime >= timeline.endTime
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
export const create = (config?: TimelineConfig): TimelineAPI => {
  timelineIdIdx += 1
  const timeline: Timeline = Object.assign(
    {},
    {
      config: Object.assign({}, defaultConfig, config || {}),
      definitions: [],
      id: timelineIdIdx,
    },
    timelineDefaultState,
  )
  const api = {}
  Object.assign(api, {
    add: animation => {
      timeline.definitions.push(animation)
      return api
    },
    play: () => {
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
