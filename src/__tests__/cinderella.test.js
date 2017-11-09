/* @flow */

import cinderella, {
  stopAll,
  addFrameListener,
  removeFrameListener,
} from '../index'

const frameRate = 1000 / 60

describe('cinderella', () => {
  let waitForFrames

  beforeEach(() => {
    stopAll()
    let time = 100
    let frame
    window.requestAnimationFrame = fn => {
      frame = fn
      return frame
    }
    window.cancelAnimationFrame = () => undefined
    waitForFrames = (n = 1) => {
      for (let i = 0; i < n; i += 1) {
        time += frameRate
        if (frame) {
          frame(time)
        }
      }
    }
  })

  describe('animation', () => {
    let target
    let onStartSpy
    let onUpdateSpy
    let onCompleteSpy
    let animation

    beforeEach(async () => {
      target = {
        foo: 0,
      }
      onStartSpy = jest.fn()
      onUpdateSpy = jest.fn()
      onCompleteSpy = jest.fn()
      animation = cinderella({
        target,
        transform: {
          foo: 100,
        },
        duration: 5 * frameRate,
        onStart: onStartSpy,
        onUpdate: onUpdateSpy,
        onComplete: onCompleteSpy,
      })
    })

    it('does not executes if "play" is not executed', async () => {
      await waitForFrames(2)
      expect(onStartSpy).toHaveBeenCalledTimes(0)
    })

    it('calls "onStart" when animation starts', async () => {
      animation.play()
      await waitForFrames(2)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
    })

    it('calls "onUpdate" for each frame', async () => {
      animation.play()
      await waitForFrames(5)
      expect(onUpdateSpy).toHaveBeenCalledTimes(5)
    })

    it('onComplete', async () => {
      animation.play()
      await waitForFrames(7)
      expect(target.foo).toBeCloseTo(100)
      expect(onCompleteSpy).toHaveBeenCalledTimes(1)
    })

    it('delay', async () => {
      const delayTarget = {}
      const delayOnStartSpy = jest.fn()
      cinderella({
        target: delayTarget,
        transform: { foo: 100 },
        delay: 1 * frameRate,
        duration: 3 * frameRate,
        onStart: delayOnStartSpy,
      }).play()
      await waitForFrames(1)
      expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
      expect(delayTarget.foo).toBeUndefined()
      await waitForFrames(3)
      expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
      expect(delayTarget.foo).not.toBeUndefined()
    })

    it('calling play has no effect on an animation that is still executing', async () => {
      animation.play()
      await waitForFrames(3)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
      expect(onCompleteSpy).toHaveBeenCalledTimes(0)
      animation.play()
      await waitForFrames(4)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
      expect(onCompleteSpy).toHaveBeenCalledTimes(1)
    })

    it('calling play on an animation that has complete causes it to play again', async () => {
      animation.play()
      await waitForFrames(7)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
      expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      animation.play()
      await waitForFrames(3)
      expect(onStartSpy).toHaveBeenCalledTimes(2)
    })

    it('stop', async () => {
      animation.play()
      await waitForFrames(3)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
      animation.stop()
      await waitForFrames(4)
      expect(onCompleteSpy).toHaveBeenCalledTimes(0)
    })

    it('runs once', async () => {
      animation.play()
      await waitForFrames(10)
      expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
    })

    it('pause and play', async () => {
      animation.play()
      await waitForFrames(3)
      expect(onStartSpy).toHaveBeenCalledTimes(1)
      animation.pause()
      await waitForFrames(5)
      expect(onCompleteSpy).toHaveBeenCalledTimes(0)
      animation.play()
      await waitForFrames(4)
      expect(onCompleteSpy).toHaveBeenCalledTimes(1)
    })

    it('loop', async () => {
      const loopStartSpy = jest.fn()
      const loopUpdateSpy = jest.fn()
      const loopCompleteSpy = jest.fn()
      cinderella({
        duration: 3 * frameRate,
        from: 0,
        to: 10,
        onStart: loopStartSpy,
        onUpdate: loopUpdateSpy,
        onComplete: loopCompleteSpy,
      }).play({ loop: true })
      await waitForFrames(12)
      expect(loopStartSpy).toHaveBeenCalledTimes(3)
      expect(loopUpdateSpy).toHaveBeenCalledTimes(12)
      expect(loopCompleteSpy).toHaveBeenCalledTimes(2)
    })

    it('units', () => {
      const validUnits = '%,px,pt,em,rem,in,cm,mm,ex,ch,pc,vw,vh,vmin,vmax,deg,rad,turn'.split(
        ',',
      )
      const unitTarget = validUnits.reduce(
        (acc, unit) => ({
          ...acc,
          [unit]: `10${unit}`,
        }),
        {},
      )
      cinderella({
        target: unitTarget,
        transform: validUnits.reduce(
          (acc, unit) => ({
            ...acc,
            [unit]: `20${unit}`,
          }),
          {},
        ),
        duration: 1 * frameRate,
      }).play()
      waitForFrames(2)
      validUnits.forEach(unit => expect(unitTarget[unit]).toBe(`20${unit}`))
    })

    it('lazy transform', async () => {
      const lazyTarget = {}
      cinderella({
        target: lazyTarget,
        transform: { foo: () => 100 },
        duration: 5 * frameRate,
      }).play()
      await waitForFrames(7)
      expect(lazyTarget.foo).toBe(100)
    })

    it('basic transform', async () => {
      const multiTarget = {
        foo: 100,
        bar: 0,
      }
      cinderella({
        target: multiTarget,
        transform: {
          foo: 0,
          bar: 100,
        },
        duration: 5 * frameRate,
      }).play()
      await waitForFrames(7)
      expect(multiTarget).toMatchObject({
        foo: 0,
        bar: 100,
      })
    })

    it('transform over time', () => {
      animation.play()
      waitForFrames(1)
      expect(target.foo).toBeCloseTo(0)
      waitForFrames(1)
      expect(target.foo).toBeCloseTo(20)
      waitForFrames(1)
      expect(target.foo).toBeCloseTo(40)
      waitForFrames(1)
      expect(target.foo).toBeCloseTo(60)
      waitForFrames(1)
      expect(target.foo).toBeCloseTo(80)
      waitForFrames(1)
      expect(target.foo).toBeCloseTo(100)
      waitForFrames(1)
      expect(target.foo).toBe(100)
    })

    it.skip('advanced transform', () => {
      const animation = animate({})
    })
  })

  describe('timelines', () => {
    let timeline
    let animationOneOnStartSpy
    let animationTwoOnStartSpy

    beforeEach(() => {
      animationOneOnStartSpy = jest.fn()
      animationTwoOnStartSpy = jest.fn()
      timeline = cinderella({
        transform: { foo: 100 },
        duration: 3 * frameRate,
        onStart: animationOneOnStartSpy,
      }).add({
        transform: { foo: 100 },
        duration: 3 * frameRate,
        onStart: animationTwoOnStartSpy,
      })
    })

    it('onComplete', async () => {
      const timelineOnCompleteSpy = jest.fn()
      timeline.play({
        onComplete: timelineOnCompleteSpy,
      })
      await waitForFrames(9)
      expect(timelineOnCompleteSpy).toHaveBeenCalledTimes(1)
    })

    it('onStart', () => {
      const timelineOnStartSpy = jest.fn()
      timeline.play({
        onStart: timelineOnStartSpy,
      })
      waitForFrames(1)
      expect(timelineOnStartSpy).toHaveBeenCalledTimes(1)
    })

    it('relative exection', () => {
      timeline.play()
      waitForFrames(1)
      expect(animationOneOnStartSpy).toHaveBeenCalledTimes(1)
      waitForFrames(2)
      expect(animationTwoOnStartSpy).toHaveBeenCalledTimes(0)
      waitForFrames(3)
      expect(animationTwoOnStartSpy).toHaveBeenCalledTimes(1)
    })

    it('absolute', async () => {
      const tween1OnStartSpy = jest.fn()
      const tween2OnStartSpy = jest.fn()
      const absoluteTimelineOnCompleteSpy = jest.fn()
      const absoluteTimeline = cinderella({
        from: 0,
        to: 100,
        duration: 3 * frameRate,
        onStart: tween1OnStartSpy,
        onUpdate: jest.fn(),
      }).add({
        from: 0,
        to: 100,
        offset: 0,
        duration: 3 * frameRate,
        onStart: tween2OnStartSpy,
        onUpdate: jest.fn(),
      })
      absoluteTimeline.play({ onComplete: absoluteTimelineOnCompleteSpy })
      await waitForFrames(1)
      expect(tween1OnStartSpy).toHaveBeenCalledTimes(1)
      expect(tween2OnStartSpy).toHaveBeenCalledTimes(1)
      await waitForFrames(4)
      expect(absoluteTimelineOnCompleteSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('frame listeners', () => {
    let animation

    beforeEach(() => {
      animation = cinderella({
        transform: { foo: 100 },
        duration: 5 * frameRate,
      })
    })

    it('add and remove', async () => {
      const listener = jest.fn()
      addFrameListener(listener)
      animation.play()
      await waitForFrames(3)
      expect(listener).toHaveBeenCalledTimes(3)
      removeFrameListener(listener)
      await waitForFrames(2)
      expect(listener).toHaveBeenCalledTimes(3)
    })
  })
})
