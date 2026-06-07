// Minimal shim for `three/tsl` used by some builds of three-globe.
// This provides the named exports that three-globe imports from `src/shims/three-tsl.js`.
// The runtime path used in this project should be the CPU fallback, so these stubs
// are enough to satisfy the build and avoid unresolved imports.

class TslValue {
  constructor(value) {
    this.value = value
  }

  mul(other) {
    const v = other instanceof TslValue ? other.value : other
    return new TslValue(this.value * v)
  }

  add(other) {
    const v = other instanceof TslValue ? other.value : other
    return new TslValue(this.value + v)
  }

  sub(other) {
    const v = other instanceof TslValue ? other.value : other
    return new TslValue(this.value - v)
  }

  div(other) {
    const v = other instanceof TslValue ? other.value : other
    return new TslValue(this.value / v)
  }

  lessThan(other) {
    const v = other instanceof TslValue ? other.value : other
    return new TslValue(this.value < v)
  }

  assign(_) {
    return this
  }

  addAssign(_) {
    return this
  }
}

function createStorageElement() {
  return {
    xy: new TslValue(0),
    z: new TslValue(0),
    assign() {
      return this
    },
    addAssign() {
      return this
    },
    add() {
      return new TslValue(0)
    },
    sub() {
      return new TslValue(0)
    },
    mul() {
      return new TslValue(0)
    },
    div() {
      return new TslValue(0)
    },
    lessThan() {
      return new TslValue(false)
    }
  }
}

export const Fn = fn => fn
export const If = (cond, thenFn, elseFn) => {
  const value = cond instanceof TslValue ? cond.value : cond
  if (value) {
    return thenFn()
  }
  if (elseFn) {
    return elseFn()
  }
}
export const uniform = value => new TslValue(value)
export const storage = (buffer /*, type, count */) => {
  if (buffer && typeof buffer.element !== 'undefined') {
    return buffer
  }
  return {
    element() {
      return createStorageElement()
    }
  }
}
export const float = value => new TslValue(value)
export const instanceIndex = 0
export const Loop = (n, body) => {
  const count = n instanceof TslValue ? n.value : n
  for (let i = 0; i < count; i += 1) {
    body({ i })
  }
}
export const sqrt = x => new TslValue(Math.sqrt(x instanceof TslValue ? x.value : x))
export const sin = x => new TslValue(Math.sin(x instanceof TslValue ? x.value : x))
export const cos = x => new TslValue(Math.cos(x instanceof TslValue ? x.value : x))
export const asin = x => new TslValue(Math.asin(x instanceof TslValue ? x.value : x))
export const exp = x => new TslValue(Math.exp(x instanceof TslValue ? x.value : x))
export const negate = x => new TslValue(-(x instanceof TslValue ? x.value : x))

export default {
  Fn,
  If,
  uniform,
  storage,
  float,
  instanceIndex,
  Loop,
  sqrt,
  sin,
  cos,
  asin,
  exp,
  negate
}
