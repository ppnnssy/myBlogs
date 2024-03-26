---
sidebar_position: 4
---

4.1 版本比之前的版本增加了交易功能，交易功能的实现基本都是在 movescription_to_amm.move 合约中实现，所以本篇文章我们的重点关注点在 movescription_to_amm 合约，流动性池，交易等问题上

## movescription

先看 movescription.move 合约中新增的结构体和函数。这些结构体和函数给交易提供工具和支持
新增的这两个结构体是用于权限管理的。
合约中的交易采用了 Capability 模式。使用了 coin 包

```
    struct Treasury<phantom T> has store{
        cap: TreasuryCap<T>,
        coin_type: String,
    }

    struct InitTreasuryArgs<phantom T> has key, store{
        id: UID,
        tick: String,
        cap: Option<TreasuryCap<T>>,
    }
```

先了解一下必须的工具函数，这样有助于后续的业务
movescription_to_coin 函数是将一个铭文销毁，然后返回内部的所有资产
并且，会根据铭文的数量(amount)来铸币`(Balance<T>)`并返回
这个函数主要用于使用铭文添加流动性

```
    public(friend) fun movescription_to_coin<T: drop>(
        tick_record: &mut TickRecordV2,
        movescription: Movescription
    ): (Balance<SUI>, Option<Movescription>, Option<Metadata>, Balance<T>)
```

跟上面的相反，把 balance_t 铸造成铭文.参数中提供的资产全部放进新铸造的铭文中

```
    public(friend) fun coin_to_movescription<T: drop>(
        tick_record: &mut TickRecordV2,
        acc: Balance<SUI>,
        locked: Option<Movescription>,
        metadata: Option<Metadata>,
        balance_t: Balance<T>,
        ctx: &mut TxContext
    ): (Movescription, Balance<T>)
```

## movescription_to_amm.move

