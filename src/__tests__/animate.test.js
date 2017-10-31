import raf from 'raf'
import { animate, cancelAll } from '../index'

expect.extend({
  toHaveBeenCalledBetweenNTimes(received, min, max) {
    const pass =
      received.mock.calls.length >= min && received.mock.calls.length <= max
    if (pass) {
      return {
        message: () =>
          `expected function to be called between ${min} and ${max} times`,
        pass: true,
      }
    }
    return {
      message: () =>
        `expected function to be called between ${min} and ${max} times, but it was called ${received
          .mock.calls.length} times`,
      pass: false,
    }
  },
})

describe('animate', () => {
  const frameRate = 1000 / 60

  const waitForFrames = (n = 1) =>
    new Promise(resolve => setTimeout(resolve, n * frameRate))

  let onStartSpy
  let onUpdateSpy
  let onCompleteSpy
  let animation

  beforeAll(() => {
    raf.polyfill(window)
  })

  beforeEach(() => {
    cancelAll()
    onStartSpy = jest.fn()
    onUpdateSpy = jest.fn()
    onCompleteSpy = jest.fn()
    animation = animate({
      from: 0,
      to: 100,
      duration: 5 * frameRate,
      onStart: onStartSpy,
      onUpdate: onUpdateSpy,
      onComplete: onCompleteSpy,
    })
  })

  it('does not executes if "run" is not executed', async () => {
    await waitForFrames(1)
    expect(onStartSpy).toHaveBeenCalledTimes(0)
  })

  it('calls "onStart" when animation starts', async () => {
    animation.run()
    await waitForFrames(1)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
  })

  it('calls "onUpdate" for each frame', async () => {
    animation.run()
    await waitForFrames(5)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(4, 6)
  })

  it('calls "onComplete" when animation is done', async () => {
    animation.run()
    await waitForFrames(7)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('half way through an animation produces the expected result', async () => {
    animation.run()
    await waitForFrames(4)
    expect(onUpdateSpy).toHaveBeenCalledTimes(4)
    expect(Math.round(onUpdateSpy.mock.calls[3][0])).toBe(100 / 5 * 3)
  })

  it('calling run again resets an animation', async () => {
    animation.run()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    animation.run()
    await waitForFrames(1)
    expect(onStartSpy).toHaveBeenCalledTimes(2)
    expect(onCompleteSpy).toHaveBeenCalledTimes(0)
  })

  it('executing a timeline with no definition resolves immediately', async () => {
    const empty = animate()
    const start = new Date().getTime()
    await empty.run()
    expect(new Date().getTime() - start).toBeLessThan(5)
  })

  it('executing a timeline with no duration resolves immediately', async () => {
    const empty = animate({
      duration: 0,
    })
    const start = new Date().getTime()
    await empty.run()
    expect(new Date().getTime() - start).toBeLessThan(5)
  })

  it('cancelling a timeline mid execution stops it immediately', async () => {
    animation.run()
    await waitForFrames(3)
    animation.cancel()
    await waitForFrames(2)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(3, 4)
    expect(onCompleteSpy).toHaveBeenCalledTimes(0)
  })

  it('only runs an animation once', async () => {
    animation.run()
    await waitForFrames(10)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(5, 7)
  })

  it('looping works', async () => {
    const loopStartSpy = jest.fn()
    const loopUpdateSpy = jest.fn()
    const loopCompleteSpy = jest.fn()
    animate(
      {
        duration: 50,
        from: 0,
        to: 100,
        onStart: loopStartSpy,
        onUpdate: loopUpdateSpy,
        onComplete: loopCompleteSpy,
      },
      {
        loop: true,
      },
    ).run()
    await waitForFrames(10)
    expect(loopStartSpy).toHaveBeenCalledBetweenNTimes(2, 3)
    expect(loopUpdateSpy).toHaveBeenCalledBetweenNTimes(10, 11)
    expect(loopCompleteSpy).toHaveBeenCalledTimes(2)
  })
})
