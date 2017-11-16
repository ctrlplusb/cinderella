/* @flow */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-continue */

import type {
  Animation,
  AnimationDefinition,
  EasingFn,
  Prop,
  Time,
} from './types'
import * as Easings from './easings'
import * as Targets from './targets'

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

export const create = (definition: AnimationDefinition): Animation => {
  const { transformDefaults } = definition
  const mapTransformDefinition = transformDefinition => ({
    delay:
      transformDefinition.delay != null
        ? transformDefinition.delay
        : transformDefaults && transformDefaults.delay != null
          ? transformDefaults.delay
          : 0,
    duration:
      transformDefinition.duration != null
        ? transformDefinition.duration
        : transformDefaults && transformDefaults.duration != null
          ? transformDefaults.duration
          : 0,
    easing:
      transformDefinition.easing != null
        ? transformDefinition.easing
        : transformDefaults && transformDefaults.easing != null
          ? transformDefaults.easing
          : null,
    from:
      transformDefinition.from != null
        ? transformDefinition.from
        : transformDefaults && transformDefaults.from != null
          ? transformDefaults.from
          : null,
    to:
      transformDefinition.to != null
        ? transformDefinition.to
        : transformDefaults && transformDefaults.to != null
          ? transformDefaults.to
          : null,
  })
  return {
    absoluteOffset:
      typeof definition.offset === 'number' ? definition.offset : undefined,
    complete: false,
    delay: definition.delay || 0,
    easing: definition.easing || 'linear',
    onComplete: definition.onComplete,
    onStart: definition.onStart,
    onUpdate: definition.onUpdate,
    relativeOffset:
      typeof definition.offset === 'string'
        ? resolveRelativeOffset(definition.offset)
        : undefined,
    state: null,
    targets: definition.targets,
    transform: Object.keys(definition.transform).reduce(
      (transforms, propName) => {
        const transformDefinition = definition.transform[propName]
        if (Array.isArray(transformDefinition)) {
          transforms[propName] = transformDefinition.map(mapTransformDefinition)
        } else if (typeof transformDefinition === 'object') {
          transforms[propName] = [mapTransformDefinition(transformDefinition)]
        }
        return transforms
      },
      {},
    ),
  }
}

export const reset = (animation: Animation) => {
  animation.complete = false
  animation.delayValue = undefined
  animation.executionOffset = undefined
  animation.longestTweenDuration = undefined
  animation.startTime = undefined
  animation.resolvedTargets = undefined
  animation.tweens = undefined
}

export const initialize = (animation: Animation): Animation => {
  if (animation.tweens != null) {
    // already initialized
    return animation
  }
  const resolvedTargets = Targets.resolveTargets(animation)
  const props: Array<Prop> = Object.keys(animation.transform)
  const tweens = props.reduce((tweenAcc, propName) => {
    const definition = animation.transform[propName]
    tweenAcc[propName] = definition.reduce(
      (subTweenAcc, subTween) => {
        const initedSubTween = {
          bufferedFromNumber: resolvedTargets.map(() => null),
          bufferedDiff: resolvedTargets.map(() => null),
          complete: false,
          delay: resolvedTargets.map(
            (resolvedTarget, idx) =>
              subTweenAcc.prevFullDurations[idx] +
              (typeof subTween.delay === 'function'
                ? subTween.delay(resolvedTarget, idx, resolvedTargets.length)
                : subTween.delay),
          ),
          diff: resolvedTargets.map(() => null),
          duration: resolvedTargets.map(
            (resolvedTarget, idx) =>
              typeof subTween.duration === 'function'
                ? subTween.duration(resolvedTarget, idx, resolvedTargets.length)
                : subTween.duration,
          ),
          easing: resolvedTargets.map(
            (resolvedTarget, idx) =>
              typeof subTween.easing === 'function'
                ? subTween.easing(resolvedTarget, idx, resolvedTargets.length)
                : subTween.easing,
          ),
          from: subTween.from,
          fromValues: resolvedTargets.map(() => null),
          to: subTween.to,
          toValues: resolvedTargets.map(() => null),
        }
        resolvedTargets.forEach((_, idx) => {
          subTweenAcc.prevFullDurations[idx] += Math.floor(
            initedSubTween.duration[idx] + initedSubTween.delay[idx],
          )
        })
        subTweenAcc.subTweens.push(initedSubTween)
        return subTweenAcc
      },
      {
        subTweens: [],
        prevFullDurations: resolvedTargets.map(() => 0),
      },
    ).subTweens
    return tweenAcc
  }, {})
  let longestTweenDuration = 0
  props.forEach(prop => {
    tweens[prop].forEach(({ delay, duration }) => {
      resolvedTargets.forEach((_, idx) => {
        const tweenDuration = delay[idx] + duration[idx]
        longestTweenDuration =
          tweenDuration > longestTweenDuration
            ? tweenDuration
            : longestTweenDuration
      })
    })
  })
  animation.delayValue =
    typeof animation.delay === 'function' ? animation.delay() : animation.delay
  animation.longestTweenDuration = longestTweenDuration
  animation.resolvedTargets = resolvedTargets
  animation.tweens = tweens
  return animation
}

