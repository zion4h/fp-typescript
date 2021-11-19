const log = (msg?: any, ...optionalParams: any[]) => console.log(msg, ...optionalParams)
//  lazy
const memorize = <T>(f: () => T): () => T =>{
  let memo: T | null = null
  return () => {
    if (memo === null)
      memo = f()
    return memo
  }
}

import { Cons, Nil, Stream, cons, none } from "./zutil"
import { Pair } from "./zutil"

//  [1]squareroot(N)
const next = (N:number) => (x:number): number =>
  (x + N / x) / 2

const repeat = <T>(f: (a: T) => T, x: T): Stream<T> => 
  cons(() => x, () => repeat(f, f(x)))

const sqrt = (a0:number, eps:number, N:number): Stream<number> =>
  repeat(next(N), a0).within(eps)

const resqrt = (a0:number, eps:number, N:number): Stream<number> =>
  repeat(next(N), a0).withre(eps)

// sqrt(1, 0.001, 27).toString()
// resqrt(1, 0.001, 27).toString()

//  [2]numerical differentiation
//  2.1
const easydiff = (f: (x: number) => number, x: number) => (h:number) => 
  (f(x + h) - f(x)) / h

const halve = (x: number):number => x / 2

const differentiate = (h0: number, f: (a: number) => number, x: number): Stream<number> => 
  repeat(halve, h0).map(easydiff(f, x))

  const fts = (x:number): number => 
  1 + x + x * x

differentiate(0.5, fts, 2).take(10).toString()
//  2.2
const elimerror = (n: number, s: Stream<number>): Stream<number> => {
  const [a, b] = s.take(2).toList()
  return cons(() => (b * Math.pow(2, n) - a) / (Math.pow(2, n) - 1), 
              () => elimerror(n, s.drop(1)))
}

const order = (s: Stream<number>): number => {
  const [a, b, c] = s.take(3).toList()

  return Math.round(Math.log2((a - c) / (b - c) - 1))
}

const improve = (s: Stream<number>): Stream<number> => {
  const n = order(s)
  return elimerror(n, s)
}

// //  expect:5
// differentiate(0.5, fts, 2).within(0.0001).toString()
// elimerror(order(differentiate(0.5, fts, 2)), 
//     differentiate(0.5, fts, 2)).take(10).toString()
// improve(differentiate(0.5, fts, 2)).take(10).toString()

//  暂时设定一个默认eps=0.0001
const derivative_vanilla = (h0: number, f: (a: number) => number, x: number): Stream<number> =>
  improve(differentiate(h0, f, x)).within(0.0001)

const second = <T>(s: Stream<T>): T => {
  const [a, b] = s.take(2).toList()
  return b
}

const superman = (s:Stream<number>): Stream<number> => 
  repeat(improve, s).map(second)

// superman(differentiate(0.5, fts, 2)).take(10).toString()

const derivative = (h0: number, f: (a: number) => number, x: number): Stream<number> =>
  superman(differentiate(h0, f, x)).within(0.0001)

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

log("example 1 :")
const ft = (x:number): number => 
  1 / ( 1 + x * x)
log("expect:", Math.atan(1) - Math.atan(0))
//  expect:0.7853981633974483 
improve(integrate(ft, 0, 1)).withre(0.00001).toString()

log("example 2 :")
log("expect:", -Math.cos(4) + Math.atan(0))
// expext(1.6536436208636118)
superman(integrate(Math.sin, 0, 4)).take(6).toString()