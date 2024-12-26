---
sidebar_position: 1
---

## 智能铭文简介

在 2023 年的 1 月，比特币 Ordinals 协议被推出后，包括 BRC20，Ordinals ARC20 等系列铭文资产在比特币等链上掀起一波浪潮。尤其在 ORDI、Sats 等龙头铭文资产上线 Binance 获得了超过万倍的涨幅后，将铭文市场的 FOMO 情绪不断推至新高后，并开启了铭文市场“群魔乱舞”的全新时代，很多用户乐此不疲的参与其中，并享受着新一轮链上红利所带来的财富密码。同样，加密市场在经历了漫长的沉寂、压抑的熊市后，也迎来了新一轮情绪的释放。

受到 Bitcoin 上的 铭文[Ordinals Inscription](https://docs.ordinals.com/)协议，以及其衍生协议 [BRC20](https://layer1.gitbook.io/layer1-foundation/protocols/brc-20/documentation) 的启发，Movescriptions 协议旨在利用 Move 智能合约语言，为 Inscription 提供更高级的智能化处理。的启发，Movescriptions 的目标是充分利用 Move 的资源表达能力，以提升和扩展 Inscription 协议的功能，我们可以称之为智能铭文

项目和源码地址：https://github.com/movescriptions/movescriptions/tree/v2.0.0

[源文件](./movescription.move)

这里分析的是 2.0 版本，用作 MOVE 智能合约以及智能铭文的学习

## 结合源码分析 Movescriptions 的玩法

### 两个重要的数据结构：

Movescriptions 的数据结构：

```
    struct Movescription has key, store {
        id: UID,
        amount: u64,
        tick: String,
        /// The attachments coin count of the inscription.
        attach_coin: u64,
        acc: Balance<SUI>,
        // Add a metadata field for future extension
        metadata: Option<Metadata>,
    }
```

可以看到，Movescription 像一个箱子，封装了你锁定的资产和一些元数据信息。而这个箱子的所有权在玩家自己手里，不需要担心合约安全性的问题。

EpochRecord，用来记录一个 epoch 内所有玩家打的铭文：
TickRecord，用来记录所有 epoch 以及铭文的整体信息。

```
    struct EpochRecord has store {
        epoch: u64,
        start_time_ms: u64,
        players: vector<address>,
        mint_fees: Table<address, Balance<SUI>>,
    }

    struct TickRecord has key {
        id: UID,
        version: u64,
        tick: String,
        total_supply: u64,
        start_time_ms: u64,
        epoch_count: u64,
        current_epoch: u64,
        remain: u64,
        mint_fee: u64,
        epoch_records: Table<u64, EpochRecord>,
        current_supply: u64,
        total_transactions: u64,
    }
```

### 玩法及流程：

#### 1. 合约部署：

在 init 函数中发布“MOVE”铭文

```
do_deploy(&mut deploy_record, PROTOCOL_TICK, 100_0000_0000, PROTOCOL_START_TIME_MS, 60*24*15, 100000000, ctx);
```

合约初次部署时即发行 MOVE 铭文，总量 100 亿，这些铭文可以用来发行其他类型的铭文

#### 2. 发行其他类型铭文：

```
    public entry fun deploy_v2(
        deploy_record: &mut DeployRecord,
        fee_tick_record: &mut TickRecord,
        fee_scription: &mut Movescription,
        tick: vector<u8>,
        total_supply: u64,
        start_time_ms: u64,
        epoch_count: u64,
        mint_fee: u64,
        clk: &Clock,
        ctx: &mut TxContext
    )
```

发行一个新的铭文种类需要消耗 Movescription
函数内部写了判定，必须消耗项目方在 init 中创建的 MOVE 铭文
deploy_v2 函数将销毁 MOVE 铭文，将其中的 SUI 返回给调用者，然后发行新类型的铭文
合约本身并不会收取你的资产，但是会 burn 掉“MOVE”铭文

实际的发行功能由 do_deploy 函数完成
这个函数在 init 的时候调用过一次，用于发行项目方的“MOVE”铭文

```
    fun do_deploy(
        deploy_record: &mut DeployRecord,
        tick: vector<u8>,
        total_supply: u64,
        start_time_ms: u64,
        epoch_count: u64,
        mint_fee: u64,
        ctx: &mut TxContext
    )
```

这个函数功能很简单，就是根据参数创建一个新的 TickRecord，然后变成合约内共享对象

#### 3. 铸币：

一种新的铭文发行后，就可以开始 mint 了。实际的 mint 工作在 do_mint 函数中完成：

```
    public fun do_mint(
        tick_record: &mut TickRecord,
        fee_coin: Coin<SUI>,
        clk: &Clock,
        ctx: &mut TxContext
    )
```

打铭文的函数需要 SUI，将 SUI 锁进铭文中。这里 mint_fee 以外多出来的 SUI 会转回调用者账户
mint 之后铭文并不会立刻发送到你的账户中，而是会先记录到 TickRecord 中，等这一个 epoch 结束或者这个 epoch 的玩家数量达到上限，然后统一发放
发放铭文由 settlement 函数实现：

`fun settlement(tick_record: &mut TickRecord, epoch: u64, settle_user: address, now_ms: u64, ctx: &mut TxContext) `

分发铭文的时候遵循以下逻辑：

1.每个 epoch 的铭文数量是固定的，所有本轮参与的玩家平分

2.每个 epoch 中，铭文数量/玩家数量 如果不是整数，向下取整，然后向玩家发放。剩余未发完的铭文将全部发给本 epoch 最后一个 player

3.如果这个种类铭文所有剩余的铭文数量不够两个 epoch，则合并到一个 epoch 中一次发完。

4.虽然有 epoch_count 这个字段预告了总 epoch，但是如果铭文还有剩余（remain != 0），则还会进行下一个 epoch，直到 remain = 0 为止

上述的逻辑中，除了正常的铭文分发外，还有两个彩蛋，一个是每个 epoch 最后一个玩家可能会得到更多的铭文，另一个是铭文即将打完的最后一个 epoch，所有本轮玩家会得到更多的铭文。当然，这些全看运气。

#### 4. 铭文操作

拥有铭文后，可以使用 burn 函数销毁

```
public entry fun burn(
        tick_record: &mut TickRecord,
        inscription: Movescription,
        ctx: &mut TxContext
    )
```

销毁后，铭文中锁定的 SUI 会返回到你的账户中
销毁铭文只会修改 current_supply，也就是当前流通的铭文数量。这个铭文种类的铭文数量将永久减少

其他铭文操作：
可以合并两个铭文：

```
   public entry fun merge(
        inscription1: &mut Movescription,
        inscription2: Movescription,
    )
```

将 inscription2 的 amount 和 balance 都合并进 inscription1 中

分割铭文：

```
    public fun do_split(
        inscription: &mut Movescription,
        amount: u64,
        ctx: &mut TxContext
    ) : Movescription
```

将一个铭文分割成两个，其中的 balance 按照 amount 的比例分割

## V3 版本合约变动

### 结构体变动

```
   struct BurnReceipt has key, store {
        id: UID,
        tick: String,
        amount: u64,
    }
```

添加了 BurnReceipt 结构体。在铭文被 burn 掉的时候，玩家可以获得一个收据

### 新增函数

burn 一个铭文，并返回铭文中锁定的 SUI，并返回给玩家一个收据

```
    public fun do_burn_for_receipt(
        tick_record: &mut TickRecord,
        inscription: Movescription,
        message: vector<u8>,
        ctx: &mut TxContext
    ) : (Coin<SUI>, BurnReceipt)
```

销毁丢弃收据，返回铭文的名字和数量

`public fun drop_receipt(receipt: BurnReceipt):(String, u64)`
