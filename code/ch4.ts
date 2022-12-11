//  简化打印语句：方便测试
export const log = (msg?: any, ...optionalParams: any[]) => console.log(msg, ...optionalParams)

//  lazy
const memorize = <T>(f: () => T): () => T => {
    let memo: T | null = null
    return () => {
        if (memo === null)
            memo = f()
        return memo
    }
}

type Stream<T> = Nil<T> | Cons<T>
type Pair<T> = [T, T]

abstract class StreamBase<A> {
    //  取前n个元素
    take(this: Stream<A>, n: number): Stream<A> {
        if (this.tag === "none" || n <= 0)
            return none()

        const self = this
        return cons(this.h, () => self.t().take(n - 1))
    }

    toList(this: Stream<A>): A[] {
        var ans: A[] = []
        var cur = this
        while (cur.tag === "cons") {
            ans.push(cur.h())
            cur = cur.t()
        }
        return ans
    }

    toString(this: Stream<A>): string {
        var msg = "Stream("
        switch (this.tag) {
            case "none": break
            case "cons": {
                msg += this.h()
                var cur = this.t()
                while (cur.tag === 'cons') {
                    msg += ", " + cur.h()
                    cur = cur.t()
                }
            }
        }
        msg += ")"
        return msg
    }
}

class Nil<T> extends StreamBase<T> {
    static readonly NIL: Stream<never> = new Nil()

    readonly tag: "none" = "none"

    private constructor() {
        super()
    }
}

export class Cons<T> extends StreamBase<T>{
    readonly tag: "cons" = "cons"

    constructor(readonly h: () => T, readonly t: () => Stream<T>) {
        super()
    }
}

const cons = <T>(h: () => T, t: () => Stream<T>): Stream<T> => new Cons(memorize(h), memorize(t))
const none = <T>(): Stream<T> => Nil.NIL

const stream = <T>(...s: T[]): Stream<T> => {
    if (s.length === 0)
        return none()
    else
        return cons(() => s[0], () => stream(...s.slice(1)))
}

const foldr = <A, B>(f: (a: A, b: () => B) => B, x: () => B, s: Stream<A>): B => {
    if (s.tag === "none")
        return x()
    return f(s.h(), () => foldr(f, x, s.t()))
}
const Xs = stream(1, 1, 2, 3, 5, 8, 13, 21)
const Z1 = stream(1, 2)
const Z2 = stream(3, 4)
const M1 = stream(Z1, Z2, Xs)
const add = (a: number, b: () => number): number => a + b()
const double = (n: number) => 2 * n
const sum = (s: Stream<number>) => foldr(add, () => 0, s)
// Output:return:  54
// append
const append = <T>(s1: Stream<T>, s2: () => Stream<T>): Stream<T> => {
    return foldr((a, b) => cons(() => a, b), s2, s1)
}
// length
const count = <T>(a: T, n: () => number) => n() + 1
const length = <T>(s: Stream<T>): number => foldr(count, () => 0, s)
const flatMap = <A, B>(s: Stream<A>, f: (a: A) => Stream<B>): Stream<B> => {
    return foldr((a, b) => append(f(a), b), () => none(), s)
}
// map Stream函数映射
const map = <A, B>(s: Stream<A>, f: (a: A) => B): Stream<B> => flatMap(s, a => stream(f(a)))
const doubleall = (s: Stream<number>) => map(s, double)

// summatrix
const summatrix = (mat: Stream<Stream<number>>): number =>
    sum(map(mat, sum))

//  [1]squareroot(N)  牛顿-拉弗森公式
const next = (n: number) => (x: number): number =>
    (x + n / x) / 2

const repeat = <T>(f: (x: T) => T, a: T): Stream<T> =>
    cons(() => a, () => repeat(f, f(a)))

// 根据无限流的终止条件得到有限序列
const within = (eps: number, s: Stream<number>): Stream<number> => {
    if (s.tag === "none")
        return none()

    const [a, b] = s.take(2).toList()
    if (Math.abs(a - b) <= eps) {
        return cons(s.h, () => cons(() => b, () => none()))
    }
    return cons(s.h, () => within(eps, s.t()))
}

const withre = (eps: number, s: Stream<number>): Stream<number> => {
    if (s.tag === "none")
        return none()

    const [a, b] = s.take(2).toList()
    if (Math.abs(a - b) <= eps * Math.abs(b)) {
        return cons(s.h, () => cons(() => b, () => none()))
    }
    return cons(s.h, () => withre(eps, s.t()))
}

const sqrt = (a0: number, eps: number, n: number): Stream<number> =>
    within(eps, repeat(next(n), a0))