export const process = (animation: Animation, time: Time) => {
  // We first check to see if a start time has been registered, if not we consider
  // this the first run of the animation, therefore we want to do a whole bunch
  // of initial set up and do some basic resolving of some the lazy values for
  // tweens
  if (animation.startTime == null) {
    animation.startTime = time
    if (animation.onStart != null) {
      animation.onStart()
    }
  }

  const {
    startTime,
    longestTweenDuration,
    resolvedTargets,
    tweens,
    delayValue,
  } = animation
  if (
    startTime == null ||
    longestTweenDuration == null ||
    resolvedTargets == null ||
    tweens == null ||
    delayValue == null
  ) {
    throw new Error('Animation initialization failed')
  }

  // Wait for animation delay to have been satisfied
  const timePassed = time - startTime
  if (timePassed < delayValue) {
    return
  }

  // Run duration for the animation should not take into account the
  const animationRunDuration = timePassed - delayValue

  const propNames = Object.keys(tweens)
  const values = propNames.reduce((acc, propName) => {
    const propTweens = tweens[propName]
    const tweenCurrentValues = resolvedTargets.map(() => null)
    propTweens.forEach(tween => {
      if (tween.complete) {
        return
      }
      resolvedTargets.forEach((resolvedTarget, idx) => {
        if (animationRunDuration < tween.delay[idx]) {
          return
        }

        if (tween.startTime == null) {
          tween.startTime = time
        }

        tween.runDuration = time - tween.startTime

        // Resolve the to/from values for the tweens
        if (
          tween.toValues[idx] == null ||
          tween.fromValues[idx] == null ||
          tween.diff[idx] == null
        ) {
          if (tween.from == null) {
            tween.fromValues[idx] = Targets.getValueFromTarget(
              resolvedTarget,
              propName,
            )
          } else {
            tween.fromValues[idx] =
              typeof tween.from === 'function'
                ? Targets.extractValue(
                    resolvedTarget,
                    propName,
                    tween.from(resolvedTarget, idx, resolvedTargets.length),
                  )
                : Targets.extractValue(resolvedTarget, propName, tween.from)
          }
          tween.toValues[idx] =
            typeof tween.to === 'function'
              ? Targets.extractValue(
                  resolvedTarget,
                  propName,
                  tween.to(resolvedTarget, idx, resolvedTargets.length),
                )
              : Targets.extractValue(resolvedTarget, propName, tween.to)
          if (tween.toValues[idx] == null) {
            return
          }
          if (tween.fromValues[idx] == null) {
            tween.fromValues[idx] = Targets.getDefaultFromValue(
              resolvedTarget,
              propName,
              tween.toValues[idx],
            )
          }
          if (tween.fromValues[idx] == null) {
            return
          }
          if (tween.fromValues[idx].unit !== tween.toValues[idx].unit) {
            // eslint-disable-next-line no-console
            console.warn(
              `Mixed units from from/to of ${propName}. from: ${tween
                .fromValues[idx].unit || ''}, to: "${tween.toValues[idx].unit ||
                ''}"`,
            )
          }
          tween.diff[idx] =
            tween.toValues[idx].number - tween.fromValues[idx].number
        }

        // The below normalises our values so we can resolve a value that will
        // be correctly relative to the easing function that is being applied
        // across all of the values.
        if (
          tween.easing[idx] == null &&
          tween.duration[idx] + tween.delay[idx] !== animation.fullDuration &&
          tween.bufferedFromNumber[idx] == null
        ) {
          const animDurPerc = longestTweenDuration / 100
          const postRunDuration =
            longestTweenDuration - tween.duration[idx] - tween.delay[idx]
          const prePercentage = tween.delay[idx] / animDurPerc
          const runPercentage = tween.duration[idx] / animDurPerc
          const postPercentage =
            postRunDuration > 0.001 ? postRunDuration / animDurPerc : 0
          const val = Math.abs(tween.diff[idx]) / runPercentage
          const beforeBuffer = prePercentage * val
          const postBuffer = postPercentage * val
          tween.bufferedFromNumber[idx] =
            tween.fromValues[idx].number - beforeBuffer
          tween.bufferedDiff[idx] =
            tween.toValues[idx].number +
            postBuffer -
            tween.bufferedFromNumber[idx]
        }

        // If the time has passed the tween run time then we just use the "to"
        // as our value.
        if (
          tween.bufferedFromNumber[idx] != null
            ? animationRunDuration >= tween.duration[idx] + tween.delay[idx]
            : tween.runDuration >= tween.duration[idx]
        ) {
          tween.complete = true
          tweenCurrentValues[idx] = tween.toValues[idx]
        } else {
          const easingFn: EasingFn =
            Easings[tween.easing[idx] || animation.easing]
          const runDuration =
            tween.bufferedFromNumber[idx] != null
              ? animationRunDuration
              : time - tween.startTime
          const from =
            tween.bufferedFromNumber[idx] != null
              ? tween.bufferedFromNumber[idx]
              : tween.fromValues[idx].number
          const diff =
            tween.bufferedDiff[idx] != null
              ? tween.bufferedDiff[idx]
              : tween.diff[idx]
          const duration =
            tween.bufferedFromNumber[idx] != null
              ? animation.longestTweenDuration
              : tween.duration[idx]
          const easingResult = easingFn(runDuration, from, diff, duration)
          tweenCurrentValues[idx] = Object.assign({}, tween.toValues[idx], {
            number: easingResult,
          })
        }
      })
    })
    if (tweenCurrentValues.filter(x => x != null).length > 0) {
      acc[propName] = tweenCurrentValues
    }
    return acc
  }, {})

  animation.complete = propNames.every(propName =>
    tweens[propName].every(tween => tween.complete),
  )

  resolvedTargets.forEach((resolvedTarget, idx) => {
    const targetValues = Object.keys(values).reduce((acc, propName) => {
      if (values[propName][idx]) {
        acc[propName] = values[propName][idx]
      }
      return acc
    }, {})
    Targets.setValuesOnTarget(resolvedTarget, targetValues)
  })

  if (animation.onUpdate) {
    animation.onUpdate()
  }

  if (animation.complete && animation.onComplete) {
    animation.onComplete()
  }
}
