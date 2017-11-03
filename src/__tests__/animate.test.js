import raf from 'raf'
import {
  animate,
  cancelAll,
  addFrameListener,
  removeFrameListener,
} from '../index'

const frameRate = 1000 / 60

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
  const waitForFrames = (n = 1) =>
    new Promise(resolve => setTimeout(resolve, n * frameRate))

  let onStartSpy
  let onUpdateSpy
  let onCompleteSpy
  let onTimelineCompleteSpy
  let onTimelineStartSpy
  let animation

  beforeAll(() => {
    raf.polyfill(window)
  })

  beforeEach(() => {
    cancelAll()
    onStartSpy = jest.fn()
    onUpdateSpy = jest.fn()
    onCompleteSpy = jest.fn()
    onTimelineCompleteSpy = jest.fn()
    onTimelineStartSpy = jest.fn()
    animation = animate(
      {
        from: 0,
        to: 100,
        duration: 5 * frameRate,
        onStart: onStartSpy,
        onUpdate: onUpdateSpy,
        onComplete: onCompleteSpy,
      },
      {
        onStart: onTimelineStartSpy,
        onComplete: onTimelineCompleteSpy,
      },
    )
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
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(3, 6)
  })

  it('calls "onComplete" when animation is done', async () => {
    animation.play()
    await waitForFrames(7)
    expect(onCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('relative', async () => {
    const tween2OnStartSpy = jest.fn()
    const timelineOnCompleteSpy = jest.fn()
    animate(
      [
        {
          from: 0,
          to: 100,
          duration: 3 * frameRate,
          onStart: jest.fn(),
          onUpdate: jest.fn(),
        },
        {
          from: 0,
          to: 100,
          duration: 3 * frameRate,
          onStart: tween2OnStartSpy,
          onUpdate: jest.fn(),
        },
      ],
      {
        onComplete: timelineOnCompleteSpy,
      },
    ).play()
    await waitForFrames(3)
    expect(tween2OnStartSpy).toHaveBeenCalledTimes(0)
    await waitForFrames(3)
    expect(tween2OnStartSpy).toHaveBeenCalledTimes(1)
    await waitForFrames(3)
    expect(timelineOnCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('delay', async () => {
    const delayOnStartSpy = jest.fn()
    const delayOnUpdateSpy = jest.fn()
    const timelineOnCompleteSpy = jest.fn()
    animate(
      [
        {
          from: 0,
          to: 100,
          delay: 2 * frameRate,
          duration: 3 * frameRate,
          onStart: delayOnStartSpy,
          onUpdate: delayOnUpdateSpy,
        },
      ],
      {
        onComplete: timelineOnCompleteSpy,
      },
    ).play()
    await waitForFrames(1)
    expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
    expect(delayOnUpdateSpy).toHaveBeenCalledTimes(0)
    await waitForFrames(3)
    expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
    expect(delayOnUpdateSpy).toHaveBeenCalledBetweenNTimes(1, 2)
  })

  it('absolute offset', async () => {
    const tween1OnStartSpy = jest.fn()
    const tween2OnStartSpy = jest.fn()
    const timelineOnCompleteSpy = jest.fn()
    animate(
      [
        {
          from: 0,
          to: 100,
          duration: 3 * frameRate,
          onStart: tween1OnStartSpy,
          onUpdate: jest.fn(),
        },
        {
          from: 0,
          to: 100,
          offset: 0,
          duration: 3 * frameRate,
          onStart: tween2OnStartSpy,
          onUpdate: jest.fn(),
        },
      ],
      {
        onComplete: timelineOnCompleteSpy,
      },
    ).play()
    await waitForFrames(1)
    expect(tween1OnStartSpy).toHaveBeenCalledTimes(1)
    expect(tween2OnStartSpy).toHaveBeenCalledTimes(1)
    await waitForFrames(4)
    expect(timelineOnCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('multiple values', async () => {
    const actual = {
      a: null,
      b: null,
    }
    animate({
      from: [0, 200],
      to: [50, 150],
      duration: 5 * frameRate,
      onUpdate: ([a, b]) => {
        actual.a = a
        actual.b = b
      },
    }).play()
    await waitForFrames(8)
    expect(actual).toMatchObject({
      a: 50,
      b: 150,
    })
  })

  it('complex to values', async () => {
    let actualX
    let actualY
    animate({
      from: [
        // x
        -50,
        // y
        200,
      ],
      to: [
        // x
        {
          value: 50,
          delay: 1 * frameRate,
          duration: 3 * frameRate,
        },
        // y
        150,
      ],
      onUpdate: ([x, y]) => {
        actualX = x
        actualY = y
      },
    }).play()
    await waitForFrames(3)
    expect(actualX).toBeGreaterThan(-17)
    expect(actualX).toBeLessThan(17)
    expect(actualY).toBeCloseTo(175)
    await waitForFrames(3)
    expect(actualX).toBe(50)
    expect(actualY).toBe(150)
  })

  it('function values', async () => {
    let actual = null
    animate({
      from: () => 0,
      to: () => 50,
      duration: 5 * frameRate,
      onUpdate: x => {
        actual = x
      },
    }).play()
    await waitForFrames(8)
    expect(actual).toBe(50)
  })

  it('half way through an animation produces the expected result', async () => {
    animation.play()
    await waitForFrames(3)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(3, 4)
    const lastUpdateValue = Math.round(
      onUpdateSpy.mock.calls[onUpdateSpy.mock.calls.length - 1][0],
    )
    expect(
      lastUpdateValue === 100 / 5 * 2 || lastUpdateValue === 100 / 5 * 3,
    ).toBe(true)
  })

  it('calling play has no effect on an animation that is midway in their timeline', async () => {
    animation.play()
    await waitForFrames(3)
    expect(onStartSpy).toHaveBeenCalledTimes(1)
    expect(onCompleteSpy).toHaveBeenCalledTimes(0)
    animation.play()
    await waitForFrames(3)
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
    animation.stop()
    await waitForFrames(2)
    expect(onUpdateSpy).toHaveBeenCalledBetweenNTimes(2, 4)
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
        duration: 3 * frameRate,
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
    expect(loopUpdateSpy).toHaveBeenCalledBetweenNTimes(8, 10)
    expect(loopCompleteSpy).toHaveBeenCalledBetweenNTimes(1, 2)
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

  it('registering custom onFrame listeners', async () => {
    const listener = jest.fn()
    addFrameListener(listener)
    animation.play()
    await waitForFrames(3)
    expect(listener).toHaveBeenCalledBetweenNTimes(3, 4)
    removeFrameListener(listener)
    await waitForFrames(3)
    expect(listener).toHaveBeenCalledBetweenNTimes(3, 4)
  })

  it('animation "onComplete"', async () => {
    animation.play()
    await waitForFrames(7)
    expect(onTimelineCompleteSpy).toHaveBeenCalledTimes(1)
  })

  it('animation "onStart"', async () => {
    animation.play()
    await waitForFrames(1)
    expect(onTimelineStartSpy).toHaveBeenCalledTimes(1)
  })
})
