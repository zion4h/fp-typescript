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

export type Stream<T> = Nil<T> | Cons<T>
export type Pair = [number, number]

abstract class StreamBase<A> {
    //  reduce：附魔了惰性求值
    foldRight<B>(this: Stream<A>, z: () => B, f: (a: A, b: () => B) => B): B {
        if (this.tag === "none")
            return z()

        const self = this
        return f(self.h(), () => self.t().foldRight(z, f))
    }

    foldLeft<B>(this: Stream<A>, z: () => B, f: (b: () => B, a: A) => B): B {
        if (this.tag === "none")
            return z()

        const self = this
        return self.t().foldLeft(() => f(z, self.h()), f)
    }

    //  取前n个元素
    take(this: Stream<A>, n: number): Stream<A> {
        if (this.tag === "none" || n <= 0)
            return none()

        const self = this
        return cons(this.h, () => self.t().take(n - 1))
    }

    takeWhile(this: Stream<A>, p: (a: A) => boolean): Stream<A> {
        return this.foldRight(() => none(), (a, b) => p(a) ? cons(() => a, b) : b())
    }

    //  取位于index坐标上的数
    get(this: Stream<A>, i: number): A {
        if (this.tag === "none")
            throw new Error("[Type Error]: function \'get\' cannot apply to the data \'Nil\'.");

        const n = this.length()

        if (i >= n)
            throw new Error("the input data of function [get] should be smaller than length n.")
        else if (i < 0)
            return this.get(this.length() + i)
        else if (i === 0)
            return this.h()

        return this.t().get(i - 1);
    }

    //  丢弃前n个元素：配合take使用方便截取
    drop(this: Stream<A>, n: number): Stream<A> {
        if (n <= 0 || this.tag === "none")
            return this
        return this.t().drop(n - 1)
    }

    //  eps: 对无限流设定终止条件 
    //  withre: stop when abs(cur - prev) <= eps * abs(cur)
    //  within: stop when abs(cur - prev) <= eps
    withre(this: Stream<number>, eps: number): Stream<number> {
        if (this.tag === "none")
            return none()

        const self = this
        const [a, b] = this.take(2).toList()
        if (Math.abs(a - b) <= eps * Math.abs(b)) {
            return cons(self.h, () => cons(() => b, () => none()))
        }
        return cons(self.h, () => self.t().withre(eps))
    }

    //  打包：将两个Stream的元素按序两两打包
    zip(this: Stream<number>, that: () => Stream<number>): Stream<Pair> {
        const self = this
        const another = that()
        if (self.tag === "none" || another.tag === "none")
            return none()
        return cons(() => [self.h(), another.h()], () => self.t().zip(another.t))
    }

    //  打包：将两个Stream的元素按序两两执行二元运算
    zipWith<B, C>(this: Stream<A>,
        that: () => Stream<B>,
        f: (a: A, b: B) => C): Stream<C> {
        const self = this
        const another = that()
        if (self.tag === "none" || another.tag === "none")
            return none()
        return cons(() => f(self.h(), another.h()), () => self.t().zipWith(another.t, f))
    }

    //  元素存在判定
    exists(this: Stream<A>, p: (a: A) => boolean): boolean {
        return this.foldRight((): boolean => false, (a, b) => p(a) || b())
    }

    //  检查所有elem
    forall(this: Stream<A>, p: (a: A) => boolean): boolean {
        return this.foldRight((): boolean => true, (a, b) => p(a) && b())
    }

    //  append：将两个Stream叠加
    append(this: Stream<A>, that: () => Stream<A>): Stream<A> {
        return this.foldRight(that, (a, b) => cons(() => a, b))
    }

    //  flatMap 工具函数
    flatMap<B>(this: Stream<A>, f: (a: A) => Stream<B>): Stream<B> {
        return this.foldRight(() => none(), (a, b) => f(a).append(b))
    }

    // map Stream函数映射
    map<B>(this: Stream<A>, f: (a: A) => B): Stream<B> {
        const self = this
        return this.flatMap(a => stream(f(a)))
    }

