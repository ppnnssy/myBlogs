---
sidebar_position: 2
---

## coin 包

### 结构体

一种类型为 T 的币，价值为“value”。可交易和可存储

```
    struct Coin<phantom T> has key, store {
        id: UID,
        balance: Balance<T>
    }
```

通过“create_currency”函数创建的每个 T 类型币都将有一个 CoinMetadata ＜ T ＞的唯一实例，该实例存储该币类型的元数据。

```
    struct CoinMetadata<phantom T> has key, store {
        id: UID,
        /// 小数位，例如一个币value=7002,decimals=3,那么应该显示未7.002
        decimals: u8,
        /// Name for the token
        name: string::String,
        /// Symbol for the token
        symbol: ascii::String,
        /// Description of the token
        description: string::String,
        /// URL for the token logo
        icon_url: Option<Url>
    }
```

和 CoinMetadata 类似，但是仅为使用了 DenyList 的 regulated coins 创建
这个对象总是不可变

```
    struct RegulatedCoinMetadata<phantom T> has key {
        id: UID,
        /// The ID of the coin's CoinMetadata object.
        coin_metadata_object: ID,
        /// The ID of the coin's DenyCap object.
        deny_cap_object: ID,
    }
```

允许持有者铸造和销毁币。可交易
一般用作 witness

```
    struct TreasuryCap<phantom T> has key, store {
        id: UID,
        total_supply: Supply<T>
    }
```

允许持有者冻结地址，防止这些地址与作为交易输入的硬币交互。

```
    struct DenyCap<phantom T> has key, store {
        id: UID,
    }
```

### 函数

返回流通的所有 T 类型币的数量
`public fun total_supply<T>(cap: &TreasuryCap<T>): u64`

返回 TreasuryCap 中的 Supply，并删除这个 TreasuryCap
`public fun treasury_into_supply<T>(treasury: TreasuryCap<T>): Supply<T>`

返回 TreasuryCap 中 Supply 的一个不可变（只读）引用
`public fun supply_immut<T>(treasury: &TreasuryCap<T>): &Supply<T>`

返回 TreasuryCap 中 Supply 的一个可变引用
`public fun supply_mut<T>(treasury: &mut TreasuryCap<T>): &mut Supply<T>`

返回 coin 的值
`public fun value<T>(self: &Coin<T>): u64`

返回 coin 中 Balance 的不可变引用
`public fun balance<T>(coin: &Coin<T>): &Balance<T>`

返回 coin 中 Balance 不可变引用
`public fun balance_mut<T>(coin: &mut Coin<T>): &mut Balance<T>`

把一个 Balance 封装进 Coin 中，使它能够交易
`public fun from_balance<T>(balance: Balance<T>, ctx: &mut TxContext): Coin<T>`

销毁一个 Coin，返回它的 Balance
`public fun into_balance<T>(coin: Coin<T>): Balance<T>`

从 balance 中分割出部分 value，使用这部分封装并返回一个 Coin
`public fun take<T>(balance: &mut Balance<T>, value: u64, ctx: &mut TxContext,): Coin<T>`

将一个 coin 放入 balance 中，原 Coin 被销毁
`public fun put<T>(balance: &mut Balance<T>, coin: Coin<T>)`

销毁 c，并将其 value 合并进 self
`public entry fun join<T>(self: &mut Coin<T>, c: Coin<T>)`

从 self 中分割出一个 value 为 split_amount 的新 Coin
`public fun split<T>(self: &mut Coin<T>, split_amount: u64, ctx: &mut TxContext): Coin<T>`

将一个 Coin 均分成 n-1 份，剩下的留在原 Coin 中。新铸造的 n-1 个 Coin 放入数组中返回
`public fun divide_into_n<T>(self: &mut Coin<T>, n: u64, ctx: &mut TxContext): vector<Coin<T>> `

返回一个 value=0 的 Coin
`public fun zero<T>(ctx: &mut TxContext): Coin<T>`

销毁一个 value=0 的 Coin
`public fun destroy_zero<T>(c: Coin<T>)`

创建一个新的货币类型“T”，并返回 T 的“TreasuryCap”和“CoinMetadata”
只能使用“一次性见证”类型调用，确保每个“T”只有一个“TreasuryCap”。

```
    public fun create_currency<T: drop>(
        witness: T,
        decimals: u8,
        symbol: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        icon_url: Option<Url>,
        ctx: &mut TxContext
    ): (TreasuryCap<T>, CoinMetadata<T>)
```

通过“create_currency”创建了一种新的货币，但具有额外的功能，允许特定地址冻结其硬币。这些地址不能作为输入对象与硬币交互。

```
    public fun create_regulated_currency<T: drop>(
        witness: T,
        decimals: u8,
        symbol: vector<u8>,
        name: vector<u8>,
        description: vector<u8>,
        icon_url: Option<Url>,
        ctx: &mut TxContext
    ): (TreasuryCap<T>, DenyCap<T>, CoinMetadata<T>)
```

铸币
`public fun mint<T>(cap: &mut TreasuryCap<T>, value: u64, ctx: &mut TxContext,): Coin<T>`

铸造一些 T 作为“余额”，并相应地增加“上限”的总供应量。如果 value+cap.total_supply`>=U64_MAX，则中止

```
  public fun mint_balance<T>(
        cap: &mut TreasuryCap<T>, value: u64
    ): Balance<T>
```

销毁 Coin，并相应的减少 total supply。返回 Coin 的 value 值
`public entry fun burn<T>(cap: &mut TreasuryCap<T>, c: Coin<T>): u64`

铸币并将 Coin 交易给 recipient

```
public entry fun mint_and_transfer<T>(
        c: &mut TreasuryCap<T>, amount: u64, recipient: address, ctx: &mut TxContext
    )
```

获取 total supply
`public fun supply<T>(treasury: &mut TreasuryCap<T>): &c<T>`

一系列 updata 函数,用于修改 CoinMetadata

```
public entry fun update_name
public entry fun update_symbol
public entry fun update_description
public entry fun update_icon_url
```

一些列 getter 函数，用于获取 CoinMetadata 字段

```
public fun get_decimals
public fun get_name
public fun get_symbol
public fun get_description
public fun get_icon_url
```

将给定地址添加到 deny_list 中，防止其与指定的硬币类型交互作为交易的输入。

```
public fun deny_list_add<T>(
       deny_list: &mut DenyList,
       _deny_cap: &mut DenyCap<T>,
       addr: address,
       _ctx: &mut TxContext
    )
```

从 deny list 中删除地址。如果地址不在列表中，则使用“ENotFrozen”中止。

```
 public fun deny_list_remove<T>(
       deny_list: &mut DenyList,
       _deny_cap: &mut DenyCap<T>,
       addr: address,
       _ctx: &mut TxContext
    )
```

如果 addr 被拒绝用于给定的 coin 类型，则返回 true。如果给定非 coin 类型，它将返回 false。

```
 public fun deny_list_contains<T>(
       freezer: &DenyList,
       addr: address,
    ): bool
```