const relativesqrt = (a0: number, eps: number, n: number): Stream<number> =>
    withre(eps, repeat(next(n), a0))

//  [2]numerical differentiation
const easydiff = (f: (x: number) => number, x: number) => (h: number) =>
    (f(x + h) - f(x)) / h

const halve = (x: number): number => x / 2
const differentiate = (h0: number, f: (a: number) => number, x: number): Stream<number> =>
    map(repeat(halve, h0), easydiff(f, x))

const elimerror = (n: number, s: Stream<number>): Stream<number> => {
    if (s.tag === 'none')
        return none()
    if (n === 0)
        return s.t()
    if (length(s.take(2)) < 2) return s

    const [a, b] = s.take(2).toList()
    return cons(() => (b * Math.pow(2, n) - a) / (Math.pow(2, n) - 1),
        () => elimerror(n, s.t()))
}
const order = (s: Stream<number>): number => {
    const head3elem = s.take(3)
    if (length(head3elem) < 3) {
        throw new Error("[Data Shape Error]: the element number of input \'Stream\' cannot be smaller than 3.")
    }

    const [a, b, c] = head3elem.toList()
    return a === b ? 0 : Math.round(Math.log2((a - c) / (b - c) - 1))
}
const improve = (s: Stream<number>): Stream<number> => {
    if (s.tag === 'none')
        return s
    return elimerror(order(s), s)
}


const second = <T>(s: Stream<T>): T => {
    const head2elem = s.take(2)
    if (length(head2elem) < 2) {
        throw new Error("[Data Shape Error]: the element number of input \'Stream\' cannot be smaller than 2.")
    }

    const [a, b] = head2elem.toList()
    return b
}
const superman = (s: Stream<number>): Stream<number> =>
    map(repeat(improve, s), second)
// log("\n===Numerical Differentiation Test===\n")
// const fn1 = (x: number): number =>
//     Math.pow(x, 3) + x + 13
// const dfn1 = (x: number): number =>
//     3 * Math.pow(x, 2) + 1
// log("fn1 = X**3 + x + 13")
// log("d.fn1 = 3 * X**2 + 1")
// log("\n[example 1]: d.fn1(3)")
// log("expect:", dfn1(3))
// const fn2 = differentiate(1, fn1, 3)
// log("init:", fn2.take(10).toString())
// log("improve:", improve(fn2).take(10).toString())
// log("super:", within(0.0001, superman(fn2)).take(10).toString())

//  [3]numerical integration
const easyintegrate = (f: (x: number) => number, a: number, b: number): number =>
    (f(a) + f(b)) * (b - a) / 2

const addpair = (x: Pair<number>): number => {
    const [a, b] = x
    return a + b
}

//  打包：将两个Stream的元素按序两两执行二元运算
const zip2 = <T>(s1: Stream<T>, s2: () => Stream<T>): Stream<Pair<T>> => {
    const self = s1
    const another = s2()
    if (self.tag === "none" || another.tag === "none")
        return none()
    else
        return cons(() => [self.h(), another.h()], () => zip2(self.t(), another.t))
}

const integrate_origin = (f: (x: number) => number, a: number, b: number): Stream<number> => {
    const mid = (a + b) / 2
    return cons(
        () => easyintegrate(f, a, b),
        () => map(zip2(integrate_origin(f, a, mid), () => integrate_origin(f, mid, b)), addpair)
    )
}

const integ = (f: (x: number) => number, a: number, b: number, fa: number, fb: number): Stream<number> => {
    const m = (a + b) / 2
    const fm = f(m)
    return cons(
        () => (fa + fb) * (b - a) / 2,
        () => map(zip2(integ(f, a, m, fa, fm), () => integ(f, m, b, fm, fb)), addpair)
    )
}
const integrate = (f: (x: number) => number, a: number, b: number): Stream<number> =>
    integ(f, a, b, f(a), f(b))

log("\n===Numerical Integration Test===\n")
log("[ example 1 ]: improve (integrate f 0 1)")
log("                where f x=1/(1+x * x)")
log("integrate f = arctan(x), so (integrate f 0 1) = arctan(1) - arctan(0)")
log("expect:", Math.atan(1) - Math.atan(0))
const ft = (x: number): number => 1 / (1 + x * x)
log("Return:", withre(0.00000001, improve(integrate(ft, 0, 1))).toString())

log("\n[ example 2 ]: super (integrate sin 0 4)")
log("integrate sin = -cos(x), so (integrate sin 0 4) = -cos(4) + cos(0)")
log("expect:", -Math.cos(4) + Math.cos(0))
log("Return:", withre(0.00000001, superman(integrate(Math.sin, 0, 4))).toString())