function calculateValueDiff(newValue, prevValue) {
  return prevValue == null
    ? newValue
    : Array.isArray(newValue)
      ? newValue.map((x, idx) => x - prevValue[idx])
      : newValue - prevValue
}

export default (animation, time, delta) => {
  // // Handle any delay specified for the animation
  // animation.delayStartTime = animation.delayStartTime || time
  // if (animation.delay && time - animation.delayStartTime < animation.delay) {
  //   return
  // }

  console.log(animation.offset, time)
  if (animation.offset > time) {
    return
  }

  if (animation.startTime == null && animation.onStart != null) {
    animation.onStart(time)
  }

  // Record when the animation officially started
  animation.startTime = animation.startTime || time

  // Check to see if the animation should be considered complete
  animation.complete = time >= animation.startTime + animation.duration

  animation.fromValue =
    animation.fromValue != null
      ? animation.fromValue
      : typeof animation.from === 'function' ? animation.from() : animation.from

  animation.toValue =
    animation.toValue != null
      ? animation.toValue
      : typeof animation.to === 'function' ? animation.to() : animation.to

  animation.diff =
    animation.diff != null
      ? animation.diff
      : Array.isArray(animation.toValue)
        ? animation.toValue.map((x, idx) => x - animation.fromValue[idx])
        : animation.toValue - animation.fromValue

  if (animation.complete) {
    animation.onUpdate(
      animation.toValue,
      calculateValueDiff(animation.toValue, animation.prevValue),
      animation.prevValue,
      animation.prevDiff,
    )
  } else {
    const newValue = Array.isArray(animation.fromValue)
      ? animation.fromValue.map((x, idx) =>
          animation.easingFn(
            time - animation.startTime,
            animation.fromValue[idx],
            animation.diff[idx],
            animation.duration,
          ),
        )
      : animation.easingFn(
          time - animation.startTime,
          animation.fromValue,
          animation.diff,
          animation.duration,
        )
    const diff = calculateValueDiff(newValue, animation.prevValue)
    animation.onUpdate(newValue, diff, animation.prevValue, animation.prevDiff)
    animation.prevDiff = diff
    animation.prevValue = newValue
  }

  if (animation.complete && animation.onComplete) {
    setTimeout(() => {
      animation.onComplete(time)
    })
  }
}
