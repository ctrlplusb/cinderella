// const toPrecision = (number: number, precision = 4): number =>
//   parseFloat(number.toFixed(precision))

// To avoid crazy issues with floating point arithmetic we will
// scale our inputs up to integers and then scale them back
// down to floats when returning/assigning values.
const scalePrecision = 10 ** 5

export const toInt = x => parseInt(x, 10)

export const scaleUp = (x: number) => toInt(x * scalePrecision)

export const scaleDown = (x: number) => x / scalePrecision
