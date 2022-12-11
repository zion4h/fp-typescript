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

type List<T> = Nil<T> | Cons<T> | Node<T>
class Nil<T> extends ListBase<T> {
    // 方便类型推断的特殊技巧
    readonly tag: "none" = "none"
  
    // 单例模式
    static readonly Nil: List<never> = new Nil()
    private constructor() {
        super()
    }
}

class Cons<T> extends ListBase<T>{
    readonly tag: "cons" = "cons"
  
    // h表示第一个元素，t表示剩余部分构成的list
    constructor(readonly h: T, readonly t: List<T>) {
        super()
    }
}

const list = <T>(...s: T[]): List<T> => {
    if (s.length === 0)
      return none()
    else
      return cons(s[0])(list(...s.slice(1)))
}
const cons = <T>(h: T) => (t: List<T>) => new Cons(h, t)
const none = <T>(): List<T> => Nil.Nil


class Node<T> extends ListBase<T>{
    readonly tag: "tree" = "tree"

    constructor(readonly h: T, readonly t: List<Node<T>>) {
        super()
    }
}

const node = <T>(h: T) => (l: List<Node<T>>): Node<T> => new Node(h, l)


// 常用函数
const add = (a:number)=>(b:number):number => a + b
const double = (n: number) => 2*n

// foldr
const foldr = <T>(f: (a: any)=>(b: T)=>T, x: T) => (l: List<any>):T => {
    if (l.tag === "none")
        return x
    else 
        return f(l.h)(foldr(f, x)(l.t))
}
const sum = foldr(add, 0)

// append
const append = <T>(a: List<T>)=>(b: List<T>): List<T> => foldr(cons, b)(a)

// length
const count = <T>(a: T)=>(n: number) => n + 1
const length = foldr(count, 0)

// doubleall
// Old implemention:
// const fandcons = (f: any) => compose(cons)(f)
// const doubleandcons = fandcons(double)
// const doubleall = foldr(doubleandcons, none())
const compose = (f1: any)=>(f2: any) => (x: any) => f1(f2(x))
const map = (f: any) => foldr(compose(cons)(f), none())
const doubleall = map(double)

// summatrix
const summatrix = compose(sum)(map(sum))

// TEST PART1: 
// test a list of functions about structure list
const Xs = list(1, 1, 2, 3, 5, 8, 13, 21)
const Z1 = list(1, 2)
const Z2 = list(3, 4)
const M1 = list(Z1, Z2, Xs)
log("Xs is " + Xs.toString()) 
// Output:Xs is List[1, 1, 2, 3, 5, 8, 13, 21]
log("return: ", sum(Xs))
// Output:return:  54
log("append", Z1.toString(), "and", Z2.toString(), "is", append(Z1)(Z2).toString())
// Output:append List[1, 2] and List[3, 4] is List[1, 2, 3, 4]
log("count", Xs.toString(), "is", length(Xs))
// Output:count List[1, 1, 2, 3, 5, 8, 13, 21] is 8
log("doubleall", Xs.toString(), "is", doubleall(Xs).toString())
// Output:doubleall List[1, 1, 2, 3, 5, 8, 13, 21] is List[2, 2, 4, 6, 10, 16, 26, 42]
log("summatrix", M1.toString(), "is", summatrix(M1))
// Output:summatrix List[List[1, 2], List[3, 4], List[1, 1, 2, 3, 5, 8, 13, 21]] is 64

// tree
// 重写了下node方便造数据来测试
const tree = <T>(h: T) => (...subtrees: Node<T>[]) => new Node(h, list(...subtrees))

// folctree
const foldtree = <T>(f: any, g:any, a:T)=>(l: List<any>):T=>{
    if (l.tag === "none")
        return a
    else if (l.tag === "tree")
        return f(l.h)(foldtree(f, g, a)(l.t))
    else
        return g(foldtree(f, g, a)(l.h))(foldtree(f, g, a)(l.t))
}

// sumtree
const sumtree = foldtree(add, add, 0)

// labels
const labels = foldtree(cons, append, none())

// maptree
const maptree = (f: any)=> foldtree(compose(node)(f), cons, none())
// doubletree
const doubletree = maptree(double)

const tree4 = tree(4)()
const tree3 = tree(3)(tree4)
const tree2 = tree(2)()
const tree1 = tree(1)(tree2, tree3)
log(tree1.toString())
log(tree2.toString())
log(tree3.toString())
log(tree4.toString())
// Node 1(List[Node 2, Node 3(List[Node 4])])
// Node 2
// Node 3(List[Node 4])
// Node 4
log(sumtree(tree1))
// Output: 10
log(labels(tree1).toString())
// Output:List[1, 2, 3, 4]
log(doubletree(tree1).toString())
// Output:Node 2(List[Node 4, Node 6(List[Node 8])])
