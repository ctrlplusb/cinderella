import configureAnimation from './configureAnimation'

function normaliseAnimation(animation, relativeOffset) {
  let configuredAnimation = configureAnimation(animation)
  let newRelativeOffset = relativeOffset
  if (configuredAnimation.offset == null) {
    configuredAnimation.offset = relativeOffset
    newRelativeOffset += configuredAnimation.duration
  } else if (
    typeof configuredAnimation.offset === 'string' &&
    configuredAnimation.offset.length > 3
  ) {
    const operator = configuredAnimation.offset.substr(0, 2)
    const value = parseInt(configuredAnimation.offset.substr(2), 10)
    if (operator === '-=') {
      configuredAnimation.offset = relativeOffset - value
    } else if (operator === '+=') {
      configuredAnimation.offset = relativeOffset + value
    } else {
      throw new Error(
        `Unknown relative offset value given "${configuredAnimation.offset}". Examples of good values are "-=100" or "+=100"`,
      )
    }
    const newItemOffset =
      configuredAnimation.offset + configuredAnimation.duration
    newRelativeOffset =
      newItemOffset > relativeOffset ? newItemOffset : relativeOffset
  }
  return [configuredAnimation, newRelativeOffset]
}

export default (
  animations,
  timeline = { duration: 0, queue: {}, animationIdx: 0 },
) => {
  return (Array.isArray(animations)
    ? animations
    : [animations]
  ).reduce((acc, animation) => {
    const processNormalised = normalised => {
      timeline.animationIdx += 1
      acc.queue[timeline.animationIdx] = normalised[0]
      if (normalised[1] > acc.duration) {
        acc.duration = normalised[1]
        acc.longestRunningAnimation = timeline.animationIdx
      } else {
        acc.duration = acc.duration
      }
    }
    if (Array.isArray(animation)) {
      animation
        .map(subAnimation => normaliseAnimation(subAnimation, acc.duration))
        .forEach(processNormalised)
    } else {
      processNormalised(normaliseAnimation(animation, acc.duration))
    }
    return acc
  }, timeline)
}