    //  filter 过滤器
    filter(this: Stream<A>, p: (a: A) => boolean): Stream<A> {
        return this.flatMap(a => p(a) ? stream(a) : none())
    }

    length(this: Stream<A>): number {
        return this.foldRight(() => 0, (a, b) => b() + 1)
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

export class Nil<T> extends StreamBase<T> {
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

export const cons = <T>(h: () => T, t: () => Stream<T>): Stream<T> =>
    new Cons(memorize(h), memorize(t))

export const none = <T>(): Stream<T> => Nil.NIL

export const stream = <T>(...s: T[]): Stream<T> => {
    if (s.length === 0)
        return none()
    else
        return cons(() => s[0], () => stream(...s.slice(1)))
}

//  [1]squareroot(N)  牛顿-拉弗森公式
const next = (N: number) => (x: number): number =>
    (x + N / x) / 2

const repeat = <T>(f: (a: T) => T, x: T): Stream<T> =>
    cons(() => x, () => repeat(f, f(x)))

const sqrt = (a0: number, eps: number, N: number): Stream<number> => within(eps, repeat(next(N), a0))

const resqrt = (a0: number, eps: number, N: number): Stream<number> =>
    repeat(next(N), a0).withre(eps)
const within = (eps: number, l: Stream<number>): Stream<number> => {
    if (l.tag === "none")
        return none()

    const [a, b] = l.take(2).toList()
    if (Math.abs(a - b) <= eps) {
        return cons(l.h, () => cons(() => b, () => none()))
    }
    return cons(l.h, () => within(eps, l.t()))
}

log("\n===Square Roots Test===\n")
log("expect: square root(2) =", Math.sqrt(2))
log("\n[example 1]: sqrt(2)")
log("return: ", within(0.00000001, repeat(next(2), 1)).get(-1))
log("\n[example 2]: relativesqrt(2)")
log("return: ", repeat(next(2), 1).withre(0.00000001).get(-1))

//  [2]numerical differentiation
//  2.1
const easydiff = (f: (x: number) => number, x: number) => (h: number) =>
    (f(x + h) - f(x)) / h

const halve = (x: number): number => x / 2

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
    within(0.00000001, improve(differentiate(h0, f, x)))

const second = <T>(s: Stream<T>): T => {
    const head2elem = s.take(2)
    if (head2elem.length() < 2) {
        throw new Error("[Data Shape Error]: the element number of input \'Stream\' cannot be smaller than 2.")
    }

    const [a, b] = head2elem.toList()
    return b
}

const superman = (s: Stream<number>): Stream<number> =>
    repeat(improve, s).map(second)

const derivative = (h0: number, f: (a: number) => number, x: number): Stream<number> =>
    within(0.0001, superman(differentiate(h0, f, x)))

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
const easyintegrate = (f: (x: number) => number, a: number, b: number): number =>
    (f(a) + f(b)) * (b - a) / 2

const addpair = (x: Pair): number => {
    const [a, b] = x
    return a + b
}

const integrate_origin = (f: (x: number) => number, a: number, b: number): Stream<number> => {
    const mid = (a + b) / 2
    return cons(
        () => easyintegrate(f, a, b),
        () => integrate(f, a, mid).zipWith(() => integrate(f, mid, b), (a, b) => a + b)
    )
}

const integ = (f: (x: number) => number, a: number, b: number, fa: number, fb: number): Stream<number> => {
    const m = (a + b) / 2
    const fm = f(m)
    return cons(
        () => (fa + fb) * (b - a) / 2,
        () => integ(f, a, m, fa, fm).zip(() => integ(f, m, b, fm, fb)).map(addpair)
    )
}

const integrate = (f: (x: number) => number, a: number, b: number): Stream<number> =>
    integ(f, a, b, f(a), f(b))

const integrate_pro = (f: (x: number) => number, a: number, b: number): Stream<number> =>
    within(0.00001, integ(f, a, b, f(a), f(b)))
const integrate_plus = (f: (x: number) => number, a: number, b: number): Stream<number> =>
    integ(f, a, b, f(a), f(b)).withre(0.00001)


log("\n===Numerical Integration Test===\n")
const ft = (x: number): number =>
    1 / (1 + x * x)
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


