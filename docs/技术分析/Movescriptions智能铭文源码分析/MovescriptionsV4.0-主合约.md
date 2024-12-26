---
sidebar_position: 2
---

## 前言

上一篇笔记分析了 2.0 和 3.0 版本的 Movescriptions 智能铭文合约。在 4.0 版本时合约有了很多重大的变化，本篇文章将分析 4.0 合约源码

## 文件结构

新版本的文件结构：

```
.
├── assert_util.move
├── content_type.move
├── epoch_bus_factory.move
├── init.move
├── metadata.move
├── mint_get_factory.move
├── movescription.move
├── name_factory.move
├── string_util.move
├── svg.move
├── tests
│   ├── epoch_bus_factory_scenario_test.move
│   ├── mint_get_factory_scenario_test.move
│   ├── movescription_object_test.move
│   ├── name_factory_scenario_test.move
│   ├── scenario_test.move
│   ├── tick_factory_scenario_test.move
│   └── tick_record_df_test.move
├── tick_factory.move
├── tick_name.move
├── type_util.move
└── util.move
```

之前版本，都只有 movescription.move 一个主合约，在 4.0 版本中，合约项目做了工程化处理，多出了很多 factory 合约文件。一起来看看这些都是做什么的吧

## 主合约 movescription

本合约主要是提供一些基础函数，如 mint 功能的构造铭文，burn 的销毁铭文。
这些函数都添加了 witness 模式，不允许直接调用，而是通过上层函数调用。

### 结构体

首先结构体有所变化，之前的 TickRecord 名字改成 TickRecordV2 ，分成了两个嵌套的结构体
对比之前，少了 epoch_records 字段。关于 epoch 的功能，会使用添加动态字段的方式实现

```
    struct TickStat has store, copy, drop {
        /// The remaining inscription amount not minted
        remain: u64,
        /// The current supply of the inscription, burn will decrease the current supply
        current_supply: u64,
        /// Total mint transactions
        total_transactions: u64,
    }

    struct TickRecordV2 has key, store {
        id: UID,
        version: u64,
        tick: String,
        total_supply: u64,
        /// The movescription can be burned by the owner
        burnable: bool,
        /// The mint factory type name
        mint_factory: String,
        stat: TickStat,
    }
```

新增 LockedBox，用于实现铭文嵌套

```
    struct LockedBox has store{
        locked_movescription: Movescription,
    }
```

burn 掉铭文后可以获取的凭据

```
    struct BurnReceipt has key, store {
        id: UID,
        tick: String,
        amount: u64,
    }
```

### 函数

1. init
   init 函数中，不再发行 MOVE 铭文，仅仅创建一个共享的 DeployRecord。
   发行 MOVE 铭文的功能在 epoch_bus_factory.move 合约中实现，逻辑上基本没有变化

2. 发行其他类型铭文

```
    public(friend) fun internal_deploy_with_witness<W: drop>(
        deploy_record: &mut DeployRecord,
        tick: String,
        total_supply: u64,
        burnable: bool,
        _witness: W,
        ctx: &mut TxContext
    ) : TickRecordV2
```

这个函数是实现 deploy 功能的底层函数，上层逻辑在包内其他合约中实现，此函数只负责创建 TickRecordV2 对象并触发事件
包内其他合约的 deploy 功能最终都是调用本函数实现。
和之前版本的 depoly 函数相比，4.0 版本使用了一次性见证模式，其他合约调用的时候会使用 WITNESS{}做为参数，如
`let tick_record = movescription::internal_deploy_with_witness(deploy_record, ascii::string(tick), total_supply, true, WITNESS{}, ctx);`
由于工程化的原因，使用了`friend`关键字，仅供同一个包的函数调用

3. 铸造铭文

和上面的 internal_deploy_with_witness 函数类似，这个函数是最终完成铸造铭文的底层函数。
包内其他合约先完成铸造铭文的逻辑，如计算 epoch 等，最后会调用此函数完成铸造

```
    public fun do_mint_with_witness<W: drop>(
        tick_record: &mut TickRecordV2,
        init_locked_sui: Balance<SUI>,
        amount: u64,
        metadata: Option<Metadata>,
        _witness: W,
        ctx: &mut TxContext
    ) : Movescription
```

4. 销毁铭文
   销毁铭文的调用关系：do_burn_v2 --> do_burn_with_message_v2 --> internal_burn
   也许你注意到了，这个版本的 TickRecordV2 结构体中有 burnable 字段，意味着有些铭文是不能销毁的，这取决于发行方
   do_burn_with_message_v2 函数中验证铭文能否销毁

   大多数 burn 逻辑都在 internal_burn 函数中完成

```
fun internal_burn(
        tick_record: &mut TickRecordV2,
        inscription: Movescription,
        message: vector<u8>,
        ctx: &mut TxContext
    ) : (Coin<SUI>, Option<Movescription>)
```

整个函数的功能和之前版本的 do_burn 相同，但是多了 message 参数
这个参数用来在触发 BurnTick 事件的时候附加一段信息

此外，添加了一次性见证模式的 burn 功能

```
    public fun do_burn_with_witness<W: drop>(
        tick_record: &mut TickRecordV2,
        inscription: Movescription,
        message: vector<u8>,
        _witness: W,
        ctx: &mut TxContext
    ) : (Coin<SUI>, Option<Movescription>)
```

函数中先验证了一习性见证模式，然后调用 internal_burn 函数

如果想要 burn 铭文并获取一个记录的话，可以调用 do_burn_for_receipt_v2:

