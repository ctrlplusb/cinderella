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

  it('does not executes if "play" is not executed', async () => {
    await waitForFrames(1)
    expect(onStartSpy).toHaveBeenCalledTimes(0)
  })

  it('calls "onStart" when animation starts', async () => {
    animation.play()
    await waitForFrames(1)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
  })

  it('calls "onUpdate" for each frame', async () => {
    animation.play()
    await waitForFrames(5)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(4, 6)
  })

  it('calls "onComplete" when animation is done', async () => {
    animation.play()
    await waitForFrames(7)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('half way through an animation produces the expected result', async () => {
    animation.play()
    await waitForFrames(4)
    expect(onUpdateSpy).toHaveBeenCalledTimes(4)
    expect(Math.round(onUpdateSpy.mock.calls[3][0])).toBe(100 / 5 * 3)
  })

  it('calling play has no effect on an animation that is midway in their timeline', async () => {
    animation.play()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    animation.play()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('calling play on an animation that has complete causes it to play again', async () => {
    animation.play()
    await waitForFrames(6)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    animation.play()
    await waitForFrames(2)
    expect(onStartSpy).toHaveBeenCalledTimes(2)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('executing a timeline with no definition resolves immediately', async () => {
    const empty = animate()
    const start = new Date().getTime()
    await empty.play()
    expect(new Date().getTime() - start).toBeLessThan(5)
  })

  it('executing a timeline with no duration resolves immediately', async () => {
    const empty = animate({
      duration: 0,
    })
    const start = new Date().getTime()
    await empty.play()
    expect(new Date().getTime() - start).toBeLessThan(5)
  })

  it('cancelling a timeline mid execution stops it immediately', async () => {
    animation.play()
    await waitForFrames(3)
    animation.cancel()
    await waitForFrames(2)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(3, 4)
    expect(onCompleteSpy).toHaveBeenCalledTimes(0)
  })

  it('only runs an animation once', async () => {
    animation.play()
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
        duration: 2 * frameRate,
        from: 0,
        to: 10,
        onStart: loopStartSpy,
        onUpdate: loopUpdateSpy,
        onComplete: loopCompleteSpy,
      },
      {
        loop: true,
      },
    ).play()
    await waitForFrames(9)
    expect(loopStartSpy).toHaveBeenCalledBetweenNTimes(2, 3)
    expect(loopUpdateSpy).toHaveBeenCalledBetweenNTimes(6, 7)
    expect(loopCompleteSpy).toHaveBeenCalledTimes(2)
  })

  it('pausing and resuming an animation works', async () => {
    const onStartTwoSpy = jest.fn()
    const onUpdateTwoSpy = jest.fn()
    const pausable = animate([
      {
        duration: 2 * frameRate,
        from: 0,
        to: 100,
        onUpdate: jest.fn(),
      },
      {
        duration: 3 * frameRate,
        from: 0,
        to: 100,
        onStart: onStartTwoSpy,
        onUpdate: onUpdateTwoSpy,
      },
    ])
    pausable.play()
    await waitForFrames(2)
    pausable.pause()
    await waitForFrames(5)
    expect(onStartTwoSpy).toHaveBeenCalledTimes(0)
    pausable.play()
    await waitForFrames(4)
    expect(onUpdateTwoSpy).toHaveBeenCalledBetweenNTimes(3, 4)
  })
})
