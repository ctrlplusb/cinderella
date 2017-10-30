import createTimeline from './createTimeline'
import processAnimation from './processAnimation'

// Maintains a list of timelines that have been queued to "executed"
const queuedTimelines = {}

// Represents the currently executing raf frame
let currentFrame = null

const onFrame = time => {
  Object.keys(queuedTimelines).forEach(timelineId => {
    const t = queuedTimelines[timelineId]
    Object.keys(t.queue).forEach(animationId => {
      const animation = t.queue[animationId]
      processAnimation(animation, time)
      if (animation.complete) {
        delete t.queue[animationId]
      }
    })
  })
}

const start = () => {
  if (currentFrame != null) {
    // We are already running the raf. Move along.
    return
  }
  let started
  const loop = time => {
    if (!started) {
      started = time
    }
    onFrame(time)
    currentFrame = window.requestAnimationFrame(loop)
  }
  currentFrame = window.requestAnimationFrame(loop)
}

export const cancelAll = () => {
  const timelineIds = Object.keys(queuedTimelines)
  timelineIds.forEach(id => {
    delete queuedTimelines[id]
  })
  if (currentFrame) {
    window.cancelAnimationFrame(currentFrame)
    currentFrame = null
  }
}

const unqueueTimeline = id => {
  delete queuedTimelines[id]
  if (Object.keys(queuedTimelines).length === 0) {
    cancelAll()
  }
}

export const animate = (animations = []) => {
  const t = createTimeline(animations)
  return {
    run: () => {
      t.run = true
      queuedTimelines[t.id] = t
      const hasExecutableAnimations = t.executionEnd > 0
      if (hasExecutableAnimations) {
        start()
      }
      return hasExecutableAnimations
        ? // We will return a promise that resolves when the longest
          // running animation completes.
          new Promise(resolve => {
            if (t.longestRunningAnimation == null) {
              resolve()
              return
            }
            const longestAnim = t.queue[t.longestRunningAnimation]
            const customOnComplete = longestAnim.onComplete
            longestAnim.onComplete = x => {
              if (customOnComplete != null) {
                customOnComplete(x)
              }
              resolve(x)
            }
          })
        : // Otherwise we return a promise that resolves immediately
          Promise.resolve(0)
    },
    cancel: () => unqueueTimeline(t.id),
  }
}
