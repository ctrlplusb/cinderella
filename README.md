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

 - Easily define complex animation timelines.
 - Pause, resume, seek, and dispose at any time.
 - A barrel of easing functions available, or define your own.
 - Simple and generic API with extensions to target DOM/Canvas/Frameworks.
 - Animations auto-optimised to run over requestAnimationFrame.
 - 3kB gzipped

## TOCs

  - [Introduction](#introduction)
  - [Tutorial](#tutorial)
  - [API](#api)
  - [Credits](#credits)

## Introduction

> WIP

I must be up front and say that this library is heavily inspired by the supremely
awesome [animejs](http://animejs.com/) - I would highly recommend that you look
there first before considering this library. It's heavily popular, well
maintained and just all out badass.

I created this library as I have my own opinions on creating timelines and also
wanted to be able to expose a generic core to solve some of my "alternative"
use cases.

## Tutorial

> WIP

## API

> WIP

## Credits

Massive ❤️ to Mark O'Connor for donating the npm package `cinderella`.  ️