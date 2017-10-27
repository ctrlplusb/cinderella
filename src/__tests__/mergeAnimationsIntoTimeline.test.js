import mergeAnimationsIntoTimeline from '../mergeAnimationsIntoTimeline'

describe('mergeAnimationsIntoTimeline', () => {
  it('should work as expected', () => {
    let timeline = mergeAnimationsIntoTimeline([
      {
        // id: 1,
        duration: 1000,
        offset: 1000,
      },
      {
        // id: 2,
        duration: 500,
      },
      {
        // id: 3,
        duration: 1000,
        offset: '-=100',
      },
      {
        // id: 4,
        duration: 500,
        offset: '+=150',
      },
      {
        // id: 5,
        duration: 250,
      },
      [
        {
          // id: 6,
          duration: 500,
        },
        {
          // id: 7,
          offset: '-=100',
          duration: 500,
        },
      ],
      {
        // id: 8,
        duration: 500,
      },
      {
        // id: 9,
        offset: '+=1000',
        duration: 500,
      },
      {
        // id: 10,
        duration: 500,
      },
    ])

    expect(timeline.longestRunningAnimation).toEqual(10)

    timeline = mergeAnimationsIntoTimeline(
      [
        {
          // id: 11,
          duration: 500,
        },
        [
          {
            // id: 12,
            offset: '+=1000',
            duration: 500,
          },
          {
            // id: 13,
            duration: 500,
          },
          {
            // id: 14,
            offset: 500,
            duration: 500,
          },
        ],
      ],
      timeline,
    )

    expect(timeline.longestRunningAnimation).toEqual(12)

    expect(timeline.queue).toMatchObject({
      1: {
        duration: 1000,
        offset: 1000,
      },
      2: {
        duration: 500,
        offset: 0,
      },
      3: {
        duration: 1000,
        offset: 400,
      },
      4: {
        duration: 500,
        offset: 1550,
      },
      5: {
        duration: 250,
        offset: 2050,
      },
      6: {
        duration: 500,
        offset: 2300,
      },
      7: {
        offset: 2200,
        duration: 500,
      },
      8: {
        offset: 2800,
        duration: 500,
      },
      9: {
        offset: 4300,
        duration: 500,
      },
      10: {
        offset: 4800,
        duration: 500,
      },
      11: {
        offset: 5300,
        duration: 500,
      },
      12: {
        offset: 6800,
        duration: 500,
      },
      13: {
        offset: 5800,
        duration: 500,
      },
      14: {
        offset: 500,
        duration: 500,
      },
    })
    expect(timeline.duration).toEqual(7300)
    expect(timeline.animationIdx).toEqual(14)
  })
})