接下来是本篇的重点，所有的交易函数都在这个合约中实现
流动性池相关的接口，使用了[cetus_clmm](https://github.com/CetusProtocol/cetus-clmm-interface/tree/main/sui/clmmpool)包，感兴趣的读者可以自行了解

### 结构体

结构体很简单,通过添加动态字段的方式这个结构会放进每种铭文的 TickRecordV2 结构体中，用于记录每个地址添加的流动性

```
    struct Positions has store{
        positions: Table<address, Position>,
    }
```

### 业务逻辑和函数实现

创建一个货币交易市场，需要做的是创建流动性池，添加流动性，以及购买功能，接下来将逐步介绍

#### 1.创建流动性池

```
   public entry fun init_pool<T: drop>(pools: &mut Pools, config: &GlobalConfig, tick_record: &mut TickRecordV2, movescription: Movescription, clk: &Clock, ctx: &mut TxContext)
```

函数内部使用`cetus_clmm::factory::create_pool_with_liquidity<T,SUI>`创建流动性池，并使用参数中的 movescription 添加第一笔流动性
从泛型来看，这是一个 Balance&lt;SUI&gt; 类型的代币和 Balance&lt;T&gt; 的交易池
此后，这个流动性池 position 会被封装进 Positions 结构中，然后放入 tick_record 中，成为这种铭文的流动性池

#### 2.添加流动性

为一种铭文的池子添加流动性，只能使用这种铭文

```
public entry fun add_liquidity<T: drop>(
  config: &GlobalConfig,
  pool: &mut Pool<T,SUI>,
  tick_record: &mut TickRecordV2,
  movescription: Movescription,
  clk: &Clock,
  ctx: &mut TxContext)
```

添加流动性的逻辑是，首先将使用上述的`movescription_to_coin`函数将 movescription 销毁，取出其中的资产,得到 Balance&lt;SUI&gt; 、 Balance&lt;T&gt; 两种货币。
之后会向 tick_record 的池子添加流动性并记录在 Positions 的 table 中，对应关系为 address(玩家地址)-->liquidity(此地址的总流动性)

添加流动性需要使用 add_liquidity_with_swap 函数实现：

```
    fun add_liquidity_with_swap<T:drop>(
        config: &GlobalConfig,
        pool: &mut Pool<T,SUI>,
        position_nft: &mut Position,
        balance_a: Balance<T>,
        balance_b: Balance<SUI>,
        clk: &Clock):(Balance<T>, Balance<SUI>)
```

本函数中逻辑：
1、如果 balance_a/balance_b 值都不为 0，则先使用 add_liquidity_internal 函数添加流动性，将第一次添加完成后剩余的代币取回，此处为了方便，我们称取回的代币也为 balance_a/balance_b。如果 balance_a/balance_b 其中一个值为 0(假设 balance_a.value = 0)，则直接下一步

2、使用 swap 函数将一半 balance_a 兑换成 balance_b

3、再次使用 add_liquidity_internal 函数添加流动性

为池子添加流动性即是添加池子中两种币的总量，要按照此时池子中两种币的比例添加。所以上面的逻辑中需要使用 swap 函数调整两种币的比例
swap 函数中实际上调用了`cetus_clmm::pool`中的三个函数实现功能：
`pool::flash_swap<CoinTypeA, CoinTypeB>`、
`pool::swap_pay_amount(&flash_receipt)`、
`pool::repay_flash_swap<CoinTypeA, CoinTypeB>`

最终实现添加流动性的函数是 add_liquidity_internal：

```
    fun add_liquidity_internal<T:drop>(
        config: &GlobalConfig,
        pool: &mut Pool<T,SUI>,
        position_nft: &mut Position,
        balance_a: Balance<T>,
        balance_b: Balance<SUI>,
        clk: &Clock):(Balance<T>, Balance<SUI>, bool)
```

依旧是掉用`cetus_clmm::pool`中的函数`pool::add_liquidity()`和`pool::repay_add_liquidity()`实现。最终没有用完的代币会全部返回给玩家

#### 3.移除流动性

移除流动性有两种：按数量移除，或移除一个玩家的所有流动性。分别由两个函数实现：
按数量移除:

```
    public fun do_remove_liquidity<T: drop>(
        config: &GlobalConfig,
        pool: &mut Pool<T,SUI>,
        tick_record: &mut TickRecordV2,
        delta_liquidity: u128,
        clk: &Clock,
        ctx: &mut TxContext) : (Movescription, Balance<T>)
```

先从 tick_record 中取出玩家添加的流动性（position_nft）对象，然后调用`pool::remove_liquidity(config, pool, position_nft, delta_liquidity, clk)`移除 delta_liquidity 数量的流动性。将返回的代币通过上面讲过的`movescription::coin_to_movescription`函数重新封装成铭文，返回给玩家

移除一个玩家的所有流动性：

```
    public fun do_remove_all_liquidity<T: drop>(
        config: &GlobalConfig,
        pool: &mut Pool<T,SUI>,
        tick_record: &mut TickRecordV2,
        clk: &Clock, ctx: &mut TxContext) : (Movescription, Balance<T>)
```

和上一个函数逻辑稍有不同，从 tick_record 中取出流动性（position_nft）之后，先获取其总量`let liquidity = position::liquidity(position_nft);`,然后再调用`pool::remove_liquidity`。
总之，移除流动性会从流动性池中取出玩家的资产，返回给玩家

#### 4. 购买

使用一种币购买另一种币，本质就是交换，所以购买函数“buy”就是调用上面的“swap”函数
`swap(config, pool, balance::zero<T>(), coin::into_balance(sui), false, clk)`
在 swap 函数中，把买家的币 sui 和 balance::zero&lt;T&gt;()进行互换，然后返回给买家

#### 5. 获取收益

收取交易费奖励：
向流动性池中添加了流动性的账户可以获取奖励。
实际提取奖励的函数：

```
    public fun do_collect_fee<T: drop>(config: &GlobalConfig, pool: &mut Pool<T,SUI>, tick_record: &mut TickRecordV2, ctx: &mut TxContext) :(Balance<T>, Balance<SUI>)
```

这个函数会返回调用者在流动性池中应该获得的奖励

## 总结

新版本中重点添加了交易相关的业务逻辑，玩家能够自由交易，也能够将自己的资产放入交易池获取收益
智能铭文正在向区块链金融方向发展
