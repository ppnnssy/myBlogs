---
sidebar_position: 4
---

## transfer 包

### 结构体

```
    struct Receiving<phantom T: key> has drop {
        id: ID,
        version: u64,
    }
```

### 函数

将对象的所有权转让给 recipient，obj 必须具有 key 能力
T 只能是本模块中定义的对象
`public fun transfer<T: key>(obj: T, recipient: address)`

将对象的所有权转让给 recipient，obj 必须具有 key 和 store 能力
`public fun public_transfer<T: key + store>(obj: T, recipient: address)`

冻结一个对象。被冻结的对象不可修改，不可转移所有权
T 只能是本模块中定义的对象
`public fun freeze_object<T: key>(obj: T)`

冻结一个对象。被冻结的对象不可修改，不可转移所有权
`public fun public_freeze_object<T: key + store>(obj: T)`

将对象转换为可变共享对象，每个人都可以访问和修改。
T 只能是本模块中定义的对象
`public fun share_object<T: key>(obj: T) `

将对象转换为可变共享对象，每个人都可以访问和修改。
`public fun public_share_object<T: key + store>(obj: T)`
