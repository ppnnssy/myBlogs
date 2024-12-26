---
slug: Weather Oracle
title: SUI 天气预言机
authors: [ppnnssy]
tags: [Move, 天气预言机, Sui, 预言机]
---

## 关于预言机

区块链预言机（BlockChain Oracle）看名字比较容易让人误解。首先预言机不预言任何东西，而关于 Oracle，也和甲骨文公司（Oracle）或 Oracle 数据库没有任何关系。
预言机是一种将区块链外信息写入区块链内的机制，完成区块链与现实世界的数据互通。是智能合约与外部进行数据交互的唯一途径，也是区块链与现实世界进行数据交互的接口。

举个例子，如果没有预言机的话，区块链上的合约想要获取链下数据是不可能的。比如金融类合约要获取股票实时价格，或者获取当天的天气，这些都无法仅靠链上实现。因为区块链是一个确定性的、封闭的系统环境，目前区块链只能获取到链内的数据，而不能获取到链外真实世界的数据，区块链与现实世界是割裂的。

而且区块链的数据是确定的，不允许不确定的事情或因素，否则会造成无法达成共识。也就是说智能合约不能进行 I/O（Input/Output，即输入/输出），所以它是无法主动获取外部数据的，只能通过预言机将数据给到智能合约。

同样，区块链想要获取一个随机数也是麻烦事。由于链上数据确定，就没有办法获取到一个良好的随机种子。

这些问题都是靠预言机来解决的。

## 预言机的一般工作流程

![alt text](image.png)
理想中的预言机工作流程是由外部接口将外界数据上传到预言机合约上，然后第三方合约调用预言机合约的接口获取数据，以此实现链上和链下数据的互通。

## SUI 上的天气预言机

项目地址：https://github.com/MystenLabs/apps/blob/main/weather-oracle/sources/weather.move

Sui 天气预言机为全球 1000 多个城市的建设者提供天气数据，并作为一个独特的随机数生成器，适用于需要可信赖的随机结果的游戏和投注应用。
它由基于 Sui 的智能合约和一个从 OpenWeather API 获取天气数据的后端服务组成，任何人都可以将天气数据集成到他们的应用中。由于现实中天气是一个混沌系统不可预测，所以可以用于生成安全的加密密钥、测试假设或模拟复杂系统，提供均匀分布且独立于任何先前输出的随机输出。

### 使用场景

- 随机性：天气数据可以用作各种目的的随机源，比如生成随机数、选择获胜者或创建独特的 NFT。例如，一个随机数生成器可以使用特定位置在特定时间的温度、湿度或风速作为种子。

- 竞猜和游戏：应用可以使用 Sui 天气预言机的数据来实现天气预测、以天气为主题的游戏或基于天气的奖励。例如，一个游戏可以让用户竞猜一个城市的天气，或者一个应用可以根据不同地点的天气为用户提供 NFT。

- 其他用例：保险、旅行、教育或研究的应用可以使用天气数据。例如，应用可以将天气数据纳入计算自然灾害风险、规划旅行行程、教授学生天气模式或协助设置科学实验等方面。

### 预言机结构

与常规预言机相同，包括三个组件：一个外部服务、一个内部服务和一个智能合约
外部服务是 OpenWeather API，提供来自各种来源的当前天气数据。内部服务是天气预言机的后端，每 10 分钟从 OpenWeather API 获取天气数据，并更新每个城市的天气状况。

智能合约是 Sui 天气预言机合约，将天气数据存储在 Sui 区块链上，并允许用户以安全透明的方式访问
本篇文章讨论的重点就是预言机合约

![alt text](image-1.png)

### Sui Weather Oracle 智能合约

该智能合约有四个主要功能：
add_city, remove_city, update 和 mint.

oracle::weather 模块定义了以下内容：

AdminCap 结构体代表预言机所有者的管理员权限。
`struct AdminCap has key, store { id: UID }`

WeatherOracle 结构体代表预言机本身。它有以下字段 id, address, name 和 description 分别代表存储预言机的标识符、所有者地址、名称和描述。

```
struct WeatherOracle has key {
    id: UID,
    address: address,
    name: String,
    description: String,
}
```