```
    public fun do_burn_for_receipt_v2(
        tick_record: &mut TickRecordV2,
        inscription: Movescription,
        message: vector<u8>,
        ctx: &mut TxContext
    ) : (Coin<SUI>, Option<Movescription>, BurnReceipt)
```

这个函数会调用 do_burn_with_message_v2 销毁铭文，并在此之后创建并返回一个 BurnReceipt 对象
这个 BurnReceipt 可以使用 drop_receipt 函数删除

`public fun drop_receipt(receipt: BurnReceipt):(String, u64)`

以上所有的 burn 方法，最终都会返还 mint 的时候付的钱。基本的铭文玩法并没有很大的变化

5. 向 Movescription 上添加动态字段
   新版本添加了新的接口，可以操作 Movescription 的字段，目前主要用于铭文嵌套

```
   /// Add the `Value` type dynamic field to the movescription
    fun add_df<Value: store>(
        movescription: &mut Movescription,
        value: Value,
    ) {
        let name = type_to_name<Value>();
        df::add(&mut movescription.id, name, value);
    }

    /// Borrow the `Value` type dynamic field of the movescription
    fun borrow_df<Value: store>(  movescription: &Movescription, ): &Value {
        let name = type_to_name<Value>();
        df::borrow<String, Value>(&movescription.id, name)
    }

    /// Borrow the `Value` type dynamic field of the movescription mutably
    fun borrow_df_mut<Value: store>(movescription: &mut Movescription, ): &mut Value {
        let name = type_to_name<Value>();
        df::borrow_mut<String, Value>(&mut movescription.id, name)
    }

    /// Returns the `Value` type dynamic field of the movescription
    fun remove_df<Value: store>( movescription: &mut Movescription,): Value {
        let name = type_to_name<Value>();
        let value: Value = df::remove<String, Value>(&mut movescription.id, name);
        value
    }

    /// Returns if the movescription contains the `Value` type dynamic field
    fun exists_df<Value: store>(
        movescription: &Movescription,
    ): bool {
        let name = type_to_name<Value>();
        df::exists_with_type<String, Value>(&movescription.id, name)
    }
```

以上是一些功能性的函数
接下来，通过调用 lock_within 函数，可以把一个铭文锁进另一个铭文中，实现铭文嵌套
`public fun lock_within(movescription: &mut Movescription, locked_movescription: Movescription) `

当然同样有读取和解锁的函数：

```
    public fun contains_locked(movescription: &Movescription): bool {
        exists_df<LockedBox>(movescription)
    }

    public fun borrow_locked(movescription: &Movescription): &Movescription {
        let locked_box = borrow_df<LockedBox>(movescription);
        &locked_box.locked_movescription
    }

    fun borrow_mut_locked(movescription: &mut Movescription): &mut Movescription {
        let locked_box = borrow_df_mut<LockedBox>(movescription);
        &mut locked_box.locked_movescription
    }

    fun unlock_box(movescription: &mut Movescription) : Movescription {
        let LockedBox{ locked_movescription } = remove_df<LockedBox>(movescription);
        locked_movescription
    }
```

6. 向 TickRecordV2 添加动态字段

```
    public fun tick_record_add_df<V: store, W: drop>(tick_record: &mut TickRecordV2, value: V, _witness: W) {
        type_util::assert_witness<W>(tick_record.mint_factory);
        let name = type_util::type_to_name<V>();
        df::add(&mut tick_record.id, name, value);
    }

    public fun tick_record_remove_df<V: store, W: drop>(tick_record: &mut TickRecordV2, _witness: W) : V {
        type_util::assert_witness<W>(tick_record.mint_factory);
        let name = type_util::type_to_name<V>();
        df::remove(&mut tick_record.id, name)
    }

    public fun tick_record_borrow_mut_df<V: store, W: drop>(tick_record: &mut TickRecordV2, _witness: W) : &mut V {
        type_util::assert_witness<W>(tick_record.mint_factory);
        let name = type_util::type_to_name<V>();
        df::borrow_mut(&mut tick_record.id, name)
    }

    public fun tick_record_borrow_df<V: store>(tick_record: &TickRecordV2) : &V{
        let name = type_util::type_to_name<V>();
        df::borrow(&tick_record.id, name)
    }

    public fun tick_record_exists_df<V: store>(tick_record: &TickRecordV2) : bool {
        let name = type_util::type_to_name<V>();
        df::exists_with_type<String, V>(&tick_record.id, name)
    }
```

这些动态字段主要用于向 TickRecordV2 上添加 epoch 信息
设计上，TickRecordV2 取消了 epoch_records 字段，每次 depoly 出一个新的铭文后，都需要向上面添加 epoch 信息。
这些功能都是在 epoch_bus_factory.move 合约中完成的，我们下一篇文章会详细分析

7. 合约升级支持
   这个版本的升级，结构体发生了改变，所以合约中留了升级接口，用于处理之前版本的数据。如版本号升级。
   这里介绍 migrate_tick_record_to_v2 函数
   ```
       public(friend) fun migrate_tick_record_to_v2<W: drop>(
        deploy_record: &mut DeployRecord,
        tick_record: TickRecord,
        _witness: W,
        ctx: &mut TxContext) :
        (TickRecordV2, u64, u64, u64, u64, Table<u64, EpochRecord>)
   ```
   这个函数接收一个 TickRecord 结构体。这是上个版本的数据结构。函数将这个结构体升级成 TickRecordV2 并返回

本篇文章介绍的大多数是合约项目的底层函数，接下来的文章将介绍上层的业务逻辑
