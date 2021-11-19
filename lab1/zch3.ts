const log = (msg?: any, ...optionalParams: any[]) => console.log(msg, ...optionalParams)
import { Cons, Nil, Stream, cons, none } from "./zutil"

const reduce = <A, B>(l: Stream<A>, z: B, f: (a: A, b: B) => B): B => {
  if (l.tag === "none")
    return z
  else return f(l.h(), reduce(l.t(), z, f))
}

const sum = (l: Stream<number>): number => 
  reduce(l, 0, (a, b) => a + b)

const product = (l: Stream<number>): number =>
  reduce(l, 1, (a, b) => a * b)

const alltrue = (l: Stream<boolean>): boolean =>
  reduce(l, true, (a, b:boolean) => a && b)

const multiply = (l: Stream<number>): number =>
  reduce(l, 1, (a, b) => a * b)

const doubleall = (l: Stream<number>): Stream<number> =>
  l.map(a => a * 2)

const summatrix = (ll: Stream<Stream<number>>): number =>
  sum(ll.map(sum))

