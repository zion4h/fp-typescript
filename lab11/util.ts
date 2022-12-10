//  简化打印语句，方便调试
export const log = (msg?: any, ...optionalParams: any[]) => console.log(msg, ...optionalParams)

abstract class ListBase<A> {
    // 可视化打印
    toString(this:List<A>): string {
        var msg = ""   
        switch (this.tag) {
            case "none": {
                msg = "List[]"
                break
            }
            case "cons": {
                msg = "List[" + this.h
                var cur = this.t
                while (cur.tag === 'cons') {
                    msg += ", " + cur.h
                    cur = cur.t
                }
                msg += "]"
                break
            }
            case "tree": {
                msg += "Node " + this.h
                if (this.t.tag === 'cons') {
                    msg += "(" + this.t.toString() + ")"
                } 
                break
            }
        }
        return msg
    }
}

export type List<T> = Nil<T> | Cons<T> | Node<T>
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
      return cons(s[0])(list(...s.slice(1)))
}
export const cons = <T>(h: T) => (t: List<T>) => new Cons(h, t)
export const none = <T>(): List<T> => Nil.Nil


export class Node<T> extends ListBase<T>{
    readonly tag: "tree" = "tree"

    constructor(readonly h: T, readonly t: List<Node<T>>) {
        super()
    }
}

export const node = <T>(h: T) => (l: List<Node<T>>): Node<T> => new Node(h, l)

