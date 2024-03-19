---
slug: Movescriptions
title: Movescriptions源码分析-V4.0 其他合约
authors: [ppnnssy]
tags: [Movescriptions, Move, 智能合约, 铭文]
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

部署“MOVE”铭文。
原始版本在“movedescription:：init”函数中部署 MOVE
此版本不影响主网上的原始版本。
这个函数将在 init.move 合约的 init_protocol 函数中统一调用

```
    public fun deploy_move_tick(
        deploy_record: &mut DeployRecord,
        ctx: &mut TxContext)
```

函数内部还是调用了 movescription 合约中的部署函数来完成功能
`let tick_record = movescription::internal_deploy_with_witness(...)`

而除了“MOVE”铭文外，还为“tick_name”铭文提供接口,调用关系如下：
`public entry fun deploy` --> `public fun do_deploy` --> `tick_factory::do_deploy`
实际完成功能的 do_deploy 函数会校验 tick_name 是否为“TICK”

<!-- 之所以在这里提供接口，是因为 -->

这个版本的部署逻辑有一个明显的改变。之前版本中记录 epoch 的字段在 new TickRecord 的时候就会创建，现在要通过 after_deploy 函数

```
    fun after_deploy(
        tick_record: TickRecordV2,
        total_supply: u64,
        init_locked_sui: u64,
        start_time_ms: u64,
        epoch_count: u64, ctx: &mut TxContext)
```

这个函数将在每个 deploy 后调用，在新建的 TickRecordV2 结构体上添加动态字段，字段值为 EpochBusFactory 对象。然后再共享这个 TickRecordV2
