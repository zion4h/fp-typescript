//  简化打印语句，方便调试
export const log = (msg?: any, ...optionalParams: any[]) => 
    console.log(msg, ...optionalParams)

abstract class ListBase<A> {
    toString(this:List<A>): string {
        var msg = "List["   
        switch (this.tag) {
            case "none": break
            case "cons": {
                msg += this.h
                var cur = this.t
                while (cur.tag === 'cons') {
                    msg += ", " + cur.h
                    cur = cur.t
                }
            }
        }
        msg += "]"
        return msg
    }
}

export type List<T> = Nil<T> | Cons<T>
export class Nil<T> extends ListBase<T> {
    // 方便类型推断的特殊技巧
    readonly tag: "none" = "none"
  
    // 单例模式
    static readonly Nil: List<never> = new Nil()
    private constructor() {
        super()
    }
}

export class Cons<T> extends ListBase<T>{
    readonly tag: "cons" = "cons"
  
    // h表示第一个元素，t表示剩余部分构成的list
    constructor(readonly h: T, readonly t: List<T>) {
        super()
    }
}

export const list = <T>(...s: T[]): List<T> => {
    if (s.length === 0)
      return none()
    else
      return cons(s[0], list(...s.slice(1)))
}
export const cons = <T>(h: T, t: List<T>): List<T> => new Cons(h, t)
export const none = <T>(): List<T> => Nil.Nil

const Xs = list(1, 1, 2, 3, 5, 8, 13, 21)
log("Xs is " + Xs.toString()) 
// Output:Xs is List[1, 1, 2, 3, 5, 8, 13, 21]

const foldr = <T>(f: (a: any, b: T)=>T, x: T) => (l: List<any>):T => {
    if (l.tag === "none")
      return x
    else return f(l.h, foldr(f, x)(l.t))
}
const add = (a:number, b:number):number => a + b
const sum = foldr(add, 0)
log("return: ", sum(Xs))
// Output:return:  54

const Z1 = list(1, 2)
const Z2 = list(3, 4)
const append = <T>(a: List<T>, b: List<T>): List<T> => {
    return foldr(cons, b)(a)
}
log("append", Z1.toString(), "and", Z2.toString(), "is", append(Z1, Z2).toString())
// Output:append List[1, 2] and List[3, 4] is List[1, 2, 3, 4]

const count = <T>(a: T, n: number) => n + 1
const length = foldr(count, 0)
log("count", Xs.toString(), "is", length(Xs))
// Output:count List[1, 1, 2, 3, 5, 8, 13, 21] is 8

const doubleandcons = (n: number, list: List<number>) => {
    return cons(2 * n, list)
}
const doubleall = foldr(doubleandcons, none())
log("doubleallcons", Xs.toString(), "is", doubleall(Xs).toString())
// Output:doubleallcons List[1, 1, 2, 3, 5, 8, 13, 21] is List[2, 2, 4, 6, 10, 16, 26, 42]


