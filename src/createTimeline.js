import configureAnimation from './configureAnimation'

let timelineIdx = 0

function resolveTimingsForAnimation(
  animation,
  startTimeForRelativeAnimations,
  absoluteOffsetFrom,
) {
  animation = configureAnimation(animation)

  if (animation.offset == null) {
    animation.executionStart = startTimeForRelativeAnimations
  } else if (typeof animation.offset === 'number') {
    animation.executionStart = absoluteOffsetFrom + animation.offset
    animation.isAbsoluteOffset = true
  } else if (
    typeof animation.offset === 'string' &&
    animation.offset.length > 3
  ) {
    const operator = animation.offset.substr(0, 2)
    const value = parseInt(animation.offset.substr(2), 10)
    if (operator === '-=') {
      animation.executionStart = startTimeForRelativeAnimations - value
    } else if (operator === '+=') {
      animation.executionStart = startTimeForRelativeAnimations + value
    } else {
      throw new Error(
        `Unknown relative offset value given "${animation.offset}". Examples of good values are "-=100" or "+=100"`,
      )
    }
  }

  if (animation.executionStart < 0) {
    animation.executionStart = 0
  }

  if (animation.delay != null) {
    animation.executionStart += animation.delay
  }

  animation.executionEnd = animation.executionStart + animation.duration

  return animation
}

const processAnimation = (animations, timeline) => {
  const processResolvedAnimation = animation => {
    timeline.animationIdx += 1
    timeline.queue[timeline.animationIdx] = animation
    if (animation.executionEnd > timeline.executionEnd) {
      timeline.executionEnd = animation.executionEnd
      timeline.longestRunningAnimation = timeline.animationIdx
    }
    if (
      !animation.isAbsoluteOffset &&
      animation.executionEnd > timeline.relativeEnd
    ) {
      timeline.relativeEnd = animation.executionEnd
    }
  }

  const getRelativeStartTime = () =>
    timeline.runTime > timeline.relativeEnd
      ? timeline.runTime
      : timeline.relativeEnd

  if (animations.id != null && typeof animations.queue === 'object') {
    const absoluteOffsetFrom = timeline.relativeEnd
    Object.keys(animations.queue).map(animationId => {
      const animation = animations.queue[animationId]
      const clone = {
        ...animation,
      }
      const result = resolveTimingsForAnimation(
        clone,
        getRelativeStartTime(),
        absoluteOffsetFrom,
      )
      return processResolvedAnimation(result)
    })
  } else {
    processResolvedAnimation(
      resolveTimingsForAnimation(animations, getRelativeStartTime(), 0),
    )
  }
}

export default animations => {
  timelineIdx += 1
  const timeline = {
    id: timelineIdx,
    duration: 0,
    queue: {},
    relativeEnd: 0,
    executionEnd: 0,
    animationIdx: 0,
  }

  if (Array.isArray(animations)) {
    animations.map(animation => {
      if (typeof animation !== 'object') {
        throw new Error(`Invalid animation definition: ${animation}`)
      }
      processAnimation(animation, timeline)
    })
  } else {
    processAnimation(animations, timeline)
  }

  return timeline
}
