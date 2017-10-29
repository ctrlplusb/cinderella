import * as Easings from './easings'
import constants from './constants'
import processAnimation from './processAnimation'
import mergeAnimationsIntoTimeline from './mergeAnimationsIntoTimeline'

// TODO:
// [ ] Looping?
// [ ] animate API
// [ ] Remove "run" and make timelines/animations auto execute
// [X] Absolute offset do not affect relative timing
// [ ] Docs on the perils of absolute timings.
// [ ] Add a run API chain to animate and timeline APIs
// [ ] Allow nesting of timelines/animations

export default () => {
  let running = false
  let currentFrame = null
  let animationTimelines = {}

  function onFrame({ frame, time, delta }) {
    Object.keys(animationTimelines).forEach(timelineId => {
      const currentTimeline = animationTimelines[timelineId]

      Object.keys(currentTimeline.queue).forEach(animationId => {
        currentTimeline.startTime =
          currentTimeline.startTime != null ? currentTimeline.startTime : time
        currentTimeline.runTime =
          currentTimeline.startTime != null
            ? time - currentTimeline.startTime
            : 0
        const animation = currentTimeline.queue[animationId]
        processAnimation(animation, currentTimeline.runTime, delta)
        if (animation.complete) {
          delete currentTimeline.queue[animationId]
        }
      })
    })
  }

  const animate = (animations = []) => {
    var timeline = mergeAnimationsIntoTimeline(animations)

    animationTimelines[newTimeline.id] = newTimeline
    console.log(JSON.stringify(newTimeline, null, 4))

    const done = new Promise(resolve => {
      if (newTimeline.longestRunningAnimation == null) {
        resolve()
        return
      }
      const longestAnim = newTimeline.queue[newTimeline.longestRunningAnimation]
      const customOnComplete = longestAnim.onComplete
      longestAnim.onComplete = x => {
        if (customOnComplete != null) {
          customOnComplete(x + 1)
        }
        resolve(x)
      }
    })

    return {
      add: animations => timeline(animations, newTimeline),
      done,
    }
  }

  const run = () => {
    if (running) {
      return
    }
    running = true
    const interval = 1000 / constants.fps
    let frame = 0
    let start = new Date().getTime()
    let then = new Date().getTime()
    const loop = () => {
      frame += 1
      const now = new Date().getTime()
      const delta = now - then
      if (delta > interval) {
        onFrame({
          time: now - start,
          delta,
          frame,
        })
        then = now - delta % interval
      }
      currentFrame = window.requestAnimationFrame(loop)
    }
    loop()
  }

  const stop = () => {
    if (currentFrame) {
      window.cancelAnimationFrame(currentFrame)
    }
    running = false
  }

  return {
    onFrame,
    timeline,
    run,
    stop,
  }
}
