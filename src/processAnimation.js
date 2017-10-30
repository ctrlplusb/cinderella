/* eslint-disable no-param-reassign */

function calculateValueDiff(newValue, prevValue) {
  return prevValue == null
    ? newValue
    : Array.isArray(newValue)
      ? newValue.map((x, idx) => x - prevValue[idx])
      : newValue - prevValue
}

const frameRate = 1000 / 60

export default (animation, time) => {
  if (animation.offset > time) {
    return
  }

  if (animation.startTime == null && animation.onStart != null) {
    animation.onStart(time)
  }

  /**
   * A note on animation.startTime. Technically for the first frame we 
   * want the easing functions to consider that a frame of time has already
   * passed (i.e 16ms).  Therefore we will subtract a frameRate time slice
   * from the time and set it to the animation.startTime.  We therefore
   * have to check the animation.complete first because due to this "hack"
   * time will always be greater than animation.startTime on the first 
   * frame check for the animation.
   */

  // Check to see if the animation should be considered complete
  // Totally possible that a bunch of frames were "dropped"
  animation.complete =
    animation.startTime != null &&
    time >= animation.startTime + animation.duration

  // Record when the animation officially started
  animation.startTime =
    animation.startTime != null ? animation.startTime : time - frameRate

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
    const timePassed = time - animation.startTime
    const newValue = Array.isArray(animation.fromValue)
      ? animation.fromValue.map((x, idx) =>
          animation.easingFn(
            timePassed,
            animation.fromValue[idx],
            animation.diff[idx],
            animation.duration,
          ),
        )
      : animation.easingFn(
          timePassed,
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
    animation.onComplete(time)
  }
}
