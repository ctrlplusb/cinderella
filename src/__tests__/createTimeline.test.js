import createTimeline from '../createTimeline'

describe('createTimeline', () => {
  it('absolute and relative stacking works', () => {
    const timeline = createTimeline([
      {
        offset: 500,
        duration: 100,
      },
      {
        duration: 200,
      },
      {
        duration: 300,
      },
    ])
    expect(timeline).toMatchObject({
      queue: {
        1: {
          executionStart: 500,
          executionEnd: 600,
        },
        2: {
          executionStart: 0,
          executionEnd: 200,
        },
        3: {
          executionStart: 200,
          executionEnd: 500,
        },
      },
      executionEnd: 600,
      relativeEnd: 500,
    })
  })

  it('single animation object works', () => {
    const timeline = createTimeline({
      duration: 1000,
    })
    expect(timeline).toMatchObject({
      queue: {
        1: {
          duration: 1000,
          executionEnd: 1000,
        },
      },
      relativeEnd: 1000,
      executionEnd: 1000,
    })
  })

  it('an array of animations work', () => {
    const timeline = createTimeline([
      {
        duration: 1000,
      },
      {
        duration: 500,
      },
    ])
    expect(timeline).toMatchObject({
      queue: {
        1: {
          duration: 1000,
          executionEnd: 1000,
        },
        2: {
          duration: 500,
          executionEnd: 1500,
        },
      },
      relativeEnd: 1500,
      executionEnd: 1500,
    })
  })

  it('correct reports the longest running animation idx', () => {
    const timeline = createTimeline([
      {
        duration: 1000,
      },
      {
        duration: 500,
      },
    ])
    expect(timeline.longestRunningAnimation).toEqual(2)
  })

  it('+= relative offset at beginning resolves correctly', () => {
    const timeline = createTimeline({
      duration: 1000,
      offset: '+=500',
    })
    expect(timeline).toMatchObject({
      queue: {
        1: {
          duration: 1000,
          offset: '+=500',
          executionStart: 500,
          executionEnd: 1500,
        },
      },
      relativeEnd: 1500,
      executionEnd: 1500,
    })
  })

  it('-= relative offset at beginning resolves correctly', () => {
    const timeline = createTimeline({
      duration: 1000,
      offset: '-=500',
    })
    expect(timeline).toMatchObject({
      queue: {
        1: {
          duration: 1000,
          offset: '-=500',
          executionStart: 0,
          executionEnd: 1000,
        },
      },
      relativeEnd: 1000,
      executionEnd: 1000,
    })
  })

  it('delay resolves correctly', () => {
    const timeline = createTimeline({
      duration: 1000,
      delay: 500,
    })
    expect(timeline).toMatchObject({
      queue: {
        1: {
          duration: 1000,
          delay: 500,
          executionStart: 500,
          executionEnd: 1500,
        },
      },
      executionEnd: 1500,
      relativeEnd: 1500,
    })
  })

  it('offset resolves correctly', () => {
    const timeline = createTimeline({
      duration: 1000,
      offset: 500,
    })
    expect(timeline).toMatchObject({
      queue: {
        1: {
          duration: 1000,
          offset: 500,
          executionStart: 500,
          executionEnd: 1500,
        },
      },
      executionEnd: 1500,
      relativeEnd: 0,
    })
  })

  describe('nested timelines', () => {
    it('resolve relatively to previous and next', () => {
      const timeline = createTimeline([
        {
          duration: 1000,
        },
        createTimeline([
          {
            duration: 300,
          },
        ]),
        {
          duration: 200,
        },
      ])
      expect(timeline).toMatchObject({
        queue: {
          1: {
            duration: 1000,
            executionStart: 0,
            executionEnd: 1000,
          },
          2: {
            duration: 300,
            executionStart: 1000,
          },
          3: {
            duration: 200,
            executionStart: 1300,
          },
        },
        relativeEnd: 1500,
        executionEnd: 1500,
      })
    })

    it('have their absolute offsets relative to previous', () => {
      const timeline = createTimeline([
        {
          duration: 1000,
        },
        createTimeline([
          {
            offset: 300,
            duration: 300,
          },
        ]),
        {
          duration: 200,
        },
      ])
      expect(timeline).toMatchObject({
        queue: {
          1: {
            duration: 1000,
            executionStart: 0,
            executionEnd: 1000,
          },
          2: {
            duration: 300,
            executionStart: 1300,
          },
          3: {
            duration: 200,
            executionStart: 1000,
          },
        },
        relativeEnd: 1200,
        executionEnd: 1600,
      })
    })
  })
})
