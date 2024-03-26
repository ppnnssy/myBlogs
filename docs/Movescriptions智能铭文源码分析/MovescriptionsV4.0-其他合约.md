---
sidebar_position: 3
---

## epoch_bus_factory.move

这个合约主要是用来部署“MOVE”铭文，提供 mint 功能
以前版本的“MOVE”铭文是在 movescription::init 函数中部署的，现在改了，需要主动调用
此外，还为“tick_name”铭文提供接口

### 结构体

```
    struct EpochRecord has store {
        epoch: u64,
        start_time_ms: u64,
        players: vector<address>,
        locked_sui: Table<address, Balance<SUI>>,
    }

    struct EpochBusFactory has store {
        init_locked_sui: u64,
        start_time_ms: u64,
        epoch_count: u64,
        epoch_amount: u64,
        current_epoch: u64,
        epoch_records: Table<u64, EpochRecord>,
    }
```

很明显这两个结构体是用来记录 epoch 的。
以前版本，这个功能是 TickRecord.epoch_records 字段来记录。现在拆分到了单独的结构体中
接下来讲解函数的时候我们会看到怎么使用这个结构体

### 函数

1. 部署“MOVE”铭文。
   原始版本在“movedescription:：init”函数中部署 MOVE，这个版本有所不同，改成了在 `deploy_move_tick` 函数中部署
   此版本不影响主网上的原始版本。
   这个函数将在 init.move 合约的 init_protocol 函数中统一调用

```
    public fun deploy_move_tick(
        deploy_record: &mut DeployRecord,
        ctx: &mut TxContext)
```

函数内部还是调用了 movescription 合约中的部署函数来完成功能
`let tick_record = movescription::internal_deploy_with_witness(...)`

新版本中 MOVE 铭文用来铸造别的内置铭文

2. 部署其他铭文
   <span id="jump1"></span>
   2.1 这个版本发生了改变，在本合约中部署其他类型铭文，不再需要 MOVE 铭文，而是需要 TICK 铭文
   TICK 铭文的来源是 tick_factory.move 合约。后面会详细讲到
   部署铭文的函数调用关系如下：
   `public entry fun deploy` --> `public fun do_deploy` --> `tick_factory::do_deploy`
   do_deploy 函数会校验 tick_name 是否为“TICK”
   部署新铭文的玩法除了变成消耗 TICK 铭文外，和之前版本相同。铭文消耗之后会将里面锁定的 SUI 返回给玩家

2.2 这个版本的部署逻辑有一个明显的改变。之前版本中记录 epoch 的字段在 new TickRecord 的时候就会创建，现在新建的 TickRecordV2 中没有该字段，要通过 after_deploy 函数添加

```
    fun after_deploy(
        tick_record: TickRecordV2,
        total_supply: u64,
        init_locked_sui: u64,
        start_time_ms: u64,
        epoch_count: u64, ctx: &mut TxContext)
```

这个函数将在每个 deploy 操作后调用，在新建的 TickRecordV2 结构体上添加动态字段，字段值为 EpochBusFactory 对象，字段名调用以下函数获取：

```
    public fun type_to_name<T>() : String {
        type_name::into_string(type_name::get_with_original_ids<T>())
    }

```

其中 T 就是 EpochBusFactory 对象的类型

3. mint 铭文
   和之前版本相比，mint 的逻辑和功能都没有改变，只是最后分发铭文的代码放到了`movescription::do_mint_with_witness`函数中
   对于玩家来说，打铭文的玩法和之前没有任何变化，彩蛋也相同

此外，本合约同样提供了升级版本的函数，如`migrate_tick_record_to_v2`，升级逻辑和 Movescriptions.move 合约中的基本类似，这里不再赘述

## tick_factory.move

这个合约主要用来创建 TICK 铭文，并消耗 TICK 铭文用来部署新的铭文

1.  部署“TICK”铭文。
    `public fun deploy_tick_tick(deploy_record: &mut DeployRecord, ctx: &mut TxContext)`
    和部署 MOVE 铭文基本相同，这个函数将在 init.move 合约的 init_protocol 函数中统一调用

2.  铸造 TICK 铭文

    ```
        public fun do_mint(
        tick_tick_record: &mut TickRecordV2,
        locked_move: Movescription,
        tick_name: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext) : Movescription
    ```

    这个函数是消耗 MOVE 来铸造 TICK 铭文的函数，locked_move 必须是 MOVE 铭文。
    函数将铸造一个 amount=1，SUI=0 的 TICK 铭文，并把 locked_move 铭文锁进去
    这个"锁进去"指的是使用上一篇文章中提到的铭文嵌套的方式，将 MOVE 铭文嵌套进 TICK
    当然，当 TICK 铭文被 burn 销毁后，MOVE 会被返回给玩家

    新版本的合约在部署新铭文的时候，多了一个流程，即 MOVE --> TICK --> 新铭文

3.  部署新的铭文
    前面讲 epoch_bus_factory 合约部署新铭文的时候，要调用 tick_factory::do_deploy ([回顾](#jump1))

    ```
    public fun do_deploy<W: drop>(
        deploy_record: &mut DeployRecord,
        tick_tick_record: &mut TickRecordV2,
        tick_name_movescription: Movescription,
        total_supply: u64,
        burnable: bool,
        _witness: W,
        clk: &Clock,
        ctx: &mut TxContext
    ) : TickRecordV2
    ```

    部署新铭文要消耗 TICK 铭文
    这个函数将 burn 掉 tick_name_movescription 铭文，然后部署新的铭文
    要注意，这个新铭文的名称使用的是 tick_name_movescription 中的 metadata.content，而不是其中的 tick 字段
    所以新版本的合约，不再直接消耗 MOVE 铭文部署新铭文，而改成了消耗 TICK

4.  销毁铭文

和别的销毁基本没有区别，销毁对象并将其中的 SUI 和 locked

## name_factory.move 合约

这个合约和上面的 tick_factory.move 逻辑非常相似，主要功能是：

1.部署 NAME 铭文

2.铸造 NAME 铭文

3.销毁 NAME 铭文

区别在于，TICK 铭文用来部署别的铭文，而 NAME 铭文用来表达个人或者组织的 Name。

个人或组织的名称记录在 NAME 铭文的 matadata 中。
TICK 铭文 业务流程为：
`MOVE --> TICK:{tick:"TICK",metadata:要部署的铭文名称} --> 部署铭文`

NAME 业务流程未：
`MOVE -->NAME:{tick:"NAME",metadata:个人或者组织的名称}`
[项目方关于 NAME 铭文的解释](https://github.com/movescriptions/MIPs/issues/17)

## 总结

智能铭文 Movescriptions 项目的主要合约分析完毕了
新版本的合约中，一共有 4 种内置铭文，分别是"MOVE","TICK","NAME","TEST"。
其中 TEST 是用来测试的，我们并不关注
TICK 用来部署铭文，NAME 是用户 id，各有用途
整个合约比之前复杂很多，考虑了更多的安全性和扩展性。
