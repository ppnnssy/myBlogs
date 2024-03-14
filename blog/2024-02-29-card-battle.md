---
slug: card-battle
title: card-battle
authors: [ppnnssy]
tags: [Move, docusaurus, Sui TypeScript SDK, Sui]
---

# cardbattle 笔记

## 项目的建立

因为要使用 Sui TypeScript SDK，所以直接使用了模板

> npm create @mysten/dapp

创建出的项目本身有 SDK 的引入，不用自己配置了
参考地址：https://sdk.mystenlabs.com/dapp-kit/create-dapp
项目参考地址：https://github.com/ppnnssy/cardbattle-solidity

## 项目中关于 Sui TypeScript SDK 的使用

依赖安装：

> npm i @mysten/sui.js

项目中有 src/context/networkConfig.ts 文件，这个文件本来是打算全局提供 networkConfig 句柄的，后来发现每个页面直接创造一个 client 对象更加稳定方便
`const client = new SuiClient({ url: getFullnodeUrl("testnet") });`

在 SDK 中功能有很多，这里记录一下项目中用到的一些：

### 连接钱包

直接使用 SDK 中提供的组件
`import { ConnectButton } from "@mysten/dapp-kit";`
简单的使用组件，甚至不需要传入任何参数

### 获取当前账户

`import { useCurrentAccount } from "@mysten/dapp-kit";`
这是个钩子函数
`const myAccount = useCurrentAccount();`

### 获取对象信息

根据对象 id 获取对象信息。这是使用了封装好的钩子函数 useSuiClientQuery

```根据id获取
const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id: battleId ? battleId : "",
    options: {
      showContent: true,
      showOwner: true,
    },
  });
```

同时获取多个对象，也是一个钩子函数

```
  let { data: gameData } = useSuiClientQueries({
    // queries参数应该是一个数组，数组中的元素是一个对象
    queries: isPending
      ? []
      : (battleData as any)?.data.content.fields.battles.map((val: any) => {
          return {
            method: "getObject",
            params: {
              id: val,
              options: {
                showContent: true,
                showOwner: true,
              },
            },
          };
        }),
    // 请求回来的数据可以在combine函数中过滤
    combine: (result) => {
      return {
        // 过滤掉其他状态，只保留待开始的
        data: result
          .map((res, idx) => {
            console.log("====================================");
            console.log(res);
            console.log("====================================");
            let status = (res as any)?.data?.data?.content.fields.status;
            if (status == 0 || status == 1 || status == 2) {
              return {
                key: idx,
                battleId: (res as any)?.data.data.objectId,
                battleName: (res as any)?.data.data.content.fields.name,
                players: (res as any)?.data.data.content.fields.players,
                status: (res as any)?.data.data.content.fields.status,
              };
            }
          })
          .filter((item2) => item2 !== undefined),
        isSuccess: result.every((res) => res.isSuccess),
        isPending: result.some((res) => res.isPending),
        isError: result.some((res) => res.isError),
      };
    },
  });
```

普通函数获取对象

```
client.getObject({
    id: objId,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
```

普通函数获取多个对象

```
client.multiGetObjects({
    ids,
    options: {
      showContent: true,
      showOwner: true,
    },
  });
```

根据账号获取名下资产

```
client.getOwnedObjects({
      owner: account?.address,
      filter: {
        MatchAll: [
          {
            StructType: `${TESTNET_CARD_PACKAGE_ID}::card::Card`,
          },
        ],
      },
    });
```

### 获取动态字段对象

Move 合约中有些对象是动态字段，参考https://docs.sui.io/concepts/dynamic-fields
想要获取动态字段对象，靠上面的函数是不行的，需要以下函数

```
client.getDynamicFields({
    parentId: id,
  });
```

parentId 就是想要获取的对象 id

### 调用合约函数

引入依赖

```
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSignAndExecuteTransactionBlock } from "@mysten/dapp-kit";
```

获取发送交易的函数。useSignAndExecuteTransactionBlock 是钩子函数，只能在组件中使用

`const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();`

构造交易块
构造交易块的时候要注意，arguments 是合约函数参数。如果需要传入 number，string 等类型的参数，需要用 txb.pure.类型（实际参数）先转换格式

```
const txb = new TransactionBlock();
txb.moveCall({
arguments: [txb.object(CARD_RECORD), txb.object("0x6")],
target: `${TESTNET_CARD_PACKAGE_ID}::card::create_card`,
});
```

发送交易

```
    signAndExecute(
      {
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      },
      {
        onSuccess: (tx) => {
          console.log("🚀 ~ handleJoin ~ tx:", tx);
        },
        onError: (err) => {
          console.log("🚀 ~ handleJoin ~ tx:", err);
        },
      },
    );
```

### 监听事件

事件监听还没有完全做好，有 bug 不能使用，暂时先放一下代码
官方文档有问题
事件监听需要特殊的 client.这是 SDK 开发不完善，可能在后续版本中会修复

```
  let client = new SuiClient({
    transport: new SuiHTTPTransport({
      url: getFullnodeUrl("testnet"),
      WebSocketConstructor: window.WebSocket,//这一行不加会出错
    }),
  });
```

订阅事件

```
   const unsubscribe = await client.subscribeEvent({
        filter: {
          // Package:
          //   "0xfe0deaecbfe19fd2beeb085e634b0086e78123f9283257fda35c1226c9ab8fa7",
          // MoveEventType: `${TESTNET_CARD_PACKAGE_ID}::card::MoveChoice`,
          MoveEventType: `${TESTNET_CARD_PACKAGE_ID}::card::MoveChoice`,
        },
        onMessage(event) {
          console.log("🚀 ~ onMessage ~ event:", event);
          refetch();
          // handle subscription notification message here. This function is called once per subscription message.
        },
      });
```

解绑事件
`unsubscribe()`

## 关于项目中一些 React+TS 问题的记录和解决方法

### 使用 js 文件

因为是 TS 项目，引入 js 内容需要一些特殊处理
新建 src/vite-env.d.ts
声明模块.这里使用\*代替了 src

```
declare module "*/assets/index.js" {
  export const logo: any;
  export const heroImg: any;
  ...
}
```

应该有自动引入的方法，我还没找到，目前是手动，用到啥往里面写个啥

### useEffect 的使用

src/page.battle.tsx 中，对战页面的数据经常加载不出
问题出现在 useEffect 上。
如：

```
useEffect(()=>{
  let b = 异步请求数据
  setB(b)
},[a])
```

因为页面初次加载时先请求得到 a 的数据，再得到 b。
所以这个 useEffect 会执行两次，一次 a 为空，得到空的 b，另一次有数据
因为异步的关系，当空的数据后返回时会覆盖数据
所以 setB 之前要加个判断
` if (res.length == 0) return;`
