import { log, Stream, stream, cons, Pair } from "./zutil"

//  [1]squareroot(N)  牛顿-拉弗森公式
const next = (N:number) => (x:number): number =>
  (x + N / x) / 2

const repeat = <T>(f: (a: T) => T, x: T): Stream<T> => 
  cons(() => x, () => repeat(f, f(x)))

const sqrt = (a0:number, eps:number, N:number): Stream<number> =>
  repeat(next(N), a0).within(eps)

const resqrt = (a0:number, eps:number, N:number): Stream<number> =>
  repeat(next(N), a0).withre(eps)

log("\n===Square Roots Test===\n")
log("expect: square root(2) =", Math.sqrt(2))
log("\n[example 1]: sqrt(2)")
log("return: ", repeat(next(2), 1).within(0.00000001).get(-1))
log("\n[example 2]: relativesqrt(2)")
log("return: ", repeat(next(2), 1).withre(0.00000001).get(-1))

//  [2]numerical differentiation
//  2.1
const easydiff = (f: (x: number) => number, x: number) => (h:number) => 
  (f(x + h) - f(x)) / h

const halve = (x: number):number => x / 2

const differentiate = (h0: number, f: (a: number) => number, x: number): Stream<number> => 
  repeat(halve, h0).map(easydiff(f, x))

//  2.2
const elimerror = (n: number, s: Stream<number>): Stream<number> => {
  if (s.take(2).length() < 2) return s

  const [a, b] = s.take(2).toList()
  // 添加了一个极小数防止出现奇怪情况(方案已舍弃)
  return cons(() => (b * Math.pow(2, n) - a) / (Math.pow(2, n) - 1), 
              () => elimerror(n, s.drop(1)))
}

const order = (s: Stream<number>): number => {
  const head3elem = s.take(3)
  if (head3elem.length() < 3) {
    throw new Error("[Data Shape Error]: the element number of input \'Stream\' cannot be smaller than 3.")
  }

  const [a, b, c] = head3elem.toList()
  return a === b ? 0 : Math.round(Math.log2((a - c) / (b - c) - 1))
}

const improve = (s: Stream<number>): Stream<number> => {
  const n = order(s)

  return n === 0 ? s.drop(1) : elimerror(n, s)
}

//  暂设一个默认eps=0.00000001
const derivative_vanilla = (h0: number, f: (a: number) => number, x: number): Stream<number> =>
  improve(differentiate(h0, f, x)).within(0.00000001)

const second = <T>(s: Stream<T>): T => {
  const head2elem = s.take(2)
  if (head2elem.length() < 2) {
    throw new Error("[Data Shape Error]: the element number of input \'Stream\' cannot be smaller than 2.")
  }

  const [a, b] = head2elem.toList()
  return b
}

const superman = (s:Stream<number>): Stream<number> => 
  repeat(improve, s).map(second)

const derivative = (h0: number, f: (a: number) => number, x: number): Stream<number> =>
  superman(differentiate(h0, f, x)).within(0.0001)

log("\n===Numerical Differentiation Test===\n")
const fn1 = (x: number): number => 
  Math.pow(x, 3) + x + 13
const dfn1 = (x: number): number =>
  3 * Math.pow(x, 2) + 1
log("fn1 = X**3 + x + 13")
log("d.fn1 = 3 * X**2 + 1")
log("\n[example 1]: d.fn1(3)")
log("expect: ", dfn1(3))
const fn2 = differentiate(1, fn1, 3)
log("return: ", derivative(1, fn1, 3).get(-1))
log("\n[example 2]: d.fn1(1)")
log("expect: ", dfn1(1))
log("return: ", derivative(1, fn1, 1).get(-1))


//  [3]numerical integration
const easyintegrate = (f: (x:number) => number, a: number, b: number): number => 
  (f(a) + f(b)) * (b - a) / 2

const addpair = (x: Pair): number => {
  const [a, b] = x
  return a + b
}

const integrate_origin = (f: (x:number) => number, a: number, b: number): Stream<number> => {
  const mid = (a + b) / 2
  return cons(
    () => easyintegrate(f, a, b),
    () => integrate(f, a, mid).zipWith(() => integrate(f, mid, b), (a, b) => a + b)
  )
}

const integ = (f: (x:number) => number, a: number, b: number, fa: number, fb: number): Stream<number> => {
  const m = (a + b) / 2
  const fm = f(m)
  return cons(
    () => (fa + fb) * (b - a) / 2,
    () => integ(f, a, m, fa, fm).zip(() => integ(f, m, b, fm, fb)).map(addpair)
  )
}

const integrate = (f: (x:number) => number, a: number, b: number): Stream<number> =>
  integ(f, a, b, f(a), f(b))

const integrate_pro = (f: (x:number) => number, a: number, b: number): Stream<number> =>
  integ(f, a, b, f(a), f(b)).within(0.00001)
const integrate_plus = (f: (x:number) => number, a: number, b: number): Stream<number> =>
  integ(f, a, b, f(a), f(b)).withre(0.00001)


log("\n===Numerical Integration Test===\n")
const ft = (x:number): number => 
  1 / ( 1 + x * x)
log("ft1 = 1 / (1 + x ** 2)")
log("f.ft1 = arctan(x)")
log("\nft2 = sin(x)")
log("f.ft2 = -cos(x)")

log("\n[ example 1 ]: f.ft1(0, 1)")
// const ret1 = improve(integrate(ft, 0, 1)).withre(0.00000001)
// log(ret1.toString())
log("expect:", Math.atan(1) - Math.atan(0))
log("Return:", improve(integrate(ft, 0, 1)).withre(0.00000001).get(-1))

log("\n[ example 2 ]: f.ft2(0, 4)")
//  当Math.sin函数improve到一定程度后(order = 0)便不再适用于order公式
// const ret2 = superman(integrate(Math.sin, 0, 4)).withre(0.00000001)
// log(ret2.toString())
log("expect:", -Math.cos(4) + Math.cos(0))
log("Return:", superman(integrate(Math.sin, 0, 4)).withre(0.00000001).get(-1))


