import * as Easings from './easings'
import constants from './constants'
import processAnimation from './processAnimation'
import mergeAnimationsIntoTimeline from './mergeAnimationsIntoTimeline'

export default () => {
  let running = false
  let currentFrame = null
  let animationTimelines = {}
  let timelineIdx = 0

  function onFrame({ frame, time, delta }) {
    Object.keys(animationTimelines).forEach(timelineId => {
      const currentTimeline = animationTimelines[timelineId]
      if (currentTimeline.queue.length === 0) {
        return
      }

      Object.keys(currentTimeline.queue).forEach(animationId => {
        const animation = currentTimeline.queue[animationId]
        processAnimation(animation, time, delta)
        if (animation.complete) {
          delete currentTimeline.queue[animationId]
        }
      })

      currentTimeline.runTime = time
    })
  }

  const timeline = (animations = [], existingTimeline) => {
    var newTimeline = mergeAnimationsIntoTimeline(animations, existingTimeline)

    if (newTimeline.id == null) {
      timelineIdx += 1
      newTimeline.id = timelineIdx
      animationTimelines[timelineIdx] = newTimeline
      console.log(animationTimelines)
    }

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
