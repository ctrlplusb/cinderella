/* @flow */
/* eslint-disable no-param-reassign */

import type {
  AnimationDefinition,
  EasingFn,
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

let timelineIdIdx = 0
let targetIdIdx = 0
let animationIdIdx = 0

// Maintains a list of timelines that have been queued to "executed"
let queuedTimelines: TimelineQueue = {}

const toPrecision = (number: number, precision = 4): number =>
  parseFloat(number.toFixed(precision))

const defaultConfig: TimelineConfig = {
  loop: false,
}

const timelineDefaultState = {
  animations: {},
  complete: false,
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
  let timelineExecutionTime: number = -1
  timeline.definitions.forEach((definition: AnimationDefinition) => {
    const { transformDefaults } = definition
    let animationExecutionTime: number = timelineExecutionTime
    const isAbsolute = typeof definition.offset === 'number'
    if (isAbsolute) {
      animationExecutionTime = definition.offset - 1
    }
    if (typeof definition.offset === 'string') {
      const relativeOffset = resolveRelativeOffset(definition.offset)
      if (relativeOffset != null) {
        animationExecutionTime += relativeOffset
        if (animationExecutionTime < -1) {
          animationExecutionTime = -1
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
          const delay: number =
            typeof delayResolver === 'function'
              ? delayResolver(target, targetIdx, targets.length)
              : typeof delayResolver === 'number'
                ? delayResolver
                : 0 + (definition.delay || 0)
          const duration: number =
            typeof durationResolver === 'function'
              ? durationResolver(target, targetIdx, targets.length)
              : typeof durationResolver === 'number' ? durationResolver : 0
          const executionStart: number = propExecutionOffset + delay + 1
          const easing: string =
            typeof easingResolver === 'function'
              ? easingResolver(target, targetIdx, targets.length)
              : typeof easingResolver === 'string' ? easingResolver : undefined
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
            easing: easing || definition.easing || 'linear',
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
            useNormalisedEasing: definition.easing != null && easing == null,
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
    return undefined
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
  const animation = timeline.animations[tween.animationId]
  // The below normalises our values so we can resolve a value that will
  // be correctly relative to the easing function that is being applied
  // across all of the values.
  if (tween.useNormalisedEasing && tween.normalisedFromNumber == null) {
    const animDurationPerc = (animation.endTime - animation.startTime) / 100
    const preRunDuration = tween.executionStart - animation.startTime
    const postRunDuration = animation.endTime - tween.executionEnd
    const prePercentage = preRunDuration / animDurationPerc
    const postPercentage = postRunDuration / animDurationPerc
    const runPercentage = 100 - prePercentage - postPercentage
    const val = Math.abs(tween.diff) / runPercentage
    const beforeBuffer = toPrecision(prePercentage * val)
    const postBuffer = toPrecision(postPercentage * val)
    tween.normalisedFromNumber =
      tween.from.number < tween.to.number
        ? tween.from.number - beforeBuffer
        : tween.from.number + beforeBuffer
    tween.normalisedToNumber =
      tween.to.number > tween.from.number
        ? tween.to.number + postBuffer
        : tween.to.number - postBuffer
    tween.normalisedDiff = tween.normalisedToNumber - tween.normalisedFromNumber
  }
  const easingFn: EasingFn = Easings[tween.easing]
  const runDuration = tween.useNormalisedEasing
    ? tweenRunTime + (tween.executionStart - animation.startTime)
    : tweenRunTime
  const from = tween.useNormalisedEasing
    ? tween.normalisedFromNumber
    : tween.from.number
  const diff = tween.useNormalisedEasing ? tween.normalisedDiff : tween.diff
  const duration = tween.useNormalisedEasing
    ? animation.endTime - animation.startTime
    : tween.duration
  const easingResult = easingFn(
    toPrecision(runDuration),
    from,
    diff,
    toPrecision(duration),
  )
  return {
    targetId: tween.targetId,
    prop: tween.prop,
    value: Object.assign({}, tween.to, {
      number: easingResult,
    }),
  }
}
export const process = (time: number) => {
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
    timeline.complete = timeline.tweens.every(a => a.complete)
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
