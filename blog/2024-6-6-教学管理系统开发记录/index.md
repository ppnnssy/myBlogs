---
slug: 教学管理系统开发记录
title: 教学管理系统开发记录
authors: [ppnnssy]
tags: [Vue3, TS, echarts]
---

## 吐槽在先
正开发saas教学管理系统呢，活都分配好了，框架写好了，产品经理没了，笑死
产品线的头头早晚把整个公司搞黄喽
saas暂停，先去干教学管理系统的活，主要是几个图标，正好熟悉一下echarts

## 项目说明
需要达成的效果：

![alt text](image.png)

明显是要封装一个圆环图组件的。原项目中有封装，但是是一个完整功能的圆环图，用起来比较麻烦。这个需求只需要传一个值就够了，所以单独封装个简单的

## 参考
官方示例：https://echarts.apache.org/examples/zh/editor.html?c=pie-doughnut&lang=ts
官方文档：https://echarts.apache.org/zh/option.html#title
大佬的花样绘图：http://chart.majh.ltd/

## 开发过程
封装的组件代码：
```
<template>
  <div id="PieChart" class="echarts"></div>
</template>

<script setup lang="ts">
import { ECharts, EChartsOption, init } from "echarts";
import { onMounted, defineProps } from "vue";
const props = defineProps(["num", "label"]);
interface InitData {
  num: number;
  label?: string;
}
const initChart = (data: InitData) => {
  let formatter = `{total|${data.num}%}`;
  if (data.label) {
    formatter = formatter + "\n\r" + `{active|${data.label}}`;
  }
  const charEle = document.getElementById("PieChart")!;
  const charEch: ECharts = init(charEle);
  const colors = ["#3652FF", "#E8E8E8"];
  const option: EChartsOption = {
    color: colors,
    series: [
      {
        name: "达成情况",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        label: {
          normal: {
            show: true,
            position: "center",
            color: "#4c4a4a",
            formatter,
            rich: {
              total: {
                fontSize: 30,
                fontFamily: "微软雅黑",
                color: "#3652FF",
              },
              active: {
                fontFamily: "微软雅黑",
                fontSize: 16,
                color: "#6c7a89",
                lineHeight: 30,
              },
            },
          },
        },
        // emphasis: {
        //   label: {
        //     show: true,
        //     fontSize: 40,
        //     fontWeight: "bold",
        //   },
        // },
        labelLine: {
          show: false,
        },
        data: [
          { value: props.num, name: "达成度" },
          { value: 100 - props.num, name: "未达成" },
        ],
      },
    ],
  };

  charEch.setOption(option);
};

onMounted(() => {
  initChart({ num: props.num, label: props.label });
});
</script>

<style lang="scss" scoped>
.echarts {
  width: 100%;
  height: 100%;
  margin: 0 auto;
}
</style>
```

代码说明：
重点是配置项中的label项，因为圆环里面的两行字体不同
![alt text](image-1.png)
所以每一行要单独配置
其他的都是常规配置，不多说

使用组件：

`<Pie :num="30" label="达成度" />`

## 其他解决方案
也可以使用title属性，参考
http://chart.majh.ltd/xJzYGTWCSr

## 一个坑
使用el-tab分成三页
![alt text](image-2.png)

第一页是正常的，切换到第二页时就不对了
![alt text](image-3.png)
容器大小丢失了。
原因是标签页下的内容在初始化这个标签组件时就已经被渲染完成了，当你点击标签，图表就会变成默认的宽高

解决方法：给选项卡加上 :lazy="true" ，延迟渲染就行了
此方法仅适用于 echarts 图表是以子组件的方式引入的情况，如果你的图表是直接在标签组件里写的并且渲染的，是无法生效的；而且会报错
因为延迟加载的时候没有父容器
## 总结
查文档找不到对应的配置项，文档东西太多了还没认真看，还是得靠网友的笔记啊