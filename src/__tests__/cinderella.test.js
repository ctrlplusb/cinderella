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

  describe('animations', () => {
    let targets
    let onStartSpy
    let onUpdateSpy
    let onCompleteSpy
    let animation

    beforeEach(() => {
      targets = {
        foo: 0,
      }
      onStartSpy = jest.fn()
      onUpdateSpy = jest.fn()
      onCompleteSpy = jest.fn()
      animation = cinderella().add({
        targets,
        transform: {
          foo: {
            to: 100,
            duration: 5 * frameRate,
          },
        },
        onStart: onStartSpy,
        onUpdate: onUpdateSpy,
        onComplete: onCompleteSpy,
      })
    })

    describe('execution', () => {
      it('does not executes if "play" is not executed', () => {
        waitForFrames(2)
        expect(onStartSpy).toHaveBeenCalledTimes(0)
      })

      it('calls "onStart" when animation starts', () => {
        animation.play()
        waitForFrames(5)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
      })

      it('calls "onUpdate" for each frame', () => {
        animation.play()
        waitForFrames(5)
        expect(onUpdateSpy).toHaveBeenCalledTimes(5)
      })

      it('onComplete', () => {
        animation.play()
        waitForFrames(7)
        expect(targets.foo).toBeCloseTo(100)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('delay on animation', () => {
        const delayTarget = {}
        const delayOnStartSpy = jest.fn()
        cinderella()
          .add({
            targets: delayTarget,
            transform: {
              foo: {
                to: 100,
                duration: 3 * frameRate,
              },
            },
            delay: 1 * frameRate,
            onStart: delayOnStartSpy,
          })
          .play()
        waitForFrames(1)
        expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
        expect(delayTarget.foo).toBeUndefined()
        waitForFrames(3)
        expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
        expect(delayTarget.foo).not.toBeUndefined()
      })

      it('calling play has no effect on an animation that is still executing', () => {
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(0)
        animation.play()
        waitForFrames(4)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('calling play on an animation that has complete causes it to play again', () => {
        animation.play()
        waitForFrames(7)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(2)
      })

      it('stop', () => {
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        animation.stop()
        waitForFrames(4)
        expect(onCompleteSpy).toHaveBeenCalledTimes(0)
      })

      it('runs once', () => {
        animation.play()
        waitForFrames(10)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
      })

      it('pause and play', () => {
        animation.play()
        waitForFrames(3)
        expect(onStartSpy).toHaveBeenCalledTimes(1)
        animation.pause()
        waitForFrames(5)
        expect(onCompleteSpy).toHaveBeenCalledTimes(0)
        animation.play()
        waitForFrames(4)
        expect(onCompleteSpy).toHaveBeenCalledTimes(1)
      })

      it('loop', () => {
        const loopStartSpy = jest.fn()
        cinderella({
          loop: true,
        })
          .add({
            targets: {},
            transform: {
              foo: {
                to: 10,
                duration: 3 * frameRate,
              },
            },
            onStart: loopStartSpy,
          })
          .play()
        waitForFrames(12)
        expect(loopStartSpy).toHaveBeenCalledTimes(3)
      })
    })

    describe('tweens', () => {
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
        cinderella()
          .add({
            targets: unitTarget,
            transform: validUnits.reduce(
              (acc, unit) => ({
                ...acc,
                [unit]: {
                  to: `20${unit}`,
                  duration: 1 * frameRate,
                },
              }),
              {},
            ),
          })
          .play()
        waitForFrames(2)
        validUnits.forEach(unit => expect(unitTarget[unit]).toBe(`20${unit}`))
      })

      it('multiple', () => {
        const multiTarget = {
          foo: 100,
          bar: 0,
        }
        cinderella()
          .add({
            targets: multiTarget,
            transform: {
              foo: {
                to: 0,
                duration: 5 * frameRate,
              },
              bar: {
                to: 100,
                duration: 5 * frameRate,
              },
            },
          })
          .play()
        waitForFrames(7)
        expect(multiTarget).toMatchObject({
          foo: 0,
          bar: 100,
        })
      })

      it('transform over time', () => {
        animation.play()
        waitForFrames(1)
        expect(targets.foo).toBeCloseTo(0)
        waitForFrames(1)
        expect(targets.foo).toBeCloseTo(20)
        waitForFrames(1)
        expect(targets.foo).toBeCloseTo(40)
        waitForFrames(1)
        expect(targets.foo).toBeCloseTo(60)
        waitForFrames(1)
        expect(targets.foo).toBeCloseTo(80)
        waitForFrames(1)
        expect(targets.foo).toBeCloseTo(100)
        waitForFrames(1)
        expect(targets.foo).toBe(100)
      })

      it('function values', () => {
        const lazyTarget = {}
        cinderella()
          .add({
            targets: lazyTarget,
            transform: {
              foo: {
                delay: () => 1 * frameRate,
                duration: () => 5 * frameRate,
                easing: () => 'easeInQuad',
                from: () => 0,
                to: () => 100,
              },
            },
          })
          .play()
        waitForFrames(8)
        expect(lazyTarget.foo).toBe(100)
      })

      it('delay', () => {
        const delayTarget = {}
        const delayOnStartSpy = jest.fn()
        cinderella()
          .add({
            targets: delayTarget,
            transform: {
              foo: {
                to: 100,
                duration: 3 * frameRate,
                delay: 1 * frameRate,
              },
            },
            onStart: delayOnStartSpy,
          })
          .play()
        waitForFrames(1)
        expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
        expect(delayTarget.foo).toBeUndefined()
        waitForFrames(3)
        expect(delayOnStartSpy).toHaveBeenCalledTimes(1)
        expect(delayTarget.foo).not.toBeUndefined()
      })

      // TODO: Make defaults allow setting of ANY tween prop
      it('defaults', () => {
        const defaultsTarget = {
          foo: 100,
          bar: 0,
        }
        cinderella()
          .add({
            targets: defaultsTarget,
            transform: {
              foo: {
                to: 0,
              },
              bar: {
                to: 100,
              },
            },
            transformDefaults: {
              delay: 2 * frameRate,
              duration: 5 * frameRate,
            },
          })
          .play()
        waitForFrames(9)
        expect(defaultsTarget).toMatchObject({
          foo: 0,
          bar: 100,
        })
      })

      describe('keyframes', () => {
        it('basic', () => {
          const multiTweenTarget = {
            foo: 0,
          }
          cinderella()
            .add({
              targets: multiTweenTarget,
              transform: {
                foo: [
                  {
                    to: 100,
                    duration: 2 * frameRate,
                  },
                  {
                    to: 200,
                    delay: 2 * frameRate,
                    duration: 3 * frameRate,
                  },
                ],
              },
            })
            .play()
          waitForFrames(1)
          expect(multiTweenTarget).toMatchObject({
            foo: 0,
          })
          waitForFrames(2)
          expect(multiTweenTarget.foo).toBeCloseTo(100)
          waitForFrames(1)
          expect(multiTweenTarget.foo).toBeCloseTo(100)
          waitForFrames(1)
          expect(multiTweenTarget.foo).toBeCloseTo(100)
          waitForFrames(3)
          expect(multiTweenTarget.foo).toBeCloseTo(200)
        })

        it('negative easing', () => {
          const keyFrameTarget = {
            foo: 1,
            bar: 200,
          }
          cinderella()
            .add({
              targets: keyFrameTarget,
              transform: {
                foo: {
                  to: 0,
                  easing: 'linear',
                  duration: 5 * frameRate,
                },
                bar: {
                  to: 100,
                  easing: 'linear',
                  duration: 5 * frameRate,
                },
              },
            })
            .play()
          waitForFrames(1)
          expect(keyFrameTarget).toMatchObject({
            foo: 1,
            bar: 200,
          })
          expect(keyFrameTarget.foo * 100).toBeCloseTo(100)
          expect(keyFrameTarget.bar).toBeCloseTo(200)
          waitForFrames(1)
          expect(keyFrameTarget.foo * 100).toBeCloseTo(80)
          expect(keyFrameTarget.bar).toBeCloseTo(180)
          waitForFrames(1)
          expect(keyFrameTarget.foo * 100).toBeCloseTo(60)
          expect(keyFrameTarget.bar).toBeCloseTo(160)
          waitForFrames(1)
          expect(keyFrameTarget.foo * 100).toBeCloseTo(40)
          expect(keyFrameTarget.bar).toBeCloseTo(140)
          waitForFrames(1)
          expect(keyFrameTarget.foo * 100).toBeCloseTo(20)
          expect(keyFrameTarget.bar).toBeCloseTo(120)
          waitForFrames(1)
          expect(keyFrameTarget.foo * 100).toBeCloseTo(0)
          expect(keyFrameTarget.bar).toBeCloseTo(100)
        })

        it('unique easings', () => {
          const multiTweenTarget = {
            foo: 0,
          }
          cinderella()
            .add({
              targets: multiTweenTarget,
              transform: {
                foo: [
                  {
                    to: 100,
                    easing: 'easeOutQuad',
                    duration: 5 * frameRate,
                  },
                  {
                    to: 200,
                    delay: 2 * frameRate,
                    duration: 5 * frameRate,
                  },
                ],
              },
            })
            .play()
          waitForFrames(1)
          expect(multiTweenTarget).toMatchObject({
            foo: 0,
          })
          // First tween runs for 2 frames
          waitForFrames(2)
          expect(multiTweenTarget.foo).toBeCloseTo(64)
          waitForFrames(5)
          expect(multiTweenTarget.foo).toBeCloseTo(100)
          // Second tween runs for 2 frames
          waitForFrames(2)
          expect(multiTweenTarget.foo).toBeCloseTo(140)
          waitForFrames(3)
          expect(multiTweenTarget.foo).toBeCloseTo(200)
        })

        it.skip('function values')
      })

      it.skip('from')
      it.skip('mixed from/to units')
      it.skip('delay function resolver')
      it.skip('duration function resolver')
      it.skip('easing function resolver')
      it.skip('from function resolver')
      it.skip('to function resolver')
    })

    describe('targets', () => {
      it.skip('multiple targets')

      describe('dom targets', () => {
        it('querySelectorAll', () => {
          const els = [...new Array(5)].map(() => {
            const el = window.document.createElement('div')
            el.className = 'foo'
            el.style.height = '200px'
            el.setAttribute('width', '100px')
            window.document.body.appendChild(el)
            return el
          })
          cinderella()
            .add({
              targets: '.foo',
              transform: {
                width: {
                  to: '200px',
                  duration: 5 * frameRate,
                },
                height: {
                  to: '100px',
                  duration: 5 * frameRate,
                },
              },
            })
            .play()
          waitForFrames(7)
          els.forEach(el => {
            expect(el.width).toBe('200px')
            expect(el.style.height).toBe('100px')
          })
        })
        it.skip('css transform')
        it.skip('css')
        it.skip('attributes')
      })
    })
  })

  describe('timelines', () => {
    let timeline
    let animationOneOnStartSpy
    let animationTwoOnStartSpy
    let timelineOnCompleteSpy
    let timelineOnStartSpy

    beforeEach(() => {
      animationOneOnStartSpy = jest.fn()
      animationTwoOnStartSpy = jest.fn()
      timelineOnCompleteSpy = jest.fn()
      timelineOnStartSpy = jest.fn()

      timeline = cinderella({
        onComplete: timelineOnCompleteSpy,
        onStart: timelineOnStartSpy,
      })
        .add({
          targets: {},
          transform: {
            foo: {
              to: 100,
              duration: 3 * frameRate,
            },
          },
          onStart: animationOneOnStartSpy,
        })
        .add({
          targets: {},
          transform: {
            foo: {
              to: 100,
              duration: 3 * frameRate,
            },
          },
          onStart: animationTwoOnStartSpy,
        })
    })

    it('onComplete', async () => {
      timeline.play()
      await waitForFrames(9)
      expect(timelineOnCompleteSpy).toHaveBeenCalledTimes(1)
    })

    it('onStart', () => {
      timeline.play()
      waitForFrames(1)
      expect(timelineOnStartSpy).toHaveBeenCalledTimes(1)
    })

    it('relative execution', () => {
      timeline.play()
      waitForFrames(1)
      expect(animationOneOnStartSpy).toHaveBeenCalledTimes(1)
      waitForFrames(2)
      expect(animationTwoOnStartSpy).toHaveBeenCalledTimes(0)
      waitForFrames(3)
      expect(animationTwoOnStartSpy).toHaveBeenCalledTimes(1)
    })

    it('absolute offset', () => {
      const tween1OnStartSpy = jest.fn()
      const tween2OnStartSpy = jest.fn()
      const absoluteTimelineOnCompleteSpy = jest.fn()
      cinderella({
        onComplete: absoluteTimelineOnCompleteSpy,
      })
        .add({
          targets: {},
          transform: {
            foo: {
              to: 100,
              duration: 3 * frameRate,
            },
          },
          onStart: tween1OnStartSpy,
          onUpdate: jest.fn(),
        })
        .add({
          targets: {},
          transform: {
            foo: {
              to: 100,
              duration: 3 * frameRate,
            },
          },
          offset: 0,
          onStart: tween2OnStartSpy,
          onUpdate: jest.fn(),
        })
        .play()
      waitForFrames(1)
      expect(tween1OnStartSpy).toHaveBeenCalledTimes(1)
      expect(tween2OnStartSpy).toHaveBeenCalledTimes(1)
      waitForFrames(4)
      expect(absoluteTimelineOnCompleteSpy).toHaveBeenCalledTimes(1)
    })

    it('relative offset', () => {
      const tween1OnStartSpy = jest.fn()
      const tween2OnStartSpy = jest.fn()
      const absoluteTimelineOnCompleteSpy = jest.fn()
      const relativeOffsetTarget = {
        foo: 0,
        bar: 0,
      }
      cinderella({
        onComplete: absoluteTimelineOnCompleteSpy,
      })
        .add({
          targets: relativeOffsetTarget,
          transform: {
            foo: {
              to: 100,
              duration: 6 * frameRate,
            },
          },
          onStart: tween1OnStartSpy,
          onUpdate: jest.fn(),
        })
        .add({
          targets: relativeOffsetTarget,
          transform: {
            bar: {
              to: 100,
              duration: 3 * frameRate,
            },
          },
          offset: `-=${3 * frameRate}`,
          onStart: tween2OnStartSpy,
          onUpdate: jest.fn(),
        })
        .play()
      waitForFrames(1)
      expect(tween1OnStartSpy).toHaveBeenCalledTimes(1)
      waitForFrames(3)
      expect(tween2OnStartSpy).toHaveBeenCalledTimes(1)
      expect(relativeOffsetTarget.foo).toBeCloseTo(50)
      expect(relativeOffsetTarget.bar).toBeCloseTo(0)
      waitForFrames(4)
      expect(relativeOffsetTarget.foo).toBe(100)
      expect(relativeOffsetTarget.bar).toBe(100)
      expect(absoluteTimelineOnCompleteSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('frame listeners', () => {
    let animation

    beforeEach(() => {
      animation = cinderella().add({
        targets: {},
        transform: {
          foo: {
            to: 100,
            duration: 3 * frameRate,
          },
        },
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