CityWeatherOracle 结构体代表特定城市的天气数据。它有以下字段 id, geoname_id, name, country, latitude, positive_latitude, longitude, positive_longitude, weather_id, temp, pressure, humidity, visibility, wind_speed, wind_deg, wind_gust, clouds 和 dt ，分别存储城市的唯一 ID、地理位置名称 ID、名称、 国家、纬度、正纬度、经度、正经度、天气 ID、温度、压力、湿度、能见度、风速、风向、阵风、云量、时间戳。

```
struct CityWeatherOracle has key, store {
    id: UID,
    geoname_id: u32,
    name: String,
    country: String,
    latitude: u32,
    positive_latitude: bool,
    longitude: u32,
    positive_longitude: bool,
    weather_id: u16,
    temp: u32,
    pressure: u32,
    humidity: u8,
    visibility: u16,
    wind_speed: u16,
    wind_deg: u16,
    wind_gust: Option<u16>,
    clouds: u8,
    dt: u32
}
```

<!-- 一个 init 函数，在部署期间初始化合约，创建 WeatherOracle 的新实例并公开共享它，同时创建 AdminCap 的新实例并将其转移到发送者。

```
fun init(otw: WEATHER, ctx: &mut TxContext) {
    package::claim_and_keep(otw, ctx);

    let cap = AdminCap { id: object::new(ctx) };
    transfer::share_object(WeatherOracle {
        id: object::new(ctx),
        address: tx_context::sender(ctx),
        name: string::utf8(b"SuiMeteo"),
        description: string::utf8(b"A weather oracle for posting weather updates (temperature, pressure, humidity, visibility, wind metrics and cloud state) for major cities around the world. Currently the data is fetched from https://openweathermap.org. SuiMeteo provides the best available information, but it does not guarantee its accuracy, completeness, reliability, suitability, or availability. Use it at your own risk and discretion."),
    });
    transfer::public_transfer(cap, tx_context::sender(ctx));
}
```

add_city 公共函数，允许 AdminCap 的所有者通过提供 geoname_ID, name, country, latitude 和 longitude 向预言机服务添加新的城市。该函数创建一个带有默认天气数据的 CityWeatherOracle 新实例，并将其作为动态字段添加到预言机中，使用 geoname_ID 作为 key。

```
public fun add_city(
  _: &AdminCap,
  oracle: &mut WeatherOracle,
  geoname_id: u32,
  name: String,
  country: String,
  latitude: u32,
  positive_latitude: bool,
  longitude: u32,
  positive_longitude: bool,
  ctx: &mut TxContext
) {
  dof::add(&mut oracle.id, geoname_id,
      CityWeatherOracle {
          id: object::new(ctx),
          geoname_id,
          name,
          country,
          latitude,
          positive_latitude,
          longitude,
          positive_longitude,
          weather_id: 0,
          temp: 0,
          pressure: 0,
          humidity: 0,
          visibility: 0,
          wind_speed: 0,
          wind_deg: 0,
          wind_gust: option::none(),
          clouds: 0,
          dt: 0
      }
  );
}
``` -->

### 集成 Sui 天气预言机

在 Move 项目中使用 Sui 天气预言机需要将其作为依赖项添加到项目的 Move.toml 文件中：

```
[package]
name = "..."version = "..."

[dependencies]
Sui = { git = "<https://github.com/MystenLabs/sui.git>", subdir = "crates/sui-framework/packages/sui-framework", rev = "..." }
oracle = { git = "<https://github.com/MystenLabs/apps>", subdir = "weather-oracle", rev = "db04fbd17d6ba91ade45c32f609b949fb47d209b" }

[addresses]
...
oracle = "0x8378b3bd39931aa74a6aa3a820304c1109d327426e4275183ed0b797eb6660a8"
```

创建这个依赖项使得开发者可以在 Move 代码中导入 oracle::weather 模块，并利用天气预言机及其函数。Sui 天气预言机为全球不同城市提供实时天气数据，如温度、湿度和风速。 city_weather_oracle_temp 函数检索该城市以开尔文为单位乘以 1,000 的温度，通过给定的 geoname_ID.

例如，以下代码获取法国巴黎（2988507）当前的温度：

```
use oracle::weather::{WeatherOracle};

fun get_temp(weather_oracle: &WeatherOracle): u32 {
    let geoname_id = 2988507; // Paris, France
    oracle::weather::city_weather_oracle_temp(weather_oracle, geoname_id)
}
```

实际项目中的使用可以参考这个项目：https://github.com/movefuns/sui-red-packet/blob/main/contract/sources/red_packet.move#L187
