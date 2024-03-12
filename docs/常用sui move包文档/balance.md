---
sidebar_position: 1
---

## balance 包

用于处理余额，一些常用的余额处理函数和结构体

### 结构体

Supply：用于确定币的总数

```
struct Supply<phantom T> has store {
        value: u64
    }
```

Balance：用于储存币的结构体，不需要 key

```
struct Balance<phantom T> has store {
        value: u64
    }
```

### 函数

获取数量

`public fun value<T>(self: &Balance<T>): u64 `

获取币种数量上限

`public fun supply_value<T>(supply: &Supply<T>): u64`

创建一个 value=0 的 Supply

`public fun create_supply<T: drop>(_: T): Supply<T> `

增加 Supply 的 value 值，并返回一个 Balance，这个 Balance 的 value 值为原 Supply.value+参数 value
限定 Supply.value+参数 value < 18446744073709551615u64

`public fun increase_supply<T>(self: &mut Supply<T>, value: u64): Balance<T>`

减小 Supply 的 value 值，减小量为 balance.value，返回 balance.value 的值
`public fun decrease_supply<T>(self: &mut Supply<T>, balance: Balance<T>): u64 `

返回一个 value=0 的 Balance
`public fun zero<T>(): Balance<T>`

将 balance 的 value 加到 self 上，返回相加后的 value
`public fun join<T>(self: &mut Balance<T>, balance: Balance<T>): u64`

将一个 Balance 分割成两个
`public fun split<T>(self: &mut Balance<T>, value: u64): Balance<T> `

取出 self 中的所有值（self.value=0)，并返回一个等值的 Balance
`public fun withdraw_all<T>(self: &mut Balance<T>): Balance<T>`

限定 balance.value=0
销毁一个 value=0 的 Balance
`public fun destroy_zero<T>(balance: Balance<T>)`

销毁 Supply，返回其中的 value 值
`public(friend) fun destroy_supply<T>(self: Supply<T>): u64 `
