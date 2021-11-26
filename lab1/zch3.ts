import { log, Stream, stream } from "./zutil"

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

const anytrue = (l: Stream<boolean>): boolean =>
  reduce(l, false, (a, b:boolean) => a || b)

const doubleall = (l: Stream<number>): Stream<number> =>
  l.map(a => a * 2)

const summatrix = (ll: Stream<Stream<number>>): number =>
  sum(ll.map(sum))

// 测试代码如下：
log("\n===Basic Test===\n")
const Xs = stream(1, 1, 2, 3, 5, 8, 13, 21)
const Ys = stream(true, false, false)
log("Xs:", Xs.toString())
log("Ys:", Ys.toString())

log("\n[example 1]: sum(Xs)")
log("return: ", sum(Xs))

log("\n[example 2]: product(Xs)")
log("return: ", product(Xs))

log("\n[example 3]: alltrue(Ys)")
log("return: ", alltrue(Ys))

log("\n[example 4]: anytrue(Ys)")
log("return: ", anytrue(Ys))

log("\n===Tools Test===\n")
const a = stream(1, 2, 3, 4)
const b = stream(5, 6, 7)
const c = stream(a, b)
log("a:", a.toString())
log("b:", b.toString())
log("c:", c.toString())

log("\n[example 1]: a.append(b)")
log("return: ", a.append(() => b).toString())

log("\n[example 2]: doubleall(a)")
log("return: ", a.map(x => x * 2).toString())

log("\n[example 3]: summatrix(c)")
log("return: ", sum(c.map(sum)).toString())

