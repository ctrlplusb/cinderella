> __WORK IN PROGRESS - DO NOT USE__

# cinderella

A tiny animation library.

```javascript
import cinderella from 'cinderella'

const input = document.getElementById('#foo')

cinderella({
  from: 0,
  to: 100,
  duration: 1000,
  onUpdate: x => { input.value = x }
}).play()
```

_or the equivalent use our DOM extension_

```javascript
import cinderella from 'cinderella/dom'

cinderella({
  target: '#foo',
  duration: 1000,
  value: 100
}).play()
```

[![npm](https://img.shields.io/npm/v/cinderella.svg?style=flat-square)](http://npm.im/cinderella)
[![MIT License](https://img.shields.io/npm/l/cinderella.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Travis](https://img.shields.io/travis/ctrlplusb/cinderella.svg?style=flat-square)](https://travis-ci.org/ctrlplusb/cinderella)
[![Codecov](https://img.shields.io/codecov/c/github/ctrlplusb/cinderella.svg?style=flat-square)](https://codecov.io/github/ctrlplusb/cinderella)

 - Timelines.
 - Play, pause, loop, stop.
 - Easing functions.
 - Simple API.
 - Optimised over requestAnimationFrame.
 - 3kB gzipped

## TOCs

  - [Introduction](#introduction)
  - [Tutorial](#tutorial)
  - [API](#api)
  - [Credits](#credits)

## Introduction

> WIP

I must be up front and say that this library is heavily inspired by the supremely
awesome [animejs](http://animejs.com/) - I would highly recommend that you try them
out before this library. Anime is extremely popular, well maintained, and just all out badass.

## Tutorial

> WIP

## API

> WIP

## Credits

Massive ❤️ to Mark O'Connor for donating the npm package `cinderella`.  ️