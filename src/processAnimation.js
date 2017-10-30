/* eslint-disable no-param-reassign */

const frameRate = 1000 / 60

export default (animation, timelineTime) => {
  if (
    timelineTime < animation.executionStart ||
    timelineTime > animation.executionEnd
  ) {
    return
  }

  animation.runState = animation.runState || {}
  const { runState } = animation

  if (!runState.onStateRun && animation.onStart != null) {
    animation.onStart(timelineTime)
    runState.onStateRun = true
  }

  runState.fromValue =
    runState.fromValue != null
      ? runState.fromValue
      : typeof animation.from === 'function' ? animation.from() : animation.from

  runState.toValue =
    runState.toValue != null
      ? runState.toValue
      : typeof animation.to === 'function' ? animation.to() : animation.to

  runState.diff =
    runState.diff != null
      ? runState.diff
      : Array.isArray(runState.toValue)
        ? runState.toValue.map((x, idx) => x - runState.fromValue[idx])
        : runState.toValue - runState.fromValue

  // Check to see if the animation should be considered complete
  runState.complete = timelineTime + frameRate >= animation.executionEnd

  if (runState.complete) {
    animation.onUpdate(runState.toValue, runState.prevValue)
  } else {
    const timePassed = timelineTime - animation.executionStart

    const newValue = Array.isArray(runState.fromValue)
      ? runState.fromValue.map((x, idx) =>
          animation.easingFn(
            timePassed,
            runState.fromValue[idx],
            runState.diff[idx],
            animation.duration,
          ),
        )
      : animation.easingFn(
          timelineTime - animation.executionStart,
          runState.fromValue,
          runState.diff,
          animation.duration,
        )
    animation.onUpdate(newValue, runState.prevValue)
    runState.prevValue = newValue
  }

  if (runState.complete && animation.onComplete) {
    animation.onComplete()
  }
}
