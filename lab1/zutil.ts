//  打印语句简写版
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
  
  //  丢弃前n个元素：配合take使用方便截取
  drop(this: Stream<A>, n: number): Stream<A> {
    if (n <= 0 || this.tag === "none")
      return this
    return this.t().drop(n - 1)
  }

  //  eps: 对无限流设定终止条件 
  //  withre: stop when abs(cur - prev) <= eps * abs(cur)
  //  within: stop when abs(cur - prev) <= eps
  within(this: Stream<number>, eps: number): Stream<number> {
    if (this.tag === "none")
      return none()

    const self = this
    const [a, b] = self.take(2).toList()
    if (Math.abs(a - b) <= eps) {
      return cons(self.h, () => cons(() => b, () => none()))
    }
    return cons(self.h, () => self.t().within(eps))
  }
  withre(this: Stream<number>, eps: number): Stream<number> {
    if (this.tag === "none")
      return none()

    const self = this
    const [a, b] = this.take(2).toList()
    if (Math.abs(a - b) <= eps * Math.abs(b)) {
      return cons(self.h, () => cons(() => b, () => none()))
    }
    return cons(self.h, () => self.t().within(eps))
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
                f:(a: A, b: B) => C): Stream<C> {
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
    return this.flatMap(a => Stream(f(a)))
  }
  // map<B>(this: Stream<A>, f: (a: A) => B): Stream<B> {
  //   return this.foldRight(() => none(), (a, b) => Stream(f(a)).append(b))
  // }
  
  //  filter 过滤器
  filter(this: Stream<A>, p: (a: A) => boolean): Stream<A> {
    return this.flatMap(a => p(a) ? Stream(a) : none())
  }
  // filter(this: Stream<A>, p: (a: A) => boolean): Stream<A> {
  //   return this.foldRight(
  //     () => none(),
  //     (a, b) => p(a) ? cons(() => a, b) : b(),
  //   )
  // }

  length(this:Stream<A>):number {
    return this.foldRight(() => 0, (a, b) => b() + 1)
  }

  toList(this:Stream<A>):A[] {
    var ans:A[] = []
    var cur = this
    while (cur.tag === "cons") {
      ans.push(cur.h())
      cur = cur.t()
    }
    return ans
  }

  toString(this:Stream<A>) {
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
    log(msg)
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
  readonly tag:"cons"="cons"

  constructor(readonly h: () => T, readonly t: () => Stream<T>) {
      super()
  }
}

export const cons = <T>(h: () => T, t: () => Stream<T>): Stream<T> => 
  new Cons(memorize(h), memorize(t))

export const none = <T>(): Stream<T> => Nil.NIL

export const Stream = <T>(...s: T[]): Stream<T> => {
  if (s.length === 0)
    return none()
  else
    return cons(() => s[0], () => Stream(...s.slice(1)))
}
export default { Cons, Nil, cons, none, Stream }
