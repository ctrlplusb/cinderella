/* @flow */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-continue */

import type {
  Animation,
  AnimationDefinition,
  EasingFn,
  KeyFrame,
  KeyFrameDefinition,
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
          : undefined,
    from:
      transformDefinition.from != null
        ? transformDefinition.from
        : transformDefaults && transformDefaults.from != null
          ? transformDefaults.from
          : undefined,
    // TODO: We should not allow undefined "to"
    to:
      transformDefinition.to != null
        ? transformDefinition.to
        : transformDefaults && transformDefaults.to != null
          ? transformDefaults.to
          : undefined,
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
  animation.duration = undefined
  animation.startTime = undefined
  animation.targetsTweens = undefined
}

const max = (xs: Array<number>): number =>
  xs.reduce((highest, next) => (highest > next ? highest : next), 0)

export const initialize = (animation: Animation): Animation => {
  if (animation.tweens != null) {
    // already initialized
    return animation
  }

  const resolvedTargets = Targets.resolveTargets(animation)
  const props: Array<Prop> = Object.keys(animation.transform)

  const targetsTweens = resolvedTargets.reduce(
    (targetsTweensAcc, resolvedTarget, targetIdx) => {
      // Resolve the tweens for each prop
      const propTweens = props.reduce((propTweensAcc, propName) => {
        const keyFrameDefinitions: Array<KeyFrameDefinition> =
          animation.transform[propName]

        const resolveKeyframe = (
          keyframeDefinition: KeyFrameDefinition,
        ): KeyFrame => ({
          complete: false,
          delay:
            typeof keyframeDefinition.delay === 'function'
              ? keyframeDefinition.delay(
                  resolvedTarget,
                  targetIdx,
                  resolvedTargets.length,
                )
              : keyframeDefinition.delay,
          duration:
            typeof keyframeDefinition.duration === 'function'
              ? keyframeDefinition.duration(
                  resolvedTarget,
                  targetIdx,
                  resolvedTargets.length,
                )
              : keyframeDefinition.duration,
          easing:
            typeof keyframeDefinition.easing === 'function'
              ? keyframeDefinition.easing(
                  resolvedTarget,
                  targetIdx,
                  resolvedTargets.length,
                )
              : keyframeDefinition.easing,
          from: keyframeDefinition.from,
          to: keyframeDefinition.to,
        })

        // Resolve the keyframes for the tween
        const keyframes = keyFrameDefinitions.map(resolveKeyframe)

        propTweensAcc[propName] = {
          keyframes,
          duration: keyframes.reduce((total, cur) => total + cur.duration, 0),
        }
        return propTweensAcc
      }, {})

      targetsTweensAcc.push({
        resolvedTarget,
        propTweens,
        duration: max(props.map(propName => propTweens[propName].duration)),
      })

      return targetsTweensAcc
    },
    [],
  )

  animation.delayValue =
    typeof animation.delay === 'function' ? animation.delay() : animation.delay
  animation.duration = max(
    targetsTweens.map(targetTween => targetTween.duration),
  )
  animation.targetsTweens = targetsTweens
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
    startTime: animationStartTime,
    duration: animationDuration,
    targetsTweens,
    delayValue,
  } = animation
  if (
    animationStartTime == null ||
    animationDuration == null ||
    targetsTweens == null ||
    delayValue == null
  ) {
    throw new Error('Animation initialization failed')
  }

  // Wait for animation delay to have been satisfied
  if (time - animationStartTime < delayValue) {
    return
  }

  // Run duration for the animation should not take into account the
  const animationRunDuration = time - animationStartTime - delayValue

  targetsTweens.forEach((targetTweens, targetIdx) => {
    const { resolvedTarget, propTweens } = targetTweens
    const propNames = Object.keys(propTweens)
    const values = propNames.reduce((acc, propName) => {
      let tweenCurrentValue
      const { keyframes } = propTweens[propName]
      keyframes.forEach((keyframe, keyframedIdx) => {
        // Skip if this keyframe has already completed
        if (keyframe.complete) {
          return
        }

        // The previous keyframe MUST be complete prior to this keyframe running
        if (keyframedIdx > 0 && !keyframes[keyframedIdx - 1].complete) {
          return
        }

        // Set the keyframe start time if not set already
        if (keyframe.startTime == null) {
          keyframe.startTime = time
        }

        // We must wait for the keyframes' delay to be hit prior to us running
        // it
        if (time - keyframe.startTime < keyframe.delay) {
          return
        }

        keyframe.runDuration = time - keyframe.startTime - keyframe.delay

        // Resolve the to/from values for the tweens
        if (
          keyframe.toValue == null ||
          keyframe.fromValue == null ||
          keyframe.diff == null
        ) {
          if (keyframe.from == null) {
            keyframe.fromValue = Targets.getValueFromTarget(
              resolvedTarget,
              propName,
            )
          } else {
            keyframe.fromValue =
              typeof keyframe.from === 'function'
                ? Targets.extractValue(
                    resolvedTarget,
                    propName,
                    keyframe.from(
                      resolvedTarget,
                      targetIdx,
                      targetsTweens.length,
                    ),
                  )
                : Targets.extractValue(resolvedTarget, propName, keyframe.from)
          }
          keyframe.toValue =
            typeof keyframe.to === 'function'
              ? Targets.extractValue(
                  resolvedTarget,
                  propName,
                  keyframe.to(resolvedTarget, targetIdx, targetsTweens.length),
                )
              : Targets.extractValue(resolvedTarget, propName, keyframe.to)
          if (keyframe.toValue == null) {
            return
          }
          if (keyframe.fromValue == null) {
            keyframe.fromValue = Targets.getDefaultFromValue(
              resolvedTarget,
              propName,
              keyframe.toValue,
            )
          }
          if (keyframe.fromValue == null) {
            return
          }
          if (keyframe.fromValue.unit !== keyframe.toValue.unit) {
            // eslint-disable-next-line no-console
            console.warn(
              `Mixed units from from/to of ${propName}. from: ${keyframe
                .fromValue.unit || ''}, to: "${keyframe.toValue.unit || ''}"`,
            )
          }
          keyframe.diff = keyframe.toValue.number - keyframe.fromValue.number
        }

        // The below normalises our values so we can resolve a value that will
        // be correctly relative to the easing function that is being applied
        // across all of the values.
        if (
          keyframe.easing == null &&
          keyframe.duration + keyframe.delay !== animationDuration &&
          keyframe.bufferedFromNumber == null
        ) {
          const animDurPerc = animationDuration / 100
          const postRunDuration =
            animationDuration - keyframe.duration - keyframe.delay
          const prePercentage = keyframe.delay / animDurPerc
          const runPercentage = keyframe.duration / animDurPerc
          const postPercentage =
            postRunDuration > 0.001 ? postRunDuration / animDurPerc : 0
          const val = keyframe.diff / runPercentage
          const beforeBuffer = prePercentage * val
          const postBuffer = postPercentage * val
          keyframe.bufferedFromNumber = keyframe.fromValue.number - beforeBuffer
          keyframe.bufferedDiff =
            keyframe.toValue.number + postBuffer - keyframe.bufferedFromNumber
        }

        // If the time has passed the tween run time then we just use the "to"
        // as our value.
        if (keyframe.runDuration >= keyframe.duration) {
          keyframe.complete = true
          tweenCurrentValue = keyframe.toValue
        } else {
          const easingFn: EasingFn =
            Easings[keyframe.easing || animation.easing]
          const runDuration =
            keyframe.bufferedFromNumber != null
              ? animationRunDuration
              : keyframe.runDuration
          const from =
            keyframe.bufferedFromNumber != null
              ? keyframe.bufferedFromNumber
              : keyframe.fromValue.number
          const diff =
            keyframe.bufferedDiff != null
              ? keyframe.bufferedDiff
              : keyframe.diff
          const duration =
            keyframe.bufferedFromNumber != null
              ? animation.duration
              : keyframe.duration
          const easingResult = easingFn(runDuration, from, diff, duration)
          tweenCurrentValue = Object.assign({}, keyframe.toValue, {
            number: easingResult,
          })
        }
      })
      if (tweenCurrentValue) {
        acc[propName] = tweenCurrentValue
      }
      return acc
    }, {})

    Targets.setValuesOnTarget(resolvedTarget, values)
  })

  if (animation.onUpdate) {
    animation.onUpdate()
  }

  animation.complete = targetsTweens.every(({ propTweens }) =>
    Object.keys(propTweens).every(propName =>
      propTweens[propName].keyframes.every(keyframe => keyframe.complete),
    ),
  )

  if (animation.complete && animation.onComplete) {
    animation.onComplete()
  }
}
