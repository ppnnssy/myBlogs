---
sidebar_position: 3
---

## object 包

### 结构体

An object ID. This is used to reference Sui Objects. This is _not_ guaranteed to be globally unique--anyone can create an `ID` from a `UID` or from an object, and ID's can be freely copied and dropped.
Here, the values are not globally unique because there can be multiple values of type `ID` with the same underlying bytes. For example, `object::id(&obj)` can be called as many times as you want for a given `obj`, and each `ID` value will be identical.

```
    struct ID has copy, drop, store {
        bytes: address
    }
```

/// Globally unique IDs that define an object's ID in storage. Any Sui Object, that is a struct with the `key` ability, must have `id: UID` as its first field.
These are globally unique in the sense that no two values of type `UID` are ever equal, in other words for any two values `id1: UID` and `id2: UID`, `id1` != `id2`.
This is a privileged type that can only be derived from a `TxContext`.
`UID` doesn't have the `drop` ability, so deleting a `UID` requires a call to `delete`.

```
    struct UID has store {
        id: ID,
    }
```

### 函数

返回一个 ID 的原始字节
`public fun id_to_bytes(id: &ID): vector<u8>`

获取“id”的内部字节作为地址。
`public fun id_to_address(id: &ID): address`

使用字节创建一个 ID
`public fun id_from_bytes(bytes: vector<u8>): ID`

使用地址创建一个 ID
`public fun id_from_address(bytes: address): ID`

获取 UID 内部的 ID 的只读引用
`public fun uid_as_inner(uid: &UID): &ID`

获取 UID 内部的 ID
`public fun uid_to_inner(uid: &UID): ID`

获取 UID 的原始字节
`public fun uid_to_bytes(uid: &UID): vector<u8>`

以 address 的格式获取 UID 内部 ID 的字节
`public fun uid_to_address(uid: &UID): address`

创建一个新对象。返回一个“UID”，这个 UID 必须存储在 Sui 对象中。
这是唯一能创建 UID 的方式
`public fun new(ctx: &mut TxContext): UID`

删除一个对象及其 UID，这也是删除 UID 的唯一方式
`public fun delete(id: UID)`

获取对象深层的 ID
`public fun id<T: key>(obj: &T): ID`

获取对象 ID 的只读引用
`public fun borrow_id<T: key>(obj: &T): &ID`

获取对象 ID 的原始字节
`public fun id_bytes<T: key>(obj: &T): vector<u8>`

获取 address 格式的对象 ID
`public fun id_address<T: key>(obj: &T): address`
